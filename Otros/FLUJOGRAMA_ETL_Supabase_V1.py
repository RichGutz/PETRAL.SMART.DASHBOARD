import graphviz
import os

def generate_etl_flowchart():
    base_name = "FLUJOGRAMA_ETL_Supabase_V1"
    output_filename = base_name
    
    print(f"Generando Flujograma ETL: {output_filename}.pdf")
    
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
        nodesep=1.0;
        ranksep=0.8;
        
        node [shape=box, style="filled,rounded", fontname="Arial", fontsize=10];
        edge [fontname="Arial", fontsize=9];

        # ==========================================
        #  NIVEL 1: ARCHIVOS ORIGEN (LEGACY)
        # ==========================================
        subgraph cluster_lvl1 {
            label = "NIVEL 1: DECENAS DE ARCHIVOS MENSUALES (LEGACY)"; style="filled"; color="#ECEFF1"; fontcolor="#455A64";
            
            subgraph cluster_files {
                label = "INPUTS DE EXCEL"; style="filled"; fillcolor="#FFF3E0"; color="#FF9800";
                F1 [label="📊 Facturación\\n(Viajes, Fechas, B/L, Tarifas)", shape=note, fillcolor="#FFE0B2"];
                F2 [label="📊 Margen Operación\\n(Consolidado Mensual de Costos y Fletes)", shape=note, fillcolor="#FFE0B2"];
                F3 [label="📊 Resultado (Presupuestal)\\n(P&L Detallado Mensual: Personal, Bunker, etc.)", shape=note, fillcolor="#FFE0B2"];
            }
        }

        # ==========================================
        #  NIVEL 2: ORQUESTADOR ETL (PYTHON)
        # ==========================================
        subgraph cluster_lvl2 {
            label = "NIVEL 2: MOTOR DE EXTRACCIÓN Y LIMPIEZA (ETL)"; style="filled,dashed"; fillcolor="#E0F7FA"; color="#006064";
            
            BatchLoop [label="🔄 BATCH LOOP\\n(Iterar sobre todos los Excels del directorio)", shape=component, fillcolor="#80DEEA", penwidth=2];
            
            subgraph cluster_parsers {
                label = "PARSERS ESPECÍFICOS (PANDAS BOILERPLATE)"; style="filled"; fillcolor="#B2EBF2"; color="#00838F";
                ParseFact [label="🛠️ Parser Facturación\\n(Limpia cabeceras, extrae filas granulares)", shape=rect, fillcolor="white"];
                ParseMarg [label="🛠️ Parser Margen\\n(Mapea Meses en Columnas a Filas)", shape=rect, fillcolor="white"];
                ParseRes [label="🛠️ Parser Resultado\\n(Extrae Cuentas Contables y Valores Mensuales)", shape=rect, fillcolor="white"];
            }
            
            DataValidator [label="✅ Validador Pydantic\\n(Limpia NaNs, Formatea Fechas, Castea Floats)", shape=diamond, fillcolor="#4DD0E1"];
        }

        # ==========================================
        #  NIVEL 3: DESTINO (SUPABASE)
        # ==========================================
        subgraph cluster_lvl3 {
            label = "NIVEL 3: MODELO DE DATOS EN SUPABASE"; style="filled,dashed"; fillcolor="#E1F5FE"; color="#0277BD";
            
            SupabaseAPI [label="🚀 Supabase REST API / Client", shape=component, fillcolor="#81D4FA", penwidth=2];
            
            subgraph cluster_tables {
                label = "TABLAS RELACIONALES (SQL)"; style="filled"; fillcolor="#B3E5FC"; color="#0288D1";
                T_Viajes [label="🚢 tabla: viajes_facturacion\\n- id, nave, fecha, destino, tarifa, tons", shape=record, fillcolor="white"];
                T_Margen [label="💰 tabla: margen_mensual\\n- id, nave, mes, anio, freight, demurrage, bunker, port_cost", shape=record, fillcolor="white"];
                T_Presupuesto [label="📈 tabla: control_presupuestal\\n- id, nave, mes, anio, cuenta_contable, presupuesto, real", shape=record, fillcolor="white"];
            }
        }

        # Conexiones Lvl 1 a Lvl 2
        F1 -> BatchLoop;
        F2 -> BatchLoop;
        F3 -> BatchLoop;
        
        BatchLoop -> ParseFact;
        BatchLoop -> ParseMarg;
        BatchLoop -> ParseRes;
        
        ParseFact -> DataValidator;
        ParseMarg -> DataValidator;
        ParseRes -> DataValidator;
        
        # Conexiones Lvl 2 a Lvl 3
        DataValidator -> SupabaseAPI [label=" Bulk Insert / Upsert", color="#00838F", penwidth=2];
        
        SupabaseAPI -> T_Viajes;
        SupabaseAPI -> T_Margen;
        SupabaseAPI -> T_Presupuesto;
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
