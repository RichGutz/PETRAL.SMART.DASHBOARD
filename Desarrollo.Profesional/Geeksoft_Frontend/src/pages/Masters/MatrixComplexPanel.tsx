import React, { useState, useEffect } from "react";
import { Anchor, Save, Factory } from "lucide-react";
import { ForecastService } from "../../services/api";
import { getFormulaGuide } from "./MatrixConcepts";

// ─── Tipos ───────────────────────────────────────────────────────────────────
const getCountryInfo = (countryStr: string) => {
    if (!countryStr) return { code: 'pe', name: '-', color: '#64748b' };
    const c = countryStr.trim().toUpperCase();
    if (c === 'PE' || c === 'PERU' || c === 'PERÚ') return { code: 'pe', name: 'Perú', color: '#dc2626' };
    if (c === 'CL' || c === 'CHILE') return { code: 'cl', name: 'Chile', color: '#2563eb' };
    if (c === 'EC' || c === 'ECUADOR') return { code: 'ec', name: 'Ecuador', color: '#ca8a04' };
    const fallbackCode = countryStr.slice(0, 2).toLowerCase();
    return { code: fallbackCode, name: countryStr, color: '#64748b' };
};

interface MatrixComplexPanelProps {
    ports: any[];
    activePortId: string;
    setActivePortId: (id: string) => void;
}

