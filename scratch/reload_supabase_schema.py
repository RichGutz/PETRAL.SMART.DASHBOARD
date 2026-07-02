import psycopg2

def reload_schema():
    db_uri = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
    conn = psycopg2.connect(db_uri)
    cur = conn.cursor()
    print("Recargando esquema de PostgREST en Supabase...")
    cur.execute("NOTIFY pgrst, 'reload schema';")
    conn.commit()
    print("¡Notificación de recarga enviada con éxito!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    reload_schema()
