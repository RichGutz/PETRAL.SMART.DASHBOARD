import sys
import os
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase
from backend.spot_engine import calculate_spot_multileg
import json

sb = get_supabase()

# 1. Fetch Vessel
v_res = sb.table("vessels").select("*").eq("vessel_id", "TABLONES").execute()
vessel_params = v_res.data[0]

# 2. Fetch routes to get distances and weather factor
# Callao to Mejillones
# Let's just mock the data directly
payload = {
    "vessel_params": vessel_params,
    "legs": {
        "positioning": {
            "route_distance": 500,
            "weather_factor": 0.05
        },
        "laden": {
            "route_distance": 1000,
            "weather_factor": 0.05,
            "quantity": 30000,
            "freight_rate": 25,
            "port_overhead_hours_origin": 6,
            "port_overhead_hours_dest": 6,
            "contract_agreed_load_rate": 10000,
            "contract_agreed_discharge_rate": 8000,
            "agency_costs_origin": 15000,
            "agency_costs_destination": 20000
        },
        "return": {
            "route_distance": 300,
            "weather_factor": 0.05
        }
    }
}

result = calculate_spot_multileg(payload)
print(json.dumps(result, indent=2))
