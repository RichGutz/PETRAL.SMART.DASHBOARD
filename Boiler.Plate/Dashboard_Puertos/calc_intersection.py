
import json
import math

# Vertex 9 Coordinates (Northernmost Point)
# We want to go straight EAST from here.
lat_target = -15.075283 
lon_start = -75.095742

# We define a Horizontal Ray:
# Start: (lat_target, lon_start)
# End: (lat_target, -74.000) (Far East)

p_start = [lat_target, lon_start]
p_end_ray = [lat_target, -74.0]

def get_line_intersection(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y):
    s1_x = p1_x - p0_x
    s1_y = p1_y - p0_y
    s2_x = p3_x - p2_x
    s2_y = p3_y - p2_y

    denom = (-s2_x * s1_y + s1_x * s2_y)
    if denom == 0:
        return None 

    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / denom
    t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / denom

    if 0 <= s <= 1 and 0 <= t <= 1:
        i_x = p0_x + (t * s1_x)
        i_y = p0_y + (t * s1_y)
        return (i_x, i_y)
    return None

def haversine(coord1, coord2):
    R = 6371 
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

with open('infrastructure_roads.js', 'r', encoding='utf-8') as f:
    content = f.read()
    json_str = content.split('=', 1)[1].strip().rstrip(';')
    data = json.loads(json_str)

intersection_point = None
min_dist = float('inf')

# Define ray P1->P2 (Horizontal)
# P1: (Lat, Lon) -> (Y, X) for function?
# My function uses (X, Y) -> (Lon, Lat)
ray_p1_x = p_start[1]
ray_p1_y = p_start[0]
ray_p2_x = p_end_ray[1]
ray_p2_y = p_end_ray[0]

for feature in data['features']:
    props = feature['properties']
    name = props.get('name', '').upper()
    fid = props.get('id', '').upper()
    
    if "1S" in fid or "PANAMERICANA" in name:
        geom = feature['geometry']
        if geom['type'] == 'LineString':
            coords = geom['coordinates'] 
            for i in range(len(coords) - 1):
                # Coords are [Lon, Lat]
                seg_a = coords[i]
                seg_b = coords[i+1]
                
                p_int = get_line_intersection(
                    ray_p1_x, ray_p1_y, 
                    ray_p2_x, ray_p2_y, 
                    seg_a[0], seg_a[1], 
                    seg_b[0], seg_b[1]
                )
                
                if p_int:
                    # p_int is (Lon, Lat)
                    int_latlon = (p_int[1], p_int[0])
                    dist = haversine(p_start, int_latlon)
                    
                    if dist < min_dist:
                        min_dist = dist
                        intersection_point = int_latlon

if intersection_point:
    print(f"INTERSECTION: {intersection_point[0]}, {intersection_point[1]}")
    print(f"DIST_SEGMENT: {min_dist}")
    
    # Check total distance from V8
    # V8 -> V9
    v8 = [-15.165533, -75.256948]
    v9 = [-15.075283, -75.095742]
    dist_v8_v9 = haversine(v8, v9)
    total_dist = dist_v8_v9 + min_dist
    print(f"TOTAL_DIST: {total_dist}")

else:
    print("NO_INTERSECTION")
