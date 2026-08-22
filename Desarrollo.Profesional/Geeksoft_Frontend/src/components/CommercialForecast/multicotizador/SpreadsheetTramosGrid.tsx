import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { PortDemurrageRatesService } from '../../../services/providers/portDemurrageRatesService';

export interface SpreadsheetTramosGridProps {
    tramos: any[];
    puertosConfig: any[];
    ports: any[];
    vessels: any[];
    selectedVessel: string;
    bunkerPriceIfo: number;
    bunkerPriceMdo: number;
    vesselParams: any;
    result?: any;
    refacturarMuellajeMap: Record<number, boolean>;
    calculatedTramosList: any[];
    liveCalc: any;
    demurrageMode?: 'P' | 'M';
    staticCostsData?: any[];
    validFrom?: string;
    onDemurrageModeChange?: (mode: 'P' | 'M') => void;
    handleAddTramo: () => void;
    handleRemoveLastTramo: () => void;
    updateTramoField: (idx: number, field: string, val: any) => void;
    updatePuertoConfigField: (idx: number, field: any, val: any) => void;
    setRefacturarMuellajeMap: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    getAutoPortRate: (portId: string, action: string) => string | number;
    fmtCur: (val: number | string | undefined | null) => string;
    fmtNum: (val: number | string | undefined | null) => string;
    fmtDays: (val: number | string | undefined | null) => string;
    fmtThousandSep: (val: number | string | undefined | null) => string;
}

