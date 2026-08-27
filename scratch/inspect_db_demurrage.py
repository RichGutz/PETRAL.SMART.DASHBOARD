import urllib.request
import json
import os

key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"
base_url = "https://hjjxooxcpvlvbaxgifbn.supabase.co/rest/v1"

def fetch_table(table, select="*"):
    url = f"{base_url}/{table}?select={select}"
    req = urllib.request.Request(url, headers={"apikey": key, "Authorization": "Bearer " + key})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

print("=== INSPECTING SCENARIOS ===")
scenarios = fetch_table("commercial_scenarios")
for s in scenarios:
    print(f"Scenario ID: {s.get('id')} | Name: {s.get('name')} | Created: {s.get('created_at')}")
    # Inspect scenario lines if stored in scenario or related table
    # check keys in scenario
    print(" Scenario keys:", list(s.keys()))

print("\n=== INSPECTING SCENARIO LINES / PROJECTIONS ===")
try:
    scenario_lines = fetch_table("scenario_projections")
    print(f"Total scenario_projections: {len(scenario_lines)}")
    for sl in scenario_lines:
        print(sl)
except Exception as e:
    print("Error scenario_projections:", e)

print("\n=== INSPECTING ROUTES QUOTES (DEMURRAGE CHECK) ===")
quotes = fetch_table("routes_quotes")
print(f"Total quotes: {len(quotes)}")
for q in quotes:
    name = q.get("name", "")
    desc = q.get("description", "")
    legs_data = q.get("legs_data") or {}
    
    # Check for demurrage in quote or legs_data
    demurrage_fields = {}
    for k, v in q.items():
        if "demurrage" in k.lower() or "laytime" in k.lower() or "overtime" in k.lower():
            demurrage_fields[k] = v
    for k, v in legs_data.items():
        if "demurrage" in k.lower() or "laytime" in k.lower() or "overtime" in k.lower():
            demurrage_fields["legs_data." + k] = v
            
    print(f"\n--- QUOTE: {name} (Client: {q.get('client_id')}) ---")
    print(f"  Vessel: {q.get('vessel_name')} | Freight: {q.get('freight_rate')} | Cargo: {q.get('cargo_quantity')}")
    print(f"  Voyage Result (P/L): {q.get('voyage_result')} | Net Revenue: {q.get('net_revenue')}")
    print(f"  Demurrage fields in quote: {demurrage_fields}")
    if "legs" in legs_data:
        print(f"  Legs count: {len(legs_data.get('legs', []))}")
        for leg in legs_data.get("legs", []):
            leg_dem = {lk: lv for lk, lv in leg.items() if "demurrage" in lk.lower() or "laytime" in lk.lower()}
            if leg_dem:
                print(f"    Leg {leg.get('origin_port')} -> {leg.get('destination_port')}: {leg_dem}")
