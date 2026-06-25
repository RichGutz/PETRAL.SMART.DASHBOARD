import json
import math

# --- Constants ---
# Shougang Polygon Vertices (from shougang_polygon.js)
# Index in JS is 1-based, here 0-based.
# Vertex 8 (NW): [-15.165533, -75.256948]
# Vertex 9: [-15.075283, -75.095742]
# We suspect the intersection is on segment 8-9 ("Frente Norte").

SHOUGANG_COORDS = [
    [-15.310100, -74.956170], # 1
    [-15.400447, -75.117497], # 2
    [-15.343915, -75.151088], # 3
    [-15.343921, -75.141812], # 4
    [-15.325839, -75.141801], # 5
    [-15.325833, -75.151117], # 6
    [-15.343847, -75.151129], # 7
    [-15.165533, -75.256948], # 8 (NW Vertex)
    [-15.075283, -75.095742], # 9
    [-15.090799, -75.086531], # 10
    [-15.090796, -75.095123], # 11
    [-15.136002, -75.095142], # 12
    [-15.135993, -75.113757], # 13
    [-15.172158, -75.113775], # 14
    [-15.172183, -75.038190], # 15
]

SF_ROAD_FILE = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\layer_san_fernando_road.js'

def get_line_intersection(p1, p2, p3, p4):
    """
    Find intersection of line segments p1-p2 and p3-p4.
    p1, p2, p3, p4 are (lat, lon) or (x, y) tuples.
    Returns intersection point (lat, lon) or None.
    """
    x1, y1 = p1[0], p1[1]
    x2, y2 = p2[0], p2[1]
    x3, y3 = p3[0], p3[1]
    x4, y4 = p4[0], p4[1]
    
    denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
    if denom == 0:
        return None  # Parallel
    
    ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
    ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom
    
    if 0 <= ua <= 1 and 0 <= ub <= 1:
        x = x1 + ua * (x2 - x1)
        y = y1 + ua * (y2 - y1)
        return (x, y)
    return None

# 1. Load SF Road
path_coords = []
with open(SF_ROAD_FILE, 'r', encoding='utf-8') as f:
    content = f.read()
    import re
    match = re.search(r'const SAN_FERNANDO_ROAD_GEOJSON = ({.*});', content, re.DOTALL)
    if match:
        data = json.loads(match.group(1))
        # GeoJSON is [lon, lat], convert to [lat, lon]
        for c in data['features'][0]['geometry']['coordinates']:
            path_coords.append((c[1], c[0]))

print(f"Loaded {len(path_coords)} points from SF Road.")

# 2. Check Intersection with Shoutgang Segment 8-9
p_nw = SHOUGANG_COORDS[7] # Vertex 8
p_next = SHOUGANG_COORDS[8] # Vertex 9

print(f"Checking intersection with Segment 8-9:")
print(f"  P8 (NW): {p_nw}")
print(f"  P9: {p_next}")

intersection = None
intersecting_road_idx = -1

for i in range(len(path_coords) - 1):
    p_road_1 = path_coords[i]
    p_road_2 = path_coords[i+1]
    
    pt = get_line_intersection(p_nw, p_next, p_road_1, p_road_2)
    if pt:
        print(f"FOUND INTERSECTION at Road Segment {i}:")
        print(f"  Point: {pt}")
        intersection = pt
        intersecting_road_idx = i
        break

if not intersection:
    print("NO INTERSECTION FOUND on Segment 8-9.")
    # Fallback: check all segments (just in case)
    print("Checking ALL polygon segments...")
    for j in range(len(SHOUGANG_COORDS)):
        p_poly_1 = SHOUGANG_COORDS[j]
        p_poly_2 = SHOUGANG_COORDS[(j+1) % len(SHOUGANG_COORDS)] # Wrap around
        
        for i in range(len(path_coords) - 1):
            p_road_1 = path_coords[i]
            p_road_2 = path_coords[i+1]
            
            pt = get_line_intersection(p_poly_1, p_poly_2, p_road_1, p_road_2)
            if pt:
                print(f"FOUND INTERSECTION on Poly Segment {j+1}-{j+2} at Road idx {i}:")
                print(f"  Point: {pt}")
                intersection = pt
                intersecting_road_idx = i
                break
        if intersection: break

if intersection:
    # Save intersection data for the main script
    result = {
        "intersection_point": {"lat": intersection[0], "lon": intersection[1]},
        "road_segment_index": intersecting_road_idx,
        "valid_boundary": True
    }
    print(json.dumps(result, indent=4))
