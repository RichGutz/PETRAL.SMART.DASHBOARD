import sys
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase

def check():
    sb = get_supabase()
    try:
        res = sb.table("agency_matrix").select("*").limit(5).execute()
        print("La tabla agency_matrix EXISTE físicamente.")
        print(f"Muestra de datos (primeros 5): {res.data}")
    except Exception as e:
        print(f"Error al consultar agency_matrix: {e}")

if __name__ == "__main__":
    check()
