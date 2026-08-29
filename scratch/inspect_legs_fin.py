import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase
import json

sb = get_supabase()
res = sb.table("routes_quotes").select("*").eq("name", "SPCC.ILO.MARCONA.CALLAO.ILO.2026 DM MOQUEGUA").execute()
row = res.data[0]
legs = row.get("legs_data") or {}
fin = legs.get("financial_summary") or {}
print("financial_summary:")
print(json.dumps(fin, indent=2))
