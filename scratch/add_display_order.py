import psycopg2

db_uri = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def run_migrations():
    conn = psycopg2.connect(db_uri)
    conn.autocommit = True
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE vessels ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 99;")
        print("Columna display_order agregada a vessels.")
    except Exception as e:
        print("Error alter table:", e)

    # Set initial order
    try:
        cursor.execute("UPDATE vessels SET display_order = 1 WHERE vessel_id = 'MOQUEGUA';")
        cursor.execute("UPDATE vessels SET display_order = 2 WHERE vessel_id = 'MARCONA';")
        cursor.execute("UPDATE vessels SET display_order = 3 WHERE vessel_id = 'HUEMUL';")
        cursor.execute("UPDATE vessels SET display_order = 4 WHERE vessel_id = 'COCON';")
        print("Orden inicial establecido.")
    except Exception as e:
        print("Error actualizando orden:", e)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    run_migrations()
