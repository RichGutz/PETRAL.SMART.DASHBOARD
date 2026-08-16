import os
from dotenv import load_dotenv
import psycopg2

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

print("--- BUSCANDO 'MODULAR' O 'UNOFASI' O 'PRIMER' EN TODAS LAS TABLAS DE SUPABASE ---")

cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
""")
tables = [r[0] for r in cur.fetchall()]

for table in tables:
    try:
        cur.execute(f"SELECT * FROM {table};")
        rows = cur.fetchall()
        for r in rows:
            r_str = str(r)
            if 'MODULAR' in r_str.upper() or 'UNOFASI' in r_str.upper() or 'PRIMER' in r_str.upper():
                print(f"ENCONTRADO EN TABLA [{table}]:")
                print(r_str[:300])
                print("-" * 50)
    except Exception as e:
        pass

cur.close()
conn.close()
