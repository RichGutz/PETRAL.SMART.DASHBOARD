import graphviz
import os
import subprocess

def generate_pdf_flowchart_petral_v1():
    base_name = "FLUJOGRAMA_ARQUITECTURA_GENERAL_PETRAL_V1"
    output_filename = base_name
    
    print(f"Generando Flujograma General PETRAL V1 (dot engine - Sin Numeros - Con Matriz Financiera): {output_filename}.pdf")
    
    GRAPHVIZ_BIN = r"C:\Program Files\Graphviz\bin"
    if GRAPHVIZ_BIN not in os.environ.get("PATH", ""):
        os.environ["PATH"] = GRAPHVIZ_BIN + os.pathsep + os.environ.get("PATH", "")

    dot_code = """
    digraph PetralSystemArchitectureV1 {
        rankdir=TB;
        splines=ortho;
        nodesep=1.5;
        ranksep=4.5;
        dpi=300;
        newrank=true;
        
        node [shape=box, style="filled,rounded", fontname="Arial Bold", fontsize=22, height=1.3, margin="0.5,0.35"];
        edge [fontname="Arial Bold", fontsize=16, penwidth=2.5];

        # ==========================================
        #  NIVEL 1: MAESTROS Y CATÁLOGOS (FILAS 1 & 2 CON ORDEN ESTRICTO)
        # ==========================================
        subgraph cluster_lvl1 {
            label = "NIVEL 1: MAESTROS & CATÁLOGOS BASE DEL SISTEMA (10 MÓDULOS)"; style="filled"; fillcolor="#F8FAFC"; color="#475569"; fontcolor="#0F172A"; fontname="Arial Bold"; fontsize=30;
            
            # FILA 1: MAESTROS 1 AL 5
            M1_Vessels    [label="🚢 MAESTRO DE FLOTA\\n(BT Moquegua, BT Tablones, BT Huemul, Concon | LOA, GRT, DWT)", shape=record, fillcolor="#DBEAFE"];
            M2_Ports      [label="⚓ MAESTRO DE PUERTOS & TERMINALES\\n(8 Puertos + Terminales & Capacidades Q Carga/Descarga)",   shape=record, fillcolor="#DBEAFE"];
            M3_Routes     [label="🗺️ MAESTRO DE DISTANCIAS\\n(Matriz Náutica NM entre Puertos Perú/Chile)",                      shape=record, fillcolor="#DCFCE7"];
            M4_SpotRoutes [label="📍 MAESTRO DE RUTAS\\n(Puntos Mineras: SPCC, NEXA, Marcobre)",                                 shape=record, fillcolor="#DCFCE7"];
            M5_Clients    [label="💼 MAESTRO DE CLIENTES\\n(Fichas de Clientes Comerciales & Condiciones Flete)",                 shape=record, fillcolor="#FFE0B2"];

            # FILA 2: MAESTROS 6 AL 10
            M6_Contracts  [label="📜 MAESTRO DE CONTRATOS\\n(Convenios Flat Marcona $36k, Addendas PSA 39.31%)",                 shape=record, fillcolor="#FFE0B2"];
            M7_PortCosts  [label="💰 MAESTRO GASTOS PORTUARIOS\\n(Plantillas Reglas de Agenciamiento por Puerto)",               shape=record, fillcolor="#E9D5FF"];
            M8_PortTariffs [label="🔄 MAESTRO ORIGINACIÓN / DESTINO\\n(Tarifarios Remolques PSA/Petranso, Practicaje, Lanchas)", shape=record, fillcolor="#E9D5FF"];
            M9_Bunkers    [label="⛽ PRECIOS BUNKER\\n(Cotizaciones VLSFO y LSMGO por Puerto)",                                  shape=record, fillcolor="#FEE2E2"];
            M10_Users     [label="🔑 USUARIOS Y PERMISOS\\n(Roles Admin, Editor, Visor & Autenticación JWT)",                    shape=record, fillcolor="#FEE2E2"];

            # FORZAR FILAS EN MISMO RANGO HORIZONTAL
            { rank=same; M1_Vessels; M2_Ports; M3_Routes; M4_SpotRoutes; M5_Clients; }
            { rank=same; M6_Contracts; M7_PortCosts; M8_PortTariffs; M9_Bunkers; M10_Users; }

            # CADENAS DE ORDEN HORIZONTAL (FILA 1 Y FILA 2)
            M1_Vessels -> M2_Ports -> M3_Routes -> M4_SpotRoutes -> M5_Clients [style=invis, weight=100];
            M6_Contracts -> M7_PortCosts -> M8_PortTariffs -> M9_Bunkers -> M10_Users [style=invis, weight=100];

            # ALINEAR COLUMNAS VERTICALES (1↕6, 2↕7, 3↕8, 4↕9, 5↕10)
            M1_Vessels -> M6_Contracts [style=invis, weight=30];
            M2_Ports -> M7_PortCosts [style=invis, weight=30];
            M3_Routes -> M8_PortTariffs [style=invis, weight=30];
            M4_SpotRoutes -> M9_Bunkers [style=invis, weight=30];
            M5_Clients -> M10_Users [style=invis, weight=30];
        }

        # ==========================================
        #  NIVEL 2: RUTEADOR SPOT & CÁLCULO DE VIAJE
        # ==========================================
        subgraph cluster_lvl2 {
            label = "NIVEL 2: MOTOR DE CÁLCULO DE VIAJE SPOT (Spot Engine)"; style="filled,dashed"; fillcolor="#FFFBEB"; color="#F59E0B"; fontcolor="#78350F"; fontname="Arial Bold"; fontsize=30;
            
            { rank=same;
                SpotCalculator [label="⚙️ RUTEADOR SPOT MARÍTIMO\\n(Origen ➔ Destino | Δt Navegación)", shape=component, fillcolor="#FDE68A", penwidth=3.0, fontsize=24, height=1.4];
                BunkerEngine   [label="⛽ BUNKERS ENGINE\\n(Consumo VLSFO / LSMGO)",                      shape=record,    fillcolor="#FEF3C7", fontsize=20, height=1.2];
                FreightEngine  [label="💵 ESTIMADOR FLETE\\n(Spot USD/MT x Q Carga)",                     shape=record,    fillcolor="#FEF3C7", fontsize=20, height=1.2];
            }

            SpotCalculator -> BunkerEngine;
            SpotCalculator -> FreightEngine;
        }

        # ==========================================
        #  NIVEL 3: CORE DISPATCHER & MOTORES (2 FILAS DE 4)
        # ==========================================
        subgraph cluster_lvl3 {
            label = "NIVEL 3: MOTORES DEDICADOS COSTOS PORTUARIOS (P x Q)"; style="filled,dashed"; fillcolor="#F3E8FF"; color="#A855F7"; fontcolor="#3B0764"; fontname="Arial Bold"; fontsize=30;
            
            CoreDispatcher [label="🔀 CORE DISPATCHER ENGINE (core.py)", shape=diamond, fillcolor="#E9D5FF", penwidth=3.0, fontsize=24, height=1.4];

            EngCallao    [label="🇵🇪 Callao APM/DPW",     fillcolor="#E9D5FF", fontsize=20, height=1.2, style="filled,rounded"];
            EngMarcona   [label="🇵🇪 Marcona Shougang",   fillcolor="#E9D5FF", fontsize=20, height=1.2, style="filled,rounded"];
            EngMatarani  [label="🇵🇪 Matarani Tisur",     fillcolor="#E9D5FF", fontsize=20, height=1.2, style="filled,rounded"];
            EngIlo       [label="🇵🇪 Ilo SPCC/ENAPU",    fillcolor="#E9D5FF", fontsize=20, height=1.2, style="filled,rounded"];
            EngMejillones [label="🇨🇱 TPM Mejillones",    fillcolor="#FBCFE8", fontsize=20, height=1.2, style="filled,rounded"];
            EngInteracid  [label="🇨🇱 Interacid Terminal", fillcolor="#FBCFE8", fontsize=20, height=1.2, style="filled,rounded"];
            EngTerquim    [label="🇨🇱 Terquim Terminal",   fillcolor="#FBCFE8", fontsize=20, height=1.2, style="filled,rounded"];
            EngBarquito   [label="🇨🇱 Barquito Terminal",  fillcolor="#FBCFE8", fontsize=20, height=1.2, style="filled,rounded"];

            { rank=same; EngCallao; EngMarcona; EngMatarani; EngIlo; }
            { rank=same; EngMejillones; EngInteracid; EngTerquim; EngBarquito; }

            EngCallao -> EngMarcona -> EngMatarani -> EngIlo [style=invis, weight=20];
            EngMejillones -> EngInteracid -> EngTerquim -> EngBarquito [style=invis, weight=20];
            CoreDispatcher -> EngCallao [style=invis, weight=5];
            EngIlo -> EngMejillones [style=invis, weight=5];

            CoreDispatcher -> EngCallao;
            CoreDispatcher -> EngMarcona;
            CoreDispatcher -> EngMatarani;
            CoreDispatcher -> EngIlo;
            CoreDispatcher -> EngMejillones;
            CoreDispatcher -> EngInteracid;
            CoreDispatcher -> EngTerquim;
            CoreDispatcher -> EngBarquito;
        }

        # ==========================================
        #  NIVEL 4: VOYAGE LEDGER & MULTICOTIZADOR
        # ==========================================
        subgraph cluster_lvl4 {
            label = "NIVEL 4: CONSOLIDACIÓN COMERCIAL & VOYAGE LEDGER"; style="filled,dashed"; fillcolor="#CCFBF1"; color="#14B8A6"; fontcolor="#042F2E"; fontname="Arial Bold"; fontsize=30;
            
            { rank=same;
                VoyageLedger  [label="📊 VOYAGE LEDGER UNIVERSAL\\n(P&L Viaje = Ingresos - Bunkers - Puertos Carga/Descarga)", shape=doubleoctagon, fillcolor="#99F6E4", penwidth=3.0, fontsize=24, height=1.4];
                MultiCotizador [label="💼 MULTICOTIZADOR EXCEL\\n(Cotización Simultánea Multi-Cliente)",                        shape=folder,        fillcolor="#E6FFFA",              fontsize=20, height=1.2];
            }

            VoyageLedger -> MultiCotizador;
        }

        # ==========================================
        #  NIVEL 4B: MATRIZ FINANCIERA (FORECAST COMERCIAL)
        # ==========================================
        subgraph cluster_lvl4b {
            label = "NIVEL 4B: FORECAST COMERCIAL — MATRIZ FINANCIERA"; style="filled,dashed"; fillcolor="#FFF7ED"; color="#F97316"; fontcolor="#431407"; fontname="Arial Bold"; fontsize=30;
            
            { rank=same;
                MatrizFinanciera [label="📋 MATRIZ FINANCIERA\\n(Grilla Mensual Multi-Cliente de Viajes Exportados)", shape=doubleoctagon, fillcolor="#FED7AA", penwidth=3.0, fontsize=24, height=1.4];
                AnalisisGrafico  [label="📈 ANÁLISIS GRÁFICO\\n(Charts P&L por Cliente/Mes)",                         shape=note,          fillcolor="#FFEDD5",              fontsize=20, height=1.2];
                AuditoriaLedger  [label="🧪 AUDITORÍA LEDGER\\n(Validación Cruzada de Cálculos por Viaje)",            shape=note,          fillcolor="#FFEDD5",              fontsize=20, height=1.2];
            }

            MatrizFinanciera -> AnalisisGrafico;
            MatrizFinanciera -> AuditoriaLedger;
        }

        # ==========================================
        #  NIVEL 5: AUDITORÍA NAVIERA DUAL & REPORTES
        # ==========================================
        subgraph cluster_lvl5 {
            label = "NIVEL 5: AUDITORÍA NAVIERA DUAL & REPORTES EXPORTABLES"; style="filled,dashed"; fillcolor="#E2E8F0"; color="#64748B"; fontcolor="#0F172A"; fontname="Arial Bold"; fontsize=30;
            
            { rank=same;
                AuditViewer [label="🔍 HERRAMIENTA AUDITORÍA DUAL P x Q\\n(Visor Split-View PDFs Lado a Lado)", shape=component, fillcolor="#CBD5E1", penwidth=3.0, fontsize=24, height=1.4];
                ReportPdf   [label="📄 ACTA AUDITORÍA PDF",   shape=note, fillcolor="#F1F5F9", fontsize=20, height=1.2];
                ReportExcel [label="📈 EXCEL CONSOLIDADO",    shape=note, fillcolor="#F1F5F9", fontsize=20, height=1.2];
            }

            AuditViewer -> ReportPdf;
            AuditViewer -> ReportExcel;
        }

        # --- COLUMNA VERTEBRAL INVISIBLE (1->2->3->4->4B->5) ---
        M6_Contracts -> SpotCalculator [style=invis, weight=10];
        SpotCalculator -> CoreDispatcher [style=invis, weight=10];
        CoreDispatcher -> VoyageLedger [style=invis, weight=10];
        VoyageLedger -> MatrizFinanciera [style=invis, weight=10];
        MatrizFinanciera -> AuditViewer [style=invis, weight=10];

        # --- CONEXIONES JERÁRQUICAS REALES (SIN ETIQUETAS) ---
        M1_Vessels -> SpotCalculator;
        M3_Routes -> SpotCalculator;
        M4_SpotRoutes -> SpotCalculator;
        M9_Bunkers -> BunkerEngine;

        M2_Ports -> CoreDispatcher;
        M6_Contracts -> CoreDispatcher;
        M7_PortCosts -> CoreDispatcher;
        M8_PortTariffs -> CoreDispatcher;

        SpotCalculator -> VoyageLedger;
        EngCallao -> VoyageLedger;
        EngMarcona -> VoyageLedger;
        EngMatarani -> VoyageLedger;
        EngIlo -> VoyageLedger;
        EngMejillones -> VoyageLedger;
        EngInteracid -> VoyageLedger;
        EngTerquim -> VoyageLedger;
        EngBarquito -> VoyageLedger;

        M5_Clients -> MultiCotizador;
        MultiCotizador -> MatrizFinanciera;
        MatrizFinanciera -> AuditViewer;
    }
    """
    
    try:
        src = graphviz.Source(dot_code)
        output_dir = os.path.dirname(os.path.abspath(__file__))
        dot_exe = os.path.join(GRAPHVIZ_BIN, "dot.exe")
        dot_file = os.path.join(output_dir, output_filename)
        src.save(dot_file)
        pdf_out = dot_file + ".pdf"
        svg_out = dot_file + ".svg"
        subprocess.run([dot_exe, "-Tpdf", "-o", pdf_out, dot_file], capture_output=True)
        subprocess.run([dot_exe, "-Tsvg", "-o", svg_out, dot_file], capture_output=True)
        print(f"Generado exitosamente PDF: {os.path.abspath(pdf_out)}")
        print(f"Generado exitosamente SVG: {os.path.abspath(svg_out)}")
    except Exception as e:
        print(f"Error generando flujograma: {e}")

if __name__ == "__main__":
    generate_pdf_flowchart_petral_v1()
