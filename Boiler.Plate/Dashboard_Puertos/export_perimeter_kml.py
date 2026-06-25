import json
import re

# Read the JS file containing the perimeter data
js_path = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\perimeter_sides.js'
with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the JSON object using regex
match = re.search(r'const PERIMETER_SIDES_GEOJSON = (\{.*?\});', content, re.DOTALL)
if not match:
    print("Could not find PERIMETER_SIDES_GEOJSON")
    exit(1)

geojson_str = match.group(1)
geojson = json.loads(geojson_str)

# KML Header
kml_content = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    '  <Document>',
    '    <name>Perimetro PETRAL</name>',
    '    <description>Lados A, B y C del perimetro consolidado</description>'
]

# Style definitions based on the colors in the GeoJSON
styles = {
    "#10b981": "styleGreen",
    "#f59e0b": "styleAmber",
    "#3b82f6": "styleBlue"
}

for color, style_id in styles.items():
    # Convert hex #RRGGBB to KML aabbggrr (Alpha=ff)
    r, g, b = color[1:3], color[3:5], color[5:7]
    kml_color = f"ff{b}{g}{r}"
    kml_content.append(f'    <Style id="{style_id}">')
    kml_content.append( '      <LineStyle>')
    kml_content.append(f'        <color>{kml_color}</color>')
    kml_content.append( '        <width>4</width>')
    kml_content.append( '      </LineStyle>')
    kml_content.append( '    </Style>')

# Add Placemarks
for feature in geojson['features']:
    name = feature['properties'].get('name', 'Lado')
    color = feature['properties'].get('stroke', '#3388ff')
    style_url = f"#{styles.get(color, 'styleGreen')}"
    coords_list = feature['geometry']['coordinates']
    
    # Format coordinates: lon,lat,alt
    kml_coords = " ".join([f"{c[0]},{c[1]},0" for c in coords_list])
    
    kml_content.append('    <Placemark>')
    kml_content.append(f'      <name>{name}</name>')
    kml_content.append(f'      <styleUrl>{style_url}</styleUrl>')
    kml_content.append('      <LineString>')
    kml_content.append('        <tessellate>1</tessellate>')
    kml_content.append(f'        <coordinates>{kml_coords}</coordinates>')
    kml_content.append('      </LineString>')
    kml_content.append('    </Placemark>')

# KML Footer
kml_content.extend([
    '  </Document>',
    '</kml>'
])

output_path = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Perimetro_PETRAL.kml'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write("\n".join(kml_content))

print(f"KML generated successfully at: {output_path}")
