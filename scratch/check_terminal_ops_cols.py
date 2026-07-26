import psycopg2

conn_str = 'postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'vessel_terminal_operations';")
print("TERMINAL OPS COLS:", [r[0] for r in cur.fetchall()])

cur.execute("SELECT port_id, vessel_id, ritmo_carga, amarre_hrs, desamarre_hrs, parameters FROM vessel_terminal_operations LIMIT 5;")
for r in cur.fetchall():
    print(r)

cur.close()
conn.close()
