import psycopg2

conn_str = 'postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
conn = psycopg2.connect(conn_str)
conn.autocommit = True
cur = conn.cursor()

print("Updating Primary Key constraint on port_cost_static...")
try:
    cur.execute("ALTER TABLE port_cost_static DROP CONSTRAINT port_cost_static_pkey;")
    print("Dropped old constraint.")
except Exception as e:
    print("Error dropping constraint:", e)

try:
    cur.execute("ALTER TABLE port_cost_static ADD CONSTRAINT port_cost_static_pkey PRIMARY KEY (port_id, terminal_id, operation_type, vessel_id, sub_operation_type);")
    print("Added new PRIMARY KEY (port_id, terminal_id, operation_type, vessel_id, sub_operation_type).")
except Exception as e:
    print("Error adding constraint:", e)

cur.close()
conn.close()
