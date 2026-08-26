import os
import json
from supabase import create_client

# Leer credenciales Supabase del backend
backend_env = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\.env"
supabase_url = None
supabase_key = None

if os.path.exists(backend_env):
    with open(backend_env, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("SUPABASE_URL="):
                supabase_url = line.strip().split("=", 1)[1].strip('"\'')
            elif line.startswith("SUPABASE_SERVICE_ROLE_KEY=") or line.startswith("SUPABASE_KEY="):
                if not supabase_key:
                    supabase_key = line.strip().split("=", 1)[1].strip('"\'')

print(f"Supabase URL: {supabase_url}")

if supabase_url and supabase_key:
    client = create_client(supabase_url, supabase_key)
    try:
        res = client.table("demurrage_records").select("count", count="exact").execute()
        print(f"Total registros en tabla Supabase 'demurrage_records': {res.count}")
    except Exception as e:
        print(f"Error consultando demurrage_records en Supabase: {e}")
else:
    print("No se encontraron credenciales de Supabase.")
