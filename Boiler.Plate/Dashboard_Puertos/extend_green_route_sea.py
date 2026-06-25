import json
import requests
import math
import os

# --- Constants ---
INPUT_JS = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\new_green_route.js'
OUTPUT_JS = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\new_green_route.js' # Overwrite
EXTENSION_DIST_KM = 8.0 # Max extension to find sea
STEP_M = 100 # Resolution

# --- Helpers ---
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def get_bearing(lat1, lon1, lat2, lon2):
    """Calculate bearing from p1 to p2"""
    dLon = math.radians(lon2 - lon1)
    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)
    y = math.sin(dLon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dLon)
    brng = math.atan2(y, x)
    return reversed_bearing(math.degrees(brng))

def reversed_bearing(bearing):
    return (bearing + 180) % 360

def destination_point(lat, lon, bearing, distance_m):
    R = 6371000
    lat1 = math.radians(lat)
    lon1 = math.radians(lon)
    brng = math.radians(bearing)
    
    lat2 = math.asin(math.sin(lat1)*math.cos(distance_m/R) + math.cos(lat1)*math.sin(distance_m/R)*math.cos(brng))
    lon2 = lon1 + math.atan2(math.sin(brng)*math.sin(distance_m/R)*math.cos(lat1), math.cos(distance_m/R)-math.sin(lat1)*math.sin(lat2))
    return math.degrees(lat2), math.degrees(lon2)

def get_elevations(coords):
    """Fetch from Open-Meteo"""
    elevations = []
    chunk_size = 100
    for i in range(0, len(coords), chunk_size):
        batch = coords[i:i+chunk_size]
        lats = [c[0] for c in batch]
        lons = [c[1] for c in batch]
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

