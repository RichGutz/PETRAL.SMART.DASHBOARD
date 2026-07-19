import graphviz
import os

def generate_barquito_diagram():
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    dot = graphviz.Digraph(name="BARQUITO_LINEAL")
    dot.attr(rankdir='LR', splines='ortho', ranksep='0.6', nodesep='0.2')
    dot.attr('node', shape='box', style='filled,rounded', fontname='Arial', fontsize='10')

    # Data structure: (ID, Item_Name, F1_Procedencia, F2_Casino, F3_Matematica, Ejemplo)
    items = [
        # A) Shifting Expenses
        ("PILOT_IN", "Pilotage IN", "Base: $1,151.01", "Regla Horario TBD", "Fórmula GRT", "$1,151.01"),
        ("PILOT_OUT", "Pilotage OUT", "Base: $1,151.01", "Regla Horario TBD", "Fórmula GRT", "$1,151.01"),
        ("TOW_IN", "Towage IN", "Base: $6,500", "Regla Horario TBD", "2. PER_QTY", "$13,000.00"),
        ("TOW_OUT", "Towage OUT", "Base: $6,500", "Regla Horario TBD", "2. PER_QTY", "$13,000.00"),
        ("P_INS_IN", "Pilot Insurance IN", "Base: $110", "No aplica", "1. FIXED_FLAT", "$110.00"),
        ("P_INS_OUT", "Pilot Insurance OUT", "Base: $110", "No aplica", "1. FIXED_FLAT", "$110.00"),
        ("LINES_IN", "Linesmen IN", "Base: $1,000", "Regla Horario TBD", "1. FIXED_FLAT", "$1,000.00"),
        ("LINES_OUT", "Linesmen OUT", "Base: $1,000", "Regla Horario TBD", "1. FIXED_FLAT", "$1,000.00"),
        ("PORT_TOLL", "Port toll / Land transp", "Base: $75", "No aplica", "1. FIXED_FLAT", "$75.00"),
        
        # B) General Port Expenses
        ("LIGHT", "Light Dues", "Base: $1.56", "No aplica", "4. PER_GRT", "1.56 * GRT"),
        ("DOCK", "Dockage", "Base: $71.92", "No aplica", "3. PER_HOUR", "71.92 * 28 = $2,013.76"),
        ("LAUNCH_M_IN", "Launch amarre IN", "Base: $720", "Regla Horario TBD", "2. PER_QTY", "$720.00"),
        ("LAUNCH_M_OUT", "Launch desamarre OUT", "Base: $720", "Regla Horario TBD", "2. PER_QTY", "$720.00"),
        ("LAUNCH_SB", "Launch Stand by", "Base: $100", "No aplica", "3. PER_HOUR", "100 * 28 = $2,800.00"),
        ("LAUNCH_ANC", "Launch Anchorage", "Base: $430", "Regla Horario TBD", "3. PER_HOUR", "$430.00"),
        ("LAUNCH_CL_IN", "Launch Clearance IN", "Base: $380", "No aplica", "1. FIXED_FLAT", "$380.00"),
        ("LAUNCH_CL_OUT", "Launch Clearance OUT", "Base: $380", "No aplica", "1. FIXED_FLAT", "$380.00"),
        ("P_TRANS_IN", "Pilot Transport IN", "Base: $140", "No aplica", "1. FIXED_FLAT", "$140.00"),
        ("P_TRANS_OUT", "Pilot Transport OUT", "Base: $140", "No aplica", "1. FIXED_FLAT", "$140.00"),
        ("L_TRANS_IN", "Linesmen Transp. IN", "Base: $350", "No aplica", "1. FIXED_FLAT", "$350.00"),
        ("L_TRANS_OUT", "Linesmen Transp. OUT", "Base: $350", "No aplica", "1. FIXED_FLAT", "$350.00"),
        ("TUG_SB", "Tugboat stand by", "Base: $648", "No aplica", "3. PER_HOUR", "648 * 28 = $18,144.00"),
        ("TUG_NAV", "Tugboat Navigation", "Base: $745", "No aplica", "2. PER_QTY", "745 * 8 = $5,960.00"),
        ("AUTH_T_IN", "Authorities Transp IN", "Base: $550", "No aplica", "1. FIXED_FLAT", "$550.00"),
        ("AUTH_T_OUT", "Authorities Transp OUT", "Base: $550", "No aplica", "1. FIXED_FLAT", "$550.00"),
        ("AUTH_C_IN", "Authorities Charges IN", "Base: $700", "No aplica", "1. FIXED_FLAT", "$700.00"),
        ("AUTH_C_OUT", "Authorities Charges OUT", "Base: $700", "No aplica", "1. FIXED_FLAT", "$700.00"),
        ("IMMIG", "Immigration Auth.", "Base: $28", "No aplica", "1. FIXED_FLAT", "$28.00"),
        ("HEALTH", "Health Auth.", "Base: $130", "No aplica", "1. FIXED_FLAT", "$130.00"),
        
        # C) Agency Expenses
        ("LOAD_M", "Loading Master", "Base: $2,450", "No aplica", "1. FIXED_FLAT", "$2,450.00"),
        ("AGENCY", "Agency Fee", "Base: $1,200", "No aplica", "1. FIXED_FLAT", "$1,200.00"),
    ]

    dot.node("PORT", "BARQUITO (Terminal)", fillcolor="#ECEFF1", fontname='Arial-Bold', fontsize='12')

    for item_id, name, f1, f2, f3, example in items:
        dot.node(item_id, name, fillcolor="#BBDEFB", fontname='Arial-Bold', fontsize='11')
        dot.edge("PORT", item_id)
        
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

    # Force vertical ordering for all nodes in the same column
    with dot.subgraph() as s:
        s.attr(rank='same')
        for item_id, _, _, _, _, _ in items:
            s.node(item_id)
        for i in range(len(items) - 1):
            s.edge(items[i][0], items[i+1][0], style='invis')
            
    with dot.subgraph() as s:
        s.attr(rank='same')
        for item_id, _, _, _, _, _ in items:
            s.node(f"{item_id}_F1")
        for i in range(len(items) - 1):
            s.edge(f"{items[i][0]}_F1", f"{items[i+1][0]}_F1", style='invis')
            
    with dot.subgraph() as s:
        s.attr(rank='same')
        for item_id, _, _, _, _, _ in items:
            s.node(f"{item_id}_F2")
        for i in range(len(items) - 1):
            s.edge(f"{items[i][0]}_F2", f"{items[i+1][0]}_F2", style='invis')
            
    with dot.subgraph() as s:
        s.attr(rank='same')
        for item_id, _, _, _, _, _ in items:
            s.node(f"{item_id}_F3")
        for i in range(len(items) - 1):
            s.edge(f"{items[i][0]}_F3", f"{items[i+1][0]}_F3", style='invis')

    with dot.subgraph() as s:
        s.attr(rank='same')
        for item_id, _, _, _, _, _ in items:
            s.node(f"{item_id}_EX")
        for i in range(len(items) - 1):
            s.edge(f"{items[i][0]}_EX", f"{items[i+1][0]}_EX", style='invis')

    output_dir = os.path.dirname(os.path.abspath(__file__))
    filename = "Flujograma_Lineal_BARQUITO"
    
    try:
        file_path = dot.render(filename=os.path.join(output_dir, filename), format='pdf', view=False, cleanup=True)
        print(f"Generado exitosamente: {os.path.abspath(file_path)}")
    except Exception as e:
        print(f"Error generando flujograma: {e}")

if __name__ == "__main__":
    generate_barquito_diagram()
