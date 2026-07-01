import React, { useState, useEffect } from 'react';
import { RouteMatrix } from './RouteMatrix';
import { ForecastService } from '../../services/api';
import { Play, Anchor, CheckCircle, X, ChevronDown, ChevronRight } from 'lucide-react';

export const SpotRouter: React.FC = () => {
    const [vessels, setVessels] = useState<any[]>([]);
    const [selectedVessel, setSelectedVessel] = useState('');
    
    const [positioning, setPositioning] = useState<any>(null);
    const [laden, setLaden] = useState<any>(null);
    const [returnLeg, setReturnLeg] = useState<any>(null);
    
    const [result, setResult] = useState<any>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    useEffect(() => {
        ForecastService.getVessels().then(setVessels);
    }, []);

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
            freight_rate: 0
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

    const handleCalculate = async () => {
        if (!selectedVessel) return alert("Seleccione un buque");
        
        const payload = {
            vessel_id: selectedVessel,
            legs: {
                positioning,
                laden,
                return: returnLeg
            }
        };
        const res = await ForecastService.calculateSpot(payload);
        setResult(res);
    };

    const toggleRow = (rowName: string) => {
        setExpandedRow(prev => prev === rowName ? null : rowName);
    };

    const renderAuditGrid = (rowKey: string) => {
        if (expandedRow !== rowKey || !result) return null;
        
        const posAudit = result.legs_summary.positioning.audit_trail?.[rowKey];
        const ladenAudit = result.legs_summary.laden.audit_trail?.[rowKey];
        const retAudit = result.legs_summary.return.audit_trail?.[rowKey];
        
        if (!posAudit && !ladenAudit && !retAudit) return null;

        const renderCell = (auditObj: any) => {
            if (!auditObj) return <div className="text-slate-400 italic mt-2 text-[10px]">N/A para este tramo</div>;
            return (
                <div className="flex flex-col gap-1 mt-2">
                    <div className="text-[10px] text-slate-500 font-mono tracking-tight" dangerouslySetInnerHTML={{__html: auditObj.formula}}></div>
                    <div className="text-[11px] font-mono mt-1" dangerouslySetInnerHTML={{__html: auditObj.values}}></div>
                </div>
            );
        };

        return (
            <tr className="bg-slate-100/50 border-b border-slate-200">
                <td colSpan={2} className="p-3">
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

    const renderBucket = (title: string, data: any, type: 'pos'|'laden'|'ret', color: string) => (
        <div 
            className={`border-2 border-dashed rounded-lg p-4 flex flex-col gap-2 transition-colors ${data ? 'bg-white border-solid' : 'bg-slate-50'}`}
            style={{ borderColor: color }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, type)}
        >
            <div className="font-bold text-sm text-center" style={{ color }}>{title}</div>
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
                    <div>{data.route_distance} NM | W-Factor: {data.weather_factor}</div>
                    {type === 'laden' && (
                        <div className="mt-2 flex gap-2">
                            <input type="number" placeholder="Carga (MT)" className="w-1/2 p-1 border rounded" value={data.quantity || ''} onChange={e => setLaden({...data, quantity: Number(e.target.value)})} />
                            <input type="number" placeholder="Flete ($)" className="w-1/2 p-1 border rounded" value={data.freight_rate || ''} onChange={e => setLaden({...data, freight_rate: Number(e.target.value)})} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4 overflow-hidden pb-4">
            {/* Izquierda: Matriz de Rutas y Buckets */}
            <div className="w-1/2 flex flex-col gap-4 overflow-y-auto pr-2">
                <div className="shrink-0">
                    <RouteMatrix onDragStart={handleDragStart} />
                </div>
                
                <div className="bg-white rounded-lg shadow border border-slate-200 p-4 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-slate-700 flex items-center gap-2"><Anchor size={18} /> Construcción del Viaje</h2>
                        <select className="border p-1 text-sm rounded" value={selectedVessel} onChange={e => setSelectedVessel(e.target.value)}>
                            <option value="">Seleccione Buque...</option>
                            {vessels.map(v => <option key={v.vessel_id} value={v.vessel_id}>{v.vessel_id}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {renderBucket("1. Posicionamiento", positioning, 'pos', '#94a3b8')}
                        {renderBucket("2. Carga a Descarga", laden, 'laden', '#0f766e')}
                        {renderBucket("3. Retorno a Base", returnLeg, 'ret', '#94a3b8')}
                    </div>
                    
                    {/* Fila paralela de definiciones */}
                    <div className="grid grid-cols-3 gap-4 mt-2">
                        <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[10px] text-slate-500 text-center shadow-sm">
                            <strong>Ballast Leg:</strong> Viaje en lastre (vacío) hacia el puerto donde iniciará la carga.
                        </div>
                        <div className="bg-teal-50 border border-teal-100 rounded p-2 text-[10px] text-teal-700 text-center shadow-sm">
                            <strong>Laden Leg:</strong> Tramo comercial principal. Aplican tarifas, port costs y demoras.
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[10px] text-slate-500 text-center shadow-sm">
                            <strong>Return Leg:</strong> Viaje en lastre de regreso para liberar el buque al mercado.
                        </div>
                    </div>

                    <button 
                        onClick={handleCalculate}
                        className="mt-4 w-full bg-petral-teal text-white py-2 rounded font-bold shadow hover:bg-teal-700 flex justify-center items-center gap-2"
                    >
                        <Play size={16} /> Procesar Viaje Spot
                    </button>
                </div>
            </div>
            
            {/* Derecha: Resultados PnL */}
            <div className="w-1/2 overflow-y-auto">
                {result ? (
                    <div className="bg-white text-slate-800 rounded-lg shadow border border-slate-200 h-full flex flex-col">
                        <div className="bg-slate-800 text-white p-3 rounded-t-lg font-bold flex justify-between items-center shrink-0">
                            <span className="flex items-center gap-2"><CheckCircle size={16}/> GyP Consolidado (PnL)</span>
                            <span className="text-emerald-400 font-mono text-lg tracking-tight">TCE: ${(result.consolidated.tce_real || 0).toLocaleString(undefined, {maximumFractionDigits: 0})} / día</span>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-4">
                            <table className="w-full text-sm border-collapse">
                                <tbody>
                                    <tr className="border-b border-slate-100">
                                        <td className="p-2 font-bold text-slate-700">Viajes</td>
                                        <td className="p-2 text-right font-mono font-semibold">1</td>
                                    </tr>
                                    
                                    <tr className="border-b border-slate-100">
                                        <td className="p-2 font-bold text-slate-700">Toneladas</td>
                                        <td className="p-2 text-right font-mono font-semibold">{(laden?.quantity || 0).toLocaleString()}</td>
                                    </tr>

                                    <tr className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => toggleRow('gross_revenue')}>
                                        <td className="p-2 font-bold text-slate-700 flex items-center gap-1">
                                            {expandedRow === 'gross_revenue' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                                            Gross Revenue
                                        </td>
                                        <td className="p-2 text-right font-mono text-emerald-600 font-bold">${(result.consolidated.total_freight_revenue || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                    </tr>
                                    {expandedRow === 'gross_revenue' && (
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <td className="p-2 pl-8 text-[11px] text-slate-500 font-semibold italic">↳ Demurrage (No sumado en Voyage Result)</td>
                                            <td className="p-2 text-right font-mono text-emerald-500 text-xs">${(result.consolidated.total_demurrage_revenue || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                        </tr>
                                    )}

                                    <tr className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => toggleRow('port_costs')}>
                                        <td className="p-2 font-bold text-slate-700 flex items-center gap-1">
                                            {expandedRow === 'port_costs' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                                            Port Costs
                                        </td>
                                        <td className="p-2 text-right font-mono text-rose-600 font-semibold">-${(result.consolidated.total_port_costs || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                    </tr>
                                    {renderAuditGrid('port_costs')}
                                    
                                    <tr className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => toggleRow('bunker_costs')}>
                                        <td className="p-2 font-bold text-slate-700 flex items-center gap-1">
                                            {expandedRow === 'bunker_costs' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                                            Bunker Costs
                                        </td>
                                        <td className="p-2 text-right font-mono text-amber-600 font-semibold">-${(result.consolidated.total_bunker_costs || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                    </tr>
                                    {renderAuditGrid('bunker_costs')}

                                    <tr className="border-b-2 border-slate-300 bg-emerald-50">
                                        <td className="p-3 font-black text-slate-800">Voyage Result</td>
                                        <td className="p-3 text-right font-mono font-black text-emerald-700 text-lg">${(result.consolidated.pnl_net_utility || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                    </tr>

                                    {/* KPIs Operativos */}
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <td className="p-2 font-bold text-slate-700" colSpan={2}>4. KPIs OPERATIVOS</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="p-2 pl-6 text-slate-600">Distancia Total (NM)</td>
                                        <td className="p-2 text-right font-mono font-semibold">{(result.consolidated.total_distance || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => toggleRow('sea_days')}>
                                        <td className="p-2 pl-6 text-slate-600 flex items-center gap-1">
                                            {expandedRow === 'sea_days' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                                            Días de Mar
                                        </td>
                                        <td className="p-2 text-right font-mono font-semibold">{(result.consolidated.total_sea_days || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}</td>
                                    </tr>
                                    {renderAuditGrid('sea_days')}
                                    
                                    <tr className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => toggleRow('port_days')}>
                                        <td className="p-2 pl-6 text-slate-600 flex items-center gap-1">
                                            {expandedRow === 'port_days' ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                                            Días en Puerto
                                        </td>
                                        <td className="p-2 text-right font-mono font-semibold">{(result.consolidated.total_port_days || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}</td>
                                    </tr>
                                    {renderAuditGrid('port_days')}
                                    
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <td className="p-2 pl-6 font-bold text-slate-700">Duración Total (Días)</td>
                                        <td className="p-2 text-right font-mono font-bold text-slate-800">{(result.consolidated.total_days || 0).toLocaleString(undefined, {maximumFractionDigits: 1})}</td>
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
        </div>
    );
};
