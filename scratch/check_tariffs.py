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
    res = sb.table('contract_tariffs').select('*').limit(1).execute()
    if res.data:
        print('Contract Tariffs columns:', list(res.data[0].keys()))
    else:
        print('Contract Tariffs table empty or missing, checking schema via postgrest if possible...')
        res = sb.table('contract_tariffs').select('*').limit(0).execute()
        # postgrest doesn't easily return schema if empty without specific headers, but let's see what happens
