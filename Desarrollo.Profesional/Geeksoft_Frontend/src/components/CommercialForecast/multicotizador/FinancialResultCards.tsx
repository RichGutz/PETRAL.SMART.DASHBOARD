import React from 'react';

export interface FinancialResultCardsProps {
    result?: any;
    bunkerPriceIfo: number;
    bunkerPriceMdo: number;
    puertosConfig: any[];
    tramos: any[];
    vessels?: any[];
    selectedVessel?: string;
    vesselParams: any;
    addressCommPct: number;
    brokerCommPct: number;
    demurrageRate: number;
    commentsText: string;
    bafFormula?: string;
    bafValidFrom?: string;
    bafValidTo?: string;
    bafIfoBase?: number;
    bafMdoBase?: number;
    tariffTiers?: Array<{ label?: string; min?: number; max?: number; rate: number }>;
    demurrageRatesMap?: Record<string, number>;
    refacturarMuellajeMap: Record<number, boolean>;
    setAddressCommPct: (val: number) => void;
    setBrokerCommPct: (val: number) => void;
    setDemurrageRate: (val: number) => void;
    setCommentsText: (val: string) => void;
    setBafFormula?: (val: string) => void;
    setBafValidFrom?: (val: string) => void;
    setBafValidTo?: (val: string) => void;
    setBafIfoBase?: (val: number) => void;
    setBafMdoBase?: (val: number) => void;
    setTariffTiers?: (val: any[]) => void;
    setDemurrageRatesMap?: (val: Record<string, number>) => void;
    getDynamicPortCostItems: () => any[];
    fmtCur: (val: number | string | undefined | null) => string;
    fmtNum: (val: number | string | undefined | null) => string;
    fmtDays: (val: number | string | undefined | null) => string;
    fmtThousandSep: (val: number | string | undefined | null) => string;
}

const CHILEAN_PORTS = ['MEJILLONES', 'ANTOFAGASTA', 'VALPARAISO', 'SAN ANTONIO', 'ARICA', 'IQUIQUE', 'COQUIMBO'];

const PORT_THEMES = [
    { bg: 'bg-blue-50/60', text: 'text-blue-900', border: 'border-blue-200' },
    { bg: 'bg-emerald-50/60', text: 'text-emerald-900', border: 'border-emerald-200' },
    { bg: 'bg-amber-50/60', text: 'text-amber-900', border: 'border-amber-200' },
    { bg: 'bg-purple-50/60', text: 'text-purple-900', border: 'border-purple-200' },
    { bg: 'bg-indigo-50/60', text: 'text-indigo-900', border: 'border-indigo-200' }
];

