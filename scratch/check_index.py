import psycopg2

conn_str = 'postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

cur.execute("""
SELECT
    i.relname as index_name,
    a.attname as column_name
FROM pg_index x
JOIN pg_class c ON c.oid = x.indrelid
JOIN pg_class i ON i.oid = x.indexrelid
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(x.indkey)
WHERE c.relname = 'port_cost_static';
""")
print("=== COLUMNS IN port_cost_static INDEXES ===")
for r in cur.fetchall():
    print(r)

cur.close()
conn.close()
