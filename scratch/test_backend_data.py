import requests
import json

url = 'https://forecast.geeksoft.tech/api/v1/forecast/list'
r = requests.get(url)
print("Status Code:", r.status_code)
forecasts = r.json()
print("Total forecasts:", len(forecasts))
for f in forecasts:
    print(f"\nID: {f.get('id')} | Name: '{f.get('name')}' | User: {f.get('user_id')}")

# Load PRIMER.MODELO.MODULAR
modular = [f for f in forecasts if 'PRIMER.MODELO.MODULAR' in f.get('name', '').upper()]
if modular:
    m_id = modular[0]['id']
    print(f"\nLoading forecast {m_id}...")
    load_r = requests.get(f"https://forecast.geeksoft.tech/api/v1/forecast/load/{m_id}")
    f_data = load_r.json()
    lines = f_data.get('projection_lines', [])
    print(f"Total projection lines in PRIMER.MODELO.MODULAR: {len(lines)}")
    
    unique_routes = set()
    for l in lines:
        client = l.get('client')
        route_id = l.get('route_id')
        origin = l.get('origin_port_id')
        dest = l.get('destination_port_id')
        vessel = l.get('vessel')
        unique_routes.add((client, route_id, origin, dest, vessel))
    
    print("\n--- UNIQUE ROUTES IN SCENARIO PRIMER.MODELO.MODULAR ---")
    for ur in sorted(list(unique_routes)):
        print(f"Client: {ur[0]} | route_id: '{ur[1]}' | origin_port_id: '{ur[2]}' | dest_port_id: '{ur[3]}' | vessel: '{ur[4]}'")

    # Run simulation to see aggregated_data structure
    print("\nRunning simulation with these lines...")
    sim_payload = {
        "start_date": f_data.get("start_date", "2027-01-01"),
        "end_date": f_data.get("end_date", "2027-12-31"),
        "projection_lines": lines
    }
    sim_r = requests.post("https://forecast.geeksoft.tech/api/v1/forecast/run", json=sim_payload)
    sim_res = sim_r.json()
    ag = sim_res.get("aggregated_data", {})
    print("\n--- AGGREGATED DATA KEYS ---")
    for client, routes in ag.items():
        print(f"Client: {client}")
        for route_name, vessels in routes.items():
            print(f"   Route key in aggregated_data: '{route_name}'")
            for vessel_name, months in vessels.items():
                print(f"      Vessel: '{vessel_name}' | Months count: {len(months)}")
