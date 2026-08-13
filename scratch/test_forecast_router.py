import sys
import json
from pathlib import Path

# Add Geeksoft_Engine to path
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.spot_engine import calculate_multicotizador_simulation

# Test payload directly
payload = {
  "vessel_params": {
    "vessel_id": "TABLONES",
    "vessel_speed": 11,
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
      "origin_action": "NONE",
      "destination_action": "CARGAR",
      "port_overhead_hours_dest": 6,
      "positioning_carga_hrs": 1,
      "custom_load_rate": 500,
      "route_distance": 514,
      "weather_factor": 0.03,
      "speed": 11,
      "quantity": 0,
      "agency_costs_origin": 0,
      "agency_costs_destination": 17000
    },
    {
      "type": "LADEN",
      "origin_port_id": "CALLAO",
      "destination_port_id": "MATARANI",
      "origin_action": "CARGAR",
      "destination_action": "DESCARGAR",
      "port_overhead_hours_dest": 6,
      "positioning_descarga_hrs": 0,
      "custom_load_rate": 500,
      "custom_discharge_rate": 400,
      "route_distance": 457,
      "weather_factor": 0.03,
      "speed": 11,
      "quantity": 13500,
      "agency_costs_origin": 0,
      "agency_costs_destination": 18000
    },
    {
      "type": "BALLAST",
      "origin_port_id": "MATARANI",
      "destination_port_id": "ILO",
      "origin_action": "DESCARGAR",
      "destination_action": "NONE",
      "route_distance": 69,
      "weather_factor": 0.03,
      "speed": 11,
      "quantity": 0,
      "agency_costs_origin": 0,
      "agency_costs_destination": 0
    }
  ]
}

res = calculate_multicotizador_simulation(payload)

print("=== FORECAST ENGINE VERIFICATION ===")
for i, tr in enumerate(res["tramos"]):
    print(f"Tramo {i+1} ({tr['origin_port_id']} -> {tr['destination_port_id']}): sea_days={tr['sea_days']:.4f}, port_days={tr['port_days']:.4f}")

print("\nCONSOLIDATED SUMMARY:")
print(f"Total Sea Days : {res['consolidated']['total_sea_days']:.4f}")
print(f"Total Port Days: {res['consolidated']['total_port_days']:.4f}")
print(f"Total Voyage Days: {res['consolidated']['total_days']:.4f}")
