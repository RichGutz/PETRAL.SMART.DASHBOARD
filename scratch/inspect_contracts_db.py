import requests

API_URL = "https://forecast.geeksoft.tech/api/v1/forecast/masters/routes"

try:
    resp = requests.get(API_URL)
    routes = resp.json()
    print(f"Total rutas devueltas: {len(routes)}")
    for r in routes:
        if r.get("is_contract") or r.get("table_source") == "contracts":
            print(f"Contract ID: {r.get('contract_id')}, Client: {r.get('client_id')}, Name: {r.get('name')}, Origin: {r.get('origin_port_id')}, Dest: {r.get('destination_port_id')}")
except Exception as e:
    print(f"Error: {e}")
