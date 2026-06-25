import os
import json
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_KEY in .env file")
    exit(1)

supabase: Client = create_client(url, key)

def load_local_data():
    """Reads the ships_data.js content (stripping the JS assignment var)"""
    file_path = "C:\\Users\\rguti\\Petral.MARK\\Dashboard_Puertos\\ships_data.js"
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            # Remove 'const REAL_TIME_SHIPS = ' and trailing ';'
            json_str = content.replace("const REAL_TIME_SHIPS = ", "").strip().rstrip(";")
            return json.loads(json_str)
    except Exception as e:
        print(f"Error reading local JS file: {e}")
        return []

def format_date(date_str):
    """Converts '26/01/2026 00:15:00' to ISO format or None"""
    try:
        return datetime.strptime(date_str, "%d/%m/%Y %H:%M:%S").isoformat()
    except:
        return None

def sync_data():
    ships = load_local_data()
    print(f"Loaded {len(ships)} ships from local file.")
    
    if not ships:
        return

    # Prepare data for Supabase
    records = []
    # Identify Port Names for cleaner DB
    port_map = {
        "PETAL": "Talara", "PEPAI": "Paita", "PESAL": "Salaverry",
        "PECHM": "Chimbote", "PECLL": "Callao", "PEPIO": "Pisco",
        "PEMAT": "Matarani", "PEILO": "Ilo"
    }

    current_date = datetime.now().strftime("%Y-%m-%d")

    for ship in ships:
        # Parse numbers
        try: length = float(ship.get("length")) if ship.get("length") else 0
        except: length = 0
        
        try: beam = float(ship.get("beam")) if ship.get("beam") else 0
        except: beam = 0

        record = {
            "snapshot_date": current_date,
            "port_id": ship.get("port_id"),
            "port_name": port_map.get(ship.get("port_id"), "Unknown"),
            "movement_type": ship.get("movement_type"),
            "ship_due": ship.get("due"),
            "ship_name": ship.get("name"),
            "ship_type": ship.get("type"),
            "arrival_eta": format_date(ship.get("eta")),
            "agency": ship.get("agency"),
            "terminal": ship.get("terminal"),
            "length": length,
            "beam": beam
        }
        records.append(record)

    # Upsert data
    try:
        # Note: You must update the UNIQUE constraint in Postgres to include movement_type
        response = supabase.table("port_arrivals").upsert(records, on_conflict="ship_due, snapshot_date, movement_type").execute()
        # Note: older supabase-py versions return dict, newer might verify via .data
        print("Success! Data synced to Supabase.")
        # print(response)
    except Exception as e:
        print(f"Error syncing to Supabase: {e}")
        print("Hint: Did you create the table and Policy in Supabase SQL Editor?")

if __name__ == "__main__":
    sync_data()
