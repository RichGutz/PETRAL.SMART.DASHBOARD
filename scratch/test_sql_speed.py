import sys, time
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_db_connection
from psycopg2.extras import RealDictCursor

t0 = time.time()
conn = get_db_connection()
cur = conn.cursor(cursor_factory=RealDictCursor)

tables = [
    "vessels", "distances", "routes_clients", "routes_quotes",
    "bunker_prices", "ports", "contracts", "contract_tariffs",
    "port_costs_matrix", "port_cost_static", "vessel_terminal_operations"
]

data = {}
for t in tables:
    cur.execute(f"SELECT * FROM public.{t};")
    data[t] = [dict(r) for r in cur.fetchall()]

cur.close()
conn.close()
t1 = time.time()

print(f"Carga completa de las 11 tablas maestras via Postgres Directo: {(t1 - t0)*1000:.2f} ms")
for k, v in data.items():
    print(f"  - {k}: {len(v)} registros")
