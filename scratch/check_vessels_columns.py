import psycopg2

def check_columns():
    conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        print("Consultando estructura de la tabla 'vessels'...")
        cur.execute(
            """
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'vessels';
            """
        )
        rows = cur.fetchall()
        for r in rows:
            print(f"Columna: {r[0]} | Tipo: {r[1]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_columns()
