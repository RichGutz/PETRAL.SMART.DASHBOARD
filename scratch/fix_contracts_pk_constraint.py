import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def fix_pk():
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # 1. Find primary key constraint name for contracts
    cur.execute("""
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'contracts' AND constraint_type = 'PRIMARY KEY';
    """)
    res = cur.fetchall()
    print("Existing PK Constraints on 'contracts':", res)
    
    for r in res:
        pk_name = r[0]
        print(f"Dropping PK constraint '{pk_name}'...")
        cur.execute(f"ALTER TABLE public.contracts DROP CONSTRAINT {pk_name};")
        
    # 2. Make origin_port_id and destination_port_id nullable
    cur.execute("ALTER TABLE public.contracts ALTER COLUMN origin_port_id DROP NOT NULL;")
    cur.execute("ALTER TABLE public.contracts ALTER COLUMN destination_port_id DROP NOT NULL;")
    
    conn.commit()
    print("✅ Composite Primary Key dropped; origin_port_id & destination_port_id are now fully NULLABLE!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    fix_pk()
