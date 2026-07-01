"""
Diagnóstico: Ver estructura y datos actuales de la tabla contracts en Supabase.
"""
import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

sb = get_supabase()

print("=" * 70)
print("ESTRUCTURA Y DATOS ACTUALES: tabla contracts")
print("=" * 70)

res = sb.table("contracts").select("*").limit(20).execute()
rows = res.data

if not rows:
    print("TABLA VACÍA")
else:
    # Mostrar columnas disponibles
    print(f"COLUMNAS: {list(rows[0].keys())}\n")
    print(f"Total registros: {len(rows)}")
    print()
    for r in rows:
        print(r)

print()
print("=" * 70)
print("COLUMNAS QUE INCLUYEN RATE / discharge / load")
print("=" * 70)
if rows:
    rate_cols = [k for k in rows[0].keys() if any(x in k.lower() for x in ['rate', 'disch', 'load', 'pump'])]
    print(f"Columnas relevantes: {rate_cols}")
    print()
    for r in rows:
        row_summary = {k: r.get(k) for k in rate_cols}
        row_summary['contract_id'] = r.get('contract_id') or r.get('id')
        row_summary['client_id'] = r.get('client_id')
        print(row_summary)
