import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Anchor, Edit3, MapPin, Plus, Factory, Trash2 } from 'lucide-react';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';
import { VesselTerminalMatrix } from '../../components/Masters/VesselTerminalMatrix';

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
    
    const [activeTerminalId, setActiveTerminalId] = useState<string>('GENERAL');
    
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
        alert('Crear nuevo terminal: funcionalidad disponible próximamente.');
    };
    





    const exportData = useMemo(() => {
        const rows: any[] = [];
        ports.forEach(port => {
            const portTerminals = terminals.filter(t => t.port_id === port.port_id);
            if (portTerminals.length === 0) {
                rows.push({
                    port_id: port.port_id,
                    port_name: port.port_name,
                    country: port.country,
                    lat: port.lat,
                    lon: port.lon,
                    terminal_id: '(Sin terminal)',
                    terminal_name: '—',
                    is_active: false
                });
            } else {
                portTerminals.forEach(t => {
                    rows.push({
                        port_id: port.port_id,
                        port_name: port.port_name,
                        country: port.country,
                        lat: port.lat,
                        lon: port.lon,
                        terminal_id: t.terminal_id,
                        terminal_name: t.terminal_name,
                        is_active: t.is_active
                    });
                });
            }
        });
        return rows;
    }, [ports, terminals]);

    const exportColumns: ExportColumn[] = [
        { header: 'ID Puerto', key: 'port_id', type: 'string' },
        { header: 'Nombre Puerto', key: 'port_name', type: 'string' },
        { 
            header: 'País', 
            key: 'country', 
            type: 'string',
            render: (val) => getCountryInfo(val).name
        },
        { header: 'Latitud', key: 'lat', type: 'number' },
        { header: 'Longitud', key: 'lon', type: 'number' },
        { header: 'ID Terminal', key: 'terminal_id', type: 'string' },
        { header: 'Nombre Terminal', key: 'terminal_name', type: 'string' },
        { header: 'Terminal Activo', key: 'is_active', type: 'boolean' }
    ];

    const handleExportExcel = () => {
        exportMasterToExcel('Maestro de Puertos y Terminales', exportColumns, exportData);
    };

    const handleExportPDF = () => {
        exportMasterToPDF('Maestro de Puertos y Terminales', exportColumns, exportData);
    };

    return (
        <MasterTemplate 
            title="Maestro de Puertos & Terminales" 
            subtitle="Ubicación geográfica de puertos y sus terminales operativos"
            activeTab="ports"
            onBackToDashboard={() => navigate('/dashboard')}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
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
                            <div className="bg-white border-2 border-blue-500 p-5 rounded-xl shadow-lg flex flex-col gap-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <span className="text-xs font-black uppercase text-blue-700 tracking-wider flex items-center gap-1.5">
                                        <Plus size={14} /> Registrar Nuevo Puerto
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-400">
                                        Formato Coordenadas: Google Maps (Decimales)
                                    </span>
                                </div>
                                <div className="flex gap-4 items-end flex-wrap">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black uppercase text-slate-500">ID Corto</label>
                                        <input placeholder="Ej. CALLAO" className="border border-slate-300 p-2 rounded-lg text-sm uppercase font-bold focus:ring-2 focus:ring-blue-500 outline-none w-36" value={editPortData.port_id} onChange={e=>setEditPortData({...editPortData, port_id: e.target.value})} />
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                                        <label className="text-[10px] font-black uppercase text-slate-500">Nombre Completo del Puerto</label>
                                        <input placeholder="Ej. Puerto del Callao" className="border border-slate-300 p-2 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none" value={editPortData.port_name} onChange={e=>setEditPortData({...editPortData, port_name: e.target.value})} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                                            <MapPin size={10} className="text-blue-500" /> Latitud (Google Maps)
                                        </label>
                                        <input type="number" step="any" placeholder="-12.046374" className="border border-slate-300 p-2 rounded-lg text-sm w-36 font-semibold focus:ring-2 focus:ring-blue-500 outline-none" value={editPortData.lat} onChange={e=>setEditPortData({...editPortData, lat: e.target.value})} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                                            <MapPin size={10} className="text-blue-500" /> Longitud (Google Maps)
                                        </label>
                                        <input type="number" step="any" placeholder="-77.042793" className="border border-slate-300 p-2 rounded-lg text-sm w-36 font-semibold focus:ring-2 focus:ring-blue-500 outline-none" value={editPortData.lon} onChange={e=>setEditPortData({...editPortData, lon: e.target.value})} />
                                    </div>
                                    <div className="flex items-center gap-2 ml-auto pt-2">
                                        <button onClick={()=>setEditingPortId(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-xs transition-colors">Cancelar</button>
                                        <button onClick={handleSavePort} disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm">{isSaving ? 'Guardando...' : 'Guardar Puerto'}</button>
                                    </div>
                                </div>
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
                                    <div className="bg-blue-50 border-2 border-blue-400 p-5 rounded-xl shadow-lg flex flex-col gap-3">
                                        <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                                            <span className="text-xs font-black uppercase text-blue-800 tracking-wider flex items-center gap-1.5">
                                                <Edit3 size={14} /> Editar Datos de Puerto
                                            </span>
                                            <span className="text-[11px] font-semibold text-slate-500">
                                                Formato Coordenadas: Google Maps (Decimales)
                                            </span>
                                        </div>
                                        <div className="flex gap-4 items-end flex-wrap">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-black uppercase text-slate-500">ID Corto</label>
                                                <input disabled className="border border-slate-200 p-2 rounded-lg text-sm uppercase font-bold bg-slate-100 text-slate-400 w-36" value={editPortData.port_id} />
                                            </div>
                                            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                                                <label className="text-[10px] font-black uppercase text-slate-500">Nombre Completo del Puerto</label>
                                                <input placeholder="Ej. Puerto del Callao" className="border border-slate-300 p-2 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editPortData.port_name} onChange={e=>setEditPortData({...editPortData, port_name: e.target.value})} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                                                    <MapPin size={10} className="text-blue-500" /> Latitud (Google Maps)
                                                </label>
                                                <input type="number" step="any" placeholder="-12.046374" className="border border-slate-300 p-2 rounded-lg text-sm w-36 font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editPortData.lat} onChange={e=>setEditPortData({...editPortData, lat: e.target.value})} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                                                    <MapPin size={10} className="text-blue-500" /> Longitud (Google Maps)
                                                </label>
                                                <input type="number" step="any" placeholder="-77.042793" className="border border-slate-300 p-2 rounded-lg text-sm w-36 font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={editPortData.lon} onChange={e=>setEditPortData({...editPortData, lon: e.target.value})} />
                                            </div>
                                            <div className="flex items-center gap-2 ml-auto pt-2">
                                                <button onClick={()=>setEditingPortId(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-xs transition-colors">Cancelar</button>
                                                <button onClick={handleSavePort} disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm">{isSaving ? 'Guardando...' : 'Guardar Puerto'}</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Sección Matriz Barco x Terminal */}
                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-black text-slate-700 text-sm uppercase flex items-center gap-2">
                                            <Factory size={16} className="text-slate-400" />
                                            Terminal Operativo
                                        </h3>
                                        <div className="flex gap-2 items-center">
                                            {terminalsForPort.length > 0 ? (
                                                <select 
                                                    className="border border-slate-300 rounded px-3 py-1.5 text-sm font-bold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={activeTerminalId}
                                                    onChange={(e) => setActiveTerminalId(e.target.value)}
                                                >
                                                    {terminalsForPort.map(t => (
                                                        <option key={t.terminal_id} value={t.terminal_id}>{t.terminal_name} ({t.terminal_id})</option>
                                                    ))}
                                                    <option value="GENERAL">GENERAL (Por Defecto)</option>
                                                </select>
                                            ) : (
                                                <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded text-sm font-bold border border-slate-200">Terminal: GENERAL</span>
                                            )}
                                            
                                            <button onClick={handleNewTerminalClick} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 flex items-center gap-1 shadow-sm transition-colors">
                                                <Plus size={14} /> Crear Terminal
                                            </button>
                                        </div>
                                    </div>



                                    {/* Whitelist de puertos/terminales configurados por Geeksoft */}
                                    {(() => {
                                        const CONFIGURED_KEYWORDS = ['CALLAO', 'MARCONA', 'SANJUAN', 'ILO', 'MATARANI', 'MEJILLONES', 'BARQUITO'];
                                        const norm = (s: string) => (s || '').toUpperCase().replace(/[\s_-]+/g, '');
                                        const portNorm = norm(currentPort.port_id);
                                        const isConfigured = CONFIGURED_KEYWORDS.some(kw => portNorm.includes(kw));

                                        if (!isConfigured) {
                                            return (
                                                <div className="flex flex-col items-center justify-center py-20 gap-5">
                                                    <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center border-2 border-amber-200">
                                                        <span className="text-3xl">🔒</span>
                                                    </div>
                                                    <div className="text-center max-w-md">
                                                        <div className="font-black text-slate-700 text-base uppercase tracking-wide">
                                                            Terminal no configurado
                                                        </div>
                                                        <div className="mt-2 text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                                                            Contáctese con Geeksoft para configuración específica de este puerto/terminal.
                                                        </div>
                                                        <div className="mt-3 text-xs text-slate-400">
                                                            Puertos activos: Callao · Marcona · Ilo · Matarani · Mejillones · Barquito
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <VesselTerminalMatrix
                                                portId={currentPort.port_id}
                                                terminalId={activeTerminalId === '' ? (terminalsForPort.length > 0 ? terminalsForPort[0].terminal_id : 'GENERAL') : activeTerminalId}
                                            />
                                        );
                                    })()}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </MasterTemplate>
    );
};
