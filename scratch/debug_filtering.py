import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

def debug_filter():
    sb = get_supabase()
    port_costs_data = sb.table("port_costs_matrix").select("*").execute().data
    
    client_id = "SPCC"
    port_id = "ILO"
    operation_type = "CARGA"
    vessel_id = "MOQUEGUA"
    term_id = "GENERAL"
    
    costs = [
        c for c in port_costs_data
        if c.get("client_id") == client_id 
        and c.get("port_id") == port_id 
        and c.get("terminal") == term_id
        and c.get("operation_type") == operation_type 
        and c.get("vessel_id") == vessel_id
    ]
    
    print("=== FILTRADO EN PYTHON DE ILO ===")
    for c in costs:
        print(f"Concept: {c['concept_id']:25} | Cost: {c['cost']}")

if __name__ == "__main__":
    debug_filter()
