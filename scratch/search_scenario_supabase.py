import os
from dotenv import load_dotenv
from supabase import create_client, Client

env_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\.env"
load_dotenv(env_path)

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"Connecting to Supabase: {supabase_url}...")
supabase: Client = create_client(supabase_url, supabase_key)

response = supabase.table("forecast_projections").select("*").execute()
print(f"\nFound {len(response.data)} scenarios in forecast_projections table:\n")

target_found = None
for item in response.data:
    name = item.get('name', '')
    print(f"ID: {item.get('id')} | Name: '{name}' | User: {item.get('user_id')}")
    if 'PRIMER' in name.upper() or 'MODULAR' in name.upper() or 'UNOFASI' in name.upper():
        target_found = item

if target_found:
    print("\n" + "="*60)
    print(f"🎯 ESCENARIO ENCONTRADO: {target_found.get('name')}")
    print(f"ID: {target_found.get('id')}")
    print(f"User ID: {target_found.get('user_id')}")
    print(f"Start Date: {target_found.get('start_date')}")
    print(f"End Date: {target_found.get('end_date')}")
    print(f"Projection Lines ({len(target_found.get('projection_lines', []))} lines):")
    import json
    print(json.dumps(target_found.get('projection_lines', []), indent=2))
    print("="*60)
else:
    print("\n⚠️ No se encontró exactamente PRIMER.MODELO.MODULAR. Mostrando todos los escenarios:")
    for item in response.data:
        print(f" - {item.get('name')}")
