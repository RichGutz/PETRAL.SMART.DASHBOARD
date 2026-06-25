from fastapi import APIRouter, HTTPException
from backend.models.voyage_models import VoyageRequest
from backend.engine import calculate_voyage_pnl

router = APIRouter()

@router.post("/simulate_voyage")
def simulate_voyage(request: VoyageRequest):
    try:
        inputs = request.dict()
        result = calculate_voyage_pnl(inputs)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
