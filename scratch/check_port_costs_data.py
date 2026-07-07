import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

cur.execute("""
SELECT DISTINCT operation_type 
FROM port_cost_static;
""")
print("Distinct operation_type in port_cost_static:")
for r in cur.fetchall():
    print(r)

cur.execute("""
SELECT DISTINCT client_id 
FROM port_cost_static;
""")
print("\nDistinct client_id in port_cost_static:")
for r in cur.fetchall():
    print(r)
    
cur.close()
conn.close()
