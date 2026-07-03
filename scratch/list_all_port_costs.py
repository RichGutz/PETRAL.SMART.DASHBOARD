import sys
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase

def list_costs():
    sb = get_supabase()
    res = sb.table("port_costs_matrix").select("*").execute()
    
    # Agrupar datos por vessel_id, port_id, terminal, operation_type
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
        
    print("=== CONTENIDO DE PORT_COSTS_MATRIX EN FORMATO HUMANO ===\n")
    
    # Ordenar por buque, puerto, operación
    sorted_keys = sorted(grouped.keys(), key=lambda x: (x[0], x[1], x[3]))
    
    current_vessel = None
    for key in sorted_keys:
        v, p, t, op = key
        concepts = grouped[key]
        total = sum(c[1] for c in concepts)
        
        if v != current_vessel:
            print(f"\n* BUQUE: {v}")
            print("-" * 50)
            current_vessel = v
            
        print(f"  * Puerto: {p} | Terminal: {t} | Operacion: {op} | TOTAL: ${total:,.2f} USD")
        for concept, cost in sorted(concepts, key=lambda x: x[0]):
            print(f"     - {concept}: ${cost:,.2f} USD")
        print()

if __name__ == "__main__":
    list_costs()
