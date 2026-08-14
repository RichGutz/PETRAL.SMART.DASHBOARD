import os
import sys
import subprocess

def generate_multicotizador_flowchart():
    base_name = "FLUJOGRAMA_Arquitectura_Multicotizador_V1"
    output_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador"
    
    print(f"Generando Flujograma Vertical en Cascada (Niveles Apilados 1->6): {base_name}...")
    
    # Path setup para Graphviz en Windows
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    dot_content = """digraph MulticotizadorCascadeV1 {
    rankdir=TB;
    newrank=true;
    splines=polyline;
    nodesep=0.9;
    ranksep=1.8;
    
    node [shape=box, style="filled,rounded", fontname="Arial", fontsize=10, margin="0.18,0.14"];
    edge [fontname="Arial", fontsize=9];

    # ==========================================
    #  NIVEL 1: CAPA DE PERSISTENCIA (TOP)
    # ==========================================
    subgraph cluster_lvl1 {
        label = "NIVEL 1: CAPA DE PERSISTENCIA & MAESTROS (Supabase DB)"; 
        style="filled"; color="#ECEFF1"; fontcolor="#37474F"; fillcolor="#F5F5F5";
        
        { rank=same; DB_Vessels; DB_Ports; DB_PortCosts; DB_Bunker; DB_SavedQuotes; }
        
        DB_Vessels [label="🚢 MAESTRO BUQUES (vessels)\\nSpecs, DWT, Speed,\\nConsumos Sea/Idle/Port IFO & MDO", shape=cylinder, fillcolor="#FFE0B2"];
        DB_Ports [label="⚓ MAESTRO PUERTOS & RUTAS\\nCoordenadas, Países,\\nDistancias NM, Weather Factor %", shape=cylinder, fillcolor="#B2EBF2"];
        DB_PortCosts [label="💰 MAESTRO GASTOS PORTUARIOS\\nAgencia, Loading Master y\\nMuellaje desglosado (port_cost_static)", shape=cylinder, fillcolor="#B2EBF2", penwidth=2];
        DB_Bunker [label="🛢️ MAESTRO BÚNKER & CONTRATOS\\nPrecios Mercado & Contrato\\nIFO 380 / MDO 0.1%", shape=cylinder, fillcolor="#FFE082"];
        DB_SavedQuotes [label="📁 COTIZACIONES GUARDADAS\\n(routes_quotes / routes_clients)\\nRutas simuladas & versionado", shape=cylinder, fillcolor="#C8E6C9", penwidth=2];

        DB_Vessels -> DB_Ports -> DB_PortCosts -> DB_Bunker -> DB_SavedQuotes [style=invis];
    }

    # ==========================================
    #  NIVEL 2: SERVICIOS PROVIDERS & RETRIEVER (FRONTEND REACT)
    # ==========================================
    subgraph cluster_lvl2 {
        label = "NIVEL 2: PROVEEDORES DE DATOS, GRABADO Y RETRIEVER (Frontend Services)"; 
        style="filled,dashed"; color="#78909C"; fillcolor="#FAFAFA";
        
        { rank=same; S_Vessel; S_Bunker; S_Route; S_Port; S_Storage; S_Retriever; }

        S_Vessel [label="⚙️ vesselProviderService\\nResuelve specs y consumos del buque", shape=component, fillcolor="#C5CAE9"];
        S_Bunker [label="⚙️ bunkerProviderService\\nResuelve precios de combustible según fuente", shape=component, fillcolor="#FFE0B2"];
        S_Route [label="⚙️ routeDistancesService\\nResuelve distancias NM y clima por tramo", shape=component, fillcolor="#B2DFDB"];
        S_Port [label="⚙️ portCostsRatesService\\nResuelve ritmos, overheads y muellaje desglosado", shape=component, fillcolor="#B3E5FC", penwidth=2];
        S_Storage [label="💾 multicotizadorStorageService\\nEmpaqueta y graba cotizaciones\\nsimuladas en Supabase DB (/spot/save)", shape=component, fillcolor="#A5D6A7", penwidth=2];
        S_Retriever [label="🔍 multicotizadorRetrieverService\\nBusca, filtra y desempaqueta rutas/cotizaciones\\nguardadas para inyectar en el Multicotizador", shape=component, fillcolor="#81C784", penwidth=2];

        S_Vessel -> S_Bunker -> S_Route -> S_Port -> S_Storage -> S_Retriever [style=invis];
    }

    # ==========================================
    #  NIVEL 3: INTERFAZ DE USUARIO (REACT FRONTEND)
    # ==========================================
    subgraph cluster_lvl3 {
        label = "NIVEL 3: GRILLA Y INTERFAZ DE USUARIO (MultiCotizadorExcel.tsx)"; 
        style="filled"; color="#0284C7"; fontcolor="#F3E5F5";
        
        { rank=same; UI_FactSheet; UI_Grid; UI_MuellajeCell; UI_SaveModal; }

        UI_FactSheet [label="📋 Fact Sheet del Buque\\n(Parámetros técnicos editables)", shape=folder, fillcolor="#E0F2FE"];
        UI_Grid [label="📑 Grilla Principal Spreadsheet Live\\n(Tramos, Op Dest: Cargar / Descargar / None)", shape=box, fillcolor="white"];
        UI_MuellajeCell [label="⚖️ Celda Dual de Muellaje\\nSub-celda 1: Monto $ USD | Sub-celda 2: Checkbox [x]\\n(Visibilidad estricta si Monto > $0)", shape=box, fillcolor="#BBDEFB", penwidth=2];
        UI_SaveModal [label="💾 Modales Save / Load Quote\\n(Guardar y Cargar Cotización en UI)", shape=box, fillcolor="#E0E7FF"];

        UI_FactSheet -> UI_Grid -> UI_MuellajeCell -> UI_SaveModal [style=invis];
    }

    # ==========================================
    #  NIVEL 4: MOTOR DE CÁLCULO & PERSISTENCIA (GEEKSOFT ENGINE FASTAPI)
    # ==========================================
    subgraph cluster_lvl4 {
        label = "NIVEL 4: MOTOR DE CÁLCULO BACKEND (spot_engine.py & /spot/save)"; 
        style="filled,dashed"; color="#4E342E"; fillcolor="#EFEBE9";
        
        { rank=same; API_Endpoint; API_SaveEndpoint; Engine_Sim; Engine_PnL; }

        API_Endpoint [label="📡 Router HTTP API Calculate\\n/forecast/multicotizador/calculate", shape=cds, fillcolor="#D7CCC8", penwidth=2];
        API_SaveEndpoint [label="📡 Router HTTP API Save\\n/forecast/spot/save", shape=cds, fillcolor="#C8E6C9", penwidth=2];
        Engine_Sim [label="🧮 calculate_multicotizador_simulation()\\n• Días Mar (dist*(1+WF)/speed*24)\\n• Días Puerto ((Q/rate+overhead)/24)\\n• Consumos Búnker Sea/Idle/Load/Disch", shape=box, fillcolor="#FFE082"];
        Engine_PnL [label="💰 Consolidación PnL & Refacturación\\n• Revenue Total = Q * F\\n• Refacturación Muellaje (Suma 1x por Puerto)\\n• Voyage Result = Revenue - Hire - Bunker - Ports", shape=box, fillcolor="#AED581", penwidth=2];

        API_Endpoint -> API_SaveEndpoint -> Engine_Sim -> Engine_PnL [style=invis];
    }

    # ==========================================
    #  NIVEL 5: OUTPUTS FINANCIEROS Y TARJETAS AUDITORÍA
    # ==========================================
    subgraph cluster_lvl5 {
        label = "NIVEL 5: RESUMEN FINANCIERO Y AUDITORÍA"; 
        style="filled"; color="#33691E"; fillcolor="#F1F8E9";
        
        { rank=same; Card_Bunker; Card_PortCosts; Card_Financials; }

        Card_Bunker [label="🛢️ Card Búnker\\nConsumos e importes IFO/MDO", shape=rect, fillcolor="white"];
        Card_PortCosts [label="🏛️ Card Port Costs\\nAgencias + ↳ Loading Master + ↳ Muellaje", shape=rect, fillcolor="#FFF9C4", penwidth=2];
        Card_Financials [label="📊 Card Financial Voyage Result\\n(+) Revenue | (+) Refact. Muellaje | (-) Hire\\n(-) Búnker | (-) Port Costs ↳ Muellaje | P/L & TCE", shape=doubleoctagon, fillcolor="#C8E6C9", penwidth=2];

        Card_Bunker -> Card_PortCosts -> Card_Financials [style=invis];
    }

    # ==========================================
    #  NIVEL 6: PROTOCOLO DE CONTROL DE CALIDAD (BOTTOM)
    # ==========================================
    subgraph cluster_lvl6 {
        label = "NIVEL 6: BUCLE DE CONTROL DE CALIDAD (QC LOOP)"; 
        style="filled,dashed"; color="#1B5E20"; fillcolor="#E8F5E9";
        
        { rank=same; QC_Master; QC_Pass; }

        QC_Master [label="🛡️ run_triangular_qc_loop.py\\nControl Triangular: Vértice A (Excel) <-> Vértice B (API)\\n<-> Vértice C (UI) <-> Vértice D (Anti-Goles Mejillones $33,333)", shape=component, fillcolor="#A5D6A7", penwidth=2];
        QC_Pass [label="✅ CONVERGENCIA ABSOLUTA 100%\\n(Delta = 0.000000 | Cero Regresiones)", shape=note, fillcolor="#C8E6C9", penwidth=2];

        QC_Master -> QC_Pass [style=invis];
    }

    # ==========================================
    #  APILAMIENTO ESTRICTO DE NIVELES (TOP-TO-BOTTOM STACK)
    # ==========================================
    DB_Vessels -> S_Vessel -> UI_FactSheet -> API_Endpoint -> Card_Bunker -> QC_Master [style=invis, weight=100];

    # ==========================================
    #  CONEXIONES FUNCIONALES ENTRE NIVELES
    # ==========================================
    
    # 1. DB -> Providers & Retriever
    DB_Vessels -> S_Vessel [label=" Specs & Consumos"];
    DB_Ports -> S_Route [label=" Distancias NM"];
    DB_PortCosts -> S_Port [label=" Agencia & Muellaje"];
    DB_Bunker -> S_Bunker [label=" Precios Fuel"];
    DB_SavedQuotes -> S_Retriever [label=" Query Quotes"];

    # 2. Providers -> UI
    S_Vessel -> UI_FactSheet;
    S_Bunker -> UI_Grid;
    S_Route -> UI_Grid;
    S_Port -> UI_MuellajeCell [label=" Autofill Muellaje $33,333"];
    S_Retriever -> UI_SaveModal [label=" Cargar Estado", color="#2E7D32", penwidth=2];

    # 3. UI -> Engine API & Storage
    UI_MuellajeCell -> API_Endpoint [label=" Payload JSON", color="#0284C7", penwidth=2];
    UI_SaveModal -> S_Storage [label=" Guardar Cotización"];
    S_Storage -> API_SaveEndpoint [label=" /spot/save (Supabase DB)", color="#2E7D32", penwidth=2];

    # 4. Engine PnL -> Cards
    API_Endpoint -> Engine_Sim -> Engine_PnL [style=dashed];
    Engine_PnL -> Card_Bunker [color="#388E3C"];
    Engine_PnL -> Card_PortCosts [color="#388E3C"];
    Engine_PnL -> Card_Financials [color="#388E3C", penwidth=2];

    # 5. Financials -> QC Loop
    Card_Financials -> QC_Master [label=" Validación Cero Errores", color="#2E7D32", style=dashed];
    QC_Master -> QC_Pass [color="#2E7D32"];
}
"""

    dot_file_path = os.path.join(output_dir, f"{base_name}.dot")
    pdf_file_path = os.path.join(output_dir, f"{base_name}.pdf")
    png_file_path = os.path.join(output_dir, f"{base_name}.png")

    with open(dot_file_path, "w", encoding="utf-8") as f:
        f.write(dot_content)

    print(f"Archivo DOT guardado en: {dot_file_path}")

    # Ejecutar Graphviz via subprocess en UTF-8
    try:
        cmd_pdf = ["dot", "-Tpdf", dot_file_path, "-o", pdf_file_path]
        subprocess.run(cmd_pdf, check=True)
        print(f"[OK] PDF Generado Exitosamente: {pdf_file_path}")

        cmd_png = ["dot", "-Tpng", dot_file_path, "-o", png_file_path]
        subprocess.run(cmd_png, check=True)
        print(f"[OK] PNG Generado Exitosamente: {png_file_path}")

    except Exception as e:
        print(f"Error renderizando Graphviz con dot.exe: {e}")

if __name__ == "__main__":
    generate_multicotizador_flowchart()
