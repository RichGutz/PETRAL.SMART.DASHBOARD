
import json
import xml.etree.ElementTree as ET

# Parse KML
tree = ET.parse(r'C:\Users\rguti\Petral.MARK\Archivos.CAD\CAMINO.RESERVA.SAN.FERNANDO.kml')
root = tree.getroot()

# KML namespace
ns = {'kml': 'http://www.opengis.net/kml/2.2'}

# Find all Placemarks with LineString
placemarks = root.findall('.//kml:Placemark', ns)

route_coords = []

for placemark in placemarks:
    name_elem = placemark.find('kml:name', ns)
    linestring = placemark.find('.//kml:LineString/kml:coordinates', ns)
    
    if linestring is not None and name_elem is not None:
        name = name_elem.text
        if 'MITAD' in name or 'San.Fernando' in name:
            # Extract coordinates
            coords_text = linestring.text.strip()
            # Parse: "lon,lat,alt lon,lat,alt ..."
            points = coords_text.split()
            
            for point in points:
                parts = point.split(',')
                if len(parts) >= 2:
                    lon = float(parts[0])
                    lat = float(parts[1])
                    route_coords.append([lon, lat])
            
            print(f"Found route: {name} with {len(route_coords)} points")
            break

# Create GeoJSON
feature = {
    "type": "Feature",
    "properties": {
        "name": "Camino Reserva San Fernando",
        "style": "san_fernando_road"
    },
    "geometry": {
        "type": "LineString",
        "coordinates": route_coords
    }
}

geojson = {
    "type": "FeatureCollection",
    "features": [feature]
}

# Write to JS file
js_content = f"const SAN_FERNANDO_ROAD_GEOJSON = {json.dumps(geojson, indent=4)};"

with open(r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\layer_san_fernando_road.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Generated layer_san_fernando_road.js with {len(route_coords)} coordinate points")
