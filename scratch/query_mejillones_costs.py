from supabase import create_client

url = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"

supabase = create_client(url, key)

print("=== DIAGNÓSTICO DETALLADO DE CONCORDANCIA ===")

res = supabase.table("port_costs_matrix").select("*").eq("port_id", "MEJILLONES").execute()
for row in res.data:
    if row.get("concept_id") == "loading_master":
        print(f"Concept: loading_master | Client: {row.get('client_id')} | Terminal: {row.get('terminal')} | Operation: {row.get('operation_type')} | Vessel: {row.get('vessel_id')} | Cost: {row.get('cost')}")
