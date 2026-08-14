import requests

SUPABASE_URL = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

try:
    res = requests.get(f"{SUPABASE_URL}/rest/v1/contract_tariffs?select=*", headers=headers)
    tariffs = res.json()
    print(f"Total contract_tariffs en DB: {len(tariffs)}")
    for t in tariffs:
        print(t)
except Exception as e:
    print(f"Error: {e}")
