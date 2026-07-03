import sys
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase

def list_costs():
    sb = get_supabase()
    res = sb.table("port_costs_matrix").select("*").execute()
    
    grouped = {}
    for row in res.data:
        v = row["vessel_id"]
        p = row["port_id"]
        t = row["terminal"]
        op = row["operation_type"]
        concept = row["concept_id"]
        cost = float(row["cost"])
        
        key = (v, p, t, op)
        if key not in grouped:
            grouped[key] = []
        grouped[key].append((concept, cost))
        
    sorted_keys = sorted(grouped.keys(), key=lambda x: (x[0], x[1], x[3]))
    
    for key in sorted_keys:
        v, p, t, op = key
        if v in ["DEFAULT", "CONCON_TRADER"]:
            concepts = grouped[key]
            total = sum(c[1] for c in concepts)
            print(f"BUQUE: {v} | Puerto: {p} | Terminal: {t} | Operacion: {op} | TOTAL: ${total:,.2f} USD")
            for concept, cost in sorted(concepts, key=lambda x: x[0]):
                print(f"     - {concept}: ${cost:,.2f} USD")
            print()

if __name__ == "__main__":
    list_costs()
