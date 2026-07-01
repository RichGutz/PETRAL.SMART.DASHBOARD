import React, { useState, useEffect, useMemo } from 'react';
import { RouteMatrix } from './RouteMatrix';
import { ForecastService } from '../../services/api';
import { Play, Anchor, CheckCircle, X, ChevronDown, ChevronRight, Save, FolderOpen } from 'lucide-react';

export const SpotRouter: React.FC = () => {
    const [vessels, setVessels] = useState<any[]>([]);
    const [selectedVessel, setSelectedVessel] = useState('');

    const [positioning, setPositioning] = useState<any>(null);
    const [laden, setLaden] = useState<any>(null);
    const [returnLeg, setReturnLeg] = useState<any>(null);

    const [result, setResult] = useState<any>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // What-If slider state
    const [baseFreightRate, setBaseFreightRate] = useState<number>(0);
    const [whatIfFreightRate, setWhatIfFreightRate] = useState<number>(0);

    // Demoras adicionales en puerto (horas)
    const [delayLoading, setDelayLoading] = useState<number>(0);
    const [delayDischarging, setDelayDischarging] = useState<number>(0);

    // Persistence Scenario State (Spot Route)
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [routeName, setRouteName] = useState('');
    const [author, setAuthor] = useState('Demo User');
    const [isSaving, setIsSaving] = useState(false);

    const [showLoadModal, setShowLoadModal] = useState(false);
    const [savedSpots, setSavedSpots] = useState<any[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(false);

    const [loadedSpotName, setLoadedSpotName] = useState<string | null>(null);

    useEffect(() => {
        ForecastService.getVessels().then(setVessels);
    }, []);

    // ─── VALIDATIONS ─────────────────────────────────────────────────────────
    const isGeographicallyValid = useMemo(() => {
        if (positioning && laden) {
            if (positioning.destination_port_id !== laden.origin_port_id) return false;
        }
        if (laden && returnLeg) {
            if (laden.destination_port_id !== returnLeg.origin_port_id) return false;
        }
        return true;
    }, [positioning, laden, returnLeg]);

    const hasRequiredFields = useMemo(() => {
        if (!selectedVessel) return false;
        if (!laden) return false;
        if (!laden.quantity || laden.quantity <= 0) return false;
        if (!laden.freight_rate || laden.freight_rate <= 0) return false;
        return true;
    }, [selectedVessel, laden]);

    const canCalculate = isGeographicallyValid && hasRequiredFields;

    // ─── LIVE PnL RECALCULATION (client-side, no backend call) ───────────────
    const livePnL = useMemo(() => {
        if (!result) return null;
        const Q = laden?.quantity || 0;
        const grossRevenue = whatIfFreightRate * Q;
        const portCosts = result.consolidated.total_port_costs || 0;
        const bunkerCosts = result.consolidated.total_bunker_costs || 0;
        const voyageResult = grossRevenue - portCosts - bunkerCosts;
        const totalDays = result.consolidated.total_days || 1;
        const tce = voyageResult / totalDays;
        const base = grossRevenue > 0 ? grossRevenue : 1;
        return {
            grossRevenue,
            portCosts,
            bunkerCosts,
            voyageResult,
            tce,
            portPct: (portCosts / base) * 100,
            bunkerPct: (bunkerCosts / base) * 100,
            voyagePct: (voyageResult / base) * 100,
        };
    }, [result, whatIfFreightRate, laden]);

    // ─── HELPERS ─────────────────────────────────────────────────────────────
    const fmt = (n: number, dec = 0) =>
        n.toLocaleString(undefined, { maximumFractionDigits: dec, minimumFractionDigits: dec });
    const fmtPct = (n: number) => `${n.toFixed(1)}%`;

    // ─── DRAG & DROP ──────────────────────────────────────────────────────────
    const handleDragStart = (e: React.DragEvent, route: any) => {
        e.dataTransfer.setData('application/json', JSON.stringify(route));
    };

    const handleDrop = (e: React.DragEvent, bucket: 'pos' | 'laden' | 'ret') => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        const legData = {
            route_distance: data.route_distance,
            weather_factor: bucket === 'laden' ? data.weather_factor_laden : data.weather_factor_ballast,
            label: `${data.origin_port_id} -> ${data.destination_port_id}`,
            origin_port_id: data.origin_port_id,
            destination_port_id: data.destination_port_id,
            quantity: 0,
            freight_rate: 0,
        };
        if (bucket === 'pos') setPositioning(legData);
        if (bucket === 'laden') setLaden(legData);
        if (bucket === 'ret') setReturnLeg(legData);
    };

    const handleClearBucket = (bucket: 'pos' | 'laden' | 'ret') => {
        if (bucket === 'pos') setPositioning(null);
        if (bucket === 'laden') setLaden(null);
        if (bucket === 'ret') setReturnLeg(null);
    };

    // ─── CALCULATE & PERSISTENCE ───────────────────────────────────────────────────────────
    const triggerCalculation = async (vesselId: string, pos: any, lad: any, ret: any, delayL: number, delayD: number) => {
        if (!vesselId) return;
        try {
            const updatedLaden = lad ? {
                ...lad,
                port_delay_hours_loading: delayL,
                port_delay_hours_discharging: delayD
            } : null;

            const payload = {
                vessel_id: vesselId,
                legs: { 
                    positioning: pos, 
                    laden: updatedLaden, 
                    return: ret 
                },
            };
            const res = await ForecastService.calculateSpot(payload);
            const fr = lad?.freight_rate || 0;
            setBaseFreightRate(fr);
            setWhatIfFreightRate(fr);
            setResult(res);
        } catch (error) {
            console.error("Error al calcular ruta spot:", error);
        }
    };

    const handleCalculate = async () => {
        if (!selectedVessel) return alert('Seleccione un buque');
        await triggerCalculation(selectedVessel, positioning, laden, returnLeg, delayLoading, delayDischarging);
    };

    const handleSaveSpot = async () => {
        if (!routeName) return alert('Ingrese un nombre para la ruta spot');
        try {
            setIsSaving(true);
            // Inferir país desde el puerto destino de la pierna laden
            const ladenDest = (laden?.destination_port_id || "").toLowerCase();
            const pais = (ladenDest.includes("mejillones") || ladenDest.includes("barquito"))
                ? "Chile"
                : "Peru";

            const payload = {
                name: routeName,
                description: author,
                pais,
                legs_data: {
                    vessel_id: selectedVessel,
                    legs: { 
                        positioning, 
                        laden: laden ? {
                            ...laden,
                            port_delay_hours_loading: delayLoading,
                            port_delay_hours_discharging: delayDischarging
                        } : null, 
                        return: returnLeg 
                    }
                }
            };
            const res = await ForecastService.saveSpot(payload);
            alert(`Ruta spot guardada con éxito (ID: ${res.spot_id})`);
            setLoadedSpotName(routeName);
            setShowSaveModal(false);
            setRouteName('');
        } catch (e) {
            alert('Error al guardar la ruta spot');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoadClick = async () => {
        try {
            setIsLoadingList(true);
            setShowLoadModal(true);
            const list = await ForecastService.listSpots();
            setSavedSpots(list);
        } catch (e) {
            alert('Error al listar las rutas spot guardadas');
        } finally {
            setIsLoadingList(false);
        }
    };

    const handleLoadSelected = async (spot: any) => {
        try {
            const legsData = spot?.legs_data;
            if (!legsData) return;
            
            setSelectedVessel(legsData.vessel_id || '');
            setPositioning(legsData.legs?.positioning || null);
            
            const ladenLeg = legsData.legs?.laden || null;
            setLaden(ladenLeg);
            setDelayLoading(ladenLeg?.port_delay_hours_loading || 0);
            setDelayDischarging(ladenLeg?.port_delay_hours_discharging || 0);
            
            setReturnLeg(legsData.legs?.return || null);
            setShowLoadModal(false);
            setLoadedSpotName(spot.name || 'Ruta Spot');
            
            // Disparar recálculo reactivo con micro-delay para que React asiente los estados
            setTimeout(() => {
                triggerCalculation(
                    legsData.vessel_id, 
                    legsData.legs?.positioning, 
                    ladenLeg, 
                    legsData.legs?.return, 
                    ladenLeg?.port_delay_hours_loading || 0, 
                    ladenLeg?.port_delay_hours_discharging || 0
                );
            }, 100);
        } catch (e) {
            alert('Error al cargar la ruta seleccionada');
        }
    };

    const toggleRow = (rowName: string) => {
        setExpandedRow(prev => (prev === rowName ? null : rowName));
    };

    // ─── AUDIT GRID ───────────────────────────────────────────────────────────
    const renderAuditGrid = (rowKey: string) => {
        if (expandedRow !== rowKey || !result) return null;

        // Gross Revenue: audit client-side con P×Q
        if (rowKey === 'gross_revenue') {
            const Q = laden?.quantity || 0;
            return (
                <tr className="bg-emerald-50/60 border-b border-emerald-100">
                    <td colSpan={3} className="p-3">
                        <div className="border border-emerald-200 rounded-lg bg-emerald-50 p-3 shadow-inner">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                                Fórmula: P × Q
                            </span>
                            <div className="flex flex-col gap-1 mt-2">
                                <div className="text-[10px] text-slate-500 font-mono">
                                    Flete ($/TM) × Cantidad (TM)
                                </div>
                                <div className="text-[12px] font-mono mt-1">
                                    <span className="text-orange-600 font-black">${whatIfFreightRate.toFixed(2)}</span>
                                    <span className="text-slate-400"> × </span>
                                    <span className="text-orange-600 font-black">{fmt(Q)} TM</span>
                                    <span className="text-slate-400"> = </span>
                                    <span className="text-emerald-600 font-black">${fmt(livePnL?.grossRevenue || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            );
        }

        // Audits estándar del backend (port_costs, bunker_costs, sea_days, port_days)
        const posAudit = result.legs_summary.positioning?.audit_trail?.[rowKey];
        const ladenAudit = result.legs_summary.laden?.audit_trail?.[rowKey];
        const retAudit = result.legs_summary.return?.audit_trail?.[rowKey];

        if (!posAudit && !ladenAudit && !retAudit) return null;

        const renderCell = (auditObj: any) => {
            if (!auditObj)
                return <div className="text-slate-400 italic mt-2 text-[10px]">N/A para este tramo</div>;
            return (
                <div className="flex flex-col gap-1 mt-2">
                    <div
                        className="text-[10px] text-slate-500 font-mono tracking-tight"
                        dangerouslySetInnerHTML={{ __html: auditObj.formula }}
                    />
                    <div
                        className="text-[11px] font-mono mt-1"
                        dangerouslySetInnerHTML={{ __html: auditObj.values }}
                    />
                </div>
            );
        };

        if (rowKey === 'bunker_costs') {
            const delayLoadingAudit = result.legs_summary.laden?.delay_loading_audit;
            const delayDischAudit = result.legs_summary.laden?.delay_disch_audit;

            return (
                <tr className="bg-slate-100/50 border-b border-slate-200 animate-fade-in">
                    <td colSpan={3} className="p-3">
                        <div className="grid grid-cols-5 gap-2 border border-slate-200 rounded-lg bg-white p-3 shadow-inner">
                            <div className="flex flex-col border-r border-slate-200 pr-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">1. Posicionamiento</span>
                                {renderCell(posAudit)}
                            </div>
                            <div className="flex flex-col border-r border-slate-200 pr-2">
                                <span className="text-[10px] font-bold text-amber-600 uppercase">2. Demora Entrada</span>
                                {renderCell(delayLoadingAudit)}
                            </div>
                            <div className="flex flex-col border-r border-slate-200 pr-2">
                                <span className="text-[10px] font-bold text-teal-600 uppercase">3. Tránsito Normal</span>
                                {renderCell(ladenAudit)}
                            </div>
                            <div className="flex flex-col border-r border-slate-200 pr-2">
                                <span className="text-[10px] font-bold text-amber-600 uppercase">4. Demora Salida</span>
                                {renderCell(delayDischAudit)}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">5. Retorno a Base</span>
                                {renderCell(retAudit)}
                            </div>
                        </div>
                    </td>
                </tr>
            );
        }

        return (
            <tr className="bg-slate-100/50 border-b border-slate-200">
                <td colSpan={3} className="p-3">
                    <div className="grid grid-cols-3 gap-2 border border-slate-200 rounded-lg bg-white p-3 shadow-inner">
                        <div className="flex flex-col border-r border-slate-200 pr-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Posicionamiento</span>
                            {renderCell(posAudit)}
                        </div>
                        <div className="flex flex-col border-r border-slate-200 pr-2">
                            <span className="text-[10px] font-bold text-teal-600 uppercase">Carga a Descarga</span>
                            {renderCell(ladenAudit)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Retorno a Base</span>
                            {renderCell(retAudit)}
                        </div>
                    </div>
                </td>
            </tr>
        );
    };

    // ─── BUCKET RENDERER ─────────────────────────────────────────────────────
    const renderBucket = (title: string, data: any, type: 'pos' | 'laden' | 'ret', color: string) => (
        <div
            className={`border-2 border-dashed rounded-lg p-4 flex flex-col gap-2 transition-colors ${
                data ? 'bg-white border-solid' : 'bg-slate-50'
            }`}
            style={{ borderColor: color }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, type)}
        >
            <div className="font-bold text-sm text-center" style={{ color }}>
                {title}
            </div>
            {!data ? (
                <div className="text-xs text-slate-400 text-center py-4">Arrastra una ruta aquí</div>
            ) : (
                <div className="bg-slate-100 p-2 rounded text-xs mt-2 relative group">
                    <button
                        onClick={() => handleClearBucket(type)}
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Borrar ruta"
                    >
                        <X size={12} />
                    </button>
                    <div className="font-bold text-slate-700">{data.label}</div>
                    <div>
                        {data.route_distance} NM | W-Factor: {data.weather_factor}
                    </div>
                    {type === 'laden' && (
                        <div className="mt-2 flex gap-2">
                            <input
                                type="number"
                                placeholder="Carga (MT)"
                                className="w-1/2 p-1 border rounded"
                                value={data.quantity || ''}
                                onChange={e => setLaden({ ...data, quantity: Number(e.target.value) })}
                            />
                            <input
                                type="number"
                                placeholder="Flete ($)"
                                className="w-1/2 p-1 border rounded"
                                value={data.freight_rate || ''}
                                onChange={e => setLaden({ ...data, freight_rate: Number(e.target.value) })}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    // ─── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div className="flex h-[calc(100vh-140px)] gap-4 overflow-hidden pb-4">
            {/* ── Izquierda: Matriz + Constructor ── */}
            <div className="w-1/2 flex flex-col gap-4 overflow-y-auto pr-2">
                <div className="shrink-0">
                    <RouteMatrix onDragStart={handleDragStart} />
                </div>

                <div className="bg-white rounded-lg shadow border border-slate-200 p-4 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-slate-700 flex items-center gap-2 flex-wrap">
                            <Anchor size={18} /> Construcción del Viaje
                            {loadedSpotName && (
                                <span className="text-[10px] bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded font-bold animate-fade-in">
                                    Ruta Activa: {loadedSpotName}
                                </span>
                            )}
                        </h2>
                        <select
                            className="border p-1 text-sm rounded"
                            value={selectedVessel}
                            onChange={e => setSelectedVessel(e.target.value)}
                        >
                            <option value="">Seleccione Buque...</option>
                            {vessels.map(v => (
                                <option key={v.vessel_id} value={v.vessel_id}>
                                    {v.vessel_id}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-row items-stretch justify-between gap-3">
                        {/* Paso 1: Posicionamiento + Explicación */}
                        <div className="flex-1 flex flex-col gap-2">
                            {renderBucket('1. Posicionamiento', positioning, 'pos', '#94a3b8')}
                            <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[10px] text-slate-500 text-center shadow-sm flex-1">
                                <strong>Ballast Leg:</strong> Viaje en lastre (vacío) hacia el puerto donde iniciará la carga.
                            </div>
                        </div>
                        
                        {/* Brick 1: Demora en Entrada Carga */}
                        <div className="flex flex-col items-center justify-center p-3 border rounded-lg bg-slate-50 border-slate-200 text-center w-28 shrink-0 shadow-sm h-fit self-start">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Demora Entrada</span>
                            <span className="text-[8px] text-slate-400 mb-1.5">(Puerto Carga)</span>
                            <div className="relative w-full">
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full text-center border border-slate-300 rounded p-1 pr-6 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500" 
                                    placeholder="0"
                                    value={delayLoading || ''}
                                    onChange={(e) => setDelayLoading(Math.max(0, Number(e.target.value)))}
                                />
                                <span className="absolute right-1.5 top-1.5 text-[8px] text-slate-400 font-bold pointer-events-none">hrs</span>
                            </div>
                        </div>

                        {/* Paso 2: Carga a Descarga + Explicación */}
                        <div className="flex-1 flex flex-col gap-2">
                            {renderBucket('2. Carga a Descarga', laden, 'laden', '#0f766e')}
                            <div className="bg-teal-50 border border-teal-100 rounded p-2 text-[10px] text-teal-700 text-center shadow-sm flex-1">
                                <strong>Laden Leg:</strong> Tramo comercial principal. Aplican tarifas, port costs y demoras.
                            </div>
                        </div>

                        {/* Brick 2: Demora en Salida Descarga */}
                        <div className="flex flex-col items-center justify-center p-3 border rounded-lg bg-slate-50 border-slate-200 text-center w-28 shrink-0 shadow-sm h-fit self-start">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Demora Salida</span>
                            <span className="text-[8px] text-slate-400 mb-1.5">(Puerto Descarga)</span>
                            <div className="relative w-full">
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full text-center border border-slate-300 rounded p-1 pr-6 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500" 
                                    placeholder="0"
                                    value={delayDischarging || ''}
                                    onChange={(e) => setDelayDischarging(Math.max(0, Number(e.target.value)))}
                                />
                                <span className="absolute right-1.5 top-1.5 text-[8px] text-slate-400 font-bold pointer-events-none">hrs</span>
                            </div>
                        </div>

                        {/* Paso 3: Retorno a Base + Explicación */}
                        <div className="flex-1 flex flex-col gap-2">
                            {renderBucket('3. Retorno a Base', returnLeg, 'ret', '#94a3b8')}
                            <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[10px] text-slate-500 text-center shadow-sm flex-1">
                                <strong>Return Leg:</strong> Viaje en lastre de regreso para liberar el buque al mercado.
                            </div>
                        </div>
                    </div>

                    {!isGeographicallyValid && (
                        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 text-center font-semibold shadow-sm animate-pulse">
                            ⚠️ Inconsistencia geográfica: El puerto destino de un tramo debe coincidir con el origen del tramo siguiente.
                        </div>
                    )}

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleCalculate}
                            disabled={!canCalculate}
                            className="flex-grow bg-petral-teal disabled:bg-slate-300 text-white py-2 rounded font-bold shadow hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all"
                        >
                            <Play size={16} /> Procesar Viaje Spot
                        </button>
                        <button
                            onClick={() => setShowSaveModal(true)}
                            disabled={!result}
                            className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all text-slate-700 text-sm"
                            title="Guardar Ruta Spot"
                        >
                            <Save size={16} /> Guardar
                        </button>
                        <button
                            onClick={handleLoadClick}
                            className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-bold shadow-sm flex justify-center items-center gap-2 transition-all text-slate-700 text-sm"
                            title="Cargar Ruta Spot"
                        >
                            <FolderOpen size={16} /> Cargar
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Derecha: Panel de Resultados PnL ── */}
            <div className="w-1/2 overflow-y-auto">
                {result && livePnL ? (
                    <div className="bg-white text-slate-800 rounded-lg shadow border border-slate-200 flex flex-col">
                        {/* Header con TCE live */}
                        <div className="bg-slate-800 text-white p-3 rounded-t-lg font-bold flex justify-between items-center shrink-0">
                            <span className="flex items-center gap-2">
                                <CheckCircle size={16} /> GyP Consolidado (PnL)
                            </span>
                            <span className="text-emerald-400 font-mono text-lg tracking-tight">
                                TCE: ${fmt(livePnL.tce)} / día
                            </span>
                        </div>

                        {/* ── Slider What-If ── */}
                        <div className="bg-gradient-to-r from-slate-50 to-teal-50 border-b border-slate-200 px-4 py-3 shrink-0">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                    🎚️ Tarifa What-If
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-mono font-black text-teal-700">
                                        ${whatIfFreightRate.toFixed(2)} / TM
                                    </span>
                                    {whatIfFreightRate !== baseFreightRate && (
                                        <span
                                            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                                whatIfFreightRate > baseFreightRate
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-rose-100 text-rose-700'
                                            }`}
                                        >
                                            {whatIfFreightRate > baseFreightRate ? '▲' : '▼'}
                                            {Math.abs(whatIfFreightRate - baseFreightRate).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <input
                                type="range"
                                min={baseFreightRate - 10}
                                max={baseFreightRate + 10}
                                step={0.5}
                                value={whatIfFreightRate}
                                onChange={e => setWhatIfFreightRate(Number(e.target.value))}
                                className="w-full accent-teal-600 cursor-pointer h-2"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                                <span>${(baseFreightRate - 10).toFixed(0)}</span>
                                <span className="text-teal-600 font-bold">
                                    Base: ${baseFreightRate.toFixed(2)}
                                </span>
                                <span>${(baseFreightRate + 10).toFixed(0)}</span>
                            </div>
                        </div>

                        {/* ── Tabla PnL ── */}
                        <div className="flex-1 overflow-auto p-4">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-200">
                                        <th className="p-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            Concepto
                                        </th>
                                        <th className="p-2 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            Valor (USD)
                                        </th>
                                        <th className="p-2 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            % Venta
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Viajes */}
                                    <tr className="border-b border-slate-100">
                                        <td className="p-2 font-bold text-slate-700">Viajes</td>
                                        <td className="p-2 text-right font-mono font-semibold">1</td>
                                        <td className="p-2 text-right font-mono text-slate-300 text-xs">—</td>
                                    </tr>

                                    {/* Toneladas */}
                                    <tr className="border-b border-slate-100">
                                        <td className="p-2 font-bold text-slate-700">Toneladas</td>
                                        <td className="p-2 text-right font-mono font-semibold">
                                            {fmt(laden?.quantity || 0)} MT
                                        </td>
                                        <td className="p-2 text-right font-mono text-slate-300 text-xs">—</td>
                                    </tr>

                                    {/* Gross Revenue — expandable P×Q */}
                                    <tr
                                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                                        onClick={() => toggleRow('gross_revenue')}
                                    >
                                        <td className="p-2 font-bold text-slate-700 flex items-center gap-1">
                                            {expandedRow === 'gross_revenue' ? (
                                                <ChevronDown size={14} />
                                            ) : (
                                                <ChevronRight size={14} />
                                            )}
                                            Gross Revenue
                                        </td>
                                        <td className="p-2 text-right font-mono text-emerald-600 font-bold">
                                            ${fmt(livePnL.grossRevenue)}
                                        </td>
                                        <td className="p-2 text-right font-mono text-emerald-500 text-xs font-bold">
                                            100%
                                        </td>
                                    </tr>
                                    {renderAuditGrid('gross_revenue')}
                                    {expandedRow === 'gross_revenue' && (
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <td
                                                className="p-2 pl-8 text-[11px] text-slate-500 font-semibold italic"
                                                colSpan={2}
                                            >
                                                ↳ Demurrage (No sumado en Voyage Result)
                                            </td>
                                            <td className="p-2 text-right font-mono text-emerald-500 text-xs">
                                                ${fmt(result.consolidated.total_demurrage_revenue || 0)}
                                            </td>
                                        </tr>
                                    )}

                                    {/* Port Costs */}
                                    <tr
                                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                                        onClick={() => toggleRow('port_costs')}
                                    >
                                        <td className="p-2 font-bold text-slate-700 flex items-center gap-1">
                                            {expandedRow === 'port_costs' ? (
                                                <ChevronDown size={14} />
                                            ) : (
                                                <ChevronRight size={14} />
                                            )}
                                            Port Costs
                                        </td>
                                        <td className="p-2 text-right font-mono text-rose-600 font-semibold">
                                            -${fmt(livePnL.portCosts)}
                                        </td>
                                        <td className="p-2 text-right font-mono text-rose-400 text-xs font-semibold">
                                            {fmtPct(livePnL.portPct)}
                                        </td>
                                    </tr>
                                    {renderAuditGrid('port_costs')}

                                    {/* Bunker Costs */}
                                    <tr
                                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                                        onClick={() => toggleRow('bunker_costs')}
                                    >
                                        <td className="p-2 font-bold text-slate-700 flex items-center gap-1">
                                            {expandedRow === 'bunker_costs' ? (
                                                <ChevronDown size={14} />
                                            ) : (
                                                <ChevronRight size={14} />
                                            )}
                                            Bunker Costs
                                        </td>
                                        <td className="p-2 text-right font-mono text-amber-600 font-semibold">
                                            -${fmt(livePnL.bunkerCosts)}
                                        </td>
                                        <td className="p-2 text-right font-mono text-amber-400 text-xs font-semibold">
                                            {fmtPct(livePnL.bunkerPct)}
                                        </td>
                                    </tr>
                                    {renderAuditGrid('bunker_costs')}

                                    {/* Voyage Result */}
                                    <tr className="border-b-2 border-slate-300 bg-emerald-50">
                                        <td className="p-3 font-black text-slate-800">Voyage Result</td>
                                        <td
                                            className={`p-3 text-right font-mono font-black text-lg ${
                                                livePnL.voyageResult >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                            }`}
                                        >
                                            ${fmt(livePnL.voyageResult)}
                                        </td>
                                        <td
                                            className={`p-3 text-right font-mono font-bold text-sm ${
                                                livePnL.voyagePct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                            }`}
                                        >
                                            {fmtPct(livePnL.voyagePct)}
                                        </td>
                                    </tr>

                                    {/* TCE Diario (Real) */}
                                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-2 pl-4 font-bold text-slate-700">TCE Diario (Real)</td>
                                        <td className="p-2 text-right font-mono text-slate-700 font-semibold" colSpan={2}>
                                            ${fmt(livePnL.tce)} / día
                                        </td>
                                    </tr>

                                    {/* TCE Requerido */}
                                    <tr className="border-b border-slate-200 hover:bg-slate-50">
                                        <td className="p-2 pl-4 font-bold text-slate-700">TCE Requerido</td>
                                        <td className="p-2 text-right font-mono text-slate-500 font-semibold" colSpan={2}>
                                            ${fmt(result.consolidated.tce_required || 0)} / día
                                        </td>
                                    </tr>

                                    {/* KPIs Operativos */}
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <td className="p-2 font-bold text-slate-700" colSpan={3}>
                                            KPIs OPERATIVOS
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="p-2 pl-6 text-slate-600">Distancia Total (NM)</td>
                                        <td className="p-2 text-right font-mono font-semibold">
                                            {fmt(result.consolidated.total_distance)}
                                        </td>
                                        <td className="p-2 text-right font-mono text-slate-300 text-xs">—</td>
                                    </tr>
                                    <tr
                                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                                        onClick={() => toggleRow('sea_days')}
                                    >
                                        <td className="p-2 pl-6 text-slate-600 flex items-center gap-1">
                                            {expandedRow === 'sea_days' ? (
                                                <ChevronDown size={14} />
                                            ) : (
                                                <ChevronRight size={14} />
                                            )}
                                            Días de Mar
                                        </td>
                                        <td className="p-2 text-right font-mono font-semibold">
                                            {fmt(result.consolidated.total_sea_days, 1)}
                                        </td>
                                        <td className="p-2 text-right font-mono text-slate-300 text-xs">—</td>
                                    </tr>
                                    {renderAuditGrid('sea_days')}

                                    <tr
                                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                                        onClick={() => toggleRow('port_days')}
                                    >
                                        <td className="p-2 pl-6 text-slate-600 flex items-center gap-1">
                                            {expandedRow === 'port_days' ? (
                                                <ChevronDown size={14} />
                                            ) : (
                                                <ChevronRight size={14} />
                                            )}
                                            Días en Puerto
                                        </td>
                                        <td className="p-2 text-right font-mono font-semibold">
                                            {fmt(result.consolidated.total_port_days, 1)}
                                        </td>
                                        <td className="p-2 text-right font-mono text-slate-300 text-xs">—</td>
                                    </tr>
                                    {renderAuditGrid('port_days')}

                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <td className="p-2 pl-6 font-bold text-slate-700">Duración Total (Días)</td>
                                        <td className="p-2 text-right font-mono font-bold text-slate-800">
                                            {fmt(result.consolidated.total_days, 1)}
                                        </td>
                                        <td className="p-2 text-right font-mono text-slate-300 text-xs">—</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="h-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                        <Anchor size={48} className="mb-4 text-slate-300 opacity-50" />
                        <p>Los resultados del PnL Spot aparecerán aquí</p>
                    </div>
                )}
            </div>
            
            {/* Save Modal (Spot Route) */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-xl relative text-left">
                        <button 
                            onClick={() => setShowSaveModal(false)} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X size={20}/>
                        </button>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Guardar Ruta Spot</h3>
                        
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-600 mb-1 block">Nombre de la Ruta</label>
                                <input 
                                    type="text" 
                                    value={routeName} 
                                    onChange={(e) => setRouteName(e.target.value)} 
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-petral-teal focus:outline-none" 
                                    placeholder="Ej. Spot Callao a Mejillones" 
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-600 mb-1 block">Usuario / Autor</label>
                                <input 
                                    type="text" 
                                    value={author} 
                                    onChange={(e) => setAuthor(e.target.value)} 
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 focus:outline-none" 
                                />
                            </div>
                            <div className="flex flex-col gap-2 mt-2">
                                <button 
                                    onClick={handleSaveSpot} 
                                    disabled={isSaving}
                                    className={`relative overflow-hidden w-full font-bold py-2 rounded-full transition-colors ${
                                        isSaving ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-petral-teal hover:bg-teal-600 text-white shadow-md'
                                    }`}
                                >
                                    {isSaving && <div className="absolute inset-0 bg-white/20 animate-pulse" style={{ width: '100%' }}></div>}
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {isSaving ? 'Procesando...' : 'Guardar Ruta'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Modal (Spot Route) */}
            {showLoadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-[500px] shadow-xl relative text-left">
                        <button 
                            onClick={() => setShowLoadModal(false)} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X size={20}/>
                        </button>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Catálogo de Rutas Spot</h3>
                        
                        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
                            {isLoadingList ? (
                                <p className="text-sm text-slate-500 italic">Cargando catálogo...</p>
                            ) : savedSpots.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">No hay rutas spot guardadas en la BD.</p>
                            ) : (
                                savedSpots.map(s => {
                                    const origin = s.legs_data?.legs?.laden?.origin_port_id || '—';
                                    const dest = s.legs_data?.legs?.laden?.destination_port_id || '—';
                                    return (
                                        <div 
                                            key={s.spot_id} 
                                            className="flex items-center justify-between p-3 border border-slate-200 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                                            onClick={() => handleLoadSelected(s)}
                                        >
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                    {s.name}
                                                    <span className="font-normal text-slate-400 text-xs">@{s.description || 'System'}</span>
                                                    {s.pais && (
                                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{background: s.pais === 'Chile' ? '#d1fae5' : '#dbeafe', color: s.pais === 'Chile' ? '#065f46' : '#1e40af'}}>
                                                            {s.pais === 'Chile' ? '🇨🇱 Chile' : '🇵🇪 Peru'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    Nave: {s.legs_data?.vessel_id || '—'} | Ruta: {origin} → {dest}
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {new Date(s.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
