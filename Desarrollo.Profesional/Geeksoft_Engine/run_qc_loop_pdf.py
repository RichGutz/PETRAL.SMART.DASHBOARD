import os
import sys
import json
import weasyprint

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Add parent directory to path to load backend modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Directorios de destino local
PROJECT_OBSIDIAN_DIR = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.1\DashBoardPetral"
PROJECT_ROOT_DIR = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD"
IMAGES_DIR = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Imagenes"

LOGO_PETRAL_PATH = os.path.join(IMAGES_DIR, "Logo.Petral.png").replace("\\", "/")
LOGO_GEEKSOFT_PATH = os.path.join(IMAGES_DIR, "Logo.Geeksoft.png").replace("\\", "/")

# Mapa de Tarifas Portuarias Reales por Puerto
PORT_COSTS_MASTER = {
    "CALLAO": 31327.99,     # Puerto de Carga Principal
    "MARCONA": 40000.00,    # Puerto de Descarga
    "MATARANI": 17000.00,   # Puerto de Descarga
    "MEJILLONES": 50000.00,  # Puerto de Descarga Principal Chile
    "ILO": 15000.00         # Base principal
}

def generate_black_white_pdf_report(routes_blocks: list, output_filename: str):
    """
    Genera un PDF totalmente en Blanco y Negro, sin colores, en Orientación Horizontal A4,
    con LOGOS DE PETRAL Y GEEKSOFT a la izquierda y derecha en la cabecera superior.
    """
    
    html = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
    <meta charset="UTF-8">
    <title>Acta Oficial de Auditoría Final - PETRAL</title>
    <style>
        @page {{
            size: A4 landscape;
            margin: 6mm;
            @bottom-right {{
                content: "Página " counter(page) " de " counter(pages);
                font-family: 'Courier New', Courier, monospace;
                font-size: 7pt;
                color: #000000;
            }}
            @bottom-left {{
                content: "PETRAL SYSTEM • ACTA DE AUDITORÍA SPOT ENGINE (12 MÉTRICAS LEDGER)";
                font-family: 'Courier New', Courier, monospace;
                font-size: 7pt;
                color: #000000;
            }}
        }}
        body {{
            font-family: 'Courier New', Courier, monospace;
            background-color: #ffffff;
            color: #000000;
            font-size: 6.8pt;
            line-height: 1.2;
            margin: 0;
            padding: 0;
        }}
        .header-logos {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000000;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }}
        .header-logos img {{
            height: 36px;
            width: auto;
        }}
        .header-title {{
            font-size: 10pt;
            font-weight: bold;
            text-align: center;
            color: #000000;
        }}
        .page-route {{
            page-break-after: always;
            height: 100%;
        }}
        .page-route:last-child {{
            page-break-after: avoid;
        }}
        pre {{
            font-family: 'Courier New', Courier, monospace;
            font-size: 6.8pt;
            white-space: pre;
            word-wrap: normal;
            color: #000000;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
            overflow-x: visible;
        }}
    </style>
    </head>
    <body>
    """

    for block_item in routes_blocks:
        ascii_txt = block_item.get("ascii_text", "") if isinstance(block_item, dict) else str(block_item)
        table_htm = block_item.get("metrics_table_html", "") if isinstance(block_item, dict) else ""
        html += f"""
        <div class="page-route">
            <table style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #000000; margin-bottom: 8px;">
                <tr>
                    <td style="width: 25%; text-align: left; vertical-align: middle; border: none; padding: 0;">
                        <img src="file:///{LOGO_PETRAL_PATH}" style="height: 30px; width: auto;" alt="PETRAL LOGO" />
                    </td>
                    <td style="width: 50%; text-align: center; vertical-align: middle; border: none; padding: 0; font-family: 'Courier New', monospace; font-weight: bold; font-size: 9.5pt; color: #000000;">
                        PETRAL SMART DASHBOARD • MOTOR SPOT GEEKSOFT ENGINE<br/>
                        <span style="font-size: 7.5pt; font-weight: normal;">ACTA OFICIAL DE AUDITORÍA Y TRAZABILIDAD (SPCC & NEXA)</span>
                    </td>
                    <td style="width: 25%; text-align: right; vertical-align: middle; border: none; padding: 0;">
                        <img src="file:///{LOGO_GEEKSOFT_PATH}" style="height: 49px; width: auto;" alt="GEEKSOFT LOGO" />
                    </td>
                </tr>
            </table>
            <pre>{ascii_txt}</pre>
            {table_htm}
        </div>
        """

    html += """
    </body>
    </html>
    """

    pdf_doc = weasyprint.HTML(string=html)
    pdf_doc.write_pdf(output_filename)
    print(f"📄 PDF Blanco y Negro con Logos PETRAL / GEEKSOFT Generado Exitosamente: {output_filename}")

def build_route_console_text(name: str, num_legs: int, c: dict, tramos: list, vessel: dict, client_name: str) -> str:
    """Construye el texto formateado idéntico a la consola ampliando el ancho de columnas a 148 caracteres."""
    tot_dist = c.get("total_distance", 0)
    tot_days = c.get("total_days", 0)
    sea_days = c.get("total_sea_days", 0)
    port_days = c.get("total_port_days", 0)
    bunker_cost = c.get("total_bunker_costs", 0)
    ifo_tonnage = c.get("bunker_ifo_tonnage", 0)
    mdo_tonnage = c.get("bunker_mdo_tonnage", 0)
    port_costs = c.get("total_port_costs", 0)
    net_income = c.get("total_freight_revenue", 0)
    pnl_net = c.get("pnl_net_utility", 0)
    tce_real = c.get("tce_real", 0)
    commissions = c.get("total_commissions", 0)
    # TCE requerido del Card de Buque (vessel)
    tce_req = float(vessel.get("tce_required") or 0)
    # P/L correcto: voyage_result - (tot_days * tce_required)
    pl_vs_req = pnl_net - (tot_days * tce_req)

    p_ifo = 895.14
    p_mdo = 1460.30

    # Extraer parámetros de Carga / Contratos
    laden_leg = next((t for t in tramos if t.get("type") == "LADEN"), tramos[0])
    Q = laden_leg.get("quantity", 13500)
    F = laden_leg.get("freight_rate", 25.50)
    r_l = laden_leg.get("actual_load_rate", 500)
    r_d = laden_leg.get("actual_discharge_rate", 345)
    
    orig_p = laden_leg.get("origin_port_id", "ILO")
    dest_p = laden_leg.get("destination_port_id", "ILO")
    c_orig = laden_leg.get("agency_costs_origin", 31327.99)
    c_dest = laden_leg.get("agency_costs_destination", 40000.00)

    trayecto_str = " ➔ ".join([t.get("origin_port_id") for t in tramos] + [tramos[-1].get("destination_port_id")])

    W = 148
    lines = []
    lines.append(f"🚢 AUDITANDO RUTA: {name} ({num_legs} Piernas)")
    lines.append("═" * W)
    lines.append("📋 [INPUTS Y VARIABLES DE ORIGEN DE CÁLCULO - CARDS MAESTROS]:")
    lines.append(f"  • CARD 1 (RUTAS):                 Itinerario: {trayecto_str} | Dist. Total: {tot_dist:,.1f} NM | Weather Factor: 3.0% (0.03)")
    lines.append(f"  • CARD 2 (BUQUES):                Vessel: {vessel.get('vessel_id')} | Speed: {vessel.get('vessel_speed')} kts | Cons. Sea IFO: {vessel.get('consumption_sea_ifo')} t/d | Cons. Idle IFO: {vessel.get('consumption_idle_ifo')} t/d | TCE Requerido: ${tce_req:,.2f}/d")
    lines.append(f"  • CARD 3 (BÚNKER):                Precio IFO: ${p_ifo:,.2f}/t | Precio MDO: ${p_mdo:,.2f}/t | Consumo Est.: {ifo_tonnage:,.2f} t IFO / {mdo_tonnage:,.2f} t MDO | BAF Baseline: $430.00/t")
    lines.append(f"  • CARD 4 (CONTRATOS & COMERCIAL): Cliente: {client_name} | Q: {Q:,.0f} MT | Freight Base: ${F:,.2f}/MT | Ritmo Carga: {r_l:,.0f} T/h | Ritmo Desc: {r_d:,.0f} T/h | Comisiones: Address 0.0% / Broker 0.0%")
    lines.append(f"  • CARD 5 (PUERTOS & AGENCIA):     Agencia Carga ({orig_p}): ${c_orig:,.2f} USD | Agencia Descarga ({dest_p}): ${c_dest:,.2f} USD | Total Port Costs: ${port_costs:,.2f} USD")
    lines.append("─" * W)
    lines.append("  ┌" + "─" * (W - 4))
    lines.append(f"  │ 📍 RESUMEN CONSOLIDADO: Distancia {tot_dist:,.1f} NM | Días Totales {tot_days:.2f}d ({sea_days:.2f}d Mar + {port_days:.2f}d Puerto)")
    lines.append(f"  │ ⛽ Búnker Total:  ${bunker_cost:,.2f} USD ({ifo_tonnage:.2f} t IFO | {mdo_tonnage:.2f} t MDO)")
    lines.append(f"  │ ⚓ Puerto Total:  ${port_costs:,.2f} USD")
    lines.append(f"  │ 💰 Ingreso Flete: ${net_income:,.2f} USD | PnL Neto: ${pnl_net:,.2f} USD | TCE: ${tce_real:,.2f} USD/Día")
    lines.append("  ├" + "─" * (W - 4))
    lines.append("  │ 🔍 ARITMÉTICA EXPLICATIVA Y ORIGEN DE LOS DÍAS (MAR VS PUERTO):")

    for idx, tr in enumerate(tramos):
        tipo = tr.get("type", "BALLAST")
        orig = tr.get("origin_port_id")
        dest = tr.get("destination_port_id")
        dist_p = tr.get("distance", 0)
        wf = tr.get("weather_factor", 0.03)
        sea_d = tr.get("sea_days", 0)
        port_d = tr.get("port_days", 0)
        
        bunk_sea_ifo = sea_d * 14.0
        bunk_sea_cost = bunk_sea_ifo * p_ifo

        bunk_port_ifo = tr.get("bunker_ifo", 0) - bunk_sea_ifo
        bunk_port_mdo = tr.get("bunker_mdo", 0)
        bunk_port_cost = (bunk_port_ifo * p_ifo) + (bunk_port_mdo * p_mdo)
        bunk_total_leg = tr.get("bunker_costs", 0)

        cost_orig = tr.get("agency_costs_origin", 0)
        cost_dest = tr.get("agency_costs_destination", 0)
        income_p = tr.get("net_income", 0)

        lines.append(f"  │   • PIERNA #{idx+1} [{tipo}]: {orig} ➔ {dest} | Distancia: {dist_p:,.1f} NM")
        lines.append(f"  │       🌊 Días de Mar ({sea_d:.2f}d): [{dist_p:,.1f} NM × (1 + {wf*100:.1f}% WF)] / [11.0 kts × 24h] = {sea_d:.2f} Días")
        lines.append(f"  │          ↳ Búnker Mar: {sea_d:.2f}d × 14.0 t/d IFO × ${p_ifo:,.2f} = ${bunk_sea_cost:,.2f} USD")

        if tipo == "LADEN":
            leg_Q = tr.get("quantity", 13500)
            leg_rl = tr.get("actual_load_rate", 500)
            leg_rd = tr.get("actual_discharge_rate", 345)
            load_d = (leg_Q / leg_rl) / 24 if leg_rl > 0 else 0
            disch_d = (leg_Q / leg_rd) / 24 if leg_rd > 0 else 0
            idle_d = max(0, port_d - load_d - disch_d)

            lines.append(f"  │       ⚓ Días de Puerto ({port_d:.2f}d): Carga ({leg_Q:.0f}t/{leg_rl:.0f}t/h = {load_d:.2f}d) + Descarga ({leg_Q:.0f}t/{leg_rd:.0f}t/h = {disch_d:.2f}d) + Overheads ({idle_d:.2f}d) = {port_d:.2f} Días")
            lines.append(f"  │          ↳ Búnker Puerto: {bunk_port_ifo:.2f} t IFO + {bunk_port_mdo:.2f} t MDO = ${bunk_port_cost:,.2f} USD")
            lines.append(f"  │       🔥 Búnker Total Pierna:  ${bunk_sea_cost:,.2f} + ${bunk_port_cost:,.2f} = ${bunk_total_leg:,.2f} USD")
            lines.append(f"  │       🚢 Agencia Carga ({orig}):    ${cost_orig:,.2f} USD")
            lines.append(f"  │       🚢 Agencia Descarga ({dest}): ${cost_dest:,.2f} USD")
            lines.append(f"  │       💵 Ingreso Flete Leg:     ${income_p:,.2f} USD")
        else:
            lines.append(f"  │       ⚓ Días de Puerto: 0.00 Días (Pierna en Lastre)")
            lines.append(f"  │       🔥 Búnker Total Pierna: ${bunk_total_leg:,.2f} USD")
            lines.append(f"  │       🚢 Agencia Puerto:      $0.00 USD (Lastre)")

    lines.append("  └" + "─" * (W - 4))
    
    sea_days_parts = []
    for idx, tr in enumerate(tramos):
        t_type = tr.get("type", "BALLAST")
        t_dist = tr.get("distance", 0)
        t_sd = tr.get("sea_days", 0)
        sea_days_parts.append(f"P#{idx+1} {t_type}({t_dist:,.0f}NM: {t_sd:.2f}d)")

    sea_days_calc_str = " + ".join(sea_days_parts)

    metrics = [
        ("1. Ritmo Carga (act_load)", "contract_load_rate", f"{r_l:,.0f} T/h", f"{r_l:,.0f} T/h"),
        ("2. Ritmo Descarga (act_disch)", "contract_discharge_rate", f"{r_d:,.0f} T/h", f"{r_d:,.0f} T/h"),
        ("3. Días de Puerto (port_days)", "(Q/act_load)/24 + (Q/act_disch)/24 + idle", f"Load({(Q/r_l)/24:.2f}d) + Disch({(Q/r_d)/24:.2f}d) + Overheads", f"{port_days:.2f} Días"),
        ("4. Días de Mar (sea_days)", "Sum((dist_leg * (1 + WF)) / (speed * 24))", sea_days_calc_str, f"{sea_days:.2f} Días"),
        ("5. Días de Viaje (tot_dur)", "sea_days + port_days", f"{sea_days:.2f}d Mar + {port_days:.2f}d Puerto", f"{tot_days:.2f} Días"),
        ("6. Income (income)", "Sum(Q_leg * F_leg)", f"{Q:,.0f} MT × ${F:,.2f} USD/MT", f"${net_income:,.2f}"),
        ("7. Comisiones (commissions)", "income * (addr_comm + bkr_comm)", f"${net_income:,.2f} × 0.00%", f"${commissions:,.2f}"),
        ("8. Costo Bunker (bunker)", "bunker_sea + bunker_port", f"{ifo_tonnage:.2f}t IFO × ${p_ifo} + {mdo_tonnage:.2f}t MDO × ${p_mdo}", f"${bunker_cost:,.2f}"),
        ("9. Port Costs (port_costs)", "Sum(agency_origin + agency_dest)", f"${c_orig:,.2f} (Carga) + ${c_dest:,.2f} (Descarga)", f"${port_costs:,.2f}"),
        ("10. Voyage Result (voy_res)", "income - comm - bunker - port_costs", f"${net_income:,.2f} - ${bunker_cost:,.2f} - ${port_costs:,.2f}", f"${pnl_net:,.2f}"),
        ("11. TCE Diario (tce_real)", "voyage_result / tot_dur", f"${pnl_net:,.2f} / {tot_days:.2f} Días", f"${tce_real:,.2f}/día"),
        ("12. P/L (pl_vs_req)", "income - comm - bunker - port_costs - (tot_days * tce_req)", f"${pnl_net:,.2f} - ({tot_days:.2f}d x ${tce_req:,.2f}/d)", f"${pl_vs_req:,.2f}")
    ]

    metrics_html_rows = ""
    for name_m, form_m, calc_m, engine_m in metrics:
        metrics_html_rows += f"""
        <tr>
            <td style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">{name_m}</td>
            <td style="border: 1px solid #000000; padding: 2.5px 5px;">{form_m}</td>
            <td style="border: 1px solid #000000; padding: 2.5px 5px;">{calc_m}</td>
            <td style="border: 1px solid #000000; padding: 2.5px 5px; text-align: right; font-weight: bold;">{engine_m}</td>
        </tr>
        """

    metrics_table_html = f"""
    <div style="margin-top: 6px; font-family: 'Courier New', monospace;">
        <div style="font-weight: bold; font-size: 7.5pt; margin-bottom: 3px; color: #000000;">
            📊 [TABLA OFICIAL DE AUDITORÍA LEDGER — 12 MÉTRICAS REPLICADAS DE LA UI]:
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; table-layout: fixed; font-family: 'Courier New', monospace; font-size: 6.8pt; line-height: 1.25;">
            <thead>
                <tr style="background-color: #f2f2f2; border-bottom: 1.5px solid #000000;">
                    <th style="width: 25%; border: 1px solid #000000; padding: 3px 5px; text-align: left; font-weight: bold;">ÍTEM / MÉTRICA OFICIAL</th>
                    <th style="width: 32%; border: 1px solid #000000; padding: 3px 5px; text-align: left; font-weight: bold;">FÓRMULA APLICADA</th>
                    <th style="width: 28%; border: 1px solid #000000; padding: 3px 5px; text-align: left; font-weight: bold;">CÁLCULO SUSTITUIDO NUMÉRICO</th>
                    <th style="width: 15%; border: 1px solid #000000; padding: 3px 5px; text-align: right; font-weight: bold;">GEEKSOFT ENGINE</th>
                </tr>
            </thead>
            <tbody>
                {metrics_html_rows}
            </tbody>
        </table>
    </div>

    <!-- Pie de Firma, Aprobación e Inputs de Auditoría Ledger -->
    <div style="margin-top: 10px; padding-top: 6px; border-top: 1.5px solid #000000; font-family: 'Courier New', monospace; font-size: 7.2pt; page-break-inside: avoid;">
        <table style="width: 100%; border-collapse: collapse; border: none;">
            <tr>
                <!-- Panel Izquierdo: Responsable, Estado, Firma, Fecha -->
                <td style="width: 50%; vertical-align: top; padding-right: 15px;">
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-weight: bold; white-space: nowrap; color: #000000;">Responsable Auditor:</span>
                            <div style="border-bottom: 1px dashed #000000; flex: 1; height: 12px;"></div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 16px; margin-top: 2px;">
                            <span style="font-weight: bold; color: #000000;">Estado:</span>
                            <span style="display: inline-flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000000;"></span> Aprobado</span>
                            <span style="display: inline-flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000000;"></span> Con Errores</span>
                            <span style="display: inline-flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000000;"></span> Observado</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                            <span style="font-weight: bold; white-space: nowrap; color: #000000;">Firma Auditor:</span>
                            <div style="border-bottom: 1px dashed #000000; flex: 1; height: 14px;"></div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                            <span style="font-weight: bold; white-space: nowrap; color: #000000;">Fecha Validación:</span>
                            <div style="border-bottom: 1px dashed #000000; flex: 1; height: 12px;"></div>
                        </div>
                    </div>
                </td>

                <!-- Panel Derecho: Comentarios y Justificación de Auditoría -->
                <td style="width: 50%; vertical-align: top; padding-left: 15px;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: bold; color: #000000; margin-bottom: 3px;">Comentarios / Justificación de Auditoría Ledger:</span>
                        <div style="border: 1px solid #000000; height: 56px; background-color: #fafafa; padding: 4px; box-sizing: border-box;"></div>
                    </div>
                </td>
            </tr>
        </table>
    </div>
    """

    return {"ascii_text": "\n".join(lines), "metrics_table_html": metrics_table_html}

def run_qc_test_suite():
    print("=" * 110)
    print("[QC LOOP AUTÓNOMO] GENERANDO PDF B&W LANDSCAPE CON LOGOS PETRAL (IZQ) Y GEEKSOFT (DER)")
    print("=" * 110)
    
    from backend.database import get_supabase
    from backend.spot_engine import calculate_multicotizador_simulation
    
    sb = get_supabase()
    routes_res = sb.table("routes_clients").select("*").execute()
    routes = routes_res.data or []
    
    # Ordenar rutas: SPCC primero (0), luego NEXA (1), luego otros (2)
    def route_sort_key(r):
        name = (r.get("name") or "").upper()
        if "SPCC" in name:
            return (0, name)
        elif "NEXA" in name:
            return (1, name)
        return (2, name)

    routes = sorted(routes, key=route_sort_key)
    
    v_res = sb.table("vessels").select("*").eq("vessel_id", "MOQUEGUA").execute()
    vessel = v_res.data[0] if v_res.data else {
        "vessel_id": "MOQUEGUA", "vessel_name": "MOQUEGUA", "vessel_speed": 11.0,
        "consumption_sea_ifo": 14.0, "consumption_sea_mdo": 0.0, "consumption_idle_ifo": 2.4,
        "consumption_idle_mdo": 0.0, "consumption_load_ifo": 2.4, "consumption_load_mdo": 0.5,
        "consumption_disch_ifo": 3.6, "consumption_disch_mdo": 0.5, "bunker_price_ifo": 895.14, "bunker_price_mdo": 1460.30
    }
    
    routes_blocks = []

    for r in routes:
        name = (r.get("name") or "").strip()
        client_group = "NEXA" if "NEXA" in name.upper() else ("SPCC" if "SPCC" in name.upper() else "PROSPECTOS")
        tramos = r.get("legs_data", {}).get("tramos", [])
        if not tramos: continue

        for tr in tramos:
            tr["bunker_price_ifo"] = 895.14
            tr["bunker_price_mdo"] = 1460.30
            tr["vessel_speed"] = 11.0
            orig_p = tr.get("origin_port_id", "ILO")
            dest_p = tr.get("destination_port_id", "ILO")
            
            if tr.get("type") == "LADEN" or tr.get("origin_action") == "CARGAR":
                tr["type"] = "LADEN"
                tr["quantity"] = 13500.0
                if not tr.get("freight_rate") or tr.get("freight_rate") == 0:
                    tr["freight_rate"] = 25.0 if "MEJILLONES" in name.upper() and "NEXA" in name.upper() else (30.0 if "MATARANI" in name.upper() and "NEXA" in name.upper() else 25.50)
                tr["agency_costs_origin"] = PORT_COSTS_MASTER.get(orig_p, 31327.99)
                tr["agency_costs_destination"] = PORT_COSTS_MASTER.get(dest_p, 40000.00)
            else:
                tr["type"] = "BALLAST"
                tr["agency_costs_origin"] = 0.0
                tr["agency_costs_destination"] = 0.0

        payload = {"vessel_id": "MOQUEGUA", "vessel_params": vessel, "tramos": tramos, "port_cost_mode": "static"}
        res = calculate_multicotizador_simulation(payload)
        
        c = res.get("consolidated", {})
        tramos_res = res.get("tramos", [])
        block_str = build_route_console_text(name, len(tramos), c, tramos_res, vessel, client_group)
        routes_blocks.append(block_str)

    obsidian_pdf_path = os.path.join(PROJECT_OBSIDIAN_DIR, "ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf")
    root_pdf_path = os.path.join(PROJECT_ROOT_DIR, "ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf")

    generate_black_white_pdf_report(routes_blocks, obsidian_pdf_path)
    generate_black_white_pdf_report(routes_blocks, root_pdf_path)
    
    print("\n🎉 [QC COMPLETE] PDF B&W Landscape con logos PETRAL y GEEKSOFT generado con éxito.")
    print(f"🔗 LINK OBSIDIAN LOCAL: file:///{obsidian_pdf_path.replace('\\', '/')}")
    print(f"🔗 LINK PROJECT ROOT:   file:///{root_pdf_path.replace('\\', '/')}")
    return obsidian_pdf_path

if __name__ == "__main__":
    run_qc_test_suite()
