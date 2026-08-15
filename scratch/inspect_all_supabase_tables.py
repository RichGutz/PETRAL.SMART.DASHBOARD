import requests

SUPABASE_URL = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

tables = ["contracts", "routes_quotes", "routes_clients"]

for t in tables:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{t}?select=*", headers=headers)
    data = r.json() if r.status_code == 200 else []
    print(f"Tabla '{t}': {len(data)} filas (HTTP {r.status_code})")
    if data:
        print(f"  Primeros 3 nombres: {[d.get('name') or d.get('route_id') or d.get('id') for d in data[:3]]}")
