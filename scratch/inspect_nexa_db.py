import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase
from backend.services.forecast_service import get_cached_masters

sb = get_supabase()
masters = get_cached_masters(sb)

print("--- CONTRACTS FOR NEXA ---")
nexa_contracts = [c for c in masters.get("contracts", []) if c.get("client_id") == "NEXA"]
for c in nexa_contracts:
    print(c)

print("\n--- ROUTES QUOTES FOR NEXA ---")
nexa_quotes = [q for q in masters.get("routes_quotes", []) if q.get("client_id") == "NEXA" or "NEXA" in str(q.get("name", ""))]
for q in nexa_quotes:
    print("ID:", q.get("id"), "SpotID:", q.get("spot_id"), "Name:", q.get("name"))
    print("  Legs_data keys:", (q.get("legs_data") or {}).keys())
    if "tramos" in (q.get("legs_data") or {}):
        print("  Tramos count:", len(q["legs_data"]["tramos"]))
        for t in q["legs_data"]["tramos"]:
            print("    Tramo:", t.get("origin_port_id"), "->", t.get("destination_port_id"), "dist:", t.get("route_distance"), "action:", t.get("action"))
