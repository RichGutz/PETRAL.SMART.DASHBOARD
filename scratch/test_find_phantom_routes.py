import os
import sys
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

supabase = get_supabase()

res = supabase.table('routes_quotes').select('*').execute()
routes = res.data or []

print(f"Total rutas encontradas en routes_quotes: {len(routes)}")

candidates = []
for r in routes:
    ld = r.get('legs_data') or {}
    tramos = ld.get('tramos', [])
    puertos = ld.get('puertosConfig', [])
    name = r.get('name', '')
    
    # Detectar si tiene tramo 0 fantasma (dist 0 y mismo origen/destino)
    if tramos and len(tramos) >= 2:
        t0 = tramos[0]
        if (t0.get('origin_port_id') == t0.get('destination_port_id')) or float(t0.get('route_distance') or 0) == 0:
            candidates.append(r)

print(f"Rutas candidatas con tramo 0 fantasma para clonar: {len(candidates)}")
for c in candidates:
    print(f"  - {c.get('name')} (ID: {c.get('name')})")
