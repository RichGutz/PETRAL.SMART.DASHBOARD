import psycopg2

def check_columns():
    db_uri = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
    conn = psycopg2.connect(db_uri)
    cur = conn.cursor()
    
    # 1. Columnas de vessels
    print("=== COLUMNAS DE LA TABLA vessels ===")
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'vessels';
    """)
    for row in cur.fetchall():
        print(f"Columna: {row[0]:30} | Tipo: {row[1]}")
        
    # 2. Contenido de Moquegua directo de Postgres
    print("\n=== REGISTRO MOQUEGUA DIRECTO DE POSTGRES ===")
    cur.execute("SELECT * FROM vessels WHERE vessel_id = 'MOQUEGUA';")
    colnames = [desc[0] for desc in cur.description]
    moquegua_row = cur.fetchone()
    if moquegua_row:
        for col, val in zip(colnames, moquegua_row):
            print(f"  {col:30} = {val}")
            
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_columns()
