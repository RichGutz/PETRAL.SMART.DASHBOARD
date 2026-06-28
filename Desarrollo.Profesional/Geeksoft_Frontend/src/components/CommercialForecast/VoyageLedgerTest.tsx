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
const TARIFFS_MAP: Record<string, Array<{min: number, max: number, rate: number}>> = {
    'MATARANI': [
        { min: 10000, max: 11500, rate: 20.12 },
        { min: 11501, max: 13000, rate: 19.52 },
        { min: 13001, max: 13500, rate: 19.01 },
        { min: 13600, max: 14500, rate: 18.92 }
    ],
    'MARCONA': [
        { min: 10000, max: 11500, rate: 25.87 },
        { min: 11501, max: 13000, rate: 23.12 },
        { min: 13001, max: 13500, rate: 22.82 },
        { min: 13600, max: 14500, rate: 21.77 }
    ],
    'MEJILLONES': [
        { min: 10000, max: 11500, rate: 23.23 },
        { min: 11501, max: 13000, rate: 21.87 },
        { min: 13001, max: 13500, rate: 20.87 },
        { min: 13600, max: 14500, rate: 20.67 }
    ]
};

export const VoyageLedgerTest: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [benchmarks, setBenchmarks] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState("TABLONES-ILO-MATARANI");
    const [quantityOverride, setQuantityOverride] = useState<Record<string, number>>({});
    const [liveResult, setLiveResult] = useState<any>(null);
    const [simulating, setSimulating] = useState(false);

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

    // Re-simular el escenario activo cuando cambia la cantidad o la ruta
    useEffect(() => {
        if (!data) return;
        const [v, o, d] = selectedCase.split('-');
        const qty = quantityOverride[v] || 13500;
        setLiveResult(null); // reset mientras llega el nuevo resultado
        setSimulating(true);
        ForecastService.runSimulation({
            start_date: '2026-07-01',
            end_date: '2026-07-31',
            projection_lines: [{
                client_id: 'SPCC',
                origin_port_id: o,
                destination_port_id: d,
                vessel_id: v,
                month_index: '2026-07',
                quantity: qty,
                monthly_frequency: 1
            }]
        }).then((simRes: any) => {
            const routeK = `${o}-${d}`;
            setLiveResult(simRes.aggregated_data?.['SPCC']?.[routeK]?.[v]?.['2026-07'] || null);
        }).catch((err: any) => {
            console.error('re-sim error', err);
        }).finally(() => setSimulating(false));
    }, [selectedCase, quantityOverride]);

    if (loading) return <div className="p-8 text-center text-slate-500 font-semibold animate-pulse">Iniciando Motor de Auditoría...</div>;
    if (!data) return <div className="p-8 text-center text-red-500 font-semibold">Error al obtener datos.</div>;

    const [vessel, origin, dest] = selectedCase.split('-');
    const routeKey = `${origin}-${dest}`;
    const baseResult = data[routeKey]?.[vessel]?.['2026-07'];
    const runResult = liveResult || baseResult;
    // Límites reales del tarifario (brackets de contrato SPCC_2025)
    const minIntake = 10000;
    const maxIntake = 14500;
    // Por defecto el input muestra el valor del viaje, topado al máximo del tarifario
    const defaultQty = Math.min(baseResult?.raw_inputs?.quantity || 13500, maxIntake);
    const currentQty = quantityOverride[vessel] ?? defaultQty;

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
            { metric: "6. Resultado Viaje",      key: "7. Resultado Viaje (voy_res)",   gk: scenarioResult.voyage_result,           ptr: scenarioPetral.voyage_result,   isCurr: true,  db: "contract_tariffs · agency_matrix", ui: "Tarifas / Costos Portuarios" },
            { metric: "7. Duración Total",       key: "8. Duración Total (tot_dur)",    gk: scenarioResult.total_duration_unit,     ptr: scenarioPetral.total_duration,   isCurr: false, db: "Calculado",                     ui: "Motor" },
            { metric: "8. TCE Diario",           key: "9. TCE Diario (tce_real)",       gk: scenarioResult.tce_real_unit,           ptr: scenarioPetral.tce_real,  isCurr: true,  db: "Calculado",                     ui: "Motor" },
            { metric: "9. Utilidad Nom.",       key: "10. Utilidad Nom. (pl_vs_req)",  gk: scenarioResult.pl_vs_required_unit,     ptr: scenarioPetral.pl_vs_req, isCurr: true,  db: "vessels",                       ui: "Maestro Flota" },
        ];

        return (
            <div className={`flex flex-col ${isPrint ? 'gap-2' : 'gap-4'}`}>
                {isPrint && (
                    <div className="border-b border-slate-800 pb-1 mb-1 flex justify-between items-center">
                        <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                            🧪 GEEKSOFT Voyage Ledger Auditoría: <span className="text-blue-600">{vesselName.replace('_', ' ')}</span> &rarr; <span className="text-purple-600">{originPort} - {destPort}</span>
                        </h2>
                        <span className="text-[9px] text-slate-500 font-bold font-mono uppercase">2026-07</span>
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
                    <div className="flex-[1.3] flex flex-col gap-1">
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
                                <div className="flex justify-between items-center">
                                    <span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>
                                        Cantidad (Q) <span className="text-emerald-600 font-black normal-case">({formatNumber(minIntake)}–{formatNumber(maxIntake)} MT)</span>
                                    </span>
                                    {!isPrint ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min={minIntake}
                                                max={maxIntake}
                                                step={100}
                                                value={currentQty}
                                                onChange={e => setQuantityOverride(prev => ({ ...prev, [vessel]: Number(e.target.value) }))}
                                                onBlur={e => {
                                                    const val = Math.max(minIntake, Math.min(maxIntake, Number(e.target.value)));
                                                    setQuantityOverride(prev => ({ ...prev, [vessel]: val }));
                                                }}
                                                className="w-24 text-xs font-mono font-bold text-center bg-white border-2 border-emerald-400 rounded px-1 py-0.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                            <span className={`text-xs font-bold ${simulating ? 'text-amber-500 animate-pulse' : 'text-slate-500'}`}>MT{simulating ? ' ⟳' : ''}</span>
                                        </div>
                                    ) : (
                                        <span className="font-mono text-slate-800 font-bold text-xs">{formatNumber(currentQty)} MT</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Flete Base (F)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatCurrency(scenarioResult.raw_inputs?.freight_rate || 0)}/MT</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Tasa Carg Ctto (c_load)</span><span className="font-mono text-slate-800 font-bold text-xs">{scenarioResult.raw_inputs?.contract_agreed_load_rate ? formatNumber(scenarioResult.raw_inputs.contract_agreed_load_rate) + " T/h" : "TBD"}</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Tasa Desc Ctto (c_disch)</span><span className="font-mono text-slate-800 font-bold text-xs">{scenarioResult.raw_inputs?.contract_agreed_discharge_rate ? formatNumber(scenarioResult.raw_inputs.contract_agreed_discharge_rate) + " T/h" : "TBD"}</span></div>

                                {/* Tabla miniatura del tarifario de la ruta activa */}
                                {!isPrint && (
                                    <div className="mt-3 pt-2 border-t border-emerald-200">
                                        <div className={`text-[9px] font-bold uppercase mb-1 ${COLOR_SCHEME.contracts.text}`}>Tarifario SPCC por Bracket</div>
                                        <div className="overflow-x-auto rounded border border-emerald-100 bg-white">
                                            <table className="w-full text-[9px] border-collapse">
                                                <thead>
                                                    <tr className="bg-emerald-50 border-b border-emerald-100 text-emerald-800">
                                                        <th className="p-1 font-bold text-left">Min (MT)</th>
                                                        <th className="p-1 font-bold text-left">Max (MT)</th>
                                                        <th className="p-1 font-bold text-right">Flete ($)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 font-mono">
                                                    {(TARIFFS_MAP[destPort] || []).map((t, idx) => {
                                                        const isActive = currentQty >= t.min && currentQty <= t.max;
                                                        return (
                                                            <tr key={idx} className={`${isActive ? 'bg-emerald-100 font-bold text-emerald-950' : 'text-slate-600'}`}>
                                                                <td className="p-1">{formatNumber(t.min)}</td>
                                                                <td className="p-1">{formatNumber(t.max)}</td>
                                                                <td className="p-1 text-right">{formatCurrency(t.rate)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Col 4: Límites Portuarios + Acciones */}
                    <div className="flex-[0.7] flex flex-col gap-4">
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

                <div className={`overflow-x-auto relative border-b border-slate-200 ${isPrint ? '' : 'overflow-y-auto max-h-[55vh]'}`}>
                    <table className="w-full text-left text-sm border-collapse table-fixed">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                                <th className="p-2 font-bold" style={{width:'13%'}}>Métrica</th>
                                <th className="p-2 font-bold" style={{width:'25%'}}>Fórmula Algorítmica</th>
                                <th className="p-2 font-bold" style={{width:'20%'}}>Reemplazo Numérico</th>
                                <th className="p-2 font-bold text-center" style={{width:'9%'}}>GEEKSOFT (Motor)</th>
                                <th className="p-2 font-bold text-center" style={{width:'9%'}}>PETRAL (Excel)</th>
                                <th className="p-2 font-bold text-center" style={{width:'9%'}}>Delta (Δ)</th>
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
                                        <td className="p-2 font-mono text-xs text-slate-500 bg-slate-50">{colorizeFormula(auditObj.formula)}</td>
                                        <td className="p-2 font-mono text-xs text-slate-700 bg-slate-50 font-semibold">{colorizeFormula(auditObj.values)}</td>
                                        <td className="p-2 font-mono text-petral-blue font-semibold">{row.isCurr ? formatCurrency(row.gk) : formatNumber(row.gk)}</td>
                                        <td className="p-2 font-mono text-slate-500">
                                            <div className="border-b border-slate-300 border-dashed h-5 w-24 mx-auto"></div>
                                        </td>
                                        <td className="p-2">
                                            <div className="border-b border-slate-300 border-dashed h-5 w-20 mx-auto"></div>
                                        </td>
                                        <td className="p-2 text-xs flex flex-wrap gap-1">{renderBadges(row.db)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Pie de firma / Acta Ultra Compacta (Visible siempre y dentro del scroll) */}
                    <div className="flex mt-6 mb-2 px-2 flex-col text-sm page-break-inside-avoid">
                        <div className="grid grid-cols-2 gap-12">
                            {/* Panel Izquierdo: Responsable + Estado + Firma + Fecha */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold whitespace-nowrap text-slate-700">Responsable:</p>
                                    <div className="border-b border-slate-400 w-full h-4"></div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <p className="font-bold text-slate-700">Estado:</p>
                                    <label className="flex items-center gap-2 text-slate-600"><div className="w-3 h-3 border border-slate-400"></div> Aprobado</label>
                                    <label className="flex items-center gap-2 text-slate-600"><div className="w-3 h-3 border border-slate-400"></div> Con Errores</label>
                                </div>
                                <div className="flex gap-4 items-end">
                                    <p className="font-bold text-slate-700 w-16">Firma:</p>
                                    <div className="border-b border-slate-400 w-full h-6"></div>
                                </div>
                                <div className="flex gap-4 items-end">
                                    <p className="font-bold text-slate-700 w-16">Fecha:</p>
                                    <div className="border-b border-slate-400 w-full h-6"></div>
                                </div>
                            </div>

                            {/* Panel Derecho: Comentarios ocupando toda la mitad */}
                            <div className="flex flex-col">
                                <p className="font-bold text-slate-700 mb-1">Comentarios / Justificación:</p>
                                <div className="border border-slate-300 flex-1 min-h-[80px] bg-slate-50 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <style>{`
                @page {
                    size: A4 landscape;
                    margin: 0 !important;
                }
                @media print {
                    /* Ocultar elementos de pantalla e interactivos */
                    .no-print {
                        display: none !important;
                    }
                    /* Mostrar contenedor de impresion */
                    .print-only {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 297mm;
                        height: auto;
                        margin: 0;
                        padding: 0;
                    }
                    /* Ajustar body e html */
                    html, body {
                        width: 297mm;
                        height: 210mm;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white;
                    }
                    .page-break {
                        page-break-after: always;
                        break-after: page;
                        width: 297mm;
                        height: 210mm;
                        padding: 6mm 8mm; /* Margenes reducidos en impresion */
                        box-sizing: border-box;
                        overflow: hidden;
                        margin: 0 !important; /* Evita paginas en blanco por margenes residuales */
                    }
                    /* Compactar espaciado entre cards */
                    .page-break .flex.gap-4.items-stretch {
                        gap: 8px !important;
                    }
                    /* Compactar tarjetas internas */
                    .page-break .border.rounded-lg {
                        border-radius: 6px !important;
                    }
                    .page-break .p-3 {
                        padding: 8px 10px !important;
                    }
                    .page-break .gap-1.5 {
                        gap: 2px !important;
                    }
                    .page-break .mt-1.pt-2 {
                        margin-top: 2px !important;
                        padding-top: 4px !important;
                    }
                    /* Compactar la tabla de auditoria */
                    .page-break table {
                        font-size: 10px !important;
                        line-height: 1.2 !important;
                    }
                    .page-break th {
                        padding: 4px 6px !important;
                    }
                    .page-break td {
                        padding: 3px 5px !important;
                    }
                    .page-break .bg-slate-50 {
                        background-color: #f8fafc !important;
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
                    // col4Footer:
                    <button
                        onClick={() => {
                            if (!runResult || !runResult.audit_trail) { alert('No hay datos cargados aún.'); return; }
                            const audit_t = runResult.audit_trail;
                            const fmtCur = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
                            const fmtNum = (v: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(v);
                            const auditRowsPrint = [
                                { metric: '1. Tasa Carga (MT/hr)',   key: '1. Tasa Carga (act_load)',      gk: runResult.audit_trail['1. Tasa Carga (act_load)']?.values?.includes('MIN') ? 500 : 0,  isCurr: false },
                                { metric: '2. Tasa Descarga (MT/hr)',key: '2. Tasa Descarga (act_disch)', gk: runResult.audit_trail['2. Tasa Descarga (act_disch)']?.values?.includes('MIN') ? 300 : 0, isCurr: false },
                                { metric: '3. Días de Puerto',       key: '3. Días de Puerto (port_days)',gk: runResult.port_days_unit,          isCurr: false },
                                { metric: '4. Días de Mar',          key: '4. Días de Mar (sea_days)',    gk: runResult.sea_days_unit,           isCurr: false },
                                { metric: '5. Costo Bunker',         key: '5. Costo Bunker (bunker)',     gk: runResult.total_bunker_costs_unit, isCurr: true  },
                                { metric: '6. Resultado Viaje',      key: '7. Resultado Viaje (voy_res)', gk: runResult.voyage_result,           isCurr: true  },
                                { metric: '7. Duración Total',       key: '8. Duración Total (tot_dur)',  gk: runResult.total_duration_unit,     isCurr: false },
                                { metric: '8. TCE Diario',           key: '9. TCE Diario (tce_real)',     gk: runResult.tce_real_unit,           isCurr: true  },
                                { metric: '9. Utilidad Nom.',        key: '10. Utilidad Nom. (pl_vs_req)',gk: runResult.pl_vs_required_unit,     isCurr: true  },
                            ];
                            const tableRows = auditRowsPrint.map(row => {
                                const ao = audit_t[row.key] || { formula: 'N/A', values: 'N/A' };
                                return `<tr>
                                    <td style="padding:6px 8px;font-weight:bold;border-bottom:1px solid #e2e8f0">${row.metric}</td>
                                    <td style="padding:6px 8px;font-family:monospace;font-size:11px;color:#64748b;background:#f8fafc;border-bottom:1px solid #e2e8f0">${ao.formula || 'N/A'}</td>
                                    <td style="padding:6px 8px;font-family:monospace;font-size:11px;font-weight:600;background:#f8fafc;border-bottom:1px solid #e2e8f0">${ao.values || 'N/A'}</td>
                                    <td style="padding:6px 8px;font-family:monospace;font-weight:600;color:#0ea5e9;text-align:center;border-bottom:1px solid #e2e8f0">${row.isCurr ? fmtCur(row.gk||0) : fmtNum(row.gk||0)}</td>
                                    <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #e2e8f0"><span style="display:inline-block;width:80px;border-bottom:1px dashed #94a3b8">&nbsp;</span></td>
                                    <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #e2e8f0"><span style="display:inline-block;width:60px;border-bottom:1px dashed #94a3b8">&nbsp;</span></td>
                                </tr>`;
                            }).join('');
                            const [v, o, d] = selectedCase.split('-');
                            const now = new Date();
                            const fechaStr = now.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
                            const ri = runResult.raw_inputs || {};
                            const cardsHTML = `
                            <div class="cards-grid">
                                <div class="card card-blue">
                                    <div class="card-header">🚢 Maestro Flota <span class="card-badge">vessels</span></div>
                                    <div class="card-row"><span>Barco</span><strong>${v.replace('_',' ')}</strong></div>
                                    <div class="card-row"><span>Intake Máx. (v_intake)</span><strong>${fmtNum(ri.vessel_max_load_intake_limit||0)} T</strong></div>
                                    <div class="card-row"><span>Cap. Bombeo (v_pump)</span><strong>${fmtNum(ri.vessel_pump_discharge_rate||0)} T/h</strong></div>
                                    <div class="card-row"><span>Velocidad (speed)</span><strong>${fmtNum(ri.vessel_speed||0)} kn</strong></div>
                                    <div class="card-row"><span>TCE Requerido (tce_req)</span><strong>${fmtCur(ri.tce_required||0)}/d</strong></div>
                                </div>
                                <div class="card card-green">
                                    <div class="card-header">📋 Reglas Comerciales <span class="card-badge">contracts</span></div>
                                    <div class="card-row"><span>Cantidad (Q)</span><strong>${fmtNum(ri.quantity||0)} MT</strong></div>
                                    <div class="card-row"><span>Flete Base (F)</span><strong>${fmtCur(ri.freight_rate||0)}/MT</strong></div>
                                    <div class="card-row"><span>Tasa Carga Ctto (c_load)</span><strong>${ri.contract_agreed_load_rate ? fmtNum(ri.contract_agreed_load_rate)+' T/h' : 'TBD'}</strong></div>
                                    <div class="card-row"><span>Tasa Desc. Ctto (c_disch)</span><strong>${ri.contract_agreed_discharge_rate ? fmtNum(ri.contract_agreed_discharge_rate)+' T/h' : 'TBD'}</strong></div>
                                </div>
                                <div class="card card-purple">
                                    <div class="card-header">🗺️ Maestro Rutas <span class="card-badge">routes</span></div>
                                    <div class="card-row"><span>Origen → Destino</span><strong>${o} → ${d}</strong></div>
                                    <div class="card-row"><span>Distancia (dist)</span><strong>${fmtNum(ri.route_distance||0)} NM</strong></div>
                                    <div class="card-row"><span>W Fct Laden</span><strong>${((ri.weather_factor_laden||0)*100)}%</strong></div>
                                    <div class="card-row"><span>W Fct Ballast</span><strong>${((ri.weather_factor_ballast||0)*100)}%</strong></div>
                                </div>
                                <div class="card card-orange">
                                    <div class="card-header">⚓ Límites Portuarios <span class="card-badge">ports</span></div>
                                    <div class="card-row"><span>Lím. Carga Term. (t_load_rate)</span><strong>${fmtNum(ri.max_terminal_load_rate||0)} T/h</strong></div>
                                    <div class="card-row"><span>Lím. Desc. Term. (p_disch_limit)</span><strong>${fmtNum(ri.port_max_discharge_limit||0)} T/h</strong></div>
                                    <div class="card-row"><span>Overhead Origen (over_or)</span><strong>${fmtNum(ri.port_overhead_hours_origin||0)} H</strong></div>
                                    <div class="card-row"><span>Overhead Destino (over_de)</span><strong>${fmtNum(ri.port_overhead_hours_dest||0)} H</strong></div>
                                </div>
                                <div class="card card-rose">
                                    <div class="card-header">🏦 Costos Agencia <span class="card-badge">agency_matrix</span></div>
                                    <div class="card-row"><span>Puerto Origen</span><strong>${o}</strong></div>
                                    <div class="card-row"><span>Puerto Destino</span><strong>${d}</strong></div>
                                    <div class="card-row"><span>Costo Port. (port_costs)</span><strong>${fmtCur(runResult.port_costs_unit||0)}</strong></div>
                                    <div class="card-row"><span>Incluye: DA + Estiba</span><strong>✓</strong></div>
                                </div>
                                <div class="card card-amber">
                                    <div class="card-header">⛽ Bunker <span class="card-badge">bunker_prices</span></div>
                                    <div class="card-row"><span>IFO Consumo (ifo_tons)</span><strong>${fmtNum(ri.ifo_tons_per_day||0)} T/d</strong></div>
                                    <div class="card-row"><span>MDO Consumo (mdo_tons)</span><strong>${fmtNum(ri.mdo_tons_per_day||0)} T/d</strong></div>
                                    <div class="card-row"><span>Precio IFO (p_ifo)</span><strong>${fmtCur(ri.ifo_price||0)}/T</strong></div>
                                    <div class="card-row"><span>Precio MDO (p_mdo)</span><strong>${fmtCur(ri.mdo_price||0)}/T</strong></div>
                                </div>
                            </div>`;
                            const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
                            <title>Acta - ${v} ${o}-${d}</title>
                            <style>
                                @page { size: A4 landscape; margin: 10mm 12mm; }
                                body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; }
                                h1 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 3px 0; }
                                h2 { font-size: 11px; color: #475569; margin: 0; font-weight: 500; }
                                table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                                thead th { background: #f1f5f9; padding: 5px 7px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 2px solid #334155; text-align: left; }
                                .header-bar { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e293b; padding-bottom: 7px; margin-bottom: 10px; }
                                .badge { font-size: 9px; background: #1e293b; color: white; padding: 2px 7px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
                                .cards-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr; gap: 6px; margin-bottom: 10px; }
                                .card { border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0; }
                                .card-header { padding: 5px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; display: flex; justify-content: space-between; align-items: center; }
                                .card-badge { font-size: 8px; font-weight: 700; padding: 1px 5px; border-radius: 3px; text-transform: uppercase; }
                                .card-row { display: flex; justify-content: space-between; padding: 3px 8px; font-size: 10px; border-top: 1px solid rgba(0,0,0,0.05); }
                                .card-row span { color: #64748b; }
                                .card-row strong { font-family: monospace; }
                                .card-blue .card-header  { background: #dbeafe; color: #1e3a8a; }
                                .card-blue .card-badge   { background: #bfdbfe; color: #1e3a8a; }
                                .card-blue               { background: #eff6ff; }
                                .card-green .card-header { background: #d1fae5; color: #064e3b; }
                                .card-green .card-badge  { background: #a7f3d0; color: #064e3b; }
                                .card-green              { background: #f0fdf4; }
                                .card-purple .card-header{ background: #ede9fe; color: #4c1d95; }
                                .card-purple .card-badge { background: #ddd6fe; color: #4c1d95; }
                                .card-purple             { background: #f5f3ff; }
                                .card-orange .card-header{ background: #ffedd5; color: #7c2d12; }
                                .card-orange .card-badge { background: #fed7aa; color: #7c2d12; }
                                .card-orange             { background: #fff7ed; }
                                .card-rose .card-header  { background: #ffe4e6; color: #881337; }
                                .card-rose .card-badge   { background: #fecdd3; color: #881337; }
                                .card-rose               { background: #fff1f2; }
                                .card-amber .card-header { background: #fef3c7; color: #78350f; }
                                .card-amber .card-badge  { background: #fde68a; color: #78350f; }
                                .card-amber              { background: #fffbeb; }
                                .acta { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-top: 10px; background: #fafafa; }
                                .acta-title { font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
                                .acta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                                .field-row { margin-bottom: 8px; }
                                .field-label { font-weight: 700; color: #334155; margin-bottom: 3px; font-size: 10px; }
                                .field-line { border-bottom: 1px solid #94a3b8; height: 18px; width: 100%; }
                                .check-row { display: flex; gap: 14px; align-items: center; margin-bottom: 8px; font-size: 10px; }
                                .check-box { display: inline-block; width: 11px; height: 11px; border: 1px solid #64748b; vertical-align: middle; margin-right: 3px; }
                                .comment-box { border: 1px solid #cbd5e1; height: 40px; background: white; border-radius: 4px; width: 100%; }
                                -webkit-print-color-adjust: exact; print-color-adjust: exact;
                            </style></head><body>
                            <div class="header-bar">
                                <div>
                                    <h1>🧪 GEEKSOFT Voyage Ledger — Auditoría Matemática</h1>
                                    <h2>Barco: <strong>${v.replace('_',' ')}</strong> &nbsp;|&nbsp; Ruta: <strong>${o} → ${d}</strong> &nbsp;|&nbsp; Período: 2026-07 &nbsp;|&nbsp; Generado: ${fechaStr}</h2>
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
                                <tbody>${tableRows}</tbody>
                            </table>
                            <div class="acta">
                                <div class="acta-title">✍️ Acta de Conformidad Matemática — Firmas y Validación</div>
                                <div class="acta-grid">
                                    <div style="display:flex;flex-direction:column;gap:8px">
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
                        className="flex-grow flex flex-col items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.01]"
                    >
                        <span className="text-xl">🖨️</span>
                        <span className="text-xs uppercase tracking-wider">Imprimir Acta PDF</span>
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
                        <div key={idx} className="page-break flex flex-col justify-between" style={{ height: '95vh', padding: '20px' }}>
                            <div className="flex-grow">
                                {renderScenarioContent(
                                    sc.vessel,
                                    sc.origin,
                                    sc.dest,
                                    scRunResult,
                                    scPetral,
                                    true // isPrint
                                )}
                            </div>
                            
                            {/* Bloque de validación y firmas (Footer para impresión) */}
                            <div className="mt-4 pt-4 border-t-2 border-slate-800 shrink-0">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-800 mb-4 text-sm">
                                            Responsable: <span className="border-b border-slate-400 inline-block w-64 ml-2"></span>
                                        </div>
                                        <div className="font-bold text-slate-800 text-sm">
                                            Estado: 
                                            <span className="ml-4 border border-slate-800 w-4 h-4 inline-block align-middle mr-1"></span> Aprobado
                                            <span className="ml-4 border border-slate-800 w-4 h-4 inline-block align-middle mr-1"></span> Con Errores
                                        </div>
                                    </div>
                                    <div className="flex-1 flex justify-end">
                                        <div className="font-bold text-slate-800 text-sm">
                                            Firma y Fecha: <span className="border-b border-slate-400 inline-block w-56 ml-2"></span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 mb-2 text-sm">Comentarios (Razón de la divergencia / Observaciones):</div>
                                    <div className="border border-slate-400 h-12 w-full rounded"></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};
