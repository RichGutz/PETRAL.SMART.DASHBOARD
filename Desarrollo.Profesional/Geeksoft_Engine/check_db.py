import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

print("=== ILO-MARCONA en routes ===")
cur.execute("SELECT * FROM routes WHERE (port_a = 'ILO' AND port_b = 'MARCONA') OR (port_a = 'MARCONA' AND port_b = 'ILO')")
for r in cur.fetchall():
    print(r)

print("\n=== MARCONA en port_cost_static ===")
cur.execute("SELECT * FROM port_cost_static WHERE port_id = 'MARCONA'")
for r in cur.fetchall():
    print(r)

print("\n=== ILO en port_cost_static ===")
cur.execute("SELECT * FROM port_cost_static WHERE port_id = 'ILO'")
for r in cur.fetchall():
    print(r)

cur.close()
conn.close()
