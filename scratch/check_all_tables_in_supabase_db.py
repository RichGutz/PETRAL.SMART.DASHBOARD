import urllib.request
import json

supabase_url = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY4ODg4MDksImV4cCI6MjAzMjQ2NDgwOX0.G6_Pz0a_pD0g"

tables = ["routes_quotes", "quotes", "prospects", "clients", "routes_clients"]

for tbl in tables:
    url = f"{supabase_url}/rest/v1/{tbl}?select=*"
    try:
        req = urllib.request.Request(url, headers={
            'apikey': anon_key,
            'Authorization': f'Bearer {anon_key}'
        })
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"TABLE '{tbl}' COUNT:", len(data))
            if len(data) > 0:
                print("SAMPLE:", json.dumps(data[:2], indent=2))
    except Exception as e:
        print(f"TABLE '{tbl}' ERROR:", e)
