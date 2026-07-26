import psycopg2

DB_URI = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(DB_URI)
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'vessel_terminal_operations';")
print("COLUMNAS DE vessel_terminal_operations:")
for r in cur.fetchall():
    print(r[0])
cur.execute("SELECT * FROM vessel_terminal_operations WHERE port_id = 'CALLAO';")
print("\nFILA CALLAO:")
print(cur.fetchone())
cur.close()
conn.close()
