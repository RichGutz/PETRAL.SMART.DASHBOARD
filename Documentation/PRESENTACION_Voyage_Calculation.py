import graphviz
import os
from PyPDF2 import PdfMerger

def generate_presentation():
    base_name = "PRESENTACION_Voyage_Calculation"
    output_filename = base_name
    
    print(f"Generando Presentación: {output_filename}.pdf")
    
    potential_paths = [
        r"C:\Program Files\Graphviz\bin",
        r"C:\Program Files (x86)\Graphviz\bin",
    ]
    for p in potential_paths:
        if os.path.exists(p) and p not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + p

    # ==========================
    # SLIDE 1: FLOWCHART VERTICAL (ESTILO CHARTEADO V1)
    # ==========================
    dot_code_1 = """
    digraph Slide1 {
        rankdir=TB;
        splines=ortho;
        nodesep=1.0;
        ranksep=1.2;
        
        labelloc="t";
        labeljust="c";
        label="Slide 1: Voyage Calculations Flowchart (Tablones / Moquegua)";
        fontsize=18;
        fontname="Arial-Bold";
        fontcolor="#455A64";

        # Forzar una hoja vertical A4
        page="8.27,11.69";
        size="7.5,11";
        ratio="compress";
        
        node [shape=box, style="filled,rounded", fontname="Arial", fontsize=10];
        edge [fontname="Arial", fontsize=9];

        # ==========================================
        #  NIVEL 1: VOYAGE PROGRAM (OPERATIVO)
        # ==========================================
        subgraph cluster_lvl1 {
            label = "NIVEL 1: VOYAGE PROGRAM (TIEMPOS Y DISTANCIAS)"; 
            style="filled,dashed"; 
            fillcolor="#E3F2FD"; 
            color="#1976D2"; 
            penwidth=1.5;
            fontcolor="#1976D2";
            
            subgraph cluster_motor1 {
                label = "CÁLCULO DE DÍAS"; style="filled"; fillcolor="#BBDEFB"; color="#0277BD";
                Step1_1 [label="1. (Inputs) Distancia, Velocidad, TM a Cargar", shape=box, fillcolor="white"];
                Step1_2 [label="2. Sea Days = Dist. / (Vel * 24)", shape=box, fillcolor="#E1F5FE"];
                Step1_3 [label="3. Port Days = TM / (Tasa * 24)", shape=box, fillcolor="#E1F5FE"];
                Step1_4 [label="4. = TOTAL DAYS\\n\\nDías Navegando + Días Puerto", shape=doubleoctagon, fillcolor="#81D4FA", penwidth=2];
                
                Step1_1 -> Step1_2 -> Step1_3 -> Step1_4;
            }
        }

        # ==========================================
        #  NIVEL 2: CONSUMPTION & DURATION
        # ==========================================
        subgraph cluster_lvl2 {
            label = "NIVEL 2: CONSUMPTION & DURATION (BUNKER FÍSICO)"; 
            style="filled,dashed"; 
            fillcolor="#FFF8E1"; 
            color="#F57C00"; 
            penwidth=1.5;
            fontcolor="#F57C00";
            
            subgraph cluster_motor2 {
                label = "CÁLCULO DE COMBUSTIBLE EN MT"; style="filled"; fillcolor="#FFE0B2"; color="#E65100";
                Step2_1 [label="1. (Inputs) Consumo Diario IFO/MDO del Buque", shape=box, fillcolor="white"];
                Step2_2 [label="2. IFO Consumido = (SeaDays * IFO Sea) + (PortDays * IFO Port)", shape=box, fillcolor="#FFF3E0"];
                Step2_3 [label="3. MDO Consumido = TotalDays * MDO", shape=box, fillcolor="#FFF3E0"];
                Step2_4 [label="4. = BUNKER TOTAL (MT)\\n\\nCombustible Físico Calculado", shape=doubleoctagon, fillcolor="#FFB74D", penwidth=2];
                
                Step2_1 -> Step2_2 -> Step2_3 -> Step2_4;
            }
        }

        # ==========================================
        #  NIVEL 3: INCOME & RESULTS
        # ==========================================
        subgraph cluster_lvl3 {
            label = "NIVEL 3: INCOME & RESULTS (P&L FINANCIERO)"; 
            style="filled,dashed"; 
            fillcolor="#F1F8E9"; 
            color="#689F38"; 
            penwidth=1.5;
            fontcolor="#689F38";
            
            subgraph cluster_motor3 {
                label = "CÁLCULO DE GROSS MARGIN"; style="filled"; fillcolor="#DCEDC8"; color="#33691E";
                Step3_1 [label="1. (+) Ingreso = TM * Flete", shape=box, fillcolor="white"];
                Step3_2 [label="2. (-) Costo Bunker = MT * Precio $", shape=box, fillcolor="#E8F5E9"];
                Step3_3 [label="3. (-) Costo Puerto = Flat Rate $", shape=box, fillcolor="#E8F5E9"];
                Step3_4 [label="4. = VOYAGE RESULT (GROSS MARGIN)\\n\\nIngreso Neto Operativo del Viaje", shape=doubleoctagon, fillcolor="#AED581", penwidth=2];
                
                Step3_1 -> Step3_2 -> Step3_3 -> Step3_4;
            }
        }

        # CONEXIONES INVISIBLES PARA ALINEAR
        Step1_4 -> Step2_1 [style=invis, weight=10];
        Step2_4 -> Step3_1 [style=invis, weight=10];

        # CONEXIONES REALES ENTRE MÓDULOS
        Step1_4 -> Step2_1 [label=" Envía Días", color="#E65100", penwidth=2];
        Step2_4 -> Step3_2 [label=" Envía Bunker (MT)", color="#33691E", penwidth=2];
    }
    """

    # ==========================
    # SLIDE 2: PSEUDOCODE VERTICAL
    # ==========================
    dot_code_2 = """
    digraph Slide2 {
        rankdir=TB;
        splines=ortho;
        nodesep=1.0;
        ranksep=0.3;
        
        labelloc="t";
        labeljust="c";
        label="Slide 2: Lógica Backend (Explicación y Pseudocódigo)";
        fontsize=18;
        fontname="Arial-Bold";
        fontcolor="#455A64";

        # Forzar una hoja vertical A4
        page="8.27,11.69";
        size="7.5,11";
        ratio="compress";
        
        node [shape=box, style="filled,rounded", fontname="Courier", fontsize=11, fillcolor="#FAFAFA", color="#E0E0E0"];
        edge [style=invis, weight=10];

        Title [label="def calculate_voyage_pnl(inputs):", fillcolor="#E3F2FD", color="#1565C0", fontname="Courier-Bold", fontsize=12];

        # BLOQUE 1
        Exp1 [label="PASO 1: CÁLCULO DE TIEMPOS (VOYAGE PROGRAM)\\nCalculamos los días navegando dividiendo la distancia entre la velocidad diaria (nudos * 24h).\\nLuego, estimamos los días en puerto dividiendo la carga entre la velocidad de las grúas.", shape=note, fillcolor="#E1F5FE", color="#0288D1", fontname="Arial", fontsize=10];
        Code1 [label="sea_days = inputs.distancia / (inputs.velocidad * 24)\\nport_days = (inputs.tm_load / inputs.load_rate / 24) + \\n            (inputs.tm_disch / inputs.disch_rate / 24) + inputs.idle_days\\ntotal_days = sea_days + port_days"];
        
        # BLOQUE 2
        Exp2 [label="PASO 2: CÁLCULO DE COMBUSTIBLE (CONSUMPTION)\\nMultiplicamos los días obtenidos en el Paso 1 por el consumo técnico del buque (Toneladas/Día).\\nEl buque consume distinto si está navegando (Sea) o estacionado (Port).", shape=note, fillcolor="#FFF3E0", color="#F57C00", fontname="Arial", fontsize=10];
        Code2 [label="ifo_mt = (sea_days * ship.ifo_sea_rate) + (port_days * ship.ifo_port_rate)\\nmdo_mt = (sea_days * ship.mdo_sea_rate) + (port_days * ship.mdo_port_rate)"];
        
        # BLOQUE 3
        Exp3 [label="PASO 3: CÁLCULO FINANCIERO (RESULTS / P&L)\\nConvertimos las variables operativas en dinero. El ingreso es el flete por tonelada.\\nA esto le restamos el costo del combustible gastado y la tarifa plana del puerto.", shape=note, fillcolor="#F1F8E9", color="#689F38", fontname="Arial", fontsize=10];
        Code3 [label="income_usd = inputs.tm_cargo * inputs.freight_rate\\nbunker_cost_usd = (ifo_mt * inputs.ifo_price) + (mdo_mt * inputs.mdo_price)\\nport_cost_usd = get_flat_port_cost(inputs.destino)\\n\\nvoyage_result_usd = income_usd - bunker_cost_usd - port_cost_usd\\ntce_usd_day = voyage_result_usd / total_days"];
        
        Code4 [label="return {\\n    'TotalDays': total_days,\\n    'GrossMargin': voyage_result_usd,\\n    'TCE': tce_usd_day\\n}", fillcolor="#F1F8E9", color="#689F38"];

        Title -> Exp1 -> Code1 -> Exp2 -> Code2 -> Exp3 -> Code3 -> Code4;
    }
    """
    
    try:
        output_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Generar Slide 1
        src1 = graphviz.Source(dot_code_1)
        pdf1 = src1.render(filename=os.path.join(output_dir, 'temp_slide1'), format='pdf', cleanup=True)
        
        # Generar Slide 2
        src2 = graphviz.Source(dot_code_2)
        pdf2 = src2.render(filename=os.path.join(output_dir, 'temp_slide2'), format='pdf', cleanup=True)
        
        # Unir PDFs
        merger = PdfMerger()
        merger.append(pdf1)
        merger.append(pdf2)
        
        final_pdf_path = os.path.join(output_dir, f"{output_filename}.pdf")
        merger.write(final_pdf_path)
        merger.close()
        
        # Eliminar temporales
        os.remove(pdf1)
        os.remove(pdf2)
        
        print(f"Generado exitosamente: {final_pdf_path}")
        
    except Exception as e:
        print(f"Error generando presentación: {e}")

if __name__ == "__main__":
    generate_presentation()
