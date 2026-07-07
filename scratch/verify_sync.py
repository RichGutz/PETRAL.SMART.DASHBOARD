import sys
sys.path.append(r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase

sb = get_supabase()

# 1. Recuperar directamente de la tabla sources_sinks para 2026
res_direct = sb.table("sources_sinks").select("*").eq("year", 2026).execute()
direct_rows = res_direct.data

# 2. Recuperar a través del join que hace el endpoint /ports
res_join = sb.table("ports").select("*, sources_sinks(capacity_mt, type, empresa, color_hex, producto)").eq("sources_sinks.year", 2026).execute()
ports_data = res_join.data

direct_by_port = {}
for r in direct_rows:
    p_id = r["port_id"]
    if p_id not in direct_by_port:
        direct_by_port[p_id] = []
    direct_by_port[p_id].append({
        "empresa": r["empresa"],
        "type": r["type"],
        "producto": r["producto"],
        "capacity_mt": float(r["capacity_mt"]) if r["capacity_mt"] is not None else 0.0,
        "color_hex": r["color_hex"]
    })

joined_by_port = {}
for p in ports_data:
    p_id = p["port_id"]
    ss_list = p.get("sources_sinks", [])
    if not ss_list:
        continue
    joined_by_port[p_id] = []
    for ss in ss_list:
        joined_by_port[p_id].append({
            "empresa": ss["empresa"],
            "type": ss["type"],
            "producto": ss["producto"],
            "capacity_mt": float(ss["capacity_mt"]) if ss["capacity_mt"] is not None else 0.0,
            "color_hex": ss["color_hex"]
        })

print("\n--- COMPARACION DE PUERTOS ---")
all_ports = set(list(direct_by_port.keys()) + list(joined_by_port.keys()))

mismatches = 0
for port in all_ports:
    direct = direct_by_port.get(port, [])
    joined = joined_by_port.get(port, [])
    
    # Ordenar por empresa y producto para comparar
    direct_sorted = sorted(direct, key=lambda x: (x["empresa"], x["producto"]))
    joined_sorted = sorted(joined, key=lambda x: (x["empresa"], x["producto"]))
    
    if direct_sorted != joined_sorted:
        print(f"[X] DISCREPANCIA en Puerto '{port}':")
        print(f"   Directo: {direct_sorted}")
        print(f"   Joined:  {joined_sorted}")
        mismatches += 1
    else:
        print(f"[OK] Puerto '{port}' coincide perfectamente ({len(direct)} registros).")

if mismatches == 0:
    print("\nVERIFICACION EXITOSA: Los valores recuperados por el join de /ports son 100% IDÉNTICOS a los de la tabla sources_sinks.")
else:
    print(f"\nSe encontraron {mismatches} diferencias.")
