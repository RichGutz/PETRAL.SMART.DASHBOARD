with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

original_mocked_scenario = """                const mockedScenario = {
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
                    },"""

new_mocked_scenario = """                // Inject missing audit formulas for UI presentation
                const enhanced_audit = { ...(tr.audit_trail || {}) };
                if (!enhanced_audit['1. Ritmo Carga (act_load)']) enhanced_audit['1. Ritmo Carga (act_load)'] = { formula: 'min(c_load, v_intake, t_load_rate)', values: tr.contract_agreed_load_rate || 'N/A' };
                if (!enhanced_audit['6. Income (income)']) enhanced_audit['6. Income (income)'] = { formula: 'Q * F', values: `${tr.quantity || 0} * ${tr.freight_rate || 0}` };
                if (!enhanced_audit['10. Voyage Result (voy_res)']) enhanced_audit['10. Voyage Result (voy_res)'] = { formula: 'Income - Bunker - Port Costs', values: `${tr.net_income || 0} - ${tr.bunker_costs || 0} - ${tr.port_costs || 0}` };
                if (!enhanced_audit['11. TCE Diario (tce_real)']) enhanced_audit['11. TCE Diario (tce_real)'] = { formula: 'Voyage Result / Total Days', values: `${tr.pnl_tramo || 0} / ${total_duration}` };
                if (!enhanced_audit['12. P/L (pl_vs_req)']) enhanced_audit['12. P/L (pl_vs_req)'] = { formula: 'TCE Diario - TCE Requerido', values: `${tce} - ${req}` };

                const mockedScenario = {
                    distancia_total: tr.distance || 0,
                    audit_trail: enhanced_audit,
                    raw_inputs: {
                        ...tr,
                        route_distance: tr.distance || 0,
                        bunker_price_ifo: 600,
                        bunker_price_mdo: 900,
                        weather_factor_laden: tr.weather_factor || 0,
                        weather_factor_ballast: tr.weather_factor || 0,
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
                    },"""

if original_mocked_scenario in c:
    c = c.replace(original_mocked_scenario, new_mocked_scenario)
    with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Replaced!")
else:
    print("Not found!")
