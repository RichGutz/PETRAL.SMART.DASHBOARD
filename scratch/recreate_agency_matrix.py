import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def run():
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    
    print("1. Creando tabla agency_matrix...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.agency_matrix (
            client_id VARCHAR NOT NULL,
            port_id VARCHAR NOT NULL,
            operation_type VARCHAR NOT NULL,
            vessel_id VARCHAR NOT NULL DEFAULT 'DEFAULT',
            cost NUMERIC NOT NULL,
            PRIMARY KEY (client_id, port_id, operation_type, vessel_id)
        );
    """)
    
    print("2. Deshabilitando RLS en agency_matrix para libre acceso...")
    cur.execute("ALTER TABLE public.agency_matrix DISABLE ROW LEVEL SECURITY;")
    
    print("3. Limpiando datos existentes en agency_matrix...")
    cur.execute("TRUNCATE TABLE public.agency_matrix;")
    
    # Datos a insertar
    rows = [
        # TABLONES
        ("SPCC", "ILO", "CARGA", "TABLONES", 23000),
        ("SPCC", "MATARANI", "DESCARGA", "TABLONES", 18000),
        ("SPCC", "MARCONA", "DESCARGA", "TABLONES", 44000),
        ("SPCC", "MEJILLONES", "DESCARGA", "TABLONES", 32000),
        
        # MOQUEGUA
        ("SPCC", "ILO", "CARGA", "MOQUEGUA", 22000),
        ("SPCC", "MATARANI", "DESCARGA", "MOQUEGUA", 17000),
        ("SPCC", "MARCONA", "DESCARGA", "MOQUEGUA", 40000),
        ("SPCC", "MEJILLONES", "DESCARGA", "MOQUEGUA", 29000),
        
        # CONCON_TRADER
        ("SPCC", "ILO", "CARGA", "CONCON_TRADER", 23500),
        ("SPCC", "MATARANI", "DESCARGA", "CONCON_TRADER", 19000),
        ("SPCC", "MARCONA", "DESCARGA", "CONCON_TRADER", 61000),
        ("SPCC", "MEJILLONES", "DESCARGA", "CONCON_TRADER", 60000),
        
        # DEFAULT
        ("DEFAULT", "ILO", "CARGA", "DEFAULT", 25500),
        ("DEFAULT", "MATARANI", "DESCARGA", "DEFAULT", 21000),
    ]
    
    # Agregar placeholders de 9999 para otros puertos/operaciones para DEFAULT
    ports = ["BARQUITO", "CALLAO", "TALARA", "MARCONA", "MEJILLONES", "ILO", "MATARANI"]
    for p in ports:
        for op in ["CARGA", "DESCARGA"]:
            # Solo insertar si no existe en los defaults especificos anteriores
            if not ((p == "ILO" and op == "CARGA") or (p == "MATARANI" and op == "DESCARGA")):
                rows.append(("DEFAULT", p, op, "DEFAULT", 9999))
                rows.append(("SPCC", p, op, "DEFAULT", 9999))
                
    print(f"4. Insertando {len(rows)} filas en agency_matrix...")
    for row in rows:
        cur.execute("""
            INSERT INTO public.agency_matrix (client_id, port_id, operation_type, vessel_id, cost)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (client_id, port_id, operation_type, vessel_id)
            DO UPDATE SET cost = EXCLUDED.cost;
        """, row)
        
    print("5. Confirmando conteo de filas...")
    cur.execute("SELECT COUNT(*) FROM public.agency_matrix;")
    count = cur.fetchone()[0]
    print(f"Total de registros cargados en agency_matrix: {count}")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    run()
