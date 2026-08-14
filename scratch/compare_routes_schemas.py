import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def inspect_routes_tables():
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    tables = ["routes_clients", "routes_quotes", "contracts"]
    for t in tables:
        cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{t}' ORDER BY ordinal_position;")
        cols = cur.fetchall()
        print(f"\n=== Table: {t} ===")
        for col, dt in cols:
            print(f"  - {col}: {dt}")
            
    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect_routes_tables()
