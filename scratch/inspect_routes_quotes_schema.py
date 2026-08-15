import requests

SUPABASE_URL = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# Obtener OpenAPI schema o intentar post simple
r = requests.get(f"{SUPABASE_URL}/rest/v1/?select=*", headers=headers)
print("Schema status:", r.status_code)

# Intentar insertar 1 fila de prueba limpia en routes_quotes para ver mensaje exacto
dummy = {
    "name": "TEST_QUOTE",
    "client_id": "NEXA"
}
r_post = requests.post(f"{SUPABASE_URL}/rest/v1/routes_quotes", headers=headers, json=dummy)
print("Post status:", r_post.status_code, r_post.text)
