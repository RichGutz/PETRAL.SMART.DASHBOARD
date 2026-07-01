"""
Script de diagnóstico: muestra los primeros registros de agency_matrix
para entender la estructura real de client_id, port_id, operation_type.
"""
import sys, os
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

sb = get_supabase()

print("=" * 60)
print("ESTRUCTURA REAL DE agency_matrix")
print("=" * 60)

res = sb.table("agency_matrix").select("*").limit(20).execute()
rows = res.data

if not rows:
    print("⚠️  La tabla agency_matrix está VACÍA.")
else:
    for r in rows:
        print(r)

print()
print("=" * 60)
print("COLUMNAS ÚNICAS")
print("=" * 60)

all_clients = list(set(r.get("client_id", "N/A") for r in rows))
all_ports   = list(set(r.get("port_id", "N/A") for r in rows))
all_ops     = list(set(r.get("operation_type", "N/A") for r in rows))
all_vessels = list(set(r.get("vessel_id", "N/A") for r in rows))

print(f"client_id únicos   : {sorted(all_clients)}")
print(f"port_id únicos     : {sorted(all_ports)}")
print(f"operation_type únicos : {sorted(all_ops)}")
print(f"vessel_id únicos   : {sorted(all_vessels)}")

print()
print("=" * 60)
print("PRUEBA: Buscar 'DEFAULT' + CARGA/DESCARGA")
print("=" * 60)

for op in ["CARGA", "DESCARGA", "LOAD", "DISCHARGE", "carga", "descarga"]:
    matches = [r for r in rows if r.get("client_id") == "DEFAULT" and r.get("operation_type") == op]
    if matches:
        print(f"✅ operation_type='{op}' → {len(matches)} registros encontrados")
        for m in matches[:3]:
            print(f"   {m}")
    else:
        print(f"❌ operation_type='{op}' → NINGUNO")
