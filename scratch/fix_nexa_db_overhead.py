import json
import os
from supabase import create_client

env_path = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/.env'
url = None
key = None
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line.startswith('SUPABASE_URL='):
            url = line.split('=', 1)[1].strip('"\' ')
        elif line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
            key = line.split('=', 1)[1].strip('"\' ')

if url and key:
    sb = create_client(url, key)
    res = sb.table('routes_clients').select('*').execute()
    for row in res.data:
        name = row.get('name') or row.get('route_name')
        if name and 'NEXA.ILO.CALLAO.MATARANI.ILO' in str(name):
            rd = row.get('route_data') or {}
            pc = rd.get('puertosConfig', [])
            updated = False
            for p in pc:
                if p.get('action') == 'DESCARGAR':
                    p['overhead'] = '6'
                    updated = True
            if updated:
                rd['puertosConfig'] = pc
                sb.table('routes_clients').update({'route_data': rd}).eq('id', row['id']).execute()
                print(f'✅ Actualizada ruta ID {row["id"]} ({name}): Overhead Matarani fijado en "6" explícito en Supabase.')
