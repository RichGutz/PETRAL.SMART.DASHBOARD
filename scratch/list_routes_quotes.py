import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def list_quotes():
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    cur.execute("SELECT name, client_id, created_at FROM routes_quotes ORDER BY created_at DESC;")
    rows = cur.fetchall()
    print(f"Total rows in routes_quotes: {len(rows)}")
    for r in rows:
        print(f" - {r[0]} | client: {r[1]} | created: {r[2]}")
    cur.close()
    conn.close()

if __name__ == "__main__":
    list_quotes()
