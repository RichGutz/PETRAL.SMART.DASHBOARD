import os
import sys

# Add backend directory to path
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.engine import calculate_voyage_pnl

inputs = {
    "quantity": 13500,
    "freight_rate": 19.01,
    "route_distance": 69,
    "vessel_speed": 11.0,
    "weather_factor_laden": 0.03,
    "weather_factor_ballast": 0.03,
    "port_overhead_hours_origin": 6.0,
    "port_overhead_hours_dest": 6.0,
    "contract_agreed_load_rate": 500,
    "vessel_max_load_intake_limit": 500,
    "max_terminal_load_rate": 500,
    "contract_agreed_discharge_rate": 300,
    "vessel_pump_discharge_rate": 450,
    "port_max_discharge_limit": 300,
    "agency_costs_origin": 23000,
    "agency_costs_destination": 18000,
    "bunker_price_ifo": 895.14,
    "bunker_price_mdo": 1460.30,
    "tce_required": 15000,
    "bunker_consumption_sea_ifo": 14.0,
    "bunker_consumption_idle_ifo": 3.5,
    "bunker_consumption_load_ifo": 3.5,
    "bunker_consumption_disch_ifo": 5.0,
    "bunker_consumption_sea_mdo": 0.0,
    "bunker_consumption_idle_mdo": 0.0,
    "bunker_consumption_load_mdo": 0.0,
    "bunker_consumption_disch_mdo": 0.0,
    "is_round_trip": True
}

res = calculate_voyage_pnl(inputs)
print("Calculation results:")
for k, v in res.items():
    if k != 'audit_trail':
        print(f"  {k}: {v}")
