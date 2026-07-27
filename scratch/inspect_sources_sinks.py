import psycopg2
from psycopg2.extras import RealDictCursor

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

conn = psycopg2.connect(conn_str)
cur = conn.cursor(cursor_factory=RealDictCursor)

# Query ports
cur.execute("SELECT port_id, port_name, country FROM public.ports ORDER BY display_order;")
ports = cur.fetchall()

print("=== PUERTOS EN BASE DE DATOS ===")
for p in ports:
    print(f"[{p['port_id']}] {p['port_name']} ({p['country']})")

# Query sources_sinks
cur.execute("SELECT * FROM public.sources_sinks ORDER BY port_id, empresa;")
ss_records = cur.fetchall()

print(f"\n=== FUENTES Y SUMIDEROS (sources_sinks) - Total {len(ss_records)} ===")
for r in ss_records:
    print(f"Port: {r.get('port_id'):<12} | Empresa: {r.get('empresa'):<25} | Type: {r.get('type'):<6} | Cap(MT): {str(r.get('capacity_mt')):<8} | Active: {r.get('is_active')} | Year: {r.get('year')}")

cur.close()
conn.close()
