import psycopg2

db_uri = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def run_migrations():
    conn = psycopg2.connect(db_uri)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. Add color_hex to vessels
    try:
        cursor.execute("ALTER TABLE vessels ADD COLUMN IF NOT EXISTS color_hex VARCHAR(7);")
        print("Agregado color_hex a vessels.")
    except Exception as e:
        print("Error en vessels:", e)

    # 2. Add color_hex to routes
    try:
        cursor.execute("ALTER TABLE routes ADD COLUMN IF NOT EXISTS color_hex VARCHAR(7);")
        print("Agregado color_hex a routes.")
    except Exception as e:
        print("Error en routes:", e)
        
    # 3. Create clients table
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS clients (
            client_id VARCHAR PRIMARY KEY,
            client_name VARCHAR,
            color_hex VARCHAR(7)
        );
        """)
        print("Tabla clients creada (o ya existía).")
        
        # Insert SPCC and SPOT with their colors
        cursor.execute("""
        INSERT INTO clients (client_id, client_name, color_hex) 
        VALUES 
            ('SPCC', 'Southern Peru Copper Corporation', '#0369A1'),
            ('SPOT', 'Spot Client', '#F97316')
        ON CONFLICT (client_id) DO UPDATE SET color_hex = EXCLUDED.color_hex;
        """)
        print("Clientes base insertados/actualizados.")
        
    except Exception as e:
        print("Error en clients:", e)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    run_migrations()
