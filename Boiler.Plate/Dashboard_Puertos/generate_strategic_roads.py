import json
import requests
import time

# --- Configuration ---
ROUTES = [
    {
        "id": "PE-30", 
        "name": "Carretera Interoceánica PE-30 (Nazca -> Marcona)",
        "color": "#e91e63", # Pink/Red Distinctive
        "start": [-14.8359, -74.9328], # Nazca
        "end": [-15.3533, -75.1585]   # San Juan de Marcona
    },
    {
        "id": "IC-821", 
        "name": "Ruta IC-821 (Marcona -> San Nicolás)",
        "color": "#9c27b0", # Purple Distinctive
        "start": [-15.3533, -75.1585], # San Juan de Marcona
        "end": [-15.2600, -75.2400]    # San Nicolás Port
    }
]

OUTPUT_FILE = r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\infrastructure_roads.js"

def get_osrm_route(start_coords, end_coords):
    # OSRM expects lon,lat
    start_str = f"{start_coords[1]},{start_coords[0]}"
    end_str = f"{end_coords[1]},{end_coords[0]}"
    url = f"https://router.project-osrm.org/route/v1/driving/{start_str};{end_str}?overview=full&geometries=geojson"
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        data = r.json()
        if data['code'] == 'Ok' and len(data['routes']) > 0:
            return data['routes'][0]
    except Exception as e:
        print(f"Error: {e}")
    return None

def main():
    features = []
    print("--- Generating Strategic Infrastructure Roads ---")
    
    for route_def in ROUTES:
        print(f"Routing {route_def['name']}...")
        route = get_osrm_route(route_def['start'], route_def['end'])
        
        if route:
            features.append({
                "type": "Feature",
                "properties": {
                    "id": route_def['id'],
                    "name": route_def['name'],
                    "color": route_def['color'],
                    "distance_km": route['distance'] / 1000,
                    "duration_h": route['duration'] / 3600
                },
                "geometry": route['geometry']
            })
        time.sleep(0.5)

    geojson_obj = { "type": "FeatureCollection", "features": features }
    js_content = f"const INFRA_ROADS = {json.dumps(geojson_obj, indent=2)};"
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"\nSuccessfully wrote {len(features)} roads to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
