import zipfile
import geopandas as gpd
import fiona.drvsupport
import os
import pandas as pd

# Enable KML driver
fiona.drvsupport.supported_drivers['KML'] = 'rw'
fiona.drvsupport.supported_drivers['LIBKML'] = 'rw'

kmz_path = r"C:\Users\rguti\Petral.MARK\Archivos.CAD\3. Planops Trazo Ferrocarril - Marcona - Andahuaylas.kmz"
extract_dir = "temp_kmz_extract"

print(f"Processing {kmz_path}...")

try:
    # 1. Unzip KMZ to find KML
    with zipfile.ZipFile(kmz_path, 'r') as z:
        z.extractall(extract_dir)
        kml_files = [f for f in z.namelist() if f.endswith('.kml')]
        
    if not kml_files:
        print("No KML file found inside KMZ.")
    else:
        kml_path = os.path.join(extract_dir, kml_files[0])
        print(f"Found KML: {kml_path}")
        
        # 2. Read KML - iterate layers
        # Fiona can list layers
        layers = fiona.listlayers(kml_path)
        print(f"Layers found: {layers}")
        
        all_lines = []
        
        for layer in layers:
            print(f"Reading layer: {layer}")
            try:
                gdf = gpd.read_file(kml_path, layer=layer)
                print(f"  Features: {len(gdf)}")
                # Check for lines
                lines = gdf[gdf.geometry.type.isin(['LineString', 'MultiLineString', 'LineStringZ'])]
                if not lines.empty:
                    print(f"  Found {len(lines)} line features.")
                    all_lines.append(lines)
            except Exception as e:
                print(f"  Error reading layer {layer}: {e}")
                
        if all_lines:
            final_gdf = pd.concat(all_lines, ignore_index=True)
            output_file = "railway_line.geojson"
            final_gdf.to_file(output_file, driver="GeoJSON")
            print(f"Saved ALL lines to {output_file}")
        else:
            print("No lines found in any layer.")
        
except Exception as e:
    print(f"Error: {e}")
