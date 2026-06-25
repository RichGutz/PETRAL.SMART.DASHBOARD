import json
from pyproj import Transformer

# Coordenadas UTM WGS84 provistas por el usuario
# Zona 18S (Hemisferio Sur)
# Norte, Este
coords_utm = [
    (8288629.24, 506778.82),
    (8287629.23, 506778.85),
    (8287629.23, 504778.88),
    (8286629.22, 504778.91),
    (8286629.23, 506778.88),
    (8285629.23, 506778.91),
    (8285629.22, 503778.95),
    (8286629.22, 503778.92),
    (8286629.22, 502778.94),
    (8287629.22, 502778.91),
    (8287629.22, 501778.93),
    (8288629.22, 501778.90)
]

# Inicializar transformador pyproj
# EPSG:32718 -> UTM Zone 18 South based on WGS84
# EPSG:4326 -> WGS84 Lat/Lon
transformer = Transformer.from_crs("EPSG:32718", "EPSG:4326", always_xy=True) # always_xy=True means (Lon, Lat) output order usually? No, transformer.transform takes (x,y) -> (tm_easting, tm_northing). 
# Wait, for pyproj 2+, transform(xx, yy) returns (lat, lon) by default unless always_xy=True.
# Let's verify behavior. usually source is (Easting, Northing).

# Convert process
latlon_coords = []
for n, e in coords_utm:
    # Transformation: Easting, Northing
    lon, lat = transformer.transform(e, n) 
    latlon_coords.append([lon, lat]) # GeoJSON uses [Lon, Lat]

# Close the loop
if latlon_coords[0] != latlon_coords[-1]:
    latlon_coords.append(latlon_coords[0])

# Create GeoJSON structure
geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "name": "JZ",
                "style": "jz"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [latlon_coords]
            }
        }
    ]
}

# Generate JS content
js_content = f"const JZ_GEOJSON = {json.dumps(geojson, indent=4)};"

# Output file path
output_path = r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\layer_jz.js"

with open(output_path, "w", encoding="utf-8") as f:
    f.write(js_content)
    
print(f"Archivo generado en: {output_path}")
print("Primeras coords:", latlon_coords[0])
