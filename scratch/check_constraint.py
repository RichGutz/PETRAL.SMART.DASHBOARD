import os, psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
cur = conn.cursor(cursor_factory=DictCursor)

# Ver constraint de default_calculation_type
cur.execute("""
    SELECT pg_get_constraintdef(c.oid) as def
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'port_cost_concepts'
    AND c.contype = 'c'
""")
for r in cur.fetchall():
    print("CONSTRAINT:", r['def'])

# Ver valores actuales de default_calculation_type en la tabla
cur.execute("SELECT DISTINCT default_calculation_type FROM port_cost_concepts ORDER BY 1")
print("\nVALORES PERMITIDOS en uso:")
for r in cur.fetchall():
    print(" ", r[0])
