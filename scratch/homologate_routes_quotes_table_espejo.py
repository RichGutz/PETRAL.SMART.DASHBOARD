import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def run_homologation():
    print("=========================================================================")
    print("  HOMOLOGACIÓN ESPEJO 1:1: MISMAS COLUMNAS EN 'routes_quotes' QUE EN 'contracts'")
    print("=========================================================================\n")
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # 1. Agregar las mismas columnas de contracts a routes_quotes
    queries = [
        "ALTER TABLE public.routes_quotes ADD COLUMN IF NOT EXISTS client_id VARCHAR(255);",
        "ALTER TABLE public.routes_quotes ADD COLUMN IF NOT EXISTS origin_port_id VARCHAR(100);",
        "ALTER TABLE public.routes_quotes ADD COLUMN IF NOT EXISTS destination_port_id VARCHAR(100);",
        "ALTER TABLE public.routes_quotes ADD COLUMN IF NOT EXISTS name VARCHAR(255);",
        "ALTER TABLE public.routes_quotes ADD COLUMN IF NOT EXISTS description TEXT;",
        "ALTER TABLE public.routes_quotes ADD COLUMN IF NOT EXISTS legs_data JSONB;",
        "ALTER TABLE public.routes_quotes ADD COLUMN IF NOT EXISTS valid_from VARCHAR(100);",
        "ALTER TABLE public.routes_quotes ADD COLUMN IF NOT EXISTS valid_to VARCHAR(100);",
        "ALTER TABLE public.routes_quotes ADD COLUMN IF NOT EXISTS pais VARCHAR(10) DEFAULT 'PE';",
        "ALTER TABLE public.routes_quotes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();",
        "ALTER TABLE public.routes_quotes ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT 'izavala@petral.com.pe';"
    ]
    
    for q in queries:
        try:
            print(f"Ejecutando DDL: {q}")
            cur.execute(q)
            conn.commit()
            print("  -> OK")
        except Exception as e:
            print(f"  Info: {e}")
            conn.rollback()

    # 2. Migrar los 11 registros desde routes_clients hacia routes_quotes
    print("\nMigrando los 11 registros de 'routes_clients' a 'routes_quotes'...")
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'routes_clients';")
    rc_cols = [c[0] for c in cur.fetchall()]
    print(f"  Columnas reales en routes_clients: {rc_cols}")

    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'routes_quotes';")
    rq_cols = [c[0] for c in cur.fetchall()]
    print(f"  Columnas reales en routes_quotes: {rq_cols}")

    cur.execute("SELECT * FROM public.routes_clients;")
    rc_rows = cur.fetchall()
    
    migrated = 0
    for row in rc_rows:
        row_dict = dict(zip(rc_cols, row))
        name_str = row_dict.get("name") or row_dict.get("route_id") or row_dict.get("id") or "Ruta_Cotizada"
        client_id = "SPCC" if str(name_str).upper().startswith("SPCC") else "NEXA"
        legs_data = row_dict.get("legs_data") or {}
        
        # Verificar si ya existe por name
        cur.execute("SELECT name FROM public.routes_quotes WHERE name = %s;", (str(name_str),))
        exists = cur.fetchone()
        
        desc = row_dict.get("description")
        
        if not exists:
            cur.execute("""
                INSERT INTO public.routes_quotes (name, description, legs_data, client_id)
                VALUES (%s, %s, %s, %s);
            """, (str(name_str), desc, psycopg2.extras.Json(legs_data or {}), client_id))
            migrated += 1
            print(f"  [INSERTADO EN DB] {name_str} ({client_id})")
        else:
            cur.execute("""
                UPDATE public.routes_quotes 
                SET client_id = %s, legs_data = %s, description = %s
                WHERE name = %s;
            """, (client_id, psycopg2.extras.Json(legs_data or {}), desc, str(name_str)))
            print(f"  [ACTUALIZADO EN DB] {name_str} ({client_id})")
            
    conn.commit()
    print(f"\nMigración completada: {migrated} nuevas cotizaciones insertadas.")

    # 3. Mostrar estructura final de ambas tablas
    print("\n=== ESTRUCTURA DE 'contracts' ===")
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'contracts' ORDER BY ordinal_position;")
    for c, dt in cur.fetchall():
        print(f"  - {c}: {dt}")

    print("\n=== ESTRUCTURA DE 'routes_quotes' ===")
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'routes_quotes' ORDER BY ordinal_position;")
    for c, dt in cur.fetchall():
        print(f"  - {c}: {dt}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    import psycopg2.extras
    run_homologation()
