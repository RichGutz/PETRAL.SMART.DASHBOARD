import graphviz
import os

def generate_V3_diagram():
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    dot = graphviz.Digraph(name="CALLAO_LINEAL_V3")
    dot.attr(rankdir='LR', splines='ortho', ranksep='0.6', nodesep='0.2')
    dot.attr('node', shape='box', style='filled,rounded', fontname='Arial', fontsize='10')

    items = [
        ("P_IN", "Pilotage IN", "Base: $750", "OT: +25%\\nFer: $1700", "6. CONDITIONAL_MAX\\nMAX(Tarifa, 0.055*GRT)", "Ej: Overtime\\nMAX(937.50, 454.25)\\n= $937.50"),
        ("P_OUT", "Pilotage OUT", "Base: $750", "OT: +25%\\nFer: $1700", "6. CONDITIONAL_MAX\\nMAX(Tarifa, 0.055*GRT)", "Ej: Feriado\\nMAX(1700, 454.25)\\n= $1,700.00"),
        ("T_IN", "Towage IN", "Base: $800", "OT: TBD\\nFer: TBD", "6. CONDITIONAL_MAX\\nMAX(Tarifa, 0.065*GRT)*Tugs", "Ej: Regular\\nMAX(800, 536.84) * 2\\n= $1,600.00"),
        ("T_OUT", "Towage OUT", "Base: $800", "OT: TBD\\nFer: TBD", "6. CONDITIONAL_MAX\\nMAX(Tarifa, 0.065*GRT)*Tugs", "Ej: Regular\\nMAX(800, 536.84) * 2\\n= $1,600.00"),
        ("LIGHT", "Lighthouse Dues", "Nacional: $0.03\\nExtranjero: $0.12", "No aplica", "4. PER_GRT\\nTarifa * GRT", "Ej: Nac.\\n0.03 * 8259 = $247.77"),
        ("DOCK", "Dockage (APM)", "Base: $1.50", "No aplica", "5. PER_LOA_HOUR\\nTarifa * LOA * Hrs", "1.50 * 134 * 32\\n= $6,432.00"),
        ("L_IN", "Launch IN", "Base: $85", "OT: TBD\\nFer: TBD", "2. PER_QTY\\nTarifa * Lanchas", "85 * 2 = $170.00"),
        ("L_OUT", "Launch OUT", "Base: $85", "OT: TBD\\nFer: TBD", "2. PER_QTY\\nTarifa * Lanchas", "85 * 2 = $170.00"),
        ("COORD", "Coordinator", "Base: $225", "No aplica", "2. PER_QTY\\nTarifa * Turnos", "225 * 2 = $450.00"),
        ("CLEAR_IN", "Clearance IN", "Nacional: $0\\nExtranjero: $200", "No aplica", "1. FIXED_FLAT\\nTarifa Fija", "Ej: Extranjero\\n$200.00"),
        ("CLEAR_OUT", "Clearance OUT", "Nacional: $0\\nExtranjero: $200", "No aplica", "1. FIXED_FLAT\\nTarifa Fija", "Ej: Extranjero\\n$200.00"),
        ("SAN_IN", "Sanitary Insp. IN", "Nacional: $0\\nExtranjero: $520", "No aplica", "1. FIXED_FLAT\\nTarifa Fija", "Ej: Extranjero\\n$520.00"),
        ("SAN_OUT", "Sanitary Insp. OUT", "Nacional: $0\\nExtranjero: $520", "No aplica", "1. FIXED_FLAT\\nTarifa Fija", "Ej: Extranjero\\n$520.00"),
        ("AGENCY", "Agency Fee", "Base: $1000", "No aplica", "1. FIXED_FLAT\\nTarifa Fija", "$1,000.00"),
        ("TRANS", "Transportation", "Base: $200", "No aplica", "1. FIXED_FLAT\\nTarifa Fija", "$200.00"),
        ("COM", "Comunication", "Base: $250", "No aplica", "1. FIXED_FLAT\\nTarifa Fija", "$250.00"),
    ]

    for item_id, name, f1, f2, f3, example in items:
        dot.node(item_id, name, fillcolor="#BBDEFB", fontname='Arial-Bold', fontsize='11')
        
        f1_id = f"{item_id}_F1"
        dot.node(f1_id, f"1. Filtro Propiedad\\n{f1}", fillcolor="#E1BEE7")
        dot.edge(item_id, f1_id)

        f2_id = f"{item_id}_F2"
        dot.node(f2_id, f"2. Filtro Casino (Hora)\\n{f2}", fillcolor="#FFE0B2")
        dot.edge(f1_id, f2_id)

        f3_id = f"{item_id}_F3"
        dot.node(f3_id, f"3. Filtro Matemático\\n{f3}", fillcolor="#C8E6C9")
        dot.edge(f2_id, f3_id)

        ex_id = f"{item_id}_EX"
        dot.node(ex_id, f"Subtotal (Moquegua)\\n{example}", fillcolor="#F5F5F5")
        dot.edge(f3_id, ex_id)

    output_dir = os.path.dirname(os.path.abspath(__file__))
    filename = "Flujograma_Lineal_V3_CALLAO"
    
    try:
        file_path = dot.render(filename=os.path.join(output_dir, filename), format='pdf', view=False, cleanup=True)
        print(f"Generado exitosamente: {os.path.abspath(file_path)}")
    except Exception as e:
        print(f"Error generando flujograma: {e}")

if __name__ == "__main__":
    generate_V3_diagram()
