import psycopg2
from psycopg2.extras import RealDictCursor

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

conn = psycopg2.connect(conn_str)
cur = conn.cursor(cursor_factory=RealDictCursor)

print("=== ACTUALIZANDO RITMOS DE OPERACIÓN (Q ACTIVAS) EN BASE DE DATOS ===")

# 1. Puertos de Carga (CALLAO, ILO): Carga = 500, Descarga = 0
cur.execute("""
UPDATE public.vessel_terminal_operations
SET ritmo_carga = 500.0, ritmo_descarga = 0.0
WHERE port_id IN ('CALLAO', 'ILO');
""")
print(f"Puertos Carga (CALLAO, ILO) actualizados: {cur.rowcount} filas")

# 2. Puerto MARCONA (Descarga = 345, Carga = 0)
cur.execute("""
UPDATE public.vessel_terminal_operations
SET ritmo_carga = 0.0, ritmo_descarga = 345.0
WHERE port_id = 'MARCONA';
""")
print(f"Puerto MARCONA actualizado: {cur.rowcount} filas")

# 3. Puertos de Descarga (MATARANI, MEJILLONES, BARQUITO): Descarga = 500, Carga = 0
cur.execute("""
UPDATE public.vessel_terminal_operations
SET ritmo_carga = 0.0, ritmo_descarga = 500.0
WHERE port_id IN ('MATARANI', 'MEJILLONES', 'BARQUITO');
""")
print(f"Puertos Descarga (MATARANI, MEJILLONES, BARQUITO) actualizados: {cur.rowcount} filas")

conn.commit()

# Verify
cur.execute("SELECT port_id, terminal_id, vessel_id, ritmo_carga, ritmo_descarga FROM public.vessel_terminal_operations ORDER BY port_id, terminal_id, vessel_id;")
rows = cur.fetchall()
print(f"\nTotal registros en DB: {len(rows)}")
for r in rows:
    print(f"Port: {r['port_id']:<12} | Term: {r['terminal_id']:<10} | Vessel: {r['vessel_id']:<15} | Carga: {r['ritmo_carga']:>5.1f} | Descarga: {r['ritmo_descarga']:>5.1f}")

cur.close()
conn.close()
