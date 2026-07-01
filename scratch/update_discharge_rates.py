"""
UPDATE discharge_rate en contracts (SPCC_2025) con datos del cliente.
load_rate NO se toca - pendiente.

Tasas acordadas:
  ILO -> MATARANI   : 300 TMH
  ILO -> MARCONA    : 345 TMH
  ILO -> MEJILLONES : 350 TMH
"""
import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

sb = get_supabase()

updates = [
    {"destination_port_id": "MATARANI",   "discharge_rate": 300},
    {"destination_port_id": "MARCONA",    "discharge_rate": 345},
    {"destination_port_id": "MEJILLONES", "discharge_rate": 350},
]

print("=" * 60)
print("UPDATE discharge_rate — contrato SPCC_2025")
print("=" * 60)

for u in updates:
    res = (
        sb.table("contracts")
        .update({"discharge_rate": u["discharge_rate"]})
        .eq("contract_id", "SPCC_2025")
        .eq("destination_port_id", u["destination_port_id"])
        .execute()
    )
    if res.data:
        print(f"  OK  ILO -> {u['destination_port_id']:12} | discharge_rate = {u['discharge_rate']} TMH")
    else:
        print(f"  ERROR en {u['destination_port_id']}: {res}")

print()
print("=" * 60)
print("VERIFICACION FINAL")
print("=" * 60)
final = sb.table("contracts").select("contract_id, origin_port_id, destination_port_id, load_rate, discharge_rate").execute()
for r in final.data:
    print(f"  {r['origin_port_id']:8} -> {r['destination_port_id']:12} | load_rate={r['load_rate']} | discharge_rate={r['discharge_rate']} TMH")
