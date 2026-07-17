import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'routes_master';")
print('routes_master columns:', cur.fetchall())
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'routes';")
print('routes columns:', cur.fetchall())
