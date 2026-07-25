import graphviz, os, subprocess

def generate():
    base_name = "FLOWCHART_VOYAGE_LEDGER"
    GRAPHVIZ_BIN = r"C:\Program Files\Graphviz\bin"
    if GRAPHVIZ_BIN not in os.environ.get("PATH", ""):
        os.environ["PATH"] = GRAPHVIZ_BIN + os.pathsep + os.environ.get("PATH", "")

    dot_code = """
    digraph VoyageLedger {
        rankdir=TB; splines=ortho; nodesep=1.8; ranksep=3.2; dpi=300; newrank=true;
        node [shape=box, style="filled,rounded", fontname="Arial Bold", fontsize=22, height=1.3, margin="0.5,0.4"];
        edge [fontname="Arial Bold", fontsize=16, penwidth=2.5];

        subgraph cluster_config {
            label = "CONFIGURACIÓN DEL VIAJE A SIMULAR";
            style="filled"; fillcolor="#EFF6FF"; color="#2563EB"; fontcolor="#1E3A5F"; fontname="Arial Bold"; fontsize=26;
            { rank=same;
                SelBuque  [label="🚢 SELECCIÓN BUQUE\\n(Datos LOA, DWT, Consumos)", fillcolor="#DBEAFE", shape=parallelogram];
                SelCliente[label="👤 SELECCIÓN CLIENTE\\n(Condiciones Contractuales)", fillcolor="#DBEAFE", shape=parallelogram];
                SelMatriz [label="🗄️ SELECCIÓN MATRIZ\\n(Costos Portuarios: Simple / Compleja)", fillcolor="#DBEAFE", shape=parallelogram];
            }
            SelBuque -> SelCliente -> SelMatriz [style=invis, weight=50];
        }

        subgraph cluster_motor {
            label = "MOTOR DE CÁLCULO AUTOMÁTICO (Se ejecuta al cambiar cualquier input)";
            style="filled,dashed"; fillcolor="#FFFBEB"; color="#D97706"; fontcolor="#78350F"; fontname="Arial Bold"; fontsize=26;
            { rank=same;
                CalcDias  [label="⏱️ DÍAS NAVEGACIÓN\\n(Distancia ÷ Velocidad)", fillcolor="#FDE68A", shape=component];
                CalcBnk   [label="⛽ COSTO BUNKER\\n(Días × Consumo × Precio VLSFO)", fillcolor="#FEF3C7", shape=component];
                CalcPuerto[label="🏭 COSTOS PORTUARIOS\\n(P×Q vía Core Dispatcher)", fillcolor="#FEF3C7", shape=component];
            }
            CalcDias -> CalcBnk -> CalcPuerto [style=invis, weight=30];
            CalcDias -> CalcBnk;
        }

        subgraph cluster_pl {
            label = "RESULTADO: P&L DESGLOSADO DEL VIAJE";
            style="filled,dashed"; fillcolor="#CCFBF1"; color="#0D9488"; fontcolor="#042F2E"; fontname="Arial Bold"; fontsize=26;
            PLResult [label="📊 P&L VOYAGE LEDGER\\n────────────────────────────\\n+ Ingreso Flete (USD)\\n─ Bunker Carga (VLSFO + LSMGO)\\n─ Gastos Puerto Carga\\n─ Gastos Puerto Descarga\\n────────────────────────────\\n= P&L NETO (USD)\\n= P&L / MT (USD/MT)\\n= P&L / DWT (USD/DWT)", shape=doubleoctagon, fillcolor="#99F6E4", penwidth=3.0, fontsize=21, height=3.5];
        }

        subgraph cluster_outputs {
            label = "VISUALIZACIÓN Y ACCIONES";
            style="filled,dashed"; fillcolor="#F8FAFC"; color="#475569"; fontcolor="#0F172A"; fontname="Arial Bold"; fontsize=26;
            { rank=same;
                OutDesglose [label="📋 TABLA DESGLOSE\\n(Cada ítem de costo\\ncon su valor USD)", fillcolor="#F1F5F9", fontsize=20];
                OutSensib   [label="📐 ANÁLISIS SENSIBILIDAD\\n(¿Qué pasa si el flete\\nsube/baja X USD/MT?)", fillcolor="#E2E8F0", fontsize=20];
                OutExport   [label="📦 EXPORTAR\\n➔ Matriz Financiera", shape=cds, fillcolor="#FED7AA", fontsize=20, penwidth=2.5];
            }
            OutDesglose -> OutSensib -> OutExport [style=invis, weight=30];
        }

        SelBuque -> CalcDias [style=invis, weight=10];
        SelBuque -> CalcDias; SelCliente -> CalcDias; SelMatriz -> CalcPuerto;
        CalcBnk -> PLResult; CalcPuerto -> PLResult; CalcDias -> PLResult;
        PLResult -> OutDesglose [style=invis, weight=10];
        PLResult -> OutDesglose; PLResult -> OutSensib; PLResult -> OutExport;
    }
    """
    src = graphviz.Source(dot_code)
    output_dir = os.path.dirname(os.path.abspath(__file__))
    dot_exe = os.path.join(GRAPHVIZ_BIN, "dot.exe")
    dot_file = os.path.join(output_dir, base_name)
    src.save(dot_file)
    subprocess.run([dot_exe, "-Tsvg", "-o", dot_file + ".svg", dot_file], capture_output=True)
    subprocess.run([dot_exe, "-Tpdf", "-o", dot_file + ".pdf", dot_file], capture_output=True)
    print(f"OK: {base_name}")

if __name__ == "__main__":
    generate()
