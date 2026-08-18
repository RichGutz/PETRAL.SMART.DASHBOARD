import sys
import os
import json
sys.path.insert(0, os.path.dirname(__file__))

from backend.database import get_supabase
sb = get_supabase()
res = sb.table("routes_quotes").select("legs_data").eq("name", "NEXA.ILO.CALLAO.MATARANI.ILO.2026 (IZ)").execute()
ld = res.data[0]["legs_data"]
print("TRAMOS EN SUPABASE:")
for i, tr in enumerate(ld.get("tramos", [])):
    print(f"Tramo {i+1}:", tr)
print("\nPUERTOS CONFIG EN SUPABASE:")
for i, p in enumerate(ld.get("puertosConfig", [])):
    print(f"Puerto {i+1}:", p)
