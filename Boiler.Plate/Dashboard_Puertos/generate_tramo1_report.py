import os
import re
import math
import requests
import json
import markdown
import subprocess
import matplotlib.pyplot as plt

# --- Paths ---
KML_FILE_1 = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\Tramo1_Final_Consolidado_V2.kml"
KML_FILE_2 = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\Imagenes.Rutas.Viaje\RECORRIDO PETRAL.kml"
OUTPUT_MD = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\Tramo1_Reporte_Coordenadas.md"
OUTPUT_HTML = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\Tramo1_Reporte_Coordenadas.html"
OUTPUT_PDF = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\Tramo1_Reporte_Coordenadas.pdf"
OUTPUT_JS = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\layer_1S_Garita.js"
OUTPUT_PLOT = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\Tramo1_Ruta_Visual.png"
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# --- Constants ---
INTERVAL_M = 500

# --- Helper Functions ---
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def parse_kml_coords(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    # Extraer solo bloques de coordenadas dentro de LineString para evitar pins/puntos aislados
    # Buscamos <LineString>...<coordinates>...</coordinates>...</LineString>
    linestring_matches = re.findall(r'<LineString>.*?<coordinates>(.*?)</coordinates>.*?</LineString>', content, re.DOTALL)
    
    segments = []
    for match in linestring_matches:
        raw_coords = match.strip().split()
        segment = []
        for c in raw_coords:
            parts = c.split(',')
            if len(parts) >= 2:
                # [lon, lat, alt] -> [lat, lon]
                segment.append([float(parts[1]), float(parts[0])])
        if segment:
            segments.append(segment)
    return segments

def get_elevations(coords, batch_size=100):
    elevations = []
    for i in range(0, len(coords), batch_size):
        batch = coords[i:i+batch_size]
        lats = [c[0] for c in batch]
        lons = [c[1] for c in batch]
        url = "https://api.open-meteo.com/v1/elevation"
        params = {"latitude": lats, "longitude": lons}
        try:
            resp = requests.get(url, params=params)
            data = resp.json()
            elevations.extend(data.get('elevation', []))
            print(f"  Fetched {len(batch)} points...")
        except:
            elevations.extend([0] * len(batch))
    return elevations

def generate_report():
    print(f"📖 Cargando rutas...")
    segments1 = parse_kml_coords(KML_FILE_1)
    segments2 = parse_kml_coords(KML_FILE_2)
    
    if not segments1 or not segments2:
        print("❌ Error al cargar coordenadas de los KML (Verificar LineStrings).")
        return

    # Aplanar para búsqueda y procesamiento
    path1_full = [pt for seg in segments1 for pt in seg]
    path2_full = [pt for seg in segments2 for pt in seg]

    # Stitching para Ruta.Franco: Buscar el punto en Path 1 más cercano al INICIO de Path 2
    min_dist = float('inf')
    best_idx1 = -1
    
    print(f"🔄 Buscando punto de unión preciso para Ruta.Franco...")
    search_start = len(path1_full) // 2 
    p2_start = path2_full[0]
    
    for i in range(search_start, len(path1_full)):
        p1 = path1_full[i]
        d = haversine(p1[0], p1[1], p2_start[0], p2_start[1])
        if d < min_dist:
            min_dist = d
            best_idx1 = i

    print(f"📍 Unión encontrada a {min_dist:.2f}m en el índice {best_idx1} de Path 1.")
    
    # 1. Ruta.Franco = Path 1 (hasta union) + Path 2 (completo)
    path_franco = path1_full[:best_idx1] + path2_full
    
    # 2. Ruta 1S.Tranquera.2 = Path 1 completo
    path_tranquera = path1_full

    def interpolate_hitos(path):
        total_dist = 0
        next_mark = 500.0 # INTERVAL_M
        current_path_idx = 1
        last_pt = path[0]
        
        hitos = [{
            "km": 0.0,
            "lat": path[0][0],
            "lon": path[0][1]
        }]

        while current_path_idx < len(path):
            curr_pt = path[current_path_idx]
            d = haversine(last_pt[0], last_pt[1], curr_pt[0], curr_pt[1])
            
            if total_dist + d >= next_mark:
                needed = next_mark - total_dist
                frac = needed / d
                interp_lat = last_pt[0] + (curr_pt[0] - last_pt[0]) * frac
                interp_lon = last_pt[1] + (curr_pt[1] - last_pt[1]) * frac
                
                hitos.append({
                    "km": next_mark / 1000.0,
                    "lat": interp_lat,
                    "lon": interp_lon
                })
                next_mark += 500.0
                last_pt = [interp_lat, interp_lon]
                total_dist += needed
            else:
                total_dist += d
                last_pt = curr_pt
                current_path_idx += 1

        # Asegurar el último punto
        hitos.append({
            "km": total_dist / 1000.0,
            "lat": path[-1][0],
            "lon": path[-1][1]
        })
        return hitos

    print(f"📏 Interpolando hitos para Ruta.Franco...")
    labeled_franco = interpolate_hitos(path_franco)
    
    print(f"📏 Interpolando hitos para Ruta 1S.Tranquera.2...")
    labeled_tranquera = interpolate_hitos(path_tranquera)

    print(f"⛰️ Obteniendo elevaciones...")
    # Franco
    elevs_f = get_elevations([[p['lat'], p['lon']] for p in labeled_franco])
    for i, p in enumerate(labeled_franco):
        p['alt'] = elevs_f[i]
        if i > 0:
            prev = labeled_franco[i-1]
            dist_m = (p['km'] - prev['km']) * 1000
            p['slope'] = ((p['alt'] - prev['alt']) / dist_m * 100) if dist_m > 0 else 0
        else:
            p['slope'] = 0

    # Tranquera
    elevs_t = get_elevations([[p['lat'], p['lon']] for p in labeled_tranquera])
    for i, p in enumerate(labeled_tranquera):
        p['alt'] = elevs_t[i]
        if i > 0:
            prev = labeled_tranquera[i-1]
            dist_m = (p['km'] - prev['km']) * 1000
            p['slope'] = ((p['alt'] - prev['alt']) / dist_m * 100) if dist_m > 0 else 0
        else:
            p['slope'] = 0

    # Generar Markdown (Reporte sigue siendo sobre Franco mayormente)
    md = [
        "# REPORTE TÉCNICO: COORDENADAS RUTA.FRANCO (PROYECTO MARK)",
        "",
        "Este reporte contiene los puntos de control cada 500 metros para la **Ruta.Franco** (Tramo 1 + Recorrido Petral).",
        "",
        "| Punto | KM | Latitud | Longitud | Altitud (m) | Pendiente (%) |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |"
    ]
    
    for i, p in enumerate(labeled_franco):
        name = "INICIO" if i == 0 else (f"FINAL" if i == len(labeled_franco)-1 else f"P{i}")
        md.append(f"| {name} | {p['km']:.2f} | {p['lat']:.6f} | {p['lon']:.6f} | {p['alt']:.1f} | {p['slope']:.2f}% |")

    with open(OUTPUT_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(md))

    # Generar Gráfico de la Ruta
    print("📊 Generando gráfico comparativo...")
    
    plt.figure(figsize=(12, 10))
    
    # 1. Graficar Ruta 1S.Tranquera.2 (Azul completa)
    plt.plot([p[1] for p in path_tranquera], [p[0] for p in path_tranquera], color='#1a73e8', linewidth=2, label='Ruta 1S.Tranquera.2', alpha=0.4)
    
    # 2. Graficar Ruta.Franco (Roja)
    # Reconstruimos la visual por segmentos de la roja para evitar el salto
    # Franco = Path1 (hasta union) + Path2 (completo)
    p1_part = path1_full[:best_idx1 + 1]
    plt.plot([p[1] for p in p1_part], [p[0] for p in p1_part], color='#ea4335', linewidth=3, label='Ruta.Franco (Unión)')
    for i, seg in enumerate(segments2):
        plt.plot([p[1] for p in seg], [p[0] for p in seg], color='#ea4335', linewidth=3)
    
    # 3. Numerar los hitos de Franco (para el reporte)
    for i, p in enumerate(labeled_franco):
        label_text = f"{i}"
        plt.scatter(p['lon'], p['lat'], color='black', s=25, zorder=5)
        plt.annotate(label_text, (p['lon'], p['lat']), textcoords="offset points", xytext=(0,5), ha='center', fontsize=8, fontweight='bold', color='darkred')

    plt.title("REPORTE VISUAL: COMPARATIVA RUTA 1S.TRANQUERA Y RUTA.FRANCO", fontsize=14, fontweight='bold')
    plt.xlabel("Longitud")
    plt.ylabel("Latitud")
    plt.grid(True, linestyle=':', alpha=0.6)
    plt.legend(loc='best', frameon=True, shadow=True)
    plt.axis('equal') 

    plt.savefig(OUTPUT_PLOT, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"🖼️ Gráfico guardado: {OUTPUT_PLOT}")

    # Convertir a HTML y luego PDF
    html_body = markdown.markdown("\n".join(md), extensions=['extra', 'tables'])
    html_body = markdown.markdown("\n".join(md), extensions=['extra', 'tables'])
    
    # Insertar la imagen en el HTML (usando base64 para que el PDF la incluya sin problemas externos)
    import base64
    with open(OUTPUT_PLOT, "rb") as img_file:
        img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
    
    image_html = f'<div style="text-align:center; margin-bottom:30px;"><img src="data:image/png;base64,{img_base64}" style="max-width:100%; border:1px solid #ddd;"></div>'
    
    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }}
            h1 {{ color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }}
            th {{ background-color: #f2f2f2; font-weight: bold; }}
            tr:nth-child(even) {{ background-color: #f9f9f9; }}
            .map-container {{ margin-bottom: 30px; }}
        </style>
    </head>
    <body>
        <h1>REPORTE TÉCNICO: RUTA.FRANCO</h1>
        <div class="map-container">
            {image_html}
        </div>
        {html_body}
    </body>
    </html>
    """
    
    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html_template)

    print("📄 Generando PDF con Edge...")
    cmd = [
        EDGE_PATH, 
        "--headless", 
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={OUTPUT_PDF}", 
        f"file:///{OUTPUT_HTML.replace('\\', '/')}"
    ]
    subprocess.run(cmd, timeout=30)
    
    if os.path.exists(OUTPUT_PDF):
        print(f"✨ PDF CREADO EXITOSAMENTE: {OUTPUT_PDF}")
    else:
        print("❌ Error al generar el PDF.")

    # --- EXPORTAR JS PARA DASHBOARD ---
    print("🌐 Generando Layer JS para el Dashboard...")
    
    def to_js_obj(path, labeled, name_key):
        # LineString
        line_coords = [[p[1], p[0]] for p in path]
        geojson = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"name": name_key},
                "geometry": {"type": "LineString", "coordinates": line_coords}
            }]
        }
        # Points
        points = []
        for p in labeled:
            points.append({
                "name": f"KM {p['km']:.1f}",
                "coords": [p['lat'], p['lon']],
                "alt": round(p['alt'], 1),
                "slope": round(p['slope'], 2),
                "km": round(p['km'], 2)
            })
        return geojson, points

    g_franco, p_franco = to_js_obj(path_franco, labeled_franco, "Ruta.Franco")
    g_trank, p_trank = to_js_obj(path_tranquera, labeled_tranquera, "Ruta 1S.Tranquera.2")

    js_content = f"// Auto-generated Dashboard Layers\n"
    js_content += f"// Ruta.Franco: Tramo 1 + Recorrido Petral\n"
    js_content += f"// Ruta 1S.Tranquera.2: Tramo 1 Original\n\n"
    
    js_content += f"const LAYER_1S_GARITA_GEOJSON = {json.dumps(g_franco, indent=4)};\n"
    js_content += f"const LAYER_1S_GARITA_POINTS = {json.dumps(p_franco, indent=4)};\n\n"
    
    js_content += f"const LAYER_1S_TRANQUERA_2_GEOJSON = {json.dumps(g_trank, indent=4)};\n"
    js_content += f"const LAYER_1S_TRANQUERA_2_POINTS = {json.dumps(p_trank, indent=4)};\n"

    with open(OUTPUT_JS, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"✅ JS Layer generado con ambas rutas: {OUTPUT_JS}")

if __name__ == "__main__":
    generate_report()
