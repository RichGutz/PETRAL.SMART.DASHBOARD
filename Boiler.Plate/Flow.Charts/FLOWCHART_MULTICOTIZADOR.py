import graphviz
import os
import subprocess

def generate():
    base_name = "FLOWCHART_MULTICOTIZADOR"
    GRAPHVIZ_BIN = r"C:\Program Files\Graphviz\bin"
    if GRAPHVIZ_BIN not in os.environ.get("PATH", ""):
        os.environ["PATH"] = GRAPHVIZ_BIN + os.pathsep + os.environ.get("PATH", "")

    dot_code = """
    digraph MultiCotizador {
        rankdir=TB;
        splines=ortho;
        nodesep=1.8;
        ranksep=3.5;
        dpi=300;
        newrank=true;

        node [shape=box, style="filled,rounded", fontname="Arial Bold", fontsize=22, height=1.3, margin="0.5,0.4"];
        edge [fontname="Arial Bold", fontsize=16, penwidth=2.5];

        # ==========================================
        #  PASO 1: INPUTS DEL USUARIO
        # ==========================================
        subgraph cluster_inputs {
            label = "PASO 1: DATOS DE ENTRADA DEL OPERADOR COMERCIAL";
            style="filled"; fillcolor="#EFF6FF"; color="#2563EB"; fontcolor="#1E3A5F";
            fontname="Arial Bold"; fontsize=26;

            { rank=same;
                InputCliente  [label="👤 CLIENTE\\n(Selección desde Maestro de Clientes)",  fillcolor="#DBEAFE", shape=parallelogram];
                InputBuque    [label="🚢 BUQUE\\n(Selección desde Maestro de Flota)",        fillcolor="#DBEAFE", shape=parallelogram];
                InputRuta     [label="🗺️ RUTA\\n(Puerto Origen ➔ Puerto Destino)",           fillcolor="#DBEAFE", shape=parallelogram];
                InputFecha    [label="📅 FECHA & Q CARGA\\n(Fecha Zarpe + Toneladas MT)",    fillcolor="#DBEAFE", shape=parallelogram];
            }
            InputCliente -> InputBuque -> InputRuta -> InputFecha [style=invis, weight=50];
        }

        # ==========================================
        #  PASO 2: VALIDACIÓN DE MAESTROS
        # ==========================================
        subgraph cluster_validacion {
            label = "PASO 2: VALIDACIÓN DE DATOS EN MAESTROS DEL SISTEMA";
            style="filled,dashed"; fillcolor="#F0FDF4"; color="#16A34A"; fontcolor="#14532D";
            fontname="Arial Bold"; fontsize=26;

            { rank=same;
                ValFlota     [label="✅ LOA / GRT / DWT\\nVelocidad & Consumos Buque",  fillcolor="#DCFCE7", fontsize=20];
                ValPuertos   [label="✅ Terminales & Q\\nCapacidades Puerto",            fillcolor="#DCFCE7", fontsize=20];
                ValDistancia [label="✅ Distancia NM\\nMatriz Náutica",                  fillcolor="#DCFCE7", fontsize=20];
                ValBunker    [label="✅ Precio VLSFO\\nCotización Vigente",              fillcolor="#DCFCE7", fontsize=20];
            }
            ValFlota -> ValPuertos -> ValDistancia -> ValBunker [style=invis, weight=50];
        }

        # ==========================================
        #  PASO 3: CÁLCULO SPOT (NAVEGACIÓN + BUNKERS)
        # ==========================================
        subgraph cluster_spot {
            label = "PASO 3: MOTOR SPOT — NAVEGACIÓN & BUNKERS";
            style="filled,dashed"; fillcolor="#FFFBEB"; color="#D97706"; fontcolor="#78350F";
            fontname="Arial Bold"; fontsize=26;

            { rank=same;
                CalcNavegacion [label="⚙️ CÁLCULO Δt NAVEGACIÓN\\n(Distancia NM ÷ Velocidad = Días en Mar)", shape=component, fillcolor="#FDE68A", penwidth=3.0];
                CalcBunker     [label="⛽ CÁLCULO BUNKER\\n(Días × Consumo MT/día × Precio USD/MT)",          shape=component, fillcolor="#FEF3C7"];
                CalcFlete      [label="💵 ESTIMACIÓN FLETE\\n(Q Carga MT × Tarifa USD/MT = Ingreso Bruto)",   shape=component, fillcolor="#FEF3C7"];
            }
            CalcNavegacion -> CalcBunker -> CalcFlete [style=invis, weight=30];
            CalcNavegacion -> CalcBunker;
        }

        # ==========================================
        #  PASO 4: MOTORES DE COSTOS PORTUARIOS
        # ==========================================
        subgraph cluster_puertos {
            label = "PASO 4: MOTORES DE COSTOS PORTUARIOS (P×Q por Terminal)";
            style="filled,dashed"; fillcolor="#F3E8FF"; color="#9333EA"; fontcolor="#3B0764";
            fontname="Arial Bold"; fontsize=26;

            CoreDispatch2 [label="🔀 CORE DISPATCHER\\n(Identifica Motor por Puerto Carga & Descarga)", shape=diamond, fillcolor="#E9D5FF", penwidth=3.0, height=1.6];

            { rank=same;
                MotorCarga    [label="🏭 MOTOR PUERTO CARGA\\n(Gastos Agenciamiento, Practicaje,\\nRemolques, Derechos Portuarios)", fillcolor="#E9D5FF"];
                MotorDescarga [label="🏗️ MOTOR PUERTO DESCARGA\\n(Gastos Agenciamiento, Practicaje,\\nRemolques, Derechos Portuarios)", fillcolor="#FBCFE8"];
            }
            CoreDispatch2 -> MotorCarga;
            CoreDispatch2 -> MotorDescarga;
        }

        # ==========================================
        #  PASO 5: VOYAGE P&L (LEDGER DE VIAJE)
        # ==========================================
        subgraph cluster_pl {
            label = "PASO 5: VOYAGE P&L — RESULTADO FINANCIERO DEL VIAJE";
            style="filled,dashed"; fillcolor="#CCFBF1"; color="#0D9488"; fontcolor="#042F2E";
            fontname="Arial Bold"; fontsize=26;

            PLCalculo [label="📊 VOYAGE P&L CALCULATOR\\nIngreso Flete (USD)\\n─ Costo Bunker (USD)\\n─ Gastos Puerto Carga (USD)\\n─ Gastos Puerto Descarga (USD)\\n= P&L NETO VIAJE (USD & USD/MT)", shape=doubleoctagon, fillcolor="#99F6E4", penwidth=3.0, fontsize=22, height=2.4];
        }

        # ==========================================
        #  PASO 6: TABLA DE RESULTADOS EN PANTALLA
        # ==========================================
        subgraph cluster_resultado {
            label = "PASO 6: VISUALIZACIÓN DE RESULTADOS EN PANTALLA";
            style="filled,dashed"; fillcolor="#F8FAFC"; color="#475569"; fontcolor="#0F172A";
            fontname="Arial Bold"; fontsize=26;

            { rank=same;
                TablaResumen   [label="📋 TABLA DESGLOSE\\n(Ítems & Costos por Concepto)", fillcolor="#F1F5F9", fontsize=20];
                AuditTrail     [label="🔍 RASTRO AUDITORÍA\\n(Qué motor & regla calculó\\ncada ítem del costo)", fillcolor="#E2E8F0", fontsize=20];
                BtnExportar    [label="📦 BOTÓN EXPORTAR\\n➔ Matriz Financiera", shape=cds, fillcolor="#FED7AA", penwidth=2.5, fontsize=20];
            }
            TablaResumen -> AuditTrail -> BtnExportar [style=invis, weight=30];
        }

        # ==========================================
        #  PASO 7: DESTINO FINAL
        # ==========================================
        subgraph cluster_destino {
            label = "PASO 7: EXPORTACIÓN AL FORECAST COMERCIAL";
            style="filled,dashed"; fillcolor="#FFF7ED"; color="#F97316"; fontcolor="#431407";
            fontname="Arial Bold"; fontsize=26;

            MatrizDest [label="📋 MATRIZ FINANCIERA\\n(Viaje registrado en Grilla Mensual\\nMulti-Cliente por Mes de Zarpe)", shape=doubleoctagon, fillcolor="#FED7AA", penwidth=3.0];
        }

        # --- COLUMNA VERTEBRAL INVISIBLE ---
        InputRuta -> ValDistancia [style=invis, weight=10];
        ValDistancia -> CalcNavegacion [style=invis, weight=10];
        CalcNavegacion -> CoreDispatch2 [style=invis, weight=10];
        CoreDispatch2 -> PLCalculo [style=invis, weight=10];
        PLCalculo -> TablaResumen [style=invis, weight=10];
        TablaResumen -> MatrizDest [style=invis, weight=10];

        # --- CONEXIONES REALES ---
        InputCliente  -> ValFlota;
        InputBuque    -> ValFlota;
        InputRuta     -> ValDistancia;
        InputFecha    -> ValBunker;

        ValFlota     -> CalcNavegacion;
        ValDistancia -> CalcNavegacion;
        ValBunker    -> CalcBunker;
        ValPuertos   -> CoreDispatch2;

        CalcNavegacion -> CalcFlete;
        CalcFlete      -> PLCalculo;
        CalcBunker     -> PLCalculo;
        MotorCarga     -> PLCalculo;
        MotorDescarga  -> PLCalculo;

        PLCalculo -> TablaResumen;
        PLCalculo -> AuditTrail;
        BtnExportar -> MatrizDest;
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
        subprocess.run([dot_exe, "-Tsvg", "-o", svg_out, dot_file], capture_output=True)
        subprocess.run([dot_exe, "-Tpdf", "-o", pdf_out, dot_file], capture_output=True)
        print(f"Generado SVG: {svg_out}")
        print(f"Generado PDF: {pdf_out}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate()
