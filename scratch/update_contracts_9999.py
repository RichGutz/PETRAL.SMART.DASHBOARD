import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()

    print("Actualizando tabla contracts: reemplazando 9999 por 0 en load_rate y discharge_rate...")
    cur.execute("""
        UPDATE public.contracts 
        SET load_rate = 0 
        WHERE load_rate = 9999;
        
        UPDATE public.contracts 
        SET discharge_rate = 0 
        WHERE discharge_rate = 9999;
    """)
    print("Filas actualizadas exitosamente.")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cur' in locals(): cur.close()
    if 'conn' in locals(): conn.close()
