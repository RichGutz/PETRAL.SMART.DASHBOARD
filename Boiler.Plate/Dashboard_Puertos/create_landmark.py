
import json

# Based on visual inspection of the map:
# - Shougang's northern border runs approximately around lat -15.31 to -15.34
# - SF Road passes through this area around lon -75.00 to -75.02
# - The intersection appears to be approximately at:

landmark = {
    "name": "Cruce Shougang - Camino SF",
    "coords": [-15.165, -75.095],  # [lat, lon] - approximate intersection point
    "description": "Intersección del borde norte de Shougang con el Camino San Fernando",
    "type": "intersection"
}

# Write to JS file
js_content = f"const LANDMARK_SHOUGANG_SF_INTERSECTION = {json.dumps(landmark, indent=4)};"

with open(r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\landmark_intersection.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Generated landmark_intersection.js")
print(f"Landmark: {landmark['name']}")
print(f"Location: Lat {landmark['coords'][0]:.6f}, Lon {landmark['coords'][1]:.6f}")
