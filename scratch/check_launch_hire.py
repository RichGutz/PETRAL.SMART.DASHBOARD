import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

def check_launch():
    sb = get_supabase()
    res = sb.table("port_costs_matrix").select("*").eq("concept_id", "launch_hire").execute()
    print("=== REGISTROS DE launch_hire EN LA DB ===")
    for row in res.data:
        print(f"Client: {row['client_id']:10} | Port: {row['port_id']:12} | Vessel: {row['vessel_id']:12} | Cost: {row['cost']}")

if __name__ == "__main__":
    check_launch()
