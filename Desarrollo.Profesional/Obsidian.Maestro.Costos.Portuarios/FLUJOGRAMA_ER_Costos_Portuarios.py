import graphviz
import os

def generate_er_diagram():
    output_filename = "ER_Costos_Portuarios"
    
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
        SUPPLIERS [label="{SUPPLIERS (Proveedores)|id (PK)\\nname (Ej: PSA, Petranso)}", fillcolor="#FFF9C4", color="#FBC02D"];
        COST_CONCEPTS [label="{COST_CONCEPTS (Rubros)|id (PK)\\nname (Ej: Towage)\\ncategory}", fillcolor="#C8E6C9", color="#388E3C"];
        
        PORT_COST_RULES [label="{PORT_COST_RULES (Motor de Reglas)|id (PK)\\nterminal_id (FK)\\ncost_concept_id (FK)\\nsupplier_id (FK)\\nsub_item_name (Ej: Stand By)\\ncalculation_type (Ej: PER_HOUR)\\nbase_rate (USD)\\nsecondary_rate\\nmin_quantity\\nallow_pass_through\\nis_optional}", fillcolor="#FFE0B2", color="#F57C00", penwidth=2];
        
        CALCULATOR_INPUTS [label="{CALCULATOR_INPUTS (Cantidades del Viaje)|id (PK)\\nterminal_id (FK)\\nvessel_grt\\nvessel_loa\\nqty_hours\\nqty_tugs\\n... (Inputs del Usuario)}", fillcolor="#E1BEE7", color="#8E24AA", style="filled,dashed"];

        # RELACIONES
        PORTS -> TERMINALS [label=" 1 : N ", arrowhead="crow", dir="forward"];
        TERMINALS -> PORT_COST_RULES [label=" 1 : N ", arrowhead="crow", dir="forward"];
        COST_CONCEPTS -> PORT_COST_RULES [label=" 1 : N ", arrowhead="crow", dir="forward"];
        SUPPLIERS -> PORT_COST_RULES [label=" 1 : N (Opcional) ", arrowhead="crow", dir="forward", style="dashed"];
        
        TERMINALS -> CALCULATOR_INPUTS [label=" 1 : N ", arrowhead="crow", dir="forward"];
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
