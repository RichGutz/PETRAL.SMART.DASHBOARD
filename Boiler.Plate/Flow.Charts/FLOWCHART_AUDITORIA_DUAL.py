import graphviz, os, subprocess, shutil

def generate():
    base_name = "FLOWCHART_AUDITORIA_DUAL"
    GRAPHVIZ_BIN = r"C:\Program Files\Graphviz\bin"
    if GRAPHVIZ_BIN not in os.environ.get("PATH", ""):
        os.environ["PATH"] = GRAPHVIZ_BIN + os.pathsep + os.environ.get("PATH", "")

    dot_code = """
    digraph LiquidadorGastosPortuariosVertical {
        rankdir=TB;
        splines=ortho;
        nodesep=1.2;
        ranksep=2.8;
        dpi=300;
        newrank=true;

        node [shape=box, style="filled", fontname="Arial Bold", fontsize=22, height=1.3, margin="0.5,0.4"];
        edge [fontname="Arial Bold", fontsize=16, penwidth=2.5];

        # ==========================================
        # PASO 1: INPUTS DOCUMENTARIOS (FACTURA REAL vs CÁLCULO)
        # ==========================================
        subgraph cluster_inputs {
            label = "PASO 1: DOCUMENTOS & DATOS DE ENTRADA A AUDITAR";
            style="filled"; fillcolor="#EFF6FF"; color="#2563EB"; fontcolor="#1E3A5F"; fontname="Arial Bold"; fontsize=26;
            
            InputsDocs [label="📄 DOCUMENTOS DE ENTRADA\\n• PDF Armador (Factura / SOF con ítems de costos)\\n• PDF Agente Portuario (Cuenta de Gastos por Puerto)\\n• Cifra Proforma P×Q (Motor P×Q del Sistema)", fillcolor="#DBEAFE", shape=note, width=6.5];
        }

        # ==========================================
        # PASO 2: VISOR SPLIT-VIEW DE AUDITORÍA
        # ==========================================
        subgraph cluster_viewer {
            label = "PASO 2: HERRAMIENTA LIQUIDADOR DE GASTOS PORTUARIOS (VISOR SPLIT-VIEW)";
            style="filled,dashed"; fillcolor="#FFF7ED"; color="#F97316"; fontcolor="#431407"; fontname="Arial Bold"; fontsize=26;
            
            SplitView [label="🔍 VISOR SPLIT-VIEW (LIQUIDADOR DE GASTOS PORTUARIOS)\\n────────────────────────────\\n• Panel Izquierdo: PDF Factura Armador / Agente\\n• Panel Derecho: Matriz de Recálculo P×Q Sistema\\n• Controles de Zoom, Navegación & Selección de Ítems", shape=doubleoctagon, fillcolor="#FED7AA", penwidth=3.0, fontsize=22, height=3.2, width=6.5];
        }

        # ==========================================
        # PASO 3: COMPARACIÓN DUAL & DIVERGENCIAS (Δ)
        # ==========================================
        subgraph cluster_comparacion {
            label = "PASO 3: MOTOR DE AUDITORÍA DUAL & DIVERGENCIAS (Δ P×Q)";
            style="filled,dashed"; fillcolor="#F0FDF4"; color="#16A34A"; fontcolor="#14532D"; fontname="Arial Bold"; fontsize=26;
            
            DeltaEngine [label="⚖️ COMPARADOR DUAL P×Q (FACTURA REAL vs SISTEMA)\\n• Δ Bunker: Diferencia de Precio VLSFO/LSMGO & Consumo MT\\n• Δ Puertos: Diferencia en Agenciamiento, Practicaje & Remolques\\n• Δ Total P&L: Impacto Neto en USD y USD/MT en la Liquidación", fillcolor="#DCFCE7", shape=box, width=6.5];
        }

        # ==========================================
        # PASO 4: RESOLUCIÓN Y VERDICTO DE AUDITORÍA
        # ==========================================
        subgraph cluster_resolucion {
            label = "PASO 4: RESOLUCIÓN Y AUDITORÍA DE TOLERANCIA";
            style="filled,dashed"; fillcolor="#F0FDFA"; color="#0D9488"; fontcolor="#042F2E"; fontname="Arial Bold"; fontsize=26;
            
            Resolucion [label="📋 AUDITORÍA DE TOLERANCIA\\n• ✅ APROBADO (Δ dentro de tolerancia contractualmente permitida)\\n• ⚠️ OBJECIÓN (Δ supera tolerancia / Nota de Crédito requerida)", fillcolor="#CCFBF1", shape=component, width=6.5];
        }

        # ==========================================
        # PASO 5: EMISIÓN DE ACTA EN PDF & REGISTRO
        # ==========================================
        subgraph cluster_salida {
            label = "PASO 5: DOCUMENTACIÓN OFICIAL & ACTA FIRMABLE EN PDF";
            style="filled,dashed"; fillcolor="#F8FAFC"; color="#475569"; fontcolor="#0F172A"; fontname="Arial Bold"; fontsize=26;
            
            ActaPdf [label="📄 ACTA DE AUDITORÍA LIQUIDADOR DE GASTOS (PDF)\\n• Título con Nivel ([NIVEL BAJO] / [NIVEL ALTO])\\n• Reporte de Liquidación Firmable con Desglose Granular", shape=cds, fillcolor="#E2E8F0", width=6.5];
        }

        # ==========================================
        # CONEXIONES VERTICALES EN CASCADA
        # ==========================================
        InputsDocs -> SplitView [label="  1. Carga PDFs & Data Sistema", fontname="Arial Bold", fontsize=16];
        SplitView -> DeltaEngine [label="  2. Ejecuta Cotejo Dual", fontname="Arial Bold", fontsize=16];
        DeltaEngine -> Resolucion [label="  3. Evalúa Tolerancia", fontname="Arial Bold", fontsize=16];
        Resolucion -> ActaPdf [label="  4. Emite Veredicto", fontname="Arial Bold", fontsize=16];
    }
    """
    src = graphviz.Source(dot_code)
    output_dir = os.path.dirname(os.path.abspath(__file__))
    dot_exe = os.path.join(GRAPHVIZ_BIN, "dot.exe")
    dot_file = os.path.join(output_dir, base_name)
    src.save(dot_file)
    subprocess.run([dot_exe, "-Tsvg", "-o", dot_file + ".svg", dot_file], capture_output=True)
    subprocess.run([dot_exe, "-Tpdf", "-o", dot_file + ".pdf", dot_file], capture_output=True)
    
    # Copy to Frontend public directory
    public_dir = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\public"
    if os.path.exists(public_dir):
        shutil.copy(dot_file + ".svg", os.path.join(public_dir, base_name + ".svg"))
        shutil.copy(dot_file + ".pdf", os.path.join(public_dir, base_name + ".pdf"))
        print(f"Copied SVG and PDF to {public_dir}")

    print(f"OK Vertical: {base_name}")

if __name__ == "__main__":
    generate()
