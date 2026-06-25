
import json
import requests
import math
import xml.etree.ElementTree as ET

# Parse KML
tree = ET.parse(r'C:\Users\rguti\Petral.MARK\Archivos.CAD\RUTA.COSTERA.MARK.kml')
root = tree.getroot()

# KML namespace
ns = {'kml': 'http://www.opengis.net/kml/2.2'}

# Find LineString coordinates
linestring = root.find('.//kml:LineString/kml:coordinates', ns)

if linestring is None:
    print("❌ No se encontró LineString en el KML")
    exit(1)

# Extract coordinates
coords_text = linestring.text.strip()
points = coords_text.split()

route_coords = []
for point in points:
    parts = point.split(',')
    if len(parts) >= 2:
        lon = float(parts[0])
        lat = float(parts[1])
        route_coords.append([lon, lat])

print(f"✅ Extraídas {len(route_coords)} coordenadas de la ruta costera")

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
            print(f"  Elevaciones {i} a {i+len(batch)}")
        except Exception as e:
            print(f"  Error: {e}")
            elevations.extend([0] * len(batch))
    
    return elevations

print("🔄 Obteniendo datos de elevación...")
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

# Helper: Interpolate points
def interpolate_points(p1, p2, interval_m=10):
    dist = haversine(p1[0], p1[1], p2[0], p2[1])
    num_steps = int(dist / interval_m)
    new_points = []
    
    if num_steps < 1:
        return []
        
    for i in range(1, num_steps + 1):
        frac = i / num_steps
        lat = p1[0] + (p2[0] - p1[0]) * frac
        lon = p1[1] + (p2[1] - p1[1]) * frac
        new_points.append([lat, lon])
    return new_points

# 1. Densify Route (Every ~10m)
dense_route = []
cumulative_dist = 0
last_coord = route_latlon[0]
dense_route.append({"coords": last_coord, "dist": 0})

for i in range(1, len(route_latlon)):
    curr_coord = route_latlon[i]
    # Add interpolated points
    interp = interpolate_points(last_coord, curr_coord, interval_m=10)
    
    for p in interp:
        d = haversine(last_coord[0], last_coord[1], p[0], p[1])
        cumulative_dist += d
        dense_route.append({"coords": p, "dist": cumulative_dist})
        last_coord = p # Update last for next small hop
        
    # Add actual point
    d = haversine(last_coord[0], last_coord[1], curr_coord[0], curr_coord[1])
    cumulative_dist += d
    dense_route.append({"coords": curr_coord, "dist": cumulative_dist})
    last_coord = curr_coord

# Fetch dense elevations? No, that's too expensive (thousands of calls).
# We will interpolate elevation from original points or fetch efficiently?
# Better: Calculate distance on the original route, find the segment where KM X falls, interpolate lat/lon/elev.

# --- Optimized Approach for exact KM markers ---
points_data = []
target_km = 0
interval_km = 1.0
total_dist_so_far = 0

# Add Start Point (KM 0)
points_data.append({
    "coords": route_latlon[0],
    "alt": round(elevations[0], 1) if elevations else 0,
    "slope": 0,
    "km": 0.0
})
target_km += interval_km

for i in range(1, len(route_latlon)):
    lat1, lon1 = route_latlon[i-1]
    alt1 = elevations[i-1]
    
    lat2, lon2 = route_latlon[i]
    alt2 = elevations[i]
    
    segment_dist = haversine(lat1, lon1, lat2, lon2)
    
    # While next target fits in this segment
    while (target_km * 1000) <= (total_dist_so_far + segment_dist):
        # Interpolate
        remaining_dist = (target_km * 1000) - total_dist_so_far
        frac = remaining_dist / segment_dist
        
        interp_lat = lat1 + (lat2 - lat1) * frac
        interp_lon = lon1 + (lon2 - lon1) * frac
        interp_alt = alt1 + (alt2 - alt1) * frac
        
        # Calculate slope (backwards look is tricky if we just jumped, but local segment slope is fine)
        # Local slope of the segment:
        if segment_dist > 0:
            local_slope = ((alt2 - alt1) / segment_dist) * 100
        else:
            local_slope = 0
            
        points_data.append({
            "coords": [interp_lat, interp_lon],
            "alt": round(interp_alt, 1),
            "slope": round(local_slope, 2),
            "km": target_km
        })
        
        target_km += interval_km
        
    total_dist_so_far += segment_dist

print(f"✅ Generados {len(points_data)} puntos de marcadores (EXACTAMENTE cada 1 km)")

# Create GeoJSON
route_feature = {
    "type": "Feature",
    "properties": {
        "name": "Ruta Costera MARK",
        "style": "coastal_route"
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
js_content = f"const COASTAL_ROUTE_GEOJSON = {json.dumps(geojson, indent=4)};\n\n"
js_content += f"const COASTAL_ROUTE_POINTS = {json.dumps(points_data, indent=4)};"

with open(r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\coastal_route.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"\n✅ Generado coastal_route.js")
print(f"📏 Distancia total: {total_dist_so_far/1000:.2f} km")
print(f"📍 Puntos con etiquetas: {len(points_data)}")
print(f"⛰️  Rango elevación: {min(elevations):.1f}m - {max(elevations):.1f}m")
