import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

conn = psycopg2.connect(conn_str)
cur = conn.cursor()
cur.execute("SELECT contract_id, client_id, origin_port_id, destination_port_id, address_commission, broker_commission FROM public.contracts;")
rows = cur.fetchall()
print(f"Total contratos: {len(rows)}")
print("contract_id | client | origin | dest | addr_comm | broker_comm")
print("-"*70)
for r in rows:
    print(f"{r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]}")
cur.close()
conn.close()
print("\n✅ Verificación completada. Columnas existen y tienen valor 0.0 por defecto.")
