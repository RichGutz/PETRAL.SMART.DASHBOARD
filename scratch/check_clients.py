import psycopg2

def check_db_clients():
    conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
    
    try:
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        print("--- CLIENTES EN LA TABLA 'clients' ---")
        cur.execute("SELECT client_id, client_name FROM clients;")
        clients_in_table = cur.fetchall()
        for c in clients_in_table:
            print(f"ID: {c[0]} | Nombre: {c[1]}")
            
        print("\n--- CLIENTES EN LA TABLA 'contracts' ---")
        cur.execute("SELECT DISTINCT client_id FROM contracts;")
        clients_in_contracts = cur.fetchall()
        for c in clients_in_contracts:
            print(f"ID en contratos: {c[0]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db_clients()
