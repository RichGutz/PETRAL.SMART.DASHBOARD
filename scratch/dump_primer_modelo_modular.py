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

cur.execute("SELECT id, name, user_id, start_date, end_date, projection_lines FROM commercial_forecasts WHERE id = '513f2ea9-0aa4-4ee6-b420-22820e477245';")
r = cur.fetchone()

if r:
    f_id, name, user_id, s_date, e_date, lines = r
    print(f"ESCENARIO: {name} (ID: {f_id})")
    print(f"Rango de Fechas: {s_date} -> {e_date}")
    print(f"Total lineas: {len(lines)}")
    with open(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\scratch\primer_modelo_modular.json", "w", encoding="utf-8") as f:
        json.dump({
            "id": f_id,
            "name": name,
            "user_id": user_id,
            "start_date": s_date,
            "end_date": e_date,
            "projection_lines": lines
        }, f, indent=2)
    print("Guardado en scratch/primer_modelo_modular.json exitosamente.")

cur.close()
conn.close()
