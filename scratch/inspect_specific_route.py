import os
import sys
import json
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

supabase = get_supabase()

res = supabase.table('routes_quotes').select('*').eq('name', 'SPCC.ILO.ILO.MEJILLONES.ILO.2025-2027 COA MOQUEGUA').execute()

if res.data:
    r = res.data[0]
    print("NAME:", r.get('name'))
    ld = r.get('legs_data') or {}
    print("KEYS in legs_data:", list(ld.keys()))
    print("tramos:", json.dumps(ld.get('tramos'), indent=2))
    print("puertosConfig:", json.dumps(ld.get('puertosConfig'), indent=2))
    print("vesselParams:", json.dumps(ld.get('vesselParams'), indent=2))
    print("bunker_price_ifo:", ld.get('bunker_price_ifo'))
    print("bunker_price_mdo:", ld.get('bunker_price_mdo'))
    print("financial_summary:", json.dumps(ld.get('financial_summary'), indent=2))
