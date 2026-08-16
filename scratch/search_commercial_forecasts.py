import os
from dotenv import load_dotenv
import psycopg2
import json

env_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\.env"
load_dotenv(env_path)

db_password = os.getenv("SUPABASE_DB_PASSWORD")
host = "aws-1-us-east-2.pooler.supabase.com"
port = 6543
dbname = "postgres"
user = "postgres.hjjxooxcpvlvbaxgifbn"

conn = psycopg2.connect(
    host=host,
    port=port,
    dbname=dbname,
    user=user,
    password=db_password
)
cur = conn.cursor()

print("--- BUSCANDO ESCENARIO EN TABLA 'commercial_forecasts' ---")
cur.execute("SELECT id, name, user_id, start_date, end_date, created_at, updated_at, projection_lines FROM commercial_forecasts ORDER BY updated_at DESC;")
rows = cur.fetchall()

print(f"Total escenarios encontrados en Matriz Financiera: {len(rows)}\n")

target_row = None
for r in rows:
    f_id, name, user_id, s_date, e_date, c_at, u_at, lines = r
    print(f"ID: {f_id} | Name: '{name}' | User: {user_id} | Actualizado: {u_at}")
    if any(k in name.upper() for k in ['PRIMER', 'MODULAR', 'UNOFASI']):
        target_row = r

if not target_row and len(rows) > 0:
    target_row = rows[0] # Usar el mas reciente si no coincide el nombre exacto

if target_row:
    f_id, name, user_id, s_date, e_date, c_at, u_at, lines = target_row
    print("\n" + "="*70)
    print(f"🎯 ESCENARIO SELECCIONADO: {name}")
    print(f"ID: {f_id}")
    print(f"Fechas: {s_date} -> {e_date}")
    print(f"Número de líneas en proyección: {len(lines) if isinstance(lines, list) else 0}")
    print("\nDetalle de Líneas de Proyección:")
    print(json.dumps(lines, indent=2))
    print("="*70)

cur.close()
conn.close()
