import requests

BASE_URL = "https://forecast.geeksoft.tech/api/v1/forecast"

try:
    r_routes = requests.get(f"{BASE_URL}/spot/list")
    routes = r_routes.json()
    print(f"=== /spot/list (Total: {len(routes)}) ===")
    for r in routes:
        print(f"  Name: {r.get('name')}, ClientID: {r.get('client_id')}, Table: {r.get('table_source')}")

    r_clients = requests.get(f"{BASE_URL}/clients")
    clients = r_clients.json()
    print(f"\n=== /clients (Total: {len(clients)}) ===")
    print(clients)
except Exception as e:
    print(f"Error: {e}")
