import urllib.request
import json

url = "https://forecast.geeksoft.tech/api/v1/forecast/spot/list"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print("TOTAL SPOT RECORDS IN BD:", len(data))
    nexa_records = [d for d in data if 'NEXA' in json.dumps(d).upper()]
    print("NEXA RECORDS IN BD:", len(nexa_records))
    for r in nexa_records:
        print(f"- ID: {r.get('spot_id')}, Name: '{r.get('name')}', Source: '{r.get('table_source')}', IsProspect: {r.get('is_prospect')}")
