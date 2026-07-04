import psycopg2

db_uri = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def run_migrations():
    conn = psycopg2.connect(db_uri)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. Add imo, mmsi, flag_ais to vessels
    try:
        cursor.execute("ALTER TABLE vessels ADD COLUMN IF NOT EXISTS imo VARCHAR;")
        cursor.execute("ALTER TABLE vessels ADD COLUMN IF NOT EXISTS mmsi VARCHAR;")
        cursor.execute("ALTER TABLE vessels ADD COLUMN IF NOT EXISTS flag_ais VARCHAR;")
        print("Columnas imo, mmsi, flag_ais agregadas a vessels.")
    except Exception as e:
        print("Error en alter table vessels:", e)

    # 2. Update existing vessels
    updates = [
        ('MARCONA', '9262869', '760000440', 'Peru'),
        ('MOQUEGUA', '9262869', '760000440', 'Peru'),
        ('COCON', '9800037', '374561000', 'Chile'),
        ('HUEMUL', '9371775', '725005708', 'Chile')
    ]
    
    for v_id, imo, mmsi, flag_ais in updates:
        try:
            cursor.execute("""
            UPDATE vessels SET imo=%s, mmsi=%s, flag_ais=%s WHERE vessel_id=%s;
            """, (imo, mmsi, flag_ais, v_id))
            print(f"Actualizado {v_id}")
        except Exception as e:
            print(f"Error actualizando {v_id}:", e)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    run_migrations()
