import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
tables = cur.fetchall()
for t in tables:
    print(t[0])
    
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'port_distances';")
cols = cur.fetchall()
if len(cols) == 0:
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'distances';")
    cols = cur.fetchall()
print("Columns of distances table:", cols)
