import graphviz
import os

def generate_meeting_flowchart():
    base_name = "FLUJOGRAMA_Guia_Reunion_V6"
    output_filename = base_name
    
    print(f"Generando Flujograma Guia Reunion V6: {output_filename}.pdf")
    
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    dot_code = """
    digraph MeetingFlow {
        rankdir=TB;
        splines=ortho;
        nodesep=0.5;
        ranksep=0.8;
        
        # Titulo
        labelloc="t";
        labeljust="l";
        label="Slide 1: Flow Chart Gross Profit PnL";
        fontsize=24;
        fontname="Arial-Bold";
        fontcolor="#0277BD";

        # Forzar una hoja vertical A4
        page="8.27,11.69";
        size="7.5,11";
        ratio="compress";
        
        node [shape=box, style="filled,rounded", fontname="Arial", fontsize=10, margin="0.2,0.1"];
        edge [fontname="Arial", fontsize=9];

        # ==========================================
        #  NIVEL 1: MODALIDAD DE CONTRATACIÓN
        # ==========================================
        Modalidad [label=<
            <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="8">
                <TR><TD BGCOLOR="#ECEFF1" COLSPAN="3"><B>1. MODALIDAD DE CONTRATACIÓN (Bases del Negocio)</B></TD></TR>
                <TR>
                    <TD BGCOLOR="#FFF3E0">Voyage Charter<BR/>(Viaje único)<BR/><FONT COLOR="#C62828"><B>¿Cliente: Nexa?</B></FONT></TD>
                    <TD BGCOLOR="#FFE0B2">Time Charter<BR/>(Alquiler por tiempo)<BR/><FONT COLOR="#C62828"><B>¿Se utiliza?</B></FONT></TD>
                    <TD BGCOLOR="#FFCC80">COA<BR/>(Volumen a largo plazo)<BR/><FONT COLOR="#C62828"><B>¿Cliente: Southern Peru Copper?</B></FONT></TD>
                </TR>
            </TABLE>
        >, shape=none, margin=0];

        # ==========================================
        #  NIVEL 2: DESTINOS Y RUTAS
        # ==========================================
        Rutas [label=<
            <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="8">
                <TR><TD BGCOLOR="#E0F7FA" COLSPAN="3"><B>2. RUTAS TÍPICAS</B></TD></TR>
                <TR>
                    <TD BGCOLOR="#80DEEA">Ruta: Callao -&gt; Mejillones<BR/><FONT COLOR="#C62828"><B>¿Ruta de Nexa?</B></FONT></TD>
                    <TD BGCOLOR="#4DD0E1">Ruta: Matarani -&gt; Mejillones<BR/><FONT COLOR="#C62828"><B>¿Ruta de Southern?</B></FONT></TD>
                    <TD BGCOLOR="#B2EBF2"><B>¿Otras Rutas?</B></TD>
                </TR>
            </TABLE>
        >, shape=none, margin=0];

        # ==========================================
        #  NIVEL 3: FACTURACIÓN / INGRESOS
        # ==========================================
        Ingresos [label=<
            <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="8">
                <TR><TD BGCOLOR="#E1F5FE" COLSPAN="3"><B>3. CONCEPTOS DE FACTURACIÓN (Ingresos)</B></TD></TR>
                <TR>
                    <TD BGCOLOR="#B3E5FC">Facturación Flete<BR/><FONT COLOR="#C62828"><B>¿La facturación es por CADA VIAJE?</B></FONT><BR/><FONT COLOR="#C62828"><B>¿Si es COA cobran por tonelada entregada?</B></FONT></TD>
                    <TD BGCOLOR="#81D4FA">Demoras (Demurrage)<BR/>(Penalidades cobradas)</TD>
                    <TD BGCOLOR="#4FC3F7">Ingresos de Puerto &amp; Otros</TD>
                </TR>
            </TABLE>
        >, shape=none, margin=0];

        # ==========================================
        #  NIVEL 4: EGRESOS
        # ==========================================
        Egresos [label=<
            <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="8">
                <TR><TD BGCOLOR="#F1F8E9" COLSPAN="6"><B>4. EGRESOS (Margen Operación)</B></TD></TR>
                <TR>
                    <TD BGCOLOR="#DCEDC8">Bunker<BR/><FONT COLOR="#C62828"><B>¿Como se determina el</B></FONT><BR/><FONT COLOR="#C62828"><B>combustible gastado por viaje?</B></FONT><BR/><FONT COLOR="#C62828"><B>¿Como se reabastece?</B></FONT></TD>
                    <TD BGCOLOR="#C5E1A5">Costos Portuarios<BR/><FONT COLOR="#C62828"><B>¿Se emiten asociadas al</B></FONT><BR/><FONT COLOR="#C62828"><B>barco pero al voyage?</B></FONT></TD>
                    <TD BGCOLOR="#AED581">Demoras a Naves<BR/>charteadas</TD>
                    <TD BGCOLOR="#A5D6A7">DISPATCH<BR/>(Despacho)</TD>
                    <TD BGCOLOR="#9CCC65">Costo arriendo naves<BR/>charteadas</TD>
                    <TD BGCOLOR="#8BC34A">Comisiones y Seguros<BR/><FONT COLOR="#C62828"><B>¿Por la flota, por el</B></FONT><BR/><FONT COLOR="#C62828"><B>barco, por tiempo?</B></FONT></TD>
                </TR>
            </TABLE>
        >, shape=none, margin=0];

        # --- CONEXIONES LOGICAS (Secuencia lineal vertical) ---
        Modalidad -> Rutas [color="#FF9800", penwidth=3];
        Rutas -> Ingresos [color="#00838F", penwidth=3];
        Ingresos -> Egresos [color="#0277BD", penwidth=3];
    }
    """
    
    try:
        src = graphviz.Source(dot_code)
        output_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = src.render(filename=os.path.join(output_dir, output_filename), format='pdf', view=False, cleanup=True)
        print(f"Generado exitosamente: {os.path.abspath(file_path)}")
        
    except Exception as e:
        print(f"Error generando flujograma: {e}")

if __name__ == "__main__":
    generate_meeting_flowchart()
