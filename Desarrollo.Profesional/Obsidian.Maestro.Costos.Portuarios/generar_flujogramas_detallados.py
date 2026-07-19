import graphviz
import os

def generate_detailed_diagrams():
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    data = {
        "CALLAO": {
            "FIXED_FLAT": [
                ("Clearance (In/Out)", "200", "$200.00"),
                ("Sanitary Inspection", "520", "$520.00"),
                ("Agency Fee", "1000", "$1,000.00"),
                ("Transportation", "200", "$200.00"),
                ("Comunication", "250", "$250.00")
            ],
            "PER_QTY": [
                ("Launch Hire", "85 * Lanchas", "85 * 4 = $340.00"),
                ("Coordinator on board", "225 * Turnos", "225 * 2 = $450.00")
            ],
            "PER_LOA_HOUR": [
                ("Dockage (APM)", "1.50 * LOA * Horas", "1.50 * 134 * 32 = $6,432.00")
            ],
            "PER_GRT": [
                ("Lighthouse Dues", "0.03 * GRT", "0.03 * 8259 = $247.77")
            ],
            "CONDITIONAL_MAX": [
                ("Pilotage", "MAX(750, 0.055 * GRT) * Maniobras", "MAX(750, 454) * 2 = $1,500.00"),
                ("Remolcaje", "MAX(800, 0.065 * GRT) * Maniobras", "MAX(800, 537) * 4 = $3,200.00")
            ]
        },
        "MARCONA": {
            "FIXED_FLAT": [
                ("Remolcaje Stand by", "16000", "$16,000.00 (Opcional)"),
                ("Clearance", "200", "$200.00"),
                ("Sanitary Inspection", "670", "$670.00"),
                ("Launch for Authorities", "200", "$200.00"),
                ("Agency Fee", "1400", "$1,400.00"),
                ("Transportation", "200", "$200.00"),
                ("Comunication", "250", "$250.00")
            ],
            "PER_QTY": [
                ("Practicaje + Launch", "4980 * Maniobras", "4980 * 2 = $9,960.00"),
                ("Linesmen", "4450 * Maniobras", "4450 * 2 = $8,900.00"),
                ("Towage", "18000 * Maniobras", "18000 * 2 = $36,000.00"),
                ("Port toll", "75 * Maniobras", "75 * 2 = $150.00"),
                ("Coordinator on board", "225 * Dias", "225 * 2 = $450.00")
            ],
            "PER_HOUR": [
                ("Launch Hire (Stand By)", "40 * Horas", "40 * 32 = $1,280.00")
            ],
            "PER_GRT": [
                ("Lighthouse Dues", "0.03 * GRT", "0.03 * 8259 = $247.77")
            ]
        },
        "ILO": {
            "FIXED_FLAT": [
                ("Sanitary Inspection", "520", "$520.00"),
                ("Clearance", "200", "$200.00"),
                ("Agency Fee", "900", "$900.00"),
                ("Transportation", "200", "$200.00"),
                ("Comunication", "200", "$200.00")
            ],
            "PER_QTY": [
                ("Practicaje", "1500 * Maniobras", "1500 * 2 = $3,000.00"),
                ("Linesmen", "170 * Maniobras", "170 * 4 = $680.00"),
                ("Remolcaje Posicionamiento", "700 * Maniobras", "700 * 2 = $1,400.00"),
                ("Port toll", "75 * Maniobras", "75 * 2 = $150.00"),
                ("Coordinator", "200 * Turnos", "200 * 2 = $400.00"),
                ("Lancha amarre/desamarre", "375 * Maniobras", "375 * 4 = $1,500.00")
            ],
            "PER_HOUR": [
                ("Lancha autoridades", "90 * Horas (min 4)", "90 * 4 = $360.00"),
                ("Lancha coordinador", "85 * Horas (min 4)", "85 * 4 = $340.00")
            ],
            "PER_GRT": [
                ("Towage (PSA/Petranso)", "0.16 * GRT * Maniobras", "0.16 * 8259 * 2 = $2,642.88"),
                ("Lighthouse Dues", "0.03 * GRT", "0.03 * 8259 = $247.77")
            ]
        },
        "MATARANI": {
            "FIXED_FLAT": [
                ("Linesmen (Plana)", "357.30", "$357.30"),
                ("Launch autoridades", "155", "$155.00"),
                ("Sanitary Inspection", "670", "$670.00"),
                ("Clearance", "200", "$200.00"),
                ("Agency Fee", "1100", "$1,100.00"),
                ("Transportation", "200", "$200.00"),
                ("Comunication", "200", "$200.00")
            ],
            "PER_QTY": [
                ("Cargo de Acceso", "70 * Cantidad", "70 * 4 = $280.00"),
                ("Port toll", "75 * Maniobras", "75 * 2 = $150.00"),
                ("Coordinator on board", "225 * Dias", "225 * 2 = $450.00")
            ],
            "PER_LOA_HOUR": [
                ("Dockage (Tisur)", "0.65 * LOA * Horas", "0.65 * 134 * 32 = $2,787.20")
            ],
            "PER_GRT": [
                ("Lighthouse Dues", "0.03 * GRT", "0.03 * 8259 = $247.77")
            ],
            "PERCENTAGE_SURCHARGE": [
                ("Servicio Integral (Pilot+Tugs+Launch)", "(5550 * Maniobras) * Recargo%", "(5550 * 2) * 1.0 = $11,100.00")
            ]
        },
        "BARQUITO": {
            "FIXED_FLAT": [
                ("Port toll", "75", "$75.00"),
                ("Launch Anchorage", "430", "$430.00"),
                ("Launch In/Out", "380 * 2", "$760.00"),
                ("Linesmen transport", "350", "$350.00"),
                ("Authorities Transport", "550", "$550.00"),
                ("Authorities Charges", "700", "$700.00"),
                ("Immigration", "28", "$28.00"),
                ("Health", "130", "$130.00"),
                ("Loading Master", "2450", "$2,450.00"),
                ("Agency Fee", "1200", "$1,200.00")
            ],
            "PER_QTY": [
                ("Towage", "6500 * Maniobras", "6500 * 5 = $32,500.00"),
                ("Pilot Insurance", "110 * Cantidad", "110 * 3 = $330.00"),
                ("Linesmen", "1000 * Maniobras", "1000 * 2 = $2,000.00"),
                ("Launch amarre/desamarre", "720 * Maniobras", "720 * 6 = $4,320.00"),
                ("Pilot Transport", "140 * Cantidad", "140 * 3 = $420.00")
            ],
            "PER_HOUR": [
                ("Dockage", "71.92 * Horas", "71.92 * 28 = $2,013.76"),
                ("Launch Stand by", "100 * Horas", "100 * 28 = $2,800.00"),
                ("Tugboat stand by", "648 * Horas", "648 * 28 = $18,144.00"),
                ("Tugboat Navigation", "745 * Horas", "745 * 8 = $5,960.00")
            ],
            "PER_GRT": [
                ("Pilotage", "(GRT/8259) * 1151.01", "$1,151.01"),
                ("Ligth Dues", "1.56 * GRT", "1.56 * 8259 = $12,884.04")
            ]
        },
        "MEJILLONES_TGN": {
            "FIXED_FLAT": [
                ("Launch Anchorage", "390", "$390.00"),
                ("Launch pier usage", "420", "$420.00"),
                ("Launch In/Out", "420 * 2", "$840.00"),
                ("Authorities Transport", "650", "$650.00"),
                ("Authorities Charges", "700", "$700.00"),
                ("ISPS Fee", "1140.35", "$1,140.35"),
                ("Immigration", "25", "$25.00"),
                ("Health", "110", "$110.00"),
                ("Loading Master", "3264.40", "$3,264.40"),
                ("Agency Fee", "1200", "$1,200.00")
            ],
            "PER_QTY": [
                ("Towage", "2800 * Maniobras", "2800 * 4 = $11,200.00"),
                ("Pilot Insurance", "110 * Cantidad", "110 * 3 = $330.00"),
                ("Linesmen", "871.25 * Maniobras", "871.25 * 2 = $1,742.50"),
                ("Launch recepcion", "450 * Cantidad", "450 * 4 = $1,800.00"),
                ("Pilot Transport", "165 * Cantidad", "165 * 3 = $495.00")
            ],
            "PER_LOA_HOUR": [
                ("Dockage", "3.99 * LOA * Horas", "3.99 * 134 * 36 = $19,270.74")
            ],
            "PER_GRT": [
                ("Pilotage", "(GRT/8259) * 1207.38", "$1,207.38"),
                ("Ligth Dues", "1.60 * GRT", "1.60 * 8259 = $13,214.40")
            ]
        },
        "MEJILLONES_INTERACID": {
            "FIXED_FLAT": [
                ("Launch Anchorage", "390", "$390.00"),
                ("Launch pier usage", "420", "$420.00"),
                ("Launch embarcadero", "280", "$280.00"),
                ("Launch In/Out", "420 * 2", "$840.00"),
                ("Authorities Transport", "650", "$650.00"),
                ("Authorities Charges", "700", "$700.00"),
                ("ISPS Fee", "1273", "$1,273.00"),
                ("Immigration", "28", "$28.00"),
                ("Health", "120", "$120.00"),
                ("Agency Fee", "1200", "$1,200.00")
            ],
            "PER_QTY": [
                ("Towage", "2800 * Maniobras", "2800 * 4 = $11,200.00"),
                ("Pilot Insurance", "110 * Cantidad", "110 * 3 = $330.00"),
                ("Linesmen", "870 * Maniobras", "870 * 2 = $1,740.00"),
                ("Launch recepcion", "450 * Cantidad", "450 * 4 = $1,800.00"),
                ("Pilot Transport", "165 * Cantidad", "165 * 3 = $495.00")
            ],
            "PER_HOUR": [
                ("Dockage", "702 * Horas", "702 * 36 = $25,272.00"),
                ("Loading Master", "86 * Horas", "86 * 36 = $3,096.00")
            ],
            "PER_GRT": [
                ("Pilotage", "(GRT/8259) * 1151.01", "$1,151.01"),
                ("Ligth Dues", "1.60 * GRT", "1.60 * 8259 = $13,214.40")
            ]
        },
        "MEJILLONES_TERQUIM": {
            "FIXED_FLAT": [
                ("Launch embarcadero", "280", "$280.00"),
                ("Launch Anchorage", "390", "$390.00"),
                ("Launch In/Out", "420 * 2", "$840.00"),
                ("Launch pier usage", "420", "$420.00"),
                ("Authorities Transport", "650", "$650.00"),
                ("ISPS Fee", "1191", "$1,191.00"),
                ("Authorities Charges", "700", "$700.00"),
                ("Immigration", "28", "$28.00"),
                ("Health", "120", "$120.00"),
                ("Loading Master", "2923", "$2,923.00"),
                ("Agency Fee", "1200", "$1,200.00"),
                ("Hose conection", "2500", "$2,500.00")
            ],
            "PER_QTY": [
                ("Towage", "2800 * Maniobras", "2800 * 4 = $11,200.00"),
                ("Pilot Insurance", "110 * Cantidad", "110 * 3 = $330.00"),
                ("Linesmen", "801 * Maniobras", "801 * 2 = $1,602.00"),
                ("Launch recepcion", "450 * Cantidad", "450 * 4 = $1,800.00"),
                ("Pilot Transport", "165 * Cantidad", "165 * 3 = $495.00")
            ],
            "PER_LOA_HOUR": [
                ("Dockage", "5.72 * LOA * Horas", "5.72 * 134 * 30 = $23,021.86")
            ],
            "PER_GRT": [
                ("Pilotage", "(GRT/8259) * 1151.01", "$1,151.01"),
                ("Ligth Dues", "1.60 * GRT", "1.60 * 8259 = $13,214.40")
            ]
        }
    }

    colors = {
        "FIXED_FLAT": "#FFF9C4",
        "PER_QTY": "#BBDEFB",
        "PER_HOUR": "#FFE0B2",
        "PER_GRT": "#C8E6C9",
        "PER_LOA_HOUR": "#D1C4E9",
        "CONDITIONAL_MAX": "#FFCCBC",
        "PERCENTAGE_SURCHARGE": "#F8BBD0"
    }

    output_dir = os.path.dirname(os.path.abspath(__file__))

    for port, categories in data.items():
        dot = graphviz.Digraph(name=port)
        dot.attr(rankdir='LR', splines='ortho', nodesep='0.6', ranksep='1.5')
        dot.attr('node', shape='record', style='filled,rounded', fontname='Arial', fontsize='10')
        
        # Root node
        dot.node(port, f"{{PUERTO / TERMINAL|{port.replace('_', ' ')}}}", fillcolor="#ECEFF1", fontname='Arial-Bold', fontsize='12')

        for calc_type, items in categories.items():
            color = colors.get(calc_type, "#FFFFFF")
            # Category node
            cat_node = f"{port}_{calc_type}"
            dot.node(cat_node, f"{{Tipo Cálculo|{calc_type}}}", fillcolor=color, fontname='Arial-Bold')
            dot.edge(port, cat_node)

            # Items nodes
            for (name, formula, ej) in items:
                item_id = f"{port}_{calc_type}_{name.replace(' ', '_').replace('/', '_').replace('+', '_').replace('$', '_').replace('.', '_').replace('(', '_').replace(')', '_')}"
                label = f"{{{name}|Fórmula: {formula}\\nEj: {ej}}}"
                dot.node(item_id, label, fillcolor="#FFFFFF", style="filled")
                dot.edge(cat_node, item_id)

        try:
            filename = f"Flujograma_Detallado_{port}"
            file_path = dot.render(filename=os.path.join(output_dir, filename), format='pdf', view=False, cleanup=True)
            print(f"Generado exitosamente: {os.path.abspath(file_path)}")
        except Exception as e:
            print(f"Error generando flujograma para {port}: {e}")

if __name__ == "__main__":
    generate_detailed_diagrams()
