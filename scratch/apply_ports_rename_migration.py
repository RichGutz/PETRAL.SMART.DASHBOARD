import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def run_migration():
    print("Iniciando migración de reglas comerciales en la tabla ports...")
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    
    # 1. Agregar nuevas columnas
    print("Agregando nuevas columnas a 'ports'...")
    cur.execute("ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS time_to_count_carga_hrs NUMERIC DEFAULT 6.0;")
    cur.execute("ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS time_to_count_descarga_hrs NUMERIC DEFAULT 6.0;")
    cur.execute("ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS maneuver_carga_hrs NUMERIC DEFAULT 0.0;")
    cur.execute("ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS maneuver_descarga_hrs NUMERIC DEFAULT 0.0;")
    
    # 2. Copiar datos desde las columnas antiguas
    print("Migrando valores de columnas antiguas a las nuevas...")
    cur.execute("""
        UPDATE public.ports 
        SET 
            time_to_count_carga_hrs = COALESCE(overhead_carga_hrs, 6.0),
            time_to_count_descarga_hrs = COALESCE(overhead_descarga_hrs, 6.0),
            maneuver_carga_hrs = COALESCE(positioning_carga_hrs, 0.0),
            maneuver_descarga_hrs = COALESCE(positioning_descarga_hrs, 0.0);
    """)
    print(f"  Modificados en ports: {cur.rowcount} registros.")
    
    cur.close()
    conn.close()
    print("¡Migración de puertos completada exitosamente!")

if __name__ == "__main__":
    run_migration()
