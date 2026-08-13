import os
import sys
import subprocess

def generate_multicotizador_flowchart():
    base_name = "FLUJOGRAMA_Arquitectura_Multicotizador_V1"
    output_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador"
    
    print(f"Generando Flujograma Integral de Arquitectura Multicotizador: {base_name}...")
    
    # Path setup para Graphviz en Windows
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    dot_content = """digraph MulticotizadorArchitectureV1 {
    rankdir=TB;
    splines=ortho;
    nodesep=1.0;
    ranksep=0.8;
    
    node [shape=box, style="filled,rounded", fontname="Arial", fontsize=10];
    edge [fontname="Arial", fontsize=9];

    # ==========================================
    #  NIVEL 1: CATÁLOGOS MAESTROS & FUENTES DE DATOS
    # ==========================================
    subgraph cluster_lvl1 {
        label = "NIVEL 1: CAPA DE PERSISTENCIA & MAESTROS (Supabase DB)"; style="filled"; color="#ECEFF1"; fontcolor="#455A64";
        
        subgraph cluster_db_vessels {
            label = "MAESTRO BUQUES"; style="filled"; fillcolor="#FFF3E0"; color="#FF9800";
            DB_Vessels [label="🚢 vessels\\n(DWT, DWCC, Consumos IFO/MDO,\\nSpeed, Rates, Limits)", shape=cylinder, fillcolor="#FFE0B2"];
        }
        
        subgraph cluster_db_ports {
            label = "MAESTRO PUERTOS & RUTAS"; style="filled"; fillcolor="#E0F7FA"; color="#006064";
            DB_Ports [label="⚓ ports / routes\\n(Coordenadas, Países,\\nDistancias NM, WF %)", shape=cylinder, fillcolor="#B2EBF2"];
        }

        subgraph cluster_db_costs {
            label = "MAESTRO GASTOS PORTUARIOS"; style="filled"; fillcolor="#E1F5FE"; color="#0277BD";
            DB_PortCosts [label="💰 port_cost_static\\n(Agencia, Loading Master,\\nMuellaje por Puerto/Barco)", shape=cylinder, fillcolor="#B2EBF2", penwidth=2];
        }

        subgraph cluster_db_bunker {
            label = "MAESTRO BÚNKER & CONTRATOS"; style="filled"; fillcolor="#FFF8E1"; color="#F57C00";
            DB_Bunker [label="🛢️ bunker_prices / contracts\\n(Precios Mercado & Contrato\\nIFO 380 / MDO 0.1%)", shape=cylinder, fillcolor="#FFE082"];
        }
    }

    # ==========================================
    #  NIVEL 2: SERVICIOS PROVIDERS DECOPLADOS (REACT FRONTEND)
    # ==========================================
    subgraph cluster_lvl2 {
        label = "NIVEL 2: CAPA DE SERVICIOS PROVIDERS (Decoupled Frontend Services)"; style="filled,dashed"; fillcolor="#FAFAFA"; color="#757575";
        
        subgraph cluster_prov_vessel {
            label = "VESSEL SERVICE"; style="filled"; fillcolor="#E8EAF6"; color="#3F51B5";
            S_Vessel [label="⚙️ vesselProviderService\\n(Resuelve specs del barco,\\nconsumos sea/idle/load/disch)", shape=component, fillcolor="#C5CAE9"];
        }

        subgraph cluster_prov_bunker {
            label = "BUNKER SERVICE"; style="filled"; fillcolor="#FFF3E0"; color="#E65100";
            S_Bunker [label="⚙️ bunkerProviderService\\n(Resuelve fuente de combustible:\\nContrato, Cotización, Maestro)", shape=component, fillcolor="#FFE0B2"];
        }

        subgraph cluster_prov_route {
            label = "ROUTE SERVICE"; style="filled"; fillcolor="#E0F2F1"; color="#004D40";
            S_Route [label="⚙️ routeDistancesService\\n(Resuelve distancias NM,\\nSearoute API, Weather Factor)", shape=component, fillcolor="#B2DFDB"];
        }

        subgraph cluster_prov_port {
            label = "PORT COSTS & RATES SERVICE"; style="filled"; fillcolor="#E1F5FE"; color="#01579B";
            S_Port [label="⚙️ portCostsRatesService\\n(Resuelve ritmos, overheads,\\nposicionamiento y muellaje desglosado)", shape=component, fillcolor="#B3E5FC", penwidth=2];
        }
    }

    # ==========================================
    #  NIVEL 3: INTERFAZ DE USUARIO MULTICOTIZADOR (REACT UI)
    # ==========================================
    subgraph cluster_lvl3 {
        label = "NIVEL 3: INTERFAZ REVOLUCIONARIA MULTICOTIZADOR EXCEL (MultiCotizadorExcel.tsx)"; style="filled"; fillcolor="#F3E5F5"; color="#7B1FA2";
        
        UI_FactSheet [label="📋 FACT SHEET BUQUE\\n(Formulario técnico reactivo)", shape=folder, fillcolor="#E1BEE7"];
        
        subgraph cluster_ui_grid {
            label = "GRILLA PRINCIPAL TABULAR (SPREADSHEET LIVE)"; style="filled"; fillcolor="#EDE7F6"; color="#512DA8";
            UI_Tramos [label="📑 Filas de Tramos & Puertos\\n(Navegación, Op Dest: Cargar/Descargar/None)", shape=box, fillcolor="white"];
            UI_MuellajeCell [label="⚖️ COLUMNA MUELLAJE DUAL\\nSub-celda 1: Monto $ USD | Sub-celda 2: Checkbox [x]\\n(Visibilidad estricta si Monto > 0)", shape=box, fillcolor="#BBDEFB", penwidth=2];
        }

        subgraph cluster_ui_cards {
            label = "TARJETAS DINÁMICAS DE RESUMEN Y AUDITORÍA"; style="filled"; fillcolor="#F5F5F5"; color="#424242";
            Card_Bunker [label="🛢️ CARD BUNKER\\n(Consumos & Importes IFO/MDO)", shape=rect, fillcolor="white"];
            Card_PortCosts [label="🏛️ CARD PORT COSTS\\n(Agencias + ↳ Loading Master + ↳ Muellaje)", shape=rect, fillcolor="#FFF9C4", penwidth=2];
            Card_Financials [label="📊 CARD FINANCIAL VOYAGE RESULT\\n((+) Revenue | (+) Refact. Muellaje | (-) Hire\\n(-) Bunker | (-) Port Costs ↳ Muellaje | P/L & TCE)", shape=doubleoctagon, fillcolor="#C8E6C9", penwidth=2];
        }
    }

    # ==========================================
    #  NIVEL 4: MOTOR DE CÁLCULO GEEKSOFT ENGINE (FASTAPI BACKEND)
    # ==========================================
    subgraph cluster_lvl4 {
        label = "NIVEL 4: MOTOR DE CÁLCULO BACKEND (Geeksoft Engine FastAPI)"; style="filled,dashed"; fillcolor="#EFEBE9"; color="#4E342E";
        
        API_Endpoint [label="📡 API HTTP ROUTER\\n(/forecast/multicotizador/calculate)", shape=cds, fillcolor="#D7CCC8", penwidth=2];
        
        subgraph cluster_engine_core {
            label = "CORE MATEMÁTICO SPOT ENGINE (spot_engine.py)"; style="filled"; fillcolor="#FFF8E1"; color="#FF8F00";
            Engine_Sim [label="🧮 calculate_multicotizador_simulation()\\n• Días Mar (dist * (1+WF) / speed * 24)\\n• Días Puerto ((Q/rate + overhead) / 24)\\n• Consumos Búnker Sea/Idle/Load/Disch\\n• Evaluación Unicidad Recalada Puerto", shape=box, fillcolor="#FFE082"];
            Engine_PnL [label="💰 Consolidado PnL & Refacturación\\n• Flete Total = Q * F\\n• Refacturación Muellaje (Suma 1x por Puerto)\\n• Voyage Result = Revenue - Hire - Bunker - Ports", shape=box, fillcolor="#AED581", penwidth=2];
        }
    }

    # ==========================================
    #  NIVEL 5: AUDITORÍA & BUCLE DE CONTROL DE CALIDAD (QC LOOP)
    # ==========================================
    subgraph cluster_lvl5 {
        label = "NIVEL 5: PROTOCOLO DE CONTROL DE CALIDAD & BUCLE QC (run_triangular_qc_loop.py)"; style="filled"; fillcolor="#E8F5E9"; color="#2E7D32";
        
        QC_Master [label="🛡️ CONTROL DE CALIDAD TRIANGULAR\\n• Vértice A: Excel PETRAL Oficial\\n• Vértice B: HTTP API Engine\\n• Vértice C: UI React Frontend\\n• Vértice D: Anti-Goles Mejillones ($33,333 Unicidad)", shape=component, fillcolor="#A5D6A7", penwidth=2];
        QC_Pass [label="✅ CONVERGENCIA ABSOLUTA 100%\\n(Delta = 0.000000 | Cero Regresiones)", shape=note, fillcolor="#C8E6C9", penwidth=2];
    }

    # ==========================================
    #  CONEXIONES Y FLUJO DE DATOS
    # ==========================================
    
    # Conexiones DB -> Providers
    DB_Vessels -> S_Vessel [label="Specs & Consumos"];
    DB_Ports -> S_Route [label="Distancias & Coordenadas"];
    DB_PortCosts -> S_Port [label="Agencia, LM & Muellaje"];
    DB_Bunker -> S_Bunker [label="Precios Fuel"];

    # Conexiones Providers -> UI Componentes
    S_Vessel -> UI_FactSheet [label="Poblar Barco"];
    S_Bunker -> UI_Tramos [label="Poblar Búnker"];
    S_Route -> UI_Tramos [label="Poblar Distancias"];
    S_Port -> UI_MuellajeCell [label="Autofill Muellaje ($33,333)"];
    S_Port -> Card_PortCosts [label="Autofill Gastos Puerto"];

    # Conexión UI -> Engine API
    UI_Tramos -> API_Endpoint [label="Payload JSON (Tramos & Puertos)", color="#7B1FA2", penwidth=2];
    API_Endpoint -> Engine_Sim [label="Ejecutar Simulación"];
    Engine_Sim -> Engine_PnL [label="Generar Métricas Consolidadas"];
    
    # Conexión Engine API -> UI Cards (Respuesta)
    Engine_PnL -> Card_Bunker [color="#388E3C"];
    Engine_PnL -> Card_PortCosts [color="#388E3C"];
    Engine_PnL -> Card_Financials [color="#388E3C", penwidth=2];

    # Conexión QC Loop Auditoría
    QC_Master -> API_Endpoint [label="Prueba B & D", style=dashed, color="#2E7D32"];
    QC_Master -> QC_Pass [label="Aserciones Pasadas"];
    QC_Pass -> Card_Financials [style=dotted, label="Garantía de Calidad"];
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
