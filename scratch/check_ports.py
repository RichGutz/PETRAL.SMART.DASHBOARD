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
    res = sb.table('ports').select('*').limit(1).execute()
    if res.data:
        print('Ports columns:', list(res.data[0].keys()))
