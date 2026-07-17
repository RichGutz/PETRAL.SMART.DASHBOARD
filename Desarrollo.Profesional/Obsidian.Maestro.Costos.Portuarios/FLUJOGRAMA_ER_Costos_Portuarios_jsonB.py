import graphviz
import os

def generate_er_diagram():
    output_filename = "ER_Costos_Portuarios_jsonB"
    
    # Path setup para Graphviz en Windows
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    dot_code = """
    digraph ERCostosPortuarios {
        rankdir=TB;
        splines=ortho;
        nodesep=0.8;
        ranksep=1.2;
        
        node [shape=record, style="filled,rounded", fontname="Arial", fontsize=10];
        edge [fontname="Arial", fontsize=9, color="#555555"];

        # TABLAS
        PORTS [label="{PORTS (Puertos)|id (PK)\\nname (Ej: Callao)\\ncountry}", fillcolor="#E3F2FD", color="#1E88E5"];
        TERMINALS [label="{TERMINALS (Terminales)|id (PK)\\nport_id (FK)\\nname (Ej: APM, Terquim)}", fillcolor="#BBDEFB", color="#1976D2"];
        VESSELS [label="{VESSELS (Buques)|vessel_id (PK)\\nvessel_name\\ndwt\\n...}", fillcolor="#D1C4E9", color="#5E35B1"];
        
        SUPPLIERS [label="{SUPPLIERS (Proveedores)|id (PK)\\nname (Ej: PSA, Petranso)}", fillcolor="#FFF9C4", color="#FBC02D"];
        COST_CONCEPTS [label="{COST_CONCEPTS (Rubros)|id (PK)\\nname (Ej: Towage)\\ncategory}", fillcolor="#C8E6C9", color="#388E3C"];
        
        PORT_COST_RULES [label="{PORT_COST_RULES (Motor de Reglas)|id (PK)\\nterminal_id (FK)\\ncost_concept_id (FK)\\nsupplier_id (FK)\\nsub_item_name (Ej: Stand By)\\ncalculation_type (Ej: PER_HOUR)\\nbase_rate (USD)\\nsecondary_rate\\nmin_quantity\\nallow_pass_through\\nis_optional}", fillcolor="#FFE0B2", color="#F57C00", penwidth=2];
        
        VESSEL_TERMINAL_OPERATIONS [label="{VESSEL_TERMINAL_OPERATIONS (Matriz Op. JSONB)|port_id (PK, FK)\\nterminal_id (PK, FK)\\nvessel_id (PK, FK)\\nritmo_carga (Universal)\\nritmo_descarga (Universal)\\namarre_hrs (Universal)\\ndesamarre_hrs (Universal)\\nparameters (Formato JSONB)}", fillcolor="#FFCCBC", color="#D84315", penwidth=2];
        
        CALCULATOR_INPUTS [label="{CALCULATOR_INPUTS (Cantidades del Viaje)|id (PK)\\nterminal_id (FK)\\nvessel_grt\\nqty_hours\\n... (Inputs del Usuario)}", fillcolor="#E1BEE7", color="#8E24AA", style="filled,dashed"];

        # RELACIONES
        PORTS -> TERMINALS [label=" 1 : N ", arrowhead="crow", dir="forward"];
        TERMINALS -> PORT_COST_RULES [label=" 1 : N ", arrowhead="crow", dir="forward"];
        COST_CONCEPTS -> PORT_COST_RULES [label=" 1 : N ", arrowhead="crow", dir="forward"];
        SUPPLIERS -> PORT_COST_RULES [label=" 1 : N (Opcional) ", arrowhead="crow", dir="forward", style="dashed"];
        
        PORTS -> VESSEL_TERMINAL_OPERATIONS [label=" 1 : N ", arrowhead="crow", dir="forward"];
        TERMINALS -> VESSEL_TERMINAL_OPERATIONS [label=" 1 : N ", arrowhead="crow", dir="forward"];
        VESSELS -> VESSEL_TERMINAL_OPERATIONS [label=" 1 : N ", arrowhead="crow", dir="forward"];
        
        PORT_COST_RULES -> VESSEL_TERMINAL_OPERATIONS [label=" El JSONB mapea IDs de reglas ", color="#D84315", style="dashed", dir="forward", fontcolor="#D84315"];
        
        TERMINALS -> CALCULATOR_INPUTS [label=" 1 : N ", arrowhead="crow", dir="forward"];
        VESSEL_TERMINAL_OPERATIONS -> CALCULATOR_INPUTS [label=" Inyecta JSONB al simulador ", color="#D84315", style="dashed", dir="forward", fontcolor="#D84315"];
        CALCULATOR_INPUTS -> PORT_COST_RULES [label=" Cruce Matemático en Backend ", color="#D32F2F", style="dotted", dir="both", fontcolor="#D32F2F"];
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
    generate_er_diagram()
