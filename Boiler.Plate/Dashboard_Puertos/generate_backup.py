import json
import math
import requests
import time

# --- Configuration ---
# Coordinates for comparison ports
PORTS = {
    'Marcona': {'lat': -15.2600, 'lon': -75.2400},
    'Matarani': {'lat': -17.0016, 'lon': -72.1065},
    'Ilo': {'lat': -17.6450, 'lon': -71.3468},
    'Callao': {'lat': -12.0508, 'lon': -77.1373}
}

# Specific configurations to force distinct routes
# Key: Mine Name (must match MINING_PROJECTS)
# Value: List of [lat, lon] waypoints to pass through
MINE_ROUTE_CONFIGS = {
    "Mina Justa (Subterránea)": {
        "road_type": "Vía Privada / Acceso Directo",
        "capacity": "Alta (Camiones Blindados)"
    },
    "Pampas de Pongo": {
        "road_type": "Acceso Local / Trocha",
        "capacity": "Baja"
    },
    "Los Chancas": {
        "road_type": "PE-30A / Interoceánica Sur",
        "capacity": "Media"
    },
    "Trapiche": {
        "road_type": "PE-30A / Desvío Antabamba",
        "capacity": "Media"
    },
    "Hierro Apurimac": {
        "road_type": "PE-30A / PE-3S",
        "capacity": "Media"
    }
}

# Mines Data (from mines_data.js)
MINING_PROJECTS = [
    { "name": "Las Bambas", "coords": [-14.099, -72.320] },
    { "name": "Mina Justa (Subterránea)", "coords": [-15.283, -75.108] },
    { "name": "Constancia", "coords": [-14.480, -71.780] },
    { "name": "Antapaccay", "coords": [-14.960, -71.346] },
    { "name": "Cerro Verde", "coords": [-16.529, -71.597] },
    { "name": "Quellaveco", "coords": [-17.104, -70.620] },
    { "name": "Tía María", "coords": [-17.013, -71.771] },
    { "name": "San Gabriel", "coords": [-16.140, -70.536] },
    { "name": "Zafranal", "coords": [-16.041, -72.238] },
    { "name": "Los Chancas", "coords": [-14.170, -73.118] },
    { "name": "Trapiche", "coords": [-14.500, -72.833] },
    { "name": "Corani", "coords": [-13.875, -70.608] },
    { "name": "Haquira", "coords": [-14.168, -72.359] },
    { "name": "Pampas de Pongo", "coords": [-15.397, -74.837] },
    { "name": "Hierro Apurimac", "coords": [-13.65, -73.38] }
]

OUTPUT_FILE = r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\south_corridor_data.js"

# --- Logic ---

def haversine(coord1, coord2):
    R = 6371  # km
    dlat = math.radians(coord2['lat'] - coord1[0])
    dlon = math.radians(coord2['lon'] - coord1[1])
    a = math.sin(dlat/2) * math.sin(dlat/2) + \
        math.cos(math.radians(coord1[0])) * math.cos(math.radians(coord2['lat'])) * \
        math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def get_osrm_route(start_coords, end_coords, waypoints=None):
    # OSRM expects lon,lat
    # Build coordinates string: start;waypoint1;waypoint2;...;end
    
    coords_list = [f"{start_coords[1]},{start_coords[0]}"]
    
    if waypoints:
        for wp in waypoints:
            coords_list.append(f"{wp[1]},{wp[0]}")
            
    coords_list.append(f"{end_coords[1]},{end_coords[0]}")
    
    coords_str = ";".join(coords_list)
    
    url = f"https://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"
    
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        data = r.json()
        if data['code'] == 'Ok' and len(data['routes']) > 0:
            return data['routes'][0]
    except Exception as e:
        print(f"Error fetching route: {e}")
    return None

def main():
    features = []
    marcona_mines = []
    
    print("--- Identifying Mines Closest to Marcona ---")
    
    for mine in MINING_PROJECTS:
        distances = {}
        for port_name, port_coords in PORTS.items():
            distances[port_name] = haversine(mine['coords'], port_coords)
        
        closest_port = min(distances, key=distances.get)
        
        # Override: Some mines might be strategically linked to Marcona despite distance
        # For this exercise, we focus on generating Marcona routes for everyone if needed,
        # but let's stick to the closest logic or force specific ones.
        
        # If the user wants ALL mines to show their path to San Nicolas (Marcona),
        # we can relax this condition. Let's include all for the corridor analysis.
        # But for now, let's stick to the original logic unless told otherwise.
        
        print(f"{mine['name']}: Closest is {closest_port} ({distances[closest_port]:.1f}km)")
        
        if closest_port == 'Marcona':
            marcona_mines.append(mine)

    print(f"\n--- Generating Routes for {len(marcona_mines)} Mines ---")
    
    for mine in marcona_mines:
        print(f"Routing {mine['name']} -> Marcona...")
        
        # Get custom config if available
        config = MINE_ROUTE_CONFIGS.get(mine['name'], {})
        waypoints = config.get('waypoints', [])
        
        route = get_osrm_route(mine['coords'], [PORTS['Marcona']['lat'], PORTS['Marcona']['lon']], waypoints)
        
        if route:
            props = {
                "mine": mine['name'],
                "distance_km": route['distance'] / 1000,
                "duration_h": route['duration'] / 3600,
                "road_type": config.get('road_type', 'Vía Estandar'),
                "capacity": config.get('capacity', 'Desconocida')
            }
            
            features.append({
                "type": "Feature",
                "properties": props,
                "geometry": route['geometry']
            })
        
        time.sleep(0.5) # Respect rate limits

    # Save to JS
    geojson_obj = {
        "type": "FeatureCollection",
        "features": features
    }
    
    js_content = f"const SOUTH_CORRIDOR = {json.dumps(geojson_obj, indent=2)};"
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(js_content)
        
    print(f"\nSuccessfully wrote {len(features)} routes to {OUTPUT_FILE}")


def generate_pe30b():
    print("\n--- Generating Missing Road PE-30B ---")
    # Coordinates approx based on description: 
    # Start: Desvío Andahuaylas (from PE-3S/PE-30A region) -> Approx -13.66, -73.38
    # End: Join with PE-30 (near Nazca/Puquio) -> Approx -14.60, -74.30 (Puquio region)
    # Via: Pampachiri -> -14.18, -73.55
    
    start = [-13.665, -73.388] # Andahuaylas region
    mid = [-14.180, -73.550]   # Pampachiri
    end = [-14.693, -74.120]   # Junction near Puquio/Lucanas
    
    route = get_osrm_route(start, end, waypoints=[mid])
    
    if route:
        feature = {
            "type": "Feature",
            "properties": {
                "id": "PE-30B",
                "name": "Ruta Nacional PE-30B (Andahuaylas - Puquio)",
                "color": "#e91e63", # Standard Red/Pink for National Roads
                "distance_km": route['distance'] / 1000,
                "duration_h": route['duration'] / 3600
            },
            "geometry": route['geometry']
        }
        
        # Save to a separate file to be merged or loaded
        js_content = f"const ROAD_PE30B = {json.dumps(feature, indent=2)};"
        with open(r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\road_pe30b.js", "w", encoding="utf-8") as f:
            f.write(js_content)
            
        print("Successfully generated PE-30B geometry.")
    else:
        print("Failed to route PE-30B.")

if __name__ == "__main__":
    # Commenting out main() to run only the repair function or run both
    # main() 
    generate_pe30b()
