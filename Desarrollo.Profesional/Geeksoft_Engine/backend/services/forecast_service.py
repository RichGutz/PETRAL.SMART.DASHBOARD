from typing import Dict, Any
from backend.models.forecast_models import ForecastRequest
from backend.database import get_supabase
from backend.engine import calculate_voyage_pnl, calculate_baf_adjusted_rate

def safe_fetch(supabase, table_name):
    try:
        return supabase.table(table_name).select("*").execute().data
    except Exception as e:
        print(f"Warning: Could not fetch table {table_name}: {e}")
        return []

def run_forecast_simulation(request: ForecastRequest) -> Dict[str, Any]:
    supabase = get_supabase()
    
    # Pre-cargar maestros para cachear
    vessels_data = safe_fetch(supabase, "vessels")
    vessels_db = {v["vessel_id"]: v for v in vessels_data}
    
    routes_data = safe_fetch(supabase, "routes")
    routes_db = {f"{r['origin_port_id']}-{r['destination_port_id']}": r for r in routes_data}
    
    bunker_data = safe_fetch(supabase, "bunker_prices")
    bunker_db = {b["fuel_type"]: b["market_price_usd"] for b in bunker_data}
    
    contracts_data = safe_fetch(supabase, "contracts")
    agency_data = safe_fetch(supabase, "agency_matrix")
    
    agg_data = {}
    
    for line in request.projection_lines:
        client = line.client_id
        route_key = f"{line.origin_port_id}-{line.destination_port_id}"
        vessel = line.vessel_id
        month = line.month_index
        
        # 1. Fetching Vessel Data
        v_data = vessels_db.get(vessel, {})
        
        # 2. Fetching Route Data
        r_data = routes_db.get(route_key, {})
        
        # 3. Fetching Contract Data
        # Filtramos contrato por cliente y destino (usado para BAF)
        contract = next((c for c in contracts_data if c.get("client_id") == client and c.get("destination_port_id") == line.destination_port_id), None)
        
        # Buscar Tarifa en contract_tariffs según quantity
        freight_rate = 0
        tariffs_data = safe_fetch(supabase, "contract_tariffs")
        
        matching_tariffs = [
            t for t in tariffs_data 
            if t.get("client_id") == client and t.get("destination_port_id") == line.destination_port_id
        ]
        
        if matching_tariffs:
            for tariff in matching_tariffs:
                if tariff.get("min_tonnage", 0) <= line.quantity <= tariff.get("max_tonnage", 999999):
                    freight_rate = tariff.get("freight_rate", 0)
                    break
            
            # Fallback: Si el buque excede el tonelaje maximo del contrato, aplicamos la tarifa del mayor bracket
            if freight_rate == 0:
                highest_bracket = max(matching_tariffs, key=lambda x: x.get("max_tonnage", 0))
                freight_rate = highest_bracket.get("freight_rate", 0)
        
        # Agencia Costs
        ag_orig = next((a.get("cost", 15000) for a in agency_data if (a.get("client_id") == client or a.get("client_id") == "DEFAULT") and a.get("port_id") == line.origin_port_id), 15000)
        ag_dest = next((a.get("cost", 15000) for a in agency_data if (a.get("client_id") == client or a.get("client_id") == "DEFAULT") and a.get("port_id") == line.destination_port_id), 15000)

        p_ifo = line.forecast_bunker_price_ifo if line.forecast_bunker_price_ifo else bunker_db.get("IFO", 450)
        p_mdo = line.forecast_bunker_price_mdo if line.forecast_bunker_price_mdo else bunker_db.get("MDO", 800)

        # Construir Inputs para engine
        inputs = {
            "quantity": line.quantity,
            "freight_rate": freight_rate,
            "route_distance": r_data.get("route_distance", 0),
            "vessel_speed": v_data.get("vessel_speed", 0),
            "weather_factor": r_data.get("weather_factor", 0),
            "port_overhead_hours": 12, # Hardcoded por ahora
            "vessel_max_load_intake_limit": v_data.get("vessel_max_load_intake_limit", 0),
            "max_terminal_load_rate": 9999,
            "vessel_pump_discharge_rate": v_data.get("vessel_pump_discharge_rate", 0),
            "port_max_discharge_limit": 9999,
            "agency_costs_origin": ag_orig,
            "agency_costs_destination": ag_dest,
            "bunker_price_ifo": p_ifo,
            "bunker_price_mdo": p_mdo,
            "tce_required": v_data.get("tce_required", 0),
            "bunker_consumption_sea_ifo": v_data.get("consumption_sea_ifo", 0),
            "bunker_consumption_idle_ifo": v_data.get("consumption_idle_ifo", 0),
            "bunker_consumption_load_ifo": v_data.get("consumption_load_ifo", 0),
            "bunker_consumption_disch_ifo": v_data.get("consumption_disch_ifo", 0),
            "bunker_consumption_sea_mdo": v_data.get("consumption_sea_mdo", 0),
            "bunker_consumption_idle_mdo": v_data.get("consumption_idle_mdo", 0),
            "bunker_consumption_load_mdo": v_data.get("consumption_load_mdo", 0),
            "bunker_consumption_disch_mdo": v_data.get("consumption_disch_mdo", 0),
            "contract_agreed_load_rate": contract.get("load_rate") if contract else None,
            "contract_agreed_discharge_rate": contract.get("discharge_rate") if contract else None,
            "is_round_trip": True
        }
        
        # BAF Logic si es necesario
        if contract and contract.get("bunker_baseline_price_ifo") and line.forecast_bunker_price_ifo:
             inputs["freight_rate"] = calculate_baf_adjusted_rate(inputs, contract, line.forecast_bunker_price_ifo)

        unit_result = calculate_voyage_pnl(inputs)
        
        freq = line.monthly_frequency
        
        # Apply Frequency
        monthly_result = {
            "net_income": unit_result["net_income"] * freq,
            "total_port_costs": unit_result["total_port_costs"] * freq,
            "total_bunker_costs": unit_result["total_bunker_costs"] * freq,
            "voyage_result": unit_result["voyage_result"] * freq,
            "pl_vs_required": unit_result["pl_vs_required"] * freq,
            "tce_real": unit_result["tce_real"],
            "total_duration": unit_result["total_duration"] * freq
        }
        
        if client not in agg_data:
            agg_data[client] = {}
        if route_key not in agg_data[client]:
            agg_data[client][route_key] = {}
        if vessel not in agg_data[client][route_key]:
            agg_data[client][route_key][vessel] = {}
            
        agg_data[client][route_key][vessel][month] = monthly_result
        
    return {
        "status": "success",
        "aggregated_data": agg_data
    }
