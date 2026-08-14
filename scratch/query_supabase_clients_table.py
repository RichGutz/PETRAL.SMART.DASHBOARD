import urllib.request
import json

url = "https://forecast.geeksoft.tech/api/v1/forecast/clients"
print("FETCHING REAL SUPABASE CLIENTS FROM API:", url)

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("REAL SUPABASE CLIENTS DATA RETURNED:")
        print(json.dumps(data, indent=2))
except Exception as e:
    print("ERROR FETCHING FROM API:", e)
