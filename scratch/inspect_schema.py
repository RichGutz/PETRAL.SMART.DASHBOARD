import os, psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
cur = conn.cursor(cursor_factory=DictCursor)

# 1. Ver todas las tablas
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
print('=== TABLAS ===')
for r in cur.fetchall():
    print(r[0])

# 2. Ver columnas de port_costs_matrix
print('\n=== COLUMNAS: port_costs_matrix ===')
cur.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'port_costs_matrix'
    ORDER BY ordinal_position
""")
for r in cur.fetchall():
    print(f"  {r['column_name']} | {r['data_type']} | nullable={r['is_nullable']}")

# 3. Ver columnas de port_cost_concepts
print('\n=== COLUMNAS: port_cost_concepts ===')
cur.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'port_cost_concepts'
    ORDER BY ordinal_position
""")
for r in cur.fetchall():
    print(f"  {r['column_name']} | {r['data_type']} | nullable={r['is_nullable']}")

# 4. Muestra de lo que ya hay en port_costs_matrix
print('\n=== MUESTRA port_costs_matrix (CALLAO, 5 filas) ===')
cur.execute("SELECT * FROM port_costs_matrix WHERE port_id='CALLAO' LIMIT 5")
rows = cur.fetchall()
if rows:
    print('Columnas:', [desc[0] for desc in cur.description])
    for r in rows:
        print(dict(r))
else:
    print("Sin datos para CALLAO")

cur.close()
conn.close()
