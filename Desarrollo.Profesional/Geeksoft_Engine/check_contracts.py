import psycopg2, json

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

print("=== TABLA contracts ===")
cur.execute("SELECT * FROM contracts")
cols = [d[0] for d in cur.description]
print("Columnas:", cols)
for r in cur.fetchall():
    print(dict(zip(cols, r)))

cur.close()
conn.close()
