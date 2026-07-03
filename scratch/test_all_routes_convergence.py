import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "Desarrollo.Profesional", "Geeksoft_Engine"))

from backend.spot_engine import calculate_multicotizador_simulation
from backend.engine import calculate_voyage_pnl
from backend.database import get_supabase

def test_all():
    sb = get_supabase()
    
    # 1. Barcos a probar
    vessels_to_test = ["MOQUEGUA", "TABLONES"]
    
    # 2. Rutas comerciales típicas (Laden)
    # Formato: (Origen, Destino, Distancia, Q)
    rutas_comerciales = [
        ("ILO", "MATARANI", 78.0, 13500.0),
        ("ILO", "MARCONA", 188.0, 13500.0),
        ("ILO", "MEJILLONES", 353.0, 13500.0),
        ("MATARANI", "ILO", 78.0, 13500.0),
        ("MARCONA", "ILO", 188.0, 13500.0),
        ("MEJILLONES", "ILO", 353.0, 13500.0)
    ]
    
    # Precios de bunker
    p_ifo = 895.14
    p_mdo = 1460.30
    
    # Obtener catálogos de la BD
    ports_res = sb.table("ports").select("*").execute()
    ports_db = {p["port_id"]: p for p in ports_res.data}
    
    print("\n" + "="*85)
    print("INFORME DE CONVERGENCIA MULTICOTIZADOR VS AUDITORÍA LEDGER (MOQUEGUA & TABLONES)")
    print("="*85)
    print(f"{'VESSEL':10} | {'RUTA':21} | {'DÍAS LEDGER':11} | {'DÍAS MULTI':10} | {'BUNKER LEDG':11} | {'BUNKER MULT':11} | {'DIF. BUNKER'}")
    print("-" * 85)
    
    for v_id in vessels_to_test:
        v_res = sb.table("vessels").select("*").eq("vessel_id", v_id).execute()
        if not v_res.data:
            continue
        vessel = v_res.data[0]
        
        for orig, dest, dist, qty in rutas_comerciales:
            # Preparar inputs Voyage Ledger (Viaje Redondo)
            ledger_inputs = {
                "vessel_id": v_id,
                "quantity": qty,
                "freight_rate": 20.0,
                "route_distance": dist,
                "vessel_speed": float(vessel.get("vessel_speed", 11.0)),
                "weather_factor_laden": 0.05,
                "weather_factor_ballast": 0.05,
                "port_overhead_hours_origin": float(ports_db[orig].get("overhead_carga_hrs", 6.0)),
                "port_overhead_hours_dest": float(ports_db[dest].get("overhead_descarga_hrs", 6.0)),
                "positioning_carga_hrs": float(ports_db[orig].get("positioning_carga_hrs", 0.0)),
                "positioning_descarga_hrs": float(ports_db[dest].get("positioning_descarga_hrs", 0.0)),
                "contract_agreed_load_rate": 800.0,
                "contract_agreed_discharge_rate": 600.0,
                "agency_costs_origin": 9999.0,
                "agency_costs_destination": 9999.0,
                "bunker_price_ifo": p_ifo,
                "bunker_price_mdo": p_mdo,
                "bunker_consumption_sea_ifo": float(vessel.get("consumption_sea_ifo", 0)),
                "bunker_consumption_idle_ifo": float(vessel.get("consumption_idle_ifo", 0)),
                "bunker_consumption_load_ifo": float(vessel.get("consumption_load_ifo", 0)),
                "bunker_consumption_disch_ifo": float(vessel.get("consumption_disch_ifo", 0)),
                "bunker_consumption_sea_mdo": float(vessel.get("consumption_sea_mdo", 0)),
                "bunker_consumption_idle_mdo": float(vessel.get("consumption_idle_mdo", 0)),
                "bunker_consumption_load_mdo": float(vessel.get("consumption_load_mdo", 0)),
                "bunker_consumption_disch_mdo": float(vessel.get("consumption_disch_mdo", 0)),
                "is_round_trip": True
            }
            
            res_ledger = calculate_voyage_pnl(ledger_inputs)
            
            # Preparar inputs Multicotizador (2 tramos consecutivos)
            payload_multicotizador = {
                "vessel_params": {
                    "vessel_speed": float(vessel.get("vessel_speed", 11.0)),
                    "bunker_price_ifo": p_ifo,
                    "bunker_price_mdo": p_mdo,
                    "consumption_sea_ifo": float(vessel.get("consumption_sea_ifo", 0)),
                    "consumption_idle_ifo": float(vessel.get("consumption_idle_ifo", 0)),
                    "consumption_load_ifo": float(vessel.get("consumption_load_ifo", 0)),
                    "consumption_disch_ifo": float(vessel.get("consumption_disch_ifo", 0)),
                    "consumption_sea_mdo": float(vessel.get("consumption_sea_mdo", 0)),
                    "consumption_idle_mdo": float(vessel.get("consumption_idle_mdo", 0)),
                    "consumption_load_mdo": float(vessel.get("consumption_load_mdo", 0)),
                    "consumption_disch_mdo": float(vessel.get("consumption_disch_mdo", 0))
                },
                "tramos": [
                    {
                        "type": "LADEN",
                        "origin_port_id": orig,
                        "destination_port_id": dest,
                        "route_distance": dist,
                        "weather_factor": 0.05,
                        "quantity": qty,
                        "freight_rate": 20.0,
                        "contract_agreed_load_rate": 800.0,
                        "contract_agreed_discharge_rate": 600.0,
                        "port_overhead_hours_origin": float(ports_db[orig].get("overhead_carga_hrs", 6.0)),
                        "port_overhead_hours_dest": float(ports_db[dest].get("overhead_descarga_hrs", 6.0)),
                        "positioning_carga_hrs": float(ports_db[orig].get("positioning_carga_hrs", 0.0)),
                        "positioning_descarga_hrs": float(ports_db[dest].get("positioning_descarga_hrs", 0.0)),
                        "agency_costs_origin": 9999.0,
                        "agency_costs_destination": 9999.0
                    },
                    {
                        "type": "BALLAST",
                        "origin_port_id": dest,
                        "destination_port_id": orig,
                        "route_distance": dist,
                        "weather_factor": 0.05,
                        "port_overhead_hours_origin": float(ports_db[dest].get("overhead_carga_hrs", 6.0)),
                        "port_overhead_hours_dest": float(ports_db[orig].get("overhead_descarga_hrs", 6.0)),
                        "positioning_carga_hrs": float(ports_db[dest].get("positioning_carga_hrs", 0.0)),
                        "positioning_descarga_hrs": float(ports_db[orig].get("positioning_descarga_hrs", 0.0)),
                        "agency_costs_origin": 9999.0,
                        "agency_costs_destination": 9999.0
                    }
                ]
            }
            
            res_multi = calculate_multicotizador_simulation(payload_multicotizador)
            
            # Comparar
            diff_days = abs(res_ledger["total_duration"] - res_multi["consolidated"]["total_days"])
            diff_bunker = abs(res_ledger["total_bunker_costs"] - res_multi["consolidated"]["total_bunker_costs"])
            
            print(f"{v_id:10} | {orig:9} -> {dest:6} | {res_ledger['total_duration']:11.4f} | {res_multi['consolidated']['total_days']:10.4f} | ${res_ledger['total_bunker_costs']:9,.2f} | ${res_multi['consolidated']['total_bunker_costs']:9,.2f} | ${diff_bunker:5.2f} ({'OK' if diff_bunker < 0.05 else 'FAIL'})")
            
    print("="*85 + "\n")

if __name__ == "__main__":
    test_all()