export const FinancialResultCards: React.FC<FinancialResultCardsProps> = ({
    result: _result,
    bunkerPriceIfo,
    bunkerPriceMdo,
    puertosConfig,
    tramos,
    vessels,
    selectedVessel,
    vesselParams,
    addressCommPct,
    brokerCommPct,
    demurrageRate: _demurrageRate,
    commentsText,
    bafFormula,
    bafValidFrom,
    bafValidTo,
    bafIfoBase,
    bafMdoBase,
    tariffTiers,
    demurrageRatesMap,
    refacturarMuellajeMap,
    setAddressCommPct,
    setBrokerCommPct,
    setDemurrageRate,
    setCommentsText,
    setBafFormula,
    setBafValidFrom,
    setBafValidTo,
    setBafIfoBase,
    setBafMdoBase,
    setTariffTiers,
    setDemurrageRatesMap,
    getDynamicPortCostItems,
    fmtCur,
    fmtNum,
    fmtDays,
    fmtThousandSep
}) => {
    // 1. Cálculo Live de Búnker Tonnage (IFO & MDO)
    let liveIfoTons = 0;
    let liveMdoTons = 0;
    let liveTotalSeaDays = 0;
    let liveTotalPortDays = 0;

    tramos.forEach((tr, idx) => {
        const selectedVesselObj = (vessels || []).find(v => v.vessel_id === selectedVessel);
        const distVal = Number(tr.route_distance || 0);
        const rawWf = Number(tr.weather_factor || 0);
        const wfPct = rawWf > 1 ? rawWf : (rawWf * 100);
        const speedVal = Math.max(1, Number(tr.speed || selectedVesselObj?.vessel_speed || vesselParams?.vessel_speed || 11));
        const calcSeaDays = distVal > 0 ? (distVal * (1 + (wfPct / 100))) / (speedVal * 24) : 0;
        liveTotalSeaDays += calcSeaDays;

        const pCfg = puertosConfig[idx + 1] || {};
        const qVal = Number(pCfg.quantity || 0);
        const rVal = Math.max(1, Number(pCfg.op_rate || 500));
        const tcVal = Number(pCfg.time_to_count || 0);
        const posVal = Number(pCfg.positioning || 0);

        const idleDays = pCfg.action !== 'NONE' ? ((tcVal + posVal) / 24) : 0;
        const opDays = pCfg.action !== 'NONE' ? ((qVal / rVal) / 24) : 0;
        const calcPortDays = idleDays + opDays;
        liveTotalPortDays += calcPortDays;

        const ifoSeaRatio = Number(vesselParams?.consumption_sea_ifo || selectedVesselObj?.consumption_sea_ifo || 0);
        const mdoSeaRatio = Number(vesselParams?.consumption_sea_mdo || selectedVesselObj?.consumption_sea_mdo || 0);
        const ifoIdleRatio = Number(vesselParams?.consumption_idle_ifo || selectedVesselObj?.consumption_idle_ifo || 0);
        const mdoIdleRatio = Number(vesselParams?.consumption_idle_mdo || selectedVesselObj?.consumption_idle_mdo || 0);
        const ifoLoadRatio = Number(vesselParams?.consumption_load_ifo || selectedVesselObj?.consumption_load_ifo || ifoIdleRatio);
        const mdoLoadRatio = Number(vesselParams?.consumption_load_mdo || selectedVesselObj?.consumption_load_mdo || mdoIdleRatio);
        const ifoDischRatio = Number(vesselParams?.consumption_disch_ifo || selectedVesselObj?.consumption_disch_ifo || 0);
        const mdoDischRatio = Number(vesselParams?.consumption_disch_mdo || selectedVesselObj?.consumption_disch_mdo || mdoIdleRatio);

        const opIfoRate = pCfg.action === 'DESCARGAR' ? ifoDischRatio : pCfg.action === 'CARGAR' ? ifoLoadRatio : ifoIdleRatio;
        const opMdoRate = pCfg.action === 'DESCARGAR' ? mdoDischRatio : pCfg.action === 'CARGAR' ? mdoLoadRatio : mdoIdleRatio;

        liveIfoTons += (calcSeaDays * ifoSeaRatio) + (idleDays * ifoIdleRatio) + (opDays * opIfoRate);
        liveMdoTons += (calcSeaDays * mdoSeaRatio) + (idleDays * mdoIdleRatio) + (opDays * opMdoRate);
    });

    const ifoT = liveIfoTons;
    const mdoT = liveMdoTons;
    const ifoCost = ifoT * bunkerPriceIfo;
    const mdoCost = mdoT * bunkerPriceMdo;
    const totalBunkerCost = ifoCost + mdoCost;

    // 2. Port Costs Live Sum
    const livePortCostsSum = puertosConfig.reduce((sum, p, i) => {
        if (p.action === 'NONE') return sum;
        const portId = i === 0 ? (tramos[0]?.origin_port_id || '') : (tramos[i - 1]?.destination_port_id || '');
        const isMejillonesDischarge = (portId || '').trim().toUpperCase() === 'MEJILLONES' && p.action === 'DESCARGAR';
        const mCost = Number(p.manual_port_cost) || 0;
        const muellCost = Number(p.muellaje_cost) || (isMejillonesDischarge ? 33333 : 0);
        return sum + Math.max(mCost, muellCost);
    }, 0);
    const totalPortCostsVal = livePortCostsSum;

    // 3. Revenue & Refacturación de Muellaje Live
    const liveRevenue = tramos.reduce((sum, _, idx) => sum + (puertosConfig[idx + 1]?.action === 'DESCARGAR' ? (Number(puertosConfig[idx + 1]?.quantity || 0) * Number(puertosConfig[idx + 1]?.freight_rate || 0)) : 0), 0);
    const revenue = liveRevenue;

    const liveRefacturacionMuellaje = puertosConfig.reduce((sum, p, i) => {
        if (p.action === 'NONE') return sum;
        const portId = i === 0 ? (tramos[0]?.origin_port_id || '') : (tramos[i - 1]?.destination_port_id || '');
        const isMejillonesDischarge = (portId || '').trim().toUpperCase() === 'MEJILLONES' && p.action === 'DESCARGAR';
        const muellCost = Number(p.muellaje_cost) || (isMejillonesDischarge ? 33333 : 0);
        if (refacturarMuellajeMap[i] !== false && muellCost > 0) {
            return sum + muellCost;
        }
        return sum;
    }, 0);
    const refacturacionMuellajeUsd = liveRefacturacionMuellaje;

    // 4. Financial Voyage Result Live
    const totalDays = liveTotalSeaDays + liveTotalPortDays;
    const tceReq = Number(vesselParams?.tce_required || 0);
    const hireUsd = tceReq * totalDays;

    const addressCommUsd = revenue * (addressCommPct / 100);
    const brokerCommUsd = revenue * (brokerCommPct / 100);
    const totalCommUsd = addressCommUsd + brokerCommUsd;

    const pnlVal = (revenue + refacturacionMuellajeUsd) - (hireUsd + totalBunkerCost + totalPortCostsVal + totalCommUsd);

    const tceReal = totalDays > 0 ? (((revenue + refacturacionMuellajeUsd) - (totalBunkerCost + totalPortCostsVal + totalCommUsd)) / totalDays) : 0;
    const tceDiff = tceReal - tceReq;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-shrink-0 mt-3">
            
            {/* BLOQUE IZQUIERDO: 3 TARJETAS EN 3 COLUMNAS */}
            <div className="col-span-1 lg:col-span-3 flex flex-col gap-3">
                
                {/* FILA SUPERIOR: BÚNKER (COL 1), PORT COSTS (COL 2), COMISIONES (COL 3) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    
                    {/* 1. Bunker Expenses */}
                    <div className="bg-white border border-slate-350 rounded p-2 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1.5 font-sans">
                                Bunker Expenses (Combustible)
                            </h3>
                            <table className="w-full border-collapse text-xs font-mono">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 font-sans text-[10.5px] text-slate-500 font-bold">
                                        <th className="text-left py-0.5 pl-1">Fuel</th>
                                        <th className="text-right py-0.5 pr-1">Tonnage (T)</th>
                                        <th className="text-right py-0.5 pr-1">Expense (USD)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-1 pl-1 text-slate-600 font-sans text-[11px]">IFO (Heavy Fuel)</td>
                                        <td className="text-right py-1 pr-1">{fmtNum(ifoT)}</td>
                                        <td className="text-right py-1 pr-1 font-bold">{fmtCur(ifoCost)}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-1 pl-1 text-slate-600 font-sans text-[11px]">MDO (Diesel)</td>
                                        <td className="text-right py-1 pr-1">{fmtNum(mdoT)}</td>
                                        <td className="text-right py-1 pr-1 font-bold">{fmtCur(mdoCost)}</td>
                                    </tr>
                                    <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                        <td className="py-1 pl-1 font-sans text-[10.5px] uppercase">Total Fuel</td>
                                        <td className="text-right py-1 pr-1">{fmtNum(ifoT + mdoT)}</td>
                                        <td className="text-right py-1 pr-1">{fmtCur(totalBunkerCost)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 2. Port Costs */}
                    <div className="bg-white border border-slate-350 rounded p-2 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1.5 font-sans">
                                Port Costs (Gastos de Puerto)
                            </h3>
                            <table className="w-full border-collapse text-xs font-mono">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 font-sans text-[10.5px] text-slate-500 font-bold">
                                        <th className="text-left py-0.5 pl-1.5">Expense Concept</th>
                                        <th className="text-right py-0.5 pr-1.5">Costo (USD)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const portItems = getDynamicPortCostItems();

                                        return (
                                            <>
                                                {portItems.map((item, idx) => {
                                                    const isChile = CHILEAN_PORTS.includes((item.port_id || '').toUpperCase());
                                                    const lmCost = (isChile && item.cost >= 2500) ? 2500 : 0;
                                                    const mValPort = Number(item.muellaje_cost || 0);
                                                    const baseAgencyCost = Math.max(0, item.cost - lmCost - mValPort);

                                                    if (baseAgencyCost < 1 && lmCost < 1 && mValPort < 1) return null;

                                                    const theme = PORT_THEMES[idx % PORT_THEMES.length];

                                                    return (
                                                        <React.Fragment key={idx}>
                                                            {baseAgencyCost >= 1 && (
                                                                <tr className={`border-b border-slate-200/80 ${theme.bg} ${theme.border}`}>
                                                                    <td className={`py-1 pl-2 font-normal ${theme.text}`}>Port Costs {item.label}</td>
                                                                    <td className={`text-right py-1 pr-1.5 font-mono ${theme.text}`}>
                                                                        {fmtCur(baseAgencyCost)}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            {lmCost >= 1 && (
                                                                <tr className={`border-b border-slate-200/80 ${theme.bg} ${theme.border}`}>
                                                                    <td className={`py-1 pl-2 font-normal ${theme.text}`}>Loading Master ({item.port_id})</td>
                                                                    <td className={`text-right py-1 pr-1.5 font-mono ${theme.text}`}>
                                                                        {fmtCur(lmCost)}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            {mValPort >= 1 && (
                                                                <tr className={`border-b border-slate-200/80 ${theme.bg} ${theme.border}`}>
                                                                    <td className={`py-1 pl-2 font-normal ${theme.text}`}>Muellaje ({item.port_id})</td>
                                                                    <td className={`text-right py-1 pr-1.5 font-mono ${theme.text}`}>
                                                                        {fmtCur(mValPort)}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                                <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                                    <td className="py-1.5 pl-1.5 font-sans text-[10.5px] uppercase">Total Port Costs</td>
                                                    <td className="text-right py-1.5 pr-1.5">
                                                        {fmtCur(totalPortCostsVal)}
                                                    </td>
                                                </tr>
                                            </>
                                        );
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. Comisiones de Viaje */}
                    <div className="bg-white border border-slate-350 rounded p-2 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1 flex items-center justify-between font-sans">
                                <span>Comisiones de Viaje</span>
                            </h3>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center text-xs font-sans">
                                    <span className="font-semibold text-slate-600 text-[11px]">Address Comm (%)</span>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={addressCommPct}
                                            onChange={(e) => setAddressCommPct(Math.max(0, parseFloat(e.target.value) || 0))}
                                            className="w-12 h-6 text-right font-mono font-bold bg-white border border-slate-350 rounded px-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                        <span className="font-bold text-slate-500 text-xs">%</span>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center text-xs font-sans">
                                    <span className="font-semibold text-slate-600 text-[11px]">Broker Comm (%)</span>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={brokerCommPct}
                                            onChange={(e) => setBrokerCommPct(Math.max(0, parseFloat(e.target.value) || 0))}
                                            className="w-12 h-6 text-right font-mono font-bold bg-white border border-slate-350 rounded px-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                        <span className="font-bold text-slate-500 text-xs">%</span>
                                    </div>
                                </div>

                                <table className="w-full border-collapse border-t border-slate-100 mt-0.5 text-xs font-mono">
                                    <tbody>
                                        <tr className="border-b border-slate-100">
                                            <td className="py-0.5 pl-1 text-slate-500 text-[10.5px]">Address (USD)</td>
                                            <td className="text-right py-0.5 pr-1 font-bold">
                                                {fmtCur(revenue * (addressCommPct / 100))}
                                            </td>
                                        </tr>
                                        <tr className="border-b border-slate-100">
                                            <td className="py-0.5 pl-1 text-slate-500 text-[10.5px]">Broker (USD)</td>
                                            <td className="text-right py-0.5 pr-1 font-bold">
                                                {fmtCur(revenue * (brokerCommPct / 100))}
                                            </td>
                                        </tr>
                                        <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                            <td className="py-0.5 pl-1 font-sans text-[10px] uppercase">Total Comm</td>
                                            <td className="text-right py-0.5 pr-1 text-rose-600 font-bold">
                                                {totalCommUsd > 0 ? `-${fmtCur(totalCommUsd)}` : '$0'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>

                {/* FILA INFERIOR: COMMENTS + BAF + DEMURRAGE (3 CARDS ALINEADAS DE 1 COLUMNA) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 items-stretch">
                    
                    {/* CARD 1: COMMENTS (DEBAJO DE BUNKER) */}
                    <div className="col-span-1 bg-white border border-slate-350 rounded p-2 shadow-sm flex flex-col flex-1 h-full">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1.5 font-sans flex items-center justify-between">
                            <span>Comments (Observaciones)</span>
                            <span className="text-[9.5px] font-mono text-slate-400 font-normal">Notas comerciales</span>
                        </h3>
                        <textarea
                            value={commentsText}
                            onChange={(e) => setCommentsText(e.target.value)}
                            placeholder="Ingrese comentarios u observaciones de la cotización..."
                            className="w-full flex-1 p-2 text-xs font-sans bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 resize-none min-h-[60px]"
                        />
                    </div>

                    {/* CARD 2: BAF (DEBAJO DE PORT COSTS) */}
                    <div className="col-span-1 bg-white border border-slate-350 rounded p-2 shadow-sm flex flex-col justify-between flex-1 h-full">
                        <div>
                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1.5 font-sans flex items-center justify-between">
                                <span>BAF (Bunker Adjustment Factor)</span>
                                <span className="text-[9.5px] font-mono text-blue-600 font-bold">Fórmula & Base</span>
                            </h3>
                            <div className="flex flex-col gap-1.5 text-xs font-sans pt-0.5">
                                <div>
                                    <label className="text-[9.5px] font-bold text-slate-500 uppercase block mb-0.5">🧮 Fórmula BAF:</label>
                                    <input
                                        type="text"
                                        value={bafFormula || ''}
                                        onChange={(e) => setBafFormula && setBafFormula(e.target.value)}
                                        placeholder="Ingrese fórmula..."
                                        className="w-full h-6 text-xs font-mono font-semibold bg-slate-50 border border-slate-300 rounded px-1.5 text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <div>
                                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5 truncate">📅 Inicio Validez:</label>
                                        <input
                                            type="date"
                                            value={bafValidFrom || ''}
                                            onChange={(e) => setBafValidFrom && setBafValidFrom(e.target.value)}
                                            className="w-full h-6 text-[10.5px] font-mono font-bold bg-white border border-slate-300 rounded px-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5 truncate">📅 Fin Validez:</label>
                                        <input
                                            type="date"
                                            value={bafValidTo || ''}
                                            onChange={(e) => setBafValidTo && setBafValidTo(e.target.value)}
                                            className="w-full h-6 text-[10.5px] font-mono font-bold bg-white border border-slate-300 rounded px-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                    <div>
                                        <label className="text-[9px] font-bold text-slate-500 uppercase block truncate">IFO Base ($/T):</label>
                                        <input
                                            type="number"
                                            value={bafIfoBase || ''}
                                            onChange={(e) => setBafIfoBase && setBafIfoBase(parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                            className="w-full h-6 text-right font-mono font-bold bg-white border border-slate-350 rounded px-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-slate-500 uppercase block truncate">MDO Base ($/T):</label>
                                        <input
                                            type="number"
                                            value={bafMdoBase || ''}
                                            onChange={(e) => setBafMdoBase && setBafMdoBase(parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                            className="w-full h-6 text-right font-mono font-bold bg-white border border-slate-350 rounded px-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA 3 (DEBAJO DE COMISIONES): 2 CARDS SEPARADAS (DEMURRAGE ARRIBA, BANDAS TARIFARIAS ABAJO) */}
                    <div className="col-span-1 flex flex-col gap-2 justify-between flex-1 h-full">
                        
                        {/* CARD 3A: DEMURRAGE (ESTADÍAS POR BUQUE - CARD INDEPENDIENTE ARRIBA) */}
                        <div className="bg-white border border-slate-350 rounded p-2 shadow-sm flex flex-col justify-between">
                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1 font-sans flex items-center justify-between">
                                <span>Demurrage (Estadías por Buque)</span>
                                <span className="text-[9.5px] font-mono text-amber-600 font-bold">$ / día</span>
                            </h3>
                            <div className="grid grid-cols-4 gap-1 pt-0.5">
                                {(() => {
                                    const vesselList = (vessels && vessels.length > 0)
                                        ? vessels.slice(0, 4).map(v => v.vessel_name || v.name || v.vessel_id || 'BUQUE')
                                        : ['HUEMUL', 'MOQUEGUA', 'TABLONES', 'CONCON TRADER'];
                                    
                                    const cleanVesselName = (vName: string) => {
                                        return vName.replace(/^(B\/T|M\/T|M\/V)\s+/i, '').trim();
                                    };

                                    const getDemurrageRate = (map: Record<string, number> | undefined, name: string): number => {
                                        if (!map) return 0;
                                        const clean = cleanVesselName(name);
                                        const short = clean.split(' ')[0];
                                        if (map[name] !== undefined) return map[name];
                                        if (map[clean] !== undefined) return map[clean];
                                        if (map[short] !== undefined) return map[short];
                                        for (const [k, v] of Object.entries(map)) {
                                            const kClean = cleanVesselName(k);
                                            if (k.toUpperCase() === name.toUpperCase() || kClean.toUpperCase() === clean.toUpperCase() || kClean.toUpperCase().startsWith(short.toUpperCase())) {
                                                return v;
                                            }
                                        }
                                        return 0;
                                    };
                                    
                                    return vesselList.map((vName, idx) => {
                                        const clean = cleanVesselName(vName);
                                        const currentVal = getDemurrageRate(demurrageRatesMap, vName);
                                        return (
                                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-1 flex flex-col justify-between text-center">
                                                <span className="text-[8.5px] font-bold text-slate-600 truncate border-b border-slate-200 pb-0.5 mb-0.5 block" title={vName}>
                                                    🚢 {clean.split(' ')[0]}
                                                </span>
                                                <div className="flex items-center justify-center gap-0.5">
                                                    <span className="text-[9px] font-bold text-amber-700">$</span>
                                                    <input
                                                        type="text"
                                                        value={currentVal ? Number(currentVal).toLocaleString('en-US') : ''}
                                                        onChange={(e) => {
                                                            const rawVal = e.target.value.replace(/,/g, '');
                                                            const val = parseFloat(rawVal) || 0;
                                                            const short = clean.split(' ')[0];
                                                            if (setDemurrageRatesMap) {
                                                                setDemurrageRatesMap({
                                                                    ...(demurrageRatesMap || {}),
                                                                    [vName]: val,
                                                                    [clean]: val,
                                                                    [short]: val
                                                                });
                                                            }
                                                            if (setDemurrageRate && idx === 0) {
                                                                setDemurrageRate(val);
                                                            }
                                                        }}
                                                        placeholder="0"
                                                        className="w-full h-5 text-center font-mono font-bold bg-white border border-slate-300 rounded text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* CARD 3B: BANDAS TARIFARIAS POR VOLUMEN (CARD INDEPENDIENTE ABAJO - 4 BANDAS EN 1 FILA) */}
                        <div className="bg-white border border-slate-350 rounded p-2 shadow-sm flex flex-col justify-between">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1 font-sans flex items-center justify-between">
                                <span>Bandas Tarifarias por Volumen ($/MT)</span>
                                <span className="text-[9px] font-mono text-emerald-600 font-bold">4 Bandas</span>
                            </h3>
                            <div className="grid grid-cols-4 gap-1 pt-0.5">
                                {[0, 1, 2, 3].map((idx) => {
                                    const tier = (tariffTiers && tariffTiers[idx]) || { label: '', rate: 0 };
                                    return (
                                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-1 flex flex-col justify-between text-center">
                                            <input
                                                type="text"
                                                value={tier.label || ''}
                                                onChange={(e) => {
                                                    if (!setTariffTiers) return;
                                                    const next = [...(tariffTiers || [{ label: '', rate: 0 }, { label: '', rate: 0 }, { label: '', rate: 0 }, { label: '', rate: 0 }])];
                                                    next[idx] = { ...next[idx], label: e.target.value };
                                                    setTariffTiers(next);
                                                }}
                                                placeholder={idx === 0 ? "10k-11.5k" : idx === 1 ? "11.5k-13k" : idx === 2 ? "13k-13.5k" : "13.6k-14.5k"}
                                                className="w-full text-[8.5px] font-bold text-slate-600 bg-transparent text-center focus:outline-none truncate border-b border-slate-200 pb-0.5 mb-0.5"
                                            />
                                            <div className="flex items-center justify-center gap-0.5">
                                                <span className="text-[9px] font-bold text-emerald-700">$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={tier.rate || ''}
                                                    onChange={(e) => {
                                                        if (!setTariffTiers) return;
                                                        const next = [...(tariffTiers || [{ label: '', rate: 0 }, { label: '', rate: 0 }, { label: '', rate: 0 }, { label: '', rate: 0 }])];
                                                        next[idx] = { ...next[idx], rate: parseFloat(e.target.value) || 0 };
                                                        setTariffTiers(next);
                                                    }}
                                                    placeholder="0.00"
                                                    className="w-full h-5 text-center font-mono font-bold bg-white border border-slate-300 rounded text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                </div>

            </div>

            {/* COLUMNA 4: FINANCIAL VOYAGE RESULT (PANEL LATERAL DERECHO) */}
            <div className="col-span-1 bg-emerald-50 border-2 border-emerald-500/30 rounded p-2 shadow-sm flex flex-col justify-between h-full">
                <div>
                    <h3 className="text-[11.5px] font-black text-emerald-800 uppercase tracking-wide border-b border-emerald-200 pb-1 mb-1.5 flex items-center justify-between font-sans">
                        <span>FINANCIAL VOYAGE RESULT</span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200 uppercase">P/L & TCE</span>
                    </h3>
                    <table className="w-full border-collapse text-xs font-mono">
                        <tbody>
                            {/* 1. Revenue */}
                            <tr className="border-b border-emerald-200/80 bg-emerald-100/40">
                                <td className="py-1 pl-1 text-slate-900 font-sans text-[11px] font-extrabold uppercase">
                                    {(() => {
                                        const activeQty = Number(puertosConfig.find(p => (p.action === 'DESCARGAR' || p.action === 'CARGAR') && Number(p.quantity) > 0)?.quantity || 0);
                                        const activeRate = Number(puertosConfig.find(p => (p.action === 'DESCARGAR' || p.action === 'CARGAR') && Number(p.freight_rate) > 0)?.freight_rate || 0);
                                        return `Revenue (${fmtThousandSep(activeQty)} MT × ${fmtCur(activeRate)}/MT)`;
                                    })()}
                                </td>
                                <td className="text-right py-1 pr-1 font-black text-emerald-950 text-xs">
                                    {fmtCur(revenue)}
                                </td>
                            </tr>

                            {/* 1.b Refacturación de Muellaje (al cliente) */}
                            {refacturacionMuellajeUsd > 0 && (
                                <tr className="border-b border-emerald-100/40 bg-emerald-50/60">
                                    <td className="py-0.5 pl-3 text-emerald-800 font-sans text-[9.5px] font-semibold italic">
                                        (+) Refacturación Muellaje (al cliente)
                                    </td>
                                    <td className="text-right py-0.5 pr-1 font-mono text-[9.5px] text-emerald-800 font-bold">
                                        +{fmtCur(refacturacionMuellajeUsd)}
                                    </td>
                                </tr>
                            )}

                            {/* 2. Hire */}
                            <tr className="border-b border-emerald-100/60">
                                <td className="py-0.5 pl-3 text-slate-600 font-sans text-[10.5px]">
                                    (-) Hire ({fmtCur(tceReq)}/d × {fmtDays(totalDays)} d)
                                </td>
                                <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                    -{fmtCur(hireUsd)}
                                </td>
                            </tr>

                            {/* 3. Bunker IFO */}
                            <tr className="border-b border-emerald-100/60">
                                <td className="py-0.5 pl-3 text-slate-600 font-sans text-[10.5px]">
                                    (-) Bunker IFO ({fmtNum(ifoT)} T × {fmtCur(bunkerPriceIfo)}/T)
                                </td>
                                <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                    -{fmtCur(ifoCost)}
                                </td>
                            </tr>

                            {/* 4. Bunker MDO */}
                            <tr className="border-b border-emerald-100/60">
                                <td className="py-0.5 pl-3 text-slate-600 font-sans text-[10.5px]">
                                    (-) Bunker MDO ({fmtNum(mdoT)} T × {fmtCur(bunkerPriceMdo)}/T)
                                </td>
                                <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                    -{fmtCur(mdoCost)}
                                </td>
                            </tr>

                            {/* 5. Port Costs dinámicos */}
                            {(() => {
                                const portItems = getDynamicPortCostItems();

                                return (
                                    <>
                                        {portItems.map((item, idx) => {
                                            const isChile = CHILEAN_PORTS.includes((item.port_id || '').toUpperCase());
                                            const lmCost = (isChile && item.cost >= 2500) ? 2500 : 0;
                                            const mValPort = Number(item.muellaje_cost || 0);
                                            const baseAgencyCost = Math.max(0, item.cost - lmCost - mValPort);

                                            if (baseAgencyCost < 1 && lmCost < 1 && mValPort < 1) return null;

                                            const theme = PORT_THEMES[idx % PORT_THEMES.length];

                                            return (
                                                <React.Fragment key={idx}>
                                                    {baseAgencyCost >= 1 && (
                                                        <tr className={`border-b border-emerald-100/60 ${theme.bg}`}>
                                                            <td className={`py-0.5 pl-3 font-sans text-[10.5px] font-normal ${theme.text}`}>
                                                                (-) Port Costs {item.label}
                                                            </td>
                                                            <td className={`text-right py-0.5 pr-1 font-mono text-[10.5px] font-normal ${theme.text}`}>
                                                                -{fmtCur(baseAgencyCost)}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {lmCost >= 1 && (
                                                        <tr className={`border-b border-emerald-100/60 ${theme.bg}`}>
                                                            <td className={`py-0.5 pl-3 font-sans text-[10.5px] font-normal ${theme.text}`}>
                                                                (-) Loading Master ({item.port_id})
                                                            </td>
                                                            <td className={`text-right py-0.5 pr-1 font-mono text-[10.5px] font-normal ${theme.text}`}>
                                                                -{fmtCur(lmCost)}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {mValPort >= 1 && (
                                                        <tr className={`border-b border-emerald-100/60 ${theme.bg}`}>
                                                            <td className={`py-0.5 pl-3 font-sans text-[10.5px] font-normal ${theme.text}`}>
                                                                (-) Muellaje ({item.port_id})
                                                            </td>
                                                            <td className={`text-right py-0.5 pr-1 font-mono text-[10.5px] font-normal ${theme.text}`}>
                                                                -{fmtCur(mValPort)}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </>
                                );
                            })()}

                            {/* 6. Comisiones */}
                            {(totalCommUsd > 0 || (addressCommPct + brokerCommPct) > 0) && (
                                <tr className="border-b border-emerald-100/60">
                                    <td className="py-0.5 pl-3 text-slate-600 font-sans text-[10.5px]">
                                        (-) Comisiones ({(addressCommPct + brokerCommPct).toFixed(2).replace(/\.00$/, '')}%)
                                    </td>
                                    <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                        -{fmtCur(totalCommUsd)}
                                    </td>
                                </tr>
                            )}

                            {/* VOYAGE RESULT / P&L */}
                            <tr className={`border-t-2 border-emerald-300 font-black ${pnlVal >= 0 ? 'bg-emerald-100/90 text-emerald-950' : 'bg-rose-100/90 text-rose-950'}`}>
                                <td className="py-1 pl-1 font-sans text-xs uppercase">VOYAGE RESULT / P&L</td>
                                <td className="text-right py-1 pr-1 font-mono text-xs">
                                    {fmtCur(pnlVal)}
                                </td>
                            </tr>

                            {/* TCE REALIZADO */}
                            <tr className="border-t border-emerald-200">
                                <td className="py-0.5 pl-1 font-bold text-slate-700 font-sans text-[10.5px]">TCE REALIZADO</td>
                                <td className="text-right py-0.5 pr-1 font-bold text-emerald-900 font-mono text-xs">
                                    {fmtCur(tceReal)}/d
                                </td>
                            </tr>

                            {/* TCE REQUERIDO */}
                            <tr className="border-b border-emerald-100/60 text-slate-500">
                                <td className="py-0.5 pl-1 font-sans text-[10px]">TCE REQUERIDO</td>
                                <td className="text-right py-0.5 pr-1 font-mono text-[10.5px]">
                                    {fmtCur(tceReq)}/d
                                </td>
                            </tr>

                            {/* DIFERENCIA TCE */}
                            <tr className="font-bold border-t border-emerald-200">
                                <td className="py-0.5 pl-1 font-sans text-[10px]">DIFERENCIA TCE (+/-)</td>
                                <td className={`text-right py-0.5 pr-1 font-mono text-[10.5px] ${tceDiff >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                    {tceDiff >= 0 ? `+${fmtCur(tceDiff)}/d` : `-${fmtCur(Math.abs(tceDiff))}/d`}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};
