import json
import math
import requests

INPUT_FILE = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\new_green_route.js'
OUTPUT_FILE = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\new_green_route.js'

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def get_elevations(coords):
    """Fetch from Open-Meteo. Coords is [[lon, lat], ...]"""
    elevations = []
    chunk_size = 100
    print(f"Fetching elevations for {len(coords)} points...")
    for i in range(0, len(coords), chunk_size):
        batch = coords[i:i+chunk_size]
        lats = [c[1] for c in batch]
        lons = [c[0] for c in batch]
        try:
            url = "https://api.open-meteo.com/v1/elevation"
            params = {"latitude": lats, "longitude": lons}
            resp = requests.get(url, params=params, timeout=10)
            data = resp.json()
            if 'elevation' in data:
                elevations.extend(data['elevation'])
            else:
                print(f"API Error: {data}")
                elevations.extend([0]*len(batch))
        except Exception as e:
            print(f"Request Error: {e}")
            elevations.extend([0]*len(batch))
    return elevations

def main():
    print("Reading current route...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
        import re
        match = re.search(r'const NEW_GREEN_ROUTE_POINTS = (\[.*\]);', content, re.DOTALL)
        points_data = json.loads(match.group(1))

    # 1. Extract pure coordinates
    # points_data contains dicts with 'coords': [lat, lon] usually... 
    # BUT wait, apply_perimeter_extension.py saved [lat, lon] in 'coords'.
    # Let's verify format. 
    # In apply_perimeter_extension: "coords": [lat, lon]
    # In analyze_green_route_v2: "coords": [lat, lon]
    # Okay.
    
    raw_coords = [p['coords'] for p in points_data] # [lat, lon]
    
    # 2. Densify / Unify
    # We walk the path. If d > 100m, we interpolate.
    
    densified_path = [] # [lat, lon]
    
    if not raw_coords:
        return

    densified_path.append(raw_coords[0])
    
    for i in range(1, len(raw_coords)):
        p_prev = densified_path[-1] # use last added point to ensure continuity
        p_curr = raw_coords[i]
        
        # In case raw_coords[i] is identical to p_prev (duplicate), skip
        d = haversine(p_prev[0], p_prev[1], p_curr[0], p_curr[1])
        
        if d < 1: 
            continue # skip duplicates
            
        step = 100 # meters target density
        if d > step:
            # Interpolate
            num_steps = int(d / step)
            for k in range(1, num_steps + 1):
                frac = k / (num_steps + 1) # simple lin interp
                lat = p_prev[0] + (p_curr[0] - p_prev[0]) * frac
                lon = p_prev[1] + (p_curr[1] - p_prev[1]) * frac
                densified_path.append([lat, lon])
        
        densified_path.append(p_curr)

    print(f"Original points: {len(raw_coords)} -> Densified: {len(densified_path)}")

    # 3. Recalculate everything (Elevations & KM)
    # Re-fetch elevations to be clean and accurate for new points
    # Convert to [lon, lat] for API call helper
    coords_lonlat = [[p[1], p[0]] for p in densified_path]
    elevs = get_elevations(coords_lonlat)
    
    final_output = []
    curr_dist = 0.0
    next_label = 0.0
    label_step = 0.5 # 500m

    for i in range(len(densified_path)):
        lat, lon = densified_path[i]
        alt = elevs[i]
        
        slope = 0
        if i > 0:
            p_prev = densified_path[i-1]
            dist_seg = haversine(p_prev[0], p_prev[1], lat, lon)
            curr_dist += dist_seg
            if dist_seg > 0:
                slope = (alt - elevs[i-1]) / dist_seg * 100
        
        km_val = curr_dist / 1000.0
        
        # Determine Name
        name = ""
        # Check if we passed a label threshold
        # Simple approach: If this point is closest to k * 0.5?
        # Or just label the first point that exceeds the threshold.
        
        if km_val >= next_label:
            name = f"KM {next_label:.1f}"
            next_label += label_step
            # If we skipped multiple steps (big jump), catch up
            # e.g. from 0 to 0.6 -> label 0.0, next is 0.5.
            while km_val >= next_label:
                 next_label += label_step
        
        final_output.append({
            "name": name,
            "coords": [lat, lon],
            "alt": round(alt, 1),
            "slope": round(slope, 2),
            "km": round(km_val, 3)
        })

    # 4. Save
    line_coords = [[p['coords'][1], p['coords'][0]] for p in final_output] # [lon, lat]
    
    geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "Ruta Verde Unificada (Uniforme)",
                    "style": "green_route"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": line_coords
                }
            }
        ]
    }
    
    js_content = f"""
// Auto-generated by unify_and_densify.py
const NEW_GREEN_ROUTE_GEOJSON = {json.dumps(geojson, indent=4)};

const NEW_GREEN_ROUTE_POINTS = {json.dumps([], indent=4)};
"""
    # Fix placeholder manually before write
    js_content = js_content.replace('[]', json.dumps(final_output, indent=4))

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"Saved unified route. Total length: {curr_dist/1000:.2f} km. Points: {len(final_output)}")

if __name__ == "__main__":
    main()
