import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase

sb = get_supabase()

def update_spcc_routes():
    routes_res = sb.table("routes_clients").select("*").execute()
    routes = routes_res.data or []
    
    # Mapeo de nombres antiguos y nuevos con configuraciones de 2 piernas
    spcc_map = {
        "SPCC.ILO.MATARANI": {
            "new_name": "SPCC.ILO.MATARANI.ILO",
            "dest_port": "MATARANI",
            "distance": 69.0,
            "agency_origin": 31327.99,
            "agency_dest": 17000.00,
            "freight_rate": 25.50,
            "load_rate": 500.0,
            "disch_rate": 400.0
        },
        "SPCC.ILO.MATARANI.ILO": {
            "new_name": "SPCC.ILO.MATARANI.ILO",
            "dest_port": "MATARANI",
            "distance": 69.0,
            "agency_origin": 31327.99,
            "agency_dest": 17000.00,
            "freight_rate": 25.50,
            "load_rate": 500.0,
            "disch_rate": 400.0
        },
        "SPCC.ILO.MARCONA": {
            "new_name": "SPCC.ILO.MARCONA.ILO",
            "dest_port": "MARCONA",
            "distance": 283.0,
            "agency_origin": 31327.99,
            "agency_dest": 40000.00,
            "freight_rate": 25.50,
            "load_rate": 500.0,
            "disch_rate": 345.0
        },
        "SPCC.ILO.MARCONA.ILO": {
            "new_name": "SPCC.ILO.MARCONA.ILO",
            "dest_port": "MARCONA",
            "distance": 283.0,
            "agency_origin": 31327.99,
            "agency_dest": 40000.00,
            "freight_rate": 25.50,
            "load_rate": 500.0,
            "disch_rate": 345.0
        },
        "SPCC.ILO.MEJILLONES": {
            "new_name": "SPCC.ILO.MEJILLONES.ILO",
            "dest_port": "MEJILLONES",
            "distance": 335.0,
            "agency_origin": 31327.99,
            "agency_dest": 50000.00,
            "freight_rate": 25.50,
            "load_rate": 500.0,
            "disch_rate": 345.0
        },
        "SPCC.ILO.MEJILLONES.ILO": {
            "new_name": "SPCC.ILO.MEJILLONES.ILO",
            "dest_port": "MEJILLONES",
            "distance": 335.0,
            "agency_origin": 31327.99,
            "agency_dest": 50000.00,
            "freight_rate": 25.50,
            "load_rate": 500.0,
            "disch_rate": 345.0
        }
    }

    for r in routes:
        old_name = (r.get("name") or "").strip()
        if old_name not in spcc_map:
            continue
        
        cfg = spcc_map[old_name]
        new_name = cfg["new_name"]
        dest = cfg["dest_port"]
        dist = cfg["distance"]
        
        legs_data = {
            "is_multicotizador": True,
            "bunker_price_ifo": 895.14,
            "bunker_price_mdo": 1460.30,
            "addressCommPct": 0.0,
            "brokerCommPct": 0.0,
            "tramos": [
                {
                    "type": "LADEN",
                    "speed": 11.0,
                    "quantity": 13500.0,
                    "freight_rate": cfg["freight_rate"],
                    "origin_action": "CARGAR",
                    "destination_action": "DESCARGAR",
                    "origin_port_id": "ILO",
                    "destination_port_id": dest,
                    "route_distance": dist,
                    "weather_factor": 0.03,
                    "agency_costs_origin": cfg["agency_origin"],
                    "agency_costs_destination": cfg["agency_dest"],
                    "contract_agreed_load_rate": cfg["load_rate"],
                    "contract_agreed_discharge_rate": cfg["disch_rate"],
                    "custom_load_rate": cfg["load_rate"],
                    "custom_discharge_rate": cfg["disch_rate"],
                    "rate_unit_origin": "TH",
                    "rate_unit_destination": "TH",
                    "port_overhead_hours_origin": 6.0,
                    "port_overhead_hours_dest": 6.0,
                    "port_delay_hours_loading": 0.0,
                    "port_delay_hours_discharging": 0.0,
                    "positioning_carga_hrs": 0.0,
                    "positioning_descarga_hrs": 0.0
                },
                {
                    "type": "BALLAST",
                    "speed": 11.0,
                    "quantity": 0.0,
                    "freight_rate": 0.0,
                    "origin_action": "DESCARGAR",
                    "destination_action": "NONE",
                    "origin_port_id": dest,
                    "destination_port_id": "ILO",
                    "route_distance": dist,
                    "weather_factor": 0.03,
                    "agency_costs_origin": 0.0,
                    "agency_costs_destination": 0.0,
                    "rate_unit_origin": "TH",
                    "rate_unit_destination": "TH",
                    "port_overhead_hours_origin": 6.0,
                    "port_overhead_hours_dest": 6.0,
                    "port_delay_hours_loading": 0.0,
                    "port_delay_hours_discharging": 0.0,
                    "positioning_carga_hrs": 0.0,
                    "positioning_descarga_hrs": 0.0
                }
            ]
        }
        
        upd_res = sb.table("routes_clients").update({
            "name": new_name,
            "description": f"Ruta fija SPCC estandarizada (2 piernas): Ilo - {dest} - Ilo",
            "legs_data": legs_data
        }).eq("route_id", r["route_id"]).execute()
        
        print(f"✅ Ruta {old_name} ➔ Renombrada y actualizada a {new_name} (2 piernas: {dist*2} NM total).")

if __name__ == "__main__":
    update_spcc_routes()
