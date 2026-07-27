import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

engine_dir = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine'
if engine_dir not in sys.path:
    sys.path.insert(0, engine_dir)

from backend.database import get_supabase

sb = get_supabase()
res = sb.table("voyage_liquidations").select("*").limit(2).execute()
print("CAMPOS EN VOYAGE_LIQUIDATIONS:")
if res.data:
    for k, v in res.data[0].items():
        print(f"  {k}: {v}")
