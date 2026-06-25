import json
import re

# Read the JS file
with open(r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\new_green_route.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the JSON object using regex
match = re.search(r'const NEW_GREEN_ROUTE_GEOJSON = (\{.*?\});', content, re.DOTALL)
if not match:
    print("Could not find NEW_GREEN_ROUTE_GEOJSON")
    exit(1)

geojson_str = match.group(1)
geojson = json.loads(geojson_str)

# Extracts coordinates
coords = geojson['features'][0]['geometry']['coordinates']

# Format coordinates for KML (lon,lat,alt)
kml_coords = "\n".join([f"{c[0]},{c[1]},0" for c in coords])

# Create KML content
kml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Ruta Verde Actual</name>
    <Style id="greenLine">
      <LineStyle>
        <color>ff00ff00</color>
        <width>4</width>
      </LineStyle>
    </Style>
    <Placemark>
      <name>Ruta Verde</name>
      <styleUrl>#greenLine</styleUrl>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>
{kml_coords}
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>"""

# Write KML file
with open(r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\ruta_verde_actual.kml', 'w', encoding='utf-8') as f:
    f.write(kml_content)

print("KML file created successfully.")
