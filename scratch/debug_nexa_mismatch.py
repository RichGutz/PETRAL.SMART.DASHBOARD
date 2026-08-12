import sys
import os
import json

# Add backend to path
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.spot_engine import calculate_multicotizador_simulation

# Payload matching the screenshot:
# Vessel: MOQUEGUA
# Speed: 11, TCE: 13000
# IFO: sea 14, idle 2.4, load 2.4, disch 3.6, price 1100
# MDO: sea 0, idle 0, load 0.5, disch 0.5, price 1528.26
# Port costs mode: static

vessel_params = {
    "vessel_id": "MOQUEGUA",
    "vessel_name": "MOQUEGUA",
    "vessel_speed": 11.0,
    "tce_required": 13000,
    "bunker_price_ifo": 1100.0,
    "bunker_price_mdo": 1528.26,
    "consumption_sea_ifo": 14.0,
    "consumption_idle_ifo": 2.4,
    "consumption_load_ifo": 2.4,
    "consumption_disch_ifo": 3.6,
    "consumption_sea_mdo": 0.0,
    "consumption_idle_mdo": 0.0,
    "consumption_load_mdo": 0.5,
    "consumption_disch_mdo": 0.5,
    "act_load": 500,
    "act_disch": 400
}

# Legs:
# 1. ILO -> CALLAO (BALLAST), Dist 514, WF 3%, CARGAR 13500 MT, rate 500 T/H (TH), overhead 6h, pos 0
# 2. CALLAO -> MATARANI (LADEN), Dist 457, WF 3%, DESCARGAR 13500 MT, rate 400 T/H (TH), overhead 6h, pos 0, F 30
# 3. MATARANI -> ILO (BALLAST), Dist 69, WF 3%, NONE, F 0

tramos = [
    {
        "type": "BALLAST",
        "origin_port_id": "ILO",
        "destination_port_id": "CALLAO",
        "route_distance": 514,
        "weather_factor": 0.03,
        "speed": 11.0,
        "quantity": 13500,
        "freight_rate": 0,
        "agency_costs_origin": 0,
        "agency_costs_destination": 16000
    },
    {
        "type": "LADEN",
        "origin_port_id": "CALLAO",
        "destination_port_id": "MATARANI",
        "route_distance": 457,
        "weather_factor": 0.03,
        "speed": 11.0,
        "quantity": 13500,
        "freight_rate": 30,
        "agency_costs_origin": 16000,
        "agency_costs_destination": 17000
    },
    {
        "type": "BALLAST",
        "origin_port_id": "MATARANI",
        "destination_port_id": "ILO",
        "route_distance": 69,
        "weather_factor": 0.03,
        "speed": 11.0,
        "quantity": 0,
        "freight_rate": 0,
        "agency_costs_origin": 17000,
        "agency_costs_destination": 0
    }
]

# Puertos config
puertos_config = [
    {"action": "NONE", "overhead": 0, "positioning": 0, "op_rate": 0, "rate_unit": "TH"},
    {"action": "CARGAR", "overhead": 6, "positioning": 0, "op_rate": 500, "rate_unit": "TH"},
    {"action": "DESCARGAR", "overhead": 6, "positioning": 0, "op_rate": 400, "rate_unit": "TH"},
    {"action": "NONE", "overhead": 0, "positioning": 0, "op_rate": 0, "rate_unit": "TH"}
]

res = calculate_multicotizador_simulation(
    tramos=tramos,
    vessel_params=vessel_params,
    address_comm_pct=0.0,
    broker_comm_pct=0.0,
    port_cost_mode="static",
    port_costs_data=[],
    agency_matrix_data=[],
    ports_db={},
    routes_db=[],
    puertos_config=puertos_config
)

print(json.dumps(res, indent=2))
