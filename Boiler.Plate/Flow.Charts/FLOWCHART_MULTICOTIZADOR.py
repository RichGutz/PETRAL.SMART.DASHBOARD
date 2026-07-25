import graphviz
import os
import subprocess
import shutil

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

        node [shape=box, style="filled", fontname="Arial Bold", fontsize=22, height=1.3, margin="0.5,0.4"];
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
            label = "PASO 3: MOTOR SPOT — CÁLCULO DE NAVEGACIÓN Y BUNKERS";
            style="filled,dashed"; fillcolor="#FFFBEB"; color="#D97706"; fontcolor="#78350F";
            fontname="Arial Bold"; fontsize=26;

            { rank=same;
                CalcNavegacion [label="⏱️ Δt NAVEGACIÓN\\n(Distancia NM ÷ Velocidad)", fillcolor="#FEF3C7", shape=component];
                CalcBunker     [label="⛽ COSTO BUNKER\\n(Días × Consumo MT/día × USD/MT)", fillcolor="#FEF3C7", shape=component];
                CalcFlete      [label="💰 INGRESO BRUTO\\n(Q MT × Tarifa Flete USD/MT)", fillcolor="#FEF3C7", shape=component];
            }
            CalcNavegacion -> CalcBunker -> CalcFlete [style=invis, weight=30];
        }

        # ==========================================
        #  PASO 4: MODALIDADES DE COSTOS PORTUARIOS
        # ==========================================
        subgraph cluster_puertos {
            label = "PASO 4: COSTOS PORTUARIOS (MODELO ESTÁTICO vs MOTOR P×Q)";
            style="filled,dashed"; fillcolor="#F3E8FF"; color="#9333EA"; fontcolor="#3B0764";
            fontname="Arial Bold"; fontsize=26;

            { rank=same;
                ModEstatico [label="📌 MODO 1: ESTÁTICO (Por Defecto)\\n➔ Maestro port_cost_static\\n• Cifra plana fija por Puerto × Barco\\n• Sin considerar fecha, tiempo ni MT", fillcolor="#E9D5FF", shape=box, fontsize=19];
                ModDinamico [label="⚙️ MODO 2: DINÁMICO P×Q (Complejo)\\n➔ Core Dispatcher ➔ port_engines\\n• Desglose tarifa por tarifa (P × Q)\\n• Evalúa LOA, DWT, MT, tiempo & práctico", fillcolor="#E9D5FF", shape=box, fontsize=19];
            }
            ModEstatico -> ModDinamico [style=invis, weight=30];
        }

        # ==========================================
        #  PASO 5: CÁLCULO VOYAGE P&L
        # ==========================================
        subgraph cluster_pl {
            label = "PASO 5: VOYAGE P&L CALCULATOR (RESULTADO FINANCIERO)";
            style="filled,dashed"; fillcolor="#CCFBF1"; color="#0D9488"; fontcolor="#042F2E";
            fontname="Arial Bold"; fontsize=26;

            PLCalculo [label="📊 P&L NETO DEL VIAJE\\n= Ingreso Flete − Bunker − Costo Puerto Carga − Costo Puerto Descarga", shape=doubleoctagon, fillcolor="#99F6E4", penwidth=3.0, fontsize=22];
        }

        # ==========================================
        #  PASO 6: VISUALIZACIÓN & RASTRO DE AUDITORÍA
        # ==========================================
        subgraph cluster_ui {
            label = "PASO 6: INTERFAZ EN PANTALLA & RASTRO DE CÁLCULO";
            style="filled,dashed"; fillcolor="#F8FAFC"; color="#475569"; fontcolor="#0F172A";
            fontname="Arial Bold"; fontsize=26;

            { rank=same;
                TablaResumen [label="📋 TABLA DESGLOSE EXCEL\\n(Ítems de Costo en USD)", fillcolor="#F1F5F9", fontsize=20];
                AuditTrail   [label="🔍 RASTRO DE AUDITORÍA\\n(Motor y Regla Aplicada)", fillcolor="#F1F5F9", fontsize=20];
                BtnExportar  [label="📦 SELECCIÓN MODO GUARDADO\\n(Prospectos vs Activos)", shape=cds, fillcolor="#FED7AA", fontsize=20, penwidth=2.5];
            }
            TablaResumen -> AuditTrail -> BtnExportar [style=invis, weight=30];
        }

        # ==========================================
        #  PASO 7: PERSISTENCIA Y TABLAS DB DE DESTINO
        # ==========================================
        subgraph cluster_destino {
            label = "PASO 7: EXPORTACIÓN DUAL & PERSISTENCIA EN TABLAS BASE DE DATOS";
            style="filled,dashed"; fillcolor="#FFF7ED"; color="#F97316"; fontcolor="#431407";
            fontname="Arial Bold"; fontsize=26;

            { rank=same;
                GuardadoProspectos [label="📌 PROSPECTOS (Cotización)\\n➔ TABLA: routes_quotes\\n• Foto estática del momento\\n• Condiciones y bunker fijos", fillcolor="#FED7AA", shape=cds, penwidth=2.5, fontsize=19];
                GuardadoActivos    [label="🔄 ACTIVOS (Ruta Dinámica)\\n➔ TABLA: routes_clients\\n• Desplazamiento dinámico / vivo\\n• Recálculo dinámico según BAF", fillcolor="#FDE68A", shape=cds, penwidth=2.5, fontsize=19];
            }
            GuardadoProspectos -> GuardadoActivos [style=invis, weight=30];

            MatrizDest [label="📋 MATRIZ FINANCIERA\\n(Viaje consolidado en Grilla Mensual Multi-Cliente)", shape=doubleoctagon, fillcolor="#FEF3C7", penwidth=3.0, fontsize=22];
        }

        # --- COLUMNA VERTEBRAL INVISIBLE ---
        InputRuta -> ValDistancia [style=invis, weight=10];
        ValDistancia -> CalcNavegacion [style=invis, weight=10];
        CalcNavegacion -> ModEstatico [style=invis, weight=10];
        ModEstatico -> PLCalculo [style=invis, weight=10];
        PLCalculo -> TablaResumen [style=invis, weight=10];
        TablaResumen -> GuardadoProspectos [style=invis, weight=10];
        GuardadoProspectos -> MatrizDest [style=invis, weight=10];

        # --- CONEXIONES REALES ---
        InputCliente  -> ValFlota;
        InputBuque    -> ValFlota;
        InputRuta     -> ValDistancia;
        InputFecha    -> ValBunker;

        ValFlota     -> CalcNavegacion;
        ValDistancia -> CalcNavegacion;
        ValBunker    -> CalcBunker;
        ValPuertos   -> ModEstatico;
        ValPuertos   -> ModDinamico;

        CalcNavegacion -> CalcFlete;
        CalcFlete      -> PLCalculo;
        CalcBunker     -> PLCalculo;
        ModEstatico    -> PLCalculo [label=" Gastos Planos"];
        ModDinamico    -> PLCalculo [label=" Desglose P×Q"];

        PLCalculo -> TablaResumen;
        PLCalculo -> AuditTrail;
        TablaResumen -> BtnExportar;

        BtnExportar -> GuardadoProspectos [label=" Opción Prospectos"];
        BtnExportar -> GuardadoActivos [label=" Opción Activos"];
        GuardadoProspectos -> MatrizDest;
        GuardadoActivos -> MatrizDest;
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
        
        # Copy to Frontend public dir
        public_dir = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\public"
        if os.path.exists(public_dir):
            shutil.copy(svg_out, os.path.join(public_dir, base_name + ".svg"))
            shutil.copy(pdf_out, os.path.join(public_dir, base_name + ".pdf"))
            print(f"Copied SVG and PDF to {public_dir}")

        print(f"Generado SVG: {svg_out}")
        print(f"Generado PDF: {pdf_out}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate()
