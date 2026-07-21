import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
conn.autocommit = True
cur = conn.cursor()

sql_query = """
SELECT t.origin_port_id, t.destination_port_id, t.min_tonnage, t.max_tonnage, t.freight_rate
FROM contract_tariffs t
JOIN contracts c ON t.contract_id = c.contract_id
WHERE c.client_id = 'SPCC';
"""
cur.execute(sql_query)
for row in cur.fetchall():
    print(row)

cur.close()
conn.close()
