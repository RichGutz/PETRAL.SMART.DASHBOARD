import psycopg2
import os

def apply_migration():
    conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
    sql_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\supabase\migrations\20260709000001_user_roles_permissions.sql"
    
    if not os.path.exists(sql_path):
        print(f"Error: No se encontró el archivo de migración en: {sql_path}")
        return
        
    print(f"Conectando a Supabase PostgreSQL...")
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Leyendo sentencias SQL del archivo...")
        with open(sql_path, "r", encoding="utf-8") as f:
            sql_queries = f.read()
            
        print("Aplicando migración en Supabase...")
        cur.execute(sql_queries)
        print("¡Migración aplicada exitosamente!")
        
        # Verificar que se crearon y sembraron
        cur.execute("SELECT email, full_name, role FROM app_users;")
        users = cur.fetchall()
        print("\nUsuarios registrados actualmente:")
        for user in users:
            print(f"- {user[0]} | {user[1]} | {user[2]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"\nOcurrió un error al aplicar la migración: {e}")

if __name__ == "__main__":
    apply_migration()
