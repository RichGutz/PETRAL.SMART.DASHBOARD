import psycopg2

conn_str = 'postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

print('=== COLUMNS OF port_cost_static ===')
cur.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'port_cost_static';")
for row in cur.fetchall():
    print(row)

print('\n=== CONSTRAINTS / INDEXES ===')
cur.execute("""
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'port_cost_static';
""")
for row in cur.fetchall():
    print(row)

print('\n=== ALL CALLAO ROWS IN port_cost_static ===')
cur.execute("SELECT * FROM port_cost_static WHERE UPPER(port_id) = 'CALLAO';")
rows = cur.fetchall()
colnames = [desc[0] for desc in cur.description]
print('Columns:', colnames)
for r in rows:
    print(r)

print(f'\nTotal rows for CALLAO: {len(rows)}')

print('\n=== ALL DISTINCT PORT_IDS IN port_cost_static ===')
cur.execute("SELECT DISTINCT port_id, operation_type, sub_operation_type, count(*) FROM port_cost_static GROUP BY port_id, operation_type, sub_operation_type;")
for r in cur.fetchall():
    print(r)

cur.close()
conn.close()
