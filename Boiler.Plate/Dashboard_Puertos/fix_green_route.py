
import json
import requests
import math

# Route waypoints
nw_vertex = {"lat": -15.165533, "lon": -75.256948, "name": "Shougang NW (Destino)"}
landmark = {"lat": -15.135833, "lon": -75.204444, "name": "Cruce Shougang-SF", "elevation": 720}

# Load San Fernando road
with open(r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\layer_san_fernando_road.js', 'r', encoding='utf-8') as f:
    content = f.read()
    import re
    match = re.search(r'const SAN_FERNANDO_ROAD_GEOJSON = ({.*});', content, re.DOTALL)
    if match:
        sf_geojson = json.loads(match.group(1))
        sf_coords = sf_geojson['features'][0]['geometry']['coordinates']

print(f"Total SF road coordinates: {len(sf_coords)}")

# Find the closest point on SF road to the landmark
def distance(p1, p2):
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

landmark_point = [landmark['lon'], landmark['lat']]
min_dist = float('inf')
closest_idx = 0

for i, coord in enumerate(sf_coords):
    dist = distance(coord, landmark_point)
    if dist < min_dist:
        min_dist = dist
        closest_idx = i

print(f"Closest SF road point to landmark: index {closest_idx}/{len(sf_coords)}")

# Build route: PE-1S (start of SF) -> Landmark -> NW vertex
# Use SF road from START to landmark (indices 0 to closest_idx)
route_coords = sf_coords[0:closest_idx+1]

# Add landmark point
route_coords.append([landmark['lon'], landmark['lat']])

# Add straight line to NW vertex
route_coords.append([nw_vertex['lon'], nw_vertex['lat']])

print(f"Total route points: {len(route_coords)}")
print(f"  - SF road segment: {closest_idx+1} points")
print(f"  - Landmark to NW: 2 points")

# Convert to lat/lon for elevation API
route_latlon = [[coord[1], coord[0]] for coord in route_coords]

# Get elevation data
def get_elevations(coords, batch_size=100):
    elevations = []
    for i in range(0, len(coords), batch_size):
        batch = coords[i:i+batch_size]
        lats = [c[0] for c in batch]
        lons = [c[1] for c in batch]
        
        url = "https://api.open-meteo.com/v1/elevation"
        params = {
            "latitude": lats,
            "longitude": lons
        }
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            elevations.extend(data.get('elevation', []))
            print(f"Fetched elevations for points {i} to {i+len(batch)}")
        except Exception as e:
            print(f"Error fetching elevations: {e}")
            elevations.extend([0] * len(batch))
    
    return elevations

print("Fetching elevation data...")
elevations = get_elevations(route_latlon)

# Calculate distances and slopes
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

cumulative_distance = 0
points_data = []

for i in range(len(route_coords)):
    lat, lon = route_latlon[i]
    alt = elevations[i]
    
    if i > 0:
        prev_lat, prev_lon = route_latlon[i-1]
        prev_alt = elevations[i-1]
        
        dist = haversine(prev_lat, prev_lon, lat, lon)
        cumulative_distance += dist
        
        # Calculate slope
        if dist > 0:
            slope = ((alt - prev_alt) / dist) * 100
        else:
            slope = 0
    else:
        slope = 0
    
    km = cumulative_distance / 1000
    
    points_data.append({
        "coords": [lat, lon],
        "alt": round(alt, 1),
        "slope": round(slope, 2),
        "km": round(km, 2)
    })

# Create GeoJSON
route_feature = {
    "type": "Feature",
    "properties": {
        "name": "Ruta Verde (PE-1S → SF → Landmark → Shougang NW)",
        "style": "green_route"
    },
    "geometry": {
        "type": "LineString",
        "coordinates": route_coords
    }
}

geojson = {
    "type": "FeatureCollection",
    "features": [route_feature]
}

# Write to JS file
js_content = f"const NEW_GREEN_ROUTE_GEOJSON = {json.dumps(geojson, indent=4)};\n\n"
js_content += f"const NEW_GREEN_ROUTE_POINTS = {json.dumps(points_data, indent=4)};"

with open(r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\new_green_route.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"\nGenerated new_green_route.js (CORRECTED)")
print(f"Total distance: {cumulative_distance/1000:.2f} km")
print(f"Total points: {len(points_data)}")
print(f"Elevation range: {min(elevations):.1f}m - {max(elevations):.1f}m")
print(f"\nRoute: PE-1S → Camino SF → Landmark → Shougang NW")
