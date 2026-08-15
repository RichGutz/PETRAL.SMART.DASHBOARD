import psycopg2
import json

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def main():
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()

    print("================================================================================")
    print("REVISIÓN DE TABLAS 'contracts' Y 'routes_quotes' - ESPECIAL: NEXA (12.08.26)")
    print("================================================================================")

    # 1. Contratos en 'contracts'
    cur.execute("""
        SELECT contract_id, client_id, name, description, valid_from, valid_to, is_active, 
               created_at, created_by, legs_data
        FROM contracts
        ORDER BY created_at DESC;
    """)
    contracts = cur.fetchall()
    print(f"\n1. REGISTROS EN TABLA 'contracts' ({len(contracts)} filas):")
    for c in contracts:
        has_legs = c[9] is not None
        tramos_cnt = len(c[9].get("tramos", [])) if has_legs and isinstance(c[9], dict) else 0
        print(f"  • [{c[0]}] Name: '{c[2]}' | Client: {c[1]} | Validez: {c[4]} a {c[5]} | Tramos en legs_data: {tramos_cnt}")

    # 2. Cotizaciones en 'routes_quotes'
    cur.execute("""
        SELECT name, description, client_id, valid_from, valid_to, created_at, created_by, legs_data
        FROM routes_quotes
        ORDER BY created_at DESC;
    """)
    quotes = cur.fetchall()
    print(f"\n2. REGISTROS EN TABLA 'routes_quotes' ({len(quotes)} filas):")
    for q in quotes:
        has_legs = q[7] is not None
        tramos_cnt = len(q[7].get("tramos", [])) if has_legs and isinstance(q[7], dict) else 0
        print(f"  • Name: '{q[0]}' | Client: {q[2]} | Validez: {q[3]} a {q[4]} | Tramos: {tramos_cnt} | Creado: {q[5]}")

    # 3. Inspección detallada de NEXA.ILO.CALLAO.MATARANI.ILO (12.08.26)
    cur.execute("""
        SELECT name, description, client_id, origin_port_id, destination_port_id, valid_from, valid_to, created_at, created_by, legs_data
        FROM routes_quotes
        WHERE name ILIKE '%12.08.26%' OR name = 'NEXA.ILO.CALLAO.MATARANI.ILO (12.08.26)';
    """)
    row = cur.fetchone()
    if row:
        print("\n3. DETALLE COMPLETO DE 'NEXA.ILO.CALLAO.MATARANI.ILO (12.08.26)' EN 'routes_quotes':")
        cols = [d[0] for d in cur.description]
        d = dict(zip(cols, row))
        print(f"  - Name: {d['name']}")
        print(f"  - Description: {d['description']}")
        print(f"  - Client ID: {d['client_id']}")
        print(f"  - Origin / Destination: {d['origin_port_id']} -> {d['destination_port_id']}")
        print(f"  - Valid From / To: {d['valid_from']} -> {d['valid_to']}")
        print(f"  - Created At: {d['created_at']}")
        print(f"  - Created By: {d['created_by']}")
        print(f"\n  - LEGS_DATA JSONB:")
        legs = d['legs_data']
        print(f"    * is_multicotizador: {legs.get('is_multicotizador')}")
        print(f"    * bunker_price_ifo: {legs.get('bunker_price_ifo')}")
        print(f"    * bunker_price_mdo: {legs.get('bunker_price_mdo')}")
        print(f"    * addressCommPct: {legs.get('addressCommPct')}")
        print(f"    * brokerCommPct: {legs.get('brokerCommPct')}")
        print(f"    * Tramos ({len(legs.get('tramos', []))} tramos):")
        for idx, tr in enumerate(legs.get('tramos', [])):
            print(f"      [{idx+1}] {tr.get('origin_port_id')} -> {tr.get('destination_port_id')} | Type: {tr.get('type')} | Q: {tr.get('quantity')} MT | Flete: ${tr.get('freight_rate')}/MT | Dist: {tr.get('route_distance')} NM | Speed: {tr.get('speed')} kn")
        print(f"    * PuertosConfig ({len(legs.get('puertosConfig', []))} puertos):")
        for idx, pc in enumerate(legs.get('puertosConfig', [])):
            print(f"      [Puerto {idx}] Action: {pc.get('action')} | Rate: {pc.get('op_rate')} {pc.get('rate_unit')} | Q: {pc.get('quantity')} | Flete: {pc.get('freight_rate')} | Overhead: {pc.get('overhead')} | Pos: {pc.get('positioning')} | PortCost: ${pc.get('manual_port_cost')}")
    else:
        print("\n⚠️ No se encontró 'NEXA.ILO.CALLAO.MATARANI.ILO (12.08.26)' en 'routes_quotes'.")

    # 4. Verificar si existe en 'contracts'
    cur.execute("""
        SELECT * FROM contracts WHERE name ILIKE '%12.08.26%' OR name ILIKE '%NEXA.ILO.CALLAO.MATARANI.ILO%';
    """)
    c_rows = cur.fetchall()
    print(f"\n4. RUTAS NEXA.ILO.CALLAO.MATARANI.ILO EN 'contracts' ({len(c_rows)} encontradas):")
    for r in c_rows:
        print(f"  • {r[2]} (ID: {r[0]})")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
