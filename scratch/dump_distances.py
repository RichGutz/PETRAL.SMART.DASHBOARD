import sys
import json
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

sb = get_supabase()
d_res = sb.table('distances').select('*').execute().data

ports_set = set()
print(f"Total filas en la tabla 'distances': {len(d_res)}")
print("-" * 60)
for i, r in enumerate(d_res, 1):
    pa = r.get("port_a")
    pb = r.get("port_b")
    if pa: ports_set.add(pa)
    if pb: ports_set.add(pb)
    print(f"{i:02d}. {pa} <---> {pb} | Distancia: {r.get('route_distance')} NM")

print("-" * 60)
sorted_ports = sorted(list(ports_set))
print(f"Puertos Unicos en 'distances' ({len(sorted_ports)}):")
for p in sorted_ports:
    print(f" - {p}")
