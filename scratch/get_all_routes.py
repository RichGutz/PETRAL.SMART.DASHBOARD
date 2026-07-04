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
    res = sb.table('routes').select('port_a, port_b').execute()
    if res.data:
        for r in res.data:
            print(f"{r['port_a']} - {r['port_b']}")
    else:
        print('No route data')
