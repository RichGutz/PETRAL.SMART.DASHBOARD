import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def apply_primary_keys():
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    
    # Check current PK on routes_quotes
    cur.execute("""
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'routes_quotes' AND constraint_type = 'PRIMARY KEY';
    """)
    pks_quotes = cur.fetchall()
    print("Current PK routes_quotes:", pks_quotes)
    
    if not pks_quotes:
        print("Adding PRIMARY KEY (name) to routes_quotes...")
        cur.execute("ALTER TABLE routes_quotes ADD PRIMARY KEY (name);")
        print("PRIMARY KEY added to routes_quotes successfully.")

    # Check current PK on routes_clients
    cur.execute("""
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'routes_clients' AND constraint_type = 'PRIMARY KEY';
    """)
    pks_clients = cur.fetchall()
    print("Current PK routes_clients:", pks_clients)
    
    if not pks_clients:
        print("Adding PRIMARY KEY (name) to routes_clients...")
        cur.execute("ALTER TABLE routes_clients ADD PRIMARY KEY (name);")
        print("PRIMARY KEY added to routes_clients successfully.")

    cur.close()
    conn.close()

if __name__ == "__main__":
    apply_primary_keys()
