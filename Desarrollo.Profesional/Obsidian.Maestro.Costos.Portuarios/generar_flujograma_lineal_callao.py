import graphviz
import os

def generate_linear_diagram():
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    dot = graphviz.Digraph(name="CALLAO_LINEAL")
    # rankdir='LR' ensures left-to-right flow
    dot.attr(rankdir='LR', splines='ortho', ranksep='0.8', nodesep='0.2')
    dot.attr('node', shape='box', style='filled,rounded', fontname='Arial', fontsize='10')

    # Column 0: Puerto
    dot.node("PORT", "CALLAO (APM)", fillcolor="#ECEFF1", fontname='Arial-Bold', fontsize='12')

    # Data structure: (ID, Item_Name, Calc_Type, Formula_and_JSON, Excel_Example)
    items = [
        ("P_IN", "Pilotage IN", "6. CONDITIONAL_MAX", "JSONB Base: $750\\nOT: +25% | Fer: $1700\\nFórmula: MAX(Tarifa_JSON, 0.055*GRT)", "Ej: OT (+25%)\\nMAX(937.50, 454.25) = $937.50"),
        ("P_OUT", "Pilotage OUT", "6. CONDITIONAL_MAX", "JSONB Base: $750\\nOT: +25% | Fer: $1700\\nFórmula: MAX(Tarifa_JSON, 0.055*GRT)", "Ej: Feriado\\nMAX(1700, 454.25) = $1,700.00"),
        ("T_IN", "Towage IN", "6. CONDITIONAL_MAX", "JSONB Base: $800\\nOT: TBD | Fer: TBD\\nFórmula: MAX(Tarifa_JSON, 0.065*GRT)*Tugs", "Ej: Regular\\nMAX(800, 536.84) * 2 = $1,600.00"),
        ("T_OUT", "Towage OUT", "6. CONDITIONAL_MAX", "JSONB Base: $800\\nOT: TBD | Fer: TBD\\nFórmula: MAX(Tarifa_JSON, 0.065*GRT)*Tugs", "Ej: Regular\\nMAX(800, 536.84) * 2 = $1,600.00"),
        ("LIGHT", "Lighthouse Dues", "4. PER_GRT", "JSONB Base: $0.03\\nProcedencia Ext: $0.12\\nFórmula: Tarifa_JSON * GRT", "0.03 * 8259 = $247.77"),
        ("DOCK", "Dockage (APM)", "5. PER_LOA_HOUR", "JSONB Base: $1.50\\nFórmula: Tarifa_JSON * LOA * Hrs", "1.50 * 134 * 32 = $6,432.00"),
        ("L_IN", "Launch IN", "2. PER_QTY", "JSONB Base: $85\\nFórmula: Tarifa_JSON * Lanchas", "85 * 2 = $170.00"),
        ("L_OUT", "Launch OUT", "2. PER_QTY", "JSONB Base: $85\\nFórmula: Tarifa_JSON * Lanchas", "85 * 2 = $170.00"),
        ("COORD", "Coordinator", "2. PER_QTY", "JSONB Base: $225\\nFórmula: Tarifa_JSON * Turnos", "225 * 2 = $450.00"),
        ("CLEAR_IN", "Clearance IN", "1. FIXED_FLAT", "JSONB Base: $0\\nOrigen Extranjero: $200\\nFórmula: Tarifa_JSON", "$200.00"),
        ("CLEAR_OUT", "Clearance OUT", "1. FIXED_FLAT", "JSONB Base: $0\\nDestino Extranjero: $200\\nFórmula: Tarifa_JSON", "$200.00"),
        ("SAN_IN", "Sanitary Insp. IN", "1. FIXED_FLAT", "JSONB Base: $0\\nOrigen Extranjero: $520\\nFórmula: Tarifa_JSON", "$520.00"),
        ("SAN_OUT", "Sanitary Insp. OUT", "1. FIXED_FLAT", "JSONB Base: $0\\nDestino Extranjero: $520\\nFórmula: Tarifa_JSON", "$520.00"),
        ("AGENCY", "Agency Fee", "1. FIXED_FLAT", "JSONB Base: $1000", "$1,000.00"),
        ("TRANS", "Transportation", "1. FIXED_FLAT", "JSONB Base: $200", "$200.00"),
        ("COM", "Comunication", "1. FIXED_FLAT", "JSONB Base: $250", "$250.00"),
    ]

    for item_id, name, calc_type, formula, example in items:
        # Col 1: Item
        dot.node(item_id, name, fillcolor="#BBDEFB", fontname='Arial-Bold')
        dot.edge("PORT", item_id)
        
        # Col 2: Tipo de Calculo
        type_id = f"{item_id}_TYPE"
        dot.node(type_id, calc_type, fillcolor="#C8E6C9")
        dot.edge(item_id, type_id)

        # Col 3: Formula y Reglas
        form_id = f"{item_id}_FORM"
        dot.node(form_id, formula, fillcolor="#FFF9C4")
        dot.edge(type_id, form_id)

        # Col 4: Ejemplo Excel
        ex_id = f"{item_id}_EX"
        dot.node(ex_id, example, fillcolor="#F5F5F5")
        dot.edge(form_id, ex_id)

    output_dir = os.path.dirname(os.path.abspath(__file__))
    filename = "Flujograma_Lineal_CALLAO"
    
    try:
        file_path = dot.render(filename=os.path.join(output_dir, filename), format='pdf', view=False, cleanup=True)
        print(f"Generado exitosamente: {os.path.abspath(file_path)}")
    except Exception as e:
        print(f"Error generando flujograma: {e}")

if __name__ == "__main__":
    generate_linear_diagram()
