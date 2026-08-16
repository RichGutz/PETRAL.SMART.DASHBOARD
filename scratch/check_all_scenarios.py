import requests

url = 'https://forecast.geeksoft.tech/api/v1/forecast/list'
r = requests.get(url)
forecasts = r.json()

for f in forecasts:
    m_id = f['id']
    name = f['name']
    load_r = requests.get(f"https://forecast.geeksoft.tech/api/v1/forecast/load/{m_id}")
    f_data = load_r.json()
    lines = f_data.get('projection_lines', [])
    routes_found = set()
    for l in lines:
        r_id = l.get('route_id') or f"{l.get('origin_port_id')}-{l.get('destination_port_id')}"
        routes_found.add(r_id)
    print(f"\nScenario: '{name}' | ID: {m_id}")
    print(f"   Unique routes in lines: {routes_found}")
