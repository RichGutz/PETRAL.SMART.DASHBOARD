import os
import openpyxl

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Preformatted
)
from reportlab.pdfgen import canvas

BASE_DIR = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD"
COTIZACIONES_DIR = os.path.join(BASE_DIR, "Cotizaciones")
os.makedirs(COTIZACIONES_DIR, exist_ok=True)

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0F2C59"))
        
        if self._pageNumber > 1:
            self.drawString(54, 750, "DELFOS / PETRAL — PROPUESTA TÉCNICA & ECONÓMICA: VOYAGE LIQUIDATOR")
            self.drawRightString(612 - 54, 750, "MODULO EJECUCIÓN & ANALYTICS")
            self.setStrokeColor(colors.HexColor("#008080"))
            self.setLineWidth(0.75)
            self.line(54, 742, 612 - 54, 742)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(54, 36, "Confidencial — Desarrollado por Geeksoft Tech para Petral & Delfos")
        page_str = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(612 - 54, 36, page_str)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 48, 612 - 54, 48)
        self.restoreState()

def create_pdf_package():
    pdf_path = os.path.join(COTIZACIONES_DIR, "PROPUESTA_Y_ALCANCE_VOYAGE_LIQUIDATOR_DELFOS.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    c_navy = colors.HexColor("#0F2C59")
    c_teal = colors.HexColor("#008080")
    c_gold = colors.HexColor("#D4AF37")
    c_dark = colors.HexColor("#1E293B")
    c_slate = colors.HexColor("#64748B")
    
    title_style = ParagraphStyle(
        'CoverTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=22, leading=26, textColor=c_navy, spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'CoverSub', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=c_teal, spaceAfter=14
    )
    h1_style = ParagraphStyle(
        'Heading1_Custom', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=13, leading=16, textColor=c_navy, spaceBefore=12, spaceAfter=6, keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Heading2_Custom', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=c_teal, spaceBefore=8, spaceAfter=4, keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body_Custom', parent=styles['Normal'],
        fontName='Helvetica', fontSize=9, leading=12.5, textColor=c_dark, spaceAfter=5
    )
    bullet_style = ParagraphStyle(
        'Bullet_Custom', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, leading=11.5, textColor=c_dark, leftIndent=12, firstLineIndent=-8, spaceAfter=3
    )
    table_text = ParagraphStyle(
        'TableText', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8, leading=10, textColor=c_dark
    )
    table_header = ParagraphStyle(
        'TableHeader', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8.5, leading=10, textColor=colors.white, alignment=1
    )
    callout_style = ParagraphStyle(
        'CalloutText', parent=styles['Normal'],
        fontName='Helvetica-Oblique', fontSize=8.5, leading=11.5, textColor=c_navy
    )
    code_style = ParagraphStyle(
        'CodeText', parent=styles['Normal'],
        fontName='Courier', fontSize=6.8, leading=8.5, textColor=colors.HexColor("#0F172A")
    )
    
    story = []
    
    # -------------------------------------------------------------
    # PORTADA / ENCABEZADO EJECUTIVO
    # -------------------------------------------------------------
    story.append(Paragraph("PROPUESTA TÉCNICA, OPERATIVA Y ECONÓMICA", subtitle_style))
    story.append(Paragraph("Módulo Voyage Liquidator, Matriz de Ejecución y Dashboard Comparativo (Presupuesto vs. Real)", title_style))
    story.append(HRFlowable(width="100%", thickness=2, color=c_teal, spaceBefore=2, spaceAfter=10))
    
    meta_data = [
        [Paragraph("<b>Cliente:</b> DELFOS S.A. / PETRAL", table_text), Paragraph("<b>Fecha de Emisión:</b> 10 de Septiembre de 2026", table_text)],
        [Paragraph("<b>Proyecto:</b> PETRAL Smart Dashboard & Analytics", table_text), Paragraph("<b>Versión:</b> 2.0 — Alcance & Memoria Aritmética", table_text)],
        [Paragraph("<b>Proveedor:</b> Geeksoft Tech", table_text), Paragraph("<b>URL Producción:</b> https://forecast.geeksoft.tech", table_text)],
    ]
    meta_table = Table(meta_data, colWidths=[250, 254])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))
    
    # -------------------------------------------------------------
    # SECCIÓN 1: INTRODUCCIÓN Y COMPARATIVA CONCEPTUAL
    # -------------------------------------------------------------
    story.append(Paragraph("1. Visión Ejecutiva: Del Multicotizador al Multi-Liquidador", h1_style))
    intro_p = (
        "El ecosistema comercial de Delfos requiere cerrar el ciclo completo de la gestión naviera: "
        "<b>Planificación Teórica (Antes del Zarpe) $\\rightarrow$ Liquidación Auditada en Caja (Post-Viaje) $\\rightarrow$ Dashboard de Variaciones (Budget vs. Actuals)</b>."
    )
    story.append(Paragraph(intro_p, body_style))
    
    comp_data = [
        [Paragraph("<b>Dimensión</b>", table_header), Paragraph("<b>Multicotizador (Voyage Calculator)</b>", table_header), Paragraph("<b>Multi-Liquidador (Voyage Liquidator)</b>", table_header)],
        [Paragraph("Momento de Uso", table_text), Paragraph("Antes del Zarpe (Tarificación comercial)", table_text), Paragraph("Post-Viaje / Arribo (Cierre financiero)", table_text)],
        [Paragraph("Carga / Tonelaje", table_text), Paragraph("Nominal / Teórico (ej. 14,250 TM)", table_text), Paragraph("Certificado oficial en <b>Bill of Lading (B/L)</b>", table_text)],
        [Paragraph("Consumo Búnker", table_text), Paragraph("Días × Tasa diaria estimada (t/d)", table_text), Paragraph("Diferencia de sondas reales en tanques (<b>ROBs</b>)", table_text)],
        [Paragraph("Eventos Extra", table_text), Paragraph("No contemplados en proforma base", table_text), Paragraph("<b>Shifting</b> (desatraque a bahía), demoras y demurrage", table_text)],
        [Paragraph("Costos Puerto", table_text), Paragraph("Proforma estándar de agencia (<b>PDA</b>)", table_text), Paragraph("Facturación final auditada de agencia (<b>FDA</b>)", table_text)],
        [Paragraph("Resultado P&L", table_text), Paragraph("<b>P&L Teórico / Margen Proforma</b>", table_text), Paragraph("<b>P&L Real en Caja / Margen Auditado</b>", table_text)],
    ]
    comp_table = Table(comp_data, colWidths=[90, 205, 209])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_navy),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 8))
    
    # -------------------------------------------------------------
    # SECCIÓN 2: MEMORIA ARITMÉTICA Y FENÓMENO DE SHIFTING
    # -------------------------------------------------------------
    story.append(Paragraph("2. Memoria Aritmética Operacional y Eventos de Shifting", h1_style))
    story.append(Paragraph("<b>A. Aritmética de Búnker por Sondas (ROBs):</b>", h2_style))
    story.append(Paragraph("$$\\text{Consumo Real IFO} = \\text{ROB Inicial (t)} - \\text{ROB Final (t)} + \\text{Bunker Recibido}$$", body_style))
    story.append(Paragraph("$$\\text{Costo Real Búnker} = (\\text{Consumo IFO} \\times P_{\\text{IFO}}) + (\\text{Consumo MDO} \\times P_{\\text{MDO}})$$", body_style))
    
    story.append(Paragraph("<b>B. El Fenómeno Operativo de Shifting (Desatraque Forzoso):</b>", h2_style))
    story.append(Paragraph("Cuando el buque atraca en muelle y la autoridad portuaria ordena su retiro temporal hacia la bahía por prioridad de otro buque:", body_style))
    story.append(Paragraph("• <b>Compensación Económica ($):</b> Se factura una compensación acordada al fletador/terminal (<code>+ shifting_revenue</code>).", bullet_style))
    story.append(Paragraph("• <b>Tiempo Adicional (Días):</b> Se suman las horas de fondeo en bahía a la duración total del viaje.", bullet_style))
    story.append(Paragraph("• <b>Búnker Extra:</b> Se devenga el consumo adicional de MDO en generadores y maniobras de desatraque/reatraque.", bullet_style))
    story.append(Spacer(1, 6))

    # -------------------------------------------------------------
    # SECCIÓN 3: DASHBOARD COMPARATIVO (5 INDICADORES MACRO)
    # -------------------------------------------------------------
    story.append(Paragraph("3. Dashboard Gráfico Comparativo Macro (Forecast vs. Real)", h1_style))
    story.append(Paragraph("Dado que la flota se redistribuye dinámicamente en el mar según ventanas de atraque, la comparación mensual consolida los <b>5 Indicadores Clave</b>:", body_style))
    
    ind_data = [
        [Paragraph("<b>Indicador Clave</b>", table_header), Paragraph("<b>Métrica de Comparación</b>", table_header), Paragraph("<b>Objetivo de Control Comercial</b>", table_header)],
        [Paragraph("1. Venta Total ($)", table_text), Paragraph("Gross Revenue Forecast vs. Real", table_text), Paragraph("Auditar facturación real vs. presupuesto (Δ%).", table_text)],
        [Paragraph("2. Volumen (TM)", table_text), Paragraph("Carga Teórica vs. Toneladas B/L", table_text), Paragraph("Evaluar cumplimiento de volumen pactado (Δ%).", table_text)],
        [Paragraph("3. P&L Neto ($)", table_text), Paragraph("Margen Proforma vs. P&L Real", table_text), Paragraph("Controlar rentabilidad neta real en caja (Δ%).", table_text)],
        [Paragraph("4. Margen Operativo (%)", table_text), Paragraph("% Margen Teórico vs. % Margen Real", table_text), Paragraph("Medir eficiencia y absorción de costos (Δpp).", table_text)],
        [Paragraph("5. Días Ocupados (d)", table_text), Paragraph("Días Programados vs. Navegados", table_text), Paragraph("Controlar rotación de flota y demoras (Δ días).", table_text)],
    ]
    ind_table = Table(ind_data, colWidths=[120, 170, 214])
    ind_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_teal),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(ind_table)
    story.append(Spacer(1, 8))

    # -------------------------------------------------------------
    # SECCIÓN 4: PAQUETE ENTREGABLE Y PROPUESTA ECONÓMICA
    # -------------------------------------------------------------
    story.append(Paragraph("4. Cronograma y Propuesta Económica Modular", h1_style))
    
    cost_data = [
        [Paragraph("<b>Fase / Entregable</b>", table_header), Paragraph("<b>Duración</b>", table_header), Paragraph("<b>Inversión (USD)</b>", table_header)],
        [Paragraph("Fase 1: Modelo Excel Maestro Clon UI & Estructura BD", table_text), Paragraph("3 Días", table_text), Paragraph("$ 850.00", table_text)],
        [Paragraph("Fase 2: Motor Backend FastAPI (ROBs, Shifting, Liquidations)", table_text), Paragraph("5 Días", table_text), Paragraph("$ 1,450.00", table_text)],
        [Paragraph("Fase 3: Frontend Voyage Liquidator & Matriz de Ejecución", table_text), Paragraph("6 Días", table_text), Paragraph("$ 1,750.00", table_text)],
        [Paragraph("Fase 4: Dashboard Gráfico Comparativo (5 Indicadores Macro)", table_text), Paragraph("4 Días", table_text), Paragraph("$ 1,150.00", table_text)],
        [Paragraph("Fase 5: Super Loop QC E2E, Auditoría y Deploy Producción VPS", table_text), Paragraph("2 Días", table_text), Paragraph("$ 600.00", table_text)],
        [Paragraph("<b>TOTAL INVERSIÓN MODULAR LLAVE EN MANO</b>", table_header), Paragraph("<b>20 Días</b>", table_header), Paragraph("<b>$ 5,800.00</b>", table_header)],
    ]
    cost_table = Table(cost_data, colWidths=[270, 94, 140])
    cost_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_teal),
        ('BACKGROUND', (0,-1), (-1,-1), c_navy),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-2), [colors.white, colors.HexColor("#F8FAFC")]),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,1), (-1,-1), 'CENTER'),
    ]))
    story.append(cost_table)
    story.append(Spacer(1, 10))
    
    callout_data = [[
        Paragraph("<b>Plantilla Excel UI Entregada:</b> Se adjunta en la carpeta <code>Cotizaciones/</code> el archivo <code>Plantilla_Voyage_Liquidator_Master.xlsx</code> con el diseño exacto de la interfaz web y fórmulas vivas de liquidación y comparación macro.", callout_style)
    ]]
    callout_table = Table(callout_data, colWidths=[504])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FEF3C7")),
        ('BOX', (0,0), (-1,-1), 1, c_gold),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(callout_table)
    
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF ejecutivo regenerado con éxito en: {pdf_path}")
    return pdf_path

if __name__ == "__main__":
    create_pdf_package()
