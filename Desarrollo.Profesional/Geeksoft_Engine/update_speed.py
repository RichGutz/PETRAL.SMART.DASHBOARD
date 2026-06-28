import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

vessels = ["CONCON_TRADER", "MOQUEGUA", "TABLONES"]
for v in vessels:
    response = supabase.table("vessels").update({"vessel_speed": 11.0}).eq("vessel_id", v).execute()
    print(f"Updated {v} speed to 11.0: {response.data}")
