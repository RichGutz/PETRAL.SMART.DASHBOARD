import psycopg2

conn_str = 'postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres'

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()

    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
    """)
    tables = [t[0] for t in cur.fetchall()]
    print('Tablas en la base de datos:', sorted(tables))

    for t in sorted(tables):
        if 'quote' in t or 'vessel' in t or 'route' in t:
            cur.execute(f"SELECT count(*) FROM {t};")
            cnt = cur.fetchone()[0]
            print(f"\n--- Tabla: {t} (Total filas: {cnt}) ---")
            if cnt > 0:
                cur.execute(f"SELECT * FROM {t} LIMIT 10;")
                colnames = [desc[0] for desc in cur.description]
                print(f"Columnas: {colnames}")
                rows = cur.fetchall()
                for r in rows:
                    # Print first 5 field values
                    print("  Row:", r[:5])

    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
