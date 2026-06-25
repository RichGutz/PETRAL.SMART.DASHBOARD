import graphviz
import os

def generate_pdf_arquitectura_charteado():
    base_name = "FLUJOGRAMA_Arquitectura_Forecast_Charteado_V1"
    output_filename = base_name
    
    print(f"Generando Arquitectura Forecast Charteado V1: {output_filename}.pdf")
    
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    dot_code = """
    digraph PetralForecastLogic {
        rankdir=TB;
        splines=ortho;
        nodesep=1.0;
        ranksep=1.2;
        
        node [shape=box, style="filled,rounded", fontname="Arial", fontsize=10];
        edge [fontname="Arial", fontsize=9];

        # ==========================================
        #  NIVEL 1: FUNDAMENTOS / MAESTROS
        # ==========================================
        subgraph cluster_lvl1 {
            label = "NIVEL 1: MAESTROS / CATÁLOGOS (DATA ESTÁTICA)"; 
            style="filled,solid"; 
            fillcolor="#ECEFF1"; 
            color="#455A64"; 
            penwidth=1.5;
            fontcolor="#455A64";
            
            subgraph cluster_mod1 {
                label = "MOD 1: CLIENTES Y TARIFAS"; style="filled"; fillcolor="#E1F5FE"; color="#0277BD";
                MasterTarifas [label="{📊 Tarifario Fletes\\n(Ingresos)|{Cobro SIEMPRE por:\\nTM x Destino}}", shape=record, fillcolor="#B3E5FC"];
            }
            subgraph cluster_mod2 {
                label = "MOD 2: CONTRATOS ARRIENDO"; style="filled"; fillcolor="#F1F8E9"; color="#689F38";
                MasterArriendo [label="📜 Costo de Arriendo\\n(CONCON TRADER / HUEMEL)\\n\\nTarifa Fija por Viaje\\n(Cubre costos de puerto)", shape=cylinder, fillcolor="#DCEDC8"];
            }
            subgraph cluster_mod3 {
                label = "MOD 3: FLOTA Y CAPACIDAD"; style="filled"; fillcolor="#FFF3E0"; color="#FF9800";
                MasterFlota [label="{🚢 Maestro de Naves\\n(Charteadas)|{Capacidad de Carga\\n(Para facturar TM)\\n}|{Consumo de Bunker\\n(Petral paga combustible)\\n}}", shape=record, fillcolor="#FFE0B2"];
            }
        }

        # ==========================================
        #  NIVEL 2: MÓDULO OPERATIVO (INPUTS)
        # ==========================================
        subgraph cluster_mod_operativo {
            label = "NIVEL 2: MÓDULO OPERATIVO (INPUTS DEL USUARIO)"; style="filled,dashed"; fillcolor="#FFF8E1"; color="#F57C00";
            
            Timeline [label="📅 Timeline Mensual\\n\\nVisión de calendario donde\\nel usuario planifica los\\nviajes mes a mes.", shape=folder, fillcolor="#FFE082"];
            
            subgraph cluster_viaje {
                label = "PROGRAMACIÓN DE VIAJE (CHARTEADO)"; style="filled"; fillcolor="#FFE0B2"; color="#FB8C00";
                InputViaje [label="{📝 Ingreso Rápido de Viaje|• 1. Cliente y Destino\\l|• 2. Buque Charteado\\l|• 3. Días de Demora (Si aplica)\\l}", shape=record, fillcolor="white", penwidth=2];
            }
            
            Timeline -> InputViaje;
        }

        # ==========================================
        #  NIVEL 3: MOTOR DE CÁLCULO (GROSS MARGIN)
        # ==========================================
        subgraph cluster_lvl3 {
            label = "NIVEL 3: MOTOR DE CÁLCULO (UNIT ECONOMICS = VIAJE CHARTEADO)"; style="filled,dashed"; fillcolor="#F5F5F5"; color="#424242";
            
            subgraph cluster_motor {
                label = "P&L POR VIAJE"; style="filled"; fillcolor="#F3E5F5"; color="#9C27B0";
                Step1 [label="1. (+) Ingresos Flete\\n\\nCalcula: Toneladas\\nx Tarifa al Destino", shape=box, fillcolor="white"];
                Step2 [label="2. (-) Egresos Arriendo\\n\\nTarifa fija cobrada por\\nel dueño por viaje", shape=box, fillcolor="#D1C4E9"];
                Step3 [label="3. (-) Egresos Bunker\\n\\nCalcula: Consumo del buque\\nx Precio del Combustible", shape=box, fillcolor="#FFAB91"];
                StepDemora [label="4. (-) Egresos Demoras\\n\\nPenalidad por retraso", shape=box, fillcolor="#EF9A9A"];
                Step4 [label="5. = GROSS MARGIN VIAJE\\n\\nRentabilidad del viaje charteado", shape=doubleoctagon, fillcolor="#FFF59D", penwidth=2];
                
                Step1 -> Step2 -> Step3 -> StepDemora -> Step4;
            }
        }

        # ==========================================
        #  NIVEL 4: OUTPUTS Y REPORTES
        # ==========================================
        subgraph cluster_outputs {
            label = "NIVEL 4: DASHBOARD Y FORECAST"; style="filled,dashed"; fillcolor="#ECEFF1"; color="#607D8B";
            Consolidador [label="⚙️ CONSOLIDADOR DE RESULTADOS\\n\\nAgrupa viajes propios y\\ncharteados para el Forecast.", shape=component, fillcolor="#B3E5FC", penwidth=2];
            Dashboard [label="📊 DASHBOARD FORECAST\\n\\nP&L Consolidado", shape=note, fillcolor="#90CAF9"];
        }

        # --- ENLACES INVISIBLES PARA FORZAR ORDEN VERTICAL ESTRICTO ---
        MasterArriendo -> Timeline [style=invis, weight=10];
        InputViaje -> Step1 [style=invis, weight=10];
        Step4 -> Consolidador [style=invis, weight=10];

        # --- CONEXIONES REALES DE DEPENDENCIA ---
        MasterTarifas -> InputViaje [style=dotted, color="#0277BD"];
        MasterArriendo -> InputViaje [style=dotted, color="#689F38"];
        MasterFlota -> InputViaje [style=dotted, color="#FF9800"];

        InputViaje -> Step1 [label="Genera Viaje", color="#FB8C00", penwidth=2];

        Step1 -> MasterTarifas [color="#9C27B0", style=dashed, constraint=false];
        Step2 -> MasterArriendo [color="#9C27B0", style=dashed, constraint=false];
        Step3 -> MasterFlota [color="#9C27B0", style=dashed, constraint=false];

        Step4 -> Consolidador [color="#9C27B0", penwidth=2];
        Consolidador -> Dashboard [color="#0277BD", penwidth=2];
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
    generate_pdf_arquitectura_charteado()
