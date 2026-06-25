
import zipfile
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom import minidom

# Shougang coordinates (from shougang_polygon.js)
# Outer ring: vertices 1-15
outer_coords = [
    [-15.310100, -74.956170],  # 1
    [-15.400447, -75.117497],  # 2
    [-15.343915, -75.151088],  # 3
    [-15.343921, -75.141812],  # 4
    [-15.325839, -75.141801],  # 5
    [-15.325833, -75.151117],  # 6
    [-15.343847, -75.151129],  # 7
    [-15.165533, -75.256948],  # 8
    [-15.075283, -75.095742],  # 9
    [-15.090799, -75.086531],  # 10
    [-15.090796, -75.095123],  # 11
    [-15.136002, -75.095142],  # 12
    [-15.135993, -75.113757],  # 13
    [-15.172158, -75.113775],  # 14
    [-15.172183, -75.038190],  # 15
]

# Hole 1: vertices 16-22
hole1_coords = [
    [-15.248961, -75.182890],  # 16
    [-15.248963, -75.180186],  # 17
    [-15.248068, -75.179000],  # 18
    [-15.243292, -75.178996],  # 19
    [-15.242489, -75.179640],  # 20
    [-15.235580, -75.185173],  # 21
    [-15.239548, -75.190437],  # 22
]

# Hole 2: vertices 23-26
hole2_coords = [
    [-15.304581, -75.124860],  # 23
    [-15.288137, -75.080106],  # 24
    [-15.323540, -75.079163],  # 25
    [-15.339076, -75.109395],  # 26
]

def coords_to_kml_string(coords):
    """Convert list of [lat, lon] to KML coordinate string (lon,lat,0)"""
    kml_coords = []
    for lat, lon in coords:
        kml_coords.append(f"{lon},{lat},0")
    # Close the ring
    if coords[0] != coords[-1]:
        kml_coords.append(f"{coords[0][1]},{coords[0][0]},0")
    return " ".join(kml_coords)

# Create KML structure
kml = Element('kml', xmlns='http://www.opengis.net/kml/2.2')
document = SubElement(kml, 'Document')
SubElement(document, 'name').text = 'Concesión Shougang'

# Style
style = SubElement(document, 'Style', id='shougangStyle')
line_style = SubElement(style, 'LineStyle')
SubElement(line_style, 'color').text = 'ff2dc0fb'  # Blue
SubElement(line_style, 'width').text = '3'
poly_style = SubElement(style, 'PolyStyle')
SubElement(poly_style, 'color').text = '404a90e2'  # Semi-transparent blue
SubElement(poly_style, 'fill').text = '1'
SubElement(poly_style, 'outline').text = '1'

# Placemark
placemark = SubElement(document, 'Placemark')
SubElement(placemark, 'name').text = 'Concesión Shougang'
SubElement(placemark, 'styleUrl').text = '#shougangStyle'

# Polygon with outer boundary and holes
polygon = SubElement(placemark, 'Polygon')
SubElement(polygon, 'extrude').text = '0'
SubElement(polygon, 'altitudeMode').text = 'clampToGround'

# Outer boundary
outer_boundary = SubElement(polygon, 'outerBoundaryIs')
outer_ring = SubElement(outer_boundary, 'LinearRing')
SubElement(outer_ring, 'coordinates').text = coords_to_kml_string(outer_coords)

# Inner boundaries (holes)
for hole_coords in [hole1_coords, hole2_coords]:
    inner_boundary = SubElement(polygon, 'innerBoundaryIs')
    inner_ring = SubElement(inner_boundary, 'LinearRing')
    SubElement(inner_ring, 'coordinates').text = coords_to_kml_string(hole_coords)

# Pretty print XML
xml_str = minidom.parseString(tostring(kml)).toprettyxml(indent="  ")

# Write KML file
kml_filename = 'shougang_polygon.kml'
with open(kml_filename, 'w', encoding='utf-8') as f:
    f.write(xml_str)

# Create KMZ (zipped KML)
kmz_filename = 'Concesion_Shougang.kmz'
with zipfile.ZipFile(kmz_filename, 'w', zipfile.ZIP_DEFLATED) as kmz:
    kmz.write(kml_filename, 'doc.kml')

print(f"Generated {kmz_filename}")
print(f"Outer ring: {len(outer_coords)} vertices")
print(f"Hole 1: {len(hole1_coords)} vertices")
print(f"Hole 2: {len(hole2_coords)} vertices")
