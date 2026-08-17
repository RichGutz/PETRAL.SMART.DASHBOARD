import sys
sys.path.append(r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine')
from backend.database import get_db_connection

conn = get_db_connection()
cur = conn.cursor()

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'contracts';")
print("CONTRACTS COLS:", [r[0] for r in cur.fetchall()])

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'routes_quotes';")
print("ROUTES_QUOTES COLS:", [r[0] for r in cur.fetchall()])
