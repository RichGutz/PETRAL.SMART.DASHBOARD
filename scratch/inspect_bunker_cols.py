import psycopg2

conn = psycopg2.connect('postgresql://postgres.crskqskfsixcvemsaptd:P-e_t_r_a_l_2026_Smart!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres')
cur = conn.cursor()

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'contracts';")
print("CONTRACTS COLS:", [r[0] for r in cur.fetchall()])

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'routes_quotes';")
print("ROUTES_QUOTES COLS:", [r[0] for r in cur.fetchall()])
