import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

updates = [
    {
        "vessel_id": "CONCON_TRADER",
        "vessel_speed": 11.5,
        "consumption_sea_ifo": 14.0,
        "consumption_idle_ifo": 3.5,
        "consumption_load_ifo": 3.5,
        "consumption_disch_ifo": 5.0,
        "consumption_sea_mdo": 0.0,
        "consumption_idle_mdo": 0.0,
        "consumption_load_mdo": 0.0,
        "consumption_disch_mdo": 0.0
    },
    {
        "vessel_id": "MOQUEGUA",
        "vessel_speed": 10.5,
        "consumption_sea_ifo": 14.0,
        "consumption_idle_ifo": 2.4,
        "consumption_load_ifo": 2.4,
        "consumption_disch_ifo": 3.6,
        "consumption_sea_mdo": 0.0,
        "consumption_idle_mdo": 0.0,
        "consumption_load_mdo": 0.5,
        "consumption_disch_mdo": 0.5
    },
    {
        "vessel_id": "TABLONES",
        "vessel_speed": 11.5,
        "consumption_sea_ifo": 14.5,
        "consumption_idle_ifo": 3.5,
        "consumption_load_ifo": 3.5,
        "consumption_disch_ifo": 5.0,
        "consumption_sea_mdo": 0.0,
        "consumption_idle_mdo": 0.0,
        "consumption_load_mdo": 0.0,
        "consumption_disch_mdo": 0.0
    }
]

for update in updates:
    vessel_id = update.pop("vessel_id")
    response = supabase.table("vessels").update(update).eq("vessel_id", vessel_id).execute()
    print(f"Updated {vessel_id}: {response.data}")
