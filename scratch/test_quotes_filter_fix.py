import psycopg2
import sys
sys.stdout.reconfigure(encoding='utf-8')

conn_str = 'postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres'

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()

    cur.execute("SELECT route_id as spot_id, name, description, legs_data, created_at FROM routes_clients;")
    clients_rows = cur.fetchall()
    res_clients = []
    for r in clients_rows:
        res_clients.append({
            'spot_id': r[0],
            'name': r[1],
            'description': r[2],
            'legs_data': r[3],
            'created_at': str(r[4]),
            'is_prospect': False,
            'is_quote': False,
            'table_source': 'routes_clients'
        })

    cur.execute("SELECT spot_id, name, description, legs_data, created_at FROM routes_quotes;")
    quotes_rows = cur.fetchall()
    res_prospects = []
    for r in quotes_rows:
        res_prospects.append({
            'spot_id': r[0],
            'name': r[1],
            'description': r[2],
            'legs_data': r[3],
            'created_at': str(r[4]),
            'is_prospect': True,
            'is_quote': True,
            'table_source': 'routes_quotes'
        })

    all_routes = res_clients + res_prospects
    print(f"Total registros retornados por /spot/list: {len(all_routes)}")

    def is_prospect_quote(r):
        if r.get('table_source') == 'routes_quotes' or r.get('is_prospect') is True or r.get('is_quote') is True:
            return True
        name = (r.get('name') or '').lower()
        desc = (r.get('description') or '').lower()
        if name.startswith('prospect') or 'prospecto' in desc or 'routes_quotes' in desc:
            return True
        return False

    quotes_filtered = [r for r in all_routes if is_prospect_quote(r)]
    routes_filtered = [r for r in all_routes if not is_prospect_quote(r)]

    print(f"\n[OK] Maestro de Cotizaciones (isQuotesMode=True): {len(quotes_filtered)} cotización(es) encontrada(s)")
    for q in quotes_filtered:
        print(f"  • ID: {q['spot_id'][:8]}... | Name: {q['name']} | Client: {q['description']}")

    print(f"\n[OK] Maestro de Rutas (isQuotesMode=False): {len(routes_filtered)} ruta(s) activa(s) encontrada(s)")
    for r in routes_filtered:
        print(f"  • ID: {r['spot_id'][:8]}... | Name: {r['name']}")

    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
