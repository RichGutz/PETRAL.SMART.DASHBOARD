import psycopg2

def reset_passwords():
    conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
    
    print("Conectando a Supabase PostgreSQL...")
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Actualizando contraseñas a 'petral2026' para todos los usuarios...")
        cur.execute(
            """
            UPDATE app_users 
            SET password_hash = crypt('petral2026', gen_salt('bf'));
            """
        )
        print(f"¡Contraseñas actualizadas con éxito! Filas afectadas: {cur.rowcount}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error al resetear contraseñas: {e}")

if __name__ == "__main__":
    reset_passwords()
