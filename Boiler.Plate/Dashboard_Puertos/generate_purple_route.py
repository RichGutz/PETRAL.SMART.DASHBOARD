import requests
import json

# San Juan de Marcona (Approx Town Center) -> Puerto San Nicolas
start = [-15.350, -75.160] 
end = [-15.260, -75.240]

url = f"https://router.project-osrm.org/route/v1/driving/{start[1]},{start[0]};{end[1]},{end[0]}?overview=full&geometries=geojson"

print(f"Fetching route: {url}")
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
data = r.json()

if data['code'] == 'Ok' and len(data['routes']) > 0:
    route = data['routes'][0]
    
    feature = {
        "type": "Feature",
        "properties": {
            "name": "Ruta Morada (Marcona - San Nicolás)",
            "color": "#9c27b0",
            "distance_km": route['distance'] / 1000,
            "duration_h": route['duration'] / 3600
        },
        "geometry": route['geometry']
    }
    
    js_content = f"const LAYER_PURPLE_ROUTE = {json.dumps(feature, indent=2)};"
    
    with open("layer_purple_route.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    
    print("Success: layer_purple_route.js created")
else:
    print("Error fetching route")
