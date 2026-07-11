from typing import List, Any, Optional
from fastapi import APIRouter, HTTPException, Body
from backend.models.forecast_models import (
    ForecastRequest,
    ForecastResponse,
    ForecastSaveRequest,
    ForecastListResponse,
    SpotCalculationRequest,
    SpotSaveRequest,
    MultiCotizadorRequest,
    ClientMaster,
    ContractMaster,
    PortUpdate,
    PortReorderItem,
    TerminalUpdate,
    SourceSinkUpdateItem
)
from backend.services.forecast_service import run_forecast_simulation, run_forecast_simulation_universal

router = APIRouter(tags=["Commercial Forecast"])

@router.post("/run", response_model=ForecastResponse)
def simulate_forecast(request: ForecastRequest):
    try:
        result = run_forecast_simulation(request)
        return ForecastResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run_universal", response_model=ForecastResponse)
def simulate_forecast_universal(request: ForecastRequest):
    try:
        result = run_forecast_simulation_universal(request)
        return ForecastResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save")
def save_forecast(request: ForecastSaveRequest):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        
        payload = {
            "name": request.name,
            "user_id": request.user_id,
            "start_date": request.start_date,
            "end_date": request.end_date,
            "projection_lines": request.projection_lines
        }
        
        if request.id:
            # Update existing
            res = sb.table("commercial_forecasts").update(payload).eq("id", request.id).execute()
            if not res.data:
                raise Exception("Failed to update forecast.")
            return {"status": "success", "id": res.data[0]["id"]}
        else:
            # Insert new
            res = sb.table("commercial_forecasts").insert(payload).execute()
            if not res.data:
                raise Exception("Failed to save forecast.")
            return {"status": "success", "id": res.data[0]["id"]}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list", response_model=list[ForecastListResponse])
def list_forecasts():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        
        res = sb.table("commercial_forecasts").select("id, name, user_id, start_date, end_date, created_at, updated_at").order("updated_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/load/{forecast_id}")
def load_forecast(forecast_id: str):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        
        res = sb.table("commercial_forecasts").select("*").eq("id", forecast_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Forecast not found")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/benchmarks")
def get_audit_benchmarks():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        
        res = sb.table("audit_benchmarks").select("*").execute()
        # Convert list of dicts to a dictionary keyed by scenario_key for easier lookup in frontend
        benchmarks_map = {row["scenario_key"]: row for row in res.data}
        return benchmarks_map
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/clients")
def get_clients():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        
        res = sb.table("contracts").select("client_id").execute()
        # Extract distinct clients
        clients = list(set([row["client_id"] for row in res.data]))
        # Sort alphabetically
        clients.sort()
        return clients
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from backend.models.forecast_models import SpotCalculationRequest, SpotSaveRequest

