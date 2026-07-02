import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

def update_launch():
    sb = get_supabase()
    res = sb.table("port_costs_matrix")\
            .update({"cost": 2730})\
            .eq("client_id", "SPCC")\
            .eq("port_id", "ILO")\
            .eq("operation_type", "CARGA")\
            .eq("vessel_id", "MOQUEGUA")\
            .eq("concept_id", "launch_hire")\
            .execute()
            
    if res.data:
        print("¡Update exitoso! Costo de launch_hire en ILO actualizado a $2,730 (incluyendo lancha autoridades).")
    else:
        print("ERROR: No se pudo actualizar el registro.")

if __name__ == "__main__":
    update_launch()
