import psycopg2
conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
conn.autocommit = True
cur = conn.cursor()
cur.execute("""
ALTER TABLE ports 
DROP COLUMN IF EXISTS max_load_rate, 
DROP COLUMN IF EXISTS max_disch_rate, 
DROP COLUMN IF EXISTS overhead_carga_hrs, 
DROP COLUMN IF EXISTS overhead_descarga_hrs, 
DROP COLUMN IF EXISTS positioning_carga_hrs, 
DROP COLUMN IF EXISTS positioning_descarga_hrs, 
DROP COLUMN IF EXISTS time_to_count_carga_hrs, 
DROP COLUMN IF EXISTS time_to_count_descarga_hrs, 
DROP COLUMN IF EXISTS maneuver_carga_hrs, 
DROP COLUMN IF EXISTS maneuver_descarga_hrs;
""")
print("Columnas eliminadas con exito.")
