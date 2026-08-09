import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    cur.execute("SELECT vessel_id, vessel_name, image_url FROM vessels;")
    rows = cur.fetchall()
    print("Vessels in DB:")
    for r in rows:
        print(f"ID: {r[0]}, Name: {r[1]}, Image: {r[2][:50] if r[2] else 'NONE/NULL'}")
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
