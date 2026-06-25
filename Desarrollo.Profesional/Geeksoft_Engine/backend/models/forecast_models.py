from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ProjectionLine(BaseModel):
    month_index: str = Field(..., description="Mes de la proyección, ej. '2026-07'")
    client_id: str = Field(..., description="ID del cliente, ej. 'SPCC'")
    origin_port_id: str = Field(..., description="Puerto de origen, ej. 'ILO'")
    destination_port_id: str = Field(..., description="Puerto de destino, ej. 'MATARANI'")
    vessel_id: str = Field(..., description="Buque asignado, ej. 'MOQUEGUA'")
    quantity: float = Field(..., description="Volumen del viaje en MT")
    monthly_frequency: float = Field(..., description="Número de veces que se repite el viaje en el mes")
    forecast_bunker_price_ifo: Optional[float] = Field(None, description="Precio proyectado de IFO (What-if)")
    forecast_bunker_price_mdo: Optional[float] = Field(None, description="Precio proyectado de MDO (What-if)")
    custom_tariff: Optional[float] = Field(None, description="Tarifa manual comercial (sobrescribe contrato)")

class ForecastRequest(BaseModel):
    start_date: str = Field(..., description="Fecha de inicio, ej. '2026-07-01'")
    end_date: str = Field(..., description="Fecha de fin, ej. '2026-12-31'")
    projection_lines: List[ProjectionLine]

class ForecastResponse(BaseModel):
    status: str
    aggregated_data: Dict[str, Dict[str, Dict[str, Dict[str, Dict[str, Any]]]]]
    # Estructura: agg_data[client][route][vessel][month] = { net_income, total_bunker_costs, voyage_result, ... }

class ForecastSaveRequest(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., description="Nombre del escenario")
    user_id: str = Field(..., description="Usuario o autor")
    start_date: str = Field(..., description="Mes de inicio, ej. '2026-07'")
    end_date: str = Field(..., description="Mes de fin, ej. '2026-12'")
    projection_lines: List[Dict[str, Any]] = Field(..., description="Payload completo de lineas")

class ForecastListResponse(BaseModel):
    id: str
    name: str
    user_id: str
    start_date: str
    end_date: str
    created_at: str
    updated_at: str