@router.post("/spot/calculate")
def calculate_spot_voyage(request: SpotCalculationRequest):
    try:
        from backend.database import get_supabase
        from backend.spot_engine import calculate_spot_multileg
        sb = get_supabase()
        
        # 1. Fetch Vessel
        v_res = sb.table("vessels").select("*").eq("vessel_id", request.vessel_id).execute()
        if not v_res.data:
            raise Exception(f"Vessel {request.vessel_id} not found")
        vessel_params = v_res.data[0]
        # 2. Fetch Agency Matrix to inject Port Costs
        agency_res = sb.table("port_cost_static").select("*").execute()
        agency_data = agency_res.data
        
        def get_agency_cost(target_port, target_op, vessel):
            # 1. 'DEFAULT' + port_id + operation_type + 'DEFAULT'
            for a in agency_data:
                if a.get("client_id") == "DEFAULT" and a.get("port_id") == target_port and a.get("operation_type") == target_op and a.get("vessel_id", "DEFAULT") == "DEFAULT":
                    return float(a.get("cost", 15000))
            return 15000.0

        if request.legs.get("laden"):
            laden_leg = request.legs["laden"]
            orig_port = laden_leg.get("origin_port_id")
            dest_port = laden_leg.get("destination_port_id")
            
            if orig_port:
                laden_leg["agency_costs_origin"] = get_agency_cost(orig_port, 'CARGA', request.vessel_id)
            if dest_port:
                laden_leg["agency_costs_destination"] = get_agency_cost(dest_port, 'DESCARGA', request.vessel_id)

        # 3. Build Payload
        payload = {
            "vessel_params": vessel_params,
            "legs": request.legs
        }
        
        # 3. Calculate
        result = calculate_spot_multileg(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bunker/latest")
def get_latest_bunker_prices():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table("bunker_prices").select("*").execute()
        
        ifo_prices = [float(row["market_price_usd"]) for row in res.data if row["fuel_type"] == "IFO" and row.get("market_price_usd") is not None]
        mdo_prices = [float(row["market_price_usd"]) for row in res.data if row["fuel_type"] == "MDO" and row.get("market_price_usd") is not None]
        
        avg_ifo = sum(ifo_prices) / len(ifo_prices) if ifo_prices else 600.0
        avg_mdo = sum(mdo_prices) / len(mdo_prices) if mdo_prices else 900.0
        
        dates = [row["date"] for row in res.data if row.get("date")]
        latest_date = max(dates) if dates else "N/A"
        
        return {
            "ifo": round(avg_ifo, 2),
            "mdo": round(avg_mdo, 2),
            "date": latest_date
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bunker")
def list_bunker_prices():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table("bunker_prices").select("*").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bunker")
def save_bunker_prices(payload: List[Any] = Body(...)):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table("bunker_prices").upsert(payload, on_conflict="fuel_type,date").execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/bunker/{date_str}")
def delete_bunker_prices(date_str: str):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table("bunker_prices").delete().eq("date", date_str).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from backend.models.forecast_models import MultiCotizadorRequest

@router.post("/multicotizador/calculate")
def calculate_multicotizador(request: MultiCotizadorRequest):
    try:
        from backend.database import get_supabase
        from backend.spot_engine import calculate_multicotizador_simulation
        from backend.services.forecast_service import calculate_detailed_port_costs
        sb = get_supabase()
        
        # 1. Obtener datos del buque
        if request.vessel_id == "SIN_NOMBRE" or request.vessel_id == "CUSTOM_VESSEL":
            vessel_params = {
                "vessel_id": request.vessel_id,
                "vessel_name": "Buque Personalizado",
                "grt": 0.0,
                "dwt": 0.0,
                "dwcc": 0.0,
                "vessel_speed": 11.0,
                "tce_required": 0.0,
                "length": 0.0,
                "beam": 0.0,
                "consumption_sea_ifo": 0.0,
                "consumption_idle_ifo": 0.0,
                "consumption_load_ifo": 0.0,
                "consumption_disch_ifo": 0.0,
                "consumption_sea_mdo": 0.0,
                "consumption_idle_mdo": 0.0,
                "consumption_load_mdo": 0.0,
                "consumption_disch_mdo": 0.0
            }
        else:
            v_res = sb.table("vessels").select("*").eq("vessel_id", request.vessel_id).execute()
            if not v_res.data:
                raise HTTPException(status_code=404, detail=f"Vessel {request.vessel_id} not found")
            vessel_params = v_res.data[0]
        
        # Inyectar precios de bunker e incorporar overrides de particularidades y consumos del request
        if request.bunker_price_ifo is not None:
            vessel_params["bunker_price_ifo"] = request.bunker_price_ifo
        if request.bunker_price_mdo is not None:
            vessel_params["bunker_price_mdo"] = request.bunker_price_mdo
        if request.vessel_speed is not None and request.vessel_speed > 0:
            vessel_params["vessel_speed"] = request.vessel_speed
            
        vessel_override_fields = [
            "grt", "dwt", "dwcc", "length", "beam", "tce_required",
            "consumption_sea_ifo", "consumption_idle_ifo", "consumption_load_ifo", "consumption_disch_ifo",
            "consumption_sea_mdo", "consumption_idle_mdo", "consumption_load_mdo", "consumption_disch_mdo"
        ]
        for field in vessel_override_fields:
            val = getattr(request, field, None)
            if val is not None:
                vessel_params[field] = val
            
        # 2. Obtener datos para costos portuarios (para los fallbacks)
        pc_res = sb.table("port_costs_matrix").select("*").execute()
        port_costs_data = pc_res.data
        ag_res = sb.table("port_cost_static").select("*").execute()
        agency_matrix_data = ag_res.data
        
        # 3. Obtener rutas para autocompletar distancia y weather factor
        routes_res = sb.table("routes").select("*").execute()
        routes_db = routes_res.data
        
        # 4. Obtener puertos para overheads
        ports_res = sb.table("ports").select("*").execute()
        ports_db = {p["port_id"]: p for p in ports_res.data}
        
        # 5. Obtener contratos para overheads y maneuvers
        contracts_res = sb.table("contracts").select("*").execute()
        contracts_db = contracts_res.data
        
        # Procesar tramos
        tramos_payload = []
        for tr in request.tramos:
            tr_dict = tr.dict()
            
            # Autocompletar distancia y weather_factor si no vienen o son 0
            if tr_dict.get("route_distance", 0) <= 0 or tr_dict.get("weather_factor", 0) <= 0:
                matched_route = None
                port1, port2 = sorted([tr.origin_port_id, tr.destination_port_id])
                for r in routes_db:
                    if r.get("port_a") == port1 and r.get("port_b") == port2:
                        matched_route = r
                        break
                if matched_route:
                    if tr_dict.get("route_distance", 0) <= 0:
                        tr_dict["route_distance"] = float(matched_route.get("route_distance", 0))
                    if tr_dict.get("weather_factor", 0) <= 0:
                        wf_key = "weather_factor_laden" if tr.type.upper() == "LADEN" else "weather_factor_ballast"
                        tr_dict["weather_factor"] = float(matched_route.get(wf_key, matched_route.get("weather_factor", 0.05)))
                else:
                    if tr_dict.get("route_distance", 0) <= 0:
                        tr_dict["route_distance"] = 100.0
                    if tr_dict.get("weather_factor", 0) <= 0:
                        tr_dict["weather_factor"] = 0.05
                        
            # Autocompletar limites y otros usando ports
            orig_port_info = ports_db.get(tr.origin_port_id, {})
            dest_port_info = ports_db.get(tr.destination_port_id, {})
            
            # Buscar contrato para overheads y posicionamientos
            contract = next((c for c in contracts_db if c.get("origin_port_id") == tr.origin_port_id and c.get("destination_port_id") == tr.destination_port_id and c.get("is_active") is True), None)
            
            tr_dict["port_overhead_hours_origin"] = tr.port_overhead_hours_origin if tr.port_overhead_hours_origin is not None else float(contract.get("time_to_count_carga_hrs") if contract and contract.get("time_to_count_carga_hrs") is not None else 6.0)
            tr_dict["port_overhead_hours_dest"] = tr.port_overhead_hours_dest if tr.port_overhead_hours_dest is not None else float(contract.get("time_to_count_descarga_hrs") if contract and contract.get("time_to_count_descarga_hrs") is not None else 6.0)
            tr_dict["positioning_carga_hrs"] = tr.positioning_carga_hrs if tr.positioning_carga_hrs is not None else float(contract.get("maneuver_carga_hrs") if contract and contract.get("maneuver_carga_hrs") is not None else 0.0)
            tr_dict["positioning_descarga_hrs"] = tr.positioning_descarga_hrs if tr.positioning_descarga_hrs is not None else float(contract.get("maneuver_descarga_hrs") if contract and contract.get("maneuver_descarga_hrs") is not None else 0.0)
            
            # Inyectar tasas acordadas del contrato (si existen)
            tr_dict["contract_agreed_load_rate"] = float(contract.get("load_rate") if contract and contract.get("load_rate") is not None else 0.0)
            tr_dict["contract_agreed_discharge_rate"] = float(contract.get("discharge_rate") if contract and contract.get("discharge_rate") is not None else 0.0)

            # Autocompletar limites físicos para Laden
            if tr.type.upper() == "LADEN":
                tr_dict["max_terminal_load_rate"] = float(orig_port_info.get("max_load_rate", 0))
                tr_dict["port_max_discharge_limit"] = float(dest_port_info.get("max_disch_rate", 0))
            
            # Costos portuarios
            client_id = 'SPCC'
            
            # Costo origen según acción del origen
            if tr.origin_action == 'NONE':
                tr_dict["agency_costs_origin"] = 0.0
                tr_dict["agency_costs_origin_details"] = {"total_cost": 0.0, "breakdown": {}, "method": "NONE"}
            else:
                o_type = 'CARGA' if tr.origin_action == 'CARGAR' else 'DESCARGA'
                orig_cost_res = calculate_detailed_port_costs(
                    client_id, tr.origin_port_id, o_type, request.vessel_id, port_costs_data, agency_matrix_data, request.port_cost_mode
                )
                if tr.agency_costs_origin > 0.0:
                    db_total = orig_cost_res.get("total_cost", 0.0)
                    db_breakdown = orig_cost_res.get("breakdown", {})
                    diff = tr.agency_costs_origin - db_total
                    
                    adjusted_breakdown = db_breakdown.copy()
                    main_key = None
                    if "MAIN" in adjusted_breakdown:
                        main_key = "MAIN"
                    elif "agency_fee" in adjusted_breakdown:
                        main_key = "agency_fee"
                    elif adjusted_breakdown:
                        main_key = list(adjusted_breakdown.keys())[0]
                        
                    if main_key:
                        adjusted_breakdown[main_key] = round(adjusted_breakdown[main_key] + diff, 2)
                    else:
                        adjusted_breakdown["manual_override"] = tr.agency_costs_origin
                        
                    tr_dict["agency_costs_origin"] = tr.agency_costs_origin
                    tr_dict["agency_costs_origin_details"] = {
                        "total_cost": tr.agency_costs_origin,
                        "breakdown": adjusted_breakdown,
                        "method": "MANUAL"
                    }
                else:
                    tr_dict["agency_costs_origin"] = orig_cost_res["total_cost"]
                    tr_dict["agency_costs_origin_details"] = orig_cost_res

            # Costo destino según acción del destino
            if tr.destination_action == 'NONE':
                tr_dict["agency_costs_destination"] = 0.0
                tr_dict["agency_costs_destination_details"] = {"total_cost": 0.0, "breakdown": {}, "method": "NONE"}
            else:
                d_type = 'CARGA' if tr.destination_action == 'CARGAR' else 'DESCARGA'
                dest_cost_res = calculate_detailed_port_costs(
                    client_id, tr.destination_port_id, d_type, request.vessel_id, port_costs_data, agency_matrix_data, request.port_cost_mode
                )
                if tr.agency_costs_destination > 0.0:
                    db_total = dest_cost_res.get("total_cost", 0.0)
                    db_breakdown = dest_cost_res.get("breakdown", {})
                    diff = tr.agency_costs_destination - db_total
                    
                    adjusted_breakdown = db_breakdown.copy()
                    main_key = None
                    if "MAIN" in adjusted_breakdown:
                        main_key = "MAIN"
                    elif "agency_fee" in adjusted_breakdown:
                        main_key = "agency_fee"
                    elif adjusted_breakdown:
                        main_key = list(adjusted_breakdown.keys())[0]
                        
                    if main_key:
                        adjusted_breakdown[main_key] = round(adjusted_breakdown[main_key] + diff, 2)
                    else:
                        adjusted_breakdown["manual_override"] = tr.agency_costs_destination
                        
                    tr_dict["agency_costs_destination"] = tr.agency_costs_destination
                    tr_dict["agency_costs_destination_details"] = {
                        "total_cost": tr.agency_costs_destination,
                        "breakdown": adjusted_breakdown,
                        "method": "MANUAL"
                    }
                else:
                    tr_dict["agency_costs_destination"] = dest_cost_res["total_cost"]
                    tr_dict["agency_costs_destination_details"] = dest_cost_res
            
            tramos_payload.append(tr_dict)
            
        payload = {
            "vessel_params": vessel_params,
            "tramos": tramos_payload
        }
        
        result = calculate_multicotizador_simulation(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/port-cost/lookup")
def lookup_port_cost(
    vessel_id: str,
    port_id: str,
    operation: str,
    client_id: str = "SPCC",
    port_cost_mode: str = "static"
):
    try:
        from backend.database import get_supabase
        from backend.services.forecast_service import calculate_detailed_port_costs
        sb = get_supabase()
        
        pc_res = sb.table("port_costs_matrix").select("*").execute()
        port_costs_data = pc_res.data
        ag_res = sb.table("port_cost_static").select("*").execute()
        agency_matrix_data = ag_res.data
        
        o_type = 'CARGA' if operation.upper() == 'CARGAR' else 'DESCARGA'
        cost_res = calculate_detailed_port_costs(
            client_id, port_id, o_type, vessel_id, port_costs_data, agency_matrix_data, port_cost_mode
        )
        return cost_res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/spot/save")
def save_spot_voyage(request: SpotSaveRequest):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        
        payload = {
            "name": request.name,
            "description": request.description,
            "legs_data": request.legs_data,
            "pais": request.pais
        }
        
        res = sb.table("routes_master").insert(payload).execute()
        if not res.data:
            raise Exception("Failed to save spot route")
        return {"status": "success", "spot_id": res.data[0]["route_id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vessels")
def get_vessels():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table("vessels").select("*").order("display_order").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ports")
def get_ports(year: int = 2026):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table("ports").select("*, sources_sinks(capacity_mt, type, empresa, color_hex, producto)").eq("sources_sinks.year", year).order("display_order").execute()
        
        flat_data = []
        for p in res.data:
            ss_list = p.get("sources_sinks", [])
            
            total_capacity = sum(ss["capacity_mt"] for ss in ss_list if ss and ss.get("capacity_mt") is not None) if ss_list else None
            
            types = set(ss["type"] for ss in ss_list if ss and ss.get("type"))
            primary_type = "MIXED" if len(types) > 1 else (types.pop() if len(types) == 1 else None)
            
            p["capacity_mt"] = total_capacity
            p["type"] = primary_type
            
            # Do NOT pop sources_sinks, keep the list of companies
            flat_data.append(p)
            
        return flat_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/routes")
def get_routes():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table("routes").select("*").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel
from typing import Optional, List

class RouteUpdate(BaseModel):
    port_a: str
    port_b: str
    route_distance: float
    weather_factor_laden: float
    weather_factor_ballast: float
    color_hex: Optional[str] = "#06B6D4"
    pais: Optional[str] = "Peru"

@router.post("/routes")
def save_routes(payload: List[RouteUpdate]):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        
        data_to_upsert = []
        for r in payload:
            p1, p2 = sorted([r.port_a, r.port_b])
            data_to_upsert.append({
                "port_a": p1,
                "port_b": p2,
                "route_distance": r.route_distance,
                "weather_factor_laden": r.weather_factor_laden,
                "weather_factor_ballast": r.weather_factor_ballast,
                "color_hex": r.color_hex,
                "pais": r.pais
            })
            
        # Extract unique ports
        unique_ports = set()
        for d in data_to_upsert:
            unique_ports.add(d["port_a"])
            unique_ports.add(d["port_b"])
            
        # Ensure all ports exist
        existing_ports_res = sb.table("ports").select("port_id").in_("port_id", list(unique_ports)).execute()
        existing_port_ids = {p["port_id"] for p in existing_ports_res.data}
        missing_ports = unique_ports - existing_port_ids
        
        if missing_ports:
            ports_to_insert = [{"port_id": p, "name": p} for p in missing_ports]
            sb.table("ports").insert(ports_to_insert).execute()
            
        res = sb.table("routes").upsert(data_to_upsert).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/spot/list")
def list_spot_voyages():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table("routes_master").select("*, spot_id:route_id").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vessels")
def save_vessel(request: dict):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        # Supabase upsert requires the primary key (vessel_id)
        if "vessel_id" not in request:
            raise HTTPException(status_code=400, detail="vessel_id is required")
        
        # Ensure correct types for numeric fields to avoid DB errors
        numeric_fields = ["grt", "dwt", "dwcc", "vessel_speed", "tce_required", 
                         "length", "beam", "vessel_max_load_intake_limit", "vessel_pump_discharge_rate",
                         "max_capacity_ifo", "consumption_sea_ifo", "consumption_port_ifo", "consumption_idle_ifo", "consumption_load_ifo", "consumption_disch_ifo",
                         "max_capacity_mdo", "consumption_sea_mdo", "consumption_port_mdo", "consumption_idle_mdo", "consumption_load_mdo", "consumption_disch_mdo"]
        
        for field in numeric_fields:
            if field in request and request[field] is not None:
                try:
                    request[field] = float(request[field])
                except ValueError:
                    request[field] = 0.0

        res = sb.table("vessels").upsert(request).execute()
        
        if not res.data:
            # Upsert in supabase returns data if successful by default for python client, but sometimes we just check it doesn't throw.
            pass
            
        return {"status": "success", "vessel_id": request["vessel_id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel
from typing import List

class VesselReorderItem(BaseModel):
    vessel_id: str
    display_order: int

@router.post("/vessels/reorder")
def reorder_vessels(items: List[VesselReorderItem]):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        payload = [{"vessel_id": item.vessel_id, "display_order": item.display_order} for item in items]
        sb.table("vessels").upsert(payload).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from backend.models.forecast_models import ClientMaster

@router.get("/masters/clients")
def get_clients_master():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table("clients").select("*").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/masters/clients")
def save_clients_master(payload: List[ClientMaster]):
    try:
        from backend.database import get_db_connection
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            # 1. Obtener existentes
            cur.execute("SELECT client_id FROM clients;")
            existing_ids = [r[0] for r in cur.fetchall()]
            
            new_ids = [c.client_id for c in payload]
            
            # 2. Eliminar los que ya no están
            for eid in existing_ids:
                if eid not in new_ids:
                    cur.execute("DELETE FROM clients WHERE client_id = %s;", (eid,))
            
            # 3. Upsert de los recibidos
            for c in payload:
                cur.execute("""
                    INSERT INTO clients (client_id, client_name, color_hex, is_active, is_prospect)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (client_id) 
                    DO UPDATE SET 
                        client_name = EXCLUDED.client_name,
                        color_hex = EXCLUDED.color_hex,
                        is_active = EXCLUDED.is_active,
                        is_prospect = EXCLUDED.is_prospect;
                """, (c.client_id, c.client_name, c.color_hex, c.is_active, c.is_prospect))
                
            conn.commit()
        except Exception as db_err:
            conn.rollback()
            raise db_err
        finally:
            cur.close()
            conn.close()
            
        return {"status": "success"}
    except Exception as e:
        import traceback
        try:
            with open("/opt/geeksoft_engine/error_log.txt", "w") as f:
                f.write(traceback.format_exc())
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))

from backend.models.forecast_models import ContractMaster, ContractTariffMaster

@router.get("/masters/contracts")
def get_contracts_master():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        
        c_res = sb.table("contracts").select("*").execute()
        t_res = sb.table("contract_tariffs").select("*").execute()
        
        contracts = c_res.data
        tariffs = t_res.data
        
        # Combine tariffs into contracts
        for c in contracts:
            c["tariffs"] = [
                t for t in tariffs 
                if t["contract_id"] == c["contract_id"] 
                and t["origin_port_id"] == c["origin_port_id"] 
                and t["destination_port_id"] == c["destination_port_id"]
            ]
            
        return contracts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/masters/contracts")
def save_contracts_master(payload: List[ContractMaster]):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        
        # Separate contracts and tariffs
        contracts_data = []
        tariffs_data = []
        
        new_ids = []
        for c in payload:
            c_dict = c.dict(exclude={"tariffs"})
            contracts_data.append(c_dict)
            new_ids.append(c.contract_id)
            for t in c.tariffs:
                t_dict = t.dict()
                t_dict["contract_id"] = c.contract_id
                t_dict["origin_port_id"] = c.origin_port_id
                t_dict["destination_port_id"] = c.destination_port_id
                tariffs_data.append(t_dict)
                
        # Get existing contracts
        existing = sb.table("contracts").select("contract_id").execute()
        existing_ids = [r["contract_id"] for r in existing.data]
        
        # Delete contracts that are no longer in payload
        for eid in existing_ids:
            if eid not in new_ids:
                # Due to foreign keys or cascade, tariffs might be deleted. To be safe:
                sb.table("contract_tariffs").delete().eq("contract_id", eid).execute()
                sb.table("contracts").delete().eq("contract_id", eid).execute()
                
        # Upsert contracts
        if contracts_data:
            sb.table("contracts").upsert(contracts_data).execute()
            
        # For active contracts, replace all tariffs (delete all then insert)
        for cid in new_ids:
            sb.table("contract_tariffs").delete().eq("contract_id", cid).execute()
            
        if tariffs_data:
            sb.table("contract_tariffs").insert(tariffs_data).execute()
            
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from backend.models.forecast_models import PortUpdate, PortReorderItem

@router.post('/ports')
def save_ports(payload: PortUpdate):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        data = payload.dict()
        sb.table('ports').upsert(data).execute()
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/ports')
def delete_port(port_id: str):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        sb.table('ports').delete().eq('port_id', port_id).execute()
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/ports/reorder')
def reorder_ports(items: List[PortReorderItem]):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        payload = [{'port_id': item.port_id, 'display_order': item.display_order} for item in items]
        sb.table('ports').upsert(payload).execute()
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/terminals')
def get_terminals(port_id: Optional[str] = None):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        query = sb.table('terminals').select("*").order("created_at")
        if port_id:
            query = query.eq('port_id', port_id)
        res = query.execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/terminals')
def save_terminals(payload: TerminalUpdate):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        data = payload.dict()
        sb.table('terminals').upsert(data).execute()
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/terminals')
def delete_terminal(terminal_id: str, port_id: str):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        sb.table('terminals').delete().eq('terminal_id', terminal_id).eq('port_id', port_id).execute()
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from backend.models.forecast_models import PortCostStaticUpdateItem

@router.get('/port_costs_static')
def get_port_costs_static():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table('port_cost_static').select('*').execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/port_costs_static')
def save_port_costs_static(items: List[PortCostStaticUpdateItem]):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        from datetime import datetime
        now_str = datetime.utcnow().isoformat()
        payload = []
        for item in items:
            payload.append({
                'client_id': item.client_id,
                'port_id': item.port_id,
                'operation_type': item.operation_type,
                'vessel_id': item.vessel_id,
                'cost': item.cost,
                'sub_operation_type': item.sub_operation_type or 'MAIN',
                'updated_at': now_str,
                'updated_by': item.updated_by
            })
        sb.table('port_cost_static').upsert(payload).execute()
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from backend.models.forecast_models import SourceSinkUpdateItem

@router.get('/sources_sinks')
def get_sources_sinks():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table('sources_sinks').select('*').execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/sources_sinks')
def save_sources_sinks(items: List[SourceSinkUpdateItem]):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        payload = []
        for item in items:
            payload.append({
                'port_id': item.port_id,
                'year': item.year,
                'capacity_mt': item.capacity_mt,
                'type': item.type,
                'empresa': item.empresa,
                'color_hex': item.color_hex,
                'producto': item.producto
            })
        sb.table('sources_sinks').upsert(payload).execute()
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DeleteSourceSinkRequest(BaseModel):
    port_id: str
    year: int
    empresa: str
    producto: str

@router.post('/sources_sinks/delete')
def delete_source_sink(req: DeleteSourceSinkRequest):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        sb.table('sources_sinks').delete().match({
            'port_id': req.port_id,
            'year': req.year,
            'empresa': req.empresa,
            'producto': req.producto
        }).execute()
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class RouteEstimateItem(BaseModel):
    origin: str
    destination: str
    lat_a: float
    lon_a: float
    lat_b: float
    lon_b: float

class BatchRouteEstimateRequest(BaseModel):
    routes: List[RouteEstimateItem]

@router.post("/routes/estimate-distances")
def estimate_routes_distances(req: BatchRouteEstimateRequest):
    try:
        import searoute as sr
        results = []
        for r in req.routes:
            try:
                # searoute expects [longitude, latitude]
                origin_coords = [r.lon_a, r.lat_a]
                dest_coords = [r.lon_b, r.lat_b]
                route_geojson = sr.searoute(origin_coords, dest_coords)
                raw_dist = float(route_geojson.properties.get("length", 0.0))
                units = route_geojson.properties.get("units", "km")
                
                # Convert to Nautical Miles (NM)
                if units == "km":
                    distance_nm = raw_dist / 1.852
                elif units == "m":
                    distance_nm = (raw_dist / 1000.0) / 1.852
                else:
                    distance_nm = raw_dist
                
                distance_nm = round(distance_nm, 2)
            except Exception as inner_e:
                distance_nm = 0.0
                
            results.append({
                "origin": r.origin,
                "destination": r.destination,
                "distance": distance_nm
            })
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# ENDPOINTS: port_costs_matrix (Tarifas Dinámicas Desglosadas)
# ──────────────────────────────────────────────────────────────────────────────

class PortCostMatrixUpdateItem(BaseModel):
    client_id: str
    port_id: str
    terminal: str = 'GENERAL'
    operation_type: str
    vessel_id: str
    concept_id: str
    cost: float = 0
    rate_usd: Optional[float] = None
    multiplier_source: str = 'FIXED'
    min_limit: Optional[float] = None
    max_limit: Optional[float] = None
    calculation_formula_template: Optional[str] = None
    origin_country: Optional[str] = None


@router.get('/port_costs_matrix')
def get_port_costs_matrix(port_id: Optional[str] = None, client_id: Optional[str] = None):
    """
    Retorna los coeficientes de tarifas dinámicas desglosadas por puerto.
    Opcional: filtrar por port_id y/o client_id.
    Incluye join con port_cost_concepts para nombre y categoría de cada concepto.
    """
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        query = sb.table('port_costs_matrix').select(
            '*, port_cost_concepts(concept_name, category, default_calculation_type)'
        )
        if port_id:
            query = query.eq('port_id', port_id)
        if client_id:
            query = query.eq('client_id', client_id)
        res = query.order('port_id').order('concept_id').execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/port_costs_matrix')
def save_port_costs_matrix(items: List[PortCostMatrixUpdateItem]):
    """
    Upsert de coeficientes de tarifas dinámicas.
    El frontend MatrixComplexPanel usa este endpoint al presionar Guardar.
    """
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        payload = []
        for item in items:
            payload.append({
                'client_id': item.client_id,
                'port_id': item.port_id,
                'terminal': item.terminal,
                'operation_type': item.operation_type,
                'vessel_id': item.vessel_id,
                'concept_id': item.concept_id,
                'cost': item.cost,
                'rate_usd': item.rate_usd,
                'multiplier_source': item.multiplier_source,
                'min_limit': item.min_limit,
                'max_limit': item.max_limit,
                'calculation_formula_template': item.calculation_formula_template,
                'origin_country': item.origin_country,
            })
        sb.table('port_costs_matrix').upsert(payload).execute()
        return {'status': 'success', 'updated': len(payload)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
