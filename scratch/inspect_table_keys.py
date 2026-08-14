import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def inspect_pks():
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    tables = ["routes_clients", "routes_quotes", "contracts"]
    for t in tables:
        cur.execute(f"""
            SELECT a.attname
            FROM   pg_index i
            JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE  i.indrelid = 'public.{t}'::regclass
            AND    i.indisprimary;
        """)
        pks = [r[0] for r in cur.fetchall()]
        print(f"Table '{t}' Primary Key(s): {pks}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect_pks()
