import psycopg2

def create_admin():
    conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
    
    print("Conectando a Supabase PostgreSQL...")
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = True
        cur = conn.cursor()
        
        email = "rgutil@gmail.com"
        full_name = "Rich Gutz"
        password = "petral2026"
        role = "ADMIN"
        
        print(f"Insertando usuario {email} como {role}...")
        cur.execute(
            """
            INSERT INTO app_users (email, password_hash, full_name, role)
            VALUES (%s, crypt(%s, gen_salt('bf')), %s, %s)
            ON CONFLICT (email) DO UPDATE 
            SET role = EXCLUDED.role, full_name = EXCLUDED.full_name
            RETURNING id, email, role;
            """,
            (email, password, full_name, role)
        )
        row = cur.fetchone()
        print(f"¡Usuario creado/actualizado con éxito! ID: {row[0]} | Email: {row[1]} | Rol: {row[2]}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error al insertar el usuario: {e}")

if __name__ == "__main__":
    create_admin()
