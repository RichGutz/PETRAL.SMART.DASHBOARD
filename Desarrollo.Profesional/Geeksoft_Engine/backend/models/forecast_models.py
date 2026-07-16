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
    port_cost_mode: Optional[str] = Field("static", description="Modo de costos de puerto: 'static' o 'matrix'")

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

class SpotSaveRequest(BaseModel):
    name: str
    description: Optional[str] = None
    legs_data: Dict[str, Any]
    pais: Optional[str] = "Peru"

class SpotCalculationRequest(BaseModel):
    vessel_id: str
    legs: Dict[str, Any]


class MultiCotizadorTramo(BaseModel):
    origin_port_id: str
    destination_port_id: str
    type: str  # 'BALLAST' o 'LADEN'
    quantity: float = 0.0
    freight_rate: float = 0.0
    origin_action: Optional[str] = "NONE"
    destination_action: Optional[str] = "NONE"
    port_overhead_hours_origin: Optional[float] = None
    port_overhead_hours_dest: Optional[float] = None
    port_delay_hours_loading: float = 0.0
    port_delay_hours_discharging: float = 0.0
    positioning_carga_hrs: Optional[float] = None
    positioning_descarga_hrs: Optional[float] = None
    weather_factor: float = 0.0
    route_distance: float = 0.0
    agency_costs_origin: float = 0.0
    agency_costs_destination: float = 0.0
    custom_load_rate: Optional[float] = None
    custom_discharge_rate: Optional[float] = None


class MultiCotizadorRequest(BaseModel):
    vessel_id: str
    tramos: List[MultiCotizadorTramo]
    bunker_price_ifo: Optional[float] = None
    bunker_price_mdo: Optional[float] = None
    vessel_speed: Optional[float] = None
    grt: Optional[float] = None
    dwt: Optional[float] = None
    dwcc: Optional[float] = None
    length: Optional[float] = None
    beam: Optional[float] = None
    tce_required: Optional[float] = None
    consumption_sea_ifo: Optional[float] = None
    consumption_idle_ifo: Optional[float] = None
    consumption_load_ifo: Optional[float] = None
    consumption_disch_ifo: Optional[float] = None
    consumption_sea_mdo: Optional[float] = None
    consumption_idle_mdo: Optional[float] = None
    consumption_load_mdo: Optional[float] = None
    consumption_disch_mdo: Optional[float] = None
    port_cost_mode: Optional[str] = Field("static", description="Modo de costo puerto: 'static' o 'matrix'")


class ClientMaster(BaseModel):
    client_id: str
    client_name: str
    color_hex: Optional[str] = None
    is_active: Optional[bool] = True
    is_prospect: Optional[bool] = False

class ContractTariffMaster(BaseModel):
    min_tonnage: float
    max_tonnage: float
    freight_rate: float
    # These fields are implicit/inherited from the parent contract in the UI, but required in DB
    contract_id: Optional[str] = None
    origin_port_id: Optional[str] = None
    destination_port_id: Optional[str] = None

class ContractMaster(BaseModel):
    contract_id: str
    client_id: str
    origin_port_id: str
    destination_port_id: str
    is_active: bool = True
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    load_rate: float = 0.0
    discharge_rate: float = 0.0
    address_commission: float = 0.0
    broker_commission: float = 0.0
    bunker_baseline_price_ifo: float = 0.0
    bunker_baseline_price_mdo: float = 0.0
    baf_rules: Optional[str] = None
    comments: Optional[list] = []
    time_to_count_carga_hrs: float = 6.0
    maneuver_carga_hrs: float = 0.0
    time_to_count_descarga_hrs: float = 6.0
    maneuver_descarga_hrs: float = 0.0
    tariffs: List[ContractTariffMaster] = []

class PortUpdate(BaseModel):
    port_id: str
    port_name: str
    country: str
    lat: float
    lon: float

class PortReorderItem(BaseModel):
    port_id: str
    display_order: int

class TerminalUpdate(BaseModel):
    terminal_id: str
    port_id: str
    terminal_name: str
    is_active: bool = True

class PortCostStaticUpdateItem(BaseModel):
    client_id: str
    port_id: str
    operation_type: str
    vessel_id: str
    cost: float
    sub_operation_type: Optional[str] = 'MAIN'
    updated_by: str = 'ADMIN'


class SourceSinkUpdateItem(BaseModel):
    port_id: str
    year: int
    capacity_mt: float
    type: str
    empresa: str
    color_hex: str
    producto: str

