import requests

SUPABASE_URL = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# 1. Eliminar filas con origin == destination o sin legs_data
print("1. Limpiando filas obsoletas o duplicadas en 'contracts'...")
res = requests.get(f"{SUPABASE_URL}/rest/v1/contracts?select=*", headers=headers)
rows = res.json() if res.status_code == 200 else []

for r in rows:
    orig = r.get("origin_port_id")
    dest = r.get("destination_port_id")
    c_id = r.get("contract_id")
    name = r.get("name")
    ld = r.get("legs_data") or {}
    
    # Si orig == dest o no tiene legs_data multicotizador, eliminar
    if orig == dest or not ld.get("is_multicotizador"):
        print(f"  Eliminando fila obsoleta: {name} ({orig} -> {dest}) [Contract ID: {c_id}]...")
        # Filtrar por contract_id + origin + dest
        requests.delete(f"{SUPABASE_URL}/rest/v1/contracts?contract_id=eq.{c_id}&origin_port_id=eq.{orig}&destination_port_id=eq.{dest}", headers=headers)

# 2. Ahora volver a ejecutar el insert de las 5 rutas contractuales del Multicotizador
print("\n2. Insertando/Actualizando las 5 rutas contractuales del Multicotizador...")
from upsert_full_legacy_contracts import contracts_data

for c in contracts_data:
    name = c["name"]
    client_id = c["client_id"]
    orig = c["origin_port_id"]
    dest = c["destination_port_id"]
    c_id = c["contract_id"]

    # Verificar si existe
    chk = requests.get(f"{SUPABASE_URL}/rest/v1/contracts?client_id=eq.{client_id}&origin_port_id=eq.{orig}&destination_port_id=eq.{dest}", headers=headers)
    matched = chk.json() if chk.status_code == 200 else []

    if matched and len(matched) > 0:
        print(f"  Actualizando: {name} ({client_id} | {orig} -> {dest})...")
        r_upd = requests.patch(f"{SUPABASE_URL}/rest/v1/contracts?client_id=eq.{client_id}&origin_port_id=eq.{orig}&destination_port_id=eq.{dest}", headers=headers, json=c)
        print(f"    Resultado: {r_upd.status_code}")
    else:
        print(f"  Insertando: {name} ({client_id} | {orig} -> {dest})...")
        r_ins = requests.post(f"{SUPABASE_URL}/rest/v1/contracts", headers=headers, json=c)
        print(f"    Resultado: {r_ins.status_code}")

print("\nFinalizado con éxito.")
