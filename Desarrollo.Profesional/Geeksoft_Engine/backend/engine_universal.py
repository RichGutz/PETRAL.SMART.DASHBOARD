from backend.database import get_supabase
from backend.spot_engine import calculate_multicotizador_simulation
import math

def calculate_voyage_pnl_universal(inputs: dict) -> dict:
    # 1. Extraer variables para comisiones y rastro de auditoría
    Q = float(inputs.get("quantity", 0))
    F = float(inputs.get("freight_rate", 0))
    dist = float(inputs.get("route_distance", 0))
    speed = float(inputs.get("vessel_speed", 11.0))
    w_factor_laden = float(inputs.get("weather_factor_laden", inputs.get("weather_factor", 0.0)))
    w_factor_ballast = float(inputs.get("weather_factor_ballast", inputs.get("weather_factor", 0.0)))
    
    overhead_origin = inputs.get("port_overhead_hours_origin")
    overhead_origin = float(overhead_origin) if overhead_origin is not None else 6.0
    
    overhead_dest = inputs.get("port_overhead_hours_dest")
    overhead_dest = float(overhead_dest) if overhead_dest is not None else 6.0
    
    pos_carga = inputs.get("positioning_carga_hrs")
    pos_carga = float(pos_carga) if pos_carga is not None else 0.0
    
    pos_descarga = inputs.get("positioning_descarga_hrs")
    pos_descarga = float(pos_descarga) if pos_descarga is not None else 0.0
    
    c_load = inputs.get("contract_agreed_load_rate")
    c_disch = inputs.get("contract_agreed_discharge_rate")
    
    ag_orig = float(inputs.get("agency_costs_origin", 0))
    ag_dest = float(inputs.get("agency_costs_destination", 0))
    lm_dest = float(inputs.get("loading_master_dest", 0))
    
    p_ifo = float(inputs.get("bunker_price_ifo", 0))
    p_mdo = float(inputs.get("bunker_price_mdo", 0))
    tce_req = float(inputs.get("tce_required", 0))
    
    addr_comm_pct = float(inputs.get("address_commission", 0.0))
    broker_comm_pct = float(inputs.get("broker_commission", 0.0))
    is_round_trip = inputs.get("is_round_trip", True)

    # 2. Construir payload para el motor multi-tramo (spot_engine)
    vparams = {
        "vessel_speed": speed,
        "tce_required": tce_req,
        "bunker_price_ifo": p_ifo,
        "bunker_price_mdo": p_mdo,
        "consumption_sea_ifo": float(inputs.get("bunker_consumption_sea_ifo", 0)),
        "consumption_idle_ifo": float(inputs.get("bunker_consumption_idle_ifo", 0)),
        "consumption_load_ifo": float(inputs.get("bunker_consumption_load_ifo", 0)),
        "consumption_disch_ifo": float(inputs.get("bunker_consumption_disch_ifo", 0)),
        "consumption_sea_mdo": float(inputs.get("bunker_consumption_sea_mdo", 0)),
        "consumption_idle_mdo": float(inputs.get("bunker_consumption_idle_mdo", 0)),
        "consumption_load_mdo": float(inputs.get("bunker_consumption_load_mdo", 0)),
        "consumption_disch_mdo": float(inputs.get("bunker_consumption_disch_mdo", 0)),
        "vessel_max_load_intake_limit": float(inputs.get("vessel_max_load_intake_limit", 0)),
        "vessel_pump_discharge_rate": float(inputs.get("vessel_pump_discharge_rate", 0))
    }

    tramo_laden = {
        "type": "LADEN",
        "origin_port_id": "ORIGEN",
        "destination_port_id": "DESTINO",
        "route_distance": dist,
        "weather_factor": w_factor_laden,
        "quantity": Q,
        "freight_rate": F,
        "port_overhead_hours_origin": overhead_origin,
        "port_overhead_hours_dest": overhead_dest,
        "positioning_carga_hrs": pos_carga,
        "positioning_descarga_hrs": pos_descarga,
        "custom_load_rate": float(c_load) if c_load else 0.0,
        "custom_discharge_rate": float(c_disch) if c_disch else 0.0,
        "contract_agreed_load_rate": float(c_load) if c_load else 0.0,
        "contract_agreed_discharge_rate": float(c_disch) if c_disch else 0.0,
        "max_terminal_load_rate": float(inputs.get("max_terminal_load_rate", 0)),
        "port_max_discharge_limit": float(inputs.get("port_max_discharge_limit", 0)),
        "agency_costs_origin": ag_orig,
        "agency_costs_destination": ag_dest
    }

    tramos = [tramo_laden]

    if is_round_trip:
        tramo_ballast = {
            "type": "BALLAST",
            "origin_port_id": "DESTINO",
            "destination_port_id": "ORIGEN",
            "route_distance": dist,
            "weather_factor": w_factor_ballast,
            "quantity": 0.0,
            "freight_rate": 0.0,
            "agency_costs_origin": 0.0,
            "agency_costs_destination": 0.0
        }
        tramos.append(tramo_ballast)

    payload = {
        "vessel_params": vparams,
        "tramos": tramos
    }

    # 3. Invocar al motor multi-tramo
    spot_res = calculate_multicotizador_simulation(payload)
    consolidated = spot_res.get("consolidated", {})
    tramos_res = spot_res.get("tramos", [])
    
    # 4. Extraer ritmos reales del tramo cargado
    c_load_val = float(c_load) if c_load else 0.0
    c_disch_val = float(c_disch) if c_disch else 0.0
    actual_load_rate = c_load_val if c_load_val > 0 else 9999.0
    actual_discharge_rate = c_disch_val if c_disch_val > 0 else 9999.0

    # 5. Mapear resultados consolidados
    sea_days = consolidated.get("total_sea_days", 0.0)
    port_days = consolidated.get("total_port_days", 0.0)
    total_duration = consolidated.get("total_days", 0.0)
    
    gross_income = consolidated.get("total_freight_revenue", 0.0)
    total_commissions = gross_income * (addr_comm_pct + broker_comm_pct) / 100.0
    net_income = gross_income - total_commissions
    
    total_port_costs = consolidated.get("total_port_costs", 0.0)
    
    bunker_ifo_tonnage = consolidated.get("bunker_ifo_tonnage", 0.0)
    bunker_mdo_tonnage = consolidated.get("bunker_mdo_tonnage", 0.0)
    total_bunker_costs = consolidated.get("total_bunker_costs", 0.0)
    
    voyage_result = net_income - total_port_costs - total_bunker_costs
    tce_real = voyage_result / total_duration if total_duration > 0 else 0.0
    pcm_projected = tce_real * 30.42
    pl_vs_required = voyage_result - (tce_req * total_duration)

    # 6. Reconstruir Rastro de Auditoría en HTML idéntico al motor básico
    def fmt_tbd(val):
        return f"{val:,.0f}" if val > 0 else "TBD"

    def vc(val): return f"<span class='text-blue-600 font-black'>{val}</span>"      # vessels
    def rc(val): return f"<span class='text-purple-600 font-black'>{val}</span>"    # routes
    def oc(val): return f"<span class='text-orange-600 font-black'>{val}</span>"    # ports
    def ec(val): return f"<span class='text-emerald-600 font-black'>{val}</span>"   # contracts
    def ac(val): return f"<span class='text-amber-600 font-black'>{val}</span>"     # bunker_prices
    def rsc(val): return f"<span class='text-rose-600 font-black'>{val}</span>"     # port_cost_static

    comm_sign = "-" if total_commissions > 0.01 else ""

    audit_trail = {
        "1. Ritmo Carga (act_load)": {
            "formula": "c_load",
            "values": f"{ec(fmt_tbd(c_load_val))}"
        },
        "2. Ritmo Descarga (act_disch)": {
            "formula": "c_disch",
            "values": f"{ec(fmt_tbd(c_disch_val))}"
        },
        "3. Días de Puerto (port_days)": {
            "formula": "((Q/act_load + over_or + pos_or) + (Q/act_disch + over_de + pos_de)) / 24",
            "values": f"(({ec(f'{Q:,.0f}')}/{vc(f'{actual_load_rate:,.0f}')} + {oc(f'{overhead_origin:,.1f}')} + {oc(f'{pos_carga:,.1f}')}) + ({ec(f'{Q:,.0f}')}/{vc(f'{actual_discharge_rate:,.0f}')} + {oc(f'{overhead_dest:,.1f}')} + {oc(f'{pos_descarga:,.1f}')})) / 24"
        },
        "4. Días de Mar (sea_days)": {
            "formula": "(dist * (1+w_laden) + dist * (1+w_ballast)) / (speed * 24)" if is_round_trip else "(dist * (1+w_laden)) / (speed * 24)",
            "values": f"({rc(f'{dist:,.0f}')} * (1+{rc(f'{w_factor_laden:,.2f}')}) + {rc(f'{dist:,.0f}')} * (1+{rc(f'{w_factor_ballast:,.2f}')})) / ({vc(f'{speed:,.1f}')} * 24)" if is_round_trip else f"({rc(f'{dist:,.0f}')} * (1+{rc(f'{w_factor_laden:,.2f}')})) / ({vc(f'{speed:,.1f}')} * 24)"
        },
        "5. Días de Viaje (tot_dur)": {
            "formula": "sea_days + port_days",
            "values": f"{vc(f'{sea_days:,.4f}')} + {oc(f'{port_days:,.4f}')} = {vc(f'{total_duration:,.4f}')} días"
        },
        "6. Income (income)": {
            "formula": "Q * F",
            "values": f"{ec(f'{Q:,.0f}')} * {ec(f'{F:,.2f}')} = {ec(f'{gross_income:,.2f}')} USD"
        },
        "7. Comisiones (commissions)": {
            "formula": "gross_income * (addr_comm% + broker_comm%) / 100",
            "values": f"{ec(f'{gross_income:,.2f}')} * ({addr_comm_pct:.1f}% + {broker_comm_pct:.1f}%) = {comm_sign}{rsc(f'{total_commissions:,.2f}')} USD"
        },
        "8. Costo Bunker (bunker)": {
            "formula": "(ifo_tons * p_ifo) + (mdo_tons * p_mdo)",
            "values": f"({vc(f'{bunker_ifo_tonnage:,.2f}')} * {ac(f'{p_ifo:,.2f}')}) + ({vc(f'{bunker_mdo_tonnage:,.2f}')} * {ac(f'{p_mdo:,.2f}')}) = {ac(f'{total_bunker_costs:,.2f}')} USD"
        },
        "9. Port Costs (port_costs)": {
            "formula": "agency_costs_origin + agency_costs_destination + loading_master",
            "values": f"{rsc(f'{ag_orig:,.2f}')} + {rsc(f'{ag_dest - lm_dest:,.2f}')} + {rsc(f'{lm_dest:,.2f}')} = {rsc(f'{total_port_costs:,.2f}')} USD"
        },
        "10. Voyage Result (voy_res)": {
            "formula": "Income - commissions - port_costs - bunker",
            "values": f"{ec(f'{gross_income:,.2f}')} - {rsc(f'{total_commissions:,.2f}')} - {rsc(f'{total_port_costs:,.2f}')} - {ac(f'{total_bunker_costs:,.2f}')} = {ec(f'{voyage_result:,.2f}')} USD"
        },
        "11. TCE Diario (tce_real)": {
            "formula": "voyage_result / total_duration",
            "values": f"{ec(f'{voyage_result:,.2f}')} / {vc(f'{total_duration:,.4f}')} = {vc(f'{tce_real:,.2f}')} USD/día"
        },
        "12. P/L (pl_vs_req)": {
            "formula": "voyage_result - (tce_req * total_duration)",
            "values": f"{ec(f'{voyage_result:,.2f}')} - ({vc(f'{tce_req:,.2f}')} * {vc(f'{total_duration:,.4f}')}) = {ec(f'{pl_vs_required:,.2f}')} USD"
        }
    }

    return {
        "actual_load_rate": actual_load_rate,
        "actual_discharge_rate": actual_discharge_rate,
        "sea_days": round(sea_days, 6),
        "port_days": round(port_days, 6),
        "total_duration": round(total_duration, 6),
        "gross_income": round(gross_income, 2),
        "total_commissions": round(total_commissions, 2),
        "net_income": round(net_income, 2),
        "total_port_costs": round(total_port_costs, 2),
        "bunker_ifo_tonnage": round(bunker_ifo_tonnage, 4),
        "bunker_mdo_tonnage": round(bunker_mdo_tonnage, 4),
        "total_bunker_costs": round(total_bunker_costs, 2),
        "voyage_result": round(voyage_result, 2),
        "tce_real": round(tce_real, 2),
        "pcm_projected": round(pcm_projected, 2),
        "pl_vs_required": round(pl_vs_required, 2),
        "audit_trail": audit_trail
    }

