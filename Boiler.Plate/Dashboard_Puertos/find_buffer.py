import geopandas as gpd
import fiona.drvsupport
import pandas as pd

# Enable KML driver
fiona.drvsupport.supported_drivers['KML'] = 'rw'
fiona.drvsupport.supported_drivers['LIBKML'] = 'rw'

files = [
    r"C:\Users\rguti\Petral.MARK\Archivos.CAD\Zonas Reservadas\ANP_Nacional_Definitiva.kml",
    r"C:\Users\rguti\Petral.MARK\Archivos.CAD\Zonas Reservadas\ZonasReservadas.shp",
    r"C:\Users\rguti\Petral.MARK\Archivos.CAD\Zonas Reservadas\Reserva_de_biosfera_nacional.shp",
    r"C:\Users\rguti\Petral.MARK\Archivos.CAD\Zonas Reservadas\archive.zip!Reserva_de_biosfera_nacional.kml"
]

print("Searching for 'San Fernando' Buffer Zone / Amortiguamiento...")

for fp in files:
    try:
        print(f"\n--- Checking {fp} ---")
        gdf = gpd.read_file(fp)
        
        # Look for "San Fernando" AND keywords like "Amortiguamiento", "Buffer", "Zona", "Tampon"
        # Or simply check all "San Fernando" entries to see their category
        
        # Filter for San Fernando
        mask = gdf.apply(lambda row: row.astype(str).str.contains('Fernando', case=False).any(), axis=1)
        matches = gdf[mask]
        
        if not matches.empty:
            print(f"  Found {len(matches)} matches for 'Fernando'")
            for idx, row in matches.iterrows():
                print(f"  [Match {idx}]")
                for col in matches.columns:
                    if col != 'geometry':
                        val = str(row[col])
                        print(f"    {col}: {val}")
                        
                # Check for buffer zone indicators
                is_buffer = False
                for col in matches.columns:
                    val = str(row[col]).lower()
                    if 'amortiguamiento' in val or 'tampon' in val or 'buffer' in val:
                        is_buffer = True
                
                if is_buffer:
                    print("    *** POTENTIAL BUFFER ZONE FOUND ***")
                    # Save it immediately
                    gdf.loc[[idx]].to_file("found_buffer.geojson", driver="GeoJSON")
                    print("    Saved to found_buffer.geojson")
        else:
             print("  No 'Fernando' matches found.")

    except Exception as e:
        print(f"  Error reading {fp}: {e}")
