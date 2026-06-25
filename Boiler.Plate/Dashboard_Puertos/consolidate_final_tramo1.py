import os
import re
import math

def get_dist(p1_str, p2_str):
    try:
        c1 = [float(x) for x in p1_str.split(',')]
        c2 = [float(x) for x in p2_str.split(',')]
        # Distancia euclidiana simple (suficiente para detectar saltos)
        return math.sqrt((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2)
    except:
        return 0

def consolidate_kml_intelligent():
    route_path = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\Viaje_Fusionado_con_Pines.REDUCIDO.kml"
    garita_path = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\tramito.garita.kml"
    output_path = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\Tramo1_Final_Consolidado_V2.kml"
    
    # 1. Extraer puntos de Viaje_Fusionado_con_Pines.REDUCIDO.kml
    with open(route_path, "r", encoding="utf-8") as f:
        route_content = f.read()
    
    point_regex = re.compile(r'<Point>.*?<coordinates>(.*?)</coordinates>.*?</Point>', re.DOTALL)
    route_points = point_regex.findall(route_content)
    route_coords = [p.strip() for p in route_points if p.strip()]
    print(f"✅ Se obtuvieron {len(route_coords)} puntos de la ruta principal.")

    # 2. Extraer puntos de tramito.garita.kml
    with open(garita_path, "r", encoding="utf-8") as f:
        garita_content = f.read()
    
    linestring_regex = re.compile(r'<LineString>.*?<coordinates>(.*?)</coordinates>', re.DOTALL)
    garita_match = linestring_regex.search(garita_content)
    
    garita_coords = []
    if garita_match:
        raw_garita = garita_match.group(1).strip()
        garita_coords = [c.strip() for c in re.split(r'\s+', raw_garita) if c.strip()]
        print(f"✅ Se obtuvieron {len(garita_coords)} puntos del tramo garita.")

    # 3. Fusión Inteligente
    # Buscamos el mayor "salto" en route_coords para insertar garita_coords
    max_jump = -1
    insert_idx = -1
    
    for i in range(len(route_coords) - 1):
        d = get_dist(route_coords[i], route_coords[i+1])
        if d > max_jump:
            max_jump = d
            insert_idx = i + 1
            
    print(f"🔍 Detectado salto máximo de {max_jump:.4f} grados en el índice {insert_idx}.")
    
    # Verificamos si los extremos de garita coinciden con el salto
    d_start = get_dist(route_coords[insert_idx-1], garita_coords[0])
    d_end = get_dist(route_coords[insert_idx], garita_coords[-1])
    
    print(f"📏 Distancia unión inicio: {d_start:.4f}, fin: {d_end:.4f}")
    
    # Fusionar insertando en el medio
    final_coords = route_coords[:insert_idx] + garita_coords + route_coords[insert_idx:]
    
    # Limpiar duplicados consecutivos
    cleaned_coords = []
    for c in final_coords:
        if not cleaned_coords or c != cleaned_coords[-1]:
            cleaned_coords.append(c)
    
    print(f"🚀 Total puntos finales: {len(cleaned_coords)}")

    # 4. Generar KML
    kml = []
    kml.append('<?xml version="1.0" encoding="UTF-8"?>')
    kml.append('<kml xmlns="http://www.opengis.net/kml/2.2">')
    kml.append('  <Document>')
    kml.append('    <name>Tramo 1 - Final Fusionado Corregido</name>')
    kml.append('    <Style id="finalRouteStyle">')
    kml.append('      <LineStyle><color>ff0000ff</color><width>6</width></LineStyle>')
    kml.append('    </Style>')

    # Carpeta con los pines
    kml.append('    <Folder><name>Puntos GPS</name>')
    for i, coord in enumerate(cleaned_coords):
        kml.append(f'      <Placemark><name>P{i+1}</name><Point><altitudeMode>absolute</altitudeMode><coordinates>{coord}</coordinates></Point></Placemark>')
    kml.append('    </Folder>')

    # Ruta Unificada
    kml.append('    <Placemark>')
    kml.append('      <name>Ruta Maestra</name>')
    kml.append('      <styleUrl>#finalRouteStyle</styleUrl>')
    kml.append('      <LineString><tessellate>1</tessellate><altitudeMode>absolute</altitudeMode>')
    kml.append(f'        <coordinates>{" ".join(cleaned_coords)}</coordinates>')
    kml.append('      </LineString>')
    kml.append('    </Placemark>')
    kml.append('  </Document></kml>')

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(kml))
    
    print(f"✨ KML CORREGIDO CREADO: {output_path}")

if __name__ == "__main__":
    consolidate_kml_intelligent()
