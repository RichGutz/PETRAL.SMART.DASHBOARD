import os
import sys
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

supabase = get_supabase()
res = supabase.table('routes_quotes').select('*').ilike('name', '%MOQUEGUA%').execute()

for r in res.data[:5]:
    print('========================================')
    print('KEYS:', list(r.keys()))
    print('NAME:', r.get('name'))
    ld = r.get('legs_data') or {}
    tramos = ld.get('tramos', [])
    puertos = ld.get('puertosConfig', [])
    print(f'  tramos count: {len(tramos)}, puertos count: {len(puertos)}')
    for idx, t in enumerate(tramos):
        orig = t.get('origin_port_id')
        dest = t.get('destination_port_id')
        dist = t.get('route_distance')
        ttype = t.get('type')
        print(f'    tramo[{idx}]: {orig} -> {dest}, dist: {dist}, type: {ttype}')
    for idx, p in enumerate(puertos):
        act = p.get('action')
        q = p.get('quantity')
        cost = p.get('manual_port_cost')
        muell = p.get('muellaje_cost')
        print(f'    puerto[{idx}]: action={act}, Q={q}, cost={cost}, muellaje={muell}')
