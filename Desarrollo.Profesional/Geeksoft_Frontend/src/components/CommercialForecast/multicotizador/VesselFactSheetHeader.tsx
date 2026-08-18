import React from 'react';

export interface VesselFactSheetProps {
    selectedVessel: string;
    vessels: any[];
    vesselParams: any;
    bunkerPriceIfo: number;
    bunkerPriceMdo: number;
    bunkerSource: 'MAESTRO_CONTRATOS' | 'COTIZACION' | 'MAESTRO_BUNKER' | 'SOBREESCRITURA';
    handleVesselParamChange: (field: string, val: any) => void;
    handleIfoInputChange: (val: number) => void;
    handleMdoInputChange: (val: number) => void;
    handleBunkerSourceChange: (newSource: string) => void;
    fmtThousandSep: (val: number | string | undefined | null) => string;
}

export const VesselFactSheetHeader: React.FC<VesselFactSheetProps> = ({
    selectedVessel,
    vessels,
    vesselParams,
    bunkerPriceIfo,
    bunkerPriceMdo,
    bunkerSource,
    handleVesselParamChange,
    handleIfoInputChange,
    handleMdoInputChange,
    handleBunkerSourceChange,
    fmtThousandSep
}) => {
    const vObj = vessels.find(v => v.vessel_id === selectedVessel);
    let photoSrc = vObj?.image_url;
    if (!photoSrc || photoSrc.trim() === '') {
        const vid = (selectedVessel || vObj?.vessel_id || '').toUpperCase();
        const vname = (vObj?.vessel_name || '').toUpperCase();
        if (vid.includes('MOQUEGUA') || vname.includes('MOQUEGUA')) {
            photoSrc = '/moquegua_1.jpg';
        } else if (vid.includes('TABLONES') || vname.includes('TABLONES') || vid.includes('CONCON') || vname.includes('CONCON')) {
            photoSrc = '/tablones.jpeg';
        } else {
            photoSrc = '/moquegua_1.jpg';
        }
    }

    const [editingIfo, setEditingIfo] = React.useState<string | null>(null);
    const [editingMdo, setEditingMdo] = React.useState<string | null>(null);

    const fmtBunkerPrice = (val: number | string | undefined | null): string => {
        if (val === undefined || val === null || val === '' || val === 0) return '';
        const num = Number(val);
        if (isNaN(num)) return String(val);
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="bg-slate-50/50 border border-slate-200 rounded p-1 flex-shrink-0 mb-1">
            <table className="w-full border-collapse border border-slate-250 bg-white font-mono text-[11px] table-fixed">
                <thead>
                    <tr className="bg-slate-100 border-b border-slate-250 font-sans text-[9.5px] text-slate-500 font-bold uppercase tracking-wider h-7">
                        <th className="border-r border-slate-200 text-left pl-1.5 font-extrabold uppercase text-[9.5px] text-slate-700 truncate" style={{ width: '8.5%' }} title={`Buque: ${selectedVessel || 'SELECCIONAR'}`}>
                            VESSEL: {selectedVessel ? (vObj?.vessel_name || selectedVessel) : 'SELECCIONAR'}
                        </th>
                        <th className="border-r border-slate-200 text-right pr-2" style={{ width: '4.5%' }}>GRT (t)</th>
                        <th className="border-r border-slate-200 text-right pr-2" style={{ width: '6%' }}>DWT (t)</th>
                        <th className="border-r border-slate-200 text-right pr-2" style={{ width: '6%' }}>DWCC (t)</th>
                        <th className="border-r border-slate-200 text-right pr-2" style={{ width: '4.5%' }}>Speed (kn)</th>
                        <th className="border-r border-slate-200 text-right pr-2" style={{ width: '6.5%' }}>TCE Req ($/d)</th>
                        <th className="border-r border-slate-200 text-right pr-2" style={{ width: '4.5%' }}>LOA (m)</th>
                        <th className="border-r border-slate-200 text-right pr-2" style={{ width: '4.5%' }}>Beam (m)</th>
                        <th className="border-r border-slate-200 text-right pr-2" style={{ width: '4.5%' }}>Calado (m)</th>
                        <th className="border-r border-slate-200 text-center bg-slate-50 text-[9px]" style={{ width: '3.5%' }}>Fuel</th>
                        <th className="border-r border-slate-200 text-center" style={{ width: '6%' }}>Sea (t/d)</th>
                        <th className="border-r border-slate-200 text-center" style={{ width: '6%' }}>Idle (t/d)</th>
                        <th className="border-r border-slate-200 text-center" style={{ width: '6%' }}>Load (t/d)</th>
                        <th className="border-r border-slate-200 text-center" style={{ width: '6%' }}>Disch (t/d)</th>
                        <th className="border-r border-slate-200 text-center bg-red-50 text-red-800 font-bold" style={{ width: '7.5%' }}>PRECIO ($/T)</th>
                        <th className="text-center bg-slate-50 font-bold" style={{ width: '9%' }}>FUENTE</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b border-slate-200 h-8">
                        <td className="border-r border-slate-200 p-0.5 text-center align-middle bg-white" rowSpan={2}>
                            {!selectedVessel || selectedVessel.trim() === '' ? (
                                <div className="w-full h-full flex flex-col items-center justify-center p-1 text-slate-400 select-none bg-white font-sans font-bold text-[10px] uppercase">
                                    Seleccionar buque
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center p-0 bg-white overflow-hidden">
                                    <img
                                        src={photoSrc}
                                        alt={vObj?.vessel_name || selectedVessel}
                                        className="w-full h-full min-h-[50px] object-fill bg-white block"
                                        title={`Buque Oficial: ${vObj?.vessel_name || selectedVessel}`}
                                    />
                                </div>
                            )}
                        </td>
                        <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                            <input
                                type="text"
                                value={fmtThousandSep(vesselParams?.grt)}
                                onChange={(e) => handleVesselParamChange('grt', e.target.value.replace(/,/g, ''))}
                                className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                            <input
                                type="text"
                                value={fmtThousandSep(vesselParams?.dwt)}
                                onChange={(e) => handleVesselParamChange('dwt', e.target.value.replace(/,/g, ''))}
                                className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                            <input
                                type="text"
                                value={fmtThousandSep(vesselParams?.dwcc)}
                                onChange={(e) => handleVesselParamChange('dwcc', e.target.value.replace(/,/g, ''))}
                                className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                            <input
                                type="number"
                                step="0.1"
                                value={vesselParams?.vessel_speed ?? ''}
                                onChange={(e) => handleVesselParamChange('vessel_speed', e.target.value)}
                                className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                            <input
                                type="text"
                                value={fmtThousandSep(vesselParams?.tce_required)}
                                onChange={(e) => handleVesselParamChange('tce_required', e.target.value.replace(/,/g, ''))}
                                className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                            <input
                                type="number"
                                step="0.1"
                                value={vesselParams?.length ?? ''}
                                onChange={(e) => handleVesselParamChange('length', e.target.value)}
                                className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="LOA"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                            <input
                                type="number"
                                step="0.1"
                                value={vesselParams?.beam ?? ''}
                                onChange={(e) => handleVesselParamChange('beam', e.target.value)}
                                className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Beam"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-right align-middle" rowSpan={2}>
                            <input
                                type="number"
                                step="0.1"
                                value={vesselParams?.draft_m ?? ''}
                                onChange={(e) => handleVesselParamChange('draft_m', e.target.value)}
                                className="w-full h-8 bg-white border-0 p-0 pr-2 text-right font-mono font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Calado"
                            />
                        </td>
                        <td className="border-r border-slate-200 text-center bg-slate-100 font-sans font-bold text-[9px] text-slate-500 uppercase select-none align-middle">IFO</td>
                        <td className="border-r border-slate-200 p-0 text-center align-middle">
                            <input
                                type="number"
                                step="0.1"
                                value={vesselParams?.consumption_sea_ifo ?? ''}
                                onChange={(e) => handleVesselParamChange('consumption_sea_ifo', e.target.value)}
                                className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-center align-middle">
                            <input
                                type="number"
                                step="0.1"
                                value={vesselParams?.consumption_idle_ifo ?? ''}
                                onChange={(e) => handleVesselParamChange('consumption_idle_ifo', e.target.value)}
                                className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-center align-middle">
                            <input
                                type="number"
                                step="0.1"
                                value={vesselParams?.consumption_load_ifo ?? ''}
                                onChange={(e) => handleVesselParamChange('consumption_load_ifo', e.target.value)}
                                className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-center align-middle">
                            <input
                                type="number"
                                step="0.1"
                                value={vesselParams?.consumption_disch_ifo ?? ''}
                                onChange={(e) => handleVesselParamChange('consumption_disch_ifo', e.target.value)}
                                className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-center align-middle bg-red-600 h-8">
                            <input
                                type="text"
                                placeholder="0.00"
                                value={editingIfo !== null ? editingIfo : (bunkerPriceIfo !== undefined && bunkerPriceIfo !== null && bunkerPriceIfo !== 0 ? fmtBunkerPrice(bunkerPriceIfo) : '')}
                                onFocus={() => setEditingIfo(bunkerPriceIfo !== undefined && bunkerPriceIfo !== null && bunkerPriceIfo !== 0 ? String(bunkerPriceIfo) : '')}
                                onBlur={() => setEditingIfo(null)}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/,/g, '');
                                    if (/^\d*\.?\d*$/.test(raw)) {
                                        setEditingIfo(e.target.value);
                                        handleIfoInputChange(raw === '' ? 0 : Number(raw));
                                    }
                                }}
                                className="w-full h-8 bg-red-600 border-0 p-0 text-center text-xs font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-red-400 align-middle"
                            />
                        </td>
                        <td className="p-1 text-center align-middle bg-slate-50 font-mono h-16" rowSpan={2}>
                            <div className="relative w-full h-full flex flex-col justify-center items-center px-1">
                                <select
                                    value={bunkerSource}
                                    onChange={(e) => handleBunkerSourceChange(e.target.value)}
                                    className={`w-full h-8 px-1.5 pr-6 border rounded text-[9.5px] font-extrabold cursor-pointer appearance-none text-center transition-all shadow-sm focus:outline-none focus:ring-1 ${
                                        bunkerSource === 'MAESTRO_CONTRATOS' ? 'bg-blue-50 text-blue-900 border-blue-300 focus:ring-blue-500' :
                                        bunkerSource === 'COTIZACION' ? 'bg-purple-50 text-purple-900 border-purple-300 focus:ring-purple-500' :
                                        bunkerSource === 'MAESTRO_BUNKER' ? 'bg-emerald-50 text-emerald-900 border-emerald-300 focus:ring-emerald-500' :
                                        'bg-amber-50 text-amber-900 border-amber-300 focus:ring-amber-500'
                                    }`}
                                >
                                    <option value="MAESTRO_CONTRATOS">📑 Maestro de Contratos</option>
                                    <option value="COTIZACION">📌 Cotización / Viaje Actual</option>
                                    <option value="MAESTRO_BUNKER">🛢️ Maestro Búnker General</option>
                                    <option value="SOBREESCRITURA">✍️ Sobreescritura Manual</option>
                                </select>
                            </div>
                        </td>
                    </tr>
                    <tr className="border-b border-slate-200 h-8">
                        <td className="border-r border-slate-200 text-center bg-slate-100 font-sans font-bold text-[9px] text-slate-500 uppercase select-none align-middle">MDO</td>
                        <td className="border-r border-slate-200 p-0 text-center align-middle">
                            <input
                                type="number"
                                step="0.1"
                                value={vesselParams?.consumption_sea_mdo ?? ''}
                                onChange={(e) => handleVesselParamChange('consumption_sea_mdo', e.target.value)}
                                className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-center align-middle">
                            <input
                                type="number"
                                step="0.1"
                                value={vesselParams?.consumption_idle_mdo ?? ''}
                                onChange={(e) => handleVesselParamChange('consumption_idle_mdo', e.target.value)}
                                className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-center align-middle">
                            <input
                                type="number"
                                step="0.1"
                                value={vesselParams?.consumption_load_mdo ?? ''}
                                onChange={(e) => handleVesselParamChange('consumption_load_mdo', e.target.value)}
                                className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-center align-middle">
                            <input
                                type="number"
                                step="0.1"
                                value={vesselParams?.consumption_disch_mdo ?? ''}
                                onChange={(e) => handleVesselParamChange('consumption_disch_mdo', e.target.value)}
                                className="w-full h-full min-h-[26px] bg-white border-0 p-0 text-center text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 align-middle"
                            />
                        </td>
                        <td className="border-r border-slate-200 p-0 text-center align-middle bg-red-600 h-8">
                            <input
                                type="text"
                                placeholder="0.00"
                                value={editingMdo !== null ? editingMdo : (bunkerPriceMdo !== undefined && bunkerPriceMdo !== null && bunkerPriceMdo !== 0 ? fmtBunkerPrice(bunkerPriceMdo) : '')}
                                onFocus={() => setEditingMdo(bunkerPriceMdo !== undefined && bunkerPriceMdo !== null && bunkerPriceMdo !== 0 ? String(bunkerPriceMdo) : '')}
                                onBlur={() => setEditingMdo(null)}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/,/g, '');
                                    if (/^\d*\.?\d*$/.test(raw)) {
                                        setEditingMdo(e.target.value);
                                        handleMdoInputChange(raw === '' ? 0 : Number(raw));
                                    }
                                }}
                                className="w-full h-8 bg-red-600 border-0 p-0 text-center text-xs font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-red-400 align-middle"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
