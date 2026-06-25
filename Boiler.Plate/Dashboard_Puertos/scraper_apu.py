import requests
import json
import time
from datetime import datetime
try:
    from vessel_lookup import get_tanker_dwt
except ImportError:
    def get_tanker_dwt(name): return 0

# Configuration
BASE_URL = "https://eredenaves.apn.gob.pe/apn"
URL_HOME = f"{BASE_URL}/inforedenaves.jsp"
URL_ARRIBOS = f"{BASE_URL}/puertoTerminal.do?action=buscarFormListaProgramacionArribo_2"
URL_ZARPES = f"{BASE_URL}/puertoTerminal.do?action=buscarFormListaProgramacionZarpe_2"

# Headers mimicking a browser
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Referer": URL_HOME,
    "X-Requested-With": "XMLHttpRequest"
}

# Port Codes (APN usually uses PE + 3 letters, or specific internal codes)
# We will try the most common ones.
PORTS = {
    "PETAL": "Talara",
    "PEPAI": "Paita",
    "PESAL": "Salaverry",
    "PECHM": "Chimbote", 
    "PECLL": "Callao",
    "PEPIO": "Pisco",
    "PEMAT": "Matarani",
    "PEILO": "Ilo"
}

def fetch_data_for_action(session, port_code, url, action_name):
    try:
        params = {
            "codPuertoEscala": port_code,
            "programacionDia": "S", 
            "tipoOperacion": "067", # This might differ for Zarpes, but usually param is ignored if action is different or handled by backend. Let's try same params.
            "dojo.preventCache": int(time.time() * 1000)
        }
        
        response_data = session.get(url, params=params)
        
        if response_data.status_code == 200:
            try:
                json_data = response_data.json()
                if "data" in json_data:
                    raw_list = json_data["data"]
                    if isinstance(raw_list, str):
                        ship_list = json.loads(raw_list)
                    else:
                        ship_list = raw_list
                    return ship_list
            except json.JSONDecodeError:
                pass
    except Exception:
        pass
    
    return []

def fetch_port_data(port_code):
    session = requests.Session()
    session.headers.update(HEADERS)
    session.get(URL_HOME) # Init cookies

    ships = []
    
    # 1. Fetch Arrivals
    arrivals = fetch_data_for_action(session, port_code, URL_ARRIBOS, "Arribo")
    for s in arrivals:
        s['MOVEMENT_TYPE'] = 'ARRIVAL'
        ships.append(s)

    # 2. Fetch Departures
    departures = fetch_data_for_action(session, port_code, URL_ZARPES, "Zarpe")
    for s in departures:
        s['MOVEMENT_TYPE'] = 'DEPARTURE'
        ships.append(s)

    return ships

def save_to_js(data):
    # Output to .js file
    file_path = "C:\\Users\\rguti\\Petral.MARK\\Dashboard_Puertos\\ships_data.js"
    js_content = f"const REAL_TIME_SHIPS = {json.dumps(data, indent=4)};"
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(js_content)
    
    print(f"Success! Saved total {len(data)} movements to {file_path}")

def format_ship_data(ship, port_code):
    ship_type = ship.get("TIPONAVE", "").upper()
    ship_name = ship.get("NOMNAVE", "")
    dwt_val = 0
    
    # Enrich DWT for Tankers
    if "TANQUE" in ship_type or "GASERO" in ship_type:
        # Use existing DWT if APN provided it (unlikely but safe), else lookup
        apn_dwt = ship.get("DWT", "")
        if apn_dwt and str(apn_dwt).strip() != "":
            try:
                dwt_val = float(apn_dwt)
            except ValueError:
                dwt_val = get_tanker_dwt(ship_name)
        else:
            dwt_val = get_tanker_dwt(ship_name)
    else: # If not a tanker/gasero, use the APN DWT if available
        apn_dwt = ship.get("DWT", "")
        if apn_dwt and str(apn_dwt).strip() != "":
            try:
                dwt_val = float(apn_dwt)
            except ValueError:
                dwt_val = 0 # Default to 0 if APN DWT is invalid and not a tanker

    return {
        "port_id": port_code,
        "movement_type": ship.get("MOVEMENT_TYPE", "UNKNOWN"),
        "due": ship.get("NRODUE", ""),
        "name": ship_name,
        "eta": ship.get("FECHA2", ""), # For Arrivals it's ETA, for Zarpes it's ETD usually, but field name often same in APN JSON
        "agency": ship.get("RAZONSOCIAL", ""),
        "origin_port": ship.get("PUERTO", ""), # Or Destination for Zarpe
        "origin_country": ship.get("PAIS", ""),
        "terminal": ship.get("ATRAQUE", "") or ship.get("LUGAR", ""),
        "etb": ship.get("ETB", ""),
        "type": ship_type,
        "flag": ship.get("BANDERA", ""),
        "length": ship.get("ESLORA", ""),
        "beam": ship.get("MANGA", ""),
        "dwt": dwt_val, 
        "gross_tonnage": ship.get("TRB", "")
    }

if __name__ == "__main__":
    print(f"--- Starting Scraper for {len(PORTS)} Ports (Arribos + Zarpes) ---")
    all_ships = []
    
    for code, name in PORTS.items():
        print(f"Scanning {name} ({code})...", end=" ")
        raw_ships = fetch_port_data(code)
        
        if raw_ships:
            print(f"Found {len(raw_ships)}")
            for ship in raw_ships:
                # Add to master list
                formatted = format_ship_data(ship, code)
                all_ships.append(formatted)
        else:
            print("No data.")
        
        time.sleep(1)

    if all_ships:
        save_to_js(all_ships)
    else:
        print("No ships found in any port.")
