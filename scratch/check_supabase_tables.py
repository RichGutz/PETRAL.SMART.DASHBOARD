import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
""")
tables = [t[0] for t in cur.fetchall()]
print("Tablas en public:", tables)

demurrage_tables = [t for t in tables if "demurrage" in t]
print("Tablas de demurrage encontradas:", demurrage_tables)
