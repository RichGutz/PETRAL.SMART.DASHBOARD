import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase

sb = get_supabase()

def seed_prospect_quotes():
    print("🌱 Iniciando seed de Cotizaciones Spot de Prospectos...")
    
    # 1. Limpiar cotizaciones de prospectos existentes si hubiera alguna
    res = sb.table("routes_quotes").select("*").execute()
    existing = res.data or []
    for r in existing:
        if r.get("name", "").startswith("Prospect"):
            sb.table("routes_quotes").delete().eq("quote_id", r.get("quote_id") or r.get("spot_id")).execute()
            print(f"🗑️ Eliminada cotización antigua: {r['name']}")


    # 2. Definición de las 3 cotizaciones espejo de SPCC para prospectos
    quotes = [
        {
            "name": "Prospect.MARCOBRE.ILO.MATARANI.ILO",
            "description": "Cotización Prospecto MARCOBRE: Ilo - Matarani - Ilo (Tarifas e Itinerario Espejo SPCC)",
            "pais": "Peru",
            "client": "MARCOBRE",
            "dest_port": "MATARANI",
            "dist": 69.0,
            "agency_origin": 31327.99,
            "agency_dest": 17000.00,
            "freight_rate": 25.50,
            "load_rate": 500.0,
            "disch_rate": 400.0,
            "port_cost_load": 19071.88,
            "port_cost_disch": 22410.50,
            "tce_net": 14250.00
        },
        {
            "name": "Prospect.CODELCO.ILO.MARCONA.ILO",
            "description": "Cotización Prospecto CODELCO: Ilo - Marcona - Ilo (Tarifas e Itinerario Espejo SPCC)",
            "pais": "Peru",
            "client": "CODELCO",
            "dest_port": "MARCONA",
            "dist": 283.0,
            "agency_origin": 31327.99,
            "agency_dest": 40000.00,
            "freight_rate": 25.50,
            "load_rate": 500.0,
            "disch_rate": 345.0,
            "port_cost_load": 19071.88,
            "port_cost_disch": 24800.00,
            "tce_net": 13800.00
        },
        {
            "name": "Prospect.CERRO VERDE.ILO.MEJILLONES.ILO",
            "description": "Cotización Prospecto CERRO VERDE: Ilo - Mejillones - Ilo (Tarifas e Itinerario Espejo SPCC)",
            "pais": "Chile",
            "client": "CERRO VERDE",
            "dest_port": "MEJILLONES",
            "dist": 335.0,
            "agency_origin": 31327.99,
            "agency_dest": 50000.00,
            "freight_rate": 25.50,
            "load_rate": 500.0,
            "disch_rate": 345.0,
            "port_cost_load": 19071.88,
            "port_cost_disch": 28500.00,
            "tce_net": 15100.00
        }
    ]

    for q in quotes:
        legs_data = {
            "is_multicotizador": True,
            "vessel_name": "BT MOQUEGUA",
            "vessel_speed": 11.0,
            "loa": 183.0,
            "grt": 28000.0,
            "cargo_tons": 13500.0,
            "freight_rate": q["freight_rate"],
            "port_cost_load": q["port_cost_load"],
            "port_cost_disch": q["port_cost_disch"],
            "bunker_price_ifo": 895.14,
            "bunker_price_mdo": 1460.30,
            "total_bunker_mt": 145.2,
            "tce_net": q["tce_net"],
            "addressCommPct": 0.0,
            "brokerCommPct": 0.0,
            "created_by": "auditor_comercial@petral.com.pe",
            "tramos": [
                {
                    "type": "LADEN",
                    "speed": 11.0,
                    "quantity": 13500.0,
                    "freight_rate": q["freight_rate"],
                    "origin_action": "CARGAR",
                    "destination_action": "DESCARGAR",
                    "origin_port_id": "ILO",
                    "destination_port_id": q["dest_port"],
                    "route_distance": q["dist"],
                    "weather_factor": 0.03,
                    "agency_costs_origin": q["agency_origin"],
                    "agency_costs_destination": q["agency_dest"],
                    "contract_agreed_load_rate": q["load_rate"],
                    "contract_agreed_discharge_rate": q["disch_rate"],
                    "custom_load_rate": q["load_rate"],
                    "custom_discharge_rate": q["disch_rate"],
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
                    "origin_port_id": q["dest_port"],
                    "destination_port_id": "ILO",
                    "route_distance": q["dist"],
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

        payload = {
            "name": q["name"],
            "description": q["description"],
            "pais": q["pais"],
            "legs_data": legs_data
        }

        ins_res = sb.table("routes_quotes").insert(payload).execute()
        print(f"✅ Insertada Cotización Prospecto: {q['name']} ({q['client']})")


if __name__ == "__main__":
    seed_prospect_quotes()
