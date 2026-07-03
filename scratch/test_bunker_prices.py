import sys
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase

def test():
    sb = get_supabase()
    res = sb.table("bunker_prices").select("*").execute()
    print("=== REGISTROS DE BUNKER PRICES EN SUPABASE ===")
    for row in res.data:
        print(row)

if __name__ == "__main__":
    test()
