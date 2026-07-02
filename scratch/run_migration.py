import psycopg2
import os

def run_migration():
    migration_file = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\supabase\migrations\20260702000001_port_costs_migration.sql"
    
    if not os.path.exists(migration_file):
        print(f"Error: {migration_file} no existe.")
        return
        
    print(f"Leyendo migración SQL desde {migration_file}...")
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql_commands = f.read()
        
    db_uri = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
    
    print("Conectándose a la base de datos Supabase...")
    conn = None
    try:
        conn = psycopg2.connect(db_uri)
        cur = conn.cursor()
        print("Ejecutando script de migración SQL...")
        cur.execute(sql_commands)
        conn.commit()
        print("¡Migración y seeding completados exitosamente en Supabase!")
        
        # Verificar que las nuevas tablas existan y tengan datos
        cur.execute("SELECT COUNT(*) FROM port_cost_concepts;")
        concepts_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM port_costs_matrix;")
        matrix_count = cur.fetchone()[0]
        print(f"Verificación: {concepts_count} conceptos creados, {matrix_count} tarifas sembradas.")
        
        cur.close()
    except Exception as e:
        print(f"ERROR durante la migración: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    run_migration()
