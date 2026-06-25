
import json
import math

def dms_to_dd(degrees, minutes, seconds, direction):
    dd = float(degrees) + float(minutes)/60 + float(seconds)/(3600)
    if direction == 'S' or direction == 'W':
        dd *= -1
    return dd

# --- Raw Data (Same as convert_dicapi.py) ---
acuatica_raw = [
    ("15", "11", "46.440", "S", "075", "15", "12.011", "W"), # A
    ("15", "11", "36.833", "S", "075", "15", "21.058", "W"), # B
    ("15", "11", "25.850", "S", "075", "15", "08.692", "W"), # C
    ("15", "11", "30.654", "S", "075", "15", "04.168", "W"), # D
    ("15", "11", "20.262", "S", "075", "14", "52.466", "W"), # K (Added Correctly)
    ("15", "11", "21.360", "S", "075", "14", "53.703", "W"), # E
    ("15", "11", "22.648", "S", "075", "14", "52.490", "W"), # F
    ("15", "11", "24.339", "S", "075", "14", "50.670", "W"), # G
    ("15", "11", "25.749", "S", "075", "14", "49.792", "W"), # H
    ("15", "11", "26.355", "S", "075", "14", "49.804", "W"), # I
    ("15", "11", "26.365", "S", "075", "14", "49.406", "W"), # J
]

riberena_raw = [
    ("15", "11", "26.365", "S", "075", "14", "49.406", "W"), # J
    ("15", "11", "26.355", "S", "075", "14", "49.804", "W"), # I
    ("15", "11", "25.749", "S", "075", "14", "49.792", "W"), # H
    ("15", "11", "24.339", "S", "075", "14", "50.670", "W"), # G
    ("15", "11", "22.648", "S", "075", "14", "52.490", "W"), # F
    ("15", "11", "21.360", "S", "075", "14", "53.703", "W"), # E
    ("15", "11", "20.262", "S", "075", "14", "52.466", "W"), # K
    ("15", "11", "21.550", "S", "075", "14", "51.253", "W"), # L
    ("15", "11", "23.240", "S", "075", "14", "49.433", "W"), # M
    ("15", "11", "24.651", "S", "075", "14", "48.556", "W"), # N
    ("15", "11", "25.257", "S", "075", "14", "48.567", "W"), # O
    ("15", "11", "25.267", "S", "075", "14", "48.170", "W"), # P
]

# Note: K was missing in original convert_dicapi.py but present in riberena_raw as 7th element.
# In acuatica_raw, I manually inserted it above at index 4 (0-based) based on connection flow D->K->E.
# Let's verify K coords match.
# K from Riberena: 15 11 20.262 S, 075 14 52.466 W
# My inserted K:   15 11 20.262 S, 075 14 52.466 W. MATCH.

def process_coords(raw_data):
    coords = []
    for lat_d, lat_m, lat_s, lat_dir, lon_d, lon_m, lon_s, lon_dir in raw_data:
        lat = dms_to_dd(lat_d, lat_m, lat_s, lat_dir)
        lon = dms_to_dd(lon_d, lon_m, lon_s, lon_dir)
        coords.append({'x': lon, 'y': lat})
    return coords

# --- Ear Clipping Algorithm ---

def is_point_in_triangle(p, a, b, c):
    # Barycentric technique
    v0 = {'x': c['x'] - a['x'], 'y': c['y'] - a['y']}
    v1 = {'x': b['x'] - a['x'], 'y': b['y'] - a['y']}
    v2 = {'x': p['x'] - a['x'], 'y': p['y'] - a['y']}

    dot00 = v0['x']*v0['x'] + v0['y']*v0['y']
    dot01 = v0['x']*v1['x'] + v0['y']*v1['y']
    dot02 = v0['x']*v2['x'] + v0['y']*v2['y']
    dot11 = v1['x']*v1['x'] + v1['y']*v1['y']
    dot12 = v1['x']*v2['x'] + v1['y']*v2['y']

    invDenom = 1 / (dot00 * dot11 - dot01 * dot01)
    u = (dot11 * dot02 - dot01 * dot12) * invDenom
    v = (dot00 * dot12 - dot01 * dot02) * invDenom

    return (u >= 0) and (v >= 0) and (u + v < 1)

def is_convex(prev, curr, next_pt):
    # Cross product Z component
    # AB x BC
    val = (curr['x'] - prev['x']) * (next_pt['y'] - curr['y']) - (curr['y'] - prev['y']) * (next_pt['x'] - curr['x'])
    # Assuming Counter-Clockwise winding, convex if val > 0 (or < 0 depending on system)
    # Leaflet/GeoJSON usually Lat/Lon. X=Lon, Y=Lat.
    # Check orientation of data first?
    return val >= 0 # Try >=0 first (CCW)

def get_area(points):
    area = 0
    for i in range(len(points)):
        j = (i + 1) % len(points)
        area += points[i]['x'] * points[j]['y']
        area -= points[j]['x'] * points[i]['y']
    return area / 2.0

def triangulate(polygon_coords):
    # Working with indices
    indices = list(range(len(polygon_coords)))
    points = polygon_coords
    
    # Ensure winding is correct (CCW)
    if get_area(points) < 0:
        indices.reverse() # Make it CCW
        
    triangles = []
    
    while len(indices) > 3:
        ear_found = False
        for i in range(len(indices)):
            prev_idx = indices[i-1]
            curr_idx = indices[i]
            next_idx = indices[(i+1) % len(indices)]
            
            p_prev = points[prev_idx]
            p_curr = points[curr_idx]
            p_next = points[next_idx]
            
            # 1. Check convexity
            # Note: Cross product logic depends on coord system. 
            # -Y is south. X is West (negative). 
            # Let's rely on is_convex logic.
            if is_convex(p_prev, p_curr, p_next):
                # 2. Check overlap with other points
                is_ear = True
                for other_idx in indices:
                    if other_idx in (prev_idx, curr_idx, next_idx):
                        continue
                    if is_point_in_triangle(points[other_idx], p_prev, p_curr, p_next):
                        is_ear = False
                        break
                
                if is_ear:
                    triangles.append([prev_idx, curr_idx, next_idx])
                    indices.pop(i)
                    ear_found = True
                    break
        
        if not ear_found:
            print("Failed to find ear. Polygon might be self-intersecting or logic flaw.")
            break
            
    # Add last triangle
    triangles.append([indices[0], indices[1], indices[2]])
    return triangles

# --- Main ---
ac_coords = process_coords(acuatica_raw)
ri_coords = process_coords(riberena_raw)

# Generate Triangles
ac_tris = triangulate(ac_coords)
ri_tris = triangulate(ri_coords)

# Format for JS
# Need lists of [i], [j], [k]
def format_indices(tris):
    i_list = [t[0] for t in tris]
    j_list = [t[1] for t in tris]
    k_list = [t[2] for t in tris]
    return i_list, j_list, k_list

ai, aj, ak = format_indices(ac_tris)
ri, rj, rk = format_indices(ri_tris)

# Output as Json Object
output = {
    "acuatica": {
        "x": [p['x'] for p in ac_coords],
        "y": [p['y'] for p in ac_coords],
        "i": ai, "j": aj, "k": ak
    },
    "riberena": {
        "x": [p['x'] for p in ri_coords],
        "y": [p['y'] for p in ri_coords],
        "i": ri, "j": rj, "k": rk
    }
}

print(json.dumps(output, indent=2))
