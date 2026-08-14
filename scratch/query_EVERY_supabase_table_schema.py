import urllib.request
import json

endpoints = {
    "vessels": "https://forecast.geeksoft.tech/api/v1/forecast/vessels",
    "ports": "https://forecast.geeksoft.tech/api/v1/forecast/ports",
    "port_costs_static": "https://forecast.geeksoft.tech/api/v1/forecast/port_costs_static",
    "contracts": "https://forecast.geeksoft.tech/api/v1/forecast/masters/contracts",
    "routes": "https://forecast.geeksoft.tech/api/v1/forecast/routes",
    "routes_master": "https://forecast.geeksoft.tech/api/v1/forecast/masters/routes",
    "bunker": "https://forecast.geeksoft.tech/api/v1/forecast/bunker",
    "spot_list": "https://forecast.geeksoft.tech/api/v1/forecast/spot/list"
}

results = {}

for key, url in endpoints.items():
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            sample = data[:2] if isinstance(data, list) else data
            results[key] = {
                "count": len(data) if isinstance(data, list) else 1,
                "sample": sample
            }
    except Exception as e:
        results[key] = {"error": str(e)}

print(json.dumps(results, indent=2))
