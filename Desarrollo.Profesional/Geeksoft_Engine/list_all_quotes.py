import urllib.request
import json

url = "https://hjjxooxcpvlvbaxgifbn.supabase.co/rest/v1/routes_quotes?select=name,description,client_id,legs_data"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"

req = urllib.request.Request(url, headers={"apikey": key, "Authorization": "Bearer " + key})
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read())

print(f"Total quotes: {len(data)}")
for row in data:
    name = row.get("name", "")
    desc = row.get("description", "")
    ld = row.get("legs_data") or {}
    ifo = ld.get("bunker_price_ifo")
    mdo = ld.get("bunker_price_mdo")
    print(f"NAME: {name} | DESC: {desc} | IFO: {ifo} | MDO: {mdo}")
