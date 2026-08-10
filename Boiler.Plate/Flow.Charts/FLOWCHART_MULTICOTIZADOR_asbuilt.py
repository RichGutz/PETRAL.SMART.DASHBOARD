import graphviz
import os
import subprocess
import shutil

def generate():
    base_name = "FLOWCHART_MULTICOTIZADOR_asbuilt"
    GRAPHVIZ_BIN = r"C:\Program Files\Graphviz\bin"
    if GRAPHVIZ_BIN not in os.environ.get("PATH", ""):
        os.environ["PATH"] = GRAPHVIZ_BIN + os.pathsep + os.environ.get("PATH", "")

    dot_code = """
    digraph MultiCotizadorASBUILT {
        rankdir=TB;
        splines=ortho;
        nodesep=1.8;
        ranksep=3.5;
        dpi=300;
        newrank=true;

        node [shape=box, style="filled", fontname="Arial Bold", fontsize=22, height=1.3, margin="0.5,0.4"];
        edge [fontname="Arial Bold", fontsize=16, penwidth=2.5];

        # ==========================================
        #  PASO 1: SELECCIÓN DE CLIENTE Y FILTROS
        # ==========================================
        subgraph cluster_paso1 {
            label = "PASO 1: SELECCIÓN DE CLIENTE Y FILTROS DE MERCADO";
            style="filled"; fillcolor="#EFF6FF"; color="#2563EB"; fontcolor="#1E3A5F";
            fontname="Arial Bold"; fontsize=26;

            { rank=same;
                FilterFiltros [label="🎛️ FILTRO CLIENTE\\n(Toggle Activos / Prospectos)", fillcolor="#DBEAFE", shape=parallelogram];
                SelectCliente [label="👤 CLIENTE COMERCIAL\\n(Selección desde Maestro de Clientes)", fillcolor="#DBEAFE", shape=parallelogram];
            }
            FilterFiltros -> SelectCliente [style=invis, weight=50];
        }

        # ==========================================
        #  PASO 2: SELECCIÓN DE BUQUE Y FACT SHEET
        # ==========================================
        subgraph cluster_paso2 {
            label = "PASO 2: SELECCIÓN DE BUQUE Y FACT SHEET TÉCNICO";
            style="filled,dashed"; fillcolor="#F0FDF4"; color="#16A34A"; fontcolor="#14532D";
            fontname="Arial Bold"; fontsize=26;

            { rank=same;
                HeaderVessel [label="🚢 HEADER DINÁMICO\\n(VESSEL: [NOMBRE | SELECCIONAR])", fillcolor="#DCFCE7", fontsize=20];
                PhotoVessel  [label="🖼️ MINIATURA BUQUE\\n(Imagen pura bg-white object-contain)", fillcolor="#DCFCE7", fontsize=20];
                ParamsVessel [label="⚙️ ESPECIFICACIONES\\n(DWT, DWCC, Velocidad, TCE Requerido)", fillcolor="#DCFCE7", fontsize=20];
            }
            HeaderVessel -> PhotoVessel -> ParamsVessel [style=invis, weight=50];
        }

        # ==========================================
        #  PASO 3: BÚNKER Y COMISIONES COMERCIALES
        # ==========================================
        subgraph cluster_paso3 {
            label = "PASO 3: COTIZACIÓN DE BÚNKER Y REGLAS COMERCIALES";
            style="filled,dashed"; fillcolor="#FFFBEB"; color="#D97706"; fontcolor="#78350F";
            fontname="Arial Bold"; fontsize=26;

            { rank=same;
                PreciosBunker [label="⛽ PRECIOS COMBUSTIBLE\\n(IFO Heavy Fuel + MDO / MGO Homologado)", fillcolor="#FEF3C7", shape=component];
                CommRules     [label="💼 COMISIONES VIAJE\\n(Address Comm % + Broker Comm %)", fillcolor="#FEF3C7", shape=component];
            }
            PreciosBunker -> CommRules [style=invis, weight=30];
        }

        # ==========================================
        #  PASO 4: CONFIGURACIÓN MULTILEG & TRAMOS REJILLA
        # ==========================================
        subgraph cluster_paso4 {
            label = "PASO 4: REJILLA DE ROTACIÓN DE PUERTOS Y TRAMOS (PORT ROTATION)";
            style="filled,dashed"; fillcolor="#F3E8FF"; color="#9333EA"; fontcolor="#3B0764";
            fontname="Arial Bold"; fontsize=26;

            { rank=same;
                LegControl [label="➕ / ➖ BOTONES CABECERA LEG\\n(Agregar +Azul / Eliminar -Rojo Tramos)", fillcolor="#E9D5FF", shape=box, fontsize=19];
                TramoData  [label="🗺️ CONFIGURACIÓN DE TRAMO\\n(Origen, Destino, Dist NM, W.F %, Vel kn, Tipo LADEN/BALLAST)", fillcolor="#E9D5FF", shape=box, fontsize=19];
                PuertoOps  [label="⚓ OPERACIONES EN PUERTO\\n(NONE, CARGAR, DESCARGAR, Ritmo T/d-T/h, Overhead h, Posic h)", fillcolor="#E9D5FF", shape=box, fontsize=19];
                FormatoNum [label="🔢 FORMATO SEPARADOR MILES\\n(Carga Q MT: 25,000 | Costo Pto: $15,400)", fillcolor="#E9D5FF", shape=box, fontsize=19];
            }
            LegControl -> TramoData -> PuertoOps -> FormatoNum [style=invis, weight=30];
        }

        # ==========================================
        #  PASO 5: MOTOR DE CÁLCULO P&L FINANCIERO
        # ==========================================
        subgraph cluster_paso5 {
            label = "PASO 5: MOTOR DE CÁLCULO CONSOLIDADO Y VOYAGE P&L";
            style="filled,dashed"; fillcolor="#CCFBF1"; color="#0D9488"; fontcolor="#042F2E";
            fontname="Arial Bold"; fontsize=26;

            PLCalculo [label="📊 VOYAGE P&L RESULT\\nUtilidad Nominal = Fletes − Bunker − Costos Puerto − Comisiones\\nTCE Realizado vs TCE Requerido (Diferencia +/-)", shape=doubleoctagon, fillcolor="#99F6E4", penwidth=3.0, fontsize=22];
        }

        # ==========================================
        #  PASO 6: BARRA DE ACCIONES Y PERSISTENCIA (100% ANCHO)
        # ==========================================
        subgraph cluster_paso6 {
            label = "PASO 6: BARRA UNIFICADA DE ACCIONES Y PERSISTENCIA (100% RIBBON)";
            style="filled,dashed"; fillcolor="#FFF7ED"; color="#F97316"; fontcolor="#431407";
            fontname="Arial Bold"; fontsize=26;

            { rank=same;
                BtnGrabar  [label="💾 GRABAR COTIZACIÓN\\n(Guardado en DB / Rutas Cotizadas)", fillcolor="#FED7AA", shape=cds, penwidth=2.5, fontsize=19];
                BtnMatrix  [label="📊 EXPORTAR A MATRIX\\n(Transferencia a Matriz Financiera)", fillcolor="#FED7AA", shape=cds, penwidth=2.5, fontsize=19];
                BtnExport  [label="🖨️ EXPORT PDF\\n(Informe de Cotización Formal)", fillcolor="#FED7AA", shape=cds, penwidth=2.5, fontsize=19];
            }
            BtnGrabar -> BtnMatrix -> BtnExport [style=invis, weight=30];
        }

        # --- COLUMNA VERTEBRAL INVISIBLE ---
        SelectCliente -> HeaderVessel [style=invis, weight=10];
        HeaderVessel -> PreciosBunker [style=invis, weight=10];
        PreciosBunker -> LegControl [style=invis, weight=10];
        LegControl -> PLCalculo [style=invis, weight=10];
        PLCalculo -> BtnGrabar [style=invis, weight=10];

        # --- CONEXIONES REALES DE FLUJO ---
        FilterFiltros -> SelectCliente;
        SelectCliente -> HeaderVessel;
        HeaderVessel  -> PhotoVessel;
        PhotoVessel   -> ParamsVessel;

        ParamsVessel  -> PreciosBunker;
        PreciosBunker -> CommRules;

        CommRules  -> LegControl;
        LegControl -> TramoData;
        TramoData  -> PuertoOps;
        PuertoOps  -> FormatoNum;

        FormatoNum -> PLCalculo [label=" Datos Tramos & Costos"];
        PLCalculo  -> BtnGrabar  [label=" Guardar Cotización"];
        PLCalculo  -> BtnMatrix  [label=" Enviar a Forecast"];
        PLCalculo  -> BtnExport  [label=" Imprimir PDF"];
    }
    """

    try:
        src = graphviz.Source(dot_code)
        output_dir = os.path.dirname(os.path.abspath(__file__))
        dot_exe = os.path.join(GRAPHVIZ_BIN, "dot.exe")
        dot_file = os.path.join(output_dir, base_name)
        src.save(dot_file)
        svg_out = dot_file + ".svg"
        pdf_out = dot_file + ".pdf"
        png_out = dot_file + ".png"
        
        subprocess.run([dot_exe, "-Tsvg", "-o", svg_out, dot_file], capture_output=True)
        subprocess.run([dot_exe, "-Tpdf", "-o", pdf_out, dot_file], capture_output=True)
        subprocess.run([dot_exe, "-Tpng", "-o", png_out, dot_file], capture_output=True)
        
        # Copy to Frontend public dir
        public_dir = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\public"
        if os.path.exists(public_dir):
            shutil.copy(svg_out, os.path.join(public_dir, base_name + ".svg"))
            shutil.copy(pdf_out, os.path.join(public_dir, base_name + ".pdf"))
            shutil.copy(png_out, os.path.join(public_dir, base_name + ".png"))
            print(f"Copied SVG, PDF, PNG to {public_dir}")

        print(f"Generado SVG: {svg_out}")
        print(f"Generado PDF: {pdf_out}")
        print(f"Generado PNG: {png_out}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate()
