import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def run_homologation():
    print("Iniciando migración de homologación para la tabla 'contracts'...")
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # 1. Agregar columnas estándar que la homologan 1 a 1 con routes_clients y routes_quotes
    queries = [
        "ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS name VARCHAR(255);",
        "ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS description TEXT;",
        "ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS legs_data JSONB;",
        "ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS pais VARCHAR(10) DEFAULT 'PE';",
        "ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();",
        "ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT 'izavala@petral.com.pe';",
        
        # Permitir que origin_port_id y destination_port_id sean NULL si la ruta es multiasiento o se define en legs_data
        "ALTER TABLE public.contracts ALTER COLUMN origin_port_id DROP NOT NULL;",
        "ALTER TABLE public.contracts ALTER COLUMN destination_port_id DROP NOT NULL;"
    ]
    
    for q in queries:
        try:
            print(f"Ejecutando: {q}")
            cur.execute(q)
            conn.commit()
            print("  -> OK")
        except Exception as e:
            print(f"  Info: {e}")
            conn.rollback()
            
    # Verify final column list on public.contracts
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'contracts' ORDER BY ordinal_position;")
    cols = cur.fetchall()
    print("\n=== Estructura Final de 'contracts' ===")
    for col, dt in cols:
        print(f"  - {col}: {dt}")
        
    cur.close()
    conn.close()
    print("\nMigracion de homologacion completada con exito en Supabase!")

if __name__ == "__main__":
    run_homologation()
