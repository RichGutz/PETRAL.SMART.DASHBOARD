import psycopg2

conn_str = 'postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'vessel_terminal_operations';")
cols = [r[0] for r in cur.fetchall()]
print("COLS:", cols)

cur.execute("SELECT * FROM vessel_terminal_operations LIMIT 10;")
for r in cur.fetchall():
    print(dict(zip(cols, r)))

cur.close()
conn.close()
