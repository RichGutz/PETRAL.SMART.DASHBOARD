import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def check_names():
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    for t in ["routes_quotes", "routes_clients"]:
        cur.execute(f"SELECT name, count(*) FROM {t} GROUP BY name HAVING count(*) > 1;")
        dups = cur.fetchall()
        print(f"Duplicates in {t}: {dups}")
        
        cur.execute(f"SELECT count(*), count(distinct name) FROM {t};")
        row = cur.fetchone()
        print(f"Total rows in {t}: {row[0]}, Unique names: {row[1]}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_names()
