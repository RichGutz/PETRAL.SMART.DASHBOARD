import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def run_migration():
    print("Iniciando creación y clonado de 'port_cost_static'...")
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    
    # 1. Crear la tabla port_cost_static
    print("Creando tabla public.port_cost_static...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.port_cost_static (
            client_id VARCHAR NOT NULL,
            port_id VARCHAR NOT NULL,
            operation_type VARCHAR NOT NULL,
            vessel_id VARCHAR NOT NULL DEFAULT 'DEFAULT',
            cost NUMERIC NOT NULL,
            PRIMARY KEY (client_id, port_id, operation_type, vessel_id)
        );
    """)
    
    # 2. Deshabilitar RLS para libre acceso
    print("Deshabilitando RLS en port_cost_static...")
    cur.execute("ALTER TABLE public.port_cost_static DISABLE ROW LEVEL SECURITY;")
    
    # 3. Limpiar por si acaso
    cur.execute("TRUNCATE TABLE public.port_cost_static;")
    
    # 4. Copiar todos los registros desde agency_matrix
    print("Copiando registros desde agency_matrix...")
    cur.execute("""
        INSERT INTO public.port_cost_static (client_id, port_id, operation_type, vessel_id, cost)
        SELECT client_id, port_id, operation_type, vessel_id, cost
        FROM public.agency_matrix;
    """)
    print(f"Copiados {cur.rowcount} registros con éxito.")
    
    cur.close()
    conn.close()
    print("¡Migración completada exitosamente!")

if __name__ == "__main__":
    run_migration()
