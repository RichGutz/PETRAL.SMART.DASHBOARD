import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
    demurrageMode?: 'O' | 'P' | 'M' | 'C';
    staticCostsData?: any[];
    validFrom?: string;
    onDemurrageModeChange?: (mode: 'O' | 'P' | 'C') => void;
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

interface HoveredDemurrageState {
    portId: string;
    vesselId: string;
    action: string;
    rect: DOMRect;
}

const DemurrageStatsHoverPortal: React.FC<{
    portId: string;
    vesselId: string;
    action: string;
    rect: DOMRect;
}> = ({ portId, vesselId, rect }) => {
    const profile = PortDemurrageRatesService.getDemurrageProfile(portId, vesselId);
    if (!profile || profile.voyage_count === 0) return null;

    const avgD = profile.annual_average;
    const avgH = (avgD * 24).toFixed(1);
    const medD = profile.median_days ?? 0;
    const medH = (medD * 24).toFixed(1);
    const minD = profile.min_days?.toFixed(2) ?? '0.00';
    const maxD = profile.max_days?.toFixed(2) ?? '0.00';
    const totalVoyages = profile.voyage_count;
    const dispatches = profile.negative_count ?? 0;
    const yearly = profile.yearly_breakdown || {};
    const years = Object.keys(yearly).map(Number).sort((a, b) => b - a);

    const cardWidth = 310;
    const cardHeight = 225;

    let left = rect.right + 14;
    if (typeof window !== 'undefined') {
        if (left + cardWidth > window.innerWidth - 12) {
            left = Math.max(10, rect.left - cardWidth - 14);
        }
    }

    const isAbove = rect.top > cardHeight + 20;
    let top = 0;
    if (isAbove) {
        top = rect.top - cardHeight + 10;
    } else {
        top = rect.bottom + 12;
    }

    const isPlacedRight = left > rect.left;
    const startX = isPlacedRight ? rect.right : rect.left;
    const startY = rect.top + rect.height / 2;
    const endX = isPlacedRight ? left : (left + cardWidth);
    const endY = isAbove ? (top + cardHeight - 20) : (top + 20);

    return createPortal(
        <>
            <svg className="fixed inset-0 w-full h-full pointer-events-none z-[99998] overflow-visible">
                <circle cx={startX} cy={startY} r="2.5" fill="#64748b" fillOpacity="0.5" />
                <path
                    d={`M ${startX} ${startY} Q ${(startX + endX) / 2} ${startY}, ${endX} ${endY}`}
                    fill="none"
                    stroke="rgba(100, 116, 139, 0.4)"
                    strokeWidth="1"
                    strokeDasharray="2.5 2.5"
                />
            </svg>

            <div
                style={{ top: `${top}px`, left: `${left}px`, width: `${cardWidth}px` }}
                className="fixed z-[99999] flex flex-col p-3 bg-white/98 backdrop-blur-md text-slate-800 border border-slate-300 rounded-xl shadow-2xl pointer-events-none select-none animate-in fade-in zoom-in-95 duration-100 font-sans"
            >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs">⚓</span>
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[185px]">
                        PUERTO {profile.port_id}
                    </span>
                </div>
                <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[9px] font-extrabold rounded-md border border-sky-200 uppercase tracking-wider shrink-0">
                    24M PUERTO
                </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 py-2 border-b border-slate-100">
                <div className="flex flex-col items-center bg-sky-50/70 border border-sky-200/80 p-1.5 rounded-lg text-center">
                    <span className="text-[8px] font-black text-sky-800 uppercase tracking-wider">PROMEDIO</span>
                    <span className="text-[12px] font-black font-mono text-sky-950">{avgD.toFixed(2)} d</span>
                    <span className="text-[8.5px] font-semibold font-mono text-sky-700">({avgH} h)</span>
                </div>

                <div className="flex flex-col items-center bg-emerald-50/70 border border-emerald-200/80 p-1.5 rounded-lg text-center">
                    <span className="text-[8px] font-black text-emerald-800 uppercase tracking-wider">MEDIANA</span>
                    <span className="text-[12px] font-black font-mono text-emerald-950">{medD.toFixed(2)} d</span>
                    <span className="text-[8.5px] font-semibold font-mono text-emerald-700">({medH} h)</span>
                </div>

                <div className="flex flex-col items-center bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-center">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-wider">MIN – MAX</span>
                    <span className="text-[10px] font-black font-mono text-slate-800">{minD} – {maxD}</span>
                    <span className="text-[8px] font-semibold text-slate-500">días</span>
                </div>
            </div>

            <div className="flex items-center justify-between py-1.5 text-[9px] text-slate-600 font-semibold border-b border-slate-100">
                <span>🎯 Recaladas: <strong className="text-slate-900 font-mono">{totalVoyages}</strong></span>
                <span>🟢 Despachos: <strong className="text-emerald-700 font-mono">{dispatches}</strong> (= 0.00 d)</span>
            </div>

            {years.length > 0 && (
                <div className="pt-1.5 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase px-0.5">
                        <span>AÑO</span>
                        <span>PROMEDIO</span>
                        <span>MEDIANA</span>
                        <span>RECALADAS</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        {years.map(y => (
                            <div key={y} className="flex items-center justify-between text-[9.5px] font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                                <span className="font-bold text-slate-700">{y}</span>
                                <span className="font-black text-sky-800">{yearly[y].avg.toFixed(2)} d</span>
                                <span className="font-black text-emerald-800">{yearly[y].median.toFixed(2)} d</span>
                                <span className="text-slate-500 font-medium">{yearly[y].count} vjes</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        </>,
        document.body
    );
};

export const SpreadsheetTramosGrid: React.FC<SpreadsheetTramosGridProps> = ({
    tramos = [],
    puertosConfig = [],
    ports = [],
    vessels = [],
    selectedVessel,
    bunkerPriceIfo = 0,
    bunkerPriceMdo = 0,
    vesselParams: _vesselParams,
    result: _result,
    refacturarMuellajeMap = {},
    calculatedTramosList = [],
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
    const [hoveredDemurrage, setHoveredDemurrage] = useState<HoveredDemurrageState | null>(null);
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
                    <col className="w-[135px]" />
                    <col className="w-[95px]" />
                    <col className="w-[75px]" />
                    <col className="w-[95px]" />
                    <col className="w-[80px]" />
                    <col className="w-[68px]" />
                    <col className="w-[60px]" />
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
                                    <Plus size={12} />
                                </button>
                                <button
                                    onClick={handleRemoveLastTramo}
                                    title="Eliminar último tramo"
                                    className="p-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                    disabled={tramos.length <= 1}
                                >
                                    <Minus size={12} />
                                </button>
                            </div>
                        </th>
                        <th className="border-r border-slate-300">ESTADO</th>
                        <th className="border-r border-slate-300 text-left pl-2">PUERTO</th>
                        <th className="border-r border-slate-300 text-right pr-2">DIST (NM)</th>
                        <th className="border-r border-slate-300 text-right pr-1">CLIMA %</th>
                        <th className="border-r border-slate-300 text-right pr-1">VEL (KN)</th>
                        <th className="border-r border-slate-300 text-right pr-2">DÍAS MAR</th>
                        <th className="border-r border-slate-300 text-right pr-2">DÍAS PTO</th>
                        
                        <th className="border-r border-slate-300 px-1 bg-sky-50/70">
                            <div className="flex items-center justify-between gap-1 px-0.5">
                                <span className="font-extrabold text-[9px] text-sky-950 uppercase tracking-tight">DEM (D)</span>
                                <div className="flex items-center rounded bg-slate-200/90 p-0.5 border border-slate-300 shadow-2xs gap-0.5">
                                    <button
                                        type="button"
                                        onClick={() => onDemurrageModeChange && onDemurrageModeChange('O')}
                                        title="O: Origen / Cotización Cargada (Demoras grabadas en la cotización)"
                                        className={`px-1.5 py-0.5 text-[8.5px] font-black rounded cursor-pointer transition-colors ${demurrageMode === 'O' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        O
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDemurrageModeChange && onDemurrageModeChange('P')}
                                        title="P: Promedio Histórico 24 Meses del Puerto"
                                        className={`px-1.5 py-0.5 text-[8.5px] font-black rounded cursor-pointer transition-colors ${demurrageMode === 'P' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        P
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDemurrageModeChange && onDemurrageModeChange('C')}
                                        title="C: Cero / Sin Demora Sugerida (0.00 d, permite sobreescribir)"
                                        className={`px-1.5 py-0.5 text-[8.5px] font-black rounded cursor-pointer transition-colors ${demurrageMode === 'C' ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        C
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
                        <td 
                            className="border-r border-slate-200 p-0 text-right bg-sky-50/30"
                            onMouseEnter={(e) => {
                                if (puertosConfig[0]?.action === 'CARGAR' && tramos[0]?.origin_port_id) {
                                    setHoveredDemurrage({
                                        portId: tramos[0].origin_port_id,
                                        vesselId: selectedVessel,
                                        action: puertosConfig[0].action,
                                        rect: e.currentTarget.getBoundingClientRect()
                                    });
                                }
                            }}
                            onMouseLeave={() => setHoveredDemurrage(null)}
                        >
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
                                <td 
                                    className="border-r border-slate-200 p-0 text-right bg-sky-50/30"
                                    onMouseEnter={(e) => {
                                        const action = puertosConfig[idx + 1]?.action;
                                        if ((action === 'CARGAR' || action === 'DESCARGAR') && tr.destination_port_id) {
                                            setHoveredDemurrage({
                                                portId: tr.destination_port_id,
                                                vesselId: selectedVessel,
                                                action: action,
                                                rect: e.currentTarget.getBoundingClientRect()
                                            });
                                        }
                                    }}
                                    onMouseLeave={() => setHoveredDemurrage(null)}
                                >
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
                                            onBlur={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) {
                                                    updatePuertoConfigField(idx + 1, 'freight_rate', val.toFixed(2));
                                                }
                                            }}
                                            className="w-full h-full bg-white border-0 px-1.5 text-right font-mono font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
                                            placeholder="23.00"
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
            {hoveredDemurrage && (
                <DemurrageStatsHoverPortal
                    portId={hoveredDemurrage.portId}
                    vesselId={hoveredDemurrage.vesselId}
                    action={hoveredDemurrage.action}
                    rect={hoveredDemurrage.rect}
                />
            )}
        </div>
    );
};
