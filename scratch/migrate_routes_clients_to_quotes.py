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

print("1. Consultando todas las filas en 'routes_clients'...")
res_rc = requests.get(f"{SUPABASE_URL}/rest/v1/routes_clients?select=*", headers=headers)
routes_clients_data = res_rc.json() if res_rc.status_code == 200 else []

print(f"Total registros en routes_clients: {len(routes_clients_data)}")

# 2. Migrar cada registro a 'routes_quotes'
migrated_count = 0
for rc in routes_clients_data:
    r_name = rc.get("name") or rc.get("route_id") or rc.get("id")
    if not r_name:
        continue

    # Extraer cliente del nombre si no está explícito
    name_upper = r_name.upper()
    client_id = rc.get("client_id")
    if not client_id:
        if name_upper.startswith("SPCC"):
            client_id = "SPCC"
        elif name_upper.startswith("NEXA"):
            client_id = "NEXA"
        else:
            client_id = "NEXA"

    payload = {
        "name": r_name,
        "route_id": r_name,
        "client_id": client_id,
        "origin_port_id": rc.get("port_a") or rc.get("pol") or rc.get("origin_port_id") or "CALLAO",
        "destination_port_id": rc.get("port_b") or rc.get("pod") or rc.get("destination_port_id") or "MEJILLONES",
        "is_prospect": True,
        "description": rc.get("description") or f"Cotización Migrada - Cliente {client_id}",
        "legs_data": rc.get("legs_data") or {}
    }

    # Upsert en routes_quotes
    chk = requests.get(f"{SUPABASE_URL}/rest/v1/routes_quotes?route_id=eq.{r_name}", headers=headers)
    matched = chk.json() if chk.status_code == 200 else []

    if matched and len(matched) > 0:
        print(f"  Actualizando en routes_quotes: {r_name} ({client_id})...")
        r_upd = requests.patch(f"{SUPABASE_URL}/rest/v1/routes_quotes?route_id=eq.{r_name}", headers=headers, json=payload)
    else:
        print(f"  Insertando en routes_quotes: {r_name} ({client_id})...")
        r_ins = requests.post(f"{SUPABASE_URL}/rest/v1/routes_quotes", headers=headers, json=payload)
        if r_ins.status_code in [200, 201]:
            migrated_count += 1

print(f"\nMigración completada con éxito a 'routes_quotes'. Total procesados: {len(routes_clients_data)}")
