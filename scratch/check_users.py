import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()

    # List all tables in public schema
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    tables = cur.fetchall()
    print("Tablas en public schema:", [t[0] for t in tables])

    # Check users table if exists
    user_tables = [t[0] for t in tables if 'user' in t[0] or 'auth' in t[0] or 'role' in t[0]]
    print("\nTablas relacionadas con usuarios:", user_tables)

    for table in user_tables:
        try:
            cur.execute(f"SELECT * FROM public.{table} LIMIT 10;")
            rows = cur.fetchall()
            cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}';")
            cols = [c[0] for c in cur.fetchall()]
            print(f"\n--- Contenido de {table} (columnas: {cols}) ---")
            for r in rows:
                print(r)
        except Exception as e:
            print(f"Error al leer {table}: {e}")

    cur.close()
    conn.close()

except Exception as ex:
    print("Error conectando a BD:", ex)
