import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    
    print("1. Eliminando 'routes_master' (vista o tabla)...")
    try:
        cur.execute("DROP VIEW IF EXISTS routes_master CASCADE;")
    except Exception as ev:
        print(f"   Note view drop: {ev}")
    try:
        cur.execute("DROP TABLE IF EXISTS routes_master CASCADE;")
    except Exception as et:
        print(f"   Note table drop: {et}")
    print("   -> 'routes_master' eliminada exitosamente.")
    
    print("2. Renombrando 'routes_spot' a 'routes_quotes'...")
    # Verificar si routes_spot existe antes de renombrar
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'routes_spot'
        );
    """)
    exists_spot = cur.fetchone()[0]
    
    if exists_spot:
        cur.execute("ALTER TABLE routes_spot RENAME TO routes_quotes;")
        print("   -> Tabla 'routes_spot' renombrada a 'routes_quotes' exitosamente.")
    else:
        # Verificar si ya existe routes_quotes
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'routes_quotes'
            );
        """)
        exists_quotes = cur.fetchone()[0]
        if exists_quotes:
            print("   -> La tabla 'routes_quotes' ya existe.")
        else:
            print("   -> Ni 'routes_spot' ni 'routes_quotes' existen.")
            
    cur.close()
    conn.close()
    print("=== OPERACIÓN EN SUPABASE COMPLETADA CON ÉXITO ===")

except Exception as e:
    print(f"Error al ejecutar SQL en Supabase: {e}")
