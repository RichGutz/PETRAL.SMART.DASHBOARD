import urllib.request
import json

url = "https://forecast.geeksoft.tech/api/v1/forecast/spot/list"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print("SPOT VOYAGES COUNT:", len(data))
    for s in data:
        print(f"ID: {s.get('spot_id')}, Name: {s.get('name')}, Source: {s.get('table_source')}, IsProspect: {s.get('is_prospect')}")
