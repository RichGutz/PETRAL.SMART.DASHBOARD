import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

cur.execute("""
SELECT * 
FROM clients;
""")

rows = cur.fetchall()
print("Current clients:")
for r in rows:
    print(r)

cur.close()
conn.close()
