import ezdxf
import json
import os
from pyproj import Transformer

# Configuration
CAD_DIR = r"C:\Users\rguti\Petral.MARK\Archivos.CAD"
OUTPUT_FILE = r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\terrain_data.js"
TARGET_FILES = [
    "251002 01 ubicacion.dxf",
    "251002 02 perimetro.dxf",
    "251002 03 entorno.dxf"
]
# Layers that potentially contain road data. Modify based on analysis.
# Adding broad terms based on typical naming.
ROAD_LAYERS = ["vias", "vias-ejes", "carretera", "trocha", "camino", "acceso", "eje", "pista", "mina", "perimetro", "reserva", "peimet local", "nulo"]

def extract_roads():
    # Setup Coordinate Transformer: UTM 18S (EPSG:32718) -> WGS84 (EPSG:4326)
    transformer = Transformer.from_crs("epsg:32718", "epsg:4326", always_xy=True)
    
    features = []
    
    for filename in TARGET_FILES:
        path = os.path.join(CAD_DIR, filename)
        if not os.path.exists(path):
            continue
            
        try:
            doc = ezdxf.readfile(path)
            msp = doc.modelspace()
            print(f"Processing {filename}...")
            
            # Find relevant entities
            count = 0
            for e in msp:
                layer = e.dxf.layer.lower()
                
                # Check if layer name matches any of our keywords
                if any(keyword in layer for keyword in ROAD_LAYERS):
                    points = []
                    
                    if e.dxftype() == 'LWPOLYLINE':
                        # LWPolyline returns (x, y, start_width, end_width, bulge)
                        raw_points = e.get_points() 
                        points = [(p[0], p[1]) for p in raw_points]
                        
                    elif e.dxftype() == 'LINE':
                        start = e.dxf.start
                        end = e.dxf.end
                        points = [(start.x, start.y), (end.x, end.y)]
                    
                    elif e.dxftype() == 'POLYLINE':
                        points = [(v.dxf.location.x, v.dxf.location.y) for v in e.vertices()]

                    if points:
                        # Convert to Lat/Lon
                        coords_wgs84 = []
                        valid = True
                        for x, y in points:
                            # Basic integrity check for UTM18S roughly in Peru
                            # Easting ~200k-800k, Northing ~8M
                            if not (100000 < x < 900000 and 8000000 < y < 9000000):
                                valid = False
                                break
                                
                            lon, lat = transformer.transform(x, y)
                            coords_wgs84.append([lon, lat]) # GeoJSON wants [Lon, Lat]
                        
                        if valid and len(coords_wgs84) > 1:
                            features.append({
                                "type": "Feature",
                                "properties": {
                                    "source": filename,
                                    "layer": e.dxf.layer
                                },
                                "geometry": {
                                    "type": "LineString",
                                    "coordinates": coords_wgs84
                                }
                            })
                            count += 1
            print(f"  -> Extracted {count} road segments.")
            
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    # Export to JS file
    geojson_obj = {
        "type": "FeatureCollection",
        "features": features
    }
    
    js_content = f"const TERRAIN_ROADS = {json.dumps(geojson_obj, indent=2)};"
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(js_content)
        
    print(f"\nSuccessfully wrote {len(features)} segments to {OUTPUT_FILE}")

if __name__ == "__main__":
    extract_roads()
