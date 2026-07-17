import os, psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
cur = conn.cursor(cursor_factory=DictCursor)

# Ver columnas de ports
print('=== COLUMNAS: ports ===')
cur.execute("""
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'ports' ORDER BY ordinal_position
""")
for r in cur.fetchall():
    print(f"  {r['column_name']} | {r['data_type']}")

print('\n=== ports (data) ===')
cur.execute("SELECT * FROM ports LIMIT 20")
rows = cur.fetchall()
if rows:
    print([d[0] for d in cur.description])
    for r in rows: print(dict(r))

print('\n=== COLUMNAS: terminals ===')
cur.execute("""
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'terminals' ORDER BY ordinal_position
""")
for r in cur.fetchall():
    print(f"  {r['column_name']} | {r['data_type']}")

print('\n=== terminals (data) ===')
cur.execute("SELECT * FROM terminals LIMIT 30")
rows = cur.fetchall()
if rows:
    print([d[0] for d in cur.description])
    for r in rows: print(dict(r))

# Resumen de port_costs_matrix
print('\n=== port_costs_matrix: RESUMEN POR PUERTO ===')
cur.execute("""
    SELECT port_id, terminal, operation_type, count(*) as filas
    FROM port_costs_matrix
    GROUP BY port_id, terminal, operation_type
    ORDER BY port_id, terminal, operation_type
""")
for r in cur.fetchall():
    print(f"  {r['port_id']:15} | {r['terminal']:15} | {r['operation_type']:10} | {r['filas']} filas")

cur.close()
conn.close()
