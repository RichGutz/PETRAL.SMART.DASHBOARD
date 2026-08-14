import urllib.request
import json

endpoints = [
    "https://forecast.geeksoft.tech/api/v1/forecast/clients",
    "https://forecast.geeksoft.tech/api/v1/forecast/routes",
    "https://forecast.geeksoft.tech/api/v1/forecast/spot/list",
    "https://forecast.geeksoft.tech/api/v1/forecast/masters/contracts"
]

for url in endpoints:
    print(f"\n=================== {url} ===================")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(json.dumps(data, indent=2))
    except Exception as e:
        print("ERROR:", e)
