
import json
from shapely.geometry import LineString, Polygon, Point

# Load Shougang polygon
with open(r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\shougang_polygon.js', 'r', encoding='utf-8') as f:
    content = f.read()
    # Extract coordinates from the JS file
    import re
    # Find the coordinates array
    match = re.search(r'const ALL_COORDS = \[(.*?)\];', content, re.DOTALL)
    if match:
        coords_text = match.group(1)
        # Parse coordinates
        coords = []
        for line in coords_text.split('\n'):
            if '[' in line and ']' in line:
                # Extract [lat, lon]
                coord_match = re.search(r'\[([-\d.]+),\s*([-\d.]+)\]', line)
                if coord_match:
                    lat = float(coord_match.group(1))
                    lon = float(coord_match.group(2))
                    coords.append((lon, lat))  # Shapely uses (lon, lat)

# Shougang outer ring (first 15 points)
shougang_outer = coords[:15]
shougang_polygon = Polygon(shougang_outer)

# Get the north border of Shougang (we need to identify which edge is "north")
# Looking at the coordinates, the northernmost points would have the smallest latitude (more negative)
# Let's find the northern edge
north_points = sorted(shougang_outer, key=lambda p: p[1])[:5]  # 5 northernmost points
print("Northernmost points of Shougang:")
for i, p in enumerate(north_points):
    print(f"  {i+1}. Lon: {p[0]:.6f}, Lat: {p[1]:.6f}")

# Load San Fernando Road
with open(r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\layer_san_fernando_road.js', 'r', encoding='utf-8') as f:
    content = f.read()
    # Extract GeoJSON
    match = re.search(r'const SAN_FERNANDO_ROAD_GEOJSON = ({.*});', content, re.DOTALL)
    if match:
        geojson_data = json.loads(match.group(1))
        road_coords = geojson_data['features'][0]['geometry']['coordinates']
        road_line = LineString(road_coords)

# Find the northern edge of Shougang
# Based on the polygon structure, let's identify the northernmost edge
# We'll check each edge of the polygon
edges = []
for i in range(len(shougang_outer)):
    p1 = shougang_outer[i]
    p2 = shougang_outer[(i + 1) % len(shougang_outer)]
    edge = LineString([p1, p2])
    # Calculate average latitude (more negative = more north)
    avg_lat = (p1[1] + p2[1]) / 2
    edges.append((edge, avg_lat, i, p1, p2))

# Sort by latitude to find northernmost edge
edges_sorted = sorted(edges, key=lambda x: x[1])
print("\nNorthernmost edges:")
for i, (edge, avg_lat, idx, p1, p2) in enumerate(edges_sorted[:3]):
    print(f"  Edge {idx}: {p1} -> {p2}, Avg Lat: {avg_lat:.6f}")

# Check intersection with each northern edge
intersections = []
for edge, avg_lat, idx, p1, p2 in edges_sorted[:5]:  # Check top 5 northern edges
    if road_line.intersects(edge):
        intersection = road_line.intersection(edge)
        if intersection.geom_type == 'Point':
            intersections.append((intersection, idx, p1, p2))
            print(f"\nIntersection found at edge {idx}!")
            print(f"  Coordinates: Lon {intersection.x:.6f}, Lat {intersection.y:.6f}")

if intersections:
    # Use the first intersection found
    intersection_point, edge_idx, p1, p2 = intersections[0]
    
    # Create landmark data
    landmark = {
        "name": "Cruce Shougang - Camino SF",
        "coords": [intersection_point.y, intersection_point.x],  # [lat, lon] for Leaflet
        "description": "Intersección del borde norte de Shougang con el Camino San Fernando"
    }
    
    # Write to JS file
    js_content = f"const LANDMARK_SHOUGANG_SF_INTERSECTION = {json.dumps(landmark, indent=4)};"
    
    with open(r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\landmark_intersection.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"\nGenerated landmark_intersection.js")
    print(f"Landmark: {landmark['name']}")
    print(f"Location: Lat {landmark['coords'][0]:.6f}, Lon {landmark['coords'][1]:.6f}")
else:
    print("\nNo intersection found between Shougang north border and SF road")
