import graphviz
import os

def generate_db_mock_pdf():
    base_name = "ESQUEMA_BD_MOCK_V1"
    output_filename = base_name
    
    print(f"Generando Mock BD: {output_filename}.pdf")
    
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    dot_code = """
    digraph DBMock {
        rankdir=LR;
        nodesep=0.5;
        ranksep=1.0;
        
        node [shape=plaintext, fontname="Arial"];
        edge [fontname="Arial", fontsize=10, color="#546E7A"];

        # TABLA: VIAJES
        viajes [label=<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD COLSPAN="2" BGCOLOR="#0288D1"><FONT COLOR="white"><B>viajes_facturacion</B></FONT></TD></TR>
            <TR><TD PORT="id" BGCOLOR="#E1F5FE"><B>id (UUID)</B></TD><TD BGCOLOR="#E1F5FE">PK</TD></TR>
            <TR><TD>buque</TD><TD>VARCHAR</TD></TR>
            <TR><TD>voy_no</TD><TD>VARCHAR</TD></TR>
            <TR><TD>fecha_bl</TD><TD>DATE</TD></TR>
            <TR><TD>puerto_destino</TD><TD>VARCHAR</TD></TR>
            <TR><TD>cantidad_tm</TD><TD>NUMERIC</TD></TR>
            <TR><TD>monto_flete_total</TD><TD>NUMERIC</TD></TR>
        </TABLE>
        >];

        # TABLA: CONCEPTOS ADICIONALES
        conceptos [label=<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD COLSPAN="2" BGCOLOR="#FF8F00"><FONT COLOR="white"><B>conceptos_adicionales</B></FONT></TD></TR>
            <TR><TD PORT="id" BGCOLOR="#FFF8E1"><B>id (UUID)</B></TD><TD BGCOLOR="#FFF8E1">PK</TD></TR>
            <TR><TD PORT="viaje_id">viaje_id (UUID)</TD><TD>FK</TD></TR>
            <TR><TD>tipo_concepto</TD><TD>VARCHAR</TD></TR>
            <TR><TD>descripcion</TD><TD>VARCHAR</TD></TR>
            <TR><TD>monto_usd</TD><TD>NUMERIC</TD></TR>
        </TABLE>
        >];
        
        # TABLA: CONTROL PRESUPUESTAL
        presupuesto [label=<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
            <TR><TD COLSPAN="2" BGCOLOR="#388E3C"><FONT COLOR="white"><B>control_presupuestal</B></FONT></TD></TR>
            <TR><TD PORT="id" BGCOLOR="#E8F5E9"><B>id (UUID)</B></TD><TD BGCOLOR="#E8F5E9">PK</TD></TR>
            <TR><TD>buque</TD><TD>VARCHAR</TD></TR>
            <TR><TD>anio</TD><TD>INT</TD></TR>
            <TR><TD>mes</TD><TD>INT</TD></TR>
            <TR><TD>cuenta_contable</TD><TD>VARCHAR</TD></TR>
            <TR><TD>monto_real</TD><TD>NUMERIC</TD></TR>
            <TR><TD>monto_presupuesto</TD><TD>NUMERIC</TD></TR>
        </TABLE>
        >];

        # Relaciones (Foreign Keys)
        viajes:id -> conceptos:viaje_id [label=" 1 : N", dir=back, arrowtail=crow, arrowhead=none];
    }
    """
    
    try:
        src = graphviz.Source(dot_code)
        output_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = src.render(filename=os.path.join(output_dir, output_filename), format='pdf', view=False, cleanup=True)
        print(f"Generado exitosamente: {os.path.abspath(file_path)}")
        
    except Exception as e:
        print(f"Error generando diagrama BD: {e}")

if __name__ == "__main__":
    generate_db_mock_pdf()
