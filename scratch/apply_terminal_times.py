import psycopg2

uri = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def run_migration():
    try:
        conn = psycopg2.connect(uri)
        cur = conn.cursor()
        
        sql = """
        ALTER TABLE terminals 
        ADD COLUMN IF NOT EXISTS mooring_time_hrs NUMERIC(5,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS unmooring_time_hrs NUMERIC(5,2) DEFAULT 0;
        """
        
        cur.execute(sql)
        conn.commit()
        print("Migration applied successfully.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    run_migration()
