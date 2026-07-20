import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Play } from "lucide-react";

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
        { regex: /\b(t_load_rate|p_disch_limit|over_or|over_de|pos_or|pos_de)\b/g, color: 'text-orange-600 font-black' },
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

export const VoyageLedgerFinal: React.FC<{ portCostMode?: 'static' | 'matrix' }> = ({ portCostMode = 'static' }) => {
    const [localPortCostMode, setLocalPortCostMode] = useState<'static' | 'matrix'>(portCostMode);
    useEffect(() => { setLocalPortCostMode(portCostMode); }, [portCostMode]);

    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);
    
    // Data masters
    const [routes, setRoutes] = useState<any[]>([]);
    const [vessels, setVessels] = useState<any[]>([]);
    const [contracts, setContracts] = useState<any[]>([]);
    
    // Selections
    const [selectedRouteId, setSelectedRouteId] = useState<string>("");
    const [selectedVesselId, setSelectedVesselId] = useState<string>("");
    
    // Leg configuration
    const [legsConfig, setLegsConfig] = useState<any[]>([]);
    
    // Result
    const [runResult, setRunResult] = useState<any>(null);

    useEffect(() => {
        Promise.all([
            ForecastService.getSpotVoyages(),
            ForecastService.getVessels(),
            ForecastService.getContractsMaster()
        ]).then(([r, v, c]) => {
            setRoutes(r || []);
            setVessels((v || []));
            setContracts(c || []);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!selectedRouteId) {
            setLegsConfig([]);
            return;
        }
        const route = routes.find(r => r.route_id === selectedRouteId);
        if (!route || !route.legs_data || !route.legs_data.tramos) return;
        
        const tramos = route.legs_data.tramos;
        const config: any[] = [];
        for (let i = 0; i < tramos.length; i++) {
            const tr = tramos[i];
            config.push({
                idx: i,
                port_id: tr.origin_port_id,
                action: tr.origin_action || 'NONE',
                quantity: 0,
                freight_rate: 0
            });
            if (i === tramos.length - 1) {
                config.push({
                    idx: i + 1,
                    port_id: tr.destination_port_id,
                    action: tr.destination_action || 'NONE',
                    quantity: 0,
                    freight_rate: 0
                });
            }
        }
        setLegsConfig(config);
    }, [selectedRouteId, routes]);

    const handleQuantityChange = (idx: number, valStr: string) => {
        const val = parseFloat(valStr) || 0;
        const newConf = [...legsConfig];
        newConf[idx].quantity = val;
        
        if (newConf[idx].action === 'CARGAR') {
            const route = routes.find(r => r.route_id === selectedRouteId);
            if (route) {
                const client = (route.name || "").split('.')[0];
                const tr = route.legs_data.tramos.find((t:any) => t.origin_port_id === newConf[idx].port_id);
                if (tr) {
                    const dest = tr.destination_port_id;
                    const cMatch = contracts.find(c => c.client_id === client);
                    if (cMatch && cMatch.tariffs) {
                        const tMatch = cMatch.tariffs.find((t:any) => val >= t.min_tonnage && val <= t.max_tonnage && t.origin_port_id === tr.origin_port_id && t.destination_port_id === dest);
                        if (tMatch) {
                            newConf[idx].freight_rate = tMatch.freight_rate;
                        } else {
                            newConf[idx].freight_rate = 0;
                        }
                    }
                }
            }
        }
        setLegsConfig(newConf);
    };

    const handleCalculate = async () => {
        if (!selectedRouteId || !selectedVesselId) return;
        
        const totalCargas = legsConfig.filter(p => p.action === 'CARGAR').reduce((acc, p) => acc + (p.quantity || 0), 0);
        const totalDesc = legsConfig.filter(p => p.action === 'DESCARGAR').reduce((acc, p) => acc + (p.quantity || 0), 0);
        if (totalCargas === 0 || totalCargas !== totalDesc) {
            alert('Las toneladas de carga deben ser mayores a 0 y coincidir con las de descarga.');
            return;
        }
        
        const missingTariffs = legsConfig.filter(p => p.action === 'CARGAR' && (!p.freight_rate || p.freight_rate <= 0));
        if (missingTariffs.length > 0) {
            alert('Debe ingresar una tarifa mayor a 0 para todos los puertos de carga.');
            return;
        }

        const route = routes.find(r => r.route_id === selectedRouteId);
        const tramos = JSON.parse(JSON.stringify(route.legs_data.tramos));
        
        for (let i = 0; i < tramos.length; i++) {
            const conf = legsConfig.find(c => c.idx === i);
            if (conf && conf.action === 'CARGAR') {
                tramos[i].quantity = conf.quantity;
                tramos[i].freight_rate = conf.freight_rate;
            }
            if (!tramos[i].type) {
                tramos[i].type = (conf && conf.action === 'NONE') ? 'BALLAST' : 'LADEN';
            }
        }

        setSimulating(true);
        setRunResult(null);

        try {
            const payload = {
                vessel_id: selectedVesselId,
                tramos: tramos,
                port_cost_mode: localPortCostMode
            };
            const res = await ForecastService.calculateMultiCotizador(payload);
            setRunResult(res);
        } catch (err: any) {
            console.error(err);
            alert('Error en el cálculo: ' + (err.response?.data?.detail || err.message));
        } finally {
            setSimulating(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-semibold animate-pulse">Cargando Auditoría Final...</div>;

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

        const formatCurrency = (val: any) => {
            const num = parseFloat(val);
            return isNaN(num) ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
        };
        const formatNumber = (val: any) => {
            const num = parseFloat(val);
            return isNaN(num) ? '—' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(num);
        };

        const auditRows = [
            { metric: "1. Ritmo Carga (MT/hr)",  key: "1. Ritmo Carga (act_load)",       gk: scenarioResult.actual_load_rate,      ptr: scenarioPetral.act_load,  isCurr: false, db: "contracts · vessels · ports", ui: "Contratos / Flota / Puertos" },
            { metric: "2. Ritmo Desc. (MT/hr)", key: "2. Ritmo Descarga (act_disch)",  gk: scenarioResult.actual_discharge_rate, ptr: scenarioPetral.act_disch, isCurr: false, db: "contracts · vessels · ports", ui: "Contratos / Flota / Puertos" },
            { metric: "3. Días de Puerto",       key: "3. Días de Puerto (port_days)",  gk: scenarioResult.port_days_unit,          ptr: scenarioPetral.port_days, isCurr: false, db: "ports · Calculado",  ui: "Motor" },
            { metric: "4. Días de Mar",          key: "4. Días de Mar (sea_days)",      gk: scenarioResult.sea_days_unit,           ptr: scenarioPetral.sea_days,  isCurr: false, db: "routes · vessels",              ui: "Maestro Rutas / Flota" },
            { metric: "5. Días de Viaje",        key: "5. Días de Viaje (tot_dur)",     gk: scenarioResult.total_duration_unit,     ptr: scenarioPetral.total_duration,   isCurr: false, db: "Calculado",                     ui: "Motor" },
            { metric: "6. Income",               key: "6. Income (income)",              gk: scenarioResult.net_income,              ptr: scenarioPetral.net_income,isCurr: true,  db: "contracts · contract_tariffs",     ui: "Contratos / Tarifario" },
            { metric: "7. Comisiones",            key: "7. Comisiones (commissions)",     gk: scenarioResult.total_commissions,       ptr: 0,                        isCurr: true,  db: "contracts",                         ui: "Addr+Broker Comm" },
            { metric: "8. Costo Bunker",          key: "8. Costo Bunker (bunker)",        gk: scenarioResult.total_bunker_costs_unit, ptr: scenarioPetral.bunker_costs,    isCurr: true,  db: "vessels · bunker_prices",           ui: "Maestro Flota / Bunker" },
            { metric: "9. Port Costs",            key: "9. Port Costs (port_costs)",      gk: scenarioResult.total_port_costs,        ptr: scenarioPetral.total_port_costs, isCurr: true,  db: localPortCostMode === 'static' ? "port_cost_static" : "port_costs_matrix",                  ui: "Costos Portuarios" },
            { metric: "10. Voyage Result",        key: "10. Voyage Result (voy_res)",     gk: scenarioResult.voyage_result,           ptr: scenarioPetral.voyage_result,   isCurr: true,  db: localPortCostMode === 'static' ? "contract_tariffs · port_cost_static" : "contract_tariffs · port_costs_matrix", ui: "Tarifas / Costos Portuarios" },
            { metric: "11. TCE Diario",           key: "11. TCE Diario (tce_real)",       gk: scenarioResult.tce_real_unit,           ptr: scenarioPetral.tce_real,  isCurr: true,  db: "Calculado",                         ui: "Motor" },
            { metric: "12. P/L",                  key: "12. P/L (pl_vs_req)",             gk: scenarioResult.pl_vs_required_unit,     ptr: scenarioPetral.pl_vs_req, isCurr: true,  db: "vessels",                           ui: "Maestro Flota" },
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
                            <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.vessels.text}`}>Velocidad (speed)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatNumber(scenarioResult.raw_inputs?.vessel_speed || 0)} kn</span></div>
                            <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.vessels.text}`}>TCE Requerido (tce_req)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatCurrency(scenarioResult.raw_inputs?.tce_required || 0)}/d</span></div>
                            <div className={`mt-0.5 pt-1.5 border-t border-dashed ${COLOR_SCHEME.vessels.border} grid grid-cols-2 gap-x-4 gap-y-1`}>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[9px] uppercase ${COLOR_SCHEME.vessels.text}`}>DWT</span><span className="font-mono text-slate-700 font-bold text-[10px]">{formatNumber(scenarioResult.raw_inputs?.dwt || 0)} t</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[9px] uppercase ${COLOR_SCHEME.vessels.text}`}>DWCC</span><span className="font-mono text-slate-700 font-bold text-[10px]">{formatNumber(scenarioResult.raw_inputs?.dwcc || 0)} t</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[9px] uppercase ${COLOR_SCHEME.vessels.text}`}>Length (L)</span><span className="font-mono text-slate-700 font-bold text-[10px]">{scenarioResult.raw_inputs?.length || 0} m</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[9px] uppercase ${COLOR_SCHEME.vessels.text}`}>Beam (B)</span><span className="font-mono text-slate-700 font-bold text-[10px]">{scenarioResult.raw_inputs?.beam || 0} m</span></div>
                            </div>
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
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${COLOR_SCHEME.agency_matrix.badge}`}>{localPortCostMode === 'static' ? 'port_cost_static' : 'port_costs_matrix'}</span>
                            </div>
                            <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between">
                                <div className={`text-[10px] italic leading-tight mb-1 ${COLOR_SCHEME.agency_matrix.text}`}>Llaves: Cliente + Puerto + Op + Barco</div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.agency_matrix.text}`}>Cliente</span><span className="font-mono text-slate-800 font-bold text-xs">SPCC</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.agency_matrix.text}`}>Port Cost Origen (port_costs)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatCurrency(Object.values(scenarioResult.port_costs_breakdown?.origin || {}).reduce((s: any, v: any) => s + (v || 0), 0))}</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.agency_matrix.text}`}>Port Cost Destino (port_costs)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatCurrency(Object.values(scenarioResult.port_costs_breakdown?.destination || {}).reduce((s: any, v: any) => s + (v || 0), 0))}</span></div>
                                <div className="flex justify-between items-baseline border-t border-dashed border-rose-200 pt-1 mt-0.5">
                                    <span className="font-semibold text-[10px] uppercase text-rose-600">↳ Loading Master</span>
                                    <span className="font-mono text-rose-700 font-bold text-xs">{formatCurrency(scenarioResult.port_costs_breakdown?.destination?.loading_master || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Col 3: Reglas Comerciales */}
                    <div className="flex-[1.3] flex flex-col gap-1">
                        <div className={`flex-1 flex flex-col border rounded-lg shadow-sm overflow-hidden ${COLOR_SCHEME.contracts.cardBg} ${COLOR_SCHEME.contracts.border}`}>
                            <div className={`border-b px-3 py-2 flex items-center justify-between ${COLOR_SCHEME.contracts.headerBg} ${COLOR_SCHEME.contracts.border}`}>
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${COLOR_SCHEME.contracts.text}`}>Reglas Comerciales</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${COLOR_SCHEME.contracts.badge}`}>contracts</span>
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-start gap-2">
                                {!isPrint ? (
                                    <div className="grid grid-cols-2 gap-4 h-full items-stretch">
                                        {/* Izquierda: Inputs y campos */}
                                        <div className="flex flex-col gap-1 justify-start">
                                            <div className="flex justify-between items-center">
                                                <span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Cantidad (Q)</span>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        min={10000}
                                                        max={15000}
                                                        step={100}
                                                        value={(scenarioResult.raw_inputs?.quantity || 0)}
                                                        readOnly
                                                        className="w-20 text-xs font-mono font-bold text-center bg-white border-2 border-emerald-400 rounded px-1 py-0.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                    <span className={`text-[10px] font-bold ${simulating ? 'text-amber-500 animate-pulse' : 'text-slate-500'}`}>MT{simulating ? ' ⟳' : ''}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Flete Base (F)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatCurrency(scenarioResult.raw_inputs?.freight_rate || 0)}/MT</span></div>
                                            <div className="flex justify-between items-baseline border-t border-dashed border-emerald-100 pt-1 mt-0.5"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Ritmo Carga (c_load)</span><span className="font-mono text-slate-850 font-bold text-xs">{scenarioResult.raw_inputs?.contract_agreed_load_rate ? formatNumber(scenarioResult.raw_inputs.contract_agreed_load_rate) + " T/h" : "TBD"}</span></div>
                                            <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Ritmo Desc (c_disch)</span><span className="font-mono text-slate-850 font-bold text-xs">{scenarioResult.raw_inputs?.contract_agreed_discharge_rate ? formatNumber(scenarioResult.raw_inputs.contract_agreed_discharge_rate) + " T/h" : "TBD"}</span></div>
                                            
                                            {/* Nuevas 6 Variables */}
                                            <div className="flex justify-between items-baseline border-t border-dashed border-emerald-100 pt-1 mt-0.5"><span className={`font-semibold text-[9px] uppercase text-emerald-700`}>Time to Count Cg.</span><span className="font-mono text-slate-700 font-semibold text-xs">{formatNumber(scenarioResult.raw_inputs?.port_overhead_hours_origin || 0)} H</span></div>
                                            <div className="flex justify-between items-baseline"><span className={`font-semibold text-[9px] uppercase text-emerald-700`}>Time to Count Dg.</span><span className="font-mono text-slate-700 font-semibold text-xs">{formatNumber(scenarioResult.raw_inputs?.port_overhead_hours_dest || 0)} H</span></div>
                                            <div className="flex justify-between items-baseline"><span className={`font-semibold text-[9px] uppercase text-emerald-700`}>Manuever Carga</span><span className="font-mono text-slate-700 font-semibold text-xs">{formatNumber(scenarioResult.raw_inputs?.positioning_carga_hrs || 0)} H</span></div>
                                            <div className="flex justify-between items-baseline"><span className={`font-semibold text-[9px] uppercase text-emerald-700`}>Manuever Descarga</span><span className="font-mono text-slate-700 font-semibold text-xs">{formatNumber(scenarioResult.raw_inputs?.positioning_descarga_hrs || 0)} H</span></div>
                                            <div className="flex justify-between items-baseline border-t border-dashed border-emerald-100 pt-1 mt-0.5"><span className={`font-semibold text-[9px] uppercase text-emerald-700`}>Address Comm.</span><span className="font-mono text-slate-800 font-bold text-xs">{(scenarioResult.raw_inputs?.address_commission || 0).toFixed(2)}%</span></div>
                                            <div className="flex justify-between items-baseline"><span className={`font-semibold text-[9px] uppercase text-emerald-700`}>Broker Comm.</span><span className="font-mono text-slate-800 font-bold text-xs">{(scenarioResult.raw_inputs?.broker_commission || 0).toFixed(2)}%</span></div>
                                        </div>
                                        {/* Derecha: Tabla miniatura */}
                                        <div className="border-l border-emerald-100 pl-3 flex flex-col justify-start gap-2">
                                            <div className={`text-[8px] font-bold uppercase mb-1 ${COLOR_SCHEME.contracts.text}`}>Tarifario SPCC por Bracket</div>
                                            <div className="overflow-x-auto rounded border border-emerald-100 bg-white">
                                                <table className="w-full text-[9px] border-collapse table-fixed">
                                                    <thead>
                                                        <tr className="bg-emerald-50 border-b border-emerald-100 text-emerald-800">
                                                            <th className="p-0.5 font-bold text-center" style={{ width: '33.33%' }}>Min (MT)</th>
                                                            <th className="p-0.5 font-bold text-center" style={{ width: '33.33%' }}>Max (MT)</th>
                                                            <th className="p-0.5 font-bold text-center" style={{ width: '33.33%' }}>Flete ($)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 font-mono">
                                                        {(TARIFFS_MAP[destPort] || []).map((t, idx) => {
                                                            const isActive = (scenarioResult.raw_inputs?.quantity || 0) >= t.min && (scenarioResult.raw_inputs?.quantity || 0) <= t.max;
                                                            return (
                                                                <tr key={idx} className={`${isActive ? 'bg-emerald-100 font-bold text-emerald-950' : 'text-slate-600'}`}>
                                                                    <td className="p-0.5 text-center" style={{ width: '33.33%' }}>{formatNumber(t.min)}</td>
                                                                    <td className="p-0.5 text-center" style={{ width: '33.33%' }}>{formatNumber(t.max)}</td>
                                                                    <td className="p-0.5 text-center" style={{ width: '33.33%' }}>{formatCurrency(t.rate)}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Cantidad (Q)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatNumber((scenarioResult.raw_inputs?.quantity || 0))} MT</span></div>
                                        <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Flete Base (F)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatCurrency(scenarioResult.raw_inputs?.freight_rate || 0)}/MT</span></div>
                                        <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Ritmo Carga (c_load)</span><span className="font-mono text-slate-800 font-bold text-xs">{scenarioResult.raw_inputs?.contract_agreed_load_rate ? formatNumber(scenarioResult.raw_inputs.contract_agreed_load_rate) + " T/h" : "TBD"}</span></div>
                                        <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.contracts.text}`}>Ritmo Desc (c_disch)</span><span className="font-mono text-slate-800 font-bold text-xs">{scenarioResult.raw_inputs?.contract_agreed_discharge_rate ? formatNumber(scenarioResult.raw_inputs.contract_agreed_discharge_rate) + " T/h" : "TBD"}</span></div>
                                        
                                        <div className="flex justify-between items-baseline"><span className={`font-semibold text-[9px] uppercase text-emerald-800`}>Time to Count Cg.</span><span className="font-mono text-slate-700 text-xs">{formatNumber(scenarioResult.raw_inputs?.port_overhead_hours_origin || 0)} H</span></div>
                                        <div className="flex justify-between items-baseline"><span className={`font-semibold text-[9px] uppercase text-emerald-800`}>Time to Count Dg.</span><span className="font-mono text-slate-700 text-xs">{formatNumber(scenarioResult.raw_inputs?.port_overhead_hours_dest || 0)} H</span></div>
                                        <div className="flex justify-between items-baseline"><span className={`font-semibold text-[9px] uppercase text-emerald-800`}>Manuever Carga</span><span className="font-mono text-slate-700 text-xs">{formatNumber(scenarioResult.raw_inputs?.positioning_carga_hrs || 0)} H</span></div>
                                        <div className="flex justify-between items-baseline"><span className={`font-semibold text-[9px] uppercase text-emerald-800`}>Manuever Descarga</span><span className="font-mono text-slate-700 text-xs">{formatNumber(scenarioResult.raw_inputs?.positioning_descarga_hrs || 0)} H</span></div>
                                        <div className="flex justify-between items-baseline"><span className={`font-semibold text-[9px] uppercase text-emerald-800`}>Address Comm.</span><span className="font-mono text-slate-800 text-xs">{(scenarioResult.raw_inputs?.address_commission || 0).toFixed(2)}%</span></div>
                                        <div className="flex justify-between items-baseline"><span className={`font-semibold text-[9px] uppercase text-emerald-800`}>Broker Comm.</span><span className="font-mono text-slate-800 text-xs">{(scenarioResult.raw_inputs?.broker_commission || 0).toFixed(2)}%</span></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Col 4: Maestro Rutas */}
                    <div className="flex-[0.7] flex flex-col gap-4">
                        {col4Header}
                        <div className={`border rounded-lg shadow-sm overflow-hidden ${COLOR_SCHEME.routes.cardBg} ${COLOR_SCHEME.routes.border} ${isPrint ? 'flex-1' : ''}`}>
                            <div className={`border-b px-3 py-2 flex items-center justify-between ${COLOR_SCHEME.routes.headerBg} ${COLOR_SCHEME.routes.border}`}>
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${COLOR_SCHEME.routes.text}`}>Maestro Rutas</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${COLOR_SCHEME.routes.badge}`}>routes</span>
                            </div>
                            <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between">
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.routes.text}`}>Origen &rarr; Destino</span><span className="font-mono text-slate-800 font-bold text-xs">{originPort} &rarr; {destPort}</span></div>
                                <div className="flex justify-between items-baseline border-t border-dashed border-cyan-200 pt-1 mt-0.5"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.routes.text}`}>Distancia 1-way (dist)</span><span className="font-mono text-slate-800 font-bold text-xs">{formatNumber(scenarioResult.raw_inputs?.route_distance || 0)} NM</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-bold text-[10px] uppercase text-cyan-700`}>Dist. TOTAL VIAJE</span><span className="font-mono text-cyan-800 font-black text-xs">{formatNumber(scenarioResult.distancia_total || 0)} NM</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.routes.text}`}>W Fct (Laden)</span><span className="font-mono text-slate-800 font-bold text-xs">{((scenarioResult.raw_inputs?.weather_factor_laden || 0)*100).toFixed(1)}%</span></div>
                                <div className="flex justify-between items-baseline"><span className={`font-semibold text-[10px] uppercase ${COLOR_SCHEME.routes.text}`}>W Fct (Ballast)</span><span className="font-mono text-slate-800 font-bold text-xs">{((scenarioResult.raw_inputs?.weather_factor_ballast || 0)*100).toFixed(1)}%</span></div>
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
        <div className="flex flex-col gap-4 p-4 bg-white border border-slate-200 rounded-md">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="text-2xl">⚖️</span> Auditoría Final
            </h2>

            <div className="flex gap-4 items-end flex-wrap">
                <div className="flex flex-col gap-2 w-72">
                    <Label className="text-xs font-semibold text-slate-600">Ruta</Label>
                    <Select value={selectedRouteId} onValueChange={(val: any) => setSelectedRouteId(val || "")}>
                        <SelectTrigger className="bg-white text-xs h-9">
                            <SelectValue placeholder="Seleccione una ruta">{routes.find(r => r.route_id === selectedRouteId)?.name || ""}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {routes.map(r => (
                                <SelectItem key={r.route_id} value={r.route_id}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="flex flex-col gap-2 w-48">
                    <Label className="text-xs font-semibold text-slate-600">Buque</Label>
                    <Select value={selectedVesselId} onValueChange={(val: any) => setSelectedVesselId(val || "")}>
                        <SelectTrigger className="bg-white text-xs h-9">
                            <SelectValue placeholder="Seleccione un buque">{vessels.find(v => v.vessel_id === selectedVesselId)?.vessel_name || ""}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {vessels.map(v => (
                                <SelectItem key={v.vessel_id} value={v.vessel_id}>{v.vessel_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2 w-48">
                    <Label className="text-xs font-semibold text-slate-600">Matriz Portuaria</Label>
                    <Select value={localPortCostMode} onValueChange={(val: any) => setLocalPortCostMode(val)}>
                        <SelectTrigger className="bg-white text-xs h-9">
                            <SelectValue>{localPortCostMode === "static" ? "Estática" : "Dinámica"}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="static">Estática</SelectItem>
                            <SelectItem value="matrix">Dinámica</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <button 
                    onClick={handleCalculate}
                    disabled={!selectedRouteId || !selectedVesselId || simulating}
                    className="h-9 px-6 bg-teal-600 hover:bg-teal-700 text-white text-xs uppercase tracking-wider font-bold rounded flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    {simulating ? 'Calculando...' : <><Play size={14} /> Calcular</>}
                </button>
            </div>

            {legsConfig.length > 0 && (
                <div className="mt-4 border border-slate-200 rounded-md overflow-hidden bg-slate-50 p-4">
                    <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Itinerario y Carga</h3>
                    <table className="w-full text-sm text-left bg-white border border-slate-200 shadow-sm rounded">
                        <thead className="bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Puerto</th>
                                <th className="px-4 py-3 text-center">Acción</th>
                                <th className="px-4 py-3 text-right">Toneladas (MT)</th>
                                <th className="px-4 py-3 text-right">Tarifa (USD)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {legsConfig.map((conf, idx) => (
                                <tr key={idx} className={conf.action === 'NONE' ? 'bg-slate-50 opacity-60' : 'hover:bg-blue-50/30'}>
                                    <td className="px-4 py-3 font-bold text-slate-800 text-xs">{conf.port_id}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-black ${conf.action === 'CARGAR' ? 'bg-blue-100 text-blue-800' : conf.action === 'DESCARGAR' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                            {conf.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {conf.action !== 'NONE' ? (
                                            <Input 
                                                type="number" 
                                                className="w-32 h-8 text-right ml-auto text-xs font-bold bg-white"
                                                value={conf.quantity || ''}
                                                onChange={e => handleQuantityChange(idx, e.target.value)}
                                                placeholder="0.00"
                                            />
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {conf.action === 'CARGAR' ? (
                                            <Input 
                                                type="number" 
                                                className="w-24 h-8 text-right ml-auto text-xs font-bold bg-amber-50 border-amber-200 focus:border-amber-400 text-amber-900"
                                                value={conf.freight_rate || ''}
                                                onChange={e => {
                                                    const newConf = [...legsConfig];
                                                    newConf[idx].freight_rate = parseFloat(e.target.value) || 0;
                                                    setLegsConfig(newConf);
                                                }}
                                                placeholder="0.00"
                                            />
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {runResult && runResult.tramos && runResult.tramos.map((tr: any, idx: number) => {
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
            })}
        </div>
    );
};
