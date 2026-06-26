import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
conn.autocommit = True
cur = conn.cursor()

# 1. Agregar columna date si no existe
cur.execute("""
    ALTER TABLE public.bunker_prices 
    ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE;
""")
print("Columna date agregada (o ya existia).")

# 2. Actualizar todos los registros a hoy
cur.execute("UPDATE public.bunker_prices SET date = '2026-06-26';")
print(f"Filas actualizadas: {cur.rowcount}")

# 3. Verificar resultado final
cur.execute("SELECT fuel_type, market_price_usd, date FROM public.bunker_prices ORDER BY fuel_type;")
rows = cur.fetchall()
print("\nEstado final de bunker_prices:")
for r in rows:
    print(f"  {r[0]}: ${r[1]:,.2f}  |  fecha: {r[2]}")

cur.close()
conn.close()
print("\nOK - Conexion cerrada.")
