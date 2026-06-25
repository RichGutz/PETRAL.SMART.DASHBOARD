import graphviz
import os

def generate_etl_flowchart():
    base_name = "FLUJOGRAMA_ETL_Supabase_V2"
    output_filename = base_name
    
    print(f"Generando Flujograma ETL V2: {output_filename}.pdf")
    
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    dot_code = """
    digraph ETLFlow {
        rankdir=TB;
        splines=ortho;
        nodesep=0.5;
        ranksep=0.8;
        
        # Para hacerlo más angosto
        ratio=auto;
        
        node [shape=box, style="filled,rounded", fontname="Arial", fontsize=10, margin="0.2,0.1"];
        edge [fontname="Arial", fontsize=9];

        # ==========================================
        #  NIVEL 1: ARCHIVOS ORIGEN (LEGACY)
        # ==========================================
        subgraph cluster_lvl1 {
            label = "NIVEL 1: DECENAS DE ARCHIVOS MENSUALES"; style="filled"; color="#ECEFF1"; fontcolor="#455A64";
            
            subgraph cluster_files {
                label = "INPUTS DE EXCEL"; style="filled"; fillcolor="#FFF3E0"; color="#FF9800";
                F1 [label="📊 Facturación\\n(Viajes, Fechas, B/L, Tarifas)", shape=note, fillcolor="#FFE0B2"];
                F2 [label="📊 Margen Operación\\n(Consolidado Mensual)", shape=note, fillcolor="#FFE0B2"];
                F3 [label="📊 Resultado (Presupuestal)\\n(P&L Detallado Mensual)", shape=note, fillcolor="#FFE0B2"];
                
                # Forzar apilamiento vertical para hacerlo más angosto
                F1 -> F2 -> F3 [style=invis, weight=100];
            }
        }

        # ==========================================
        #  NIVEL 2: ORQUESTADOR ETL (PYTHON)
        # ==========================================
        subgraph cluster_lvl2 {
            label = "NIVEL 2: MOTOR ETL"; style="filled,dashed"; fillcolor="#E0F7FA"; color="#006064";
            
            BatchLoop [label="🔄 BATCH LOOP\\n(Iterar sobre todos los Excels)", shape=component, fillcolor="#80DEEA", penwidth=2];
            
            subgraph cluster_parsers {
                label = "PARSERS (PANDAS BOILERPLATE)"; style="filled"; fillcolor="#B2EBF2"; color="#00838F";
                ParseFact [label="🛠️ Parser Facturación", shape=rect, fillcolor="white"];
                ParseMarg [label="🛠️ Parser Margen", shape=rect, fillcolor="white"];
                ParseRes [label="🛠️ Parser Resultado", shape=rect, fillcolor="white"];
                
                # Forzar apilamiento vertical
                ParseFact -> ParseMarg -> ParseRes [style=invis, weight=100];
            }
            
            DataValidator [label="✅ Validador Pydantic\\n(Limpia NaNs, Fechas)", shape=diamond, fillcolor="#4DD0E1"];
        }

        # ==========================================
        #  NIVEL 3: DESTINO (SUPABASE)
        # ==========================================
        subgraph cluster_lvl3 {
            label = "NIVEL 3: BASE DE DATOS (SUPABASE)"; style="filled,dashed"; fillcolor="#E1F5FE"; color="#0277BD";
            
            SupabaseAPI [label="🚀 Supabase REST API", shape=component, fillcolor="#81D4FA", penwidth=2];
            
            subgraph cluster_tables {
                label = "TABLAS RELACIONALES (SQL)"; style="filled"; fillcolor="#B3E5FC"; color="#0288D1";
                T_Viajes [label="🚢 tabla: viajes_facturacion", shape=record, fillcolor="white"];
                T_Margen [label="💰 tabla: margen_mensual", shape=record, fillcolor="white"];
                T_Presupuesto [label="📈 tabla: control_presupuestal", shape=record, fillcolor="white"];
                
                # Forzar apilamiento vertical
                T_Viajes -> T_Margen -> T_Presupuesto [style=invis, weight=100];
            }
        }

        # ==========================================
        #  NIVEL 4: REPORTERÍA Y FORECAST
        # ==========================================
        subgraph cluster_lvl4 {
            label = "NIVEL 4: REPORTERÍA (STREAMLIT)"; style="filled,dashed"; fillcolor="#F1F8E9"; color="#558B2F";
            
            DashboardEngine [label="⚙️ Lógica de Dashboards y KPIs", shape=component, fillcolor="#C5E1A5"];
            ForecastEngine [label="🔮 Motor de Forecast\\n(Proyección a Fin de Año)", shape=component, fillcolor="#DCE775"];
            
            subgraph cluster_views {
                label = "VISTAS FRONTEND"; style="filled"; fillcolor="#DCEDC8"; color="#689F38";
                ViewDash [label="📊 Dashboard Ejecutivo\\n(Moquegua / Tablones)", shape=note, fillcolor="#AED581"];
                ViewForecast [label="📈 Simulador Forecast\\n(Análisis Sensibilidad)", shape=note, fillcolor="#AED581"];
                
                # Forzar apilamiento
                ViewDash -> ViewForecast [style=invis, weight=100];
            }
        }

        # --- CONEXIONES REALES ---
        # Lvl 1 a Lvl 2
        F1 -> BatchLoop [constraint=false];
        F2 -> BatchLoop [constraint=false];
        F3 -> BatchLoop [constraint=false];
        
        BatchLoop -> ParseFact;
        BatchLoop -> ParseMarg;
        BatchLoop -> ParseRes;
        
        ParseFact -> DataValidator;
        ParseMarg -> DataValidator;
        ParseRes -> DataValidator;
        
        # Lvl 2 a Lvl 3
        DataValidator -> SupabaseAPI [label=" Bulk Insert", color="#00838F", penwidth=2];
        
        SupabaseAPI -> T_Viajes;
        SupabaseAPI -> T_Margen;
        SupabaseAPI -> T_Presupuesto;
        
        # Lvl 3 a Lvl 4
        T_Viajes -> DashboardEngine [color="#1E88E5"];
        T_Margen -> DashboardEngine [color="#1E88E5"];
        T_Presupuesto -> DashboardEngine [color="#1E88E5"];
        
        DashboardEngine -> ViewDash;
        DashboardEngine -> ForecastEngine [style=dashed];
        ForecastEngine -> ViewForecast;
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
    generate_etl_flowchart()
