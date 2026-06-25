
import json

def dms_to_dd(degrees, minutes, seconds, direction):
    dd = float(degrees) + float(minutes)/60 + float(seconds)/(3600)
    if direction == 'S' or direction == 'W':
        dd *= -1
    return dd

# Data from user image
# Área Acuática
acuatica_raw = [
    ("15", "11", "46.440", "S", "075", "15", "12.011", "W"), # A
    ("15", "11", "36.833", "S", "075", "15", "21.058", "W"), # B
    ("15", "11", "25.850", "S", "075", "15", "08.692", "W"), # C
    ("15", "11", "30.654", "S", "075", "15", "04.168", "W"), # D
    ("15", "11", "21.360", "S", "075", "14", "53.703", "W"), # E
    ("15", "11", "22.648", "S", "075", "14", "52.490", "W"), # F
    ("15", "11", "24.339", "S", "075", "14", "50.670", "W"), # G
    ("15", "11", "25.749", "S", "075", "14", "49.792", "W"), # H
    ("15", "11", "26.355", "S", "075", "14", "49.804", "W"), # I
    ("15", "11", "26.365", "S", "075", "14", "49.406", "W"), # J
]

# Área Ribereña
riberena_raw = [
    ("15", "11", "26.365", "S", "075", "14", "49.406", "W"), # J
    ("15", "11", "26.355", "S", "075", "14", "49.804", "W"), # I
    ("15", "11", "25.749", "S", "075", "14", "49.792", "W"), # H
    ("15", "11", "24.339", "S", "075", "14", "50.670", "W"), # G
    ("15", "11", "22.648", "S", "075", "14", "52.490", "W"), # F
    ("15", "11", "21.360", "S", "075", "14", "53.703", "W"), # E
    ("15", "11", "20.262", "S", "075", "14", "52.466", "W"), # K
    ("15", "11", "21.550", "S", "075", "14", "51.253", "W"), # L
    ("15", "11", "23.240", "S", "075", "14", "49.433", "W"), # M
    ("15", "11", "24.651", "S", "075", "14", "48.556", "W"), # N
    ("15", "11", "25.257", "S", "075", "14", "48.567", "W"), # O
    ("15", "11", "25.267", "S", "075", "14", "48.170", "W"), # P
]

def process_coords(raw_data):
    coords = []
    for lat_d, lat_m, lat_s, lat_dir, lon_d, lon_m, lon_s, lon_dir in raw_data:
        lat = dms_to_dd(lat_d, lat_m, lat_s, lat_dir)
        lon = dms_to_dd(lon_d, lon_m, lon_s, lon_dir)
        coords.append([lon, lat]) # GeoJSON is [lon, lat]
    
    # Close polygon if needed, but Leaflet usually handles simple polygons well. 
    # Standard is to close it.
    if coords[0] != coords[-1]:
        coords.append(coords[0])
        
    return coords

acuatica_coords = process_coords(acuatica_raw)
riberena_coords = process_coords(riberena_raw)

print("Area Acuatica Coords:")
print(json.dumps(acuatica_coords))
print("\nArea Riberena Coords:")
print(json.dumps(riberena_coords))
