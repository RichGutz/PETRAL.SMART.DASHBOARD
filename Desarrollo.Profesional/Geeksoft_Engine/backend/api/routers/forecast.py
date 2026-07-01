from fastapi import APIRouter, HTTPException
from backend.models.forecast_models import ForecastRequest, ForecastResponse, ForecastSaveRequest, ForecastListResponse
from backend.services.forecast_service import run_forecast_simulation

router = APIRouter(tags=["Commercial Forecast"])

@router.post("/run", response_model=ForecastResponse)
def simulate_forecast(request: ForecastRequest):
    try:
        result = run_forecast_simulation(request)
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
        agency_res = sb.table("agency_matrix").select("*").execute()
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

@router.post("/spot/save")
def save_spot_voyage(request: SpotSaveRequest):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        
        payload = {
            "name": request.name,
            "description": request.description,
            "legs_data": request.legs_data
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
def get_ports():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table("ports").select("*").execute()
        return res.data
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
