import graphviz
import os

def generate_pdf_petral_architecture():
    base_name = "FLUJOGRAMA_Arquitectura_Petral_V1"
    output_filename = base_name
    
    print(f"Generando Arquitectura Petral V1: {output_filename}.pdf")
    
    # Path setup para Graphviz en Windows
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
        nodesep=1.0;
        ranksep=0.8;
        
        node [shape=box, style="filled,rounded", fontname="Arial", fontsize=10];
        edge [fontname="Arial", fontsize=9];

        # ==========================================
        #  NIVEL 1: FUENTES Y EXTRACCIÓN (HISTÓRICO)
        # ==========================================
        subgraph cluster_lvl1 {
            label = "NIVEL 1: FUENTES DE DATOS (HISTÓRICO)"; style="filled"; color="#ECEFF1"; fontcolor="#455A64";
            
            subgraph cluster_mod1 {
                label = "ARCHIVOS EXCEL"; style="filled"; fillcolor="#FFF3E0"; color="#FF9800";
                ExcelFact [label="📊 Facturación\\n(Viajes granulares)", shape=note, fillcolor="#FFE0B2"];
                ExcelMarg [label="📊 Margen Operación\\n(Agregados)", shape=note, fillcolor="#FFE0B2"];
            }
            
            subgraph cluster_mod2 {
                label = "ETL / EXTRACCIÓN"; style="filled"; fillcolor="#E0F7FA"; color="#006064";
                PythonExtractor [label="🐍 Extractor Python\\n(Pandas Boilerplate)", shape=component, fillcolor="#B2EBF2", penwidth=2];
            }
            
            ExcelFact -> PythonExtractor;
            ExcelMarg -> PythonExtractor;
        }

        # ==========================================
        #  NIVEL 2: BASE DE DATOS (BACKEND)
        # ==========================================
        subgraph cluster_mod3 {
            label = "NIVEL 2: SUPABASE BACKEND"; style="filled,dashed"; fillcolor="#E1F5FE"; color="#0277BD";
            
            SupabaseDB [label="🗄️ Base de Datos Supabase", shape=cylinder, fillcolor="#81D4FA", penwidth=2];
            
            subgraph cluster_tables {
                label = "ESQUEMA SQL"; style="filled"; fillcolor="#B3E5FC"; color="#0288D1";
                TableViajes [label="🚢 Tabla: viajes\\n(Ingresos, Fletes, Demoras)", shape=record, fillcolor="white"];
                TableCostos [label="💰 Tabla: costos_mensuales\\n(Búnker, Gastos Port.)", shape=record, fillcolor="white"];
            }
            
            PythonExtractor -> SupabaseDB [label=" Inserción (Una vez)"];
            SupabaseDB -> TableViajes;
            SupabaseDB -> TableCostos;
        }

        # ==========================================
        #  NIVEL 3: MOTORES Y LÓGICA (BACKEND/FRONTEND)
        # ==========================================
        subgraph cluster_lvl3 {
            label = "NIVEL 3: MOTORES DE CÁLCULO"; style="filled,dashed"; fillcolor="#F3E5F5"; color="#9C27B0";
            
            MotorMargen [label="⚙️ Cálculo de Margen\\n(Ingresos - Egresos)", shape=component, fillcolor="#D1C4E9"];
            MotorForecast [label="📈 Forecast Engine\\n(Proyección a Fin de Año)", shape=component, fillcolor="#CE93D8"];
            
            TableViajes -> MotorMargen [color="#1E88E5"];
            TableCostos -> MotorMargen [color="#1E88E5"];
        }

        # ==========================================
        #  NIVEL 4: FRONTEND E INTERFAZ USUARIO
        # ==========================================
        subgraph cluster_outputs {
            label = "NIVEL 4: STREAMLIT FRONTEND"; style="filled,dashed"; fillcolor="#FFF8E1"; color="#F57C00";
            
            StreamlitApp [label="🌐 Web App (Streamlit)", shape=component, fillcolor="#FFE082", penwidth=2];
            
            PageInputs [label="📝 Formularios\\n(Nuevos Viajes/Costos)", shape=note, fillcolor="#FFF59D"];
            PageDashboard [label="📊 Dashboard Histórico\\n(Gráficos y KPIs)", shape=note, fillcolor="#AED581"];
            PageForecast [label="🔮 Simulador Forecast\\n(Ajuste de Variables)", shape=note, fillcolor="#A5D6A7"];
            
            StreamlitApp -> PageInputs;
            StreamlitApp -> PageDashboard;
            StreamlitApp -> PageForecast;
            
            MotorMargen -> PageDashboard [color="#9C27B0"];
            MotorMargen -> MotorForecast [style=dashed];
            MotorForecast -> PageForecast [color="#9C27B0"];
            
            # Flujo de nuevos datos
            PageInputs -> SupabaseDB [label=" Inserta nuevos datos", color="blue", constraint=false];
        }
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
    generate_pdf_petral_architecture()
