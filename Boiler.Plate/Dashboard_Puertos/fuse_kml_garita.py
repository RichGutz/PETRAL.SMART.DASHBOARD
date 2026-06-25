import os
import re

def fuse_kml_with_pins():
    input_path = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\Tramo_1_Oeste_Corregido.REDUCIDO.RG.MAS.TRAMO.GARITA.kml"
    output_path = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\Viaje_Fusionado_Garita_con_Pines.kml"
    
    if not os.path.exists(input_path):
        print(f"❌ Error: No se encuentra {input_path}")
        return

    print(f"📖 Leyendo {input_path}...")
    with open(input_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Extraer puntos de la carpeta "Puntos GPS" (Punto por punto)
    gps_coords = []
    point_regex = re.compile(r'<Point>.*?<coordinates>(.*?)</coordinates>.*?</Point>', re.DOTALL)
    all_points = point_regex.findall(content)
    
    for p in all_points:
        p = p.strip()
        if not p: continue
        try:
            lon = float(p.split(',')[0])
            if lon < -76: continue # Filtrar Lima
            gps_coords.append(p)
        except:
            continue

    # 2. Extraer coordenadas del LineString de la garita
    linestring_regex = re.compile(r'<Placemark id="0EC453AF7C3E1D18425E">.*?<LineString>.*?<coordinates>(.*?)</coordinates>', re.DOTALL)
    garita_match = linestring_regex.search(content)
    
    garita_coords = []
    if garita_match:
        raw_garita = garita_match.group(1).strip()
        garita_coords = [c.strip() for c in re.split(r'\s+', raw_garita) if c.strip()]

    # 3. Fusionar todo
    final_coords = gps_coords + garita_coords
    print(f"🚀 Procesando {len(final_coords)} puntos totales con pines.")

    # 4. Crear KML Final
    kml_final = []
    kml_final.append('<?xml version="1.0" encoding="UTF-8"?>')
    kml_final.append('<kml xmlns="http://www.opengis.net/kml/2.2">')
    kml_final.append('  <Document>')
    kml_final.append('    <name>Viaje_Fusionado_con_Pines</name>')
    
    # Estilos
    kml_final.append('    <Style id="routeStyle">')
    kml_final.append('      <LineStyle><color>ff0000ff</color><width>5</width></LineStyle>')
    kml_final.append('    </Style>')

    # Carpeta con los pines (para borrado fácil)
    kml_final.append('    <Folder>')
    kml_final.append('      <name>Puntos de Control (Pines)</name>')
    for i, coord in enumerate(final_coords):
        kml_final.append('      <Placemark>')
        kml_final.append(f'        <name>Punto {i+1}</name>')
        kml_final.append('        <Point>')
        kml_final.append('          <altitudeMode>absolute</altitudeMode>')
        kml_final.append(f'          <coordinates>{coord}</coordinates>')
        kml_final.append('        </Point>')
        kml_final.append('      </Placemark>')
    kml_final.append('    </Folder>')

    # La línea continua fusionada
    kml_final.append('    <Placemark>')
    kml_final.append('      <name>Ruta Unificada</name>')
    kml_final.append('      <styleUrl>#routeStyle</styleUrl>')
    kml_final.append('      <LineString>')
    kml_final.append('        <tessellate>1</tessellate>')
    kml_final.append('        <altitudeMode>absolute</altitudeMode>')
    kml_final.append(f'        <coordinates>{" ".join(final_coords)}</coordinates>')
    kml_final.append('      </LineString>')
    kml_final.append('    </Placemark>')

    kml_final.append('  </Document>')
    kml_final.append('</kml>')

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(kml_final))
    
    print(f"✨ KML CON PINES CREADO: {output_path}")

if __name__ == "__main__":
    fuse_kml_with_pins()
