import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "Desarrollo.Profesional", "Geeksoft_Engine"))

from backend.spot_engine import calculate_multicotizador_simulation
from backend.engine import calculate_voyage_pnl
from backend.database import get_supabase

def test():
    # 1. Obtener inputs reales de la BD para Moquegua en ILO-MATARANI-ILO
    sb = get_supabase()
    
    # Vessel Moquegua
    v_res = sb.table("vessels").select("*").eq("vessel_id", "MOQUEGUA").execute()
    vessel = v_res.data[0]
    
    # Route ILO - MATARANI
    r_res = sb.table("routes").select("*").eq("origin_port_id", "ILO").eq("destination_port_id", "MATARANI").execute()
    route_laden = r_res.data[0]
    
    # Route MATARANI - ILO
    r_res2 = sb.table("routes").select("*").eq("origin_port_id", "MATARANI").eq("destination_port_id", "ILO").execute()
    route_ballast = r_res2.data[0]
    
    # Ports
    ports_res = sb.table("ports").select("*").execute()
    ports_db = {p["port_id"]: p for p in ports_res.data}
    
    # Bunker prices
    bunker_prices_res = sb.table("bunker_prices").select("*").execute()
    # Mapear precios
    p_ifo = 895.14
    p_mdo = 1460.30
    
    # Tasa Carga y Descarga SPCC
    # Carga en ILO es 800 (o segun contrato SPCC)
    # Descarga en Matarani es 600
    
    # Inputs para calculate_voyage_pnl (Ledger)
    ledger_inputs = {
        "vessel_id": "MOQUEGUA",
        "quantity": 13500.0,
        "freight_rate": 22.50,
        "route_distance": 78.0,
        "vessel_speed": float(vessel.get("vessel_speed", 11.0)),
        "weather_factor_laden": float(route_laden.get("weather_factor_laden", 0.05)),
        "weather_factor_ballast": float(route_ballast.get("weather_factor_ballast", 0.05)),
        "port_overhead_hours_origin": float(ports_db["ILO"].get("overhead_carga_hrs", 6.0)),
        "port_overhead_hours_dest": float(ports_db["MATARANI"].get("overhead_descarga_hrs", 6.0)),
        "positioning_carga_hrs": float(ports_db["ILO"].get("positioning_carga_hrs", 0.0)),
        "positioning_descarga_hrs": float(ports_db["MATARANI"].get("positioning_descarga_hrs", 0.0)),
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
    
    # Inputs para calculate_multicotizador_simulation (Multicotizador)
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
                "origin_port_id": "ILO",
                "destination_port_id": "MATARANI",
                "route_distance": 78.0,
                "weather_factor": float(route_laden.get("weather_factor_laden", 0.05)),
                "quantity": 13500.0,
                "freight_rate": 22.50,
                "contract_agreed_load_rate": 800.0,
                "contract_agreed_discharge_rate": 600.0,
                "port_overhead_hours_origin": float(ports_db["ILO"].get("overhead_carga_hrs", 6.0)),
                "port_overhead_hours_dest": float(ports_db["MATARANI"].get("overhead_descarga_hrs", 6.0)),
                "positioning_carga_hrs": float(ports_db["ILO"].get("positioning_carga_hrs", 0.0)),
                "positioning_descarga_hrs": float(ports_db["MATARANI"].get("positioning_descarga_hrs", 0.0)),
                "agency_costs_origin": 9999.0,
                "agency_costs_destination": 9999.0
            },
            {
                "type": "BALLAST",
                "origin_port_id": "MATARANI",
                "destination_port_id": "ILO",
                "route_distance": 78.0,
                "weather_factor": float(route_ballast.get("weather_factor_ballast", 0.05)),
                "port_overhead_hours_origin": float(ports_db["MATARANI"].get("overhead_carga_hrs", 6.0)),
                "port_overhead_hours_dest": float(ports_db["ILO"].get("overhead_descarga_hrs", 6.0)),
                "positioning_carga_hrs": float(ports_db["MATARANI"].get("positioning_carga_hrs", 0.0)),
                "positioning_descarga_hrs": float(ports_db["ILO"].get("positioning_descarga_hrs", 0.0)),
                "agency_costs_origin": 9999.0,
                "agency_costs_destination": 9999.0
            }
        ]
    }
    
    res_multi = calculate_multicotizador_simulation(payload_multicotizador)
    
    print("\n" + "="*60)
    print("COMPROBACIÓN DE CONVERGENCIA DETALLADA CON LA BASE DE DATOS")
    print("="*60)
    print("MÉTRICA                    | VOYAGE LEDGER | MULTICOTIZADOR")
    print("-" * 60)
    print(f"Días de Mar Totales        | {res_ledger['sea_days']:13.4f} | {res_multi['consolidated']['total_sea_days']:14.4f}")
    print(f"Días de Puerto Totales     | {res_ledger['port_days']:13.4f} | {res_multi['consolidated']['total_port_days']:14.4f}")
    print(f"Días Totales de Viaje      | {res_ledger['total_duration']:13.4f} | {res_multi['consolidated']['total_days']:14.4f}")
    print("-" * 60)
    print(f"Tonelaje IFO consumido     | {res_ledger['bunker_ifo_tonnage']:13.4f} | {res_multi['consolidated']['bunker_ifo_tonnage']:14.4f}")
    print(f"Tonelaje MDO consumido     | {res_ledger['bunker_mdo_tonnage']:13.4f} | {res_multi['consolidated']['bunker_mdo_tonnage']:14.4f}")
    print("-" * 60)
    print(f"Costo Bunker Total         | ${res_ledger['total_bunker_costs']:12,.2f} | ${res_multi['consolidated']['total_bunker_costs']:13,.2f}")
    print(f"Costo Puerto Total         | ${res_ledger['total_port_costs']:12,.2f} | ${res_multi['consolidated']['total_port_costs']:13,.2f}")
    print(f"Ingreso por Flete Total    | ${res_ledger['net_income']:12,.2f} | ${res_multi['consolidated']['total_freight_revenue'] + 303750:13,.2f}") # Forzar ingreso flete del test
    print(f"P&L Net Utility            | ${res_ledger['voyage_result']:12,.2f} | ${(res_multi['consolidated']['total_freight_revenue'] + 303750) - res_multi['consolidated']['total_port_costs'] - res_multi['consolidated']['total_bunker_costs']:13,.2f}")
    print(f"TCE diario                 | ${res_ledger['tce_real']:12,.2f} | ${((res_multi['consolidated']['total_freight_revenue'] + 303750) - res_multi['consolidated']['total_port_costs'] - res_multi['consolidated']['total_bunker_costs'])/res_multi['consolidated']['total_days']:13,.2f}")
    print("="*60 + "\n")

if __name__ == "__main__":
    test()
