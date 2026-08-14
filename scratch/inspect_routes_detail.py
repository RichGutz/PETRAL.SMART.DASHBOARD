import os
import json
import sys

sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

sb = get_supabase()

print("=== ALL ROUTES IN routes_clients ===")
res_c = sb.table("routes_clients").select("*").execute()
for i, r in enumerate(res_c.data or []):
    print(f"\n--- Route Client #{i+1}: ID={r.get('route_id')} | Name={r.get('name')} | Client={r.get('description')} ---")
    legs = r.get('legs_data')
    if isinstance(legs, dict):
        print("  Legs_data keys:", list(legs.keys()))
        tramos = legs.get('tramos', [])
        print(f"  Tramos count: {len(tramos)}")
        for j, t in enumerate(tramos):
            print(f"    Tramo {j+1}: {t.get('origin_port_id')} -> {t.get('destination_port_id')} ({t.get('type')}) | Dist={t.get('route_distance')} | LoadRate={t.get('contract_agreed_load_rate')} | DischRate={t.get('contract_agreed_discharge_rate')} | LoadDelay={t.get('port_delay_hours_loading')} | DischDelay={t.get('port_delay_hours_discharging')}")
        print(f"  bunker_price_ifo={legs.get('bunker_price_ifo')}, bunker_price_mdo={legs.get('bunker_price_mdo')}")

print("\n=== ALL QUOTES IN routes_quotes ===")
res_q = sb.table("routes_quotes").select("*").execute()
print(f"Count in routes_quotes: {len(res_q.data or [])}")
for i, q in enumerate(res_q.data or []):
    print(f"Quote #{i+1}:", q.get('name'), q.get('legs_data'))
