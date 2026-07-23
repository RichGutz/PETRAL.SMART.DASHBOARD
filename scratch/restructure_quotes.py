import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    
    print("1. Borrando la tabla/vista 'routes_quotes' existente...")
    try:
        cur.execute("DROP VIEW IF EXISTS routes_quotes CASCADE;")
    except Exception as ev:
        print(f"   Note: {ev}")
    try:
        cur.execute("DROP TABLE IF EXISTS routes_quotes CASCADE;")
    except Exception as et:
        print(f"   Note: {et}")
    print("   -> 'routes_quotes' eliminada exitosamente.")
    
    print("2. Renombrando 'routes_prospects' a 'routes_quotes'...")
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'routes_prospects'
        );
    """)
    exists_prospects = cur.fetchone()[0]
    
    if exists_prospects:
        cur.execute("ALTER TABLE routes_prospects RENAME TO routes_quotes;")
        print("   -> Tabla 'routes_prospects' renombrada a 'routes_quotes' exitosamente.")
    else:
        print("   -> La tabla 'routes_prospects' no existía.")
        
    cur.close()
    conn.close()
    print("=== REESTRUCTURACIÓN DE TABLAS EN SUPABASE COMPLETADA ===")

except Exception as e:
    print(f"Error en Supabase: {e}")