export const SpreadsheetTramosGrid: React.FC<SpreadsheetTramosGridProps> = ({
    tramos = [],
    puertosConfig = [],
    ports = [],
    vessels = [],
    selectedVessel,
    bunkerPriceIfo: _bunkerPriceIfo,
    bunkerPriceMdo: _bunkerPriceMdo,
    vesselParams: _vesselParams,
    result: _result,
    refacturarMuellajeMap = {},
    calculatedTramosList: _calculatedTramosList,
    liveCalc,
    demurrageMode = 'P',
    staticCostsData = [],
    validFrom,
    onDemurrageModeChange,
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
    const totalDescargas = liveCalc?.totalQuantity ?? puertosConfig.reduce((sum, p) => sum + (p.action === 'DESCARGAR' ? (Number(p.quantity) || 0) : 0), 0);
    const selectedVesselObj = (vessels || []).find(v => v.vessel_id === selectedVessel);

    const getSuggestedDemurrage = (portId: string, action: string) => {
        if (!portId || (action !== 'CARGAR' && action !== 'DESCARGAR')) return 0;
        return PortDemurrageRatesService.resolveDemurrageDays(
            portId,
            selectedVessel,
            demurrageMode,
            validFrom,
            staticCostsData
        );
    };

    return (
        <div className="overflow-x-auto border border-slate-300 rounded bg-white shadow-sm flex flex-col mb-1">
            <table className="w-full border-collapse text-[12px] font-mono table-fixed select-text">
                <colgroup>
                    <col className="w-[50px]" />
                    <col className="w-[85px]" />
                    <col className="w-[180px]" />
                    <col className="w-[75px]" />
                    <col className="w-[60px]" />
                    <col className="w-[65px]" />
                    <col className="w-[75px]" />
                    <col className="w-[75px]" />
                    <col className="w-[85px]" /> {/* DEMURRAGE (D) */}
                    <col className="w-[95px]" /> {/* TIME TO COUNT */}
                    <col className="w-[75px]" /> {/* POSIC */}
                    <col className="w-[95px]" />
                    <col className="w-[100px]" />
                    <col className="w-[85px]" />
                    <col className="w-[75px]" />
                    <col className="w-[85px]" />
                    <col className="w-[95px]" />
                    <col className="w-[85px]" />
                    <col className="w-[70px]" />
                    <col className="w-[35px]" />
                </colgroup>
                <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300 text-center uppercase tracking-tight text-[10px] font-sans h-7">
                        <th className="border-r border-slate-300">
                            <div className="flex items-center justify-center gap-0.5">
                                <span>LEG</span>
                                <button
                                    onClick={handleAddTramo}
                                    title="Añadir Tramo"
                                    className="p-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                                >
                                    <Plus size={9} strokeWidth={3} />
                                </button>
                                {tramos.length > 1 && (
                                    <button
                                        onClick={handleRemoveLastTramo}
                                        title="Eliminar Último Tramo"
                                        className="p-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                                    >
                                        <Minus size={9} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        </th>
                        <th className="border-r border-slate-300">TIPO</th>
                        <th className="border-r border-slate-300 text-left pl-2">PUERTO</th>
                        <th className="border-r border-slate-300 text-right pr-2">DIST (NM)</th>
                        <th className="border-r border-slate-300 text-right pr-1">W.F (%)</th>
                        <th className="border-r border-slate-300 text-right pr-1">VEL (KN)</th>
                        <th className="border-r border-slate-300 text-right pr-2">DÍAS MAR</th>
                        <th className="border-r border-slate-300 text-right pr-2">DÍAS PTO</th>
                        
                        {/* CABECERA DEMURRAGE CON SELECTOR P / M */}
                        <th className="border-r border-slate-300 px-1 bg-sky-50/60">
                            <div className="flex items-center justify-between gap-0.5 px-0.5">
                                <span className="font-extrabold text-[9.5px] text-sky-950 uppercase tracking-tight">DEM (D)</span>
                                <div className="flex items-center rounded bg-slate-200/90 p-0.5 border border-slate-300 shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => onDemurrageModeChange && onDemurrageModeChange('P')}
                                        title="P: Promedio Anual (12 Meses)"
                                        className={`px-1 py-0.2 text-[8px] font-black rounded cursor-pointer transition-colors ${demurrageMode === 'P' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        P
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDemurrageModeChange && onDemurrageModeChange('M')}
                                        title="M: Mensual según Fecha de Cotización"
                                        className={`px-1 py-0.2 text-[8px] font-black rounded cursor-pointer transition-colors ${demurrageMode === 'M' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        M
                                    </button>
                                </div>
                            </div>
                        </th>

                        <th className="border-r border-slate-300 text-right pr-1">TIME TO COUNT (H)</th>
                        <th className="border-r border-slate-300 text-right pr-1">POSIC (H)</th>
                        <th className="border-r border-slate-300">OP. DEST</th>
                        <th className="border-r border-slate-300">RITMO (C/D)</th>
                        <th className="border-r border-slate-300 text-right pr-2">Q (MT)</th>
                        <th className="border-r border-slate-300 text-right pr-1">F ($/T)</th>
                        <th className="border-r border-slate-300 text-right pr-2">COSTO PTO</th>
                        <th className="border-r border-slate-300 text-right pr-2">FLETE ($)</th>
                        <th className="border-r border-slate-300 text-right pr-2">BUNKER ($)</th>
                        <th colSpan={2} className="text-center font-bold bg-blue-50/50 text-blue-900 border-l border-slate-300">
                            <div className="flex flex-col items-center">
                                <span>MUELLAJE</span>
                                <div className="flex justify-between w-full px-1 text-[8.5px] border-t border-blue-200">
                                    <span>MUELLAJE</span>
                                    <span>RF</span>
                                </div>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {/* FILA 0: PUERTO DE ORIGEN INICIAL (POL) */}
                    <tr className="border-b border-slate-300 bg-slate-50/40 hover:bg-amber-50/20 transition-colors h-7.5">
                        <td className="border-r border-slate-200 text-center font-mono font-bold text-slate-400 bg-slate-100/60 select-none">
                            —
                        </td>
                        <td className="border-r border-slate-200 text-center text-[10px] font-bold text-slate-400 select-none">—</td>
                        
                        {/* Fila 0 Puerto Dropdown */}
                        <td className="border-r border-slate-200 p-0">
                            <select
                                value={tramos[0]?.origin_port_id || ''}
                                onChange={(e) => {
                                    const newPort = e.target.value;
                                    updateTramoField(0, 'origin_port_id', newPort);
                                }}
                                className="w-full h-full bg-transparent border-0 px-2 font-bold text-slate-800 focus:outline-none cursor-pointer font-sans text-xs"
                            >
                                <option value="">Seleccione puerto...</option>
                                {ports.map((p, pIdx) => (
                                    <option key={pIdx} value={p.port_id || p.name}>
                                        {p.name || p.port_id} {p.country ? `(${p.country})` : ''}
                                    </option>
                                ))}
                            </select>
                        </td>

                        <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>
                        <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>
                        <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>
                        <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>
                        
                        {/* Fila 0 Días Puerto */}
                        <td className="border-r border-slate-200 text-right pr-2 text-slate-700 bg-slate-50/50 font-bold select-none">
                            {puertosConfig[0]?.action !== 'NONE' ? fmtDays(liveCalc?.portDays0 ?? 0) : '0.00'}
                        </td>

                        {/* Fila 0 Demurrage (Días) - Solo si CARGAR */}
                        <td className="border-r border-slate-200 p-0 text-right bg-sky-50/30">
                            {puertosConfig[0]?.action === 'CARGAR' ? (
                                <input
                                    type="number"
                                    step="0.01"
                                    value={puertosConfig[0]?.demurrage_days !== undefined && puertosConfig[0]?.demurrage_days !== '' ? puertosConfig[0]?.demurrage_days : ''}
                                    onChange={(e) => updatePuertoConfigField(0, 'demurrage_days', e.target.value)}
                                    className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-sky-950 focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder={getSuggestedDemurrage(tramos[0]?.origin_port_id, 'CARGAR').toFixed(2)}
                                />
                            ) : (
                                <span className="text-slate-350 select-none pr-2">—</span>
                            )}
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
                                    placeholder="6.0"
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
                                    placeholder={puertosConfig[0]?.action === 'BUNKERING' ? '24.0' : (puertosConfig[0]?.action === 'CARGAR' ? '1.0' : '0.0')}
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
                                <option value="BUNKERING">BUNKERING</option>
                            </select>
                        </td>

                        {/* Fila 0 Ritmo Op */}
                        <td className="border-r border-slate-200 p-0">
                            {puertosConfig[0]?.action !== 'NONE' && puertosConfig[0]?.action !== 'BUNKERING' ? (
                                <div className="flex items-center h-full w-full">
                                    <input
                                        type="number"
                                        value={puertosConfig[0]?.op_rate ?? ''}
                                        onChange={(e) => updatePuertoConfigField(0, 'op_rate', e.target.value)}
                                        className="w-[60%] h-full bg-white border-0 px-1 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs"
                                        placeholder={String(getAutoPortRate(tramos[0]?.origin_port_id || '', puertosConfig[0]?.action) || (puertosConfig[0]?.action === 'DESCARGAR' ? '450' : '500'))}
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

                        {/* Fila 0 Cantidad Carga */}
                        <td className="border-r border-slate-200 p-0 text-right">
                            {puertosConfig[0]?.action === 'CARGAR' ? (
                                <input
                                    type="text"
                                    value={puertosConfig[0]?.quantity !== undefined && puertosConfig[0]?.quantity !== '' ? fmtThousandSep(puertosConfig[0].quantity) : ''}
                                    onChange={(e) => {
                                        const cleanVal = e.target.value.replace(/,/g, '');
                                        updatePuertoConfigField(0, 'quantity', cleanVal);
                                    }}
                                    className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                    placeholder="13,500"
                                />
                            ) : (
                                <span className="text-slate-350 select-none pr-2">—</span>
                            )}
                        </td>

                        <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">—</td>

                        {/* Fila 0 Costo Puerto */}
                        <td className="border-r border-slate-200 p-0 text-right">
                            {puertosConfig[0]?.action !== 'NONE' ? (
                                <input
                                    type="text"
                                    value={puertosConfig[0]?.manual_port_cost !== undefined ? fmtThousandSep(puertosConfig[0].manual_port_cost) : ''}
                                    onChange={(e) => {
                                        const cleanVal = e.target.value.replace(/,/g, '');
                                        updatePuertoConfigField(0, 'manual_port_cost', cleanVal);
                                    }}
                                    className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                    placeholder="0"
                                />
                            ) : (
                                <span className="text-slate-350 select-none pr-2">—</span>
                            )}
                        </td>

                        {/* Fila 0 Flete ($) */}
                        <td className="border-r border-slate-200 text-right pr-2 text-slate-350 select-none">$0</td>

                        {/* Fila 0 Bunker ($) */}
                        <td className="border-r border-slate-200 text-right pr-2 font-mono font-bold text-slate-800 bg-amber-50/20 select-none">
                            {puertosConfig[0]?.action !== 'NONE' && (liveCalc?.bunkerCost0 ?? 0) > 0 ? fmtCur(liveCalc.bunkerCost0) : '$0'}
                        </td>

                        {/* Fila 0 Muellaje */}
                        <td className="border-r border-slate-200 text-right pr-2 font-mono font-bold text-[11px] bg-slate-50/40">
                            {(() => {
                                const mVal = puertosConfig[0]?.muellaje_cost || 0;
                                if (!mVal || puertosConfig[0]?.action === 'NONE') return <span className="text-slate-350 select-none pr-1">—</span>;
                                return (
                                    <span className={refacturarMuellajeMap[0] !== false ? 'text-blue-900 font-extrabold' : 'text-slate-400 line-through'}>
                                        {fmtCur(mVal)}
                                    </span>
                                );
                            })()}
                        </td>
                        <td className="border-r border-slate-300 text-center p-0 bg-slate-50/40">
                            {puertosConfig[0]?.action !== 'NONE' && (Number(puertosConfig[0]?.muellaje_cost) || 0) > 0 ? (
                                <input
                                    type="checkbox"
                                    checked={refacturarMuellajeMap[0] ?? true}
                                    onChange={(e) => setRefacturarMuellajeMap(prev => ({ ...prev, [0]: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                    title="Refacturar Muellaje POL al cliente"
                                />
                            ) : (
                                <span className="text-slate-350 select-none">—</span>
                            )}
                        </td>
                    </tr>

                    {/* FILAS 1 .. N: TRAMOS Y PUERTOS DE DESTINO */}
                    {tramos.map((tr, idx) => {
                        const trCalc = liveCalc?.calculatedTramos?.[idx] || {};
                        const isLaden = (trCalc.type || tr.type) === 'LADEN';

                        return (
                            <tr
                                key={idx}
                                className={`border-b border-slate-200 hover:bg-amber-50/30 transition-colors h-7.5 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                            >
                                <td className="border-r border-slate-200 text-center font-mono font-bold text-slate-600 bg-slate-100/60 select-none">
                                    {idx + 1}
                                </td>

                                {/* Badge BALLAST / LADEN */}
                                <td className="border-r border-slate-200 text-center p-0">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-sans select-none ${
                                        isLaden
                                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    }`}>
                                        {isLaden ? 'LADEN' : 'BALLAST'}
                                    </span>
                                </td>

                                {/* Puerto Destino Dropdown */}
                                <td className="border-r border-slate-200 p-0">
                                    <select
                                        value={tr.destination_port_id || ''}
                                        onChange={(e) => {
                                            const newDest = e.target.value;
                                            updateTramoField(idx, 'destination_port_id', newDest);
                                            if (tramos[idx + 1]) {
                                                updateTramoField(idx + 1, 'origin_port_id', newDest);
                                            }
                                        }}
                                        className="w-full h-full bg-transparent border-0 px-2 font-bold text-slate-800 focus:outline-none cursor-pointer font-sans text-xs"
                                    >
                                        <option value="">Seleccione puerto...</option>
                                        {ports.map((p, pIdx) => (
                                            <option key={pIdx} value={p.port_id || p.name}>
                                                {p.name || p.port_id} {p.country ? `(${p.country})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </td>

                                {/* Distancia (NM) */}
                                <td className="border-r border-slate-200 p-0 text-right">
                                    <input
                                        type="number"
                                        value={tr.route_distance ?? ''}
                                        onChange={(e) => updateTramoField(idx, 'route_distance', e.target.value)}
                                        className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                        placeholder="0"
                                    />
                                </td>

                                {/* Weather Factor (%) */}
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

                                {/* Velocidad (KN) */}
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

                                {/* Días Mar */}
                                <td className="border-r border-slate-200 text-right pr-2 text-slate-500 bg-slate-50/50 font-bold select-none">
                                    {fmtDays(trCalc.sea_days ?? 0)}
                                </td>

                                {/* Días Puerto */}
                                <td className="border-r border-slate-200 text-right pr-2 text-slate-500 bg-slate-50/50 font-bold select-none">
                                    {fmtDays(trCalc.port_days ?? 0)}
                                </td>

                                {/* Demurrage Destino (Días) - Solo si CARGAR o DESCARGAR */}
                                <td className="border-r border-slate-200 p-0 text-right bg-sky-50/30">
                                    {puertosConfig[idx + 1]?.action === 'CARGAR' || puertosConfig[idx + 1]?.action === 'DESCARGAR' ? (
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={puertosConfig[idx + 1]?.demurrage_days !== undefined && puertosConfig[idx + 1]?.demurrage_days !== '' ? puertosConfig[idx + 1]?.demurrage_days : ''}
                                            onChange={(e) => updatePuertoConfigField(idx + 1, 'demurrage_days', e.target.value)}
                                            className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-sky-950 focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder={getSuggestedDemurrage(tr.destination_port_id, puertosConfig[idx + 1]?.action).toFixed(2)}
                                        />
                                    ) : (
                                        <span className="text-slate-350 select-none pr-2">—</span>
                                    )}
                                </td>

                                {/* Time to count Destino */}
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
                                            placeholder="6.0"
                                        />
                                    ) : (
                                        <span className="text-slate-350 select-none pr-2">—</span>
                                    )}
                                </td>

                                {/* Posicionamiento Destino */}
                                <td className="border-r border-slate-200 p-0 text-right">
                                    {puertosConfig[idx + 1]?.action !== 'NONE' ? (
                                        <input
                                            type="number"
                                            value={puertosConfig[idx + 1]?.positioning ?? ''}
                                            onChange={(e) => updatePuertoConfigField(idx + 1, 'positioning', e.target.value)}
                                            className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder={puertosConfig[idx + 1]?.action === 'BUNKERING' ? '24.0' : (puertosConfig[idx + 1]?.action === 'CARGAR' ? '1.0' : '0.0')}
                                        />
                                    ) : (
                                        <span className="text-slate-350 select-none pr-2">—</span>
                                    )}
                                </td>

                                {/* Accion Destino */}
                                <td className="border-r border-slate-200 p-0 text-center">
                                    <select
                                        value={puertosConfig[idx + 1]?.action || 'NONE'}
                                        onChange={(e) => updatePuertoConfigField(idx + 1, 'action', e.target.value)}
                                        className="w-[96%] bg-white border border-indigo-200 hover:border-indigo-400 rounded text-[11.5px] font-bold text-indigo-900 focus:outline-none font-sans text-center h-[26px]"
                                    >
                                        <option value="NONE">NONE</option>
                                        <option value="CARGAR">CARGAR</option>
                                        <option value="DESCARGAR">DESCARGAR</option>
                                        <option value="BUNKERING">BUNKERING</option>
                                    </select>
                                </td>

                                {/* Ritmo Op Destino */}
                                <td className="border-r border-slate-200 p-0">
                                    {puertosConfig[idx + 1]?.action !== 'NONE' && puertosConfig[idx + 1]?.action !== 'BUNKERING' ? (
                                        <div className="flex items-center h-full w-full">
                                            <input
                                                type="number"
                                                value={puertosConfig[idx + 1]?.op_rate ?? ''}
                                                onChange={(e) => updatePuertoConfigField(idx + 1, 'op_rate', e.target.value)}
                                                className="w-[60%] h-full bg-white border-0 px-1 text-right font-mono font-bold text-slate-700 focus:outline-none text-xs"
                                                placeholder={String(getAutoPortRate(tr.destination_port_id, puertosConfig[idx + 1]?.action) || (puertosConfig[idx + 1]?.action === 'DESCARGAR' ? '450' : '500'))}
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

                                {/* Cantidad Descarga/Carga */}
                                <td className="border-r border-slate-200 p-0 text-right">
                                    {puertosConfig[idx + 1]?.action !== 'NONE' && puertosConfig[idx + 1]?.action !== 'BUNKERING' ? (
                                        <input
                                            type="text"
                                            value={puertosConfig[idx + 1]?.quantity !== undefined && puertosConfig[idx + 1]?.quantity !== '' ? fmtThousandSep(puertosConfig[idx + 1].quantity) : ''}
                                            onChange={(e) => {
                                                const cleanVal = e.target.value.replace(/,/g, '');
                                                updatePuertoConfigField(idx + 1, 'quantity', cleanVal);
                                            }}
                                            className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                            placeholder="13,500"
                                        />
                                    ) : (
                                        <span className="text-slate-350 select-none pr-2">—</span>
                                    )}
                                </td>

                                {/* Flete ($/T) */}
                                <td className="border-r border-slate-200 p-0 text-right">
                                    {puertosConfig[idx + 1]?.action === 'DESCARGAR' ? (
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={puertosConfig[idx + 1]?.freight_rate !== undefined && puertosConfig[idx + 1]?.freight_rate !== '' ? puertosConfig[idx + 1]?.freight_rate : ''}
                                            onChange={(e) => updatePuertoConfigField(idx + 1, 'freight_rate', e.target.value)}
                                            className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
                                            placeholder="0.00"
                                        />
                                    ) : (
                                        <span className="text-slate-350 select-none pr-2">—</span>
                                    )}
                                </td>

                                {/* Gastos de Puerto */}
                                <td className="border-r border-slate-200 p-0 text-right">
                                    {puertosConfig[idx + 1]?.action !== 'NONE' ? (
                                        <input
                                            type="text"
                                            value={puertosConfig[idx + 1]?.manual_port_cost !== undefined ? fmtThousandSep(puertosConfig[idx + 1].manual_port_cost) : ''}
                                            onChange={(e) => {
                                                const cleanVal = e.target.value.replace(/,/g, '');
                                                updatePuertoConfigField(idx + 1, 'manual_port_cost', cleanVal);
                                            }}
                                            className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                                            placeholder="0"
                                        />
                                    ) : (
                                        <span className="text-slate-350 select-none pr-2">—</span>
                                    )}
                                </td>

                                {/* Ingreso de Flete del Tramo */}
                                <td className="border-r border-slate-200 text-right pr-2 text-slate-700 bg-slate-50/50 font-mono font-bold select-none">
                                    {fmtCur(trCalc.freight_revenue ?? 0)}
                                </td>

                                {/* Costo Búnker del Tramo */}
                                <td className="border-r border-slate-200 text-right pr-2 font-mono font-bold text-slate-800 bg-amber-50/20 select-none">
                                    {fmtCur(trCalc.bunker_cost ?? 0)}
                                </td>

                                {/* Muellaje Destino */}
                                <td className="border-r border-slate-200 text-right pr-2 font-mono font-bold text-[11px] bg-slate-50/40">
                                    {(() => {
                                        if (puertosConfig[idx + 1]?.action === 'NONE') return <span className="text-slate-350 select-none pr-1">—</span>;
                                        const mVal = trCalc.muellaje_cost || puertosConfig[idx + 1]?.muellaje_cost || 0;
                                        if (!mVal) return <span className="text-slate-350 select-none pr-1">—</span>;
                                        return (
                                            <span className={refacturarMuellajeMap[idx + 1] !== false ? 'text-blue-900 font-extrabold' : 'text-slate-400 line-through'}>
                                                {fmtCur(mVal)}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td className="border-r border-slate-300 text-center p-0 bg-slate-50/40">
                                    {puertosConfig[idx + 1]?.action !== 'NONE' && (Number(puertosConfig[idx + 1]?.muellaje_cost) || 0) > 0 ? (
                                        <input
                                            type="checkbox"
                                            checked={refacturarMuellajeMap[idx + 1] ?? true}
                                            onChange={(e) => setRefacturarMuellajeMap(prev => ({ ...prev, [idx + 1]: e.target.checked }))}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                            title="Refacturar Muellaje al cliente"
                                        />
                                    ) : (
                                        <span className="text-slate-350 select-none">—</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}

                    {/* FILA ÚNICA DE TOTALES (DIRECTA DESDE LIVE CALCULATION) */}
                    <tr className="bg-blue-600 text-white h-8 select-none font-black text-xs border-t-2 border-blue-800">
                        <td colSpan={3} className="border-r border-blue-500 text-left pl-3 font-sans text-[11px] uppercase tracking-wider text-white bg-blue-700 font-extrabold">
                            📊 TOTAL
                        </td>
                        <td className="border-r border-blue-500 text-right pr-2 font-mono text-white">
                            {fmtNum(liveCalc?.totalDist ?? 0)}
                        </td>
                        <td className="border-r border-blue-500 text-right pr-2 text-blue-200">—</td>
                        <td className="border-r border-blue-500 text-right pr-2 text-blue-200">—</td>
                        <td className="border-r border-blue-500 text-right pr-2 font-mono text-white">
                            {fmtDays(liveCalc?.totalSeaDays ?? 0)}
                        </td>
                        <td className="border-r border-blue-500 text-right pr-2 font-mono text-white">
                            {fmtDays(liveCalc?.totalPortDays ?? 0)}
                        </td>
                        
                        {/* TOTAL DEMURRAGE (DÍAS) */}
                        <td className="border-r border-blue-500 text-right pr-2 font-mono text-white bg-sky-700/80 font-black">
                            {liveCalc?.totalDemurrageDays > 0 ? `${fmtDays(liveCalc.totalDemurrageDays)}` : '0.00'}
                        </td>

                        {/* TOTAL TIME TO COUNT (H) */}
                        <td className="border-r border-blue-500 text-right pr-2 font-mono text-white">
                            {(() => {
                                let totalTTC = 0;
                                let hasActive = false;
                                (puertosConfig || []).forEach(p => {
                                    if (p.action === 'CARGAR' || p.action === 'DESCARGAR') {
                                        hasActive = true;
                                        const val = p.time_to_count !== undefined && p.time_to_count !== '' ? Number(p.time_to_count) : 6.0;
                                        totalTTC += isNaN(val) ? 0 : val;
                                    }
                                });
                                return hasActive ? `${totalTTC.toFixed(1)}` : '—';
                            })()}
                        </td>
                        {/* TOTAL POSICIONAMIENTO (H) */}
                        <td className="border-r border-blue-500 text-right pr-2 font-mono text-white">
                            {(() => {
                                let totalPosic = 0;
                                let hasActive = false;
                                (puertosConfig || []).forEach(p => {
                                    if (p.action === 'CARGAR' || p.action === 'DESCARGAR') {
                                        hasActive = true;
                                        const defPosic = p.action === 'CARGAR' ? 1.0 : 0.0;
                                        const val = p.positioning !== undefined && p.positioning !== '' ? Number(p.positioning) : defPosic;
                                        totalPosic += isNaN(val) ? 0 : val;
                                    }
                                });
                                return hasActive ? `${totalPosic.toFixed(1)}` : '0.0';
                            })()}
                        </td>
                        <td className="border-r border-blue-500 text-right pr-2 text-blue-200">—</td>
                        <td className="border-r border-blue-500 text-right pr-2 text-blue-200">—</td>
                        <td className="border-r border-blue-500 text-right pr-2 font-mono text-white">
                            {totalDescargas > 0 ? fmtThousandSep(totalDescargas) : '—'}
                        </td>
                        <td className="border-r border-blue-500 text-right pr-2 text-blue-200">—</td>
                        <td className="border-r border-blue-500 text-right pr-2 font-mono text-white font-black">
                            {fmtCur(liveCalc?.totalPortCosts ?? 0)}
                        </td>
                        <td className="border-r border-blue-500 text-right pr-2 font-mono text-white font-black">
                            {fmtCur(liveCalc?.totalFreight ?? 0)}
                        </td>
                        <td className="border-r border-blue-500 text-right pr-2 font-mono text-white font-black">
                            {fmtCur(liveCalc?.grandBunkerTotal ?? 0)}
                        </td>
                        <td className="border-r border-blue-500 text-right pr-2 text-blue-200">—</td>
                        <td className="text-right pr-2 text-blue-200">—</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
