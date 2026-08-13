import sys
import json
from pathlib import Path

# Add Geeksoft_Engine to path
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.spot_engine import calculate_multicotizador_simulation

payload = {
  "vessel_params": {
    "vessel_id": "TABLONES",
    "vessel_name": "TABLONES",
    "grt": 11365,
    "dwt": 16533,
    "dwcc": 13500,
    "vessel_speed": 11,
    "tce_required": 15000,
    "length": 159,
    "beam": 23,
    "draft_m": "8.2",
    "consumption_sea_ifo": 14.5,
    "consumption_idle_ifo": 3.5,
    "consumption_load_ifo": 3.5,
    "consumption_disch_ifo": 5,
    "consumption_sea_mdo": 0.1,
    "consumption_idle_mdo": 0.1,
    "consumption_load_mdo": 0.1,
    "consumption_disch_mdo": 0.1,
    "act_load": 500,
    "act_disch": 300
  },
  "bunker_price_ifo": 1100,
  "bunker_price_mdo": 1700,
  "tramos": [
    {
      "type": "BALLAST",
      "origin_port_id": "ILO",
      "destination_port_id": "CALLAO",
      "quantity": 0,
      "freight_rate": 0,
      "port_delay_hours_loading": 0,
      "port_delay_hours_discharging": 0,
      "route_distance": 514,
      "weather_factor": 0.03,
      "speed": 11,
      "origin_action": "NONE",
      "destination_action": "CARGAR",
      "port_overhead_hours_dest": 6,
      "positioning_carga_hrs": 1,
      "agency_costs_origin": 0,
      "agency_costs_destination": 17000
    },
    {
      "type": "LADEN",
      "origin_port_id": "CALLAO",
      "destination_port_id": "MATARANI",
      "quantity": 13500,
      "freight_rate": 30,
      "port_delay_hours_loading": 0,
      "port_delay_hours_discharging": 0,
      "route_distance": 457,
      "weather_factor": 0.03,
      "speed": 11,
      "origin_action": "CARGAR",
      "destination_action": "DESCARGAR",
      "custom_load_rate": 500,
      "custom_discharge_rate": 400,
      "port_overhead_hours_dest": 6,
      "positioning_descarga_hrs": 0,
      "agency_costs_origin": 0,
      "agency_costs_destination": 18000
    },
    {
      "type": "BALLAST",
      "origin_port_id": "MATARANI",
      "destination_port_id": "ILO",
      "quantity": 0,
      "freight_rate": 0,
      "port_delay_hours_loading": 0,
      "port_delay_hours_discharging": 0,
      "route_distance": 69,
      "weather_factor": 0.03,
      "speed": 11,
      "origin_action": "DESCARGAR",
      "destination_action": "NONE",
      "agency_costs_origin": 0,
      "agency_costs_destination": 0
    }
  ]
}

res = calculate_multicotizador_simulation(payload)
print("=== ACTUAL SIMULATION OUTPUT ===")
for idx, tr in enumerate(res["tramos"]):
    print(f"Tramo {idx+1} ({tr['origin_port_id']} -> {tr['destination_port_id']}, {tr['type']}): sea_days={tr['sea_days']:.4f}, port_days={tr['port_days']:.4f}")

cons = res["consolidated"]
print("\nCONSOLIDATED:")
print(f"total_sea_days  : {cons['total_sea_days']:.4f}")
print(f"total_port_days : {cons['total_port_days']:.4f}")
print(f"total_days      : {cons['total_days']:.4f}")
