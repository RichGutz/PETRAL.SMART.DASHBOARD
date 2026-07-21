import graphviz
import os

def generate_ultra_vertical_diagram():
    base_name = "FLUJOGRAMA_Geeksoft_Modulos_V1"
    output_filename = base_name

    print(f"Generando diagrama Ultra Vertical: {output_filename}.pdf")

    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    dot_code = """
    digraph GeeksoftArquitectura {
        graph [
            rankdir=TB,
            splines=ortho,
            nodesep=0.3,
            ranksep=0.4,
            fontname="Arial",
            fontsize=13,
            label="GEEKSOFT Dashboard ? Flujo Ultra-Vertical\\nPETRAL Smart Dashboard",
            labelloc="t",
            fontcolor="#0f172a",
            size="5.5,15.0!",
            ratio="compress"
        ];

        node [shape=box, style="filled,rounded", fontname="Arial", fontsize=9, margin="0.12,0.06", width=3.8];
        edge [fontname="Arial", fontsize=8, color="#475569"];

        subgraph cluster_n1 {
            label = "1. BASES DE DATOS (Supabase)";
            style="filled"; fillcolor="#f8fafc"; color="#64748b"; fontcolor="#1e293b"; fontsize=11;
            
            DB_vessels   [label="? vessels (Flota & Consumos)", shape=cylinder, fillcolor="#dbeafe", color="#2563eb"];
            DB_routes    [label="??? routes (Distancias & Clima)", shape=cylinder, fillcolor="#dbeafe", color="#2563eb"];
            DB_contracts [label="?? contracts (Tarifas & Ritmos)", shape=cylinder, fillcolor="#dbeafe", color="#2563eb"];
            DB_ports     [label="?? ports (Overheads & Posic.)", shape=cylinder, fillcolor="#dbeafe", color="#2563eb"];
            DB_bunker    [label="? bunker_prices (IFO & MDO)", shape=cylinder, fillcolor="#fef9c3", color="#ca8a04"];
            DB_portcosts [label="?? port_cost_static (Agencia Puerto)", shape=cylinder, fillcolor="#fee2e2", color="#dc2626"];

            DB_vessels -> DB_routes -> DB_contracts -> DB_ports -> DB_bunker -> DB_portcosts [style=invis];
        }

        subgraph cluster_n2 {
            label = "2. MOTOR CENTRAL DE CALCULOS";
            style="filled"; fillcolor="#0f172a"; color="#0f172a"; fontcolor="white"; fontsize=11;
            
            ENGINE [label="?? calculate_multicotizador_simulation()\\n(spot_engine.py)\\n\\n? Entrada: tramos[] + vessel_params\\n? Salida: tramos[i].{sea_days, port_days, pnl}\\n         consolidated.{total_days, pnl_net_utility, tce_real}",
                   shape=box3d, fillcolor="#1e3a5f", color="#38bdf8", fontcolor="white", penwidth=2, fontsize=9];
        }

        subgraph cluster_n3 {
            label = "3. M?DULO A ? Estimador Excel";
            style="filled,dashed"; fillcolor="#f0fdf4"; color="#16a34a"; fontcolor="#14532d"; fontsize=11;
            
            MC_UI   [label="1. UI MultiCotizadorExcel.tsx\\n(Buque, Puertos, Q, Tarifa)", fillcolor="#dcfce7", color="#16a34a"];
            MC_VAL  [label="2. Validacion: Q Carga == Q Descarga\\nOverhead = null (toma contrato)", shape=diamond, fillcolor="#bbf7d0", color="#15803d"];
            MC_PNL  [label="3. Resultado PnL Unitario y TCE", fillcolor="#a7f3d0", color="#059669"];
            MC_SAVE [label="4. Guardar en 'routes_spot'", shape=component, fillcolor="#6ee7b7", color="#10b981", penwidth=2];

            MC_UI -> MC_VAL -> MC_PNL -> MC_SAVE;
        }

        subgraph cluster_n4 {
            label = "4. M?DULO B ? Matriz Financiera";
            style="filled,dashed"; fillcolor="#fff7ed"; color="#ea580c"; fontcolor="#7c2d12"; fontsize=11;
            
            MF_LOAD  [label="1. Cargar Ruta desde 'routes_spot'", fillcolor="#fed7aa", color="#ea580c"];
            MF_SIM   [label="2. Simulacion Mensual", fillcolor="#fdba74", color="#c2410c"];
            MF_GRID  [label="3. Grilla Financiera (ForecastGrid.tsx)\\nViajes, Toneladas, Gross, Net, Port, Bunker, Voyage Result", fillcolor="#fef08a", color="#ca8a04"];
            MF_CHART [label="4. Graficos ECharts Duales", fillcolor="#fde68a", color="#d97706"];

            MF_LOAD -> MF_SIM -> MF_GRID -> MF_CHART;
        }

        subgraph cluster_n5 {
            label = "5. M?DULO C ? Auditoria Ledger";
            style="filled,dashed"; fillcolor="#faf5ff"; color="#9333ea"; fontcolor="#581c87"; fontsize=11;
            
            LED_UI   [label="1. Selector Ruta/Buque", fillcolor="#e9d5ff", color="#9333ea"];
            LED_MAP  [label="2. Map a mockedScenario", fillcolor="#c4b5fd", color="#6d28d9"];
            LED_SHOW [label="3. 4 Cards + Tabla 12 Filas", fillcolor="#d8b4fe", color="#9333ea"];
            LED_PDF  [label="4. PDF Acta Fisica (Lineas PETRAL/Delta)", shape=note, fillcolor="#a78bfa", color="#7c3aed", penwidth=2];

            LED_UI -> LED_MAP -> LED_SHOW -> LED_PDF;
        }

        DB_portcosts -> ENGINE [label="  inputs BD", color="#2563eb", style=bold];
        ENGINE -> MC_UI [label="  motor -> UI", color="#16a34a", style=bold];
        MC_SAVE -> MF_LOAD [label="  persistencia 'routes_spot'", color="#9333ea", style=bold];
        MF_CHART -> LED_UI [label="  auditoria individual", color="#9333ea", style=bold];
    }
    """

    try:
        src = graphviz.Source(dot_code)
        script_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts"
        file_path = src.render(
            filename=os.path.join(script_dir, output_filename),
            format="pdf",
            view=False,
            cleanup=True
        )
        print(f"PDF Ultra Vertical Generado: {os.path.abspath(file_path)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_ultra_vertical_diagram()
