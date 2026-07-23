import graphviz
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def setup_graphviz():
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

def generate_lineal_pdf(port_name, title, items):
    setup_graphviz()
    
    dot = graphviz.Digraph(name=f"{port_name}_LINEAL_V4")
    dot.attr(rankdir='LR', splines='ortho', ranksep='0.6', nodesep='0.2')
    dot.attr('node', shape='box', style='filled,rounded', fontname='Arial', fontsize='10')

    dot.node("PORT", title, fillcolor="#ECEFF1", fontname='Arial-Bold', fontsize='12')

    for item_id, name, f1, f2, f3, equation in items:
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
        dot.node(ex_id, f"Ecuación Genérica (Toda la Flota)\\n{equation}", fillcolor="#F5F5F5")
        dot.edge(f3_id, ex_id)

    # Forzar alineación en columnas paralelas
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

    output_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Maestro.Costos.Portuarios"
    filename = f"Flujograma_Lineal_{port_name}"
    
    try:
        file_path = dot.render(filename=os.path.join(output_dir, filename), format='pdf', view=False, cleanup=True)
        print(f"   ✅ PDF Genérico Puro Generado: {file_path}")
    except Exception as e:
        print(f"   ❌ Error generando PDF para {port_name}: {e}")

def main():
    print("=" * 80)
    print(" 📊 GENERANDO FLUJOGRAMAS LINEALES 100% GENÉRICOS SIN BARCO EN PDF")
    print("=" * 80)

    # 1. CALLAO
    callao_items = [
        ("P_IN", "Pilotage IN", "Base: $750", "OT (18-24h): +25%\\nOT (00-07h/Fer): +50%", "6. CONDITIONAL_MAX", "Costo = MAX(Tarifa_Base * (1+OT), 0.055 * GRT)"),
        ("P_OUT", "Pilotage OUT", "Base: $750", "OT (18-24h): +25%\\nOT (00-07h/Fer): +50%", "6. CONDITIONAL_MAX", "Costo = MAX(Tarifa_Base * (1+OT), 0.055 * GRT)"),
        ("T_IN", "Towage IN", "Base: $800", "Petranso (2 remolques)", "2. PER_QTY", "Costo = Tarifa_Base * QTY_Remolques"),
        ("T_OUT", "Towage OUT", "Base: $800", "Petranso (2 remolques)", "2. PER_QTY", "Costo = Tarifa_Base * QTY_Remolques"),
        ("ACC_IN", "Access Berth IN", "Base: $70", "Atraque", "2. PER_QTY", "Costo = Tarifa_Base * QTY_Eventos"),
        ("ACC_OUT", "Access Berth OUT", "Base: $70", "Desatraque", "2. PER_QTY", "Costo = Tarifa_Base * QTY_Eventos"),
        ("LIGHT", "Lighthouse Dues", "Nacional: $0.03\\nExtranjero: $0.12", "No aplica", "4. PER_GRT", "Costo = Rate_Procedencia * GRT"),
        ("DOCK", "Dockage (APM)", "Base: $1.50", "No aplica", "5. PER_LOA_HOUR", "Costo = Tarifa_Base * LOA * Horas_Puerto"),
        ("LAUNCH", "Launch Hire", "Base: $85", "Cierre Puerto: +50%", "2. PER_QTY", "Costo = Tarifa_Base * QTY_Lanchas * (1+Cierre)"),
        ("COORD", "Coordinator", "Base: $225", "Feriados: +50%", "2. PER_QTY", "Costo = Tarifa_Base * QTY_Turnos * (1+Feriado)"),
        ("CLEAR", "Clearance In/Out", "Base: $200", "Obligatorio", "1. FIXED_FLAT", "Costo = Tarifa_Base (Flat)"),
        ("SAN", "Sanitary Insp.", "Base: $520", "Sanidad Marítima", "1. FIXED_FLAT", "Costo = Tarifa_Base (Flat)"),
        ("AGENCY", "Agency Fee", "Base: $1,000", "Días > 5: +$150/d", "1. FIXED_FLAT", "Costo = Tarifa_Base + MAX(0, Días-5)*150"),
        ("TRANS", "Transportation", "Base: $200", "Transtotal", "1. FIXED_FLAT", "Costo = Tarifa_Base (Flat)"),
        ("COM", "Comunication", "Base: $250", "Transtotal", "1. FIXED_FLAT", "Costo = Tarifa_Base (Flat)"),
    ]
    generate_lineal_pdf("CALLAO", "CALLAO (APM Terminals) — Modelo Serial Genérico (Toda la Flota)", callao_items)

    # 2. MARCONA
    marcona_items = [
        ("AGREEMENT", "Acuerdo Marco Petral", "Southern / PSA / SPCC", "Tarifa Preferencial Cerrada", "AGREED_FLAT", "Costo = $36,000.00 USD (Flat para toda la Flota)"),
        ("P_PSA", "Practicaje + Launch", "Base: $4,980", "PSA Marine", "2. PER_QTY", "Costo = Tarifa_Base * QTY_Maniobras"),
        ("LINES", "Linesmen", "Base: $4,450", "PSA Marine (2 lanchas)", "2. PER_QTY", "Costo = Tarifa_Base * QTY_Maniobras"),
        ("TOW", "Towage Remolques", "Base: $15,000", "PSA Marine", "2. PER_QTY", "Costo = Tarifa_Base * QTY_Maniobras"),
        ("PORT_TOLL", "Port Toll", "Base: $75", "Transtotal", "2. PER_QTY", "Costo = Tarifa_Base * QTY_Maniobras"),
        ("LIGHT", "Lighthouse Dues", "Nacional: $0.03", "SPCC Nacional", "4. PER_GRT", "Costo = Rate_Procedencia * GRT"),
        ("STBY", "Launch Stand By", "Base: $40/h", "Exceso > 48h recargo", "3. PER_HOUR", "Costo = Tarifa_Base * Horas_Puerto"),
        ("AGENCY", "Agency Fee", "Base: $1,400", "Transtotal", "1. FIXED_FLAT", "Costo = Tarifa_Base (Flat)"),
    ]
    generate_lineal_pdf("MARCONA", "MARCONA (PSA / SPCC) — Modelo Serial Genérico (Toda la Flota)", marcona_items)

    # 3. MATARANI
    matarani_items = [
        ("SERV_INT", "Servicio Integral PSA", "Base: $5,550", "Addenda -39.31%", "AGREED_RATE", "Costo = Tarifa_Addenda * QTY_Maniobras"),
        ("RECARGO_25", "Recargo Integral 25%", "Base: Addenda", "Overtime 18-24h", "PERCENTAGE", "Costo = 25% * Tarifa_Addenda * Maniobras_OT"),
        ("RECARGO_50", "Recargo Integral 50%", "Base: Addenda", "OT 00-07h / Dom / Fer", "PERCENTAGE", "Costo = 50% * Tarifa_Addenda * Maniobras_OT"),
        ("ACCESO", "Cargo Acceso", "Base: $70", "4 eventos", "2. PER_QTY", "Costo = Tarifa_Base * QTY_Eventos"),
        ("LINES", "Linesmen", "Base: $357.30", "Transtotal", "1. FIXED_FLAT", "Costo = Tarifa_Base (Flat)"),
        ("DOCK", "Dockage (Tisur)", "Base: $0.65", "LOA * Horas", "5. PER_LOA_HOUR", "Costo = Tarifa_Base * LOA * Horas_Puerto"),
        ("BRENT", "Indexación Brent", "Rango: $51-$160", "Crudo Brent USD/bbl", "BRENT_TABLE", "Costo = Incremento_Brent(USD/bbl) * QTY_Remolques"),
        ("VOL_DISC", "Descuento Volumen", "Naves 13-18: -6%", "Naves 19+: -7.5%", "VOLUME_REBATE", "Costo_Final = Costo * (1 - Rebate_Anual)"),
        ("AGENCY", "Agency Fee", "Base: $1,100", "Transtotal", "1. FIXED_FLAT", "Costo = Tarifa_Base (Flat)"),
    ]
    generate_lineal_pdf("MATARANI", "MATARANI (Tisur / PSA Marine) — Modelo Serial Genérico (Toda la Flota)", matarani_items)

    # 4. ILO
    ilo_items = [
        ("P_ILO", "Practicaje", "Base: $1,500", "Port Operations", "2. PER_QTY", "Costo = Tarifa_Base * QTY_Maniobras"),
        ("DOCK_SPCC", "Muellaje SPCC", "Base: $0.05", "Amarre $300 + $0.05*GRT*días", "4. PER_GRT", "Costo = Fee_Amarre + 0.05 * GRT * Días_Muelle"),
        ("T_PSA", "Remolcaje PSA Marine", "Base: $0.16/GRT", "Mínimo $1,800/mnvr", "6. CONDITIONAL_MAX", "Costo = MAX(Tarifa_Mínima, 0.16 * GRT * QTY_Tugs)"),
        ("POS_PSA", "Posicionamiento PSA", "Base: $700", "2 Maniobras", "2. PER_QTY", "Costo = Tarifa_Base * QTY_Posicionamientos"),
        ("T_PETRANSO", "Remolcaje Petranso", "Base: $0.18/GRT", "Desc. 10%", "4. PER_GRT", "Costo = 0.18 * GRT * QTY_Tugs * (1 - Desc)"),
        ("POS_PETRANSO", "Posicionamiento Petranso", "Base: $630", "Desc. 10%", "2. PER_QTY", "Costo = Tarifa_Base * QTY_Posicionamientos"),
        ("OT_PSA", "Recargo Overtime PSA", "Base: 25%", "Lun-Sáb / Dom / Fer", "PERCENTAGE", "Costo = 25% * Remolcaje_PSA"),
        ("OT_PETRANSO", "Recargo Overtime Petranso", "Base: 25%", "Lun-Sáb / Dom / Fer", "PERCENTAGE", "Costo = 25% * Remolcaje_Petranso"),
        ("LANCHAS", "Lanchas Operativas", "Base: Variada", "Transporte / Amarre", "2. PER_QTY", "Costo = Tarifa_Lancha * QTY_Lanchas"),
        ("AGENCY", "Agency Fee", "Base: $900", "Transtotal", "1. FIXED_FLAT", "Costo = Tarifa_Base (Flat)"),
    ]
    generate_lineal_pdf("ILO", "ILO (SPCC / Enapu) — Modelo Serial Genérico (Toda la Flota)", ilo_items)

    print("\n" + "=" * 80)
    print(" 🎉 FLUJOGRAMAS 100% GENÉRICOS PUROS EN PDF GENERADOS PARA TODA LA FLOTA")
    print("=" * 80)

if __name__ == "__main__":
    main()
