import math
import os

# Definición de coordenadas de puertos en el lienzo Callao-Sur (340x440)
ports = {
    'Callao': {'x': 113.7, 'y': 44.6, 'name': 'Callao'},
    'Marcona': {'x': 165.7, 'y': 151.3, 'name': 'Marcona'},
    'Matarani': {'x': 243.7, 'y': 204.3, 'name': 'Matarani'},
    'Ilo': {'x': 263.7, 'y': 225.2, 'name': 'Ilo'},
    'Mejillones': {'x': 289.0, 'y': 399.1, 'name': 'Mejillones'}
}

# Definición de las rutas, colores oficiales y frecuencias
# Se definen los offsets de órbita concéntrica para que las largas rodeen a las cortas por el oeste sin cruzarse
routes = [
    {
        'start': 'Ilo', 'end': 'Matarani', 'color': '#ef4444', 'count': 4, 'name': 'Ilo-Matarani',
        'orbit_offset_x': 30, 'orbit_offset_y': 2    # Órbita 1: Súper pegada a la costa sur (muy corta)
    },
    {
        'start': 'Ilo', 'end': 'Marcona', 'color': '#10b981', 'count': 6, 'name': 'Ilo-Marcona',
        'orbit_offset_x': 80, 'orbit_offset_y': 4    # Órbita 2: Interna sur (corta-mediana)
    },
    {
        'start': 'Callao', 'end': 'Marcona', 'color': '#3b82f6', 'count': 5, 'name': 'Callao-Marcona',
        'orbit_offset_x': 85, 'orbit_offset_y': -5   # Órbita 3: Interna centro (corta-mediana)
    },
    {
        'start': 'Callao', 'end': 'Matarani', 'color': '#8b5cf6', 'count': 4, 'name': 'Callao-Matarani',
        'orbit_offset_x': 200, 'orbit_offset_y': -15  # Órbita 4: Externa centro-sur (larga)
    },
    {
        'start': 'Ilo', 'end': 'Callao', 'color': '#06b6d4', 'count': 5, 'name': 'Ilo-Callao',
        'orbit_offset_x': 290, 'orbit_offset_y': -25 # Órbita 5: Súper externa centro-sur (la más larga, envuelve a todas)
    },
    {
        'start': 'Ilo', 'end': 'Mejillones', 'color': '#f59e0b', 'count': 3, 'name': 'Ilo-Mejillones',
        'orbit_offset_x': 45, 'orbit_offset_y': 15    # Órbita 6: Hacia Chile (Pacífico sur, no se cruza)
    }
]

# Definición de los barcos y sus colores en la leyenda
ships = {
    'Tablones': {'color': '#64748b', 'label': 'T'},
    'Moquegua': {'color': '#3b82f6', 'label': 'M'},
    'Concon T.': {'color': '#06b6d4', 'label': 'CT'},
    'Huemel': {'color': '#f59e0b', 'label': 'H'}
}

# Participación por barco para el gráfico de burbujas (Gross Margin)
bubble_data = [
    {
        'start': 'Callao', 'end': 'Marcona', 'total': 1350000, 
        'shares': {'Tablones': 0.40, 'Moquegua': 0.30, 'Concon T.': 0.20, 'Huemel': 0.10}
    },
    {
        'start': 'Callao', 'end': 'Matarani', 'total': 950000, 
        'shares': {'Tablones': 0.20, 'Moquegua': 0.50, 'Concon T.': 0.30, 'Huemel': 0.0}
    },
    {
        'start': 'Ilo', 'end': 'Mejillones', 'total': 750000, 
        'shares': {'Tablones': 0.0, 'Moquegua': 0.20, 'Concon T.': 0.40, 'Huemel': 0.40}
    },
    {
        'start': 'Ilo', 'end': 'Matarani', 'total': 850000, 
        'shares': {'Tablones': 0.30, 'Moquegua': 0.30, 'Concon T.': 0.20, 'Huemel': 0.20}
    },
    {
        'start': 'Ilo', 'end': 'Marcona', 'total': 1450000, 
        'shares': {'Tablones': 0.50, 'Moquegua': 0.10, 'Concon T.': 0.30, 'Huemel': 0.10}
    },
    {
        'start': 'Ilo', 'end': 'Callao', 'total': 1100000, 
        'shares': {'Tablones': 0.10, 'Moquegua': 0.40, 'Concon T.': 0.30, 'Huemel': 0.20}
    }
]

