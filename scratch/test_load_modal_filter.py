import sys
import psycopg2
import json

sys.stdout.reconfigure(encoding='utf-8')

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def audit_spot_list():
    print("=== AUDITORÍA DEL ENDPOINT SPOT/LIST Y FILTRADO DEL LOAD MODAL ===")
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()

    # 1. Obtener registros de routes_clients
    cur.execute("SELECT route_id, name, description, legs_data, created_at FROM routes_clients;")
    clients = cur.fetchall()
    print(f"\n1. Registros en 'routes_clients': {len(clients)}")
    for c in clients:
        r_id, r_name, r_desc, r_legs, r_date = c
        has_legs = r_legs is not None
        legs_type = type(r_legs).__name__
        print(f"  • ID: {r_id} | Name: {r_name} | Legs Present: {has_legs} ({legs_type})")
        if isinstance(r_legs, dict):
            print(f"    - Keys en legs_data: {list(r_legs.keys())}")
        elif isinstance(r_legs, list):
            print(f"    - legs_data es una lista con {len(r_legs)} tramos.")

    # 2. Obtener registros de routes_quotes
    cur.execute("SELECT spot_id, name, description, legs_data, created_at FROM routes_quotes;")
    quotes = cur.fetchall()
    print(f"\n2. Registros en 'routes_quotes': {len(quotes)}")
    for q in quotes:
        r_id, r_name, r_desc, r_legs, r_date = q
        has_legs = r_legs is not None
        legs_type = type(r_legs).__name__
        print(f"  • ID: {r_id} | Name: {r_name} | Legs Present: {has_legs} ({legs_type})")

    # 3. Simular el filtro exacto que usa la UI cuando filterActivo = true y selectedClient = 'SPCC'
    print("\n3. PROBANDO FILTRO DE LA UI PARA 'Activos' + Client='SPCC':")
    all_spots = []
    for c in clients:
        all_spots.append({
            "spot_id": c[0],
            "name": c[1],
            "description": c[2],
            "legs_data": c[3],
            "created_at": str(c[4]),
            "is_prospect": False
        })
    for q in quotes:
        all_spots.append({
            "spot_id": q[0],
            "name": q[1],
            "description": q[2],
            "legs_data": q[3],
            "created_at": str(q[4]),
            "is_prospect": True
        })

    filterActivo = True
    filterProspecto = False
    selectedClient = 'SPCC'

    filtered_spcc = []
    for s in all_spots:
        name = (s.get('name') or '').upper()
        desc = (s.get('description') or '').upper()
        isProspectRoute = s.get('is_prospect') is True or 'PROSPECTO' in desc or name.startswith('PROSPECT')

        if filterActivo and isProspectRoute:
            continue
        if filterProspecto and not isProspectRoute:
            continue

        if selectedClient:
            clientUpper = selectedClient.upper()
            if clientUpper not in name and clientUpper not in desc and s.get('client_id') != selectedClient:
                continue

        if not s.get('legs_data'):
            continue

        filtered_spcc.append(s)

    print(f"  -> Resultado para SPCC: {len(filtered_spcc)} rutas encontradas.")
    for f in filtered_spcc:
        print(f"     ✅ Ruta: {f['name']} ({f['description']})")

    cur.close()
    conn.close()

if __name__ == "__main__":
    audit_spot_list()