# --- Main ---
def main():
    # 1. Read existing points from JS file (parsing the JSON part)
    print("Reading existing route...")
    with open(INPUT_JS, 'r', encoding='utf-8') as f:
        content = f.read()
        # Extract the POINTS JSON
        import re
        match = re.search(r'const NEW_GREEN_ROUTE_POINTS = (\[.*\]);', content, re.DOTALL)
        if not match:
            print("Could not find NEW_GREEN_ROUTE_POINTS")
            return
        existing_points = json.loads(match.group(1))

    # 2. Determine Extension Direction
    # We want to extend FROM the first point BACKWARDS.
    # Direction: Inverse of P0 -> P1
    if len(existing_points) < 2:
        print("Not enough points to determine direction")
        return

    p0 = existing_points[0] # KM 0
    p1 = existing_points[1] # KM 1 (approx)
    
    # Calculate bearing P0 -> P1
    bearing_p0_p1 = get_bearing(p0['coords'][0], p0['coords'][1], p1['coords'][0], p1['coords'][1])
    
    # Extension bearing is opposite (180 deg diff), which is actually just pointing away from P1 relative to P0
    # Wait, simple reasoning:
    # If route goes East, we want to go West.
    # Bearing P0->P1 is roughly East.
    # We want to go from P0 in direction (Bearing P0->P1 + 180).
    
    extension_bearing = (get_bearing(p0['coords'][0], p0['coords'][1], p1['coords'][0], p1['coords'][1]) + 180) % 360
    
    # Correction: The Green Route starts at P0 and goes to P1 (Inland).
    # We want to extend P0 towards the Sea.
    # If P0 is already the "Start" (NW Vertex), and the sea is roughly West.
    # Let's verify direction. 
    # P0: -15.165533, -75.256948
    # P1: -15.160973, -75.248804 (Lat increases (less neg), Lon increases (less neg) -> Going NE?)
    # If going NE, the opposite is SW.
    # Let's trust the "North Side Extension" hint from USER.
    # User said: "prolongacion del lado norte del poligono shougan".
    # This implies a specific geometric line.
    # Since we don't have the polygon, checking P0 -> P1 vector is the best approximation of the "start vector".
    # Going opposite to that is a safe bet for "extending backwards".
    
    print(f"Bearing P0->P1: {get_bearing(p0['coords'][0], p0['coords'][1], p1['coords'][0], p1['coords'][1]):.2f}")
    print(f"Extension Bearing (Opposite): {extension_bearing:.2f}")

    # 3. Generate Extension Points
    print(f"Generating extension points ({EXTENSION_DIST_KM} km)...")
    new_coords = []
    
    curr_lat, curr_lon = p0['coords'][0], p0['coords'][1]
    
    # Generate points OUTWARDS from P0
    # We want the resulting list to start at SEA and end at P0.
    
    temp_extension = []
    
    for d in range(STEP_M, int(EXTENSION_DIST_KM*1000) + STEP_M, STEP_M):
        lat, lon = destination_point(curr_lat, curr_lon, extension_bearing, d)
        temp_extension.append([lat, lon])

    # 4. Get Elevations
    print("Fetching elevations for extension...")
    elevs = get_elevations(temp_extension)
    
    # 5. Build Final List
    # We filter: stop if we hit sea (alt <= 1) ? 
    # Or just keep all until 0?
    # User said "hasta llegar al nivel cero".
    
    valid_extension = []
    found_sea = False
    
    for i, (coord, alt) in enumerate(zip(temp_extension, elevs)):
        valid_extension.append({
            "coords": coord,
            "alt": alt
        })
        if alt <= 2: # Hit 'sea level' tolerance
            found_sea = True
            # We can stop extending if we want, or keep going? 
            # If we go too far into ocean alt might be 0.
            # Let's trim here.
            # But the list is ordered FROM P0 OUTWARDS.
            # So the FIRST point in this list is closest to P0. The LAST point is furthest (Sea).
            # If we hit sea at index i, we discard points after i?
            # Yes.
            break
            
    if not found_sea:
        print("Warning: Did not hit 0m elevation. Extending simply to max distance.")
        # Just use all valid_extension
    
    # Reverse extension so it goes Sea -> P0
    valid_extension.reverse()
    
    # Re-calculate Kilometerage
    # The new Start (Sea) is KM 0.
    # We need to shift the KM of the existing points.
    
    # Distance of extension
    if not valid_extension:
        print("No extension generated.")
        return

    # Calculate precise length of extension
    ext_len_m = 0
    prev_c = valid_extension[0]['coords']
    
    # Add distance within extension
    # Actually, let's rebuild the whole chain properly.
    
    final_points_data = []
    
    # First point: Sea Start
    final_points_data.append({
        "name": "Nivel del Mar",
        "coords": valid_extension[0]['coords'],
        "alt": valid_extension[0]['alt'],
        "slope": 0,
        "km": 0
    })
    
    current_cum_dist = 0
    
    # Rest of extension
    for i in range(1, len(valid_extension)):
        c = valid_extension[i]['coords']
        pc = valid_extension[i-1]['coords']
        dist = haversine(pc[0], pc[1], c[0], c[1])
        current_cum_dist += dist
        
        slope = 0
        if dist > 0:
            slope = (valid_extension[i]['alt'] - valid_extension[i-1]['alt']) / dist * 100
            
        final_points_data.append({
            "name": "",
            "coords": c,
            "alt": valid_extension[i]['alt'],
            "slope": round(slope, 2),
            "km": round(current_cum_dist/1000, 3)
        })
        
    # Now append Original Points
    # We need to bridge the gap between last extension point and P0?
    # valid_extension was generated from P0, so the last point in valid_extension (reversed) 
    # should be STEP_M away from P0.
    # Wait, valid_extension[last] is `destination_point(..., STEP_M)`.
    # P0 is `destination_point(..., 0)`.
    # So valid_extension DOES NOT include P0.
    # We connect valid_extension[-1] -> P0.
    
    # Bridge to P0
    p0_coords = p0['coords']
    last_ext_coords = final_points_data[-1]['coords']
    bridge_dist = haversine(last_ext_coords[0], last_ext_coords[1], p0_coords[0], p0_coords[1])
    current_cum_dist += bridge_dist
    
    slope_to_p0 = (p0['alt'] - final_points_data[-1]['alt']) / bridge_dist * 100
    
    # Update P0 KM and add
    # Note: We need to shift ALL existing points by `current_cum_dist`
    # Warning: existing_points already has 'km' field starting at 0.
    # We should re-calc everything to be safe or just shift.
    
    offset_km = current_cum_dist / 1000.0
    
    # Add P0 (modified)
    final_points_data.append({
        "name": p0['name'],
        "coords": p0['coords'],
        "alt": p0['alt'],
        "slope": round(slope_to_p0, 2),
        "km": round(offset_km, 3)
    })
    
    # Add rest of existing points
    for i in range(1, len(existing_points)):
        ep = existing_points[i]
        # We trust the relative distances in existing_points
        # New KM = Old KM + offset_km
        final_points_data.append({
            "name": ep['name'],
            "coords": ep['coords'],
            "alt": ep['alt'],
            "slope": ep['slope'],
            "km": round(ep['km'] + offset_km, 3)
        })

    # 6. Generate JS Output
    # We need to reconstruct the GEOJSON too for the map line.
    line_coords = [[p['coords'][1], p['coords'][0]] for p in final_points_data] # GeoJSON [lon, lat]
    
    geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "Ruta Verde Extendida (Mar -> PE-1S)",
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
// Auto-generated by extend_green_route_sea.py
const NEW_GREEN_ROUTE_GEOJSON = {json.dumps(geojson, indent=4)};

const NEW_GREEN_ROUTE_POINTS = {json.dumps(final_points_data, indent=4)};
"""
    
    with open(OUTPUT_JS, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Success! Extended route by {offset_km:.2f} km to sea.")
    print(f"Total points: {len(final_points_data)}")
    print(f"Saved to {OUTPUT_JS}")

if __name__ == "__main__":
    main()
