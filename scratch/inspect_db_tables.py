import os
import json
import sys

# Add backend directory to sys.path
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

sb = get_supabase()

print("--- 1. STRUCTURE & SAMPLES OF routes_clients ---")
try:
    res = sb.table("routes_clients").select("*").limit(3).execute()
    if res.data and len(res.data) > 0:
        print("Keys in routes_clients:", list(res.data[0].keys()))
        print("Sample row 0 in routes_clients:")
        print(json.dumps(res.data[0], indent=2, default=str))
    else:
        print("routes_clients is empty!")
except Exception as e:
    print("Error querying routes_clients:", e)

print("\n--- 2. STRUCTURE & SAMPLES OF routes_quotes ---")
try:
    res_q = sb.table("routes_quotes").select("*").limit(3).execute()
    if res_q.data and len(res_q.data) > 0:
        print("Keys in routes_quotes:", list(res_q.data[0].keys()))
        print("Sample row 0 in routes_quotes:")
        print(json.dumps(res_q.data[0], indent=2, default=str))
    else:
        print("routes_quotes is empty!")
except Exception as e:
    print("Error querying routes_quotes:", e)

print("\n--- 3. STRUCTURE OF vessels ---")
try:
    res_v = sb.table("vessels").select("*").limit(1).execute()
    if res_v.data and len(res_v.data) > 0:
        print("Keys in vessels:", list(res_v.data[0].keys()))
        print("Sample vessel:", json.dumps(res_v.data[0], indent=2, default=str))
except Exception as e:
    print("Error querying vessels:", e)

print("\n--- 4. STRUCTURE OF bunker_prices / contracts ---")
try:
    res_b = sb.table("bunker_prices").select("*").limit(2).execute()
    if res_b.data:
        print("Sample bunker_prices:", json.dumps(res_b.data, indent=2, default=str))
    res_c = sb.table("contracts").select("*").limit(2).execute()
    if res_c.data:
        print("Sample contracts:", json.dumps(res_c.data, indent=2, default=str))
except Exception as e:
    print("Error querying bunker/contracts:", e)
