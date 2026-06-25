import json
import requests
import time

CACHE_FILE = 'terrain_elevation_cache_alt.json'

def get_elevation_batch_open_meteo(locations):
    base_url = "https://api.open-meteo.com/v1/elevation"
    # Open-Meteo expects lat,lon arrays
    lats = [f"{p[1]:.6f}" for p in locations]
    lons = [f"{p[0]:.6f}" for p in locations]
    
    url = f"{base_url}?latitude={','.join(lats)}&longitude={','.join(lons)}"
    
    try:
        print(f"Requesting {len(locations)} points from Open-Meteo...")
        resp = requests.get(url, timeout=10)
        data = resp.json()
        
        if 'elevation' in data:
            return data['elevation']
        elif 'error' in data:
            print(f"  ERROR: {data.get('reason')}")
            return None
        else:
            print(f"  UNKNOWN RESPONSE: {data}")
            return None
            
    except Exception as e:
        print(f"  REQUEST FAILED: {e}")
        return None

def main():
    print("--- VPN TEST: OPEN-METEO REPAIR ---")
    
    # Load Cache
    print(f"Loading {CACHE_FILE}...")
    try:
        with open(CACHE_FILE, 'r') as f:
            cache = json.load(f)
    except Exception as e:
        print(f"Error loading cache: {e}")
        return

    # Find Zeros
    zeros = []
    # Cache keys are "lat_lon"
    for k, v in cache.items():
        if v == 0:
            try:
                lat_str, lon_str = k.split('_')
                lon = float(lon_str)
                lat = float(lat_str)
                zeros.append([lon, lat])
            except:
                pass
            
    print(f"Total Cached Gaps (Zeros): {len(zeros)}")
    
    if not zeros:
        print("No zeros to repair!")
        return

    # Test 2 batches of 50
    BATCH_SIZE = 50
    NUM_BATCHES = 2
    
    to_test = zeros[:BATCH_SIZE * NUM_BATCHES]
    
    print(f"Testing {len(to_test)} points in {NUM_BATCHES} batches...")
    
    for i in range(0, len(to_test), BATCH_SIZE):
        batch = to_test[i:i+BATCH_SIZE]
        print(f"\nBatch {i//BATCH_SIZE + 1} ({len(batch)} pts):")
        
        result = get_elevation_batch_open_meteo(batch)
        
        if result:
            valid = [x for x in result if x != 0]
            print(f"  SUCCESS! Got {len(valid)} valid elevations.")
            if valid:
                print(f"  Sample Z: {valid[:5]}")
            else:
                print("  Got data, but all were 0 (might be ocean or valid 0?)")
        else:
            print("  FAILED.")
            
        time.sleep(1)

if __name__ == "__main__":
    main()
