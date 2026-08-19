import React from 'react';

export interface SpreadsheetTramosGridProps {
    tramos: any[];
    puertosConfig: any[];
    ports: any[];
    vessels: any[];
    selectedVessel: string;
    bunkerPriceIfo: number;
    bunkerPriceMdo: number;
    vesselParams: any;
    result: any;
    refacturarMuellajeMap: Record<number, boolean>;
    calculatedTramosList: any[];
    handleAddTramo: () => void;
    handleRemoveLastTramo: () => void;
    updateTramoField: (index: number, field: any, value: any) => void;
    updatePuertoConfigField: (index: number, field: any, value: any) => void;
    setRefacturarMuellajeMap: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    getAutoPortRate: (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => number | string;
    getAutoPortTimeToCount?: (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => number | string;
    getAutoPortPositioning?: (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => number | string;
    fmtCur: (val: number | string | undefined | null) => string;
    fmtNum: (val: number | string | undefined | null) => string;
    fmtDays: (val: number | string | undefined | null) => string;
    fmtThousandSep: (val: number | string | undefined | null) => string;
}

export const SpreadsheetTramosGrid: React.FC<SpreadsheetTramosGridProps> = ({
    tramos,
    puertosConfig,
    ports,
    vessels,
    selectedVessel,
    bunkerPriceIfo,
    bunkerPriceMdo,
    vesselParams,
    result,
    refacturarMuellajeMap,
    calculatedTramosList,
    handleAddTramo,
    handleRemoveLastTramo,
    updateTramoField,
    updatePuertoConfigField,
    setRefacturarMuellajeMap,
    getAutoPortRate,
    fmtCur,
    fmtNum,
    fmtDays,
    fmtThousandSep
}) => {
    // Calculo de total descargas
    const totalDescargas = puertosConfig.reduce((sum, p) => sum + (p.action === 'DESCARGAR' ? (Number(p.quantity) || 0) : 0), 0);

    const selectedVesselObj = vessels.find(v => v.vessel_id === selectedVessel);
    const ifoSeaRatio = Number(vesselParams?.consumption_sea_ifo || selectedVesselObj?.consumption_sea_ifo || 0);
    const mdoSeaRatio = Number(vesselParams?.consumption_sea_mdo || selectedVesselObj?.consumption_sea_mdo || 0);
    const ifoIdleRatio = Number(vesselParams?.consumption_idle_ifo || selectedVesselObj?.consumption_idle_ifo || 0);
    const mdoIdleRatio = Number(vesselParams?.consumption_idle_mdo || selectedVesselObj?.consumption_idle_mdo || 0);
    const ifoLoadRatio = Number(vesselParams?.consumption_load_ifo || selectedVesselObj?.consumption_load_ifo || ifoIdleRatio);
    const mdoLoadRatio = Number(vesselParams?.consumption_load_mdo || selectedVesselObj?.consumption_load_mdo || mdoIdleRatio);
    const ifoDischRatio = Number(vesselParams?.consumption_disch_ifo || selectedVesselObj?.consumption_disch_ifo || 0);
    const mdoDischRatio = Number(vesselParams?.consumption_disch_mdo || selectedVesselObj?.consumption_disch_mdo || mdoIdleRatio);

    // Calculo Fila 0 (Puerto de Origen / POL)
    const pCfg0 = puertosConfig[0] || {};
    const qVal0 = Number(pCfg0.quantity || 0);
    const rDefault0 = pCfg0.action === 'DESCARGAR' ? 450 : 500;
    const rVal0 = Math.max(1, Number(pCfg0.op_rate || rDefault0));
    const rUnit0 = pCfg0.rate_unit || 'TH';
    const rateFactor0 = rUnit0 === 'TD' ? 1 : 24;
    const tcVal0 = Number(pCfg0.time_to_count !== undefined && pCfg0.time_to_count !== '' ? pCfg0.time_to_count : (pCfg0.overhead !== undefined && pCfg0.overhead !== '' ? pCfg0.overhead : 6.0));
    const posVal0 = Number(pCfg0.positioning !== undefined && pCfg0.positioning !== '' ? pCfg0.positioning : (pCfg0.action === 'CARGAR' ? 1.0 : 0.0));
    const idleDays0 = pCfg0.action !== 'NONE' ? ((tcVal0 + posVal0) / 24) : 0;
    const opDays0 = pCfg0.action !== 'NONE' ? ((qVal0 / rVal0) / rateFactor0) : 0;
    const calcPortDays0 = idleDays0 + opDays0;

    const opIfoRate0 = pCfg0.action === 'DESCARGAR' ? ifoDischRatio : pCfg0.action === 'CARGAR' ? ifoLoadRatio : ifoIdleRatio;
    const opMdoRate0 = pCfg0.action === 'DESCARGAR' ? mdoDischRatio : pCfg0.action === 'CARGAR' ? mdoLoadRatio : mdoIdleRatio;
    const ifoTons0 = (idleDays0 * ifoIdleRatio) + (opDays0 * opIfoRate0);
    const mdoTons0 = (idleDays0 * mdoIdleRatio) + (opDays0 * opMdoRate0);
    const liveBunkerCost0 = (ifoTons0 * (bunkerPriceIfo || 0)) + (mdoTons0 * (bunkerPriceMdo || 0));

    // Array de costos live de búnker por tramo 1..N
    const liveBunkerCosts = tramos.map((tr, idx) => {
        const distVal = Number(tr.route_distance || 0);
        const rawWf = Number(tr.weather_factor || 0);
        const wfPct = rawWf > 1 ? rawWf : (rawWf * 100);
        const speedVal = Math.max(1, Number(tr.speed || selectedVesselObj?.vessel_speed || vesselParams?.vessel_speed || 11));
        const calcSeaDays = distVal > 0 ? (distVal * (1 + (wfPct / 100))) / (speedVal * 24) : 0;

        const pCfg = puertosConfig[idx + 1] || {};
        const qVal = Number(pCfg.quantity || 0);
        const rDefault = pCfg.action === 'DESCARGAR' ? 450 : 500;
        const rVal = Math.max(1, Number(pCfg.op_rate || rDefault));
        const rUnit = pCfg.rate_unit || 'TH';
        const rateFactor = rUnit === 'TD' ? 1 : 24;
        const tcVal = Number(pCfg.time_to_count !== undefined && pCfg.time_to_count !== '' ? pCfg.time_to_count : (pCfg.overhead !== undefined && pCfg.overhead !== '' ? pCfg.overhead : 6.0));
        const posVal = Number(pCfg.positioning !== undefined && pCfg.positioning !== '' ? pCfg.positioning : (pCfg.action === 'CARGAR' ? 1.0 : 0.0));

        const idleDays = pCfg.action !== 'NONE' ? ((tcVal + posVal) / 24) : 0;
        const opDays = pCfg.action !== 'NONE' ? ((qVal / rVal) / rateFactor) : 0;

        const opIfoRate = pCfg.action === 'DESCARGAR' ? ifoDischRatio : pCfg.action === 'CARGAR' ? ifoLoadRatio : ifoIdleRatio;
        const opMdoRate = pCfg.action === 'DESCARGAR' ? mdoDischRatio : pCfg.action === 'CARGAR' ? mdoLoadRatio : mdoIdleRatio;

        const ifoTons = (calcSeaDays * ifoSeaRatio) + (idleDays * ifoIdleRatio) + (opDays * opIfoRate);
        const mdoTons = (calcSeaDays * mdoSeaRatio) + (idleDays * mdoIdleRatio) + (opDays * opMdoRate);
        return (ifoTons * (bunkerPriceIfo || 0)) + (mdoTons * (bunkerPriceMdo || 0));
    });

    const sumLiveBunkerCosts = liveBunkerCost0 + liveBunkerCosts.reduce((a, b) => a + b, 0);

    return (
        <div className="overflow-x-auto border border-slate-300 rounded bg-white shadow-sm flex flex-col mb-1">
            <table className="w-full border-collapse text-[12px] font-mono table-fixed select-text">
                <colgroup>
                    <col style={{ width: '4.1%' }} />
                    <col style={{ width: '4%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '4.5%' }} />
                    <col style={{ width: '3.5%' }} />
                    <col style={{ width: '4%' }} />
                    <col style={{ width: '4.5%' }} />
                    <col style={{ width: '4.5%' }} />
                    <col style={{ width: '6.9%' }} />
                    <col style={{ width: '5%' }} />
                    <col style={{ width: '6.5%' }} />
                    <col style={{ width: '6.4%' }} />
                    <col style={{ width: '5.6%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '5.5%' }} />
                    <col style={{ width: '5.5%' }} />
                    <col style={{ width: '4.5%' }} />
                    <col style={{ width: '3.0%' }} />
                </colgroup>

                <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 h-5 select-none font-sans text-[10px] uppercase tracking-wider">
                        <th rowSpan={2} className="border-r border-slate-300 text-center p-0.5">
                            <div className="flex items-center justify-center gap-0.5">
                                <span className="font-black text-[10px] text-slate-800 uppercase">LEG</span>
                                <button
                                    onClick={handleAddTramo}
                                    className="w-4 h-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] flex items-center justify-center shadow-sm cursor-pointer"
                                    title="Agregar Tramo (+)"
                                >
                                    +
                                </button>
                                <button
                                    onClick={handleRemoveLastTramo}
                                    disabled={tramos.length <= 2}
                                    className="w-4 h-4 rounded bg-red-600 hover:bg-red-700 text-white font-black text-[11px] flex items-center justify-center shadow-sm disabled:opacity-30 cursor-pointer"
                                    title="Borrar Tramo (-)"
                                >
                                    -
                                </button>
                            </div>
                        </th>
                        <th rowSpan={2} className="border-r border-slate-300 text-center">Tipo</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-left pl-2">Puerto</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Dist (NM)</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">W.F (%)</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Vel (kn)</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Días Mar</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Días Pto</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Time to Count (H)</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Posic (h)</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-center">Op. Dest</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Ritmo (C/D)</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Q (MT)</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">F ($/t)</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Costo Pto</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Flete ($)</th>
                        <th rowSpan={2} className="border-r border-slate-300 text-right pr-2">Bunker ($)</th>
                        <th colSpan={2} className="border-r border-slate-300 text-center p-0.5 font-black bg-blue-100/80 text-blue-950 border-b border-blue-200" title="Muellaje (Cifra y Refacturación)">MUELLAJE</th>
                    </tr>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 h-4 select-none font-sans text-[9px] uppercase tracking-wider">
                        <th className="border-r border-slate-300 text-right pr-2 bg-slate-100 text-slate-700" title="Monto USD de Muellaje">MUELLAJE</th>
                        <th className="border-r border-slate-300 text-center bg-blue-50/80 text-blue-900 font-black" title="Refacturar Muellaje al Cliente">RF</th>
                    </tr>
                </thead>

                <tbody>
                    {/* FILA 0: PUERTO ORIGEN INICIAL */}
                    <tr className="border-b border-slate-200 bg-slate-50/80 h-8 font-bold">
                        <td className="border-r border-slate-200 text-center text-slate-400 select-none font-sans text-xs">—</td>
                        <td className="border-r border-slate-200 text-center text-slate-400 select-none font-sans text-xs">—</td>
                        <td className="border-r border-slate-200 p-0">
                            <select
                                value={tramos[0]?.origin_port_id || ''}
                                onChange={(e) => updateTramoField(0, 'origin_port_id', e.target.value)}
                                className="w-full h-full bg-white border-0 px-1 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 text-[11.5px] cursor-pointer"
                            >
                                <option value="">Seleccione puerto...</option>
                                {ports.map((p) => (
                                    <option key={p.port_id} value={p.port_id}>
                                        {p.port_id}
                                    </option>
                                ))}
                            </select>
                        </td>
                        <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>
                        <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>
                        <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>
                        <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>
                        <td className="border-r border-slate-200 text-right pr-2 text-slate-500 bg-slate-50/50 font-bold select-none">
                            {puertosConfig[0]?.action !== 'NONE' ? fmtDays(calcPortDays0) : '0.00'}
                        </td>

                        {/* Fila 0 Time to Count */}
                        <td className="border-r border-slate-200 p-0 text-right">
                            {puertosConfig[0]?.action !== 'NONE' ? (
                                <input
                                    type="number"
                                    value={puertosConfig[0]?.time_to_count !== undefined && puertosConfig[0]?.time_to_count !== null ? puertosConfig[0]?.time_to_count : (puertosConfig[0]?.overhead ?? '')}
                                    onChange={(e) => {
                                        updatePuertoConfigField(0, 'time_to_count', e.target.value);
                                        updatePuertoConfigField(0, 'overhead', e.target.value);
                                    }}
                                    className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder={result?.tramos?.[0]?.time_to_count_carga_hrs !== undefined ? String(result.tramos[0].time_to_count_carga_hrs) : '6.0'}
                                />
                            ) : (
                                <span className="text-slate-350 select-none pr-2">—</span>
                            )}
                        </td>

                        {/* Fila 0 Posicionamiento */}
                        <td className="border-r border-slate-200 p-0 text-right">
                            {puertosConfig[0]?.action !== 'NONE' ? (
                                <input
                                    type="number"
                                    value={puertosConfig[0]?.positioning ?? ''}
                                    onChange={(e) => updatePuertoConfigField(0, 'positioning', e.target.value)}
                                    className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder={result?.tramos?.[0]?.positioning_carga_hrs !== undefined ? String(result.tramos[0].positioning_carga_hrs) : (puertosConfig[0]?.action === 'CARGAR' ? '1.0' : '0.0')}
                                />
                            ) : (
                                <span className="text-slate-350 select-none pr-2">—</span>
                            )}
                        </td>

                        {/* Fila 0 Accion */}
                        <td className="border-r border-slate-200 p-0 text-center">
                            <select
                                value={puertosConfig[0]?.action || 'NONE'}
                                onChange={(e) => updatePuertoConfigField(0, 'action', e.target.value)}
                                className="w-[96%] bg-white border border-indigo-200 hover:border-indigo-400 rounded text-[11.5px] font-bold text-indigo-900 focus:outline-none font-sans text-center h-[26px]"
                            >
                                <option value="NONE">NONE</option>
                                <option value="CARGAR">CARGAR</option>
                                <option value="DESCARGAR">DESCARGAR</option>
                            </select>
                        </td>

                        {/* Fila 0 Ritmo Op */}
                        <td className="border-r border-slate-200 p-0">
                            {puertosConfig[0]?.action !== 'NONE' ? (
                                <div className="flex items-center h-full w-full">
                                    <input
                                        type="number"
                                        value={puertosConfig[0]?.op_rate ?? ''}
                                        onChange={(e) => updatePuertoConfigField(0, 'op_rate', e.target.value)}
                                        className="w-[60%] h-full bg-white border-0 px-1 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs"
                                        placeholder={result?.tramos?.[0]?.contract_agreed_load_rate !== undefined ? String(result.tramos[0].contract_agreed_load_rate) : String(getAutoPortRate(tramos[0]?.origin_port_id || '', puertosConfig[0]?.action) || (puertosConfig[0]?.action === 'DESCARGAR' ? '450' : '500'))}
                                    />
                                    <select
                                        value={puertosConfig[0]?.rate_unit || 'TH'}
                                        onChange={(e) => updatePuertoConfigField(0, 'rate_unit', e.target.value)}
                                        className="w-[40%] h-[22px] text-[9.5px] bg-slate-50 border border-slate-250 rounded font-sans cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 pl-0.5 text-slate-500 font-bold mr-1"
                                    >
                                        <option value="TD">T/d</option>
                                        <option value="TH">T/h</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="text-right pr-2">
                                    <span className="text-slate-350 select-none">—</span>
                                </div>
                            )}
                        </td>

                        <td className="border-r border-slate-200 p-0 text-right">
                            {puertosConfig[0]?.action === 'CARGAR' ? (
                                <input
                                    type="text"
                                    placeholder="Q (MT)"
                                    value={puertosConfig[0]?.quantity !== '' && puertosConfig[0]?.quantity !== undefined ? fmtThousandSep(puertosConfig[0].quantity) : ''}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/,/g, '');
                                        if (/^\d*\.?\d*$/.test(raw)) {
                                            updatePuertoConfigField(0, 'quantity', raw);
                                        }
                                    }}
                                    className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                />
                            ) : (
                                <span className="text-slate-350 select-none pr-2">—</span>
                            )}
                        </td>

                        <td className="border-r border-slate-200 p-0 text-right">
                            {puertosConfig[0]?.action === 'CARGAR' ? (
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="F"
                                    value={puertosConfig[0]?.freight_rate ?? ''}
                                    onChange={(e) => updatePuertoConfigField(0, 'freight_rate', e.target.value)}
                                    className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                />
                            ) : (
                                <span className="text-slate-350 select-none pr-2">—</span>
                            )}
                        </td>

                        <td className="border-r border-slate-200 p-0 text-right">
                            {puertosConfig[0]?.action !== 'NONE' ? (
                                <input
                                    type="text"
                                    value={puertosConfig[0]?.manual_port_cost !== '' && puertosConfig[0]?.manual_port_cost !== undefined ? fmtThousandSep(puertosConfig[0].manual_port_cost) : ''}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                                        if (/^\d*\.?\d*$/.test(raw)) {
                                            updatePuertoConfigField(0, 'manual_port_cost', raw);
                                        }
                                    }}
                                    className={`w-full h-full bg-white border-0 px-1.5 text-right font-mono text-xs focus:outline-none ${
                                        puertosConfig[0]?.manual_port_cost !== '' && puertosConfig[0]?.manual_port_cost !== undefined
                                            ? 'text-blue-800 font-extrabold bg-blue-50/20'
                                            : 'text-slate-500 font-medium'
                                    }`}
                                    placeholder={result?.tramos?.[0]?.agency_costs_origin ? fmtCur(result.tramos[0].agency_costs_origin) : ''}
                                />
                            ) : (
                                <span className="text-slate-350 select-none pr-2">—</span>
                            )}
                        </td>

                        {/* Fila 0 Flete ($) */}
                        <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">$0</td>

                        {/* Fila 0 Bunker ($) */}
                        <td className="border-r border-slate-200 text-right pr-2 font-mono font-bold text-slate-800 bg-amber-50/20 select-none">
                            {puertosConfig[0]?.action !== 'NONE' && liveBunkerCost0 > 0 ? fmtCur(liveBunkerCost0) : '$0'}
                        </td>

                        {/* Fila 0 Muellaje */}
                        <td className="border-r border-slate-200 text-right pr-2 font-mono font-bold text-[11px] bg-slate-50/40">
                            {(() => {
                                const mVal = result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0;
                                if (!mVal || puertosConfig[0]?.action === 'NONE') return <span className="text-slate-350 select-none pr-1">—</span>;
                                return (
                                    <span className={refacturarMuellajeMap[0] !== false ? 'text-blue-900 font-extrabold' : 'text-slate-400 line-through'}>
                                        {fmtCur(mVal)}
                                    </span>
                                );
                            })()}
                        </td>
                        <td className="border-r border-slate-300 text-center p-0 bg-slate-50/40">
                            {puertosConfig[0]?.action !== 'NONE' && (result?.tramos?.[0]?.muellaje_cost_origin || puertosConfig[0]?.muellaje_cost) ? (
                                <input
                                    type="checkbox"
                                    checked={refacturarMuellajeMap[0] ?? true}
                                    onChange={(e) => setRefacturarMuellajeMap(prev => ({ ...prev, 0: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                    title="Refacturar Muellaje al cliente"
                                />
                            ) : (
                                <span className="text-slate-350 select-none">—</span>
                            )}
                        </td>
                    </tr>

                    {/* TRAMOS DE NAVEGACIÓN Y PUERTOS DESTINO */}
                    {tramos.map((tr, idx) => {
                        const trCalculado = calculatedTramosList[idx] || tr;
                        const trResult = result?.tramos?.[idx];
                        const selectedVesselObj = vessels.find(v => v.vessel_id === selectedVessel);

                        // Cálculo Live de Búnker por Tramo
                        const distVal = Number(tr.route_distance || 0);
                        const rawWf = Number(tr.weather_factor || 0);
                        const wfPct = rawWf > 1 ? rawWf : (rawWf * 100);
                        const speedVal = Math.max(1, Number(tr.speed || selectedVesselObj?.vessel_speed || vesselParams?.vessel_speed || 11));
                        const calcSeaDays = distVal > 0 ? (distVal * (1 + (wfPct / 100))) / (speedVal * 24) : 0;

                        const pCfg = puertosConfig[idx + 1] || {};
                        const qVal = Number(pCfg.quantity || 0);
                        const rVal = Math.max(1, Number(pCfg.op_rate || 500));
                        const tcVal = Number(pCfg.time_to_count || 0);
                        const posVal = Number(pCfg.positioning || 0);

                        const idleDays = pCfg.action !== 'NONE' ? ((tcVal + posVal) / 24) : 0;
                        const opDays = pCfg.action !== 'NONE' ? ((qVal / rVal) / 24) : 0;
                        const calcPortDays = idleDays + opDays;

                        const ifoSeaRatio = Number(vesselParams?.consumption_sea_ifo || selectedVesselObj?.consumption_sea_ifo || 14.5);
                        const mdoSeaRatio = Number(vesselParams?.consumption_sea_mdo || selectedVesselObj?.consumption_sea_mdo || 0.1);
                        const ifoIdleRatio = Number(vesselParams?.consumption_idle_ifo || selectedVesselObj?.consumption_idle_ifo || 3.5);
                        const mdoIdleRatio = Number(vesselParams?.consumption_idle_mdo || selectedVesselObj?.consumption_idle_mdo || 0.1);
                        const ifoLoadRatio = Number(vesselParams?.consumption_load_ifo || selectedVesselObj?.consumption_load_ifo || ifoIdleRatio);
                        const mdoLoadRatio = Number(vesselParams?.consumption_load_mdo || selectedVesselObj?.consumption_load_mdo || mdoIdleRatio);
                        const ifoDischRatio = Number(vesselParams?.consumption_disch_ifo || selectedVesselObj?.consumption_disch_ifo || 5.0);
                        const mdoDischRatio = Number(vesselParams?.consumption_disch_mdo || selectedVesselObj?.consumption_disch_mdo || mdoIdleRatio);

                        const opIfoRate = pCfg.action === 'DESCARGAR' ? ifoDischRatio : pCfg.action === 'CARGAR' ? ifoLoadRatio : ifoIdleRatio;
                        const opMdoRate = pCfg.action === 'DESCARGAR' ? mdoDischRatio : pCfg.action === 'CARGAR' ? mdoLoadRatio : mdoIdleRatio;

                        const ifoTons = (calcSeaDays * ifoSeaRatio) + (idleDays * ifoIdleRatio) + (opDays * opIfoRate);
                        const mdoTons = (calcSeaDays * mdoSeaRatio) + (idleDays * mdoIdleRatio) + (opDays * opMdoRate);
                        const liveBunkerCost = (ifoTons * (bunkerPriceIfo || 0)) + (mdoTons * (bunkerPriceMdo || 0));

                        return (
                            <tr key={idx} className="border-b border-slate-200 h-8 hover:bg-slate-50">
                                <td className="border-r border-slate-200 text-center font-bold text-slate-500 select-none">
                                    {idx + 1}
                                </td>
                                <td className="border-r border-slate-200 text-center font-bold">
                                    <span className={`text-[11px] px-1 py-0.25 rounded ${trCalculado.type === 'LADEN' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {trCalculado.type}
                                    </span>
                                </td>
                                <td className="border-r border-slate-200 p-0">
                                    <select
                                        value={tr.destination_port_id || ''}
                                        onChange={(e) => updateTramoField(idx, 'destination_port_id', e.target.value)}
                                        className="w-full h-full bg-white border-0 px-1 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 text-[11.5px] cursor-pointer"
                                    >
                                        <option value="">Seleccione puerto...</option>
                                        {ports.map((p) => (
                                            <option key={p.port_id} value={p.port_id}>
                                                {p.port_id}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="border-r border-slate-200 p-0 text-right">
                                    <input
                                        type="number"
                                        value={tr.route_distance ?? ''}
                                        onChange={(e) => updateTramoField(idx, 'route_distance', e.target.value)}
                                        className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                        placeholder="0"
                                    />
                                </td>
                                <td className="border-r border-slate-200 p-0 text-right">
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={tr.weather_factor !== undefined && tr.weather_factor !== null ? (Number(tr.weather_factor) <= 1 ? (Number(tr.weather_factor) * 100).toFixed(1) : String(tr.weather_factor)) : ''}
                                        onChange={(e) => updateTramoField(idx, 'weather_factor', e.target.value)}
                                        className="w-full h-full bg-white border-0 px-1 text-right font-mono text-slate-600 focus:outline-none text-[11px]"
                                        placeholder="0.0"
                                    />
                                </td>
                                <td className="border-r border-slate-200 p-0 text-right">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={tr.speed ?? ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            updateTramoField(idx, 'speed', val);
                                            tramos.forEach((_, tIdx) => {
                                                updateTramoField(tIdx, 'speed', val);
                                            });
                                        }}
                                        className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                        placeholder={selectedVesselObj?.vessel_speed !== undefined ? String(selectedVesselObj.vessel_speed) : '11.0'}
                                    />
                                </td>
                                <td className="border-r border-slate-200 text-right pr-2 text-slate-500 bg-slate-50/50 font-bold select-none">
                                    {fmtDays(calcSeaDays)}
                                </td>
                                <td className="border-r border-slate-200 text-right pr-2 text-slate-500 bg-slate-50/50 font-bold select-none">
                                    {fmtDays(calcPortDays)}
                                </td>
                                <td className="border-r border-slate-200 p-0 text-right">
                                    {puertosConfig[idx + 1]?.action !== 'NONE' ? (
                                        <input
                                            type="number"
                                            value={puertosConfig[idx + 1]?.time_to_count !== undefined && puertosConfig[idx + 1]?.time_to_count !== null ? puertosConfig[idx + 1]?.time_to_count : (puertosConfig[idx + 1]?.overhead ?? '')}
                                            onChange={(e) => {
                                                updatePuertoConfigField(idx + 1, 'time_to_count', e.target.value);
                                                updatePuertoConfigField(idx + 1, 'overhead', e.target.value);
                                            }}
                                            className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder={trResult?.time_to_count_descarga_hrs !== undefined ? String(trResult.time_to_count_descarga_hrs) : '6.0'}
                                        />
                                    ) : (
                                        <span className="text-slate-350 select-none pr-2">—</span>
                                    )}
                                </td>
                                <td className="border-r border-slate-200 p-0 text-right">
                                    {puertosConfig[idx + 1]?.action !== 'NONE' ? (
                                        <input
                                            type="number"
                                            value={puertosConfig[idx + 1]?.positioning ?? ''}
                                            onChange={(e) => updatePuertoConfigField(idx + 1, 'positioning', e.target.value)}
                                            className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder={puertosConfig[idx + 1]?.action === 'CARGAR' ? String(trResult?.positioning_carga_hrs ?? '1.0') : String(trResult?.positioning_descarga_hrs ?? '0.0')}
                                        />
                                    ) : (
                                        <span className="text-slate-350 select-none pr-2">—</span>
                                    )}
                                </td>
                                <td className="border-r border-slate-200 p-0 text-center">
                                    <select
                                        value={puertosConfig[idx + 1]?.action || 'NONE'}
                                        onChange={(e) => updatePuertoConfigField(idx + 1, 'action', e.target.value)}
                                        className="w-[96%] bg-white border border-indigo-200 hover:border-indigo-400 rounded text-[11.5px] font-bold text-indigo-900 focus:outline-none font-sans text-center h-[26px]"
                                    >
                                        <option value="NONE">NONE</option>
                                        <option value="CARGAR">CARGAR</option>
                                        <option value="DESCARGAR">DESCARGAR</option>
                                    </select>
                                </td>
                                <td className="border-r border-slate-200 p-0">
                                    {puertosConfig[idx + 1]?.action !== 'NONE' ? (
                                        <div className="flex items-center h-full w-full">
                                            <input
                                                type="number"
                                                value={puertosConfig[idx + 1]?.op_rate ?? ''}
                                                onChange={(e) => updatePuertoConfigField(idx + 1, 'op_rate', e.target.value)}
                                                className="w-[60%] h-full bg-white border-0 px-1 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs"
                                                placeholder={puertosConfig[idx + 1]?.action === 'CARGAR' ? String(trResult?.contract_agreed_load_rate ?? (getAutoPortRate(tr.destination_port_id, 'CARGAR') || '500')) : String(trResult?.contract_agreed_disch_rate ?? (getAutoPortRate(tr.destination_port_id, 'DESCARGAR') || '450'))}
                                            />
                                            <select
                                                value={puertosConfig[idx + 1]?.rate_unit || 'TH'}
                                                onChange={(e) => updatePuertoConfigField(idx + 1, 'rate_unit', e.target.value)}
                                                className="w-[40%] h-[22px] text-[9.5px] bg-slate-50 border border-slate-250 rounded font-sans cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 pl-0.5 text-slate-500 font-bold mr-1"
                                            >
                                                <option value="TD">T/d</option>
                                                <option value="TH">T/h</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="text-right pr-2">
                                            <span className="text-slate-350 select-none">—</span>
                                        </div>
                                    )}
                                </td>
                                <td className="border-r border-slate-200 p-0 text-right">
                                    {puertosConfig[idx + 1]?.action !== 'NONE' ? (
                                        <input
                                            type="text"
                                            placeholder="Q (MT)"
                                            value={puertosConfig[idx + 1]?.quantity !== '' && puertosConfig[idx + 1]?.quantity !== undefined ? fmtThousandSep(puertosConfig[idx + 1].quantity) : ''}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/,/g, '');
                                                if (/^\d*\.?\d*$/.test(raw)) {
                                                    updatePuertoConfigField(idx + 1, 'quantity', raw);
                                                }
                                            }}
                                            className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                        />
                                    ) : (
                                        <span className="text-slate-350 select-none pr-2">—</span>
                                    )}
                                </td>
                                <td className="border-r border-slate-200 p-0 text-right">
                                    {puertosConfig[idx + 1]?.action === 'DESCARGAR' ? (
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="F"
                                            value={puertosConfig[idx + 1]?.freight_rate ?? ''}
                                            onChange={(e) => updatePuertoConfigField(idx + 1, 'freight_rate', e.target.value)}
                                            className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                        />
                                    ) : (
                                        <span className="text-slate-350 select-none pr-2">—</span>
                                    )}
                                </td>
                                <td className="border-r border-slate-200 p-0 text-right">
                                    {puertosConfig[idx + 1]?.action !== 'NONE' ? (
                                        <input
                                            type="text"
                                            value={puertosConfig[idx + 1]?.manual_port_cost !== '' && puertosConfig[idx + 1]?.manual_port_cost !== undefined ? fmtThousandSep(puertosConfig[idx + 1].manual_port_cost) : ''}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/[^0-9.]/g, '');
                                                if (/^\d*\.?\d*$/.test(raw)) {
                                                    updatePuertoConfigField(idx + 1, 'manual_port_cost', raw);
                                                }
                                            }}
                                            className={`w-full h-full bg-white border-0 px-1.5 text-right font-mono text-xs focus:outline-none ${
                                                puertosConfig[idx + 1]?.manual_port_cost !== '' && puertosConfig[idx + 1]?.manual_port_cost !== undefined
                                                    ? 'text-blue-800 font-extrabold bg-blue-50/20'
                                                    : 'text-slate-500 font-medium'
                                            }`}
                                            placeholder={trResult?.agency_costs_destination ? fmtCur(trResult.agency_costs_destination) : ''}
                                        />
                                    ) : (
                                        <span className="text-slate-350 select-none pr-2">—</span>
                                    )}
                                </td>

                                {/* Ingreso de Flete del Tramo (Reactivo Q x F) */}
                                <td className="border-r border-slate-200 text-right pr-2 text-slate-700 bg-slate-50/50 font-mono font-bold select-none">
                                    {(() => {
                                        const calcIncome = puertosConfig[idx + 1]?.action === 'DESCARGAR'
                                            ? (Number(puertosConfig[idx + 1]?.quantity || 0) * Number(puertosConfig[idx + 1]?.freight_rate || 0))
                                            : 0;
                                        const finalIncome = trResult?.net_income ? trResult.net_income : calcIncome;
                                        return finalIncome > 0 ? fmtCur(finalIncome) : '$0';
                                    })()}
                                </td>

                                {/* Costo Búnker del Tramo (Cálculo Live o Motor) */}
                                <td className="border-r border-slate-200 text-right pr-2 font-mono font-bold text-slate-800 bg-amber-50/20 select-none">
                                    {(() => {
                                        const finalBunker = (trResult?.bunker_costs && trResult.bunker_costs > 0) ? trResult.bunker_costs : liveBunkerCost;
                                        return finalBunker > 0 ? fmtCur(finalBunker) : '$0';
                                    })()}
                                </td>

                                <td className="border-r border-slate-200 text-right pr-2 font-mono font-bold text-[11px] bg-slate-50/40">
                                    {(() => {
                                        if (puertosConfig[idx + 1]?.action === 'NONE') return <span className="text-slate-350 select-none pr-1">—</span>;
                                        const isMejillonesDischarge = (tr.destination_port_id || '').toUpperCase() === 'MEJILLONES' && puertosConfig[idx + 1]?.action === 'DESCARGAR';
                                        const mVal = trResult?.muellaje_cost_dest || trResult?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx + 1]?.muellaje_cost || (isMejillonesDischarge ? 33333 : 0);
                                        if (!mVal) return <span className="text-slate-350 select-none pr-1">—</span>;
                                        return (
                                            <span className={refacturarMuellajeMap[idx + 1] !== false ? 'text-blue-900 font-extrabold' : 'text-slate-400 line-through'}>
                                                {fmtCur(mVal)}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td className="border-r border-slate-300 text-center p-0 bg-slate-50/40">
                                    {(() => {
                                        const isMejillonesDischarge = (tr.destination_port_id || '').toUpperCase() === 'MEJILLONES' && puertosConfig[idx + 1]?.action === 'DESCARGAR';
                                        const mVal = trResult?.muellaje_cost_dest || trResult?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx + 1]?.muellaje_cost || (isMejillonesDischarge ? 33333 : 0);
                                        return puertosConfig[idx + 1]?.action !== 'NONE' && mVal > 0 ? (
                                            <input
                                                type="checkbox"
                                                checked={refacturarMuellajeMap[idx + 1] ?? true}
                                                onChange={(e) => setRefacturarMuellajeMap(prev => ({ ...prev, [idx + 1]: e.target.checked }))}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                                title="Refacturar Muellaje al cliente"
                                            />
                                        ) : (
                                            <span className="text-slate-350 select-none">—</span>
                                        );
                                    })()}
                                </td>
                            </tr>
                        );
                    })}

                    {/* FILA ÚNICA DE TOTALES (HOUSEKEEPING) */}
                    {(() => {
                        const sumDistance = tramos.reduce((s, t) => s + (Number(t.route_distance) || 0), 0);
                        const sumSeaDays = tramos.reduce((s, _, idx) => {
                            const tr = tramos[idx];
                            const selectedVesselObj = vessels.find(v => v.vessel_id === selectedVessel);
                            const distVal = Number(tr.route_distance || 0);
                            const rawWf = Number(tr.weather_factor || 0);
                            const wfPct = rawWf > 1 ? rawWf : (rawWf * 100);
                            const speedVal = Math.max(1, Number(tr.speed || selectedVesselObj?.vessel_speed || vesselParams?.vessel_speed || 11));
                            return s + (distVal > 0 ? (distVal * (1 + (wfPct / 100))) / (speedVal * 24) : 0);
                        }, 0);

                        const sumPortDays = puertosConfig.reduce((s, p) => {
                            if (p.action === 'NONE') return s;
                            const qVal = Number(p.quantity || 0);
                            const rDefault = p.action === 'DESCARGAR' ? 450 : 500;
                            const rVal = Math.max(1, Number(p.op_rate || rDefault));
                            const rUnit = p.rate_unit || 'TH';
                            const rateFactor = rUnit === 'TD' ? 1 : 24;
                            const tcVal = Number(p.time_to_count !== undefined && p.time_to_count !== '' ? p.time_to_count : (p.overhead !== undefined && p.overhead !== '' ? p.overhead : 6.0));
                            const posVal = Number(p.positioning !== undefined && p.positioning !== '' ? p.positioning : (p.action === 'CARGAR' ? 1.0 : 0.0));
                            return s + (((qVal / rVal) / rateFactor) + ((tcVal + posVal) / 24));
                        }, 0);

                        const sumPortCostsCalculated = puertosConfig.reduce((sum, p) => sum + (Number(p.manual_port_cost) || 0), 0);
                        const sumFreightIncome = tramos.reduce((sum, _, idx) => sum + (puertosConfig[idx + 1]?.action === 'DESCARGAR' ? (Number(puertosConfig[idx + 1]?.quantity || 0) * Number(puertosConfig[idx + 1]?.freight_rate || 0)) : 0), 0);
                        const sumBunkerCostsCalculated = sumLiveBunkerCosts;

                        return (
                            <tr className="bg-blue-600 text-white h-8 select-none font-black text-xs border-t-2 border-blue-800">
                                <td colSpan={3} className="border-r border-blue-500 text-left pl-3 font-sans text-[11px] uppercase tracking-wider text-white bg-blue-700 font-extrabold">
                                    📊 TOTAL
                                </td>
                                <td className="border-r border-blue-500 text-right pr-2 font-mono text-white">
                                    {fmtNum(sumDistance)}
                                </td>
                                <td className="border-r border-blue-500 text-right pr-2 text-blue-200">—</td>
                                <td className="border-r border-blue-500 text-right pr-2 text-blue-200">—</td>
                                <td className="border-r border-blue-500 text-right pr-2 font-mono text-white">
                                    {fmtDays(sumSeaDays)}
                                </td>
                                <td className="border-r border-blue-500 text-right pr-2 font-mono text-white">
                                    {fmtDays(sumPortDays)}
                                </td>
                                <td className="border-r border-blue-500 text-right pr-2 text-blue-200">—</td>
                                <td className="border-r border-blue-500 text-right pr-2 text-blue-200">—</td>
                                <td className="border-r border-blue-500 text-right pr-2 text-blue-200">—</td>
                                <td className="border-r border-blue-500 text-right pr-2 text-blue-200">—</td>
                                <td className="border-r border-blue-500 text-right pr-2 font-mono text-white">
                                    {totalDescargas > 0 ? fmtNum(totalDescargas) : '—'}
                                </td>
                                <td className="border-r border-blue-500 text-right pr-2 text-blue-200">—</td>
                                <td className="border-r border-blue-500 text-right pr-2 font-mono text-white font-black">
                                    {fmtCur(sumPortCostsCalculated)}
                                </td>
                                <td className="border-r border-blue-500 text-right pr-2 font-mono text-white font-black">
                                    {fmtCur(sumFreightIncome)}
                                </td>
                                <td className="border-r border-blue-500 text-right pr-2 font-mono text-white font-black">
                                    {fmtCur(sumBunkerCostsCalculated)}
                                </td>
                                <td className="border-r border-blue-500 text-right pr-2 text-blue-200">—</td>
                                <td className="text-right pr-2 text-blue-200">—</td>
                            </tr>
                        );
                    })()}
                </tbody>
            </table>
        </div>
    );
};