export const MatrixComplexPanel: React.FC<MatrixComplexPanelProps> = ({ ports, activePortId, setActivePortId }) => {
    const [terminals, setTerminals] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    
    // tariffs[portId][terminalId][clientId][conceptId] = rate
    const [tariffs, setTariffs] = useState<Record<string, Record<string, Record<string, Record<string, number>>>>>({});
    const [apiLoaded, setApiLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);
    const [activeTerminalId, setActiveTerminalId] = useState<string>('GENERAL');

    const currentPortId = activePortId || (ports[0]?.port_id ?? "");
    const currentPort = ports.find(p => p.port_id === currentPortId);
    const activeCountry = (currentPort?.country || "PE").toUpperCase();
    
    // Get the specific concept guide for this country
    const currentFormulaGuide = getFormulaGuide(activeCountry);

    // Inicializar data (Terminals, Clients y Costs)
    useEffect(() => {
        Promise.all([
            ForecastService.getTerminals(),
            ForecastService.getClientsMaster(),
            ForecastService.getPortCostsMatrix()
        ]).then(([terminalsData, clientsData, costsData]) => {
            setTerminals(terminalsData || []);
            
            // Format Clients
            const activeClients = (clientsData || []).filter((c:any) => c.is_active);
            const clientsList = [
                { client_id: 'DEFAULT', client_name: 'Tarifa Estándar', color_hex: '#64748b' },
                ...activeClients
            ];
            setClients(clientsList);

            // Populate costs
            const merged: Record<string, Record<string, Record<string, Record<string, number>>>> = {};
            if (costsData && costsData.length > 0) {
                costsData.forEach((row: any) => {
                    const pid = row.port_id;
                    const tid = row.terminal || 'GENERAL';
                    const cid = row.client_id || 'DEFAULT';
                    const concept = row.concept_id;
                    
                    if (!merged[pid]) merged[pid] = {};
                    if (!merged[pid][tid]) merged[pid][tid] = {};
                    if (!merged[pid][tid][cid]) merged[pid][tid][cid] = {};

                    merged[pid][tid][cid][concept] = row.rate_usd ?? row.cost ?? 0;
                });
            }
            setTariffs(merged);
            setApiLoaded(true);
        }).catch(() => setApiLoaded(false));
    }, [ports]);

    const uniqueCountries = Array.from(new Set(ports.map(p => (p.country || "PE").toUpperCase())));
    const portsForCountry = ports.filter(p => (p.country || "PE").toUpperCase() === activeCountry);

    // Update active terminal if port changes and previous terminal is not in this port
    const terminalsForPort = terminals.filter(t => t.port_id === currentPortId);
    useEffect(() => {
        if (terminalsForPort.length > 0) {
            if (!terminalsForPort.find(t => t.terminal_id === activeTerminalId)) {
                setActiveTerminalId(terminalsForPort[0].terminal_id);
            }
        } else {
            setActiveTerminalId('GENERAL');
        }
    }, [currentPortId, terminalsForPort, activeTerminalId]);


    const handleSave = async () => {
        setSaving(true);
        setSaveMsg(null);
        try {
            const operation = currentPort?.default_operation || 'CARGA';
            const payload: any[] = [];
            
            // Recorremos los clientes y conceptos que tenemos en nuestra UI
            clients.forEach(client => {
                const clientTariffs = tariffs[currentPortId]?.[activeTerminalId]?.[client.client_id] ?? {};
                
                currentFormulaGuide.forEach(section => {
                    section.items.forEach(item => {
                        const concept_id = item.field;
                        const rate = clientTariffs[concept_id] ?? 0;
                        
                        payload.push({
                            client_id: client.client_id,
                            port_id: currentPortId,
                            terminal: activeTerminalId,
                            operation_type: operation,
                            vessel_id: 'DEFAULT',
                            concept_id,
                            cost: 0,
                            rate_usd: rate,
                            multiplier_source: 'FIXED',
                        });
                    });
                });
            });

            await ForecastService.savePortCostsMatrix(payload);
            setSaveMsg('Guardado exitosamente ✓');
            setTimeout(() => setSaveMsg(null), 3000);
        } catch {
            setSaveMsg('Error al guardar ✗');
        } finally {
            setSaving(false);
        }
    };

    const handleCountryClick = (countryCode: string) => {
        const firstPort = ports.find(p => (p.country || "PE").toUpperCase() === countryCode);
        if (firstPort) {
            setActivePortId(firstPort.port_id);
        }
    };

    const update = (clientId: string, field: string, value: number) => {
        setTariffs(prev => {
            const newTariffs = { ...prev };
            if (!newTariffs[currentPortId]) newTariffs[currentPortId] = {};
            if (!newTariffs[currentPortId][activeTerminalId]) newTariffs[currentPortId][activeTerminalId] = {};
            if (!newTariffs[currentPortId][activeTerminalId][clientId]) newTariffs[currentPortId][activeTerminalId][clientId] = {};
            
            newTariffs[currentPortId][activeTerminalId][clientId][field] = value;
            
            return newTariffs;
        });
    };

    const getVal = (clientId: string, field: string) => {
        return tariffs[currentPortId]?.[activeTerminalId]?.[clientId]?.[field] ?? 0;
    };

    return (
        <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">

            {/* ── Tabs de Países (Nivel 1) ── */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-white scrollbar-none shrink-0">
                {uniqueCountries.map(countryCode => {
                    const meta = getCountryInfo(countryCode);
                    const isActive = activeCountry === countryCode;
                    return (
                        <button 
                            key={countryCode} 
                            onClick={() => handleCountryClick(countryCode)}
                            className={`px-6 py-3 font-black text-xs uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                                isActive
                                    ? "bg-slate-50"
                                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                            style={isActive ? { color: meta.color, borderColor: meta.color } : {}}
                        >
                            <img 
                                src={`https://flagcdn.com/16x12/${meta.code}.png`} 
                                alt={meta.name} 
                                className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-200 shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {meta.name}
                        </button>
                    );
                })}
            </div>

            {/* ── Tabs de Puertos (Nivel 2) ── */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 scrollbar-none shrink-0">
                {portsForCountry.map(p => (
                    <button key={p.port_id} onClick={() => setActivePortId(p.port_id)}
                        className={`px-6 py-2.5 font-black text-[11px] uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                            currentPortId === p.port_id
                                ? "border-slate-800 text-slate-800 bg-white"
                                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                    >
                        <Anchor size={12} />
                        {p.port_name || p.port_id}
                    </button>
                ))}
            </div>

            {/* ── Tabs de Terminales (Nivel 3) ── */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-100 scrollbar-none shrink-0 px-2 py-1">
                {terminalsForPort.length > 0 ? (
                    terminalsForPort.map(t => (
                        <button key={t.terminal_id} onClick={() => setActiveTerminalId(t.terminal_id)}
                            className={`px-4 py-1.5 font-bold text-[10px] uppercase tracking-wider transition-colors rounded-t-lg flex items-center gap-2 mr-1 ${
                                activeTerminalId === t.terminal_id
                                    ? "bg-white text-slate-800 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                            }`}
                        >
                            <Factory size={10} />
                            {t.terminal_id}
                        </button>
                    ))
                ) : (
                    <button className="px-4 py-1.5 font-bold text-[10px] uppercase tracking-wider bg-white text-slate-800 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] rounded-t-lg flex items-center gap-2">
                        <Factory size={10} />
                        GENERAL
                    </button>
                )}
            </div>

            {/* ── Barra de Estado + Guardar ── */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-slate-100 bg-white shrink-0 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] z-10 relative">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-bold">
                        Matriz de <span className="text-slate-800">{currentPort?.port_name || currentPortId}</span> — Terminal: <span className="text-blue-700">{activeTerminalId}</span>
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${apiLoaded ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {apiLoaded ? '● Online DB' : '● Cargando...'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {saveMsg && (
                        <span className={`text-xs font-bold ${saveMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>
                            {saveMsg}
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {saving ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <Save size={14} />}
                        Guardar Matriz
                    </button>
                </div>
            </div>

            {/* ── Cuerpo: Inputs en Grilla ── */}
            <div className="flex flex-col p-5 overflow-auto bg-slate-50/50 flex-1 relative">
                
                {/* Cabecera de Columnas (Clientes) */}
                <div className="flex mb-4 sticky top-0 z-20 bg-slate-50/90 backdrop-blur pb-2">
                    {/* Espacio para concepto */}
                    <div className="w-72 shrink-0"></div>
                    {/* Columnas de Clientes */}
                    <div className="flex flex-1 gap-2 min-w-max">
                        {clients.map(client => (
                            <div key={client.client_id} className="w-32 flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 bg-white shadow-sm"
                                style={{ borderTopColor: client.color_hex, borderTopWidth: 3 }}>
                                <span className="text-[10px] font-black uppercase tracking-wider text-center" style={{ color: client.color_hex }}>
                                    {client.client_id}
                                </span>
                            </div>
                        ))}
                    </div>
                    {/* Espacio para explicación */}
                    <div className="w-1/3 min-w-[250px] shrink-0 pl-4 flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Guía Conceptual</span>
                    </div>
                </div>

                {currentFormulaGuide.map(section => (
                    <div key={section.section} className="flex flex-col mb-6 rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                        {/* Cabecera de Sección */}
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200" style={{ backgroundColor: section.color + "15" }}>
                            <span style={{ color: section.color }}>{section.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: section.color }}>
                                {section.section}
                            </span>
                        </div>
                        
                        {/* Filas */}
                        <div className="flex flex-col divide-y divide-slate-100">
                            {section.items.map(item => (
                                <div key={item.concept} className="flex flex-row hover:bg-slate-50 transition-colors group">
                                    
                                    {/* Nombre del Concepto */}
                                    <div className="w-72 shrink-0 p-3 flex flex-col justify-center border-r border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-slate-700 font-bold leading-tight">{item.concept}</span>
                                            {item.tooltip && <span title={item.tooltip} className="text-slate-300 cursor-help text-xs select-none shrink-0">ⓘ</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                {item.unit}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: section.color + "15", color: section.color }}>
                                                {item.formula}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Inputs por Cliente */}
                                    <div className="flex flex-1 gap-2 p-2 items-center min-w-max bg-slate-50/30">
                                        {clients.map(client => (
                                            <div key={client.client_id} className="w-32 flex justify-center shrink-0">
                                                <input
                                                    type="number"
                                                    value={getVal(client.client_id, item.field)}
                                                    step="0.01"
                                                    onChange={e => update(client.client_id, item.field, parseFloat(e.target.value) || 0)}
                                                    className={`w-full border border-slate-200 rounded-md px-2 py-1.5 text-right text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm ${client.client_id === 'DEFAULT' ? 'bg-slate-50' : 'bg-white'}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Explicación Conceptual */}
                                    <div className="w-1/3 min-w-[250px] shrink-0 p-3 flex items-center border-l border-slate-100 bg-white">
                                        <p className="text-[10px] text-slate-500 leading-relaxed italic">{item.explanation}</p>
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};
