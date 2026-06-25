import json
import re
import os

def generate_svg_map():
    js_path = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Dashboard_Puertos\peru_geo.js"
    if not os.path.exists(js_path):
        print(f"Error: No se encontro peru_geo.js en {js_path}")
        return

    content = open(js_path, encoding='utf-8').read()
    json_match = re.search(r'PERU_GEOJSON\s*=\s*(\{.*\});?', content, re.DOTALL)
    if not json_match:
        json_match = re.search(r'(\{.*\})', content, re.DOTALL)
        if not json_match:
            print("Error: No se pudo extraer el JSON de peru_geo.js")
            return

    geojson_data = json.loads(json_match.group(1))

    # Limites del lienzo SVG (mantenemos proporciones cuadradas/rectangulares de slide)
    svg_w = 340
    svg_h = 440
    
    # NUEVO ENCUADRE: Callao al Sur (recortado Callao al norte, ampliado este/oeste)
    lon_min = -81.5
    lon_max = -68.5
    lat_max = -11.9
    lat_min = -24.0

    lon_range = lon_max - lon_min
    lat_range = lat_min - lat_max

    def project(lon, lat):
        x = (lon - lon_min) / lon_range * svg_w
        y = (lat - lat_max) / lat_range * 390 + 40
        return round(x, 1), round(y, 1)

    svg_paths = []
    svg_paths.append(f'<!-- Mapa vectorial de Peru (Callao al Sur) con fondo claro -->')
    
    # Procesar cada departamento
    for feature in geojson_data['features']:
        name = feature['properties'].get('NOMBDEP', 'Unknown')
        geom = feature['geometry']
        
        # Filtramos departamentos que caen en este rango o los pintamos todos
        # (los que caigan fuera del rango de proyeccion simplemente quedaran recortados por el clip del SVG)
        poly_type = geom['type']
        coords = geom['coordinates']
        
        paths_str = []
        if poly_type == 'Polygon':
            coords_list = [coords]
        else:
            coords_list = coords
            
        for ring_list in coords_list:
            for ring in ring_list:
                points = []
                for pt in ring:
                    px, py = project(pt[0], pt[1])
                    points.append(f"{px},{py}")
                if points:
                    paths_str.append("M " + " L ".join(points) + " Z")
                    
        if paths_str:
            path_d = " ".join(paths_str)
            # Relleno sólido claro (#cbd5e1 / gris) y bordes definidos (#94a3b8 / gris oscuro)
            svg_paths.append(
                f'  <path d="{path_d}" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.8" class="dept-path" data-name="{name}">\n'
                f'    <title>{name}</title>\n'
                f'  </path>'
            )
            
    # Descargar o cargar GeoJSON de Chile para graficar el norte real
    chile_local_path = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Proposal\chile_geo.geojson"
    if not os.path.exists(chile_local_path):
        print("Descargando Chile GeoJSON desde GitHub...")
        import urllib.request
        chile_url = "https://raw.githubusercontent.com/fcortes/Chile-GeoJSON/master/Regional.geojson"
        try:
            urllib.request.urlretrieve(chile_url, chile_local_path)
            print("Descarga exitosa.")
        except Exception as e:
            print(f"Error al descargar Chile GeoJSON: {e}")
            
    if os.path.exists(chile_local_path):
        try:
            chile_data = json.load(open(chile_local_path, encoding='utf-8'))
            print("Procesando regiones del norte de Chile...")
            for feature in chile_data['features']:
                geom = feature['geometry']
                poly_type = geom['type']
                coords = geom['coordinates']
                
                if poly_type == 'Polygon':
                    coords_list = [coords]
                else:
                    coords_list = coords
                    
                # Verificar si alguna coordenada cae en la ventana geográfica de interés
                in_window = False
                for ring_list in coords_list:
                    for ring in ring_list:
                        for pt in ring:
                            lon_pt, lat_pt = pt[0], pt[1]
                            if -81.5 <= lon_pt <= -68.5 and -24.5 <= lat_pt <= -17.5:
                                in_window = True
                                break
                        if in_window:
                            break
                    if in_window:
                        break
                        
                if not in_window:
                    continue # ignorar regiones que están fuera de la ventana
                    
                paths_str = []
                for ring_list in coords_list:
                    for ring in ring_list:
                        points = []
                        for pt in ring:
                            px, py = project(pt[0], pt[1])
                            points.append(f"{px},{py}")
                        if points:
                            paths_str.append("M " + " L ".join(points) + " Z")
                            
                if paths_str:
                    path_d = " ".join(paths_str)
                    name_chile = feature['properties'].get('REGION', feature['properties'].get('NOM_REG', 'Chile'))
                    # Relleno y borde distintivo para Chile (gris medio-oscuro para marcar la diferencia con Perú)
                    svg_paths.append(
                        f'  <path d="{path_d}" fill="#94a3b8" stroke="#64748b" stroke-width="0.8" class="dept-path" data-name="Chile_{name_chile}">\n'
                        f'    <title>Chile: {name_chile}</title>\n'
                        f'  </path>'
                    )
        except Exception as e:
            print(f"Error al procesar Chile GeoJSON: {e}")
            
    output_path = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Proposal\peru_map_paths.xml"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(svg_paths))
    print(f"Mapa vectorial SVG recortado (Callao-Sur) con Chile real generado con exito en: {output_path}")

if __name__ == "__main__":
    generate_svg_map()
