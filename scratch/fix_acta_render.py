with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# I will replace `setRunResult(res.aggregated_data?.['SPOT']?.['DYNAMIC']?.[selectedVesselId]?.[sim_key] || null);`
# with `setRunResult(res);`
c = c.replace("let sim_key = Object.keys(res.aggregated_data?.['SPOT']?.['DYNAMIC']?.[selectedVesselId] || {})[0];\n            setRunResult(res.aggregated_data?.['SPOT']?.['DYNAMIC']?.[selectedVesselId]?.[sim_key] || null);", "setRunResult(res);")

# Also I will fix the JSX where `renderScenarioContent` is called.
# It used to be:
original_jsx = """            {runResult && (
                <div className="mt-6 border-t-2 border-dashed border-slate-200 pt-6">
                    {renderScenarioContent(
                        selectedVesselId, 
                        legsConfig[0]?.port_id || '', 
                        legsConfig[legsConfig.length-1]?.port_id || '', 
                        runResult, 
                        { act_load: 0, act_disch: 0, port_days: 0, sea_days: 0, bunker_costs: 0, voyage_result: 0, total_duration: 0, tce_real: 0, pl_vs_req: 0 }, 
                        false
                    )}
                </div>
            )}"""

new_jsx = """            {runResult && runResult.tramos && runResult.tramos.map((tr: any, idx: number) => {
                const total_duration = (tr.sea_days || 0) + (tr.port_days || 0);
                const tce = total_duration > 0 ? (tr.pnl_tramo || 0) / total_duration : 0;
                const req = vessels.find(v => v.vessel_id === selectedVesselId)?.tce_required || 0;
                const v = vessels.find(v => v.vessel_id === selectedVesselId) || {};
                
                const mockedScenario = {
                    audit_trail: tr.audit_trail,
                    raw_inputs: {
                        vessel_speed: v.vessel_speed,
                        tce_required: req,
                        dwt: v.dwt,
                        dwcc: v.dwcc,
                        length: v.length,
                        beam: v.beam,
                        bunker_consumption_sea_ifo: v.consumption_sea_ifo,
                        bunker_consumption_idle_ifo: v.consumption_idle_ifo,
                        bunker_consumption_load_ifo: v.consumption_load_ifo,
                        bunker_consumption_disch_ifo: v.consumption_disch_ifo,
                        bunker_consumption_sea_mdo: v.consumption_sea_mdo,
                        bunker_consumption_idle_mdo: v.consumption_idle_mdo,
                        bunker_consumption_load_mdo: v.consumption_load_mdo,
                        bunker_consumption_disch_mdo: v.consumption_disch_mdo,
                    },
                    actual_load_rate: tr.contract_agreed_load_rate,
                    actual_discharge_rate: tr.contract_agreed_discharge_rate,
                    port_days_unit: tr.port_days,
                    sea_days_unit: tr.sea_days,
                    total_duration_unit: total_duration,
                    net_income: tr.net_income,
                    total_commissions: 0,
                    total_bunker_costs_unit: tr.bunker_costs,
                    total_port_costs: tr.port_costs,
                    voyage_result: tr.pnl_tramo,
                    tce_real_unit: tce,
                    pl_vs_required_unit: tce - req
                };
                
                return (
                    <div key={idx} className="mt-6 border-t-4 border-slate-300 pt-6">
                        <h4 className="font-bold text-lg mb-4 text-emerald-800 uppercase bg-emerald-50 py-2 px-4 rounded border border-emerald-200">
                            Acta de Tramo {idx + 1}: {tr.origin_port_id} ➝ {tr.destination_port_id}
                        </h4>
                        {renderScenarioContent(
                            v.vessel_name || selectedVesselId, 
                            tr.origin_port_id, 
                            tr.destination_port_id, 
                            mockedScenario, 
                            { act_load: 0, act_disch: 0, port_days: 0, sea_days: 0, bunker_costs: 0, voyage_result: 0, total_duration: 0, tce_real: 0, pl_vs_req: 0 }, 
                            false
                        )}
                    </div>
                );
            })}"""

c = c.replace(original_jsx, new_jsx)

with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print("Done")
