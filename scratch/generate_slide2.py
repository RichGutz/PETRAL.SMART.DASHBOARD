from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
import os

doc = SimpleDocTemplate("C:/Users/rguti/PETRAL.SMART.DASHBOARD/scratch/Slide2.pdf", pagesize=A4,
                        rightMargin=30, leftMargin=30,
                        topMargin=30, bottomMargin=30)

styles = getSampleStyleSheet()
title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=20, textColor=HexColor("#0277BD"), spaceAfter=10)
h1_style = ParagraphStyle('H1Style', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=15, textColor=HexColor("#455A64"), spaceBefore=8, spaceAfter=4)
h2_style = ParagraphStyle('H2Style', parent=styles['Heading3'], fontName='Helvetica-Bold', fontSize=13, textColor=HexColor("#C62828"), spaceBefore=6, spaceAfter=2)
normal_style = ParagraphStyle('NormalStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=11, spaceAfter=3, leading=14)
intro_style = ParagraphStyle('IntroStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=11, textColor=HexColor("#37474F"), spaceAfter=5, leading=14)

story = []

story.append(Paragraph("Slide 2: Unit Economics & Cost Allocation", title_style))

story.append(Paragraph("<b>¿Qué son los Unit Economics?</b>", intro_style))
story.append(Paragraph("La economía unitaria es el análisis financiero que te dice si tu modelo de negocio es rentable a nivel de una sola unidad. Es la radiografía que demuestra si ganas o pierdes dinero cada vez que realizas una sola venta, antes de meter a la bolsa los costos fijos globales de la empresa (como el alquiler de una oficina o los sueldos administrativos).", intro_style))
story.append(Paragraph("En Petral, mi opinión es que el UNIT ECONOMICS debe ser el viaje. La razón es que solo con información a nivel viaje, podremos identificar problemas que ocurren en las rutas, ventanas de tiempo, etc. y proponer oportunidades de mejora.", intro_style))

story.append(Paragraph("1. El Core del Problema", h1_style))
story.append(Paragraph("<b>• Modelo Actual (Petral):</b> El Unit Economics se maneja a nivel <b>Buque por Mes</b>. (P&L a nivel Gross por barco).", normal_style))
story.append(Paragraph("<b>• Nuestra Propuesta:</b> Bajar un nivel de granularidad y llevar el Unit Economics a nivel <b>Viaje</b>.", normal_style))
story.append(Paragraph("Tener el P&L por viaje te permite sumar hacia arriba para ver el mes del barco, pero evita que viajes muy rentables escondan u oculten viajes que generaron pérdidas operativas.", normal_style))

story.append(Paragraph("2. El Reto: Cost Allocation (Asignación de Costos)", h1_style))
story.append(Paragraph("<i>Para lograr esta granularidad, debemos definir con los users las reglas de negocio para dividir (allocar) los costos del buque hacia los viajes específicos:</i>", normal_style))

story.append(Paragraph("Pregunta DIFÍCIL: La Llave de Prorrateo (Allocation Driver)", h2_style))
story.append(Paragraph("Para los costos fijos mensuales (ej. comisiones, seguros, arriendos fijos mensuales), ¿cómo los vamos a partir?", normal_style))
story.append(Paragraph("• ¿Los dividimos proporcionalmente a los <b>días</b> que duró cada viaje en el mes?", normal_style))
story.append(Paragraph("• ¿O proporcionalmente a las <b>toneladas</b> que transportó cada viaje?", normal_style))

story.append(Paragraph("Pregunta 2: El 'Tiempo Muerto' (Idle Time)", h2_style))
story.append(Paragraph("¿Qué pasa con el bunker o los días de arriendo que se gastan cuando un barco termina un viaje y se queda anclado o navegando en lastre (vacío) esperando el siguiente contrato?", normal_style))
story.append(Paragraph("• ¿Ese costo de 'espera' se lo cargamos al Viaje que acaba de terminar?", normal_style))
story.append(Paragraph("• ¿Se le carga al Viaje que va a empezar?", normal_style))
story.append(Paragraph("• ¿O se queda en una bolsa separada de 'Costo de Buque No Asignable a Viaje'?", normal_style))

story.append(Paragraph("Pregunta 3: Múltiples Clientes en un viaje", h2_style))
story.append(Paragraph("En caso de COA, ¿Existen escenarios donde un mismo barco en un solo viaje transporte carga para Nexa y para Southern al mismo tiempo?", normal_style))
story.append(Paragraph("• De ser así, el <i>Cost Allocation</i> tendría que bajar un nivel más (de Viaje a Cliente/Contrato).", normal_style))

doc.build(story)
print("Slide 2 generated.")

from PyPDF2 import PdfMerger
merger = PdfMerger()
merger.append("C:/Users/rguti/PETRAL.SMART.DASHBOARD/Documentation/FLUJOGRAMA_Guia_Reunion_V6.pdf")
merger.append("C:/Users/rguti/PETRAL.SMART.DASHBOARD/scratch/Slide2.pdf")

final_output = "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Documentation/PRESENTACION_REUNION_COMPLETA_V5.pdf"
merger.write(final_output)
merger.close()
print(f"Merged successfully to {final_output}")
