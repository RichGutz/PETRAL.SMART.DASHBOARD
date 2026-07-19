import graphviz
import os

def generate_port_diagrams():
    # Setup PATH for Graphviz
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    data = {
        "CALLAO": {
            "FIXED_FLAT": ["Clearance (In/Out)", "Sanitary Inspection", "Agency Fee", "Transportation", "Comunication"],
            "PER_QTY": ["Launch Hire", "Coordinator on board"],
            "PER_LOA_HOUR": ["Dockage (APM)"],
            "PER_GRT": ["Lighthouse Dues"],
            "CONDITIONAL_MAX": ["Pilotage", "Remolcaje"]
        },
        "MARCONA": {
            "FIXED_FLAT": ["Remolcaje Stand by", "Clearance", "Sanitary Inspection", "Launch for Authorities", "Agency Fee", "Transportation", "Comunication"],
            "PER_QTY": ["Practicaje + Launch", "Linesmen", "Towage", "Port toll", "Coordinator on board"],
            "PER_HOUR": ["Launch Hire (Stand By)"],
            "PER_GRT": ["Lighthouse Dues"]
        },
        "ILO": {
            "FIXED_FLAT": ["Sanitary Inspection", "Clearance", "Agency Fee", "Transportation", "Comunication"],
            "PER_QTY": ["Practicaje", "Linesmen", "Remolcaje Posicionamiento", "Port toll", "Coordinator", "Lancha amarre/desamarre"],
            "PER_HOUR": ["Lancha autoridades", "Lancha coordinador"],
            "PER_GRT": ["Towage (PSA/Petranso)", "Lighthouse Dues"]
        },
        "MATARANI": {
            "FIXED_FLAT": ["Linesmen (Plana)", "Launch autoridades", "Sanitary Inspection", "Clearance", "Agency Fee", "Transportation", "Comunication"],
            "PER_QTY": ["Cargo de Acceso", "Port toll", "Coordinator on board"],
            "PER_LOA_HOUR": ["Dockage (Tisur)"],
            "PER_GRT": ["Lighthouse Dues"],
            "PERCENTAGE_SURCHARGE": ["Servicio Integral (Pilot+Tugs+Launch)"]
        },
        "BARQUITO": {
            "FIXED_FLAT": ["Port toll", "Launch Anchorage", "Launch In/Out", "Linesmen transport", "Authorities Transport", "Authorities Charges", "Immigration", "Health", "Loading Master", "Agency Fee"],
            "PER_QTY": ["Towage", "Pilot Insurance", "Linesmen", "Launch amarre/desamarre", "Pilot Transport"],
            "PER_HOUR": ["Dockage ($71.92/hr)", "Launch Stand by", "Tugboat stand by", "Tugboat Navigation"],
            "PER_GRT": ["Pilotage", "Ligth Dues"]
        },
        "MEJILLONES_TGN": {
            "FIXED_FLAT": ["Launch Anchorage", "Launch pier usage", "Launch In/Out", "Authorities Transport", "Authorities Charges", "ISPS Fee", "Immigration", "Health", "Loading Master", "Agency Fee"],
            "PER_QTY": ["Towage", "Pilot Insurance", "Linesmen", "Launch recepcion", "Pilot Transport"],
            "PER_LOA_HOUR": ["Dockage ($3.99*LOA*Hr)"],
            "PER_GRT": ["Pilotage", "Ligth Dues"]
        },
        "MEJILLONES_INTERACID": {
            "FIXED_FLAT": ["Launch Anchorage", "Launch pier usage", "Launch embarcadero", "Launch In/Out", "Authorities Transport", "Authorities Charges", "ISPS Fee", "Immigration", "Health", "Agency Fee"],
            "PER_QTY": ["Towage", "Pilot Insurance", "Linesmen", "Launch recepcion", "Pilot Transport"],
            "PER_HOUR": ["Dockage ($702/hr)", "Loading Master ($86/hr)"],
            "PER_GRT": ["Pilotage", "Ligth Dues"]
        },
        "MEJILLONES_TERQUIM": {
            "FIXED_FLAT": ["Launch embarcadero", "Launch Anchorage", "Launch In/Out", "Launch pier usage", "Authorities Transport", "ISPS Fee", "Authorities Charges", "Immigration", "Health", "Loading Master", "Agency Fee", "Hose conection"],
            "PER_QTY": ["Towage", "Pilot Insurance", "Linesmen", "Launch recepcion", "Pilot Transport"],
            "PER_LOA_HOUR": ["Dockage ($5.72*LOA*Hr)"],
            "PER_GRT": ["Pilotage", "Ligth Dues"]
        }
    }

    colors = {
        "FIXED_FLAT": "#FFF9C4",          # Yellow
        "PER_QTY": "#BBDEFB",             # Blue
        "PER_HOUR": "#FFE0B2",            # Orange
        "PER_GRT": "#C8E6C9",             # Green
        "PER_LOA_HOUR": "#D1C4E9",        # Purple
        "CONDITIONAL_MAX": "#FFCCBC",     # Deep Orange
        "PERCENTAGE_SURCHARGE": "#F8BBD0" # Pink
    }

    output_dir = os.path.dirname(os.path.abspath(__file__))

    for port, categories in data.items():
        dot = graphviz.Digraph(name=port)
        dot.attr(rankdir='LR', splines='ortho', nodesep='0.5', ranksep='1.2')
        dot.attr('node', shape='record', style='filled,rounded', fontname='Arial', fontsize='10')
        
        # Root node
        dot.node(port, f"{{PUERTO/TERMINAL|{port.replace('_', ' ')}}}", fillcolor="#ECEFF1", fontname='Arial-Bold', fontsize='12')

        for calc_type, items in categories.items():
            color = colors.get(calc_type, "#FFFFFF")
            # Category node
            cat_node = f"{port}_{calc_type}"
            dot.node(cat_node, f"{calc_type}", fillcolor=color, fontname='Arial-Bold')
            dot.edge(port, cat_node)

            # Items nodes
            for item in items:
                item_id = f"{port}_{calc_type}_{item.replace(' ', '_').replace('/', '_').replace('+', '_').replace('$', '_').replace('.', '_').replace('(', '_').replace(')', '_')}"
                dot.node(item_id, f"{item}", fillcolor="#FFFFFF", style="filled")
                dot.edge(cat_node, item_id)

        try:
            filename = f"Diagrama_Calculo_{port}"
            file_path = dot.render(filename=os.path.join(output_dir, filename), format='pdf', view=False, cleanup=True)
            print(f"Generado exitosamente: {os.path.abspath(file_path)}")
        except Exception as e:
            print(f"Error generando flujograma para {port}: {e}")

if __name__ == "__main__":
    generate_port_diagrams()
