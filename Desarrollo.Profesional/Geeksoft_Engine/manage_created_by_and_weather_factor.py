import sys
import json
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def main():
    print("=" * 80)
    print(" 🛠️  MIGRACIÓN & AUDITORÍA: CREATED_BY & FIX WEATHER FACTOR EN SUPABASE")
    print("=" * 80)
    
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    
    # 1. Añadir la columna created_by en routes_clients si no existe
    print("\n1. Verificando/Creando columna 'created_by' en 'routes_clients'...")
    cur.execute("""
        ALTER TABLE routes_clients 
        ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'izavala@petral.com.pe';
    """)
    print("   ✅ Columna 'created_by' asegurada en 'routes_clients'.")

    # 2. Añadir la columna created_by en routes_quotes si no existe
    print("\n2. Verificando/Creando columna 'created_by' en 'routes_quotes'...")
    cur.execute("""
        ALTER TABLE routes_quotes 
        ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'izavala@petral.com.pe';
    """)
    print("   ✅ Columna 'created_by' asegurada en 'routes_quotes'.")

    # 3. Asignar 'izavala@petral.com.pe' a todas las rutas existentes en ambas tablas
    print("\n3. Actualizando 'created_by = izavala@petral.com.pe' en todos los registros existentes...")
    cur.execute("UPDATE routes_clients SET created_by = 'izavala@petral.com.pe' WHERE created_by IS NULL OR created_by = '';")
    affected_clients = cur.rowcount
    cur.execute("UPDATE routes_quotes SET created_by = 'izavala@petral.com.pe' WHERE created_by IS NULL OR created_by = '';")
    affected_quotes = cur.rowcount
    print(f"   ✅ Actualizados {affected_clients} registros en routes_clients y {affected_quotes} registros en routes_quotes.")

    # 4. Inspeccionar Weather Factor en routes_clients
    print("\n4. Inspeccionando Weather Factor en 'routes_clients'...")
    cur.execute("SELECT route_id, name, legs_data FROM routes_clients;")
    clients_rows = cur.fetchall()
    
    for row in clients_rows:
        r_id, r_name, legs_raw = row
        if not legs_raw:
            continue
        legs = legs_raw if isinstance(legs_raw, list) else json.loads(legs_raw) if isinstance(legs_raw, str) else []
        modified = False
        for leg in legs:
            wf = leg.get("weather_factor")
            if wf is not None:
                if isinstance(wf, (int, float)) and wf > 10.0:
                    print(f"   ⚠️ CORRIGIENDO Weather Factor absurdo en '{r_name}' (ID: {r_id}): {wf} -> 3.0")
                    leg["weather_factor"] = 3.0
                    modified = True
        if modified:
            cur.execute("UPDATE routes_clients SET legs_data = %s WHERE route_id = %s;", (json.dumps(legs), r_id))
            print(f"   ✅ Ruta '{r_name}' actualizada en routes_clients.")

    # 5. Inspeccionar Weather Factor en routes_quotes
    print("\n5. Inspeccionando Weather Factor en 'routes_quotes'...")
    cur.execute("SELECT spot_id, name, legs_data FROM routes_quotes;")
    quotes_rows = cur.fetchall()
    
    for row in quotes_rows:
        s_id, s_name, legs_raw = row
        if not legs_raw:
            continue
        legs = legs_raw if isinstance(legs_raw, list) else json.loads(legs_raw) if isinstance(legs_raw, str) else []
        modified = False
        for leg in legs:
            wf = leg.get("weather_factor")
            if wf is not None:
                if isinstance(wf, (int, float)) and wf > 10.0:
                    print(f"   ⚠️ CORRIGIENDO Weather Factor absurdo en '{s_name}' (ID: {s_id}): {wf} -> 3.0")
                    leg["weather_factor"] = 3.0
                    modified = True
        if modified:
            cur.execute("UPDATE routes_quotes SET legs_data = %s WHERE spot_id = %s;", (json.dumps(legs), s_id))
            print(f"   ✅ Cotización '{s_name}' actualizada en routes_quotes.")

    # 6. Eliminar rutas o cotizaciones corruptas o basuras (ej. edonda redonda.ilo.matarani)
    print("\n6. Verificando rutas duplicadas o basura en Supabase...")
    cur.execute("SELECT route_id, name, description, created_at FROM routes_clients WHERE name ILIKE '%edonda%' OR name ILIKE '%matarani%';")
    bad_routes = cur.fetchall()
    for br in bad_routes:
        print(f"   📌 Encontrado en routes_clients: ID={br[0]} | Name='{br[1]}' | Desc='{br[2]}' | Created={br[3]}")
        if "edonda" in br[1].lower():
            print(f"   🧹 Eliminando registro redundante o corrupto ID={br[0]} ({br[1]})...")
            cur.execute("DELETE FROM routes_clients WHERE route_id = %s;", (br[0],))
            print("   ✅ Eliminado.")

    print("\n" + "=" * 80)
    print(" 🎉 MIGRACIÓN Y LIMPIEZA COMPLETADA CON ÉXITO")
    print("=" * 80)

if __name__ == "__main__":
    main()
