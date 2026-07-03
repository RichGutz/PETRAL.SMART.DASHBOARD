import sys
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase

def list_vessels():
    sb = get_supabase()
    res = sb.table("vessels").select("*").execute()
    
    if not res.data:
        print("No hay barcos registrados en vessels.")
        return
        
    print("=== REGISTROS EN MAESTRO FLOTA (vessels) ===")
    columns = list(res.data[0].keys())
    print(f"Columnas disponibles ({len(columns)}): {columns}\n")
    
    for v in res.data:
        print(f"* BUQUE: {v['vessel_id']} ({v.get('vessel_name', 'N/A')})")
        print("-" * 60)
        for k, val in sorted(v.items()):
            if k not in ["vessel_id", "vessel_name"]:
                print(f"  - {k}: {val}")
        print()

if __name__ == "__main__":
    list_vessels()
