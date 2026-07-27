import psycopg2
from psycopg2.extras import RealDictCursor

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

conn = psycopg2.connect(conn_str)
cur = conn.cursor(cursor_factory=RealDictCursor)

cur.execute("SELECT * FROM public.vessel_terminal_operations ORDER BY port_id, terminal_id, vessel_id;")
ops = cur.fetchall()

print(f"=== VESSEL TERMINAL OPERATIONS IN DB (Total: {len(ops)}) ===")
for r in ops:
    print(f"Port: {r.get('port_id'):<12} | Term: {r.get('terminal_id'):<12} | Vessel: {r.get('vessel_id'):<15} | Carga: {r.get('ritmo_carga')} | Descarga: {r.get('ritmo_descarga')} | Amarre: {r.get('amarre_hrs')}")

cur.close()
conn.close()
