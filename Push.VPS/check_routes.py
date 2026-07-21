import psycopg2
import json

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

cur.execute("SELECT legs_data FROM routes LIMIT 2;")
rows = cur.fetchall()
for row in rows:
    print(json.dumps(row[0], indent=2))
