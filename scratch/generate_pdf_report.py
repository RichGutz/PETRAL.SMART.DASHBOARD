import os
import requests
import json
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# Fetch data from Supabase DB
url = 'https://hjjxooxcpvlvbaxgifbn.supabase.co/rest/v1/voyage_liquidations?select=*&order=vessel_name.asc,voyage_code.asc'
headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc'
}

data = requests.get(url, headers=headers).json()

pdf_filename = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.ETL\Obsidian.ETL\06_QC_MAXIMO_FINAL\Matriz_Resumen_Costos_y_PassThrough_31_Viajes.pdf'
pdf_root = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Matriz_Resumen_Costos_y_PassThrough_31_Viajes.pdf'

doc = SimpleDocTemplate(
    pdf_filename,
    pagesize=landscape(letter),
    rightMargin=0.35 * inch,
    leftMargin=0.35 * inch,
    topMargin=0.35 * inch,
    bottomMargin=0.35 * inch
)

styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle(
    'TitleStyle',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=14,
    leading=16,
    textColor=colors.HexColor('#0F172A'),
    alignment=1, # Center
    spaceAfter=4
)

subtitle_style = ParagraphStyle(
    'SubTitleStyle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=9,
    leading=11,
    textColor=colors.HexColor('#0284C7'),
    alignment=1,
    spaceAfter=8
)

th_style = ParagraphStyle(
    'TH',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=7.5,
    leading=9,
    textColor=colors.white,
    alignment=1
)

td_style = ParagraphStyle(
    'TD',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=7,
    leading=8.5,
    textColor=colors.HexColor('#1E293B')
)

td_bold_style = ParagraphStyle(
    'TDBold',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=7,
    leading=8.5,
    textColor=colors.HexColor('#0F172A')
)

td_green_style = ParagraphStyle(
    'TDGreen',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=7,
    leading=8.5,
    textColor=colors.HexColor('#15803D')
)

elements = []

elements.append(Paragraph("NAVIERA PETRAL S.A. — AUDITORÍA DE LIQUIDACIONES DE VIAJE REALES", title_style))
elements.append(Paragraph("MATRIZ CONSOLIDADA DE COSTOS, INGRESOS Y PASS-THROUGH DOCKAGE (31 VIAJES REALES)", subtitle_style))

table_data = [[
    Paragraph("<b>#</b>", th_style),
    Paragraph("<b>NAVE</b>", th_style),
    Paragraph("<b>VIAJE</b>", th_style),
    Paragraph("<b>CLIENTE</b>", th_style),
    Paragraph("<b>RUTA (POL → POD)</b>", th_style),
    Paragraph("<b>INGRESO TOTAL (I23)</b>", th_style),
    Paragraph("<b>CARGA (POL)</b>", th_style),
    Paragraph("<b>DESCARGA (POD)</b>", th_style),
    Paragraph("<b>TOTAL PUERTO</b>", th_style),
    Paragraph("<b>BÚNKER</b>", th_style),
    Paragraph("<b>PROFIT REAL (P/L)</b>", th_style),
    Paragraph("<b>TCE ($/DÍA)</b>", th_style)
]]

for idx, r in enumerate(data, 1):
    vessel = 'MOQUEGUA' if 'Moquegua' in r['vessel_name'] else 'TABLONES'
    vcode = r['voyage_code']
    client = r['client_name']
    route = f"{r['pol_port']} → {r['pod_port']}"
    gross = r['gross_revenue_usd']
    
    details = r.get('details', {})
    port_exp = details.get('port_expenses', {})
    pol_cost = port_exp.get('pol_cost_usd', 0.0)
    pod_cost = (port_exp.get('pod1_cost_usd', 0.0) + port_exp.get('pod2_cost_usd', 0.0))
    port_cost = port_exp.get('total_agency_usd', 0.0)
    
    bunker_cost = details.get('bunker_expenses', {}).get('total_bunker_cost_usd', 0.0)
    pnl = r['net_profit_usd']
    tce = r['tce_usd_day']
    
    vessel_cell = Paragraph(f"<b>{vessel}</b>", td_bold_style)
    vcode_cell = Paragraph(f"<b>{vcode}</b>", td_bold_style)
    gross_cell = Paragraph(f"${gross:,.2f}", td_bold_style)
    pol_cell = Paragraph(f"${pol_cost:,.2f}", td_style)
    pod_cell = Paragraph(f"${pod_cost:,.2f}", td_style)
    port_cell = Paragraph(f"${port_cost:,.2f}", td_bold_style)
    bunker_cell = Paragraph(f"${bunker_cost:,.2f}", td_style)
    pnl_cell = Paragraph(f"<b>${pnl:,.2f}</b>", td_green_style)
    tce_cell = Paragraph(f"<b>${tce:,.2f}</b>", td_bold_style)
    
    row = [
        Paragraph(str(idx), td_style),
        vessel_cell,
        vcode_cell,
        Paragraph(client, td_style),
        Paragraph(route, td_style),
        gross_cell,
        pol_cell,
        pod_cell,
        port_cell,
        bunker_cell,
        pnl_cell,
        tce_cell
    ]
    table_data.append(row)

col_widths = [0.25*inch, 0.75*inch, 0.95*inch, 0.55*inch, 1.8*inch, 0.95*inch, 0.85*inch, 0.85*inch, 0.85*inch, 0.85*inch, 0.9*inch, 0.85*inch]


t = Table(table_data, colWidths=col_widths, repeatRows=1)

t_style = TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')), # Dark navy header
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#CBD5E1')),
    ('TOPPADDING', (0, 0), (-1, -1), 3),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ('LEFTPADDING', (0, 0), (-1, -1), 3),
    ('RIGHTPADDING', (0, 0), (-1, -1), 3),
])

# Alternating row background colors
for r_idx in range(1, len(table_data)):
    bg_color = colors.HexColor('#F8FAFC') if r_idx % 2 == 1 else colors.white
    t_style.add('BACKGROUND', (0, r_idx), (-1, r_idx), bg_color)

t.setStyle(t_style)
elements.append(t)

doc.build(elements)

# Copy to root as well
import shutil
shutil.copy(pdf_filename, pdf_root)

print("PDF generado con éxito en:")
print("  -", pdf_filename)
print("  -", pdf_root)
