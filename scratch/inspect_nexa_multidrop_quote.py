import os, sys
engine_dir = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine"
if engine_dir not in sys.path:
    sys.path.insert(0, engine_dir)

import json
from backend.database import get_supabase

supabase = get_supabase()
res = supabase.table('routes_quotes').select('*').execute()
quotes = res.data or []
print(f"Total quotes in DB: {len(quotes)}")

r = supabase.table('routes_quotes').select('*').eq('name', 'NEXA.ILO.CALLAO.MARCONA.MATARANI.ILO.2026 MARCOBRE Y QUILLA').execute()
if r.data:
    row = r.data[0]
    print("=" * 80)
    print("NAME:", row.get('name'))
    print("CLIENT_ID:", row.get('client_id'))
    print("ORIGIN:", row.get('origin_port_id'))
    print("DESTINATION:", row.get('destination_port_id'))
    print("LEGS_DATA:")
    print(json.dumps(row.get('legs_data'), indent=2))


