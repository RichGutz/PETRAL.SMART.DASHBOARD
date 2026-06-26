import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()

    print("Agregando columnas de overhead a la tabla ports...")
    cur.execute("""
        ALTER TABLE public.ports 
        ADD COLUMN IF NOT EXISTS overhead_carga_hrs NUMERIC NOT NULL DEFAULT 6.0,
        ADD COLUMN IF NOT EXISTS overhead_descarga_hrs NUMERIC NOT NULL DEFAULT 6.0;
    """)
    print("Columnas creadas exitosamente con valor por defecto de 6.0.")

    # Verificando la data
    cur.execute("SELECT port_id, overhead_carga_hrs, overhead_descarga_hrs FROM public.ports LIMIT 5;")
    rows = cur.fetchall()
    for row in rows:
        print(f"Puerto: {row[0]}, Overhead Carga: {row[1]}h, Overhead Descarga: {row[2]}h")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cur' in locals(): cur.close()
    if 'conn' in locals(): conn.close()
