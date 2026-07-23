import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    print("=== REGISTROS EN routes_clients ===")
    cur.execute("SELECT route_id, name, description, pais FROM routes_clients;")
    for r in cur.fetchall():
        print(f"  • ID: {r[0]} | Name: {r[1]} | Desc: {r[2]} | País: {r[3]}")

    print("\n=== REGISTROS EN routes_prospects ===")
    cur.execute("SELECT spot_id, name, description, pais FROM routes_prospects;")
    for r in cur.fetchall():
        print(f"  • ID: {r[0]} | Name: {r[1]} | Desc: {r[2]} | País: {r[3]}")

    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
