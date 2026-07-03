import sys
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase
sb = get_supabase()
res = sb.table("vessels").select("vessel_id, vessel_name").execute()
for r in res.data:
    print(r)
