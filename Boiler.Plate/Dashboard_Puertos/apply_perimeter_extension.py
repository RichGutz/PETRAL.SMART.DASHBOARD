import json
import requests
import math
import os

# --- Constants ---
TERRAIN_FILE = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\terrain_data.js'
ROUTE_FILE = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\new_green_route.js'
OUTPUT_FILE = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\new_green_route.js' # Overwrite

# --- Helpers ---
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def densify_segment(p1, p2, interval_m=100):
    """p1, p2 are [lon, lat]"""
    dist = haversine(p1[1], p1[0], p2[1], p2[0])
    num_steps = int(dist / interval_m)
    points = []
    if num_steps < 1:
        points.append(p1) # Just start
        return points
        
    for i in range(num_steps + 1):
        frac = i / num_steps
        lon = p1[0] + (p2[0] - p1[0]) * frac
        lat = p1[1] + (p2[1] - p1[1]) * frac
        points.append([lon, lat])
    return points

def get_elevations(coords):
    """Fetch from Open-Meteo"""
    elevations = []
    chunk_size = 100
    for i in range(0, len(coords), chunk_size):
        batch = coords[i:i+chunk_size]
        lats = [c[1] for c in batch] # coords are [lon, lat]
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
    # 1. Load Terrain Data (Perimetro)
    print("Loading Perimetro...")
    with open(TERRAIN_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
        # Remove JS declaration
        json_str = content.replace('const TERRAIN_ROADS =', '').strip().rstrip(';')
        terrain_data = json.loads(json_str)
    
    perimetro_coords = []
    for feat in terrain_data['features']:
        if feat['properties'].get('layer') == 'perimetro':
            # Check geometry type
            geom_type = feat['geometry']['type']
            coords = feat['geometry']['coordinates']
            
            if geom_type == 'Polygon':
                perimetro_coords = coords[0] # Outer ring
            elif geom_type == 'LineString':
                perimetro_coords = coords # List of points
            else:
                perimetro_coords = coords # Attempt to use direct
                
            break
            
    if not perimetro_coords:
        print("Error: Could not find 'perimetro' layer.")
        return

    # Handle close ring (remove last if same as first)
    if len(perimetro_coords) > 1 and perimetro_coords[0] == perimetro_coords[-1]:
        perimetro_coords = perimetro_coords[:-1]

    # 2. Identify North Edge (P1 -> P2)
    # P1 is likely the one matching Route Start
    # Let's find point closest to current route start
    
    # Load Route Start
    with open(ROUTE_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
        import re
        match = re.search(r'const NEW_GREEN_ROUTE_POINTS = (\[.*\]);', content, re.DOTALL)
        existing_points = json.loads(match.group(1))
        
    # Start of existing route (Point 0 of the ORIGINAL route, before my previous extension attempts)
    # Wait, the current file HAS my bad extension.
    # I should revert to the ORIGINAL start point. 
    # The original start point was around -15.165533, -75.256948.
    # I can identify it because my bad extension named points "Nivel del Mar" or "" or "KM 0.1". 
    # The real points had names like "KM 0.0" (the original KM 0).
    
    # Find original KM 0 point
    original_start_idx = -1
    for i, p in enumerate(existing_points):
        if p['name'] == "KM 0.0":
            original_start_idx = i
            break
            
    if original_start_idx == -1:
        # Fallback: Find point closest to -15.165533, -75.256948
        target_lat = -15.165533
        target_lon = -75.256948
        min_dist = float('inf')
        for i, p in enumerate(existing_points):
            # p['coords'] is [lat, lon] usually in points array? NO.
            # In analyze_green_route_v2.py: "coords": [lat, lon]
            # Let's check format.
            d = haversine(target_lat, target_lon, p['coords'][0], p['coords'][1])
            if d < min_dist:
                min_dist = d
                original_start_idx = i
    
    print(f"Original Start Point Index: {original_start_idx}")
    
    # Keep only points from Original Start onwards
    base_route = existing_points[original_start_idx:]
    
    # Now find matching point in Perimetro
    # Perimetro coords are [lon, lat] !!!
    route_start_lat = base_route[0]['coords'][0]
    route_start_lon = base_route[0]['coords'][1]
    
    match_idx = -1
    min_dist = float('inf')
    
    for i, p in enumerate(perimetro_coords):
        # p is [lon, lat]
        d = haversine(route_start_lat, route_start_lon, p[1], p[0]) # lat, lon
        if d < 100: # Within 100m
            min_dist = d
            match_idx = i
            
    if match_idx == -1:
        print("Error: Could not match route start to perimetro.")
        return
        
    print(f"Matched Perimetro Point Index: {match_idx} (Dist: {min_dist:.2f}m)")
    
    # 3. Determine "North Edge" Segment
    # The Triangle has 3 points (plus closing).
    # We are at one vertex. We need to go along the "North Edge" to the Sea.
    # Sea is generally West.
    # Let's assert which neighbor vertex is Westerly.
    
    curr_v = perimetro_coords[match_idx]
    prev_v = perimetro_coords[match_idx - 1] # wrapped
    next_v = perimetro_coords[(match_idx + 1) % len(perimetro_coords)]
    
    # Check Longitude (X). More negative is West.
    vec_prev = prev_v[0] - curr_v[0] # Delta Lon
    vec_next = next_v[0] - curr_v[0]
    
    target_v = None
    
    print(f"Current: {curr_v}")
    print(f"Prev: {prev_v} (dLon: {vec_prev})")
    print(f"Next: {next_v} (dLon: {vec_next})")
    
    # We want to go WEST (negative dLon).
    if vec_prev < vec_next:
         # Prev is more West (or less East)
         if vec_prev < 0: target_v = prev_v
    else:
         if vec_next < 0: target_v = next_v
         
    # Fallback to coordinate logic from thought process:
    # P1 (-75.256) -> P2 (-75.268). P2 is West.
    # If match is P1, then P2 is the target.
    
    if target_v is None:
        # Just pick the one that is NOT P3 (the southern one).
        # P3 lat was -15.197. P1/P2 lat ~ -15.16/-15.17.
        # Find neighbor with max Lat (least negative, Northern)
        lat_prev = prev_v[1]
        lat_next = next_v[1]
        if lat_prev > lat_next:
            target_v = prev_v
        else:
            target_v = next_v
            
    print(f"Target Vertex (Sea End): {target_v}")
    
    # 4. Densify Segment (Target -> Start) to Prepend?
    # We want route order: Sea -> Start -> End.
    # So we want points from Target -> Match.
    # target_v (Sea) -> curr_v (Start of Route)
    
    segment_points = densify_segment(target_v, curr_v, interval_m=100) # [lon, lat]
    # Check if last point is close to matching point, we might avoid duplicate
    # segment_points[-1] should be curr_v
    
    # 5. Fetch Elevations
    print("Fetching elevations for new segment...")
    elevs = get_elevations(segment_points)
    
    # 6. Build New Points List
    new_points_data = []
    current_cum_dist = 0
    
    # Add Segment Points
    for i, (coords, alt) in enumerate(zip(segment_points, elevs)):
        # coords is [lon, lat]
        lat, lon = coords[1], coords[0]
        
        slope = 0
        if i > 0:
            pc = new_points_data[-1]['coords']
            dist = haversine(pc[0], pc[1], lat, lon)
            current_cum_dist += dist
            if dist > 0:
                slope = (alt - new_points_data[-1]['alt']) / dist * 100
        
        name_p = ""
        if i == 0: name_p = "Nivel del Mar (Est)"
        
        new_points_data.append({
            "name": name_p,
            "coords": [lat, lon],
            "alt": alt,
            "slope": round(slope, 2),
            "km": round(current_cum_dist/1000, 3)
        })
        
    print(f"Segment Length: {current_cum_dist/1000:.2f} km")
    
    # 7. Append Original Route (shifted)
    # The last point of new_points_data is roughly base_route[0].
    # We merge carefully.
    
    offset_km = current_cum_dist / 1000.0
    
    # First point of base_route should align with last of new segment
    # Let's just adjust KM of base_route and append
    
    # Start from index 1 of base_route to avoid duplicate coord if they match perfectly
    # Check distance
    p_last_new = new_points_data[-1]
    p_first_base = base_route[0]
    d_merge = haversine(p_last_new['coords'][0], p_last_new['coords'][1], p_first_base['coords'][0], p_first_base['coords'][1])
    
    start_k = 0
    if d_merge < 50: # Effectively same point
        start_k = 1 # Skip first
        # Copy properties of base start to merge point?
        new_points_data[-1]['name'] = p_first_base['name']
    else:
        # Add slight distance step
        current_cum_dist += d_merge
        offset_km = current_cum_dist / 1000.0
        
    for i in range(start_k, len(base_route)):
        p = base_route[i]
        # Recalc KM
        # Use relative km from original
        # original km of p - original km of base_route[0]
        # Actually base_route[i]['km'] is absolute.
        # rel_km = p['km'] - base_route[0]['km'] = p['km'] (since base_route[0] is KM 0.0)
        
        new_km = p['km'] + offset_km
        
        new_points_data.append({
            "name": p['name'],
            "coords": p['coords'],
            "alt": p['alt'],
            "slope": p['slope'],
            "km": round(new_km, 3)
        })

    # 8. Save
    # GeoJSON LineString
    line_coords = [[p['coords'][1], p['coords'][0]] for p in new_points_data] # [lon, lat]
    
    geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "Ruta Verde Estartetégica (Mar -> PE-1S)",
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
// Auto-generated by apply_perimeter_extension.py
const NEW_GREEN_ROUTE_GEOJSON = {json.dumps(geojson, indent=4)};

const NEW_GREEN_ROUTE_POINTS = {json.dumps(new_points_data, indent=4)};
"""
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"Success. Route Start Elevation: {new_points_data[0]['alt']}m")

if __name__ == "__main__":
    main()
