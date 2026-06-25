import requests
import json
import os
import time
from bs4 import BeautifulSoup

CACHE_FILE = "tanker_cache.json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_cache(cache):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=4)

def get_tanker_dwt(ship_name):
    """
    Fetches DWT for a given ship name from VesselFinder.
    Returns float or None.
    """
    cache = load_cache()
    
    # Check cache first
    if ship_name in cache:
        return cache[ship_name]
    
    print(f"   [Lookup] Searching DWT for '{ship_name}'...")
    url = f"https://www.vesselfinder.com/vessels?name={ship_name}"
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find results table
            # The structure is usually <td class="v5">49990</td>
            # We take the first result's v5 column.
            
            # Use select_one to find the first row's DWT cell
            dwt_cell = soup.select_one(".results tbody tr td.v5")
            
            if dwt_cell:
                dwt_text = dwt_cell.get_text(strip=True)
                # DWT often has commas or other chars? Result usually clean number like "49990"
                if dwt_text and dwt_text.replace('.', '').isdigit():
                    dwt_val = float(dwt_text)
                    
                    # Cache it
                    cache[ship_name] = dwt_val
                    save_cache(cache)
                    
                    return dwt_val
            
            print(f"   [Lookup] DWT not found in page for '{ship_name}'.")
            
        else:
            print(f"   [Lookup] Failed with status {response.status_code}")
            
    except Exception as e:
        print(f"   [Lookup] Error: {e}")
        
    # Cache failure as None or 0 to avoid retrying immediately? 
    # Let's cache 0 for now to avoid hammering.
    cache[ship_name] = 0
    save_cache(cache)
    return 0

if __name__ == "__main__":
    # Test
    name = "ZOILO"
    print(f"DWT for {name}: {get_tanker_dwt(name)}")
