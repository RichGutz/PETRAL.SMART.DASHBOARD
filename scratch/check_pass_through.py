import psycopg2

conn_str = 'postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%port%';")
tables = [r[0] for r in cur.fetchall()]
print('PORT TABLES:', tables)

for t in tables:
    cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{t}';")
    print(f"COLS IN {t}:", [r[0] for r in cur.fetchall()])

cur.close()
conn.close()
