import psycopg2
import json

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

# 1. Columnas de la tabla routes_spot
cur.execute("""
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'routes_spot'
    ORDER BY ordinal_position;
""")
print("=== COLUMNAS DE routes_spot ===")
cols = cur.fetchall()
for c in cols:
    print(f"  {c[0]:30s} | {c[1]:20s} | nullable={c[2]} | default={c[3]}")

# 2. Rutas multicotizador: qué campos tienen grabados
cur.execute("""
    SELECT 
        spot_id, 
        name, 
        pais, 
        created_at,
        legs_data ? 'tramos'         AS has_tramos,
        legs_data ? 'puertosConfig'  AS has_puertosConfig,
        legs_data ? 'vesselParams'   AS has_vesselParams,
        legs_data ? 'addressCommPct' AS has_commissions,
        legs_data ? 'bunker_price_ifo' AS has_bunker_price,
        CASE 
            WHEN legs_data ? 'tramos' 
            THEN jsonb_array_length(legs_data -> 'tramos') 
            ELSE 0 
        END AS num_tramos
    FROM routes_spot
    ORDER BY created_at DESC
    LIMIT 10;
""")
print()
print("=== ÚLTIMAS 10 RUTAS GRABADAS ===")
rows = cur.fetchall()
for r in rows:
    print(f"  {str(r[0])[:8]}... | {str(r[1])[:35]:35s} | pais={r[2]:5s} | multi={'YES' if r[4] else 'NO':3s} | puertosConfig={r[5]} | vesselParams={r[6]} | commPct={r[7]} | bunkerPrice={r[8]} | tramos={r[9]}")

# 3. Sacar el legs_data de la ruta más reciente multicotizador
cur.execute("""
    SELECT name, legs_data
    FROM routes_spot
    WHERE legs_data ? 'tramos'
    ORDER BY created_at DESC
    LIMIT 1;
""")
row = cur.fetchone()
if row:
    print()
    print(f"=== legs_data EJEMPLO (ruta: {row[0]}) ===")
    ld = row[1]
    print(f"  Claves top-level: {list(ld.keys()) if isinstance(ld, dict) else 'N/A'}")
    if isinstance(ld, dict) and 'tramos' in ld:
        print(f"  Num tramos: {len(ld['tramos'])}")
        t0 = ld['tramos'][0]
        print(f"  Tramo[0] claves: {list(t0.keys())}")
    if isinstance(ld, dict) and 'puertosConfig' in ld:
        p0 = ld['puertosConfig'][0]
        print(f"  PuertoConfig[0] claves: {list(p0.keys())}")
    if isinstance(ld, dict) and 'vesselParams' in ld:
        print(f"  VesselParams claves: {list(ld['vesselParams'].keys())}")

cur.close()
conn.close()
