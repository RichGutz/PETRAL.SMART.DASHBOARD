import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

def check_vessels():
    sb = get_supabase()
    res = sb.table("vessels").select("*").eq("vessel_id", "MOQUEGUA").execute()
    print("=== REGISTRO COMPLETO DE MOQUEGUA ===")
    import pprint
    pprint.pprint(res.data[0])

if __name__ == "__main__":
    check_vessels()
