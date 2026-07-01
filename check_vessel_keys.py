import sys
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase
sb = get_supabase()
v_res = sb.table("vessels").select("*").limit(1).execute()
print(v_res.data[0].keys())
