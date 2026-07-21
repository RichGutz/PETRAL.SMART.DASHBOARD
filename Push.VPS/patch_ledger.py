import sys
import re

filepath = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\VoyageLedgerFinal.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# We want to replace the block starting at `{runResult && runResult.tramos && runResult.tramos.map((tr: any, idx: number) => {`
# up to `            })}` at the end of the file (before `        </section>` and `    );` and `};`)

replacement = """            {runResult && (() => {
                const tramos = runResult.tramos || [];
                const cons = runResult.consolidated || {};
                const req = vessels.find(v => v.vessel_id === selectedVesselId)?.tce_required || 0;
                const v = vessels.find(v => v.vessel_id === selectedVesselId) || {};
                
                const total_duration = cons.total_days || 0;
                const tce = cons.tce || 0;

                // Aggregate port_costs_breakdown for UI
                const aggOrigin: any = {};
                const aggDest: any = {};
                tramos.forEach((tr: any, idx: number) => {
                    if (tr.type === 'LADEN' || (tr.type === 'BALLAST' && idx === 0)) {
                        const oBreak = tr.agency_costs_origin_details?.breakdown || { [tr.origin_port_id]: tr.agency_costs_origin || 0 };
                        for (const k in oBreak) aggOrigin[k] = (aggOrigin[k] || 0) + oBreak[k];
                    }
                    if (tr.type === 'LADEN') {
                        const dBreak = tr.agency_costs_destination_details?.breakdown || { [tr.destination_port_id]: tr.agency_costs_destination || 0 };
                        for (const k in dBreak) aggDest[k] = (aggDest[k] || 0) + dBreak[k];
                    }
                });
                
                // Consolidad audit formulas - just simple strings since the real formulas are in tramos
                const enhanced_audit: Record<string, any> = {
                    '1. Ritmo Carga (act_load)': { formula: 'Promedio', values: 'N/A Consolidado' },
                    '2. Ritmo Descarga (act_disch)': { formula: 'Promedio', values: 'N/A Consolidado' },
                    '3. Días de Puerto (port_days)': { formula: 'Σ Días de puerto', values: `${cons.total_port_days?.toFixed(4)}` },
                    '4. Días de Mar (sea_days)': { formula: 'Σ Días de mar', values: `${cons.total_sea_days?.toFixed(4)}` },
                    '5. Días de Viaje (tot_dur)': { formula: 'sea_days + port_days', values: `${total_duration.toFixed(4)}` },
                    '6. Income (income)': { formula: 'Σ (Q × F)', values: `$${(cons.total_freight_revenue||0).toLocaleString()}` },
                    '7. Comisiones (commissions)': { formula: 'addr_comm + broker_comm', values: '$0.00 (0.00%)' },
                    '8. Costo Bunker (bunker)': { formula: 'Σ Costo Bunker', values: `$${(cons.total_bunker_costs||0).toLocaleString()}` },
                    '9. Port Costs (port_costs)': { formula: 'Σ Costos de Agencia', values: `$${(cons.total_port_costs||0).toLocaleString()}` },
                    '10. Voyage Result (voy_res)': { formula: 'Income − Bunker − Port Costs', values: `$${(cons.net_utility||0).toLocaleString()}` },
                    '11. TCE Diario (tce_real)': { formula: 'Voyage Result / Total Days', values: `$${tce.toLocaleString()}` },
                    '12. P/L (pl_vs_req)': { formula: 'voy_res − (tce_req × tot_dur)', values: `$${((cons.net_utility||0) - (req * total_duration)).toLocaleString()}` }
                };

                const mockedScenario = {
                    distancia_total: cons.total_distance || 0,
                    audit_trail: enhanced_audit,
                    port_costs_breakdown: {
                        origin: aggOrigin,
                        destination: aggDest
                    },
                    raw_inputs: {
                        tramos: legsConfig,
                        weather_factor_laden: tramos[0]?.weather_factor_laden ?? 0.03,
                        weather_factor_ballast: tramos[0]?.weather_factor_ballast ?? 0.03,
                        vessel_speed: v.vessel_speed,
                        tce_required: req,
                        dwt: v.dwt,
                        dwcc: v.dwcc,
                        length: v.length,
                        beam: v.beam
                    },
                    actual_load_rate: 0,
                    actual_discharge_rate: 0,
                    port_days_unit: cons.total_port_days,
                    sea_days_unit: cons.total_sea_days,
                    total_duration_unit: total_duration,
                    net_income: cons.total_freight_revenue,
                    total_commissions: 0,
                    total_bunker_costs_unit: cons.total_bunker_costs,
                    total_port_costs: cons.total_port_costs,
                    voyage_result: cons.net_utility,
                    tce_real_unit: tce,
                    pl_vs_required_unit: (cons.net_utility || 0) - (req * total_duration)
                };

                return (
                    <div className="mt-6 border-t-4 border-slate-300 pt-6">
                        <div className="flex justify-between items-center mb-4 bg-emerald-50 py-2.5 px-4 rounded-lg border border-emerald-200 shadow-sm">
                            <h4 className="font-bold text-lg text-emerald-800 uppercase tracking-wide">
                                Acta Matemática Consolidada (Multiruta)
                            </h4>
                        </div>
                        {renderScenarioContent(
                            v.vessel_name || selectedVesselId, 
                            tramos[0]?.origin_port_id || "MULTI", 
                            tramos[tramos.length-1]?.destination_port_id || "MULTI", 
                            mockedScenario, 
                            { act_load: 0, act_disch: 0, port_days: 0, sea_days: 0, bunker_costs: 0, voyage_result: 0, total_duration: 0, tce_real: 0, pl_vs_req: 0 }, 
                            false,
                            undefined,
                            (
                                <button
                                    onClick={() => {
                                        if (!mockedScenario || !mockedScenario.audit_trail) { alert('No hay datos cargados aún.'); return; }
                                        const audit_t = mockedScenario.audit_trail;
                                        const fmtCur = (val: any) => {
                                            const num = parseFloat(val);
                                            return isNaN(num) ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
                                        };
                                        const fmtNum = (val: any) => {
                                            const num = parseFloat(val);
                                            return isNaN(num) ? '—' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(num);
                                        };
                                        const vName = v.vessel_name || selectedVesselId;
                                        const o = tramos[0]?.origin_port_id || "MULTI";
                                        const d = tramos[tramos.length-1]?.destination_port_id || "MULTI";
                                        const now = new Date();
                                        const fechaStr = now.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
                                        const legsHtml = legsConfig.map((t: any, i: number) => {
                                            if (i === legsConfig.length - 1) return '';
                                            const tipo = t.action === 'NONE' ? 'BALLAST' : 'LADEN';
                                            const nextDest = legsConfig[i+1].port_id;
                                            return `<div class="card-row"><span>Pierna ${i+1} (${tipo})</span><strong>${t.port_id} &rarr; ${nextDest}: ${fmtNum(t.distance || 0)} NM</strong></div>`;
                                        }).join('');

                                        const cardsHTML = `
                                        <div class="cards-grid">
                                            <div class="card card-blue">
                                                <div class="card-header">
                                                    <h3>Maestro Rutas</h3><span class="card-badge">ROUTES</span>
                                                </div>
                                                <div class="card-content">
                                                    <div class="card-row"><span>Origen &rarr; Destino</span><strong>${o} &rarr; ${d}</strong></div>
                                                    ${legsHtml}
                                                    <div class="card-row card-divider"><span>Dist. TOTAL VIAJE</span><strong>${fmtNum(cons.total_distance)} NM</strong></div>
                                                    <div class="card-row"><span>W Fct (Laden)</span><strong>${((tramos[0]?.weather_factor_laden || 0)*100).toFixed(1)}%</strong></div>
                                                    <div class="card-row"><span>W Fct (Ballast)</span><strong>${((tramos[0]?.weather_factor_ballast || 0)*100).toFixed(1)}%</strong></div>
                                                </div>
                                            </div>
                                            <div class="card card-green">
                                                <div class="card-header">
                                                    <h3>Barco (Flota)</h3><span class="card-badge">VESSELS</span>
                                                </div>
                                                <div class="card-content">
                                                    <div class="card-row"><span>Buque</span><strong>${vName}</strong></div>
                                                    <div class="card-row"><span>TCE Requerido</span><strong>${fmtCur(req)}/día</strong></div>
                                                    <div class="card-row"><span>Velocidad</span><strong>${fmtNum(v.vessel_speed)} Kts</strong></div>
                                                    <div class="card-row card-divider"><span>DWT</span><strong>${fmtNum(v.dwt)} MT</strong></div>
                                                    <div class="card-row"><span>IFO (Sea/Idle)</span><strong>${fmtNum(v.consumption_sea_ifo)} / ${fmtNum(v.consumption_idle_ifo)} T/d</strong></div>
                                                    <div class="card-row"><span>MDO (Sea/Idle)</span><strong>${fmtNum(v.consumption_sea_mdo)} / ${fmtNum(v.consumption_idle_mdo)} T/d</strong></div>
                                                </div>
                                            </div>
                                        </div>`;

                                        const METRICS = [
                                            { k: '1. Ritmo Carga (act_load)', db: 'Carga', ex: 'Carga' },
                                            { k: '2. Ritmo Descarga (act_disch)', db: 'Desc', ex: 'Desc' },
                                            { k: '3. Días de Puerto (port_days)', db: 'Total', ex: 'Total' },
                                            { k: '4. Días de Mar (sea_days)', db: 'Total', ex: 'Total' },
                                            { k: '5. Días de Viaje (tot_dur)', db: 'Total', ex: 'Total' },
                                            { k: '6. Income (income)', db: 'Net', ex: 'Net' },
                                            { k: '7. Comisiones (commissions)', db: '0%', ex: '0%' },
                                            { k: '8. Costo Bunker (bunker)', db: 'Sum', ex: 'Sum' },
                                            { k: '9. Port Costs (port_costs)', db: 'Sum', ex: 'Sum' },
                                            { k: '10. Voyage Result (voy_res)', db: 'Net', ex: 'Net' },
                                            { k: '11. TCE Diario (tce_real)', db: 'Net', ex: 'Net' },
                                            { k: '12. P/L (pl_vs_req)', db: 'Net', ex: 'Net' }
                                        ];

                                        let tableRows = '';
                                        METRICS.forEach(m => {
                                            const info = audit_t[m.k] || {};
                                            const f = info.formula || 'No formula';
                                            const v = info.values || 'No calc';
                                            tableRows += `<tr>
                                                <td style="font-weight:700; color:#0f172a;">${m.k}</td>
                                                <td style="font-size:9px; color:#475569;">${f}</td>
                                                <td style="font-size:9.5px; font-family:monospace; color:#334155; letter-spacing:-0.2px">${v}</td>
                                                <td style="text-align:center; font-weight:900; color:#059669; font-size:10px">${m.db}</td>
                                                <td style="text-align:center; font-weight:700; color:#2563eb; font-size:10px">${m.ex}</td>
                                                <td style="text-align:center; font-weight:900; color:#0284c7; font-size:10.5px">-</td>
                                            </tr>`;
                                        });

                                        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Acta Auditoría</title>
                                        <style>
                                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
                                            body { font-family: 'Inter', sans-serif; font-size: 10px; color: #1e293b; padding: 12px; margin: 0; background: #fff; line-height: 1.3; }
                                            .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; }
                                            .header-bar h1 { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin: 0; letter-spacing: -0.3px; }
                                            .badge { background: #0f172a; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; }
                                            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #cbd5e1; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                                            th { background: #f1f5f9; color: #334155; font-size: 9.5px; font-weight: 800; text-transform: uppercase; padding: 6px; text-align: left; border: 1px solid #cbd5e1; }
                                            td { padding: 5px 6px; border: 1px solid #e2e8f0; vertical-align: middle; }
                                            tbody tr:nth-child(even) { background: #f8fafc; }
                                            .cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
                                            .card { border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                                            .card-header { padding: 4px 8px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; }
                                            .card-header h3 { margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; }
                                            .card-badge { font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 3px; }
                                            .card-content { padding: 6px 8px; display: flex; flex-direction: column; gap: 3px; }
                                            .card-row { display: flex; justify-content: space-between; align-items: baseline; font-size: 9.5px; }
                                            .card-row span { color: #475569; font-weight: 600; text-transform: uppercase; font-size: 8.5px; }
                                            .card-row strong { color: #0f172a; font-family: monospace; font-size: 10px; font-weight: 700; }
                                            .card-divider { border-top: 1px dashed #cbd5e1; margin-top: 2px; padding-top: 2px; }
                                            .card-blue .card-header  { background: #dbeafe; color: #1e3a8a; }
                                            .card-blue .card-badge   { background: #bfdbfe; color: #1e3a8a; }
                                            .card-blue               { background: #eff6ff; }
                                            .card-green .card-header { background: #d1fae5; color: #064e3b; }
                                            .card-green .card-badge  { background: #a7f3d0; color: #064e3b; }
                                            .card-green              { background: #f0fdf4; }
                                            .acta { border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 8px; margin-top: 3px; background: #fafafa; }
                                            .acta-title { font-weight: 700; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.4px; color: #475569; margin-bottom: 2px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; }
                                            .acta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                                            .field-row { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
                                            .field-label { font-weight: 700; color: #334155; font-size: 9.5px; white-space: nowrap; min-width: 65px; }
                                            .field-line { border-bottom: 1px solid #94a3b8; height: 12px; flex: 1; }
                                            .check-row { display: flex; gap: 10px; align-items: center; margin-bottom: 2px; font-size: 9.5px; }
                                            .check-box { display: inline-block; width: 9px; height: 9px; border: 1px solid #64748b; vertical-align: middle; margin-right: 2px; }
                                            -webkit-print-color-adjust: exact; print-color-adjust: exact;
                                        </style></head><body>
                                        <div class="header-bar">
                                            <div style="flex:1">
                                                <h1>GEEKSOFT Voyage Ledger — Auditoría Matemática (Multiruta) &nbsp;|&nbsp; Barco: ${vName.replace('_',' ')} &nbsp;|&nbsp; Ruta: ${o} → ${d} &nbsp;|&nbsp; Período: 2026-07 &nbsp;|&nbsp; Generado: ${fechaStr}</h1>
                                            </div>
                                            <span class="badge">PETRAL · ACTA DE CONFORMIDAD</span>
                                        </div>
                                        ${cardsHTML}
                                        <table>
                                            <thead><tr>
                                                <th style="width:13%">Métrica</th>
                                                <th style="width:27%">Fórmula Algorítmica</th>
                                                <th style="width:22%">Reemplazo Numérico</th>
                                                <th style="width:12%;text-align:center">GEEKSOFT (Motor)</th>
                                                <th style="width:13%;text-align:center">PETRAL (Excel)</th>
                                                <th style="width:13%;text-align:center">Delta (Δ)</th>
                                            </tr></thead>
                                            <tbody>
                                                ${tableRows}
                                            </tbody>
                                        </table>
                                        <div class="acta">
                                            <div class="acta-title">✍️ Acta de Conformidad Matemática — Firmas y Validación</div>
                                            <div class="acta-grid">
                                                <div style="display:flex;flex-direction:column;gap:4px">
                                                    <div class="field-row"><div class="field-label">Responsable:</div><div class="field-line"></div></div>
                                                    <div class="check-row">
                                                        <span class="field-label">Estado:</span>
                                                        <span><span class="check-box"></span> Aprobado</span>
                                                        <span><span class="check-box"></span> Con Errores</span>
                                                    </div>
                                                    <div class="field-row"><div class="field-label">Firma:</div><div class="field-line"></div></div>
                                                    <div class="field-row"><div class="field-label">Fecha:</div><div class="field-line"></div></div>
                                                </div>
                                                <div style="display:flex;flex-direction:column;">
                                                    <div class="field-label">Comentarios / Justificación de divergencias:</div>
                                                    <div style="border:1px solid #cbd5e1;flex:1;min-height:70px;background:white;border-radius:4px;margin-top:4px;"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <script>window.onload = function(){ window.print(); }</script>
                                        </body></html>`;
                                        const pw = window.open('', '_blank', 'width=1100,height=750');
                                        if (pw) { pw.document.write(html); pw.document.close(); }
                                        else { alert('El navegador bloqueó la ventana emergente. Habilítala para este sitio.'); }
                                    }}
                                    className="mt-2 h-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-md flex justify-center items-center gap-2 shadow transition-all cursor-pointer page-break-inside-avoid"
                                >
                                    <Printer size={15} /> Imprimir Acta PDF
                                </button>
                            )
                        )}
                    </div>
                );
            })()}"""

start_idx = content.find("{runResult && runResult.tramos && runResult.tramos.map((tr: any, idx: number) => {")
end_idx = content.find("            })}", start_idx) + len("            })}")

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + replacement + content[end_idx:]
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Patched successfully")
else:
    print("Could not find start or end block")
