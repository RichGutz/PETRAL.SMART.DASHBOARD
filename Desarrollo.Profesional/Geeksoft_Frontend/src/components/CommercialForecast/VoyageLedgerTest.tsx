import React, { useEffect, useState } from 'react';
import { ForecastService } from '../../services/api';

const COLOR_SCHEME = {
    vessels: { cardBg: 'bg-blue-50', border: 'border-blue-200', headerBg: 'bg-blue-100', text: 'text-blue-900', badge: 'bg-blue-200 text-blue-900' },
    routes: { cardBg: 'bg-purple-50', border: 'border-purple-200', headerBg: 'bg-purple-100', text: 'text-purple-900', badge: 'bg-purple-200 text-purple-900' },
    ports: { cardBg: 'bg-orange-50', border: 'border-orange-200', headerBg: 'bg-orange-100', text: 'text-orange-900', badge: 'bg-orange-200 text-orange-900' },
    agency_matrix: { cardBg: 'bg-rose-50', border: 'border-rose-200', headerBg: 'bg-rose-100', text: 'text-rose-900', badge: 'bg-rose-200 text-rose-900' },
    contracts: { cardBg: 'bg-emerald-50', border: 'border-emerald-200', headerBg: 'bg-emerald-100', text: 'text-emerald-900', badge: 'bg-emerald-200 text-emerald-900' },
    contract_tariffs: { cardBg: 'bg-emerald-50', border: 'border-emerald-200', headerBg: 'bg-emerald-100', text: 'text-emerald-900', badge: 'bg-emerald-200 text-emerald-900' },
    bunker_prices: { cardBg: 'bg-amber-50', border: 'border-amber-200', headerBg: 'bg-amber-100', text: 'text-amber-900', badge: 'bg-amber-200 text-amber-900' },
    Calculado: { cardBg: 'bg-slate-50', border: 'border-slate-200', headerBg: 'bg-slate-100', text: 'text-slate-900', badge: 'bg-slate-200 text-slate-800' }
};

