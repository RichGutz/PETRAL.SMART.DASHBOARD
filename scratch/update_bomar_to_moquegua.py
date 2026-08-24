import sys
import psycopg2
import json
import os

sys.stdout.reconfigure(encoding='utf-8')

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
conn.autocommit = True
cur = conn.cursor()

print("1. Consultando registros de 'Bomar Lynx' en Supabase...")
cur.execute("SELECT id, raw_json FROM demurrage_records WHERE vessel_name ILIKE '%Bomar Lynx%';")
rows = cur.fetchall()
print(f"   Encontrados {len(rows)} registros de 'Bomar Lynx'.")

for r_id, raw_json in rows:
    new_raw = raw_json
    if isinstance(new_raw, dict):
        new_raw["vessel"] = "Moquegua"
        new_raw["id"] = r_id.replace("Bomar Lynx", "Moquegua").replace("Bomar_Lynx", "Moquegua")
    
    cur.execute("""
        UPDATE demurrage_records 
        SET vessel_name = 'Moquegua',
            raw_json = %s
        WHERE id = %s;
    """, (json.dumps(new_raw), r_id))

print(f"   ✅ {len(rows)} registros actualizados en Supabase a 'Moquegua'.")

cur.close()
conn.close()

# 2. Actualizar archivo JSON semilla local
json_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\data\historicalDemurrageData.json"
if os.path.exists(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updated_count = 0
    for item in data:
        if "bomar lynx" in item.get("vessel", "").lower():
            item["vessel"] = "Moquegua"
            updated_count += 1
            
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"   ✅ {updated_count} registros actualizados en {json_path} a 'Moquegua'.")
