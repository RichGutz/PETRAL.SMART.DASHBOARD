import graphviz
import os

def generate_future_state_flowchart():
    base_name = "FLUJOGRAMA_EstadoFuturo_V1"
    output_filename = base_name
    
    print(f"Generando Flujograma Estado Futuro: {output_filename}.pdf")
    
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    dot_code = """
    digraph FutureState {
        rankdir=TB;
        splines=ortho;
        nodesep=0.5;
        ranksep=1.0;
        compound=true;
        
        node [shape=box, style="filled,rounded", fontname="Arial", fontsize=10, margin="0.2,0.1"];
        edge [fontname="Arial", fontsize=9];

        # Estructura invisible para cascada vertical
        node [shape=point, width=0, height=0, style=invis];
        s1 -> s2 -> s3 -> s4 [style=invis, weight=1000];

        # Reset node style for actual nodes
        node [shape=box, width=auto, height=auto, style="filled,rounded"];

        # ==========================================
        #  NIVEL 1: USUARIOS (STAKEHOLDERS)
        # ==========================================
        subgraph cluster_lvl1 {
            label = "NIVEL 1: USUARIOS HUMANOS (Inputs Manuales)"; style="filled"; color="#ECEFF1"; fontcolor="#455A64";
            s1; 
            
            U1 [label="👨‍💼 Operaciones\\n(Carga Viajes, Fechas, B/L, Fletes)", shape=ellipse, fillcolor="#FFCC80"];
            U2 [label="👩‍💼 S. Gálvez / J. Neyra / M.E. Castro\\n(Ingreso de Demoras, Costos Portuarios)", shape=ellipse, fillcolor="#FFCC80"];
            U3 [label="🏢 Navitranso\\n(Ingreso Control Presupuestal, Bunker, Personal)", shape=ellipse, fillcolor="#FFCC80"];
            
            # Stacked vertical para mantener diagrama angosto
            U1 -> U2 -> U3 [style=invis, weight=10];
        }

        # ==========================================
        #  NIVEL 2: FRONTEND APP (STREAMLIT)
        # ==========================================
        subgraph cluster_lvl2 {
            label = "NIVEL 2: SISTEMA FRONTEND (STREAMLIT)"; style="filled,dashed"; fillcolor="#FFF3E0"; color="#E65100";
            s2;
            
            AppRouter [label="🌐 Autenticación & Enrutador", shape=component, fillcolor="#FFE0B2", penwidth=2];
            
            subgraph cluster_forms {
                label = "MÓDULOS DE INGRESO (UI)"; style="filled"; fillcolor="#FFECB3"; color="#FF8F00";
                FormViajes [label="📝 Pantalla de Nuevo Viaje", shape=rect, fillcolor="white"];
                FormCostos [label="📝 Pantalla de Gastos Portuarios", shape=rect, fillcolor="white"];
                FormPresup [label="📝 Pantalla de Cuentas Contables", shape=rect, fillcolor="white"];
                
                FormViajes -> FormCostos -> FormPresup [style=invis, weight=10];
            }
        }

        # ==========================================
        #  NIVEL 3: BASE DE DATOS (SUPABASE)
        # ==========================================
        subgraph cluster_lvl3 {
            label = "NIVEL 3: BASE DE DATOS (SUPABASE)"; style="filled,dashed"; fillcolor="#E1F5FE"; color="#0277BD";
            s3; 
            
            SupabaseAPI [label="🚀 Supabase REST API", shape=component, fillcolor="#81D4FA", penwidth=2];
            
            T_Viajes [label="🚢 tabla: viajes_facturacion", shape=record, fillcolor="white"];
            T_Presupuesto [label="📈 tabla: control_presupuestal", shape=record, fillcolor="white"];
            
            T_Viajes -> T_Presupuesto [style=invis, weight=10];
        }

        # ==========================================
        #  NIVEL 4: REPORTERÍA Y FORECAST
        # ==========================================
        subgraph cluster_lvl4 {
            label = "NIVEL 4: REPORTERÍA Y FORECAST"; style="filled,dashed"; fillcolor="#F1F8E9"; color="#558B2F";
            s4; 
            
            DashboardEngine [label="⚙️ Lógica de Cálculo de Margen Operativo", shape=component, fillcolor="#C5E1A5"];
            ForecastEngine [label="🔮 Motor de Forecast (Proyección)", shape=component, fillcolor="#DCE775"];
            
            ViewDash [label="📊 Dashboard Ejecutivo (Lectura)", shape=note, fillcolor="#AED581"];
            ViewForecast [label="📈 Simulador Forecast (Interactivo)", shape=note, fillcolor="#AED581"];
            
            ViewDash -> ViewForecast [style=invis, weight=10];
        }

        # --- CONEXIONES REALES ---
        
        # Nivel 1 a Nivel 2
        U3 -> AppRouter [label=" Login"];
        
        AppRouter -> FormViajes;
        
        # Nivel 2 a Nivel 3
        FormPresup -> SupabaseAPI [label=" API POST / UPSERT", color="#E65100", penwidth=2];
        
        SupabaseAPI -> T_Viajes;
        
        # Nivel 3 a Nivel 4
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
    generate_future_state_flowchart()
