import sys
sys.path.append(r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine')
from backend.database import get_db_connection
import json

conn = get_db_connection()
cur = conn.cursor()

print("--- SEARCHING IN CONTRACTS ---")
cur.execute("SELECT name, client_id, origin_port_id, destination_port_id, legs_data FROM contracts WHERE name LIKE '%NEXA%';" )
rows = cur.fetchall()
for r in rows:
    print("NAME:", r[0])
    print("LEGS_DATA:", json.dumps(r[4], indent=2))

print("--- SEARCHING IN ROUTES_QUOTES ---")
cur.execute("SELECT name, client_id, origin_port_id, destination_port_id, legs_data FROM routes_quotes WHERE name LIKE '%NEXA%';" )
rows2 = cur.fetchall()
for r in rows2:
    print("NAME:", r[0])
    print("LEGS_DATA:", json.dumps(r[4], indent=2))