def calculate_baf_adjusted_rate_universal(trip_inputs: dict, contract: dict, actual_bunker_price: float) -> float:
    # Cargar tarifa base y precio base del contrato
    f_base = float(trip_inputs.get("freight_rate", 0))
    p_base_ifo = float(contract.get("bunker_baseline_price_ifo", 0))
    trigger_var = float(contract.get("bunker_trigger_variance", 0.05))
    Q = float(trip_inputs.get("quantity", 0))
    
    if p_base_ifo == 0:
        return f_base

    # Verificar si se dispara la cláusula BAF
    variance = abs(actual_bunker_price - p_base_ifo) / p_base_ifo
    
    if variance < trigger_var:
        return f_base 
        
    # Simular tiempos usando el motor universal
    times_result = calculate_voyage_pnl_universal(trip_inputs)
    sea_days = times_result["sea_days"]
    port_days = times_result["port_days"]
    
    total_bunker_consumption = (sea_days * float(trip_inputs.get("bunker_consumption_sea_ifo", 0))) + \
                               (port_days * float(trip_inputs.get("bunker_consumption_idle_ifo", 0)))
                               
    delta_bunker_cost = total_bunker_consumption * (actual_bunker_price - p_base_ifo)
    freight_increase = delta_bunker_cost / Q if Q > 0 else 0
    baf_adjusted_freight_rate = f_base + freight_increase
    
    return round(baf_adjusted_freight_rate, 2)
