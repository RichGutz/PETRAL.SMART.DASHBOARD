import requests

API_URL = "https://forecast.geeksoft.tech/api/v1/forecast/masters/routes"

try:
    resp = requests.get(API_URL)
    routes = resp.json()
    contract_routes = [r for r in routes if r.get("is_contract") or r.get("table_source") == "contracts"]
    print(f"Total rutas devueltas: {len(routes)}")
    print(f"Rutas de contratos: {len(contract_routes)}")
    
    clients = set()
    for r in contract_routes:
        cid = r.get("client_id") or (r.get("name", "").split(".")[0])
        clients.add(cid)
        print(f"  [{cid}] {r.get('name')} | Validez: {r.get('valid_from')} - {r.get('valid_to')}")
        
    print(f"\nClientes en contratos: {list(clients)}")
except Exception as e:
    print(f"Error: {e}")
