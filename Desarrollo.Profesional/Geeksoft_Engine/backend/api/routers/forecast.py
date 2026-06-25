from fastapi import APIRouter, HTTPException
from backend.models.forecast_models import ForecastRequest, ForecastResponse
from backend.services.forecast_service import run_forecast_simulation

router = APIRouter(tags=["Commercial Forecast"])

@router.post("/run", response_model=ForecastResponse)
def simulate_forecast(request: ForecastRequest):
    try:
        result = run_forecast_simulation(request)
        return ForecastResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
