import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def inspect_columns(table_name):
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    cur.execute(f"""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '{table_name}'
        ORDER BY ordinal_position;
    """)
    rows = cur.fetchall()
    print(f"\n--- Columns in {table_name} ---")
    for r in rows:
        print(f"  {r[0]} ({r[1]}, nullable={r[2]})")
    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect_columns("routes_quotes")
    inspect_columns("routes_clients")
