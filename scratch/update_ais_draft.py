import psycopg2

db_uri = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def run_migrations():
    conn = psycopg2.connect(db_uri)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. Add ais_type, draft_m to vessels
    try:
        cursor.execute("ALTER TABLE vessels ADD COLUMN IF NOT EXISTS ais_type VARCHAR;")
        cursor.execute("ALTER TABLE vessels ADD COLUMN IF NOT EXISTS draft_m NUMERIC;")
        print("Columnas ais_type, draft_m agregadas a vessels.")
    except Exception as e:
        print("Error en alter table vessels:", e)

    # 2. Update existing vessels
    updates = [
        ('MARCONA', 'Tanker (HAZ-B)', 6.1),
        ('MOQUEGUA', 'Cargo ship (HAZ-B)', 9.4),
        ('COCON', 'Tanker', 6.0),
        ('HUEMUL', 'Tanker (HAZ-B)', 6.3)
    ]
    
    for v_id, ais_type, draft_m in updates:
        try:
            cursor.execute("""
            UPDATE vessels SET ais_type=%s, draft_m=%s WHERE vessel_id=%s;
            """, (ais_type, draft_m, v_id))
            print(f"Actualizado {v_id}")
        except Exception as e:
            print(f"Error actualizando {v_id}:", e)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    run_migrations()
