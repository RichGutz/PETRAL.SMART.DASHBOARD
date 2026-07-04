from fastapi import APIRouter, HTTPException
from backend.models.forecast_models import ForecastRequest, ForecastResponse, ForecastSaveRequest, ForecastListResponse
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
        
        # Procesar tramos
        tramos_payload = []
        for tr in request.tramos:
            tr_dict = tr.dict()
            
            # Autocompletar distancia y weather_factor si no vienen o son 0
            if tr_dict.get("route_distance", 0) <= 0 or tr_dict.get("weather_factor", 0) <= 0:
                # Buscar ruta directa
                matched_route = None
                for r in routes_db:
                    if r.get("origin_port_id") == tr.origin_port_id and r.get("destination_port_id") == tr.destination_port_id:
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
                        
            # Autocompletar overheads y posicionamientos
            orig_port_info = ports_db.get(tr.origin_port_id, {})
            dest_port_info = ports_db.get(tr.destination_port_id, {})
            
            tr_dict["port_overhead_hours_origin"] = tr.port_overhead_hours_origin if tr.port_overhead_hours_origin is not None else float(orig_port_info.get("time_to_count_carga_hrs", 6.0))
            tr_dict["port_overhead_hours_dest"] = tr.port_overhead_hours_dest if tr.port_overhead_hours_dest is not None else float(dest_port_info.get("time_to_count_descarga_hrs", 6.0))
            tr_dict["positioning_carga_hrs"] = tr.positioning_carga_hrs if tr.positioning_carga_hrs is not None else float(orig_port_info.get("maneuver_carga_hrs", 0.0))
            tr_dict["positioning_descarga_hrs"] = tr.positioning_descarga_hrs if tr.positioning_descarga_hrs is not None else float(dest_port_info.get("maneuver_descarga_hrs", 0.0))
            
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
            elif tr.agency_costs_origin > 0.0:
                # Si el frontend envía un override de costo manual mayor a 0
                tr_dict["agency_costs_origin"] = tr.agency_costs_origin
                tr_dict["agency_costs_origin_details"] = {
                    "total_cost": tr.agency_costs_origin,
                    "breakdown": {"manual_override": tr.agency_costs_origin},
                    "method": "MANUAL"
                }
            else:
                o_type = 'CARGA' if tr.origin_action == 'CARGAR' else 'DESCARGA'
                orig_cost_res = calculate_detailed_port_costs(
                    client_id, tr.origin_port_id, o_type, request.vessel_id, port_costs_data, agency_matrix_data, request.port_cost_mode
                )
                tr_dict["agency_costs_origin"] = orig_cost_res["total_cost"]
                tr_dict["agency_costs_origin_details"] = orig_cost_res

            # Costo destino según acción del destino
            if tr.destination_action == 'NONE':
                tr_dict["agency_costs_destination"] = 0.0
                tr_dict["agency_costs_destination_details"] = {"total_cost": 0.0, "breakdown": {}, "method": "NONE"}
            elif tr.agency_costs_destination > 0.0:
                # Si el frontend envía un override de costo manual mayor a 0
                tr_dict["agency_costs_destination"] = tr.agency_costs_destination
                tr_dict["agency_costs_destination_details"] = {
                    "total_cost": tr.agency_costs_destination,
                    "breakdown": {"manual_override": tr.agency_costs_destination},
                    "method": "MANUAL"
                }
            else:
                d_type = 'CARGA' if tr.destination_action == 'CARGAR' else 'DESCARGA'
                dest_cost_res = calculate_detailed_port_costs(
                    client_id, tr.destination_port_id, d_type, request.vessel_id, port_costs_data, agency_matrix_data, request.port_cost_mode
                )
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
        
        res = sb.table("routes_spot").insert(payload).execute()
        if not res.data:
            raise Exception("Failed to save spot route")
        return {"status": "success", "spot_id": res.data[0]["spot_id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vessels")
def get_vessels():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table("vessels").select("*").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ports")
def get_ports(year: int = 2026):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table("ports").select("*, sources_sinks(capacity_mt, type)").eq("sources_sinks.year", year).execute()
        
        flat_data = []
        for p in res.data:
            ss_list = p.get("sources_sinks", [])
            ss = ss_list[0] if isinstance(ss_list, list) and len(ss_list) > 0 else None
            p["capacity_mt"] = ss["capacity_mt"] if ss else None
            p["type"] = ss["type"] if ss else None
            p.pop("sources_sinks", None)
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

@router.get("/spot/list")
def list_spot_voyages():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table("routes_spot").select("*").order("created_at", desc=True).execute()
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

