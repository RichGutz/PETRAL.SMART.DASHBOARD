import requests
import json

SUPABASE_URL = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# 1. Obtener los 11 registros de routes_clients
res_rc = requests.get(f"{SUPABASE_URL}/rest/v1/routes_clients?select=*", headers=headers)
routes_clients_data = res_rc.json() if res_rc.status_code == 200 else []

print(f"Total filas a migrar de 'routes_clients': {len(routes_clients_data)}")

migrated_count = 0
for rc in routes_clients_data:
    r_name = rc.get("name") or rc.get("route_id") or str(rc.get("id"))
    if not r_name:
        continue

    # Extraer cliente del nombre
    name_upper = r_name.upper()
    client_id = "SPCC" if name_upper.startswith("SPCC") else "NEXA"

    legs = rc.get("legs_data") or {}
    if not isinstance(legs, dict):
        legs = {}
    legs["client_id"] = client_id
    legs["is_multicotizador"] = True

    payload = {
        "route_id": r_name,
        "name": r_name,
        "spot_id": r_name,
        "legs_data": legs
    }

    # Verificar si existe en routes_quotes
    chk = requests.get(f"{SUPABASE_URL}/rest/v1/routes_quotes?route_id=eq.{r_name}", headers=headers)
    matched = chk.json() if chk.status_code == 200 else []

    if matched and len(matched) > 0:
        print(f"  Actualizando en routes_quotes: {r_name} ({client_id})...")
        r_upd = requests.patch(f"{SUPABASE_URL}/rest/v1/routes_quotes?route_id=eq.{r_name}", headers=headers, json=payload)
        print(f"    Resultado: HTTP {r_upd.status_code}")
    else:
        print(f"  Insertando en routes_quotes: {r_name} ({client_id})...")
        r_ins = requests.post(f"{SUPABASE_URL}/rest/v1/routes_quotes", headers=headers, json=payload)
        print(f"    Resultado: HTTP {r_ins.status_code}")
        if r_ins.status_code in [200, 201]:
            migrated_count += 1

# Verificar conteo final en routes_quotes
res_final = requests.get(f"{SUPABASE_URL}/rest/v1/routes_quotes?select=*", headers=headers)
quotes_final = res_final.json() if res_final.status_code == 200 else []
print(f"\n=======================================================")
print(f"Total filas en 'routes_quotes' ahora en DB: {len(quotes_final)}")
print(f"=======================================================")
