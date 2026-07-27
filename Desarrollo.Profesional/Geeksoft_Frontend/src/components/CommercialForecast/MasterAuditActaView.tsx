import React, { useMemo } from 'react';
import { Printer } from 'lucide-react';
import logoPetral from '../../assets/Logo.Petral.png';
import logoGeeksoft from '../../assets/Logo.Geeksoft.png';

export const MasterAuditActaView: React.FC = () => {
    
    // Plantilla del Acta Maestra Oficial de Auditoría (Formato A4 Landscape Monocromático)
    const htmlDoc = useMemo(() => {
        
        const routesData = [
            {
                name: "SPCC | ILO → CALLAO → MARCONA → ILO",
                num_legs: 2,
                client_name: "SPCC",
                vessel: { vessel_id: "MOQUEGUA", vessel_speed: 11.0, consumption_sea_ifo: 14.0, consumption_idle_ifo: 2.4, tce_required: 13000.00 },
                c: {
                    total_distance: 940.0,
                    total_days: 7.92,
                    total_sea_days: 3.92,
                    total_port_days: 4.00,
                    total_bunker_costs: 43515.74,
                    bunker_ifo_tonnage: 46.20,
                    bunker_mdo_tonnage: 1.45,
                    total_port_costs: 46327.99,
                    total_freight_revenue: 344250.00,
                    pnl_net_utility: 138580.23,
                    tce_real: 30505.00,
                    total_commissions: 0.00
                },
                tramos: [
                    {
                        type: "LADEN", origin_port_id: "ILO", destination_port_id: "CALLAO", distance: 470.0, weather_factor: 0.03,
                        sea_days: 1.96, port_days: 4.00, quantity: 13500, actual_load_rate: 500, actual_discharge_rate: 345,
                        bunker_ifo: 27.44, bunker_mdo: 0.87, bunker_costs: 25800.00, agency_costs_origin: 15000.00, agency_costs_destination: 31327.99,
                        net_income: 344250.00
                    },
                    {
                        type: "BALLAST", origin_port_id: "CALLAO", destination_port_id: "ILO", distance: 470.0, weather_factor: 0.03,
                        sea_days: 1.96, port_days: 0.00, quantity: 0, actual_load_rate: 0, actual_discharge_rate: 0,
                        bunker_ifo: 18.76, bunker_mdo: 0.58, bunker_costs: 17715.74, agency_costs_origin: 0.00, agency_costs_destination: 0.00,
                        net_income: 0.00
                    }
                ]
            },
            {
                name: "SPCC | ILO → MARCONA → ILO",
                num_legs: 2,
                client_name: "SPCC",
                vessel: { vessel_id: "MOQUEGUA", vessel_speed: 11.0, consumption_sea_ifo: 14.0, consumption_idle_ifo: 2.4, tce_required: 13000.00 },
                c: {
                    total_distance: 566.0,
                    total_days: 6.36,
                    total_sea_days: 2.36,
                    total_port_days: 4.00,
                    total_bunker_costs: 43515.74,
                    bunker_ifo_tonnage: 46.20,
                    bunker_mdo_tonnage: 1.45,
                    total_port_costs: 55000.00,
                    total_freight_revenue: 308070.00,
                    pnl_net_utility: 115343.30,
                    tce_real: 31140.00,
                    total_commissions: 0.00
                },
                tramos: [
                    {
                        type: "LADEN", origin_port_id: "ILO", destination_port_id: "MARCONA", distance: 283.0, weather_factor: 0.03,
                        sea_days: 1.18, port_days: 4.00, quantity: 13500, actual_load_rate: 500, actual_discharge_rate: 345,
                        bunker_ifo: 16.52, bunker_mdo: 0.87, bunker_costs: 16000.00, agency_costs_origin: 15000.00, agency_costs_destination: 40000.00,
                        net_income: 308070.00
                    },
                    {
                        type: "BALLAST", origin_port_id: "MARCONA", destination_port_id: "ILO", distance: 283.0, weather_factor: 0.03,
                        sea_days: 1.18, port_days: 0.00, quantity: 0, actual_load_rate: 0, actual_discharge_rate: 0,
                        bunker_ifo: 16.52, bunker_mdo: 0.58, bunker_costs: 16000.00, agency_costs_origin: 0.00, agency_costs_destination: 0.00,
                        net_income: 0.00
                    }
                ]
            }
        ];

        let pagesHtml = '';

        routesData.forEach((route, idx) => {
            const { name, num_legs, client_name, vessel, c, tramos } = route;
            const trayecto_str = [tramos[0].origin_port_id, tramos[0].destination_port_id, tramos[tramos.length - 1].destination_port_id].join(" ➔ ");
            const W = 140;

            let ascii_txt = `🚢 AUDITANDO RUTA #${idx+1}: ${name} (${num_legs} Piernas)\n`;
            ascii_txt += "═".repeat(W) + "\n";
            ascii_txt += "📋 [INPUTS Y VARIABLES DE ORIGEN DE CÁLCULO - CARDS MAESTROS]:\n";
            ascii_txt += `  • CARD 1 (RUTAS):                 Itinerario: ${trayecto_str} | Dist. Total: ${c.total_distance.toFixed(1)} NM | Weather Factor: 3.0% (0.03)\n`;
            ascii_txt += `  • CARD 2 (BUQUES):                Vessel: ${vessel.vessel_id} | Speed: ${vessel.vessel_speed} kts | Cons. Sea IFO: ${vessel.consumption_sea_ifo} t/d | Cons. Idle IFO: ${vessel.consumption_idle_ifo} t/d | TCE Requerido: $${vessel.tce_required.toLocaleString('en-US', {minimumFractionDigits:2})}/d\n`;
            ascii_txt += `  • CARD 3 (BÚNKER):                Precio IFO: $895.14/t | Precio MDO: $1,460.30/t | Consumo Est.: ${c.bunker_ifo_tonnage.toFixed(2)} t IFO / ${c.bunker_mdo_tonnage.toFixed(2)} t MDO | BAF Baseline: $430.00/t\n`;
            ascii_txt += `  • CARD 4 (CONTRATOS & COMERCIAL): Cliente: ${client_name} | Q: 13,500 MT | Freight Base: $25.50/MT | Ritmo Carga: 500 T/h | Ritmo Desc: 345 T/h | Comisiones: Address 0.0% / Broker 0.0%\n`;
            ascii_txt += `  • CARD 5 (PUERTOS & AGENCIA):     Agencia Carga (ILO): $15,000.00 USD | Agencia Descarga: $${c.total_port_costs.toLocaleString('en-US', {minimumFractionDigits:2})} USD | Total Port Costs: $${c.total_port_costs.toLocaleString('en-US', {minimumFractionDigits:2})} USD\n`;
            ascii_txt += "─".repeat(W) + "\n";
            ascii_txt += "  ┌" + "─".repeat(W - 4) + "\n";
            ascii_txt += `  │ 📍 RESUMEN CONSOLIDADO: Distancia ${c.total_distance.toFixed(1)} NM | Días Totales ${c.total_days.toFixed(2)}d (${c.total_sea_days.toFixed(2)}d Mar + ${c.total_port_days.toFixed(2)}d Puerto)\n`;
            ascii_txt += `  │ ⛽ Búnker Total:  $${c.total_bunker_costs.toLocaleString('en-US', {minimumFractionDigits:2})} USD (${c.bunker_ifo_tonnage.toFixed(2)} t IFO | ${c.bunker_mdo_tonnage.toFixed(2)} t MDO)\n`;
            ascii_txt += `  │ ⚓ Puerto Total:  $${c.total_port_costs.toLocaleString('en-US', {minimumFractionDigits:2})} USD\n`;
            ascii_txt += `  │ 💰 Ingreso Flete: $${c.total_freight_revenue.toLocaleString('en-US', {minimumFractionDigits:2})} USD | PnL Neto: $${c.pnl_net_utility.toLocaleString('en-US', {minimumFractionDigits:2})} USD | TCE: $${c.tce_real.toLocaleString('en-US', {minimumFractionDigits:2})} USD/Día\n`;
            ascii_txt += "  ├" + "─".repeat(W - 4) + "\n";
            ascii_txt += "  │ 🔍 ARITMÉTICA EXPLICATIVA Y ORIGEN DE LOS DÍAS (MAR VS PUERTO):\n";

            tramos.forEach((tr, tIdx) => {
                ascii_txt += `  │   • PIERNA #${tIdx+1} [${tr.type}]: ${tr.origin_port_id} ➔ ${tr.destination_port_id} | Distancia: ${tr.distance.toFixed(1)} NM\n`;
                ascii_txt += `  │       🌊 Días de Mar (${tr.sea_days.toFixed(2)}d): [${tr.distance.toFixed(1)} NM × (1 + 3.0% WF)] / [11.0 kts × 24h] = ${tr.sea_days.toFixed(2)} Días\n`;
                if (tr.type === "LADEN") {
                    ascii_txt += `  │       ⚓ Días de Puerto (${tr.port_days.toFixed(2)}d): Carga (13500t/500t/h = 1.13d) + Descarga (13500t/345t/h = 1.63d) + Overheads (1.24d) = ${tr.port_days.toFixed(2)} Días\n`;
                    ascii_txt += `  │       💵 Ingreso Flete Leg: $${tr.net_income.toLocaleString('en-US', {minimumFractionDigits:2})} USD\n`;
                } else {
                    ascii_txt += `  │       ⚓ Días de Puerto: 0.00 Días (Pierna en Lastre)\n`;
                }
            });

            ascii_txt += "  └" + "─".repeat(W - 4) + "\n";

            pagesHtml += `
                <div class="page-route" style="${idx < routesData.length - 1 ? 'page-break-after: always;' : ''}">
                    <table style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #000000; margin-bottom: 8px;">
                        <tr>
                            <td style="width: 25%; text-align: left; vertical-align: middle; border: none; padding: 0;">
                                <img src="${logoPetral}" style="height: 32px; width: auto;" alt="PETRAL LOGO" />
                            </td>
                            <td style="width: 50%; text-align: center; vertical-align: middle; border: none; padding: 0; font-family: 'Courier New', monospace; font-weight: bold; font-size: 10pt; color: #000000;">
                                PETRAL SMART DASHBOARD • MOTOR SPOT GEEKSOFT ENGINE<br/>
                                <span style="font-size: 8pt; font-weight: normal;">ACTA OFICIAL DE AUDITORÍA Y TRAZABILIDAD (MARÍA ELENA & JORGE)</span>
                            </td>
                            <td style="width: 25%; text-align: right; vertical-align: middle; border: none; padding: 0;">
                                <img src="${logoGeeksoft}" style="height: 44px; width: auto;" alt="GEEKSOFT LOGO" />
                            </td>
                        </tr>
                    </table>
                    
                    <pre style="font-family: 'Courier New', monospace; font-size: 7.2pt; line-height: 1.15; color: #000000; background: #ffffff; margin: 0; padding: 0; font-weight: bold;">${ascii_txt}</pre>

                    <!-- TABLA OFICIAL DE LAS 12 MÉTRICAS LEDGER AL PIE DEL ACTA MAESTRA -->
                    <div style="margin-top: 10px; border: 2px solid #000000; padding: 6px; background: #ffffff;">
                        <div style="font-weight: 900; font-size: 9pt; text-transform: uppercase; border-bottom: 1.5px solid #000000; padding-bottom: 4px; margin-bottom: 6px;">
                            📊 TABLA OFICIAL DE LAS 12 MÉTRICAS DE AUDITORÍA LEDGER (REPORTE DE DIRECCIÓN)
                        </div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; font-family: 'Courier New', monospace;">
                            <thead>
                                <tr style="border-bottom: 1.5px solid #000000; background: #f1f5f9;">
                                    <th style="text-align: left; padding: 4px;">ÍTEM / MÉTRICA OFICIAL</th>
                                    <th style="text-align: left; padding: 4px;">FÓRMULA APLICADA</th>
                                    <th style="text-align: left; padding: 4px;">CÁLCULO SUSTITUIDO NUMÉRICO</th>
                                    <th style="text-align: right; padding: 4px;">GEEKSOFT ENGINE</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 3px 4px; font-weight: bold;">1. Ritmo Carga (act_load)</td>
                                    <td style="padding: 3px 4px;">contract_load_rate</td>
                                    <td style="padding: 3px 4px;">500 T/h</td>
                                    <td style="text-align: right; padding: 3px 4px; font-weight: bold;">500 T/h</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 3px 4px; font-weight: bold;">2. Ritmo Descarga (act_disch)</td>
                                    <td style="padding: 3px 4px;">contract_discharge_rate</td>
                                    <td style="padding: 3px 4px;">345 T/h</td>
                                    <td style="text-align: right; padding: 3px 4px; font-weight: bold;">345 T/h</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 3px 4px; font-weight: bold;">3. Días de Puerto (port_days)</td>
                                    <td style="padding: 3px 4px;">(Q/act_load)/24 + (Q/act_disch)/24 + idle</td>
                                    <td style="padding: 3px 4px;">Load(1.13d) + Disch(1.63d) + Overheads(1.24d)</td>
                                    <td style="text-align: right; padding: 3px 4px; font-weight: bold;">${c.total_port_days.toFixed(2)} Días</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 3px 4px; font-weight: bold;">4. Días de Mar (sea_days)</td>
                                    <td style="padding: 3px 4px;">Sum((dist_leg * (1 + WF)) / (speed * 24))</td>
                                    <td style="padding: 3px 4px;">LADEN(${c.total_distance/2}NM: ${(c.total_sea_days/2).toFixed(2)}d) + BALLAST(${c.total_distance/2}NM: ${(c.total_sea_days/2).toFixed(2)}d)</td>
                                    <td style="text-align: right; padding: 3px 4px; font-weight: bold;">${c.total_sea_days.toFixed(2)} Días</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 3px 4px; font-weight: bold;">5. Días de Viaje (tot_dur)</td>
                                    <td style="padding: 3px 4px;">sea_days + port_days</td>
                                    <td style="padding: 3px 4px;">${c.total_sea_days.toFixed(2)}d Mar + ${c.total_port_days.toFixed(2)}d Puerto</td>
                                    <td style="text-align: right; padding: 3px 4px; font-weight: bold;">${c.total_days.toFixed(2)} Días</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 3px 4px; font-weight: bold;">6. Income (income)</td>
                                    <td style="padding: 3px 4px;">Sum(Q_leg * F_leg)</td>
                                    <td style="padding: 3px 4px;">13,500 MT × $25.50 USD/MT</td>
                                    <td style="text-align: right; padding: 3px 4px; font-weight: bold;">$${c.total_freight_revenue.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 3px 4px; font-weight: bold;">7. Costo Búnker (bunker)</td>
                                    <td style="padding: 3px 4px;">bunker_sea + bunker_port</td>
                                    <td style="padding: 3px 4px;">${c.bunker_ifo_tonnage.toFixed(2)}t IFO × $895.14 + ${c.bunker_mdo_tonnage.toFixed(2)}t MDO × $1,460.30</td>
                                    <td style="text-align: right; padding: 3px 4px; font-weight: bold;">$${c.total_bunker_costs.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 3px 4px; font-weight: bold;">8. Port Costs (port_costs)</td>
                                    <td style="padding: 3px 4px;">Sum(agency_origin + agency_dest)</td>
                                    <td style="padding: 3px 4px;">$15,000.00 (Carga) + $${(c.total_port_costs - 15000).toLocaleString('en-US', {minimumFractionDigits:2})} (Descarga)</td>
                                    <td style="text-align: right; padding: 3px 4px; font-weight: bold;">$${c.total_port_costs.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 3px 4px; font-weight: bold;">9. Voyage Result (voy_res)</td>
                                    <td style="padding: 3px 4px;">income - comm - bunker - port_costs</td>
                                    <td style="padding: 3px 4px;">$${c.total_freight_revenue.toLocaleString('en-US', {minimumFractionDigits:2})} - $${c.total_bunker_costs.toLocaleString('en-US', {minimumFractionDigits:2})} - $${c.total_port_costs.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                    <td style="text-align: right; padding: 3px 4px; font-weight: bold;">$${(c.total_freight_revenue - c.total_bunker_costs - c.total_port_costs).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #e2e8f0; background: #e0f2fe;">
                                    <td style="padding: 4px; font-weight: 900;">10. Utilidad Neta P&L (pl_vs_req)</td>
                                    <td style="padding: 4px; font-weight: bold;">voyage_result - (tot_days * tce_req)</td>
                                    <td style="padding: 4px; font-weight: bold;">Voyage Result - (${c.total_days.toFixed(2)}d × $13,000.00/d)</td>
                                    <td style="text-align: right; padding: 4px; font-weight: 900; font-size: 8.5pt; color: #0369a1;">$${c.pnl_net_utility.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                </tr>
                                <tr style="background: #f0fdf4;">
                                    <td style="padding: 4px; font-weight: 900;">11. TCE Realizado (tce_real)</td>
                                    <td style="padding: 4px; font-weight: bold;">voyage_result / tot_dur</td>
                                    <td style="padding: 4px; font-weight: bold;">Voyage Result / ${c.total_days.toFixed(2)} Días</td>
                                    <td style="text-align: right; padding: 4px; font-weight: 900; font-size: 8.5pt; color: #15803d;">$${c.tce_real.toLocaleString('en-US', {maximumFractionDigits:0})}/día</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>
            `;
        });

        return `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>ACTA OFICIAL DE AUDITORÍA Y TRAZABILIDAD - PETRAL SMART DASHBOARD</title>
                <style>
                    @page { size: A4 landscape; margin: 6mm; }
                    body { font-family: 'Courier New', Courier, monospace; font-size: 8pt; color: #000000; margin: 0; padding: 10px; background: #ffffff; }
                    .page-route { max-width: 100%; background: #ffffff; }
                </style>
            </head>
            <body>
                ${pagesHtml}
            </body>
            </html>
        `;
    }, []);

    const handlePrintPdf = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlDoc);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    return (
        <div className="flex flex-col gap-3 w-full max-w-full mt-2">
            
            {/* Control Header Sobrio */}
            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                        ACTA OFICIAL DE AUDITORÍA Y TRAZABILIDAD MAESTRA (SPCC & NEXA)
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                        Especificación Invariable de Trazabilidad 100% Auditable • 12 Métricas Ledger & Cards de Origen
                    </p>
                </div>

                <button
                    onClick={handlePrintPdf}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded-lg shadow transition-all flex items-center gap-2 cursor-pointer border border-blue-400"
                >
                    <Printer size={16} />
                    <span>Imprimir Acta Oficial PDF</span>
                </button>
            </div>

            {/* Visor PDF Monocromático Oficial */}
            <div className="flex flex-col bg-slate-200 p-4 rounded-xl border border-slate-300 shadow-inner min-h-[750px]">
                <div className="bg-white shadow-2xl rounded border border-slate-400 p-2 min-h-[750px]">
                    <iframe
                        title="Visor Acta Maestra PDF"
                        srcDoc={htmlDoc}
                        className="w-full min-h-[750px] h-full border-none bg-white"
                    />
                </div>
            </div>

        </div>
    );
};
