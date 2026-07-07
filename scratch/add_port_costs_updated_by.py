import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    
    cur.execute("""
    ALTER TABLE port_cost_static 
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR DEFAULT 'ADMIN';
    """)
    print("Columna 'updated_by' añadida con éxito a port_cost_static.")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cur' in locals(): cur.close()
    if 'conn' in locals(): conn.close()
