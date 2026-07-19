import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def main():
    print("Conectando a la base de datos...")
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()

    try:
        # Añadir columna demurrage_rates
        sql_query = """
        ALTER TABLE contracts 
        ADD COLUMN IF NOT EXISTS demurrage_rates JSONB DEFAULT '{}'::jsonb;
        """
        cur.execute(sql_query)
        print("Columna 'demurrage_rates' (JSONB) agregada con éxito a la tabla 'contracts'.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
