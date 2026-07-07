import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

cur.execute("""
SELECT * 
FROM sources_sinks;
""")

rows = cur.fetchall()
print("All sources_sinks rows:")
for r in rows:
    print(r)

cur.close()
conn.close()
