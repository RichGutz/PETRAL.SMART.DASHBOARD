import graphviz
import os
import sys

dot_code = """
digraph Slide2 {
    rankdir=TB;
    size="8.27,11.69!"; 
    ratio="fill";
    node [shape=none, fontname="Arial", margin=0];
    
    Slide2 [label=<
        <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8">
            <TR><TD ALIGN="LEFT"><FONT POINT-SIZE="22" COLOR="#0277BD"><B>Slide 2: Unit Economics &amp; Cost Allocation</B></FONT></TD></TR>
            
            <TR><TD ALIGN="LEFT" BGCOLOR="#ECEFF1"><FONT POINT-SIZE="14"><B>¿Qué son los Unit Economics?</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT" BGCOLOR="#ECEFF1">La economía unitaria es el análisis financiero que te dice si tu modelo de negocio es rentable a nivel<BR/>de una sola unidad. Es la radiografía que demuestra si ganas o pierdes dinero cada vez que realizas<BR/>una sola venta, antes de meter a la bolsa los costos fijos globales de la empresa.</TD></TR>
            <TR><TD ALIGN="LEFT" BGCOLOR="#ECEFF1">En Petral, mi opinion es que el UNIT ECONOMICS debe ser el viaje. La razon es que solo con informacion<BR/>a nivel viaje, podremos identificar problemas que ocurren en las rutas, ventanas de tiempo, etc y<BR/>proponer oportunidades de mejora.</TD></TR>
            
            <TR><TD ALIGN="LEFT"> </TD></TR>
            
            <TR><TD ALIGN="LEFT"><FONT POINT-SIZE="16" COLOR="#455A64"><B>1. El Core del Problema (La Propuesta de Valor)</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">• <B>Modelo Actual (Petral):</B> El Unit Economics se maneja a nivel Buque por Mes (P&amp;L a nivel Gross por barco).</TD></TR>
            <TR><TD ALIGN="LEFT">• <B>Nuestra Propuesta:</B> Bajar un nivel de granularidad y llevar el Unit Economics a nivel Viaje.</TD></TR>
            <TR><TD ALIGN="LEFT">Tener el P&amp;L por viaje te permite sumar hacia arriba para ver el mes del barco, pero evita que viajes<BR/>muy rentables escondan u oculten viajes que generaron pérdidas operativas.</TD></TR>
            
            <TR><TD ALIGN="LEFT"> </TD></TR>
            
            <TR><TD ALIGN="LEFT"><FONT POINT-SIZE="16" COLOR="#455A64"><B>2. El Reto: Cost Allocation (Asignación de Costos)</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">Para lograr esta granularidad, debemos definir con los users las reglas de negocio para dividir (allocar)<BR/>los costos del buque hacia los viajes específicos:</TD></TR>
            
            <TR><TD ALIGN="LEFT"> </TD></TR>
            
            <TR><TD ALIGN="LEFT"><FONT POINT-SIZE="14" COLOR="#C62828"><B>Pregunta DIFICIL: La Llave de Prorrateo (Allocation Driver)</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">Para los costos fijos mensuales (ej. comisiones, seguros, arriendos fijos), ¿cómo los vamos a partir?<BR/>• ¿Los dividimos proporcionalmente a los días que duró cada viaje en el mes?<BR/>• ¿O proporcionalmente a las toneladas que transportó cada viaje?</TD></TR>
            
            <TR><TD ALIGN="LEFT"> </TD></TR>
            
            <TR><TD ALIGN="LEFT"><FONT POINT-SIZE="14" COLOR="#C62828"><B>Pregunta 2: El "Tiempo Muerto" (Idle Time)</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">¿Qué pasa con el bunker o los días de arriendo que se gastan cuando un barco termina un viaje y se queda<BR/>anclado esperando el siguiente contrato?<BR/>• ¿Ese costo de "espera" se lo cargamos al Viaje que acaba de terminar, al que va a empezar, o a la bolsa del buque?</TD></TR>
            
            <TR><TD ALIGN="LEFT"> </TD></TR>
            
            <TR><TD ALIGN="LEFT"><FONT POINT-SIZE="14" COLOR="#C62828"><B>Pregunta 3: Múltiples Clientes en un viaje</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">En caso de COA, ¿Existen escenarios donde un mismo barco en un solo viaje transporte carga para Nexa y Southern?<BR/>• De ser así, el Cost Allocation tendría que bajar un nivel más (de Viaje a Cliente/Contrato).</TD></TR>
        </TABLE>
    >];
}
"""

potential_paths = [
    r"C:\Program Files\Graphviz\bin",
    r"C:\Program Files (x86)\Graphviz\bin",
]
for p in potential_paths:
    if os.path.exists(p) and p not in os.environ["PATH"]:
        os.environ["PATH"] += os.pathsep + p

try:
    src = graphviz.Source(dot_code)
    output_dir = "C:/Users/rguti/PETRAL.SMART.DASHBOARD/scratch"
    file_path = src.render(filename=os.path.join(output_dir, "Slide2_temp"), format='pdf', view=False, cleanup=True)
    print("Slide 2 PDF generated.")
    
    try:
        from PyPDF2 import PdfMerger
    except ImportError:
        os.system("python -m pip install PyPDF2")
        from PyPDF2 import PdfMerger
        
    merger = PdfMerger()
    merger.append("C:/Users/rguti/PETRAL.SMART.DASHBOARD/Documentation/FLUJOGRAMA_Guia_Reunion_V5.pdf")
    merger.append(file_path)
    
    final_output = "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Documentation/PRESENTACION_REUNION_COMPLETA.pdf"
    merger.write(final_output)
    merger.close()
    
    print(f"Merged PDF created successfully at {final_output}")
except Exception as e:
    print(f"Error: {e}")
