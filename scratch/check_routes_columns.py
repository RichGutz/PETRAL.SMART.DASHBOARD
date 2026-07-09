import psycopg2

def check_routes():
    conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        print("Consultando estructura de la tabla 'routes'...")
        cur.execute(
            """
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'routes';
            """
        )
        for r in cur.fetchall():
            print(f"Columna: {r[0]} | Tipo: {r[1]}")
            
        print("\nConsultando restricciones de clave primaria en 'routes'...")
        cur.execute(
            """
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'routes' AND tc.constraint_type = 'PRIMARY KEY';
            """
        )
        for r in cur.fetchall():
            print(f"Clave Primaria: {r[0]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_routes()
