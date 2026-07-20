import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Desarrollo.Profesional', 'Geeksoft_Engine')))

from backend.database import get_supabase

sb = get_supabase()

def create_spcc_route(dest_port, distance, pais):
    name = f"SPCC.ILO-{dest_port}"
    description = f"Ruta fija simple SPCC: Ilo a {dest_port}"
    
    # 1 Laden leg from ILO to destination
    legs_data = {
        "is_multicotizador": True,
        "tramos": [
            {
                "type": "LADEN",
                "quantity": 0.0,
                "freight_rate": 0.0,
                "origin_port_id": "ILO",
                "route_distance": distance,
                "weather_factor": 0.05,
                "rate_unit_origin": "TH",
                "agency_costs_origin": 0.0,
                "destination_port_id": dest_port,
                "positioning_carga_hrs": 0.0,
                "rate_unit_destination": "TH",
                "agency_costs_destination": 0.0,
                "port_delay_hours_loading": 0.0,
                "port_overhead_hours_dest": 6.0,
                "positioning_descarga_hrs": 0.0,
                "contract_agreed_load_rate": 800.0,
                "port_overhead_hours_origin": 6.0,
                "port_delay_hours_discharging": 0.0,
                "contract_agreed_discharge_rate": 600.0,
                "origin_action": "CARGAR",
                "destination_action": "DESCARGAR"
            }
        ]
    }
    
    payload = {
        "name": name,
        "description": description,
        "legs_data": legs_data,
        "pais": pais
    }
    
    return payload


routes_to_insert = [
    create_spcc_route("MATARANI", 69.0, "Peru"),
    create_spcc_route("MARCONA", 279.0, "Peru"),
    create_spcc_route("MEJILLONES", 335.0, "Chile"),
]

for route in routes_to_insert:
    # Check if exists to avoid duplicates
    existing = sb.table("routes_master").select("*").eq("name", route["name"]).execute()
    if not existing.data:
        res = sb.table("routes_master").insert(route).execute()
        print(f"Inserted {route['name']}")
    else:
        print(f"Route {route['name']} already exists")
