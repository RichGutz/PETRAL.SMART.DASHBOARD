import graphviz
import os

def generate_callao_jsonb_diagram():
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    dot = graphviz.Digraph(name="CALLAO_JSONB")
    dot.attr(rankdir='LR', splines='ortho', nodesep='0.6', ranksep='1.5')
    dot.attr('node', shape='record', style='filled,rounded', fontname='Arial', fontsize='10')

    # Root
    dot.node("CALLAO", "{PUERTO / TERMINAL|CALLAO (APM)}", fillcolor="#ECEFF1", fontname='Arial-Bold', fontsize='12')

    colors = {
        "FIXED_FLAT": "#FFF9C4",
        "PER_QTY": "#BBDEFB",
        "PER_LOA_HOUR": "#D1C4E9",
        "PER_GRT": "#C8E6C9",
        "CONDITIONAL_MAX": "#FFCCBC"
    }

    # Data structure with JSONB details
    data = {
        "CONDITIONAL_MAX": [
            ("Pilotage_IN", "$750.00", "Overtime: +25% (Pct)\\nFeriado: $1700 (Abs)", "MAX([Tarifa JSONB], 0.055*GRT)"),
            ("Pilotage_OUT", "$750.00", "Overtime: +25% (Pct)\\nFeriado: $1700 (Abs)", "MAX([Tarifa JSONB], 0.055*GRT)"),
            ("Towage_IN", "$800.00", "Overtime: $ TBD / % TBD\\nFeriado: $ TBD", "MAX([Tarifa JSONB], 0.065*GRT) * Tugs"),
            ("Towage_OUT", "$800.00", "Overtime: $ TBD / % TBD\\nFeriado: $ TBD", "MAX([Tarifa JSONB], 0.065*GRT) * Tugs")
        ],
        "PER_QTY": [
            ("Launch_IN", "$85.00", "Overtime: TBD\\nFeriado: TBD", "[Tarifa JSONB] * Lanchas"),
            ("Launch_OUT", "$85.00", "Overtime: TBD\\nFeriado: TBD", "[Tarifa JSONB] * Lanchas"),
            ("Coordinator", "$225.00", "No aplica Casino", "[Tarifa JSONB] * Turnos")
        ],
        "PER_LOA_HOUR": [
            ("Dockage_APM", "$1.50", "No aplica Casino", "[Tarifa JSONB] * LOA * Horas")
        ],
        "PER_GRT": [
            ("Lighthouse_Dues", "$0.03 (Nac)\\n$0.12 (Ext)", "No aplica Casino", "[Tarifa JSONB] * GRT")
        ],
        "FIXED_FLAT": [
            ("Clearance (In/Out)", "$200.00", "No aplica Casino", "[Tarifa JSONB]"),
            ("Sanitary Inspection", "$520.00", "No aplica Casino", "[Tarifa JSONB]"),
            ("Agency Fee", "$1000.00", "No aplica Casino", "[Tarifa JSONB]"),
            ("Transportation", "$200.00", "No aplica Casino", "[Tarifa JSONB]"),
            ("Comunication", "$250.00", "No aplica Casino", "[Tarifa JSONB]")
        ]
    }

    for calc_type, items in data.items():
        color = colors.get(calc_type, "#FFFFFF")
        cat_node = f"CALLAO_{calc_type}"
        dot.node(cat_node, f"{{Tipo Cálculo|{calc_type}}}", fillcolor=color, fontname='Arial-Bold')
        dot.edge("CALLAO", cat_node)

        for name, default_rate, rules, formula in items:
            item_id = f"CALLAO_{calc_type}_{name.replace(' ', '_').replace('/', '_').replace('+', '_').replace('$', '_').replace('(', '_').replace(')', '_')}"
            
            # 3 compartments: Name | JSONB Rules | Formula
            label = f"{{{name}|JSONB Default: {default_rate}\\nReglas Casino: {rules}|Fórmula: {formula}}}"
            
            dot.node(item_id, label, fillcolor="#FFFFFF", style="filled")
            dot.edge(cat_node, item_id)

    output_dir = os.path.dirname(os.path.abspath(__file__))
    filename = "Flujograma_JSONB_CALLAO"
    
    try:
        file_path = dot.render(filename=os.path.join(output_dir, filename), format='pdf', view=False, cleanup=True)
        print(f"Generado exitosamente: {os.path.abspath(file_path)}")
    except Exception as e:
        print(f"Error generando flujograma: {e}")

if __name__ == "__main__":
    generate_callao_jsonb_diagram()
