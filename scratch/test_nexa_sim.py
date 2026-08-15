import sys
import os
sys.path.insert(0, r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

import psycopg2
import json

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def main():
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()

    cur.execute("""
        SELECT name, client_id, legs_data 
        FROM routes_quotes 
        WHERE name = 'NEXA.ILO.CALLAO.MATARANI.ILO (12.08.26)';
    """)
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        print("Error: No se encontró la ruta en routes_quotes")
        return

    name, client_id, legs_data = row
    tramos = legs_data.get("tramos", [])
    puertos = legs_data.get("puertosConfig", [])

    print(f"=== SIMULANDO: {name} ===")
    print(f"Cliente: {client_id}")

    from backend.database import get_supabase
    from backend.services.forecast_service import get_cached_masters
    from backend.spot_engine import calculate_multicotizador_simulation

    sb = get_supabase()
    masters = get_cached_masters(sb)
    vessels = masters.get("vessels", [])
    tablones = next((v for v in vessels if v.get("vessel_id") == "TABLONES"), vessels[0])

    vessel_params = dict(tablones)
    vessel_params["bunker_price_ifo"] = legs_data.get("bunker_price_ifo", 1100)
    vessel_params["bunker_price_mdo"] = legs_data.get("bunker_price_mdo", 1700)

    calculated_tramos = []
    for idx, tr in enumerate(tramos):
        p_orig = puertos[idx] if idx < len(puertos) else {}
        p_dest = puertos[idx + 1] if (idx + 1) < len(puertos) else {}

        calculated_tramos.append({
            "leg": idx + 1,
            "type": tr.get("type"),
            "origin_port_id": tr.get("origin_port_id"),
            "destination_port_id": tr.get("destination_port_id"),
            "quantity": tr.get("quantity", 0) if tr.get("type") == "LADEN" else 0,
            "freight_rate": tr.get("freight_rate", 0),
            "origin_op_rate": float(p_orig.get("op_rate") or 500),
            "dest_op_rate": float(p_dest.get("op_rate") or 400),
            "time_to_count_carga_hrs": float(p_orig.get("overhead") or p_orig.get("time_to_count") or 6),
            "time_to_count_descarga_hrs": float(p_dest.get("overhead") or p_dest.get("time_to_count") or 6),
            "positioning_carga_hrs": float(p_orig.get("positioning") or 1),
            "positioning_descarga_hrs": float(p_dest.get("positioning") or 0),
            "manual_agency_cost_origin": float(p_orig.get("manual_port_cost") or 0) if p_orig.get("manual_port_cost") != "" else None,
            "manual_agency_cost_dest": float(p_dest.get("manual_port_cost") or 0) if p_dest.get("manual_port_cost") != "" else None,
            "refacturar_muellaje_origin": True,
            "refacturar_muellaje_dest": True,
            "route_distance": float(tr.get("route_distance", 0)),
            "weather_factor": float(tr.get("weather_factor", 0.03)),
            "speed": float(tr.get("speed", 11.0))
        })

    payload = {
        "vessel_params": vessel_params,
        "tramos": calculated_tramos,
        "client_id": "NEXA",
        "address_commission_pct": 0,
        "broker_commission_pct": 0,
        "demurrage_rate": 0
    }

    res = calculate_multicotizador_simulation(payload)
    print("\nKeys returned by calculate_multicotizador_simulation:")
    print(list(res.keys()))
    print(json.dumps({k: v for k, v in res.items() if k != "audit_trail" and k != "audit_sheet_excel"}, indent=2, default=str))

if __name__ == "__main__":
    main()
