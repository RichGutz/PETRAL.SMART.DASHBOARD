import psycopg2

def add_column():
    conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Agregando columna 'image_url' a la tabla 'vessels'...")
        cur.execute(
            """
            ALTER TABLE vessels 
            ADD COLUMN IF NOT EXISTS image_url text;
            """
        )
        print("¡Columna agregada exitosamente en Supabase!")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error al agregar columna: {e}")

if __name__ == "__main__":
    add_column()
