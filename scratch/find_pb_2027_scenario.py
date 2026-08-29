import sys
import os
import json

sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

def inspect_scenario():
    sb = get_supabase()
    res = sb.table("commercial_forecasts").select("*").ilike("name", "%PB 2027%").execute()
    print(f"Total matching scenarios: {len(res.data)}")
    for row in res.data:
        print("="*60)
        print("ID:", row.get("id"))
        print("NAME:", row.get("name"))
        print("USER_ID / AUTHOR:", row.get("user_id"))
        print("START_DATE:", row.get("start_date"))
        print("END_DATE:", row.get("end_date"))
        print("CREATED_AT:", row.get("created_at"))
        print("UPDATED_AT:", row.get("updated_at"))
        lines = row.get("projection_lines") or []
        print(f"PROJECTION_LINES COUNT: {len(lines)}")
        for l in lines:
            r_name = l.get("route_name") or l.get("route_id") or l.get("name") or l.get("quote_name")
            v_id = l.get("vessel_id")
            c_id = l.get("client_id")
            m_items = l.get("months") or {}
            non_zero_m = {k: v for k, v in m_items.items() if v}
            print(f"  Line -> Client: {c_id}, Vessel: {v_id}, Route: {r_name}")
            print(f"          Active Months: {non_zero_m}")

if __name__ == "__main__":
    inspect_scenario()
