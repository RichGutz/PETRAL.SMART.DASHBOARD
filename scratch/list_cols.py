import psycopg2
conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ports';")
cols = cur.fetchall()
print("Columnas:")
for c in cols: print(f"- {c[0]} ({c[1]})")
