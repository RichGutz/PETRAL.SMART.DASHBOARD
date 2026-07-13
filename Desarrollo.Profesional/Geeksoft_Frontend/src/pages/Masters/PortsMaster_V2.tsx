import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Anchor, Edit3, MapPin, Plus, Factory, Trash2 } from 'lucide-react';

// Helper para obtener código ISO de 2 letras y nombre limpio de país
const getCountryInfo = (countryStr: string) => {
    if (!countryStr) return { code: 'pe', name: '-' };
    const c = countryStr.trim().toUpperCase();
    if (c === 'PE' || c === 'PERU' || c === 'PERÚ') return { code: 'pe', name: 'Perú' };
    if (c === 'CL' || c === 'CHILE') return { code: 'cl', name: 'Chile' };
    if (c === 'EC' || c === 'ECUADOR') return { code: 'ec', name: 'Ecuador' };
    const fallbackCode = countryStr.slice(0, 2).toLowerCase();
    return { code: fallbackCode, name: countryStr };
};

export const PortsMaster_V2: React.FC = () => {
    const navigate = navigateHook();
    
    // Data State
    const [ports, setPorts] = useState<any[]>([]);
    const [terminals, setTerminals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [activeCountry, setActiveCountry] = useState<string>('');
    const [activePortId, setActivePortId] = useState<string>('');
    
    // Editor State
    const [editingPortId, setEditingPortId] = useState<string | null>(null);
    const [editPortData, setEditPortData] = useState<any>(null);
    
    const [editingTerminalId, setEditingTerminalId] = useState<string | null>(null);
    const [editTerminalData, setEditTerminalData] = useState<any>(null);
    
    const [isSaving, setIsSaving] = useState(false);

    function navigateHook() {
        try {
            return useNavigate();
        } catch {
            return () => {};
        }
    }

    const fetchData = async () => {
        try {
            setLoading(true);
            const [portsData, terminalsData] = await Promise.all([
                ForecastService.getPorts(),
                ForecastService.getTerminals()
            ]);
            
            const sortedPorts = (portsData || []).sort((a: any, b: any) => {
                const latA = parseFloat(a.lat) || 0;
                const latB = parseFloat(b.lat) || 0;
                return latB - latA;
            });
            setPorts(sortedPorts);
            setTerminals(terminalsData || []);
            
            if (sortedPorts.length > 0 && !activeCountry) {
                const firstCountry = (sortedPorts[0].country || 'PE').toUpperCase();
                setActiveCountry(firstCountry);
                const firstPort = sortedPorts.find((p:any) => (p.country || 'PE').toUpperCase() === firstCountry);
                if (firstPort) setActivePortId(firstPort.port_id);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Derived State
    const uniqueCountries = Array.from(new Set(ports.map(p => (p.country || "PE").toUpperCase())));
    const portsForCountry = ports.filter(p => (p.country || "PE").toUpperCase() === activeCountry);
    const terminalsForPort = terminals.filter(t => t.port_id === activePortId);
    
    const currentPort = ports.find(p => p.port_id === activePortId);

    const handleCountryClick = (countryCode: string) => {
        setActiveCountry(countryCode);
        const firstPort = ports.find(p => (p.country || "PE").toUpperCase() === countryCode);
        if (firstPort) setActivePortId(firstPort.port_id);
    };

    // Port Actions
    const handleNewPortClick = () => {
        setEditingPortId('NUEVO');
        setEditPortData({ port_id: '', port_name: '', country: activeCountry, lat: 0, lon: 0 });
    };
    const handleSavePort = async () => {
        if (!editPortData.port_id || !editPortData.port_name) {
            alert("ID y Nombre del Puerto son requeridos");
            return;
        }
        try {
            setIsSaving(true);
            const payload = { ...editPortData, port_id: editPortData.port_id.toUpperCase() };
            await ForecastService.savePorts(payload);
            setEditingPortId(null);
            await fetchData();
            setActivePortId(payload.port_id);
        } catch(e) {
            alert("Error al guardar puerto");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePort = async (port_id: string) => {
        if (window.confirm(`¿Está seguro que desea eliminar el puerto ${port_id}? Se eliminarán también todos los terminales asociados.`)) {
            try {
                await ForecastService.deletePort(port_id);
                // Clear active port if it was the one deleted
                if (activePortId === port_id) {
                    setActivePortId('');
                }
                await fetchData();
            } catch (e) {
                alert("Error al eliminar puerto");
            }
        }
    };

    // Terminal Actions
    const handleNewTerminalClick = () => {
        if (!activePortId) return;
        setEditingTerminalId('NUEVO');
        setEditTerminalData({ terminal_id: '', port_id: activePortId, terminal_name: '', is_active: true });
    };
    
    const handleSaveTerminal = async () => {
        if (!editTerminalData.terminal_id || !editTerminalData.terminal_name) {
            alert("ID y Nombre del Terminal son requeridos");
            return;
        }
        try {
            setIsSaving(true);
            const payload = { ...editTerminalData, terminal_id: editTerminalData.terminal_id.toUpperCase() };
            await ForecastService.saveTerminals(payload);
            setEditingTerminalId(null);
            await fetchData();
        } catch(e) {
            alert("Error al guardar terminal");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTerminal = async (terminal_id: string, port_id: string) => {
        if (window.confirm(`¿Está seguro que desea eliminar el terminal ${terminal_id}?`)) {
            try {
                await ForecastService.deleteTerminal(terminal_id, port_id);
                await fetchData();
            } catch (e) {
                alert("Error al eliminar terminal");
            }
        }
    };

    return (
        <MasterTemplate 
            title="Maestro de Puertos & Terminales" 
            subtitle="Ubicación geográfica de puertos y sus terminales operativos"
            activeTab="ports"
            onBackToDashboard={() => navigate('/dashboard')}
        >
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 font-semibold animate-pulse gap-2">
                    <div className="animate-spin h-6 w-6 border-2 border-slate-300 border-t-blue-600 rounded-full"></div>
                    <span>Cargando datos híbridos...</span>
                </div>
            ) : (
                <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
                    
                    {/* Nivel 1: TABS DE PAÍSES */}
                    <div className="flex overflow-x-auto border-b border-slate-200 bg-white scrollbar-none shrink-0 items-center">
                        {uniqueCountries.map(countryCode => {
                            const meta = getCountryInfo(countryCode);
                            const isActive = activeCountry === countryCode;
                            return (
                                <button 
                                    key={countryCode} 
                                    onClick={() => handleCountryClick(countryCode)}
                                    className={`px-6 py-3 font-black text-xs uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                                        isActive ? "bg-slate-50 border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                    }`}
                                >
                                    <img src={`https://flagcdn.com/16x12/${meta.code}.png`} alt={meta.name} className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-200" />
                                    {meta.name}
                                </button>
                            );
                        })}
                        <button onClick={handleNewPortClick} className="ml-4 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-1">
                            <Plus size={14} /> Nuevo Puerto
                        </button>
                    </div>

                    {/* Nivel 2: TABS DE PUERTOS */}
                    <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 scrollbar-none">
                        {portsForCountry.map(p => (
                            <button
                                key={p.port_id}
                                onClick={() => setActivePortId(p.port_id)}
                                className={`px-6 py-2.5 font-black text-[11px] uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                                    activePortId === p.port_id ? 'border-slate-800 text-slate-800 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                }`}
                            >
                                <Anchor size={12} />
                                {p.port_name || p.port_id}
                            </button>
                        ))}
                    </div>
                    
                    {/* Nivel 3: CONTENIDO DEL PUERTO Y SUS TERMINALES */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 flex flex-col gap-6">
                        
                        {/* Editor flotante de nuevo puerto */}
                        {editingPortId === 'NUEVO' && (
                            <div className="bg-white border-2 border-blue-400 p-4 rounded-xl shadow-md flex gap-4 items-center flex-wrap">
                                <input placeholder="ID Corto (Ej. CALLAO)" className="border p-2 rounded text-sm uppercase font-bold" value={editPortData.port_id} onChange={e=>setEditPortData({...editPortData, port_id: e.target.value})} />
                                <input placeholder="Nombre Completo" className="border p-2 rounded text-sm flex-1 min-w-[200px]" value={editPortData.port_name} onChange={e=>setEditPortData({...editPortData, port_name: e.target.value})} />
                                <input type="number" placeholder="Latitud" className="border p-2 rounded text-sm w-24" value={editPortData.lat} onChange={e=>setEditPortData({...editPortData, lat: e.target.value})} />
                                <input type="number" placeholder="Longitud" className="border p-2 rounded text-sm w-24" value={editPortData.lon} onChange={e=>setEditPortData({...editPortData, lon: e.target.value})} />
                                <button onClick={()=>setEditingPortId(null)} className="px-4 py-2 bg-slate-200 rounded font-bold text-sm">Cancelar</button>
                                <button onClick={handleSavePort} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded font-bold text-sm">Guardar Puerto</button>
                            </div>
                        )}

                        {currentPort && (
                            <>
                                {/* Cabecera del Puerto */}
                                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                            <Anchor size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-800">{currentPort.port_name}</h2>
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mt-1">
                                                <span>ID: {currentPort.port_id}</span>
                                                <span className="flex items-center gap-1"><MapPin size={12}/> {currentPort.lat}, {currentPort.lon}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { setEditingPortId(currentPort.port_id); setEditPortData({...currentPort}); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Puerto">
                                            <Edit3 size={18} />
                                        </button>
                                        <button onClick={() => handleDeletePort(currentPort.port_id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar Puerto">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Si se está editando este puerto existente */}
                                {editingPortId === currentPort.port_id && (
                                    <div className="bg-blue-50 border-2 border-blue-400 p-4 rounded-xl shadow-md flex gap-4 items-center flex-wrap">
                                        <input disabled className="border p-2 rounded text-sm uppercase font-bold bg-slate-100 text-slate-400" value={editPortData.port_id} />
                                        <input placeholder="Nombre Completo" className="border p-2 rounded text-sm flex-1 min-w-[200px]" value={editPortData.port_name} onChange={e=>setEditPortData({...editPortData, port_name: e.target.value})} />
                                        <input type="number" placeholder="Latitud" className="border p-2 rounded text-sm w-24" value={editPortData.lat} onChange={e=>setEditPortData({...editPortData, lat: e.target.value})} />
                                        <input type="number" placeholder="Longitud" className="border p-2 rounded text-sm w-24" value={editPortData.lon} onChange={e=>setEditPortData({...editPortData, lon: e.target.value})} />
                                        <button onClick={()=>setEditingPortId(null)} className="px-4 py-2 bg-slate-200 rounded font-bold text-sm hover:bg-slate-300">Cancelar</button>
                                        <button onClick={handleSavePort} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded font-bold text-sm hover:bg-blue-700">Guardar Puerto</button>
                                    </div>
                                )}

                                {/* Sección de Terminales */}
                                <div className="flex flex-col gap-4 mt-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-black text-slate-700 text-sm uppercase flex items-center gap-2">
                                            <Factory size={16} className="text-slate-400" />
                                            Terminales Asociados ({terminalsForPort.length})
                                        </h3>
                                        <button onClick={handleNewTerminalClick} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 flex items-center gap-1 shadow-sm transition-colors">
                                            <Plus size={14} /> Nuevo Terminal
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {/* Editor Nuevo Terminal */}
                                        {editingTerminalId === 'NUEVO' && (
                                            <div className="bg-white border-2 border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3 transform scale-[1.02] transition-transform">
                                                <input autoFocus placeholder="ID Terminal (Ej. TPM)" className="border p-1.5 rounded text-xs uppercase font-bold focus:ring-2 focus:ring-slate-800 focus:outline-none" value={editTerminalData.terminal_id} onChange={e=>setEditTerminalData({...editTerminalData, terminal_id: e.target.value})} />
                                                <input placeholder="Nombre Completo" className="border p-1.5 rounded text-xs font-semibold focus:ring-2 focus:ring-slate-800 focus:outline-none" value={editTerminalData.terminal_name} onChange={e=>setEditTerminalData({...editTerminalData, terminal_name: e.target.value})} />
                                                <div className="flex gap-2 justify-end mt-2">
                                                    <button onClick={()=>setEditingTerminalId(null)} className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancelar</button>
                                                    <button onClick={handleSaveTerminal} disabled={isSaving} className="px-3 py-1 bg-slate-800 text-white rounded text-xs font-bold flex items-center gap-1 hover:bg-slate-900 transition-colors">Guardar</button>
                                                </div>
                                            </div>
                                        )}

                                        {terminalsForPort.map(t => (
                                            editingTerminalId === t.terminal_id ? (
                                                <div key={t.terminal_id} className="bg-white border-2 border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3 transform scale-[1.02] transition-transform">
                                                    <input disabled className="border p-1.5 rounded text-xs uppercase font-bold bg-slate-50 text-slate-400" value={editTerminalData.terminal_id} />
                                                    <input autoFocus placeholder="Nombre Completo" className="border p-1.5 rounded text-xs font-semibold focus:ring-2 focus:ring-slate-800 focus:outline-none" value={editTerminalData.terminal_name} onChange={e=>setEditTerminalData({...editTerminalData, terminal_name: e.target.value})} />
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mt-1">
                                                        <input type="checkbox" checked={editTerminalData.is_active} onChange={e=>setEditTerminalData({...editTerminalData, is_active: e.target.checked})} className="accent-slate-800 w-3.5 h-3.5" /> Activo
                                                    </div>
                                                    <div className="flex gap-2 justify-end mt-2">
                                                        <button onClick={()=>setEditingTerminalId(null)} className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancelar</button>
                                                        <button onClick={handleSaveTerminal} disabled={isSaving} className="px-3 py-1 bg-slate-800 text-white rounded text-xs font-bold flex items-center gap-1 hover:bg-slate-900 transition-colors">Guardar</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div key={t.terminal_id} className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2 relative group hover:border-slate-300 transition-colors ${!t.is_active ? 'opacity-60 grayscale' : ''}`}>
                                                    <div className="absolute top-2 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => { setEditingTerminalId(t.terminal_id); setEditTerminalData({...t}); }} className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeleteTerminal(t.terminal_id, t.port_id)} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Factory size={16} className="text-teal-600" />
                                                        <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-1.5 rounded border border-slate-200">{t.terminal_id}</span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 text-sm mt-1 leading-tight">{t.terminal_name}</h4>
                                                    {!t.is_active && <span className="text-[10px] font-bold text-red-500 uppercase mt-auto">Inactivo</span>}
                                                </div>
                                            )
                                        ))}
                                        
                                        {terminalsForPort.length === 0 && editingTerminalId !== 'NUEVO' && (
                                            <div className="col-span-full border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white/50">
                                                <Factory size={32} className="text-slate-300 mb-2" />
                                                <span className="text-sm font-semibold text-slate-500">Este puerto aún no tiene terminales registrados.</span>
                                                <button onClick={handleNewTerminalClick} className="mt-2 text-xs font-bold text-blue-600 hover:underline">Haga clic aquí para agregar el primero.</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </MasterTemplate>
    );
};