def make_spaghetti_arcs():
    arcs = []
    for route in routes:
        p1 = ports[route['start']]
        p2 = ports[route['end']]
        x1, y1 = p1['x'], p1['y']
        x2, y2 = p2['x'], p2['y']
        
        # Ordenamos los puntos de norte (menor Y) a sur (mayor Y) para calcular
        # el vector perpendicular al mar de manera consistente
        if y1 > y2:
            x1_norte, y1_norte = x2, y2
            x2_sur, y2_sur = x1, y1
        else:
            x1_norte, y1_norte = x1, y1
            x2_sur, y2_sur = x2, y2
            
        dx = x2_sur - x1_norte
        dy = y2_sur - y1_norte
        dist = math.sqrt(dx*dx + dy*dy)
        if dist == 0:
            continue
            
        # Vector unitario perpendicular apuntando siempre al oeste (mar)
        nx = -dy / dist
        ny = dx / dist
        
        count = route['count']
        color = route['color']
        h_base = route['orbit_offset_x']
        
        # Generar arcos paralelos sutilmente espaciados dentro de la órbita de esta ruta
        for i in range(count):
            if count == 1:
                spread_h = 0
            else:
                # Espaciado de 8.0 píxeles en la dirección perpendicular para contar visualmente con claridad
                spread_h = (i - (count - 1) / 2) * 8.0
                
            h = h_base + spread_h
            
            # Puntos de control norte y sur para formar un semicírculo elegante
            xc_norte = x1_norte + h * nx
            yc_norte = y1_norte + h * ny
            xc_sur = x2_sur + h * nx
            yc_sur = y2_sur + h * ny
            
            # Trazamos la curva Bézier cúbica respetando el orden de la ruta original
            if y1 > y2: # De sur a norte
                d_path = f"M {x1},{y1} C {round(xc_sur,1)},{round(yc_sur,1)} {round(xc_norte,1)},{round(yc_norte,1)} {x2},{y2}"
            else: # De norte a sur
                d_path = f"M {x1},{y1} C {round(xc_norte,1)},{round(yc_norte,1)} {round(xc_sur,1)},{round(yc_sur,1)} {x2},{y2}"
            
            stroke_w = 1.6
            opacity = 0.8
            
            arcs.append(
                f'      <path d="{d_path}" '
                f'fill="none" stroke="{color}" stroke-width="{stroke_w}" stroke-linecap="round" opacity="{opacity}" />'
            )
    return "\n".join(arcs)

