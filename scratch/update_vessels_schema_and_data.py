import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def run():
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    
    print("1. Agregando columnas length y beam a la tabla vessels si no existen...")
    cur.execute("""
        ALTER TABLE public.vessels 
        ADD COLUMN IF NOT EXISTS length NUMERIC,
        ADD COLUMN IF NOT EXISTS beam NUMERIC;
    """)
    
    # Valores de actualización
    updates = [
        ("MOQUEGUA", 134, 20),
        ("TABLONES", 159, 23),
        ("CONCON_TRADER", 146, 24),
        ("HUEMUL", 161, 23)
    ]
    
    print("2. Actualizando datos de length y beam para cada buque...")
    for vessel_id, length, beam in updates:
        cur.execute("""
            UPDATE public.vessels 
            SET length = %s, beam = %s 
            WHERE vessel_id = %s;
        """, (length, beam, vessel_id))
        print(f"   - {vessel_id} actualizado: Length={length}m, Beam={beam}m")
        
    print("3. Verificando los cambios...")
    cur.execute("SELECT vessel_id, length, beam FROM public.vessels;")
    rows = cur.fetchall()
    for row in rows:
        print(f"   Buque: {row[0]} | Length: {row[1]}m | Beam: {row[2]}m")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    run()
