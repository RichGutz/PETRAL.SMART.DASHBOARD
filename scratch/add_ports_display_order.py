import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
conn.autocommit = True
cur = conn.cursor()

# 1. Add display_order column if it doesn't exist
cur.execute("""
ALTER TABLE ports 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
""")

# 2. Get existing ports ordered alphabetically by port_name to set their initial display_order
cur.execute("SELECT port_id FROM ports ORDER BY port_name ASC;")
ports = cur.fetchall()

# 3. Update display_order for each port
for index, (port_id,) in enumerate(ports, start=1):
    cur.execute("UPDATE ports SET display_order = %s WHERE port_id = %s;", (index, port_id))

print(f"Columna 'display_order' añadida y poblada para {len(ports)} puertos.")
cur.close()
conn.close()
