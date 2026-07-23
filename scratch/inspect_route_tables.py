import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    for table_name in ["routes_clients", "routes_prospects", "routes_quotes"]:
        cur.execute(f"""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = '{table_name}';
        """)
        cols = cur.fetchall()
        print(f"\n=== TABLA: {table_name} ({len(cols)} columnas) ===")
        for col in cols:
            print(f"  • {col[0]}: {col[1]}")
            
    cur.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
