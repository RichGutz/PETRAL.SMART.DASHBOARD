
import json

# Convert DMS to decimal
# 15°08'09"S = -(15 + 8/60 + 9/3600) = -15.135833
# 75°12'16"W = -(75 + 12/60 + 16/3600) = -75.204444

lat = -(15 + 8/60 + 9/3600)
lon = -(75 + 12/60 + 16/3600)
elevation = 720  # meters

landmark = {
    "name": "Cruce Shougang - Camino SF",
    "coords": [lat, lon],  # [lat, lon] for Leaflet
    "elevation": elevation,
    "description": "Intersección del borde norte de Shougang con el Camino San Fernando",
    "type": "intersection"
}

# Write to JS file
js_content = f"const LANDMARK_SHOUGANG_SF_INTERSECTION = {json.dumps(landmark, indent=4)};"

with open(r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\landmark_intersection.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Generated landmark_intersection.js")
print(f"Landmark: {landmark['name']}")
print(f"Location: Lat {lat:.6f}, Lon {lon:.6f}")
print(f"Elevation: {elevation} m")
print(f"DMS: 15°08'09\"S 75°12'16\"W")
