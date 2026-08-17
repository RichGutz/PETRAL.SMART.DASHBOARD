import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def check_distances_db():
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # List tables that might hold distances
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND (table_name LIKE '%dist%' OR table_name LIKE '%rout%');
    """)
    tables = cur.fetchall()
    print("Distance/Route tables in DB:", tables)
    
    for t_tuple in tables:
        t = t_tuple[0]
        cur.execute(f"SELECT count(*) FROM {t};")
        cnt = cur.fetchone()[0]
        print(f"Table {t}: {cnt} rows")
        if cnt > 0 and cnt < 50:
            cur.execute(f"SELECT * FROM {t} LIMIT 5;")
            cols = [desc[0] for desc in cur.description]
            print(f"  Columns: {cols}")
            for r in cur.fetchall():
                print(f"  Sample: {r}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    check_distances_db()
