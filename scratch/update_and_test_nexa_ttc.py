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
    if not row:
        print("No se encontró la ruta")
        return

    name, client_id, legs_data = row
    puertos = legs_data.get("puertosConfig", [])
    
    # Asegurar Time to Count = 6 en Callao (idx 1) y Matarani (idx 2)
    if len(puertos) >= 3:
        puertos[1]["overhead"] = "6"
        puertos[1]["time_to_count"] = 6
        puertos[2]["overhead"] = "6"
        puertos[2]["time_to_count"] = 6

    legs_data["puertosConfig"] = puertos
    
    # Guardar en routes_quotes
    cur.execute("""
        UPDATE routes_quotes 
        SET legs_data = %s 
        WHERE name = 'NEXA.ILO.CALLAO.MATARANI.ILO (12.08.26)';
    """, (json.dumps(legs_data),))

    # Guardar también en routes_clients si existe
    cur.execute("""
        UPDATE routes_clients 
        SET legs_data = %s 
        WHERE name = 'NEXA.ILO.CALLAO.MATARANI.ILO (12.08.26)';
    """, (json.dumps(legs_data),))

    conn.commit()
    print("✅ Actualizado en BD con time_to_count = 6 en Callao y Matarani.")

    # Ahora simular con spot_engine
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
    for idx, tr in enumerate(legs_data.get("tramos", [])):
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
            "time_to_count_carga_hrs": float(p_orig.get("time_to_count") or p_orig.get("overhead") or 0),
            "time_to_count_descarga_hrs": float(p_dest.get("time_to_count") or p_dest.get("overhead") or 0),
            "positioning_carga_hrs": float(p_orig.get("positioning") or 0),
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
    print("\n--- MÉTRICAS CON TIME TO COUNT = 6H EN CALLAO Y MATARANI ---")
    print(f"Distancia Total: {res.get('consolidated', {}).get('total_distance')} NM")
    print(f"Días Navegación (Sea Days): {res.get('consolidated', {}).get('total_sea_days'):.2f} d")
    print(f"Días Puerto (Port Days): {res.get('consolidated', {}).get('total_port_days'):.3f} d")
    print(f"Días Totales: {res.get('consolidated', {}).get('total_days'):.2f} d")
    print(f"Ingreso Flete: ${res.get('consolidated', {}).get('total_freight_revenue'):,.2f}")
    print(f"Costos Bunker: ${res.get('consolidated', {}).get('total_bunker_costs'):,.2f}")
    print(f"Costos Puerto: ${res.get('consolidated', {}).get('total_port_costs'):,.2f}")
    print(f"Utilidad Neta (Voyage Result): ${res.get('consolidated', {}).get('pnl_net_utility'):,.2f}")
    print(f"TCE Realizado: ${res.get('consolidated', {}).get('tce_real'):,.2f} / día")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
