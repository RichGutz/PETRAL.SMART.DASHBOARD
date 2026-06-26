import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()

    print("Agregando columna additional_expenses a audit_benchmarks...")
    cur.execute("""
        ALTER TABLE public.audit_benchmarks 
        ADD COLUMN IF NOT EXISTS additional_expenses NUMERIC DEFAULT 0;
    """)
    print("Columna agregada exitosamente.")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cur' in locals(): cur.close()
    if 'conn' in locals(): conn.close()
