import json
import re
import xml.etree.ElementTree as ET

def get_coords_from_kml(filepath):
    tree = ET.parse(filepath)
    root = tree.getroot()
    # KML namespaces
    ns = {'kml': 'http://www.opengis.net/kml/2.2', 'gx': 'http://www.google.com/kml/ext/2.2'}
    
    all_coords = []
    # Find all LineStrings
    for placemark in root.findall('.//kml:Placemark', ns):
        coords_text = placemark.find('.//kml:coordinates', ns)
        if coords_text is not None:
            text = coords_text.text.strip()
            # Split by whitespace, then by comma
            for part in text.split():
                if part:
                    c = part.split(',')
                    if len(c) >= 2:
                        all_coords.append([float(c[0]), float(c[1])])
    return all_coords

# 1. Get new coordinates from KML
kml_path = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Ruta Verde Actual.con extension.kml'
new_coords = get_coords_from_kml(kml_path)
print(f"Extracted {len(new_coords)} coordinates from KML.")

# 2. Update new_green_route.js
js_path = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\new_green_route.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Replace coordinates in the GeoJSON object
# We look for the first "LineString" coordinates array
pattern = r'("type":\s*"LineString",\s*"coordinates":\s*\[)(.*?)(\]\s*\})'
replacement = f'\\1\n                    {json.dumps(new_coords, indent=20)[1:-1]}\n                \\3'

# Note: json.dumps might be too aggressive with indentation, let's just format it cleanly
coords_json = json.dumps(new_coords)
# To match the style in the file:
# [
#     [lon, lat],
#     ...
# ]
formatted_coords = "[\n" + ",\n".join([f"                    [{c[0]}, {c[1]}]" for c in new_coords]) + "\n                ]"

new_js_content = re.sub(pattern, f'"type": "LineString",\n                "coordinates": {formatted_coords}', js_content, flags=re.DOTALL)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(new_js_content)

print("new_green_route.js updated successfully.")
