import urllib.request
import json

url = "https://hjjxooxcpvlvbaxgifbn.supabase.co/rest/v1/routes_quotes?name=eq.NEXA.ILO.CALLAO.MATARANI.ILO.2026%20(IZ)&select=name,description,client_id,legs_data"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"

req = urllib.request.Request(url, headers={"apikey": key, "Authorization": "Bearer " + key})
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read())

print("=== FETCH routes_quotes: NEXA.ILO.CALLAO.MATARANI.ILO.2026 (IZ) ===")
if not data:
    print("REGISTRO NO ENCONTRADO en routes_quotes")
else:
    for row in data:
        print("--- REGISTRO ENCONTRADO ---")
        print("name        :", row.get("name"))
        print("description :", row.get("description"))
        print("client_id   :", row.get("client_id"))
        ld = row.get("legs_data") or {}
        print("bunker_ifo  :", ld.get("bunker_price_ifo"))
        print("bunker_mdo  :", ld.get("bunker_price_mdo"))
        print("vessel_id   :", ld.get("vessel_id"))
        tramos = ld.get("tramos", [])
        print("tramos count:", len(tramos))
        print("legs_data keys:", list(ld.keys()))
