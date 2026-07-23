import sys
import os
import json
import psycopg2
from weasyprint import HTML

sys.stdout.reconfigure(encoding='utf-8')

engine_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine"
if engine_dir not in sys.path:
    sys.path.insert(0, engine_dir)

from backend.spot_engine import calculate_multicotizador_simulation

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def build_acta_4_legs_official_format():
    print("=== GENERANDO PDF FORMATO AUTÉNTICO AUDITORÍA FINAL (BW LANDSCAPE / CONSOLA) ===")

    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    cur.execute("SELECT legs_data FROM routes_quotes WHERE name LIKE '%4.PIERNAS%' OR name LIKE '%CALLAO.MATARANI.ANTOFAGASTA%';")
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        print("❌ Ruta de 4 piernas no encontrada en routes_quotes.")
        return

    payload = row[0]
    tramos_raw = payload.get("tramos", [])

    vessel_moquegua = {
        "vessel_id": "MOQUEGUA",
        "vessel_name": "MOQUEGUA",
        "vessel_speed": 11.0,
        "tce_required": 13000.0,
        "grt": 12000,
        "dwt": 18000,
        "dwcc": 17500,
        "consumption_sea_ifo": 14.0,
        "consumption_idle_ifo": 2.4,
        "consumption_load_ifo": 2.4,
        "consumption_disch_ifo": 4.5,
        "consumption_sea_mdo": 0.5,
        "consumption_idle_mdo": 0.5,
        "bunker_price_ifo": 895.14,
        "bunker_price_mdo": 1460.30
    }

    sim = calculate_multicotizador_simulation({
        **vessel_moquegua,
        "tramos": tramos_raw
    })

    c = sim["consolidated"]
    tramos = sim["tramos"]

    name = "PROSPECT.ILO.CALLAO.MATARANI.ANTOFAGASTA.ILO"
    client_name = "PROSPECTO COMERCIAL"
    num_legs = len(tramos)
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
    tce_req = 13000.0
    pl_vs_req = pnl_net - (tot_days * tce_req)

    p_ifo = 895.14
    p_mdo = 1460.30

    laden_leg = next((t for t in tramos if t.get("type") == "LADEN"), tramos[0])
    Q = laden_leg.get("quantity", 13500)
    F = laden_leg.get("freight_rate", 30.00)
    r_l = 500
    r_d = 345

    orig_p = laden_leg.get("origin_port_id", "ILO")
    dest_p = laden_leg.get("destination_port_id", "CALLAO")
    c_orig = 31327.99
    c_dest = 35000.00

    trayecto_str = " ➔ ".join([t.get("origin_port_id") for t in tramos] + [tramos[-1].get("destination_port_id")])

    W = 148
    lines = []
    lines.append(f"🚢 AUDITANDO RUTA PROSPECTO (4 PIERNAS): {name} ({num_legs} Piernas)")
    lines.append("═" * W)
    lines.append("📋 [INPUTS Y VARIABLES DE ORIGEN DE CÁLCULO - CARDS MAESTROS]:")
    lines.append(f"  • CARD 1 (RUTAS):                 Itinerario: {trayecto_str} | Dist. Total: {tot_dist:,.1f} NM | Weather Factor: 3.0% (0.03)")
    lines.append(f"  • CARD 2 (BUQUES):                Vessel: MOQUEGUA | Speed: 11.0 kts | Cons. Sea IFO: 14.0 t/d | Cons. Idle IFO: 2.4 t/d | TCE Requerido: ${tce_req:,.2f}/d")
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
            leg_rl = 500
            leg_rd = 345
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

    sea_days_parts = [f"P#{idx+1} {tr.get('type')}({tr.get('distance', 0):,.0f}NM: {tr.get('sea_days', 0):.2f}d)" for idx, tr in enumerate(tramos)]
    sea_days_calc_str = " + ".join(sea_days_parts)

    text_block = "\n".join(lines)

    logo_petral = "https://forecast.geeksoft.tech/assets/Logo.Petral-B_D1ts1D.png"
    logo_geeksoft = "https://forecast.geeksoft.tech/assets/Logo.Geeksoft-B8ulNaZx.png"

    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: A4 landscape;
                margin: 6mm 8mm;
            }}
            body {{
                font-family: 'Courier New', Courier, monospace;
                font-size: 6.8pt;
                color: #000;
                background: #fff;
                line-height: 1.2;
                margin: 0;
                padding: 0;
            }}
            .page {{
                page-break-after: always;
                height: 100%;
                box-sizing: border-box;
            }}
            .page:last-child {{
                page-break-after: avoid;
            }}
            .header-table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 4px;
            }}
            .header-table td {{
                vertical-align: middle;
            }}
            .console-block {{
                white-space: pre;
                font-family: 'Courier New', Courier, monospace;
                font-size: 6.5pt;
                line-height: 1.18;
                margin-bottom: 6px;
            }}
            table.metrics-table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 4px;
                font-size: 6.5pt;
            }}
            table.metrics-table th, table.metrics-table td {{
                border: 1px solid #000;
                padding: 2px 4px;
            }}
            table.metrics-table th {{
                background-color: #f0f0f0;
                font-weight: bold;
                text-align: center;
            }}
            .text-right {{ text-align: right; }}
            .text-center {{ text-align: center; }}
            .bold {{ font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="page">
            <table class="header-table">
                <tr>
                    <td style="width: 25%; text-align: left;">
                        <img src="{logo_petral}" style="height: 38px;" />
                    </td>
                    <td style="width: 50%; text-align: center;">
                        <span style="font-size: 11pt; font-weight: bold;">ACTA OFICIAL DE AUDITORÍA FINAL LEDGER DE VIAJE</span><br/>
                        <span style="font-size: 8pt; font-weight: bold; color: #333;">SISTEMA MULTICOTIZADOR SPOT V2 — PETRAL SMART DASHBOARD</span>
                    </td>
                    <td style="width: 25%; text-align: right;">
                        <img src="{logo_geeksoft}" style="height: 38px;" />
                    </td>
                </tr>
            </table>

            <div class="console-block">{text_block}</div>

            <div style="font-weight: bold; font-size: 7pt; margin-bottom: 2px;">
                📊 [TABLA OFICIAL DE AUDITORÍA LEDGER — 12 MÉTRICAS REPLICADAS DE LA UI]:
            </div>

            <table class="metrics-table">
                <thead>
                    <tr>
                        <th style="width: 22%;">ÍTEM / MÉTRICA OFICIAL</th>
                        <th style="width: 32%;">FÓRMULA APLICADA</th>
                        <th style="width: 32%;">CÁLCULO SUSTITUIDO NUMÉRICO</th>
                        <th style="width: 14%;">GEEKSOFT ENGINE</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="bold">1. Ritmo Carga (act_load)</td>
                        <td>contract_load_rate</td>
                        <td>500 T/h (MOQUEGUA)</td>
                        <td class="text-right bold">500 T/h</td>
                    </tr>
                    <tr>
                        <td class="bold">2. Ritmo Descarga (act_disch)</td>
                        <td>contract_discharge_rate</td>
                        <td>345 T/h (MOQUEGUA)</td>
                        <td class="text-right bold">345 T/h</td>
                    </tr>
                    <tr>
                        <td class="bold">3. Días de Puerto (port_days)</td>
                        <td>Sum((Q/act_load)/24 + (Q/act_disch)/24 + idle)</td>
                        <td>Load({Q/500/24:.2f}d) + Disch({Q/345/24:.2f}d) + Overheads({port_days - (Q/500/24) - (Q/345/24):.2f}d)</td>
                        <td class="text-right bold">{port_days:.2f} Días</td>
                    </tr>
                    <tr>
                        <td class="bold">4. Días de Mar (sea_days)</td>
                        <td>Sum((dist_leg * (1 + WF)) / (speed * 24))</td>
                        <td>{sea_days_calc_str}</td>
                        <td class="text-right bold">{sea_days:.2f} Días</td>
                    </tr>
                    <tr>
                        <td class="bold">5. Días de Viaje (tot_dur)</td>
                        <td>sea_days + port_days</td>
                        <td>{sea_days:.2f}d Mar + {port_days:.2f}d Puerto</td>
                        <td class="text-right bold">{tot_days:.2f} Días</td>
                    </tr>
                    <tr>
                        <td class="bold">6. Income (income)</td>
                        <td>Sum(Q_leg * F_leg)</td>
                        <td>{num_legs - 1} Descargas × 13,500 MT × ${F:.2f} USD/MT</td>
                        <td class="text-right bold">${net_income:,.2f}</td>
                    </tr>
                    <tr>
                        <td class="bold">7. Comisiones (commissions)</td>
                        <td>income * (addr_comm + bkr_comm)</td>
                        <td>${net_income:,.2f} × 0.00%</td>
                        <td class="text-right bold">$0.00</td>
                    </tr>
                    <tr>
                        <td class="bold">8. Costo Bunker (bunker)</td>
                        <td>bunker_sea + bunker_port</td>
                        <td>{ifo_tonnage:,.2f}t IFO × ${p_ifo:,.2f} + {mdo_tonnage:,.2f}t MDO × ${p_mdo:,.2f}</td>
                        <td class="text-right bold">${bunker_cost:,.2f}</td>
                    </tr>
                    <tr>
                        <td class="bold">9. Port Costs (port_costs)</td>
                        <td>Sum(agency_origin + agency_dest)</td>
                        <td>Puertos Origen + Puertos Destino</td>
                        <td class="text-right bold">${port_costs:,.2f}</td>
                    </tr>
                    <tr>
                        <td class="bold">10. Voyage Result (voy_res)</td>
                        <td>income - comm - bunker - port_costs</td>
                        <td>${net_income:,.2f} - ${bunker_cost:,.2f} - ${port_costs:,.2f}</td>
                        <td class="text-right bold">${pnl_net:,.2f}</td>
                    </tr>
                    <tr>
                        <td class="bold">11. TCE Diario (tce_real)</td>
                        <td>voyage_result / tot_dur</td>
                        <td>${pnl_net:,.2f} / {tot_days:.2f} Días</td>
                        <td class="text-right bold">${tce_real:,.2f}/día</td>
                    </tr>
                    <tr>
                        <td class="bold">12. P/L (pl_vs_req)</td>
                        <td>income - comm - bunker - port_costs - (tot_days * tce_req)</td>
                        <td>${net_income:,.2f} - ${bunker_cost:,.2f} - ${port_costs:,.2f} - ({tot_days:.2f}d × ${tce_req:,.2f}/d)</td>
                        <td class="text-right bold">${pl_vs_req:,.2f}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </body>
    </html>
    """

    out_obsidian = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.1\DashBoardPetral\ACTA_AUDITORIA_FINAL_PROSPECTO_4_PIERNAS.pdf"
    out_root = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\ACTA_AUDITORIA_FINAL_PROSPECTO_4_PIERNAS.pdf"

    HTML(string=html_content).write_pdf(out_obsidian)
    HTML(string=html_content).write_pdf(out_root)

    print(f"📄 PDF Auténtico Auditoría Final Generado Exitosamente en Vault: {out_obsidian}")
    print(f"📄 PDF Auténtico Auditoría Final Generado Exitosamente en Raíz: {out_root}")

if __name__ == "__main__":
    build_acta_4_legs_official_format()
