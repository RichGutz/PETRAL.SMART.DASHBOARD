import psycopg2, json

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

cur.execute("SELECT route_id, name, legs_data FROM routes_master WHERE name LIKE '%ILO.MARCONA%' OR name LIKE '%MARCONA%'")
rows = cur.fetchall()
for r in rows:
    print("ID:", r[0], "NAME:", r[1])
    print("LEGS_DATA:", json.dumps(r[2], indent=2))
    print("-" * 50)

cur.close()
conn.close()
