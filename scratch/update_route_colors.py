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
    
    route_colors = {
        ('ILO', 'MATARANI'): '#06B6D4',
        ('ILO', 'MARCONA'): '#A855F7',
        ('ILO', 'MEJILLONES'): '#D946EF',
        ('MEJILLONES', 'TALARA'): '#F43F5E',
        ('BARQUITO', 'TALARA'): '#EF4444',
        ('CALLAO', 'TALARA'): '#F97316',
        ('CALLAO', 'MARCONA'): '#F59E0B',
        ('CALLAO', 'MATARANI'): '#EAB308',
        ('CALLAO', 'ILO'): '#84CC16',
        ('CALLAO', 'MEJILLONES'): '#22C55E',
        ('BARQUITO', 'CALLAO'): '#10B981',
        ('MARCONA', 'TALARA'): '#14B8A6',
        ('MARCONA', 'MATARANI'): '#0EA5E9',
        ('MATARANI', 'TALARA'): '#3B82F6',
        ('ILO', 'TALARA'): '#6366F1',
        ('MARCONA', 'MEJILLONES'): '#8B5CF6',
        ('BARQUITO', 'MARCONA'): '#D946EF',
        ('MATARANI', 'MEJILLONES'): '#EC4899',
        ('BARQUITO', 'MATARANI'): '#F43F5E',
        ('BARQUITO', 'ILO'): '#E11D48',
        ('BARQUITO', 'MEJILLONES'): '#BE123C'
    }
    
    for (port_a, port_b), color in route_colors.items():
        try:
            res = sb.table('routes').update({'color_hex': color}).eq('port_a', port_a).eq('port_b', port_b).execute()
            print(f'Updated {port_a} - {port_b} to {color}')
        except Exception as e:
            print(f'Error updating {port_a} - {port_b}: {e}')
    print('Colors populated via Supabase REST API successfully!')
else:
    print('Failed to load url or key')
