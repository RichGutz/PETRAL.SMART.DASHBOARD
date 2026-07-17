import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
cur = conn.cursor()
cur.execute("""
SELECT pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'port_cost_concepts' AND c.contype = 'c';
""")
print(cur.fetchall())