def make_pie_sectors(cx, cy, r, shares):
    sectors = []
    start_angle = -math.pi / 2 # Iniciar arriba (-90 grados)
    
    valid_shares = {k: v for k, v in shares.items() if v > 0}
    
    if len(valid_shares) == 1:
        ship_name = list(valid_shares.keys())[0]
        color = ships[ship_name]['color']
        label = ships[ship_name]['label']
        sectors.append(f'        <circle cx="{cx}" cy="{cy}" r="{r}" fill="{color}" />')
        sectors.append(f'        <text x="{cx}" y="{cy + 2.5}" font-family="sans-serif" font-size="7.5" font-weight="bold" fill="#ffffff" text-anchor="middle">{label}</text>')
        return "\n".join(sectors)
        
    for ship_name, share in shares.items():
        if share <= 0:
            continue
        color = ships[ship_name]['color']
        label = ships[ship_name]['label']
        angle_aperture = share * 2 * math.pi
        end_angle = start_angle + angle_aperture
        
        x1 = cx + r * math.cos(start_angle)
        y1 = cy + r * math.sin(start_angle)
        x2 = cx + r * math.cos(end_angle)
        y2 = cy + r * math.sin(end_angle)
        
        large_arc = 1 if angle_aperture > math.pi else 0
        
        path_d = f"M {cx},{cy} L {round(x1, 2)},{round(y1, 2)} A {r},{r} 0 {large_arc},1 {round(x2, 2)},{round(y2, 2)} Z"
        sectors.append(f'        <path d="{path_d}" fill="{color}" stroke="#ffffff" stroke-width="0.7" />')
        
        # Calcular centro angular para posicionar la etiqueta del buque
        mid_angle = start_angle + angle_aperture / 2
        tx = cx + 0.62 * r * math.cos(mid_angle)
        ty = cy + 0.62 * r * math.sin(mid_angle) + 2.5
        
        sectors.append(f'        <text x="{round(tx, 1)}" y="{round(ty, 1)}" font-family="sans-serif" font-size="7.5" font-weight="bold" fill="#ffffff" text-anchor="middle">{label}</text>')
        
        start_angle = end_angle
        
    return "\n".join(sectors)

def generate_html():
    proposal_dir = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Proposal"
    map_paths_file = os.path.join(proposal_dir, "peru_map_paths.xml")
    if not os.path.exists(map_paths_file):
        print(f"Error: {map_paths_file} no existe. Ejecuta generate_vector_map.py primero.")
        return
        
    map_paths = open(map_paths_file, encoding='utf-8').read()
    
    # Generar arcos de espaguetis en el Pacífico
    spaghetti_arcs = make_spaghetti_arcs()
    
    # Generar burbujas gigantes del Bubble Chart
    y_coords = {'Callao': 100, 'Ilo': 300}
    x_coords = {'Callao': 140, 'Marcona': 340, 'Matarani': 540, 'Mejillones': 740}
    
    bubbles = []
    for item in bubble_data:
        cx = x_coords[item['end']] # Llegada en X
        cy = y_coords[item['start']] # Salida en Y
        
        total_val = item['total']
        # Radio proporcional ampliado un 20% adicional (factor acumulado 1.44)
        r = (20 + (total_val / 1450000.0) * 18) * 1.44
        r = round(r, 1)
        
        pie_sectors = make_pie_sectors(cx, cy, r, item['shares'])
        val_k = int(total_val / 1000)
        # Formateo con comas para millares, estilo premium
        val_str = f"${val_k:,}k"
        
        bubbles.append(f'      <!-- Burbuja {item["start"]} -> {item["end"]} -->')
        bubbles.append(f'      <g>')
        bubbles.append(f'        <circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#e2e8f0" stroke-width="2" />')
        bubbles.append(pie_sectors)
        bubbles.append(f'        <circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#ffffff" stroke-width="1.5" />')
        # Colocar Gross Margin FUERA de la burbuja, flotando arriba (con margen de 8px)
        text_y = cy - r - 8
        bubbles.append(f'        <text x="{cx}" y="{text_y}" font-family="sans-serif" font-size="9" font-weight="bold" fill="#0f2c59" text-anchor="middle">{val_str}</text>')
        bubbles.append(f'      </g>')
        
    bubble_svg_content = "\n".join(bubbles)

    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
    @page {{
        size: A4 landscape;
        margin: 5mm 15mm 15mm 15mm;
    }}
    body, p, li, td, th {{
        font-family: 'Arial', sans-serif;
        font-size: 16pt !important;
        line-height: 1.4 !important;
        color: #333;
        background: #fff;
        margin: 0;
        padding: 0;
    }}
    .header-print img {{
        height: 100px !important;
    }}
    .footer-print {{
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        font-size: 10pt;
        color: #555;
        text-align: center;
        border-top: 1px solid #000;
        padding-top: 5px;
        background: white;
        z-index: 100;
    }}
    .header-space {{ height: 28mm; }}
    
    h2 {{
        font-size: 26pt !important;
        font-weight: bold;
        color: #0f2c59;
        margin-top: -10pt !important;
        padding-top: 0pt !important;
        margin-bottom: 5pt !important;
        page-break-before: always;
    }}
    h2:first-of-type {{
        page-break-before: auto;
    }}
    
    table.page-wrapper {{
        width: 100%;
        border-collapse: collapse;
        border: none !important;
        margin: 0;
    }}
    table.page-wrapper > tbody > tr > td {{
        padding: 0;
        vertical-align: top;
        border: none !important;
    }}
    
    .legend-box {{
        background: white;
        padding: 6px 12px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 25px;
        flex-wrap: nowrap;
        white-space: nowrap;
        margin-top: 10px;
    }}
    </style>
