import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

def check_api():
    sb = get_supabase()
    res = sb.table("port_costs_matrix").select("*").eq("port_id", "ILO").execute()
    print("=== TODAS LAS FILAS DE ILO EN API REST ===")
    for row in res.data:
        print(f"Client: {row['client_id']:10} | Vessel: {row['vessel_id']:12} | Concept: {row['concept_id']:25} | Cost: {row['cost']}")

if __name__ == "__main__":
    check_api()
