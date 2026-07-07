import urllib.request
import json

try:
    url = "https://forecast.geeksoft.tech/api/v1/forecast/ports?year=2026"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        print("Production ports count:", len(data))
        for p in data:
            print(p["port_id"], "-> sources_sinks:", p.get("sources_sinks"))
except Exception as e:
    print("Error:", e)
