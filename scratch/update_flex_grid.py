path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '{/* 3. RESUMEN FINANCIERO Y OPERATIVO INFERIOR (4 COLUMNAS PARALELAS Y GRID RESTRUCTURADO) */}'
end_marker = '{/* 6. GRABAR Y EXPORTAR (FUERA DEL GRID - 100% ANCHO COMPLETO UNIFICADO EN 1 SOLA FILA) */}'

s_pos = content.find(start_marker)
e_pos = content.find(end_marker)

if s_pos != -1 and e_pos != -1:
    new_grid_jsx = """{/* 3. RESUMEN FINANCIERO Y OPERATIVO INFERIOR (ESTRUCTURA DE SIMETRÍA Y ALTURA FLEXIBLE) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch flex-shrink-0">
                
                {/* SECCIÓN IZQUIERDA (COLUMNAS 1, 2 Y 3 EN FLEX VERTICAL PARA COINCIDIR ALTURA) */}
                <div className="col-span-1 md:col-span-3 flex flex-col gap-3">
                    
                    {/* FILA SUPERIOR: BUNKER (COL 1), PORT COSTS (COL 2), COMISIONES (COL 3) */}
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
                                            <th className="text-left py-0.5 pl-1.5">Fuel</th>
                                            <th className="text-right py-0.5 pr-1.5">Tonnage (T)</th>
                                            <th className="text-right py-0.5 pr-1.5">Expense (USD)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-slate-100">
                                            <td className="py-1 pl-1.5 text-slate-650 font-bold">IFO (Heavy Fuel)</td>
                                            <td className="text-right py-1 pr-1.5 font-bold">
                                                {result ? fmtNum(result.consolidated.bunker_ifo_tonnage || 0) : '0.0'}
                                            </td>
                                            <td className="text-right py-1 pr-1.5 font-bold">
                                                {result ? fmtCur((result.consolidated.bunker_ifo_tonnage || 0) * bunkerPriceIfo) : '$0'}
                                            </td>
                                        </tr>
                                        <tr className="border-b border-slate-100">
                                            <td className="py-1 pl-1.5 text-slate-650 font-bold">MDO (Diesel)</td>
                                            <td className="text-right py-1 pr-1.5 font-bold">
                                                {result ? fmtNum(result.consolidated.bunker_mdo_tonnage || 0) : '0.0'}
                                            </td>
                                            <td className="text-right py-1 pr-1.5 font-bold">
                                                {result ? fmtCur((result.consolidated.bunker_mdo_tonnage || 0) * bunkerPriceMdo) : '$0'}
                                            </td>
                                        </tr>
                                        <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                            <td className="py-1 pl-1.5 font-sans text-[10.5px] uppercase">Total Fuel</td>
                                            <td className="text-right py-1 pr-1.5">
                                                {result ? fmtNum((result.consolidated.bunker_ifo_tonnage || 0) + (result.consolidated.bunker_mdo_tonnage || 0)) : '0.0'}
                                            </td>
                                            <td className="text-right py-1 pr-1.5 font-bold">
                                                {result ? fmtCur(((result.consolidated.bunker_ifo_tonnage || 0) * bunkerPriceIfo) + ((result.consolidated.bunker_mdo_tonnage || 0) * bunkerPriceMdo)) : '$0'}
                                            </td>
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
                                            const totalPortCosts = result?.consolidated?.total_port_costs ?? portItems.reduce((sum, item) => sum + item.cost, 0);
                                            const chileanPorts = ['MEJILLONES', 'BARQUITO', 'PATILLOS', 'ARICA', 'SAN ANTONIO', 'VALPARAISO', 'QUINTERO'];

                                            return (
                                                <>
                                                    {portItems.map((item, idx) => {
                                                        const isChile = chileanPorts.includes((item.port_id || '').toUpperCase());
                                                        let baseCost = item.cost;
                                                        let lmCost = 0;
                                                        if (isChile && item.cost >= 2500) {
                                                            baseCost = item.cost - 2500;
                                                            lmCost = 2500;
                                                        }
                                                        return (
                                                            <React.Fragment key={idx}>
                                                                <tr className="border-b border-slate-100">
                                                                    <td className="py-1 pl-1.5 text-slate-650 font-bold">{item.label}</td>
                                                                    <td className="text-right py-1 pr-1.5 font-bold">
                                                                        {result || item.cost > 0 ? fmtCur(baseCost) : '$0'}
                                                                    </td>
                                                                </tr>
                                                                {lmCost > 0 && (
                                                                    <tr className="border-b border-slate-100 bg-amber-50/60">
                                                                        <td className="py-0.5 pl-3.5 text-amber-900 font-bold text-[10px]">↳ Loading Master (Chile)</td>
                                                                        <td className="text-right py-0.5 pr-1.5 font-bold text-amber-900 text-[10px]">
                                                                            {fmtCur(lmCost)}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                    <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                                        <td className="py-1.5 pl-1.5 font-sans text-[10.5px] uppercase">Total Port Costs</td>
                                                        <td className="text-right py-1.5 pr-1.5">
                                                            {result || totalPortCosts > 0 ? fmtCur(totalPortCosts) : '$0'}
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
                                                    {result ? fmtCur(result.consolidated.total_freight_revenue * (addressCommPct / 100)) : '$0'}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-slate-100">
                                                <td className="py-0.5 pl-1 text-slate-500 text-[10.5px]">Broker (USD)</td>
                                                <td className="text-right py-0.5 pr-1 font-bold">
                                                    {result ? fmtCur(result.consolidated.total_freight_revenue * (brokerCommPct / 100)) : '$0'}
                                                </td>
                                            </tr>
                                            <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                                <td className="py-0.5 pl-1 font-sans text-[10px] uppercase">Total Comm</td>
                                                <td className="text-right py-0.5 pr-1 text-rose-600 font-bold">
                                                    {result ? `-${fmtCur(result.consolidated.total_commissions || 0)}` : '$0'}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* FILA INFERIOR: COMMENTS (COL 1 Y 2) + DEMURRAGE (COL 3) - FLEX GROW PARA IGUALAR ALTURA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 items-stretch">
                        
                        {/* COMMENTS (Ocupa Columna 1 y Columna 2 -> col-span-2) */}
                        <div className="col-span-1 md:col-span-2 bg-white border border-slate-350 rounded p-2 shadow-sm flex flex-col flex-1 h-full">
                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1.5 font-sans flex items-center justify-between">
                                <span>Comments (Observaciones del Viaje)</span>
                                <span className="text-[9.5px] font-mono text-slate-400 font-normal">Notas comerciales</span>
                            </h3>
                            <textarea
                                value={commentsText}
                                onChange={(e) => setCommentsText(e.target.value)}
                                placeholder="Ingrese comentarios u observaciones de la cotización..."
                                className="w-full flex-1 p-2 text-xs font-sans bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 resize-none min-h-[60px]"
                            />
                        </div>

                        {/* DEMURRAGE (Ocupa Columna 3 -> col-span-1 | Solo Rate $/día) */}
                        <div className="col-span-1 bg-white border border-slate-350 rounded p-2 shadow-sm flex flex-col justify-between flex-1 h-full">
                            <div>
                                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1.5 flex items-center justify-between font-sans">
                                    <span>Demurrage (Estadías)</span>
                                    <span className="text-[9.5px] font-mono text-slate-400">$ / día</span>
                                </h3>
                                <div className="flex flex-col gap-2 text-xs font-sans pt-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-slate-600 text-[11px]">Rate ($/día)</span>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                value={demurrageRate || ''}
                                                onChange={(e) => setDemurrageRate(parseFloat(e.target.value) || 0)}
                                                placeholder="15,000"
                                                className="w-24 h-7 text-right font-mono font-bold bg-white border border-slate-350 rounded px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                            />
                                            <span className="font-mono text-xs text-slate-400">$</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                                        * Días de estadía se integran al jalar el payload desde Matriz Financiera.
                                    </p>
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
                                {(() => {
                                    const Q = Number(puertosConfig[1]?.quantity || tramos[0]?.quantity || 0);
                                    const F = Number(puertosConfig[1]?.freight_rate || tramos[0]?.freight_rate || 0);
                                    const totalDays = result?.consolidated?.total_days || 0;
                                    const tceReq = result?.consolidated?.tce_required || Number(vesselParams.tce_required) || 0;
                                    const hireUsd = tceReq * totalDays;

                                    const ifoTons = result?.consolidated?.bunker_ifo_tonnage || 0;
                                    const mdoTons = result?.consolidated?.bunker_mdo_tonnage || 0;
                                    const ifoUsd = ifoTons * bunkerPriceIfo;
                                    const mdoUsd = mdoTons * bunkerPriceMdo;

                                    const portItems = getDynamicPortCostItems();
                                    const totalPortCosts = result?.consolidated?.total_port_costs ?? portItems.reduce((sum, item) => sum + item.cost, 0);

                                    const revenue = result?.consolidated?.total_freight_revenue || (Q * F);
                                    const refacturacionMuellajeUsd = result?.consolidated?.refacturacion_muellaje || 0;
                                    const addressCommUsd = revenue * (addressCommPct / 100);
                                    const brokerCommUsd = revenue * (brokerCommPct / 100);
                                    const totalCommUsd = result?.consolidated?.total_commissions || (addressCommUsd + brokerCommUsd);

                                    const tceReal = result?.consolidated?.tce_real || 0;
                                    const tceDiff = tceReal - tceReq;

                                    return (
                                        <>
                                            {/* 1. Revenue */}
                                            <tr className="border-b border-emerald-100/60">
                                                <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                    Revenue ({fmtThousandSep(Q)} MT × {fmtCur(F)}/MT)
                                                </td>
                                                <td className="text-right py-0.5 pr-1 font-bold text-slate-800">
                                                    {fmtCur(revenue)}
                                                </td>
                                            </tr>

                                            {/* 1.b Refacturación de Muellaje */}
                                            {refacturacionMuellajeUsd > 0 && (
                                                <tr className="border-b border-emerald-100/60 bg-emerald-100/30">
                                                    <td className="py-0.5 pl-1 text-emerald-900 font-sans text-[10.5px] font-bold">
                                                        (+) Refacturación Muellaje (USD)
                                                    </td>
                                                    <td className="text-right py-0.5 pr-1 font-bold text-emerald-800">
                                                        +{fmtCur(refacturacionMuellajeUsd)}
                                                    </td>
                                                </tr>
                                            )}

                                            {/* 2. Hire */}
                                            <tr className="border-b border-emerald-100/60">
                                                <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                    (-) Hire ({fmtCur(tceReq)}/d × {fmtDays(totalDays)} d)
                                                </td>
                                                <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                    -{fmtCur(hireUsd)}
                                                </td>
                                            </tr>

                                            {/* 3. Bunker IFO */}
                                            <tr className="border-b border-emerald-100/60">
                                                <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                    (-) Bunker IFO ({fmtNum(ifoTons)} T × {fmtCur(bunkerPriceIfo)}/T)
                                                </td>
                                                <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                    -{fmtCur(ifoUsd)}
                                                </td>
                                            </tr>

                                            {/* 4. Bunker MDO */}
                                            <tr className="border-b border-emerald-100/60">
                                                <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                    (-) Bunker MDO ({fmtNum(mdoTons)} T × {fmtCur(bunkerPriceMdo)}/T)
                                                </td>
                                                <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                    -{fmtCur(mdoUsd)}
                                                </td>
                                            </tr>

                                            {/* 5. Port Costs dinámicos */}
                                            {portItems.map((item, idx) => (
                                                <tr key={idx} className="border-b border-emerald-100/60">
                                                    <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                        (-) Port Costs {item.label}
                                                    </td>
                                                    <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                        -{fmtCur(item.cost)}
                                                    </td>
                                                </tr>
                                            ))}

                                            {/* 6. Comisiones */}
                                            {(totalCommUsd > 0 || (addressCommPct + brokerCommPct) > 0) && (
                                                <tr className="border-b border-emerald-100/60">
                                                    <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                        (-) Comisiones ({(addressCommPct + brokerCommPct).toFixed(2).replace(/\.00$/, '')}%)
                                                    </td>
                                                    <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                        -{fmtCur(totalCommUsd)}
                                                    </td>
                                                </tr>
                                            )}

                                            {/* VOYAGE RESULT / P&L */}
                                            {(() => {
                                                const voyageResultPnl = revenue - hireUsd - ifoUsd - mdoUsd - totalPortCosts - totalCommUsd;
                                                return (
                                                    <tr className="bg-emerald-100/60 font-bold border-t-2 border-b-2 border-emerald-400">
                                                        <td className="py-1 pl-1 text-emerald-950 font-sans text-[11px] font-black uppercase">
                                                            VOYAGE RESULT / P&L
                                                        </td>
                                                        <td className={`text-right py-1 pr-1 font-black text-sm ${voyageResultPnl >= 0 ? 'text-emerald-800' : 'text-rose-600'}`}>
                                                            {fmtCur(voyageResultPnl)}
                                                        </td>
                                                    </tr>
                                                );
                                            })()}

                                            {/* BLOQUE INFERIOR DE KPIS TCE */}
                                            <tr className="border-b border-emerald-100/60 pt-1">
                                                <td className="py-0.5 pl-1 text-slate-700 font-sans text-[10.5px] uppercase font-bold">
                                                    TCE Realizado
                                                </td>
                                                <td className="text-right py-0.5 pr-1 font-bold text-slate-900">
                                                    {fmtCur(tceReal)}/d
                                                </td>
                                            </tr>
                                            <tr className="border-b border-emerald-100/60">
                                                <td className="py-0.5 pl-1 text-slate-500 font-sans text-[10.5px] uppercase">
                                                    TCE Requerido
                                                </td>
                                                <td className="text-right py-0.5 pr-1 text-slate-600 font-medium">
                                                    {fmtCur(tceReq)}/d
                                                </td>
                                            </tr>
                                            <tr className="border-b border-emerald-200">
                                                <td className="py-0.5 pl-1 text-slate-700 font-sans text-[10.5px] uppercase font-bold">
                                                    Diferencia TCE (+/-)
                                                </td>
                                                <td className={`text-right py-0.5 pr-1 font-black text-xs ${tceDiff >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                                    {tceDiff >= 0 ? '+' : ''}{fmtCur(tceDiff)}/d
                                                </td>
                                            </tr>
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
            
            """

    content = content[:s_pos] + new_grid_jsx + content[e_pos:]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESSFULLY UPDATED FLEX GRID LAYOUT")
else:
    print(f"FAILED TO FIND MARKERS s_pos={s_pos}, e_pos={e_pos}")
