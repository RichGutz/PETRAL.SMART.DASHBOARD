import psycopg2

def check_rows():
    db_uri = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
    conn = psycopg2.connect(db_uri)
    cur = conn.cursor()
    cur.execute("SELECT concept_id, cost FROM port_costs_matrix WHERE vessel_id = 'MOQUEGUA' AND port_id = 'ILO';")
    print("=== FILAS DE MOQUEGUA EN ILO ===")
    for row in cur.fetchall():
        print(f"Concept: {row[0]:30} | Cost: {row[1]}")
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_rows()