const renderBadges = (dbString: string) => {
    return dbString.split('·').map(s => s.trim()).map((table, idx) => {
        const scheme = (COLOR_SCHEME as any)[table] || COLOR_SCHEME.Calculado;
        return <span key={idx} className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase mr-1 ${scheme.badge}`}>{table}</span>;
    });
};

const colorizeFormula = (formula: string) => {
    if (!formula) return <span className="text-slate-400">N/A</span>;
    let res = formula;
    const mappings = [
        { regex: /\b(v_intake|v_pump|speed|ifo_tons|mdo_tons|tce_req)\b/g, color: 'text-blue-600 font-black' },
        { regex: /\b(dist|w_laden|w_ballast)\b/g, color: 'text-purple-600 font-black' },
        { regex: /\b(t_load_rate|p_disch_limit|over_or|over_de)\b/g, color: 'text-orange-600 font-black' },
        { regex: /\b(port_costs)\b/g, color: 'text-rose-600 font-black' },
        { regex: /\b(c_load|c_disch|F|Q)\b/g, color: 'text-emerald-600 font-black' },
        { regex: /\b(p_ifo|p_mdo)\b/g, color: 'text-amber-600 font-black' },
    ];
    mappings.forEach(m => {
        res = res.replace(m.regex, `<span class="${m.color}">$1</span>`);
    });
    return <span dangerouslySetInnerHTML={{__html: res}} />;
};
export const VoyageLedgerTest: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [benchmarks, setBenchmarks] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState("TABLONES-ILO-MATARANI");

    useEffect(() => {
        const testLines = [
            { client_id: 'SPCC', origin_port_id: 'ILO', destination_port_id: 'MATARANI', vessel_id: 'TABLONES', month_index: '2026-07', quantity: 13500, monthly_frequency: 1 },
            { client_id: 'SPCC', origin_port_id: 'ILO', destination_port_id: 'MARCONA', vessel_id: 'TABLONES', month_index: '2026-07', quantity: 13500, monthly_frequency: 1 },
            { client_id: 'SPCC', origin_port_id: 'ILO', destination_port_id: 'MEJILLONES', vessel_id: 'TABLONES', month_index: '2026-07', quantity: 13500, monthly_frequency: 1 },
            { client_id: 'SPCC', origin_port_id: 'ILO', destination_port_id: 'MATARANI', vessel_id: 'MOQUEGUA', month_index: '2026-07', quantity: 13500, monthly_frequency: 1 },
            { client_id: 'SPCC', origin_port_id: 'ILO', destination_port_id: 'MARCONA', vessel_id: 'MOQUEGUA', month_index: '2026-07', quantity: 13500, monthly_frequency: 1 },
            { client_id: 'SPCC', origin_port_id: 'ILO', destination_port_id: 'MEJILLONES', vessel_id: 'MOQUEGUA', month_index: '2026-07', quantity: 13500, monthly_frequency: 1 },
            { client_id: 'SPCC', origin_port_id: 'ILO', destination_port_id: 'MATARANI', vessel_id: 'CONCON_TRADER', month_index: '2026-07', quantity: 19000, monthly_frequency: 1 },
            { client_id: 'SPCC', origin_port_id: 'ILO', destination_port_id: 'MARCONA', vessel_id: 'CONCON_TRADER', month_index: '2026-07', quantity: 19000, monthly_frequency: 1 },
            { client_id: 'SPCC', origin_port_id: 'ILO', destination_port_id: 'MEJILLONES', vessel_id: 'CONCON_TRADER', month_index: '2026-07', quantity: 19000, monthly_frequency: 1 }
        ];

        Promise.all([
            ForecastService.getBenchmarks(),
            ForecastService.runSimulation({
                start_date: '2026-07-01',
                end_date: '2026-07-31',
                projection_lines: testLines
            })
        ]).then(([benchmarksRes, simRes]) => {
            setBenchmarks(benchmarksRes);
            setData(simRes.aggregated_data['SPCC']);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500 font-semibold animate-pulse">Iniciando Motor de Auditoría...</div>;
    if (!data) return <div className="p-8 text-center text-red-500 font-semibold">Error al obtener datos.</div>;

    const [vessel, origin, dest] = selectedCase.split('-');
    const routeKey = `${origin}-${dest}`;
    const runResult = data[routeKey]?.[vessel]?.['2026-07'];

    if (!runResult || !runResult.audit_trail) {
        return <div className="p-8 text-center text-red-500">Datos no encontrados para {selectedCase}</div>;
    }

    const petral = benchmarks[selectedCase] || { act_load: 0, act_disch: 0, port_days: 0, sea_days: 0, bunker_costs: 0, voyage_result: 0, total_duration: 0, tce_real: 0, pl_vs_req: 0 };

    const SCENARIOS = [
        { vessel: 'TABLONES', origin: 'ILO', dest: 'MATARANI' },
        { vessel: 'TABLONES', origin: 'ILO', dest: 'MARCONA' },
        { vessel: 'TABLONES', origin: 'ILO', dest: 'MEJILLONES' },
        { vessel: 'MOQUEGUA', origin: 'ILO', dest: 'MATARANI' },
        { vessel: 'MOQUEGUA', origin: 'ILO', dest: 'MARCONA' },
        { vessel: 'MOQUEGUA', origin: 'ILO', dest: 'MEJILLONES' },
        { vessel: 'CONCON_TRADER', origin: 'ILO', dest: 'MATARANI' },
        { vessel: 'CONCON_TRADER', origin: 'ILO', dest: 'MARCONA' },
        { vessel: 'CONCON_TRADER', origin: 'ILO', dest: 'MEJILLONES' }
    ];

    const renderScenarioContent = (
        vesselName: string,
        originPort: string,
        destPort: string,
        scenarioResult: any,
        scenarioPetral: any,
        isPrint: boolean,
        col4Header?: React.ReactNode,
        col4Footer?: React.ReactNode
    ) => {
        if (!scenarioResult || !scenarioResult.audit_trail) return null;
        const audit = scenarioResult.audit_trail;

        const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
        const formatNumber = (val: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(val);

        const formatDelta = (val: number, isCurrency: boolean = false) => {
            const color = val > 0 ? 'text-green-600' : val < 0 ? 'text-red-600' : 'text-slate-500';
            const formatted = isCurrency ? formatCurrency(Math.abs(val)) : formatNumber(Math.abs(val));
            const sign = val > 0 ? '+' : val < 0 ? '-' : '';
            return <span className={`font-bold ${color}`}>{sign}{formatted}</span>;
        };

        const auditRows = [
            { metric: "1. Tasa Carga (MT/hr)",  key: "1. Tasa Carga (act_load)",       gk: scenarioResult.audit_trail["1. Tasa Carga (act_load)"]?.values?.includes('MIN') ? 500 : 0,  ptr: scenarioPetral.act_load,  isCurr: false, db: "contracts · vessels · ports", ui: "Contratos / Flota / Puertos" },
            { metric: "2. Tasa Descarga (MT/hr)", key: "2. Tasa Descarga (act_disch)",  gk: scenarioResult.audit_trail["2. Tasa Descarga (act_disch)"]?.values?.includes('MIN') ? 300 : 0, ptr: scenarioPetral.act_disch, isCurr: false, db: "contracts · vessels · ports", ui: "Contratos / Flota / Puertos" },
            { metric: "3. Días de Puerto",       key: "3. Días de Puerto (port_days)",  gk: scenarioResult.port_days_unit,          ptr: scenarioPetral.port_days, isCurr: false, db: "ports · Calculado",  ui: "Motor" },
            { metric: "4. Días de Mar",          key: "4. Días de Mar (sea_days)",      gk: scenarioResult.sea_days_unit,           ptr: scenarioPetral.sea_days,  isCurr: false, db: "routes · vessels",              ui: "Maestro Rutas / Flota" },
            { metric: "5. Costo Bunker",         key: "5. Costo Bunker (bunker)",       gk: scenarioResult.total_bunker_costs_unit, ptr: scenarioPetral.bunker_costs,    isCurr: true,  db: "vessels · bunker_prices",       ui: "Maestro Flota / Bunker" },
            { metric: "6. Gastos Adicionales",   key: "Gastos Adicionales (excel)",     gk: 0,                                 ptr: scenarioPetral.additional_expenses || 0, isCurr: true, db: "N/A",                         ui: "Excel (Loading Master)" },
            { metric: "7. Resultado Viaje",      key: "7. Resultado Viaje (voy_res)",   gk: scenarioResult.voyage_result,           ptr: scenarioPetral.voyage_result,   isCurr: true,  db: "contract_tariffs · agency_matrix", ui: "Tarifas / Costos Portuarios" },
            { metric: "8. Duración Total",       key: "8. Duración Total (tot_dur)",    gk: scenarioResult.total_duration_unit,     ptr: scenarioPetral.total_duration,   isCurr: false, db: "Calculado",                     ui: "Motor" },
            { metric: "9. TCE Diario",           key: "9. TCE Diario (tce_real)",       gk: scenarioResult.tce_real_unit,           ptr: scenarioPetral.tce_real,  isCurr: true,  db: "Calculado",                     ui: "Motor" },
            { metric: "10. Utilidad Nom.",       key: "10. Utilidad Nom. (pl_vs_req)",  gk: scenarioResult.pl_vs_required_unit,     ptr: scenarioPetral.pl_vs_req, isCurr: true,  db: "vessels",                       ui: "Maestro Flota" },
        ];

        return (
            <div className={`flex flex-col gap-4 ${isPrint ? 'p-4 bg-white' : ''}`}>
                {isPrint && (
                    <div className="border-b-2 border-slate-800 pb-2 mb-2 flex justify-between items-center">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                            🧪 GEEKSOFT Voyage Ledger Auditoría: <span className="text-blue-600">{vesselName.replace('_', ' ')}</span> &rarr; <span className="text-purple-600">{originPort} - {destPort}</span>
                        </h2>
                        <span className="text-[10px] text-slate-500 font-bold font-mono uppercase">Simulación: 2026-07 (A4 Landscape)</span>
                    </div>
                )}

                <div className="flex gap-4 items-stretch">
                    {/* Col 1: Maestro Flota */}
                    <div className={`flex-1 flex flex-col border rounded-lg shadow-sm overflow-hidden ${COLOR_SCHEME.vessels.cardBg} ${COLOR_SCHEME.vessels.border}`}>
                        <div className={`border-b px-3 py-2 flex items-center justify-between ${COLOR_SCHEME.vessels.headerBg} ${COLOR_SCHEME.vessels.border}`}>
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${COLOR_SCHEME.vessels.text}`}>Maestro Flota</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${COLOR_SCHEME.vessels.badge}`}>vessels</span>
                        </div>
                        <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between">
                            <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.vessels.text}`}>Barco</span><span className="font-mono text-slate-800 font-bold text-xs">{vesselName.replace('_', ' ')}</span></div>
                            <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.vessels.text}`}>Intake Máx. (v_intake)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatNumber(scenarioResult.raw_inputs?.vessel_max_load_intake_limit || 0)} T/h</span></div>
                            <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.vessels.text}`}>Cap. Bombeo (v_pump)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatNumber(scenarioResult.raw_inputs?.vessel_pump_discharge_rate || 0)} T/h</span></div>
                            <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.vessels.text}`}>Velocidad (speed)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatNumber(scenarioResult.raw_inputs?.vessel_speed || 0)} kn</span></div>
                            <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.vessels.text}`}>TCE Requerido (tce_req)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatCurrency(scenarioResult.raw_inputs?.tce_required || 0)}/d</span></div>
                            <div className={`mt-1 pt-2 border-t ${COLOR_SCHEME.vessels.border} grid grid-cols-2 gap-x-4 gap-y-1`}>
                                <div className="flex justify-between items-baseline"><span className={`font-bold text-[9px] uppercase ${COLOR_SCHEME.vessels.text}`}>IFO Mar</span><span className="font-mono text-slate-700 font-semibold text-[11px]">{formatNumber(scenarioResult.raw_inputs?.bunker_consumption_sea_ifo || 0)}</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-bold text-[9px] uppercase ${COLOR_SCHEME.vessels.text}`}>MDO Mar</span><span className="font-mono text-slate-700 font-semibold text-[11px]">{formatNumber(scenarioResult.raw_inputs?.bunker_consumption_sea_mdo || 0)}</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-bold text-[9px] uppercase ${COLOR_SCHEME.vessels.text}`}>IFO Idle</span><span className="font-mono text-slate-700 font-semibold text-[11px]">{formatNumber(scenarioResult.raw_inputs?.bunker_consumption_idle_ifo || 0)}</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-bold text-[9px] uppercase ${COLOR_SCHEME.vessels.text}`}>MDO Idle</span><span className="font-mono text-slate-700 font-semibold text-[11px]">{formatNumber(scenarioResult.raw_inputs?.bunker_consumption_idle_mdo || 0)}</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-bold text-[9px] uppercase ${COLOR_SCHEME.vessels.text}`}>IFO Carga</span><span className="font-mono text-slate-700 font-semibold text-[11px]">{formatNumber(scenarioResult.raw_inputs?.bunker_consumption_load_ifo || 0)}</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-bold text-[9px] uppercase ${COLOR_SCHEME.vessels.text}`}>MDO Carga</span><span className="font-mono text-slate-700 font-semibold text-[11px]">{formatNumber(scenarioResult.raw_inputs?.bunker_consumption_load_mdo || 0)}</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-bold text-[9px] uppercase ${COLOR_SCHEME.vessels.text}`}>IFO Desc.</span><span className="font-mono text-slate-700 font-semibold text-[11px]">{formatNumber(scenarioResult.raw_inputs?.bunker_consumption_disch_ifo || 0)}</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-bold text-[9px] uppercase ${COLOR_SCHEME.vessels.text}`}>MDO Desc.</span><span className="font-mono text-slate-700 font-semibold text-[11px]">{formatNumber(scenarioResult.raw_inputs?.bunker_consumption_disch_mdo || 0)}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Col 2: Combustible + Costos Portuarios */}
                    <div className="flex-1 flex flex-col gap-1">
                        <div className={`border rounded-lg shadow-sm overflow-hidden ${COLOR_SCHEME.bunker_prices.cardBg} ${COLOR_SCHEME.bunker_prices.border}`}>
                            <div className={`border-b px-3 py-2 flex items-center justify-between ${COLOR_SCHEME.bunker_prices.headerBg} ${COLOR_SCHEME.bunker_prices.border}`}>
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${COLOR_SCHEME.bunker_prices.text}`}>Combustible</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${COLOR_SCHEME.bunker_prices.badge}`}>bunker_prices</span>
                            </div>
                            <div className="p-3 flex flex-col gap-1.5">
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.bunker_prices.text}`}>Fecha Cotización</span><span className="font-mono text-slate-800 font-bold text-xs">{scenarioResult.raw_inputs?.bunker_price_date || '—'}</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.bunker_prices.text}`}>Precio IFO (p_ifo)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatCurrency(scenarioResult.raw_inputs?.bunker_price_ifo || 0)}</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.bunker_prices.text}`}>Precio MDO (p_mdo)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatCurrency(scenarioResult.raw_inputs?.bunker_price_mdo || 0)}</span></div>
                            </div>
                        </div>
                        <div className={`flex-1 flex flex-col border rounded-lg shadow-sm overflow-hidden ${COLOR_SCHEME.agency_matrix.cardBg} ${COLOR_SCHEME.agency_matrix.border}`}>
                            <div className={`border-b px-3 py-2 flex items-center justify-between ${COLOR_SCHEME.agency_matrix.headerBg} ${COLOR_SCHEME.agency_matrix.border}`}>
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${COLOR_SCHEME.agency_matrix.text}`}>Costos Portuarios</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${COLOR_SCHEME.agency_matrix.badge}`}>agency_matrix</span>
                            </div>
                            <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between">
                                <div className={`text-[10px] italic leading-tight mb-1 ${COLOR_SCHEME.agency_matrix.text}`}>Llaves: Cliente + Puerto + Op + Barco</div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.agency_matrix.text}`}>Cliente</span><span className="font-mono text-slate-800 font-bold text-xs">SPCC</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.agency_matrix.text}`}>Agencia Origen (port_costs)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatCurrency(scenarioResult.raw_inputs?.agency_costs_origin || 0)}</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.agency_matrix.text}`}>Agencia Destino (port_costs)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatCurrency(scenarioResult.raw_inputs?.agency_costs_destination || 0)}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Col 3: Maestro Rutas + Reglas Comerciales */}
                    <div className="flex-1 flex flex-col gap-1">
                        <div className={`border rounded-lg shadow-sm overflow-hidden ${COLOR_SCHEME.routes.cardBg} ${COLOR_SCHEME.routes.border}`}>
                            <div className={`border-b px-3 py-2 flex items-center justify-between ${COLOR_SCHEME.routes.headerBg} ${COLOR_SCHEME.routes.border}`}>
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${COLOR_SCHEME.routes.text}`}>Maestro Rutas</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${COLOR_SCHEME.routes.badge}`}>routes</span>
                            </div>
                            <div className="p-3 flex flex-col gap-1.5">
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.routes.text}`}>Origen &rarr; Destino</span><span className="font-mono text-slate-800 font-bold text-xs">{originPort} &rarr; {destPort}</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.routes.text}`}>Distancia (dist)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatNumber(scenarioResult.raw_inputs?.route_distance || 0)} NM</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.routes.text}`}>W Fct (w_laden / w_ballast)</span><span className="font-mono text-slate-800 font-bold text-xs">{(scenarioResult.raw_inputs?.weather_factor_laden || 0)*100}% / {(scenarioResult.raw_inputs?.weather_factor_ballast || 0)*100}%</span></div>
                            </div>
                        </div>
                        <div className={`flex-1 flex flex-col border rounded-lg shadow-sm overflow-hidden ${COLOR_SCHEME.contracts.cardBg} ${COLOR_SCHEME.contracts.border}`}>
                            <div className={`border-b px-3 py-2 flex items-center justify-between ${COLOR_SCHEME.contracts.headerBg} ${COLOR_SCHEME.contracts.border}`}>
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${COLOR_SCHEME.contracts.text}`}>Reglas Comerciales</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${COLOR_SCHEME.contracts.badge}`}>contracts</span>
                            </div>
                            <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between">
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Cantidad (Q)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatNumber(scenarioResult.raw_inputs?.quantity || 0)} MT</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Flete Base (F)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatCurrency(scenarioResult.raw_inputs?.freight_rate || 0)}/MT</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Tasa Carg Ctto (c_load)</span><span className="font-mono text-slate-800 font-bold text-xs">{scenarioResult.raw_inputs?.contract_agreed_load_rate ? formatNumber(scenarioResult.raw_inputs.contract_agreed_load_rate) + " T/h" : "TBD"}</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Tasa Desc Ctto (c_disch)</span><span className="font-mono text-slate-800 font-bold text-xs">{scenarioResult.raw_inputs?.contract_agreed_discharge_rate ? formatNumber(scenarioResult.raw_inputs.contract_agreed_discharge_rate) + " T/h" : "TBD"}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Col 4: Límites Portuarios + Acciones */}
                    <div className="flex-1 flex flex-col gap-4">
                        {col4Header}
                        <div className={`border rounded-lg shadow-sm overflow-hidden ${COLOR_SCHEME.ports.cardBg} ${COLOR_SCHEME.ports.border} ${isPrint ? 'flex-1' : ''}`}>
                            <div className={`border-b px-3 py-2 flex items-center justify-between ${COLOR_SCHEME.ports.headerBg} ${COLOR_SCHEME.ports.border}`}>
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${COLOR_SCHEME.ports.text}`}>Límites Portuarios</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${COLOR_SCHEME.ports.badge}`}>ports</span>
                            </div>
                            <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between">
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.ports.text}`}>Lím. Carga Term. (t_load_rate)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatNumber(scenarioResult.raw_inputs?.max_terminal_load_rate || 0)} T/h</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.ports.text}`}>Lím. Desc. Term. (p_disch_limit)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatNumber(scenarioResult.raw_inputs?.port_max_discharge_limit || 0)} T/h</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.ports.text}`}>Overhead Or. (over_or)</span><span className="font-mono text-slate-700 font-semibold text-xs">{formatNumber(scenarioResult.raw_inputs?.port_overhead_hours_origin || 0)} H</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.ports.text}`}>Overhead De. (over_de)</span><span className="font-mono text-slate-700 font-semibold text-xs">{formatNumber(scenarioResult.raw_inputs?.port_overhead_hours_dest || 0)} H</span></div>
                            </div>
                        </div>
                        {col4Footer}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse table-fixed">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                                <th className="p-2 font-bold" style={{width:'13%'}}>Métrica</th>
                                <th className="p-2 font-bold text-center" style={{width:'9%'}}>GEEKSOFT (Motor)</th>
                                <th className="p-2 font-bold text-center" style={{width:'9%'}}>PETRAL (Excel)</th>
                                <th className="p-2 font-bold text-center" style={{width:'9%'}}>Delta (Δ)</th>
                                <th className="p-2 font-bold" style={{width:'25%'}}>Fórmula Algorítmica</th>
                                <th className="p-2 font-bold" style={{width:'20%'}}>Reemplazo Numérico</th>
                                <th className="p-2 font-bold" style={{width:'15%'}}>Tabla Origen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {auditRows.map((row, idx) => {
                                const delta = (row.gk || 0) - row.ptr;
                                const auditObj = audit[row.key] || { formula: "N/A", values: "N/A" };
                                return (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-2 font-bold text-slate-800">{row.metric}</td>
                                        <td className="p-2 font-mono text-petral-blue font-semibold">{row.isCurr ? formatCurrency(row.gk) : formatNumber(row.gk)}</td>
                                        <td className="p-2 font-mono text-slate-500">{row.isCurr ? formatCurrency(row.ptr) : formatNumber(row.ptr)}</td>
                                        <td className="p-2">{formatDelta(delta, row.isCurr)}</td>
                                        <td className="p-2 font-mono text-xs text-slate-500 bg-slate-50">{colorizeFormula(auditObj.formula)}</td>
                                        <td className="p-2 font-mono text-xs text-slate-700 bg-slate-50 font-semibold">{colorizeFormula(auditObj.values)}</td>
                                        <td className="p-2 text-xs flex flex-wrap gap-1">{renderBadges(row.db)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <>
            <style>{`
                @media print {
                    /* Ocultar absolutamente todos los elementos del cuerpo */
                    body * {
                        visibility: hidden;
                    }
                    /* Excluir de la ocultacion al contenedor de impresion y todos sus descendientes */
                    .print-only, .print-only * {
                        visibility: visible !important;
                    }
                    /* Forzar al contenedor a posicionarse arriba a la izquierda ocupando todo el ancho */
                    .print-only {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    @page {
                        size: A4 landscape;
                        margin: 10mm;
                    }
                    .page-break {
                        page-break-after: always;
                        break-after: page;
                        width: 100%;
                        overflow: hidden;
                        box-sizing: border-box;
                    }
                    tr {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
                @media screen {
                    .print-only {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Contenedor interactivo normal de pantalla */}
            <div className="no-print bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                {renderScenarioContent(
                    vessel,
                    origin,
                    dest,
                    runResult,
                    petral,
                    false,
                    // col4Header:
                    <select 
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-md px-3 py-2 font-semibold shadow-sm focus:border-petral-teal focus:ring-1 focus:ring-petral-teal cursor-pointer"
                        value={selectedCase} 
                        onChange={e => setSelectedCase(e.target.value)}
                    >
                        <optgroup label="B/T TABLONES">
                            <option value="TABLONES-ILO-MATARANI">ILO - MATARANI (Tablones)</option>
                            <option value="TABLONES-ILO-MARCONA">ILO - MARCONA (Tablones)</option>
                            <option value="TABLONES-ILO-MEJILLONES">ILO - MEJILLONES (Tablones)</option>
                        </optgroup>
                        <optgroup label="B/T MOQUEGUA">
                            <option value="MOQUEGUA-ILO-MATARANI">ILO - MATARANI (Moquegua)</option>
                            <option value="MOQUEGUA-ILO-MARCONA">ILO - MARCONA (Moquegua)</option>
                            <option value="MOQUEGUA-ILO-MEJILLONES">ILO - MEJILLONES (Moquegua)</option>
                        </optgroup>
                        <optgroup label="M/N CONCON TRADER">
                            <option value="CONCON_TRADER-ILO-MATARANI">ILO - MATARANI (Concon Trader)</option>
                            <option value="CONCON_TRADER-ILO-MARCONA">ILO - MARCONA (Concon Trader)</option>
                            <option value="CONCON_TRADER-ILO-MEJILLONES">ILO - MEJILLONES (Concon Trader)</option>
                        </optgroup>
                    </select>,
                    // col4Footer (El botón de impresión):
                    <button
                        onClick={() => window.print()}
                        className="flex-grow flex flex-col items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.01]"
                    >
                        <span className="text-xl">🖨️</span>
                        <span className="text-xs uppercase tracking-wider">Imprimir PDF (9 Escenarios)</span>
                    </button>
                )}
            </div>

            {/* Contenedor exclusivo para impresión */}
            <div className="print-only bg-white">
                {SCENARIOS.map((sc, idx) => {
                    const scKey = `${sc.vessel}-${sc.origin}-${sc.dest}`;
                    const scRouteKey = `${sc.origin}-${sc.dest}`;
                    const scRunResult = data[scRouteKey]?.[sc.vessel]?.['2026-07'];
                    const scPetral = benchmarks[scKey] || { act_load: 0, act_disch: 0, port_days: 0, sea_days: 0, bunker_costs: 0, voyage_result: 0, total_duration: 0, tce_real: 0, pl_vs_req: 0 };
                    return (
                        <div key={idx} className="page-break mb-8">
                            {renderScenarioContent(
                                sc.vessel,
                                sc.origin,
                                sc.dest,
                                scRunResult,
                                scPetral,
                                true // isPrint
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
};
