import graphviz
import os

def generate_vertical_architecture():
    base_name = "FLUJOGRAMA_Arquitectura_Petral_V2"
    output_filename = base_name
    
    print(f"Generando Arquitectura Petral V2 (Vertical): {output_filename}.pdf")
    
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    dot_code = """
    digraph PetralArchitecture {
        rankdir=TB;
        splines=ortho;
        nodesep=0.5;
        ranksep=0.8;
        ratio=auto;
        
        node [shape=box, style="filled,rounded", fontname="Arial", fontsize=10, margin="0.2,0.1"];
        edge [fontname="Arial", fontsize=9];

        # ==========================================
        #  NIVEL 1: FUENTES Y EXTRACCIÓN (HISTÓRICO)
        # ==========================================
        subgraph cluster_lvl1 {
            label = "NIVEL 1: FUENTES DE DATOS (HISTÓRICO)"; style="filled"; color="#ECEFF1"; fontcolor="#455A64";
            
            subgraph cluster_mod1 {
                label = "ARCHIVOS EXCEL"; style="filled"; fillcolor="#FFF3E0"; color="#FF9800";
                ExcelFact [label="📊 Facturación", shape=note, fillcolor="#FFE0B2"];
                ExcelMarg [label="📊 Margen Operación", shape=note, fillcolor="#FFE0B2"];
                ExcelRes [label="📊 Resultados", shape=note, fillcolor="#FFE0B2"];
                
                ExcelFact -> ExcelMarg -> ExcelRes [style=invis, weight=100];
            }
            
            subgraph cluster_mod2 {
                label = "ETL / EXTRACCIÓN"; style="filled"; fillcolor="#E0F7FA"; color="#006064";
                PythonExtractor [label="🐍 Extractor Python", shape=component, fillcolor="#B2EBF2", penwidth=2];
            }
            
            ExcelRes -> PythonExtractor [style=invis, weight=100];
        }

        # ==========================================
        #  NIVEL 2: BASE DE DATOS (BACKEND)
        # ==========================================
        subgraph cluster_mod3 {
            label = "NIVEL 2: SUPABASE BACKEND"; style="filled,dashed"; fillcolor="#E1F5FE"; color="#0277BD";
            
            SupabaseDB [label="🗄️ Base de Datos Supabase", shape=cylinder, fillcolor="#81D4FA", penwidth=2];
            
            subgraph cluster_tables {
                label = "ESQUEMA SQL"; style="filled"; fillcolor="#B3E5FC"; color="#0288D1";
                TableViajes [label="🚢 Tabla: viajes", shape=record, fillcolor="white"];
                TableCostos [label="💰 Tabla: control_presupuestal", shape=record, fillcolor="white"];
                
                TableViajes -> TableCostos [style=invis, weight=100];
            }
            
            SupabaseDB -> TableViajes [style=invis, weight=100];
        }

        # ==========================================
        #  NIVEL 3: MOTORES Y LÓGICA (BACKEND/FRONTEND)
        # ==========================================
        subgraph cluster_lvl3 {
            label = "NIVEL 3: MOTORES DE CÁLCULO"; style="filled,dashed"; fillcolor="#F3E5F5"; color="#9C27B0";
            
            MotorMargen [label="⚙️ Cálculo de Margen", shape=component, fillcolor="#D1C4E9"];
            MotorForecast [label="📈 Forecast Engine", shape=component, fillcolor="#CE93D8"];
            
            MotorMargen -> MotorForecast [style=invis, weight=100];
        }

        # ==========================================
        #  NIVEL 4: FRONTEND E INTERFAZ USUARIO
        # ==========================================
        subgraph cluster_outputs {
            label = "NIVEL 4: STREAMLIT FRONTEND"; style="filled,dashed"; fillcolor="#FFF8E1"; color="#F57C00";
            
            StreamlitApp [label="🌐 Web App (Streamlit)", shape=component, fillcolor="#FFE082", penwidth=2];
            
            PageInputs [label="📝 Formularios (Nuevos Viajes)", shape=note, fillcolor="#FFF59D"];
            PageDashboard [label="📊 Dashboard Histórico", shape=note, fillcolor="#AED581"];
            PageForecast [label="🔮 Simulador Forecast", shape=note, fillcolor="#A5D6A7"];
            
            PageInputs -> PageDashboard -> PageForecast [style=invis, weight=100];
            StreamlitApp -> PageInputs [style=invis, weight=100];
        }
        
        # Enlaces reales
        PythonExtractor -> SupabaseDB;
        TableCostos -> MotorMargen [color="#1E88E5", constraint=false];
        MotorForecast -> StreamlitApp;
        
        ExcelFact -> PythonExtractor [constraint=false];
        ExcelMarg -> PythonExtractor [constraint=false];
        ExcelRes -> PythonExtractor [constraint=false];
        
        PythonExtractor -> SupabaseDB [label=" Inserción", constraint=false];
        SupabaseDB -> TableViajes [constraint=false];
        SupabaseDB -> TableCostos [constraint=false];
        
        TableViajes -> MotorMargen [color="#1E88E5", constraint=false];
        MotorMargen -> MotorForecast [style=dashed, constraint=false];
        
        StreamlitApp -> PageInputs [constraint=false];
        StreamlitApp -> PageDashboard [constraint=false];
        StreamlitApp -> PageForecast [constraint=false];
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
    generate_vertical_architecture()
