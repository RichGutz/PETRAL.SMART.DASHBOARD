import json
import requests
import math

import os

# --- Constants ---
SHOUGANG_NW = {"lat": -15.165533, "lon": -75.256948, "name": "Shougang NW Vertex (KM 0)"}
LANDMARK = {"lat": -15.135833, "lon": -75.204444, "name": "Landmark (Cruce SF)"}
SF_ROAD_FILE = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\layer_san_fernando_road.js'
OUTPUT_JS = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\new_green_route.js'
OUTPUT_KML = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\RUTA_VERDE_500m.kml'
LABEL_INTERVAL_KM = 1.0  # 1000 meters

# --- Helper Functions ---
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def densify_segment(p1, p2, interval_m=100):
    """Generates points between p1 and p2 every interval_m meters."""
    dist = haversine(p1[0], p1[1], p2[0], p2[1])
    num_steps = int(dist / interval_m)
    
    points = []
    if num_steps < 1:
        points.append([p1[1], p1[0]]) # Just start
        # End will be added by next segment or manually
        return points
        
    for i in range(num_steps + 1):
        frac = i / num_steps
        lat = p1[0] + (p2[0] - p1[0]) * frac
        lon = p1[1] + (p2[1] - p1[1]) * frac
        points.append([lon, lat])
        
    return points

def get_elevations(coords, batch_size=100):
    """Fetch elevations from Open-Meteo API"""
    elevations = []
    for i in range(0, len(coords), batch_size):
        batch = coords[i:i+batch_size]
        lats = [c[0] for c in batch]
        lons = [c[1] for c in batch]
        
        url = "https://api.open-meteo.com/v1/elevation"
        params = {"latitude": lats, "longitude": lons}
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            if 'elevation' in data:
                elevations.extend(data['elevation'])
                print(f"  Fetched elevations {i} to {i+len(batch)}")
            else:
                print(f"  Error fetching: {data}")
                elevations.extend([0] * len(batch))
        except Exception as e:
            print(f"  Error: {e}")
            elevations.extend([0] * len(batch))
    return elevations

# --- Main Logic ---

# 1. Load San Fernando Road Geometry
print(f"Loading {SF_ROAD_FILE}...")
with open(SF_ROAD_FILE, 'r', encoding='utf-8') as f:
    content = f.read()
    import re
    match = re.search(r'const SAN_FERNANDO_ROAD_GEOJSON = ({.*});', content, re.DOTALL)
    if match:
        sf_geojson = json.loads(match.group(1))
        sf_coords_raw = sf_geojson['features'][0]['geometry']['coordinates']
        # sf_coords_raw is [lon, lat]
    else:
        raise ValueError("Could not find SAN_FERNANDO_ROAD_GEOJSON in file")

# 2. Define Route Segments
# Intersection Point found by find_precise_intersection.py
INTERSECTION = {"lat": -15.135897403704003, "lon": -75.20401242175632}
INTERSECTION_IDX = 230  # SF Road segment index

# Part 1: NW Vertex -> Intersection (Straight line following Shougang "Frente Norte")
# Densify this segment so we have points for labeling
p_start = [SHOUGANG_NW['lat'], SHOUGANG_NW['lon']]
p_end = [INTERSECTION['lat'], INTERSECTION['lon']]
print("Densifying first segment (NW -> Intersection)...")
segment_1 = densify_segment(p_start, p_end, interval_m=100) # [lon, lat]

route_coords = segment_1

# Part 2: SF Road -> PE-1S
# SF Road is ordered Coast -> PE-1S (West -> East) based on previous check (0 is East/Coast? No, wait.)
# Previous run said: "SF Road orientation: East -> West" (0 is East, -1 is West/Coast).
# Let's re-verify.
# Start Lon (0): -75.25... (Coast/West)
# End Lon (-1): -74.99... (PE-1S/East)
# Actually, let's trust the coordinates.
# If index 0 is at -75.25 (West) and index -1 is at -74.99 (East).
# Intersection is at -75.20.
# If 0 is West, Intersection is at index 230 (near West end?).
# Wait, total points 236. Index 230 is near the END if 0 is start.
# If 0 is West, 230 (near 236) is East. -75.20 is WEST of -74.99.
# Let's check coord at 230.
# The `find_precise_intersection` output said intersection at segment 230.
# If the loop `for i in range(len(path_coords) - 1)` found it at 230, it means between pt 230 and 231.
# -75.20 is indeed West. -74.99 is East.
# So if 230 is -75.20, and the list has length 236?
# Ah, maybe the list is ordered East -> West (PE-1S -> Coast).
# Let's check `sf_coords_raw` again with a print.

# We will just assume we want from Intersection -> PE-1S (East).
# We take the segment of road points that are EAST of the intersection.
# We append `sf_coords_raw` points that are needed.

# Let's sort the road segment by longitude (West to East) to be safe.
# We want to go from Intersection (-75.20) to PE-1S (-74.99).
# Any road point with lon > -75.20 (less negative) is to the East.
points_east_of_intersection = [p for p in sf_coords_raw if p[0] > INTERSECTION['lon']]

