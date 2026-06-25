from pydantic import BaseModel
from typing import Optional

class VoyageRequest(BaseModel):
    quantity: float
    freight_rate: float
    route_distance: float
    vessel_speed: float
    weather_factor: float
    port_overhead_hours: float
    vessel_max_load_intake_limit: float
    max_terminal_load_rate: float
    vessel_pump_discharge_rate: float
    port_max_discharge_limit: float
    agency_costs_origin: float
    agency_costs_destination: float
    bunker_price_ifo: float
    tce_required: float
    consumption_sea_ifo: float
    consumption_port_ifo: float
    contract_agreed_load_rate: Optional[float] = None
    contract_agreed_discharge_rate: Optional[float] = None
