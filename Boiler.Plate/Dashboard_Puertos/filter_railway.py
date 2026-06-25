import geopandas as gpd

input_file = "railway.geojson"
output_file = "railway_line.geojson"

print(f"Filtering {input_file}...")

try:
    gdf = gpd.read_file(input_file)
    print(f"Total features: {len(gdf)}")
    
    # Filter for Lines
    lines = gdf[gdf.geometry.type.isin(['LineString', 'MultiLineString'])]
    
    if lines.empty:
        print("No LineString/MultiLineString found! Checking for 3D lines...")
        # Sometimes 3D lines are read differently, but usually they are LineStringZ
        print(gdf.geometry.type.unique())
    else:
        print(f"Found {len(lines)} line features.")
        lines.to_file(output_file, driver="GeoJSON")
        print(f"Saved lines to {output_file}")

except Exception as e:
    print(f"Error: {e}")
