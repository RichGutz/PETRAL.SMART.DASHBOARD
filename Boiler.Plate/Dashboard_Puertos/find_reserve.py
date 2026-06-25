import geopandas as gpd
from shapely.geometry import Point, Polygon
import fiona.drvsupport

# Enable KML driver
fiona.drvsupport.supported_drivers['KML'] = 'rw'
fiona.drvsupport.supported_drivers['LIBKML'] = 'rw'

# Target Area: North of Shougang
# Shougang North Vertex approx: -15.075, -75.095
target_lat = -15.07
target_lon = -75.10
target_point = Point(target_lon, target_lat)

files = [
    r"C:\Users\rguti\Petral.MARK\Archivos.CAD\Zonas Reservadas\ANP_Nacional_Definitiva.kml"
]

print(f"Searching for geometries near {target_lat}, {target_lon}...\n")

for fp in files:
    try:
        print(f"--- Checking {fp} ---")
        gdf = gpd.read_file(fp)
        
        # Ensure CRS is WGS84
        if gdf.crs and gdf.crs.to_string() != "EPSG:4326":
            gdf = gdf.to_crs(epsg=4326)
            
        print(f"Loaded {len(gdf)} features.")
        
        # Check distance to target
        # Note: Distance in degrees is approx, but fine for finding "close" items
        # 0.1 degree is roughly 11km
        
        # Filter for San Fernando
        # Column names might vary (anp_nomb vs rb_nomb), check for 'Fernando' in any text column
        
        # Simple string search in all columns
        import pandas as pd
        
        # Convert to string to search easily
        mask = gdf.apply(lambda row: row.astype(str).str.contains('Fernando', case=False).any(), axis=1)
        matches = gdf[mask]
        
        if not matches.empty:
            print(f"FOUND {len(matches)} potential matches for 'Fernando'")
            for idx, row in matches.iterrows():
                print(f"Match Index {idx}:")
                for col in matches.columns:
                     if col != 'geometry':
                         print(f"  {col}: {row[col]}")
            
            # Save relevant match
            # Looking for "Reserva Nacional San Fernando"
            san_fernando = matches[matches['anp_nomb'] == 'San Fernando'] if 'anp_nomb' in matches.columns else matches
            
            if not san_fernando.empty:
                san_fernando.to_file("san_fernando.geojson", driver="GeoJSON")
                print("Saved San Fernando to san_fernando.geojson")
        else:
            print("No matches for 'Fernando' found.")


    except Exception as e:
        print(f"Error reading {fp}: {e}")
