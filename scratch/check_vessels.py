import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

conn = psycopg2.connect(conn_str)
conn.autocommit = True
cur = conn.cursor()

sql_query = """
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vessels';
"""
cur.execute(sql_query)
print("Columns in vessels:")
for row in cur.fetchall():
    print(row)

cur.close()
conn.close()
