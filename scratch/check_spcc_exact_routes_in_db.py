import urllib.request
import json

endpoints = {
    "contracts": "https://forecast.geeksoft.tech/api/v1/forecast/masters/contracts",
    "spot_list": "https://forecast.geeksoft.tech/api/v1/forecast/spot/list",
    "routes": "https://forecast.geeksoft.tech/api/v1/forecast/routes"
}

for name, url in endpoints.items():
    print(f"\n=================== {name} ({url}) ===================")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if isinstance(data, list):
                spcc_items = [d for d in data if 'SPCC' in json.dumps(d)]
                print(f"Total items in {name}: {len(data)}")
                print(f"SPCC items in {name}: {len(spcc_items)}")
                print("SPCC Sample:", json.dumps(spcc_items, indent=2))
    except Exception as e:
        print("ERROR:", e)
