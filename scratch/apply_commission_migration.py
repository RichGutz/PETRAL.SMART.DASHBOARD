import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def run_migration():
    print("Iniciando migración de comisiones en Supabase...")
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    
    # 1. Agregar columnas en la tabla contracts
    print("Añadiendo columnas de comisiones a 'contracts'...")
    cur.execute("ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS address_commission NUMERIC DEFAULT 0.0;")
    cur.execute("ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS broker_commission NUMERIC DEFAULT 0.0;")
    
    print("Columnas agregadas con éxito (si no existían).")
    
    cur.close()
    conn.close()
    print("Migración completada exitosamente.")

if __name__ == "__main__":
    run_migration()
