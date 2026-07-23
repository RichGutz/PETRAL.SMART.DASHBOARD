import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
sys.path.insert(0, r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine')
from backend.database import get_supabase

sb = get_supabase()
res = sb.table('routes_clients').select('name,legs_data').execute()

for r in res.data:
    name = r.get('name')
    legs = r.get('legs_data', {}).get('tramos', [])
    print(f'\n=== {name} ({len(legs)} piernas) ===')
    for i, leg in enumerate(legs):
        leg_type = leg.get('type', '?')
        dist = leg.get('route_distance', '?')
        orig = leg.get('origin_port_id', '?')
        dest = leg.get('destination_port_id', '?')
        wf = leg.get('weather_factor', '?')
        print(f'  Pierna {i+1}: type={leg_type} dist={dist} orig={orig} dest={dest} wf={wf}')