# Sort them West -> East (increasing longitude)
points_east_of_intersection.sort(key=lambda p: p[0])

route_coords.extend(points_east_of_intersection)

print(f"Total route points: {len(route_coords)}")
print(f"Start: {route_coords[0]} (NW Vertex)")
print(f"Mid: {route_coords[1]} (Intersection)")
print(f"End: {route_coords[-1]} (PE-1S)")

# 4. Fetch Elevations
route_latlon = [[c[1], c[0]] for c in route_coords] # [lat, lon]
print("Fetching elevation data...")
elevations = get_elevations(route_latlon)

# 5. Analyze Route (Distance, Slope, 500m Labels)
cum_dist = 0
labeled_points = []
all_points_data = []
next_label_km = 0.0

# --- Main Processing Loop ---
for i in range(len(route_coords)):
    lat, lon = route_latlon[i]
    alt = elevations[i]
    
    slope = 0
    if i > 0:
        prev_lat, prev_lon = route_latlon[i-1]
        prev_alt = elevations[i-1]
        step_dist = haversine(prev_lat, prev_lon, lat, lon)
        cum_dist += step_dist
        
        if step_dist > 0:
            slope = ((alt - prev_alt) / step_dist) * 100
    
    km_curr = cum_dist / 1000.0
    
    point_data = {
        "coords": [lat, lon],
        "alt": round(alt, 1),
        "slope": round(slope, 2),
        "km": round(km_curr, 3)
    }
    all_points_data.append(point_data)

    # Check for label (every 500m)
    # We label the closest point to the exact 500m mark
    if km_curr >= next_label_km:
        # Interpolate exact coordinate could be better, but snapping to point is safer for now
        # unless step is huge. Assuming dense points.
        
        # Add label
        label_name = f"KM {next_label_km:.1f}"
        desc = f"Alt: {alt:.0f}m\nPend: {slope:.1f}%"
        
        labeled_points.append({
            "name": label_name,
            "coords": [lat, lon],
            "alt": round(alt, 1),
            "slope": round(slope, 2),
            "km": next_label_km
        })
        
        next_label_km += LABEL_INTERVAL_KM


# --- Save Outputs ---

# Save JS
geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "name": "Ruta Verde (Puerto NW \u2192 PE-1S)",
                "style": "green_route"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": route_coords
            }
        }
    ]
}

js_content = f"""
// Auto-generated by analyze_green_route_v2.py
const NEW_GREEN_ROUTE_GEOJSON = {json.dumps(geojson, indent=4)};

const NEW_GREEN_ROUTE_POINTS = {json.dumps(labeled_points, indent=4)};
"""

with open(OUTPUT_JS, 'w', encoding='utf-8') as f:
    f.write(js_content)
print(f"Saved JS to {OUTPUT_JS}")

# --- Manual KML Generation ---


def create_kml_content(route_coords, labeled_points):
    kml_header = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Ruta Verde Analysis</name>
    <Style id="greenLine">
      <LineStyle>
        <color>ff00ff00</color>
        <width>4</width>
      </LineStyle>
    </Style>
    <Style id="labelStyle">
      <IconStyle>
        <scale>0.8</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/grn-circle.png</href>
        </Icon>
      </IconStyle>
    </Style>
"""
    kml_footer = """  </Document>
</kml>"""

    # Route Line
    line_coords_str = " ".join([f"{lon},{lat},{alt}" for lat, lon, alt in [
        (p['coords'][0], p['coords'][1], p['alt']) for p in all_points_data
    ]])
    
    kml_body = f"""
    <Placemark>
      <name>Ruta Verde Path</name>
      <styleUrl>#greenLine</styleUrl>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>
          {line_coords_str}
        </coordinates>
      </LineString>
    </Placemark>
"""

    # Labels
    for pt in labeled_points:
        lon, lat = pt['coords'][1], pt['coords'][0]
        alt = pt['alt']
        name = pt['name']
        desc = f"Alt: {alt}m, Slope: {pt['slope']}%"
        
        kml_body += f"""
    <Placemark>
      <name>{name}</name>
      <description>{desc}</description>
      <styleUrl>#labelStyle</styleUrl>
      <Point>
        <coordinates>{lon},{lat},{alt}</coordinates>
      </Point>
    </Placemark>
"""

    return kml_header + kml_body + kml_footer

# Generate KML Content
kml_text = create_kml_content(route_coords, labeled_points)

with open(OUTPUT_KML, 'w', encoding='utf-8') as f:
    f.write(kml_text)
print(f"Saved KML (manual) to {OUTPUT_KML}")

# Print summary for user
print("\n--- Route Summary ---")
print(f"Start: Shougang NW Vertex")
print(f"End: PE-1S Intersection")
print(f"Length: {cum_dist/1000:.2f} km")
if elevations:
    print(f"Min Elev: {min(elevations):.0f} m")
    print(f"Max Elev: {max(elevations):.0f} m")
    print(f"Elev Gain: {max(elevations) - min(elevations):.0f} m")
print(f"Labels: {len(labeled_points)}")
