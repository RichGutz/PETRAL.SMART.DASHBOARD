import sys
sys.path.append(r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine')
from backend.database import get_db_connection

conn = get_db_connection()
cur = conn.cursor()

cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'ports';")
cols = [r[0] for r in cur.fetchall()]
print("COLS IN ports:", cols)

cur.execute(f"SELECT {', '.join(cols)} FROM ports;")
rows = cur.fetchall()
print(f"Total ports found: {len(rows)}")
for r in rows:
    print(dict(zip(cols, r)))
