import os, psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

load_dotenv('Desarrollo.Profesional/Geeksoft_Engine/.env')
conn = psycopg2.connect(os.environ.get('SUPABASE_DB_URI').replace('[PASSWORD]', os.environ.get('SUPABASE_DB_PASSWORD')))
cur = conn.cursor(cursor_factory=DictCursor)

# Ver qué port_id / terminal combos existen ahora
print('=== port_costs_matrix: combos port/terminal ===')
cur.execute("""
    SELECT port_id, terminal, operation_type, count(*) as filas
    FROM port_costs_matrix
    GROUP BY port_id, terminal, operation_type
    ORDER BY port_id, terminal, operation_type
""")
for r in cur.fetchall():
    print(f"  {r['port_id']:15} | {r['terminal']:12} | {r['operation_type']:10} | {r['filas']} filas")

# Ver todos los concepts
print('\n=== port_cost_concepts ===')
cur.execute("SELECT concept_id, concept_name, category, default_calculation_type FROM port_cost_concepts ORDER BY category, concept_name")
for r in cur.fetchall():
    print(f"  [{r['category']:15}] {r['concept_id']:40} | {r['concept_name']}")

# Ver tabla ports
print('\n=== ports ===')
cur.execute("SELECT * FROM ports ORDER BY name")
for r in cur.fetchall():
    print(dict(r))

# Ver tabla terminals
print('\n=== terminals ===')
cur.execute("SELECT * FROM terminals ORDER BY port_id, name")
for r in cur.fetchall():
    print(dict(r))

cur.close()
conn.close()