</head>
<body>

    <div class="header-print" style="position: fixed; top: 2mm; right: -2mm; left: 0; text-align: right; z-index: 100;">
        <img src="file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Boiler.Plate/PPTS.HERMOSAS/logo_final_v3.png">
    </div>

    <div class="footer-print">
        PROPUESTA COMERCIAL | NAVIERA PETRAL | GEEKSOFT | JUNIO 2026
    </div>

    <table class="page-wrapper">
        <thead><tr><td><div class="header-space"></div></td></tr></thead>
        <tbody><tr><td>

        <!-- SLIDE 1: MAPA DE ESPAGUETI GIGANTE CON PANEL LATERAL DE CONTROL -->
        <h2>Análisis de Tráfico: Spaghetti Map de Rutas</h2>
        <div style="display: flex; justify-content: space-between; align-items: stretch; width: 100%; height: 480px;">
            
            <!-- Columna Izquierda: Mapa base SVG con mayor altura vertical (20% más alto) -->
            <div style="width: 66%; height: 480px; background-color: #f8fafc; padding: 10px; border-radius: 12px; border: 1.5px solid #cbd5e1; display: flex; justify-content: center; align-items: center; box-sizing: border-box;">
                <svg width="620" height="450" viewBox="0 0 340 440" style="overflow: visible;">
                    <defs>
                        <!-- Máscara de corte horizontal (paralelo) al norte de Callao (y=38) -->
                        <clipPath id="map-clip">
                            <rect x="0" y="38" width="340" height="402" />
                        </clipPath>
                    </defs>
                    
                    <!-- Paths de departamentos de Peru recortados estrictamente al norte de Callao -->
                    <g clip-path="url(#map-clip)">
                        {map_paths}
                    </g>
                    
                    <!-- Océano Pacífico de fondo (a la izquierda de la costa) -->
                    <text x="15" y="320" font-family="sans-serif" font-size="11" font-weight="bold" fill="#94a3b8" opacity="0.6">OCEANO PACIFICO</text>
                    
                    <!-- Etiquetas sutiles de países vecinos para contexto geopolítico -->
                    <text x="315" y="325" font-family="sans-serif" font-size="8" font-weight="bold" fill="#94a3b8" opacity="0.5" text-anchor="middle" transform="rotate(-90 315,325)">CHILE</text>
                    <text x="328" y="270" font-family="sans-serif" font-size="8" font-weight="bold" fill="#94a3b8" opacity="0.4" text-anchor="middle">BOLIVIA</text>
                    
                    <!-- Arcos de spaghetti concéntricos ordenados (largas por fuera) -->
                    {spaghetti_arcs}
                    
                    <!-- Dibujar puntos para los puertos con etiquetas -->
                    <!-- Callao -->
                    <circle cx="113.7" cy="44.6" r="5" fill="#0f2c59" stroke="#ffffff" stroke-width="1.5" />
                    <text x="121.7" y="47.6" font-family="sans-serif" font-size="8.5" font-weight="bold" fill="#0f2c59" text-anchor="start">Callao</text>
                    
                    <!-- Marcona -->
                    <circle cx="165.7" cy="151.3" r="5" fill="#0f2c59" stroke="#ffffff" stroke-width="1.5" />
                    <text x="173.7" y="154.3" font-family="sans-serif" font-size="8.5" font-weight="bold" fill="#0f2c59" text-anchor="start">Marcona</text>
                    
                    <!-- Matarani -->
                    <circle cx="243.7" cy="204.3" r="5" fill="#0f2c59" stroke="#ffffff" stroke-width="1.5" />
                    <text x="235.7" y="200.3" font-family="sans-serif" font-size="8.5" font-weight="bold" fill="#0f2c59" text-anchor="end">Matarani</text>
                    
                    <!-- Ilo -->
                    <circle cx="263.7" cy="225.2" r="5" fill="#0f2c59" stroke="#ffffff" stroke-width="1.5" />
                    <text x="271.7" y="228.2" font-family="sans-serif" font-size="8.5" font-weight="bold" fill="#0f2c59" text-anchor="start">Ilo</text>
                    
                    <!-- Mejillones -->
                    <circle cx="289.0" cy="399.1" r="5" fill="#0f2c59" stroke="#ffffff" stroke-width="1.5" />
                    <text x="281.0" y="396.1" font-family="sans-serif" font-size="8.5" font-weight="bold" fill="#0f2c59" text-anchor="end">Mejillones</text>
                </svg>
            </div>
            
            <!-- Columna Derecha: Panel de Control (Filtros interactivos y leyenda lateral) -->
            <div style="width: 32%; height: 480px; background-color: #f8fafc; padding: 15px; border-radius: 12px; border: 1.5px solid #cbd5e1; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
                
                <!-- Sección Filtros (Drop Lists) -->
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <strong style="color: #0f2c59; font-size: 13pt; display: block; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px;">Filtros de Dashboard</strong>
                    
                    <!-- Mes Drop List -->
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <label style="font-size: 8.5pt; font-weight: bold; color: #475569;">Periodo mensual:</label>
                        <select style="padding: 5px; border-radius: 6px; border: 1.5px solid #cbd5e1; font-size: 9.5pt; color: #334155; font-weight: bold; background: white; width: 100%;">
                            <option>Junio 2026 (Proyectado)</option>
                            <option>Mayo 2026 (Real)</option>
                            <option>Abril 2026 (Real)</option>
                        </select>
                    </div>
                    
                    <!-- Buque Drop List -->
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <label style="font-size: 8.5pt; font-weight: bold; color: #475569;">Filtrar por Buque:</label>
                        <select style="padding: 5px; border-radius: 6px; border: 1.5px solid #cbd5e1; font-size: 9.5pt; color: #334155; font-weight: bold; background: white; width: 100%;">
                            <option>🚢 Todos los Buques (Consolidado)</option>
                            <option>Tablones</option>
                            <option>Moquegua</option>
                            <option>Concon Trader</option>
                            <option>Huemel</option>
                        </select>
                    </div>
                    
                    <!-- Ruta Drop List -->
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <label style="font-size: 8.5pt; font-weight: bold; color: #475569;">Filtrar por Ruta:</label>
                        <select style="padding: 5px; border-radius: 6px; border: 1.5px solid #cbd5e1; font-size: 9.5pt; color: #334155; font-weight: bold; background: white; width: 100%;">
                            <option>🎨 Todas las Rutas (Spaghetti completo)</option>
                            <option>Callao - Marcona</option>
                            <option>Callao - Matarani</option>
                            <option>Ilo - Callao</option>
                            <option>Ilo - Matarani</option>
                            <option>Ilo - Marcona</option>
                            <option>Ilo - Mejillones</option>
                        </select>
                    </div>
                </div>
                
                <!-- Sección Leyenda de Rutas -->
                <div style="border-top: 1.5px solid #e2e8f0; padding-top: 10px; display: flex; flex-direction: column; gap: 6px;">
                    <strong style="color: #0f2c59; font-size: 11pt; display: block; margin-bottom: 2px;">Rutas de Viaje</strong>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 8.5pt; color: #475569;">
                        <div style="display: flex; align-items: center; white-space: nowrap;"><div style="width: 12px; height: 12px; background: #3b82f6; margin-right: 8px; border-radius: 3px;"></div> Callao-Marcona</div>
                        <div style="display: flex; align-items: center; white-space: nowrap;"><div style="width: 12px; height: 12px; background: #8b5cf6; margin-right: 8px; border-radius: 3px;"></div> Callao-Matarani</div>
                        <div style="display: flex; align-items: center; white-space: nowrap;"><div style="width: 12px; height: 12px; background: #06b6d4; margin-right: 8px; border-radius: 3px;"></div> Ilo-Callao</div>
                        <div style="display: flex; align-items: center; white-space: nowrap;"><div style="width: 12px; height: 12px; background: #ef4444; margin-right: 8px; border-radius: 3px;"></div> Ilo-Matarani</div>
                        <div style="display: flex; align-items: center; white-space: nowrap;"><div style="width: 12px; height: 12px; background: #10b981; margin-right: 8px; border-radius: 3px;"></div> Ilo-Marcona</div>
                        <div style="display: flex; align-items: center; white-space: nowrap;"><div style="width: 12px; height: 12px; background: #f59e0b; margin-right: 8px; border-radius: 3px;"></div> Ilo-Mejillones</div>
                    </div>
                </div>
                
                <!-- Pie del panel interactivo mockup -->
                <div style="text-align: center; font-size: 7pt; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 4px; margin-top: 2px;">
                    GeekSoft Forecast System | Mockup V2
                </div>
            </div>
        </div>

        <!-- SLIDE 2: BUBBLE CHART GIGANTE A PANTALLA COMPLETA CON PANEL LATERAL -->
        <h2>Estructura de Flota: Participación por Puerto y Ruta</h2>
        <div style="display: flex; justify-content: space-between; align-items: stretch; width: 100%; height: 480px;">
            
            <!-- Columna Izquierda: Gráfico de burbujas más alto -->
            <div style="width: 72%; height: 480px; background-color: #f8fafc; padding: 10px; border-radius: 12px; border: 1.5px solid #cbd5e1; display: flex; justify-content: center; align-items: center; box-sizing: border-box;">
                <svg width="720" height="450" viewBox="0 0 800 450" style="overflow: visible;">
                    <!-- Grid Lines horizontales -->
                    <line x1="80" y1="100" x2="780" y2="100" stroke="#e2e8f0" stroke-width="1.2" stroke-dasharray="4,4" />
                    <line x1="80" y1="300" x2="780" y2="300" stroke="#e2e8f0" stroke-width="1.2" stroke-dasharray="4,4" />
                    
                    <!-- Grid Lines verticales -->
                    <line x1="140" y1="40" x2="140" y2="390" stroke="#e2e8f0" stroke-width="1.2" stroke-dasharray="4,4" />
                    <line x1="340" y1="40" x2="340" y2="390" stroke="#e2e8f0" stroke-width="1.2" stroke-dasharray="4,4" />
                    <line x1="540" y1="40" x2="540" y2="390" stroke="#e2e8f0" stroke-width="1.2" stroke-dasharray="4,4" />
                    <line x1="740" y1="40" x2="740" y2="390" stroke="#e2e8f0" stroke-width="1.2" stroke-dasharray="4,4" />
                    
                    <!-- Eje Y (Salida) -->
                    <line x1="80" y1="40" x2="80" y2="390" stroke="#cbd5e1" stroke-width="2" />
                    <text x="65" y="104" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f2c59" text-anchor="end">Callao</text>
                    <text x="65" y="304" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f2c59" text-anchor="end">Ilo</text>
                    <text x="20" y="215" font-family="sans-serif" font-size="13" font-weight="bold" fill="#475569" transform="rotate(-90 20,215)" text-anchor="middle">Puertos de Salida</text>
                    
                    <!-- Eje X (Llegada) -->
                    <line x1="80" y1="390" x2="780" y2="390" stroke="#cbd5e1" stroke-width="2" />
                    <text x="140" y="408" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f2c59" text-anchor="middle">Callao</text>
                    <text x="340" y="408" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f2c59" text-anchor="middle">Marcona</text>
                    <text x="540" y="408" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f2c59" text-anchor="middle">Matarani</text>
                    <text x="740" y="408" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f2c59" text-anchor="middle">Mejillones</text>
                    <text x="430" y="430" font-family="sans-serif" font-size="13" font-weight="bold" fill="#475569" text-anchor="middle">Puertos de Llegada</text>
                    
                    <!-- Burbujas calculadas con sectores de pastel -->
                    {bubble_svg_content}
                </svg>
            </div>
            
            <!-- Columna Derecha: Panel de Leyenda de Flota y Resumen de Desempeño -->
            <div style="width: 25%; height: 480px; background-color: #f8fafc; padding: 15px; border-radius: 12px; border: 1.5px solid #cbd5e1; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
                
                <!-- KPIs de Resumen -->
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <strong style="color: #0f2c59; font-size: 13pt; display: block; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px;">KPIs de Flota</strong>
                    
                    <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 8pt; font-weight: bold; color: #64748b;">GROSS MARGIN TOTAL:</span>
                        <strong style="font-size: 14pt; color: #10b981;">$6,450,000</strong>
                    </div>
                    
                    <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 8pt; font-weight: bold; color: #64748b;">VIAJES EJECUTADOS:</span>
                        <strong style="font-size: 13pt; color: #0f2c59;">27 Viajes / Mes</strong>
                    </div>
                    
                    <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 8pt; font-weight: bold; color: #64748b;">BUQUE MÁS RENTABLE:</span>
                        <strong style="font-size: 12pt; color: #3b82f6;">Moquegua (42.5%)</strong>
                    </div>
                </div>
                
                <!-- Leyenda de Barcos vertical -->
                <div style="border-top: 1.5px solid #e2e8f0; padding-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                    <strong style="color: #0f2c59; font-size: 11pt; display: block; margin-bottom: 2px;">Distribución de Flota</strong>
                    <div style="display: flex; flex-direction: column; gap: 8px; font-size: 8.5pt; color: #475569;">
                        <div style="display: flex; align-items: center; white-space: nowrap;">
                            <div style="width: 14px; height: 14px; background: #64748b; margin-right: 8px; border-radius: 2px; color: white; display: flex; font-weight: bold; font-size: 6pt; align-items: center; justify-content: center;">T</div> TABLONES
                        </div>
                        <div style="display: flex; align-items: center; white-space: nowrap;">
                            <div style="width: 14px; height: 14px; background: #3b82f6; margin-right: 8px; border-radius: 2px; color: white; display: flex; font-weight: bold; font-size: 6pt; align-items: center; justify-content: center;">M</div> MOQUEGUA
                        </div>
                        <div style="display: flex; align-items: center; white-space: nowrap;">
                            <div style="width: 14px; height: 14px; background: #06b6d4; margin-right: 8px; border-radius: 2px; color: white; display: flex; font-weight: bold; font-size: 5pt; align-items: center; justify-content: center;">CT</div> CONCON T.
                        </div>
                        <div style="display: flex; align-items: center; white-space: nowrap;">
                            <div style="width: 14px; height: 14px; background: #f59e0b; margin-right: 8px; border-radius: 2px; color: white; display: flex; font-weight: bold; font-size: 6pt; align-items: center; justify-content: center;">H</div> HUEMEL
                        </div>
                    </div>
                </div>
                
                <!-- Pie del panel interactivo mockup -->
                <div style="text-align: center; font-size: 7pt; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 4px; margin-top: 2px;">
                    GeekSoft Forecast System | Mockup V2
                </div>
            </div>
        </div>

        </td></tr></tbody>
    </table>

</body>
</html>
"""
    output_html_path = os.path.join(proposal_dir, "PROPOSAL_PETRAL_PPT_V61_slides_nuevos.html")
    with open(output_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"HTML de pruebas V61_slides_nuevos.html generado con exito en: {output_html_path}")

if __name__ == "__main__":
    generate_html()
