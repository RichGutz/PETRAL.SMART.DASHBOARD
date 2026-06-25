import os
import pytest
from reportlab.lib.pagesizes import letter, landscape
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors
from backend.engine import calculate_voyage_pnl

def test_voyage_ledger_all_combinations():
    vessels = [
        {"name": "B/T TABLONES", "excel_path": "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/Voyage_Calculations_Tablones.xlsx", "speed": 11.0, "intake": 500, "pump": 450, "c_sea_ifo": 14.0, "c_idle_ifo": 3.5, "c_load_ifo": 3.5, "c_disch_ifo": 5.0, "c_sea_mdo": 0.0, "c_idle_mdo": 0.0, "c_load_mdo": 0.0, "c_disch_mdo": 0.0, "tce_req": 15000},
        {"name": "B/T MOQUEGUA", "excel_path": "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/Voyage_Calculations_Moquegua.xlsx", "speed": 12.0, "intake": 500, "pump": 400, "c_sea_ifo": 15.0, "c_idle_ifo": 4.0, "c_load_ifo": 4.0, "c_disch_ifo": 5.5, "c_sea_mdo": 0.0, "c_idle_mdo": 1.0, "c_load_mdo": 1.0, "c_disch_mdo": 1.5, "tce_req": 13000},
        {"name": "M/N CONCON TRADER", "excel_path": "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/Voyage_Calculations_Concon_Trader.xlsx", "speed": 11.0, "intake": 600, "pump": 500, "c_sea_ifo": 14.0, "c_idle_ifo": 3.5, "c_load_ifo": 3.5, "c_disch_ifo": 5.0, "c_sea_mdo": 0.0, "c_idle_mdo": 0.0, "c_load_mdo": 0.0, "c_disch_mdo": 0.0, "tce_req": 20000}
    ]
    
    routes = [
        {"name": "MATARANI", "distance": 69},
        {"name": "SAN JUAN DE MARCONA", "distance": 283},
        {"name": "MEJILLONES", "distance": 335}
    ]

    pdf_path = "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/docs/voyage_ledger_test.pdf"
    c = canvas.Canvas(pdf_path, pagesize=landscape(letter))
    width, height = landscape(letter)

    # PORTADA / GLOSARIO EJECUTIVO
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 50, "Geeksoft P&L Engine - Introducción Ejecutiva al Ledger")
    
    c.setFont("Helvetica", 11)
    text_lines = [
        "Este documento físico actúa como libro blanco de cálculo (Ledger). Su objetivo es hacer 100% transparente",
        "la matemática financiera que hay detrás de las rentabilidades de Naviera Petral. Antes de revisar las cifras",
        "oficiales, te presentamos de forma sencilla las reglas de negocio clave que el sistema evalúa:",
        "",
        "1. Lógica de Tiempos y Cuellos de Botella (La Ley del Triple Mínimo)",
        "   El motor evalúa 3 limitantes para definir la tasa real de flujo (carga/descarga):",
        "   - [c_load / c_disch]: La tasa exigida por el acuerdo o contrato comercial.",
        "   - [t_load_rate / p_disch_limit]: La presión máxima física de las tuberías y bombas de tierra (Terminal).",
        "   - [v_intake / v_pump]: La capacidad física de recepción o empuje a bordo del barco (Fierro).",
        "   El sistema escoge ciegamente el MENOR de los tres, aislando matemáticamente el cuello de botella físico real.",
        "",
        "2. Fricción Ambiental y Consumo de Bunker",
        "   La distancia real de la ruta es expandida por un Factor Climático (ej. 3% o 4%) que simula las corrientes y",
        "   vientos de la costa peruana y chilena. Esto castiga los tiempos de forma realista para cubrir el margen de error del IFO.",
        "",
        "3. Estructura de Rentabilidad Operativa (Voyage Result)",
        "   El margen neto del viaje deduce el 100% de los costos de puerto y el Bunker total consumido.",
        "",
        "4. Indicadores de Desempeño Financiero (TCE & Valor Corporativo)",
        "   - TCE Real (Time Charter Equivalent): Divide el Voyage Result entre los días totales, dictando la renta diaria real.",
        "   - Utilidad Nominal: Al Voyage Result se le resta el [tce_req] (TCE Requerido, ej. $15,000 diarios para el B/T Tablones)",
        "     multiplicado por la duración del viaje.",
        "",
        "En las páginas siguientes se desglosa la prueba inamovible para la matriz completa de flota y rutas de Petral."
    ]
    
    y = height - 90
    for line in text_lines:
        c.drawString(50, y, line)
        y -= 20
        
    c.showPage() # Salto a la primera página de cálculo

    excel_scenarios = [
        # TABLONES
        {"vessel": "B/T TABLONES", "route": "MATARANI", "q": 13500, "f": 19.01, "port": 41000, 
         "tce": 47801.35, "vr": 195033.12, "pcm": 1454116.96, "pl": 133831.98},
        {"vessel": "B/T TABLONES", "route": "SAN JUAN DE MARCONA", "q": 13500, "f": 22.82, "port": 67000, 
         "tce": 34573.37, "vr": 198794.27, "pcm": 1051721.96, "pl": 112545.40},
        {"vessel": "B/T TABLONES", "route": "MEJILLONES", "q": 13500, "f": 20.87, "port": 55000, 
         "tce": 28705.63, "vr": 176702.72, "pcm": 873225.26, "pl": 84367.50},
        
        # MOQUEGUA
        {"vessel": "B/T MOQUEGUA", "route": "MATARANI", "q": 13500, "f": 19.01, "port": 39000, 
         "tce": 48791.86, "vr": 199074.47, "pcm": 1484248.30, "pl": 146033.49},
        {"vessel": "B/T MOQUEGUA", "route": "SAN JUAN DE MARCONA", "q": 13500, "f": 22.82, "port": 62000, 
         "tce": 35927.95, "vr": 206583.00, "pcm": 1092928.29, "pl": 131833.98},
        {"vessel": "B/T MOQUEGUA", "route": "MEJILLONES", "q": 13500, "f": 20.87, "port": 51000, 
         "tce": 29837.97, "vr": 183673.06, "pcm": 907671.11, "pl": 103649.20},

        # CONCON TRADER
        {"vessel": "M/N CONCON TRADER", "route": "MATARANI", "q": 13500, "f": 19.01, "port": 42500, 
         "tce": 47492.77, "vr": 193774.09, "pcm": 1444730.00, "pl": 112172.58},
        {"vessel": "M/N CONCON TRADER", "route": "SAN JUAN DE MARCONA", "q": 13500, "f": 22.82, "port": 84500, 
         "tce": 31701.74, "vr": 182282.62, "pcm": 964367.00, "pl": 67284.13},
        {"vessel": "M/N CONCON TRADER", "route": "MEJILLONES", "q": 13500, "f": 20.87, "port": 95500, 
         "tce": 22316.40, "vr": 137372.68, "pcm": 678864.99, "pl": 14259.04}
    ]

    for v in vessels:
        for r in routes:
            # Encontrar el escenario específico para esta hoja
            scen = next((s for s in excel_scenarios if s["vessel"] == v["name"] and s["route"] == r["name"]), None)
            if not scen: continue

            # Reconstruir inputs inyectando la data REAL de esta hoja del Excel
            inputs = {
                "quantity": scen["q"], "freight_rate": scen["f"], 
                "route_distance": r["distance"], 
                "vessel_speed": v["speed"],
                "weather_factor": 0.03, "port_overhead_hours": 6, 
                "vessel_max_load_intake_limit": v["intake"],
                "max_terminal_load_rate": 500, 
                "vessel_pump_discharge_rate": v["pump"], 
                "port_max_discharge_limit": 300,
                "agency_costs_origin": scen["port"] / 2, # Distribuir la suma en ambos
                "agency_costs_destination": scen["port"] / 2, 
                "bunker_price_ifo": 895.14,
                "bunker_price_mdo": 1460.30,
                "tce_required": v["tce_req"], 
                "bunker_consumption_sea_ifo": v["c_sea_ifo"], 
                "bunker_consumption_idle_ifo": v["c_idle_ifo"],
                "bunker_consumption_load_ifo": v["c_load_ifo"],
                "bunker_consumption_disch_ifo": v["c_disch_ifo"],
                "bunker_consumption_sea_mdo": v["c_sea_mdo"], 
                "bunker_consumption_idle_mdo": v["c_idle_mdo"],
                "bunker_consumption_load_mdo": v["c_load_mdo"],
                "bunker_consumption_disch_mdo": v["c_disch_mdo"],
                "contract_agreed_load_rate": None, "contract_agreed_discharge_rate": None,
                "is_round_trip": True
            }
            
            result = calculate_voyage_pnl(inputs)
            
            # Draw Header
            c.setFont("Helvetica-Bold", 16)
            c.drawString(50, height - 25, "Ledger Matemático - Geeksoft P&L Engine")
            
            c.setFont("Helvetica", 12)
            c.drawString(380, height - 25, f"|  Caso de Prueba: {v['name']}  |  Ruta: ILO - {r['name']} ({r['distance']} NM)")
            
            # Draw vertical line
            c.setLineWidth(1)
            c.line(width/2 + 25, height - 45, width/2 + 25, 255)
            
            # Left Column (Teoría)
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, height - 45, "Fundamento Conceptual y Fórmulas")
            c.setFont("Helvetica", 10)
            
            y = height - 65
            c.drawString(50, y, "1. Tasa Real de Carga (Origen):")
            c.drawString(50, y - 12, "actual_load = MIN(c_load, v_intake, t_load_rate)")
            
            c.drawString(50, y - 32, "2. Tasa Real de Descarga (Destino):")
            c.drawString(50, y - 44, "actual_discharge = MIN(c_disch, v_pump, p_disch_limit)")
            
            c.drawString(50, y - 64, "3. Días de Puerto (port_days):")
            c.drawString(50, y - 76, "port_days = ((Q / act_load) + over) + ((Q / act_disch) + over) / 24")
            
            c.drawString(50, y - 96, "4. Días de Mar (sea_days) [Dinámico]:")
            c.drawString(50, y - 108, "sea_days = ((dist * (is_round_trip ? 2 : 1)) * (1 + w_factor)) / (speed * 24)")
            
            c.drawString(50, y - 128, "5. Costo Total de Bunker (Granular Dual-Fuel):")
            c.drawString(50, y - 140, "bunker = SUM(t_fase * c_fase)_ifo * p_ifo + SUM(t_fase * c_fase)_mdo * p_mdo")
            c.drawString(50, y - 152, "donde fases = sea_days, idle_days, load_days, disch_days")

            c.drawString(50, y - 170, "6. Resultado del Viaje (voyage_result):")
            c.drawString(50, y - 182, "result = (Q * F) - port_costs - bunker")

            c.drawString(50, y - 202, "7. Duración Total (total_duration):")
            c.drawString(50, y - 214, "total_duration = sea_days + port_days")

            c.drawString(50, y - 234, "8. Rendimiento Diario (TCE Real):")
            c.drawString(50, y - 246, "tce_real = voyage_result / total_duration")

            c.drawString(50, y - 266, "9. Utilidad Nominal (pl_vs_required):")
            c.drawString(50, y - 278, "pl_vs_required = voyage_result - (tce_req * total_duration)")
            
            # Right Column (Aplicación)
            c.setFont("Helvetica-Bold", 14)
            c.drawString(width/2 + 45, height - 45, "Reemplazo Aritmético Exacto")
            c.setFont("Helvetica", 10)
            
            c.drawString(width/2 + 45, y, "1. Reemplazo de Carga:")
            c.drawString(width/2 + 45, y - 12, f"MIN(99,999.00, {inputs['vessel_max_load_intake_limit']:,.2f}, {inputs['max_terminal_load_rate']:,.2f}) = {result['actual_load_rate']:,.2f}")
            
            c.drawString(width/2 + 45, y - 32, "2. Reemplazo de Descarga:")
            c.drawString(width/2 + 45, y - 44, f"MIN(99,999.00, {inputs['vessel_pump_discharge_rate']:,.2f}, {inputs['port_max_discharge_limit']:,.2f}) = {result['actual_discharge_rate']:,.2f}")
            
            c.drawString(width/2 + 45, y - 64, "3. Reemplazo de Tiempos en Puerto:")
            c.drawString(width/2 + 45, y - 76, f"(({inputs['quantity']:,.0f}/{result['actual_load_rate']:,.0f})+{inputs['port_overhead_hours']:,.0f} + ({inputs['quantity']:,.0f}/{result['actual_discharge_rate']:,.0f})+{inputs['port_overhead_hours']:,.0f}) / 24 = {result['port_days']:,.6f} d")
            
            c.drawString(width/2 + 45, y - 96, "4. Reemplazo de Tiempos en Mar (Ida y Vuelta):")
            c.drawString(width/2 + 45, y - 108, f"(({inputs['route_distance']:,.2f} * 2) * 1.03) / ({inputs['vessel_speed']:,.2f} * 24) = {result['sea_days']:,.6f} días")

            c.drawString(width/2 + 45, y - 128, "5. Reemplazo Bunker Dual:")
            ifo_cost = result['bunker_ifo_tonnage'] * inputs['bunker_price_ifo']
            mdo_cost = result['bunker_mdo_tonnage'] * inputs['bunker_price_mdo']
            if result['bunker_mdo_tonnage'] > 0:
                c.drawString(width/2 + 45, y - 140, f"(({result['bunker_ifo_tonnage']:,.2f} IFO * ${inputs['bunker_price_ifo']:,.2f}) + ({result['bunker_mdo_tonnage']:,.2f} MDO * ${inputs['bunker_price_mdo']:,.2f})) = ${result['total_bunker_costs']:,.2f}")
            else:
                c.drawString(width/2 + 45, y - 140, f"(({result['bunker_ifo_tonnage']:,.2f} IFO * ${inputs['bunker_price_ifo']:,.2f})) = ${result['total_bunker_costs']:,.2f}")

            total_port_costs = inputs['agency_costs_origin'] + inputs['agency_costs_destination']
            c.drawString(width/2 + 45, y - 170, "6. Reemplazo Resultado de Viaje:")
            c.drawString(width/2 + 45, y - 182, f"({inputs['quantity']:,.2f} * {inputs['freight_rate']:,.2f}) - {total_port_costs:,.2f} - {ifo_cost:,.2f} - {mdo_cost:,.2f} = ${result['voyage_result']:,.2f}")

            c.drawString(width/2 + 45, y - 202, "7. Reemplazo Duración Total:")
            c.drawString(width/2 + 45, y - 214, f"{result['sea_days']:,.6f} + {result['port_days']:,.6f} = {result['total_duration']:,.6f} días")

            c.drawString(width/2 + 45, y - 234, "8. Reemplazo Rendimiento Diario (TCE):")
            c.drawString(width/2 + 45, y - 246, f"${result['voyage_result']:,.2f} / {result['total_duration']:,.6f} = ${result['tce_real']:,.2f} USD/día")

            c.drawString(width/2 + 45, y - 266, "9. Reemplazo Utilidad Nominal:")
            c.drawString(width/2 + 45, y - 278, f"${result['voyage_result']:,.2f} - (${inputs['tce_required']:,.2f} * {result['total_duration']:,.6f}) = ${result['pl_vs_required']:,.2f} USD")

            # Footer (Conciliación) - 3 Tablas Lado a Lado
            c.setLineWidth(1)
            c.line(50, 255, width - 50, 255)

            c.setFont("Helvetica-Bold", 12)
            c.drawString(50, 240, f"MATRIZ DE CONCILIACIÓN: GEEKSOFT ENGINE vs PETRAL CORPORATIVO ({r['name']})")

            # Ingeniería inversa y extracción de Excel
            excel_vr = scen["vr"]
            excel_tce = scen["tce"]
            excel_duration = excel_vr / excel_tce if excel_tce > 0 else 0
            
            excel_sea_days_map = {
                "MATARANI": 0.538409,
                "SAN JUAN DE MARCONA": 2.208258,
                "MEJILLONES": 2.614015
            }
            excel_sea_days = excel_sea_days_map.get(r['name'], 0)
            excel_port_days = excel_duration - excel_sea_days
            excel_net = scen["q"] * scen["f"]
            excel_bunker = excel_net - scen["port"] - excel_vr

            # Helper para color de Delta
            def get_color(excel_val, python_val):
                diff = excel_val - python_val
                if diff > 0.05: return colors.green
                if diff < -0.05: return colors.red
                return colors.black

            # TABLA 1 (Operativo)
            data1 = [
                ["Operativo", "PETRAL", "GEEKSOFT", "Δ"],
                ["Distancia Total (MN)", f"{inputs['route_distance'] * 2:,.2f}", f"{inputs['route_distance'] * 2:,.2f}", "0.00"],
                ["Carga (MT)", f"{scen['q']:,.2f}", f"{inputs['quantity']:,.2f}", f"{inputs['quantity'] - scen['q']:,.2f}"],
                ["Flete (USD)", f"{scen['f']:,.2f}", f"{inputs['freight_rate']:,.2f}", f"{inputs['freight_rate'] - scen['f']:,.2f}"],
                ["Total Freight Income US$", f"{excel_net:,.2f}", f"{result['net_income']:,.2f}", f"{result['net_income'] - excel_net:,.2f}"],
                ["Total Agency US$", f"{scen['port']:,.2f}", f"{total_port_costs:,.2f}", f"{total_port_costs - scen['port']:,.2f}"],
                ["Bunker IFO (MT)", "-", f"{result['bunker_ifo_tonnage']:,.2f}", "-"],
                ["Bunker MDO (MT)", "-", f"{result['bunker_mdo_tonnage']:,.2f}", "-"]
            ]
            t1 = Table(data1, colWidths=[105, 50, 50, 40])
            
            style1 = TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('TEXTCOLOR', (3, 1), (3, 1), get_color(inputs['route_distance'], inputs['route_distance'])),
                ('TEXTCOLOR', (3, 2), (3, 2), get_color(scen['q'], inputs['quantity'])),
                ('TEXTCOLOR', (3, 3), (3, 3), get_color(scen['f'], inputs['freight_rate'])),
                ('TEXTCOLOR', (3, 4), (3, 4), get_color(excel_net, result['net_income'])),
                ('TEXTCOLOR', (3, 5), (3, 5), get_color(scen['port'], total_port_costs)),
                ('TEXTCOLOR', (3, 6), (3, 6), colors.black),
                ('TEXTCOLOR', (3, 7), (3, 7), colors.black)
            ])
            t1.setStyle(style1)

            # TABLA 2 (Costos)
            data2 = [
                ["Tiempos/Costos", "PETRAL", "GEEKSOFT", "Δ"],
                ["Sea Days", f"{excel_sea_days:,.4f}", f"{result['sea_days']:,.4f}", f"{result['sea_days'] - excel_sea_days:,.4f}"],
                ["Port/Idle Days", f"{excel_port_days:,.4f}", f"{result['port_days']:,.4f}", f"{result['port_days'] - excel_port_days:,.4f}"],
                ["Duración", f"{excel_duration:,.4f}", f"{result['total_duration']:,.4f}", f"{result['total_duration'] - excel_duration:,.4f}"],
                ["Bunker Total", f"{excel_bunker:,.2f}", f"{result['total_bunker_costs']:,.2f}", f"{result['total_bunker_costs'] - excel_bunker:,.2f}"],
                [" - IFO (US$)", "-", f"{ifo_cost:,.2f}", "-"],
                [" - MDO (US$)", "-", f"{mdo_cost:,.2f}", "-"]
            ]
            t2 = Table(data2, colWidths=[75, 50, 50, 55])
            
            style2 = TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('TEXTCOLOR', (3, 1), (3, 1), get_color(excel_sea_days, result['sea_days'])),
                ('TEXTCOLOR', (3, 2), (3, 2), get_color(excel_port_days, result['port_days'])),
                ('TEXTCOLOR', (3, 3), (3, 3), get_color(excel_duration, result['total_duration'])),
                ('TEXTCOLOR', (3, 4), (3, 4), get_color(excel_bunker, result['total_bunker_costs'])),
                ('TEXTCOLOR', (3, 5), (3, 5), colors.black),
                ('TEXTCOLOR', (3, 6), (3, 6), colors.black)
            ])
            t2.setStyle(style2)

            # TABLA 3 (Financiero)
            data3 = [
                ["Financiero", "PETRAL", "GEEKSOFT", "Δ"],
                ["Income", f"{excel_net:,.2f}", f"{result['net_income']:,.2f}", f"{result['net_income'] - excel_net:,.2f}"],
                ["Port Costs", f"{scen['port']:,.2f}", f"{total_port_costs:,.2f}", f"{total_port_costs - scen['port']:,.2f}"],
                ["Bunker Costs", f"{excel_bunker:,.2f}", f"{result['total_bunker_costs']:,.2f}", f"{result['total_bunker_costs'] - excel_bunker:,.2f}"],
                ["Voyage Result", f"{excel_vr:,.2f}", f"{result['voyage_result']:,.2f}", f"{result['voyage_result'] - excel_vr:,.2f}"],
                ["TCE (USD/Día)", f"{excel_tce:,.2f}", f"{result['tce_real']:,.2f}", f"{result['tce_real'] - excel_tce:,.2f}"],
                ["PCM (USD)", f"{scen['pcm']:,.2f}", f"{result['pcm_projected']:,.2f}", f"{result['pcm_projected'] - scen['pcm']:,.2f}"],
                ["P/L (USD)", f"{scen['pl']:,.2f}", f"{result['pl_vs_required']:,.2f}", f"{result['pl_vs_required'] - scen['pl']:,.2f}"]
            ]
            t3 = Table(data3, colWidths=[70, 55, 55, 55])
            
            style3 = TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('TEXTCOLOR', (3, 1), (3, 1), get_color(excel_net, result['net_income'])),
                ('TEXTCOLOR', (3, 2), (3, 2), get_color(scen['port'], total_port_costs)),
                ('TEXTCOLOR', (3, 3), (3, 3), get_color(excel_bunker, result['total_bunker_costs'])),
                ('TEXTCOLOR', (3, 4), (3, 4), get_color(excel_vr, result['voyage_result'])),
                ('TEXTCOLOR', (3, 5), (3, 5), get_color(excel_tce, result['tce_real'])),
                ('TEXTCOLOR', (3, 6), (3, 6), get_color(scen['pcm'], result['pcm_projected'])),
                ('TEXTCOLOR', (3, 7), (3, 7), get_color(scen['pl'], result['pl_vs_required']))
            ])
            t3.setStyle(style3)

            # Bajar posición Y (espacio visual extra) y Alinear por Arriba (Top-Align)
            y_top = 230
            
            # Anchos actualizados: Delta más ancho (50)
            t1._argW[3] = 55
            # t2 and t3 widths are set directly in colWidths parameter
            
            w1, h1 = t1.wrapOn(c, width, height)
            w2, h2 = t2.wrapOn(c, width, height)
            w3, h3 = t3.wrapOn(c, width, height)

            # Ajuste de márgenes horizontales dinámico y más estrecho
            spacing = 10
            x1 = 30
            x2 = x1 + w1 + spacing
            x3 = x2 + w2 + spacing
            
            t1.drawOn(c, x1, y_top - h1)
            t2.drawOn(c, x2, y_top - h2)
            t3.drawOn(c, x3, y_top - h3)
            # Semáforo global de convergencia (movido más abajo para que no choque)
            all_match = abs(result['voyage_result'] - excel_vr) < 0.05
            if all_match:
                c.setFillColorRGB(0, 0.5, 0)
                c.setFont("Helvetica-Bold", 11)
                c.drawString(50, 20, "CONVERGENCIA ABSOLUTA - EL MOTOR GEEKSOFT REPLICA EL PETRAL AL 100%")
            else:
                c.setFillColorRGB(0.8, 0, 0)
                c.setFont("Helvetica-Bold", 11)
                c.drawString(50, 20, f"DESVIACIÓN DETECTADA (${abs(result['voyage_result'] - excel_vr):,.2f}) - REVISAR DELTAS EN TABLAS")
            
            # Reset color and add new page
            c.setFillColorRGB(0, 0, 0)
            c.showPage()

    c.save()
    assert os.path.exists(pdf_path)
