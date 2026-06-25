
import json
from pyproj import Transformer

def to_latlon(easting, northing):
    transformer = Transformer.from_crs("epsg:24878", "epsg:4326", always_xy=True)
    lon, lat = transformer.transform(easting, northing)
    return lat, lon

# All coordinates with their IDs
all_coords = {
    1: (8335629.37, 499777.61),
    2: (8335629.38, 502777.57),
    3: (8334629.37, 502777.60),
    4: (8334629.38, 503777.58),
    5: (8333629.37, 503777.61),
    6: (8333629.38, 506777.56),
    7: (8334000.00, 506777.55),
    8: (8334000.00, 506000.00),
    9: (8337000.00, 506000.00),
    10: (8337000.00, 507000.00),
    11: (8336000.00, 507000.00),
    12: (8336000.00, 509000.00),
    13: (8337000.00, 509000.00),
    14: (8337000.00, 510000.00),
    15: (8335000.00, 510000.00),
    16: (8335000.00, 509000.00),
    17: (8334629.39, 509000.00),
    18: (8334629.39, 509777.49),
    19: (8329629.38, 509777.63),
    20: (8329629.39, 513777.57),
    21: (8328629.39, 513777.60),
    22: (8328629.40, 517777.54),
    23: (8332629.41, 517777.42),
    24: (8332629.43, 522777.35),
    25: (8328629.41, 522777.46),
    26: (8328629.40, 518777.52),
    27: (8326629.40, 518777.58),
    28: (8326629.38, 513777.65),
    29: (8325629.38, 513777.68),
    30: (8325629.37, 510777.73),
    31: (8323629.36, 510777.78),
    32: (8323629.36, 507777.83),
    33: (8323805.46, 507777.83),
    34: (8324303.44, 506450.03),
    35: (8324629.36, 506572.25),
    36: (8324629.35, 504777.85),
    37: (8325629.35, 504777.82),
    38: (8325629.35, 503451.73),
    39: (8325452.78, 503385.52),
    40: (8325629.35, 502914.74),
    41: (8325629.35, 502777.85),
    42: (8323629.34, 502777.91),
    43: (8323629.33, 500777.94),
    44: (8320629.32, 500778.02),
    45: (8320629.33, 501778.02),
    46: (8319629.32, 501778.03),
    47: (8319629.33, 503778.01),
    48: (8318629.33, 503778.03),
    49: (8318629.32, 501778.06),
    50: (8317629.32, 501778.09),
    51: (8317629.31, 499778.12),
    52: (8315629.31, 499778.18),
    53: (8315629.30, 498778.19),
    54: (8317629.31, 498778.13),
    55: (8317629.31, 497778.15),
    56: (8319000.00, 497778.11),
    57: (8319000.00, 497000.00),
    58: (8319629.32, 497000.00),
    59: (8319629.31, 496778.11),
    60: (8320629.31, 496778.08),
    61: (8320629.31, 495778.10),
    62: (8322629.32, 495778.04),
    63: (8322629.29, 487778.16),
    64: (8326629.30, 487778.05),
    65: (8326629.31, 489778.02),
    66: (8334629.33, 489777.79),
    67: (8334629.34, 490777.78),
    68: (8336629.34, 490777.72),
    69: (8336629.35, 491777.71),
    70: (8338629.35, 491777.65),
    71: (8338629.36, 492777.63),
    72: (8339629.36, 492777.61),
    73: (8339629.38, 498777.52),
    74: (8338629.37, 498777.54),
    75: (8338629.38, 499777.53),
    76: (8335629.37, 499777.61),  # Island 1 start
    77: (8332629.36, 499777.71),
    78: (8332629.36, 498777.71),
    79: (8335629.37, 498777.63),  # Island 1 end
    80: (8331629.35, 498777.74),  # Island 2 start
    81: (8331629.36, 499777.73),
    82: (8330629.35, 499777.75),
    83: (8330629.35, 498777.77),  # Island 2 end
    84: (8327629.36, 504777.76),  # Back to outer
    85: (8328629.36, 504777.74),  # Island 3 start
    86: (8328629.36, 505777.72),
    87: (8327629.36, 505777.75),
    88: (8327629.36, 504777.76),  # Island 3 end / Island 4 start
    89: (8326629.36, 504777.79),
    90: (8326629.35, 503826.71),
    91: (8327629.36, 504201.70),  # Island 4 end
    92: (8326629.36, 506777.76),  # Back to outer
    93: (8326629.36, 507322.29),
    94: (8325177.47, 506777.80),
}

# Define rings
# Outer ring: 1-75, then connect back to close (76 connects to 2 to close the loop)
outer_ring_ids = list(range(1, 76))  # 1 to 75

# Holes (islands) - 5 total
hole1_ids = [76, 77, 78, 79]  # Island 1
hole2_ids = [80, 81, 82, 83]  # Island 2
hole3_ids = [85, 86, 87, 88]  # Island 3
hole4_ids = [88, 89, 90, 91]  # Island 4 (shares vertex 88 with hole3)
hole5_ids = [92, 93, 94]      # Island 5 (triangle)

def build_ring(ids):
    coords = []
    for vid in ids:
        norte, este = all_coords[vid]
        lat, lon = to_latlon(este, norte)
        coords.append([lon, lat])
    # Close ring
    if coords[0] != coords[-1]:
        coords.append(coords[0])
    return coords

outer_ring = build_ring(outer_ring_ids)
hole1 = build_ring(hole1_ids)
hole2 = build_ring(hole2_ids)
hole3 = build_ring(hole3_ids)
hole4 = build_ring(hole4_ids)
hole5 = build_ring(hole5_ids)

# Build vertex data for labels (all 94 vertices)
vertex_data = []
for vid in range(1, 95):
    norte, este = all_coords[vid]
    lat, lon = to_latlon(este, norte)
    vertex_data.append({
        "id": vid,
        "coords": [lat, lon]
    })

feature = {
    "type": "Feature",
    "properties": {
        "name": "Concesión Marcobre",
        "style": "marcobre"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [
            outer_ring,  # First ring is outer boundary
            hole1,       # Subsequent rings are holes
            hole2,
            hole3,
            hole4,
            hole5
        ]
    }
}

geojson = {
    "type": "FeatureCollection",
    "features": [feature]
}

js_content = f"const MARCOBRE_GEOJSON = {json.dumps(geojson, indent=4)};\n\n"
js_content += f"const MARCOBRE_VERTICES = {json.dumps(vertex_data, indent=4)};"

with open('layer_marcobre.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Generated layer_marcobre.js with outer ring + 5 internal holes (islands)")
print(f"Outer ring: {len(outer_ring_ids)} vertices (1-75)")
print(f"Hole 1 (76-79): {len(hole1_ids)} vertices")
print(f"Hole 2 (80-83): {len(hole2_ids)} vertices")
print(f"Hole 3 (85-88): {len(hole3_ids)} vertices")
print(f"Hole 4 (88-91): {len(hole4_ids)} vertices")
print(f"Hole 5 (92-94): {len(hole5_ids)} vertices")
