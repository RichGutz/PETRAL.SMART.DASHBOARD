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
    
    colors = {
        'TABLONES': '#DC2626',
        'MOQUEGUA': '#16A34A',
        'CONCON TRADER': '#475569',
        'HUEMUL': '#4F46E5'
    }
    
    for vessel_id, color in colors.items():
        try:
            res = sb.table('vessels').update({'color_hex': color}).eq('vessel_id', vessel_id).execute()
            print(f'Updated {vessel_id} to {color}')
        except Exception as e:
            print(f'Error updating {vessel_id}: {e}')
    print('Colors populated via Supabase REST API successfully!')
else:
    print('Failed to load url or key')
