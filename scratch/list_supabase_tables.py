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

cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
""")

tables = [r[0] for r in cur.fetchall()]
print(f"Tablas encontradas en Supabase (public): {tables}\n")

for table in tables:
    if 'forecast' in table or 'scenario' in table or 'projection' in table or 'saved' in table or 'route' in table:
        print(f"--- CONTENIDO TABLA: {table} ---")
        cur.execute(f"SELECT * FROM {table} LIMIT 10;")
        cols = [desc[0] for desc in cur.description]
        print("Columnas:", cols)
        rows = cur.fetchall()
        for r in rows:
            print(r)
        print("-" * 50)

cur.close()
conn.close()
