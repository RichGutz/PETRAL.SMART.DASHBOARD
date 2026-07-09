import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Anchor, Save, Edit3, MapPin, Globe, Plus, ExternalLink } from 'lucide-react';

// Helper para obtener código ISO de 2 letras y nombre limpio de país
const getCountryInfo = (countryStr: string) => {
    if (!countryStr) return { code: 'pe', name: '-' };
    const c = countryStr.trim().toUpperCase();
    
    // Mapeo tolerante
    if (c === 'PE' || c === 'PERU' || c === 'PERÚ') return { code: 'pe', name: 'Perú' };
    if (c === 'CL' || c === 'CHILE') return { code: 'cl', name: 'Chile' };
    if (c === 'US' || c === 'USA' || c === 'ESTADOS UNIDOS') return { code: 'us', name: 'USA' };
    if (c === 'PA' || c === 'PANAMA' || c === 'PANAMÁ') return { code: 'pa', name: 'Panamá' };
    if (c === 'EC' || c === 'ECUADOR') return { code: 'ec', name: 'Ecuador' };
    if (c === 'BR' || c === 'BRAZIL' || c === 'BRASIL') return { code: 'br', name: 'Brasil' };
    if (c === 'CO' || c === 'COLOMBIA') return { code: 'co', name: 'Colombia' };
    if (c === 'AR' || c === 'ARGENTINA') return { code: 'ar', name: 'Argentina' };
    if (c === 'MX' || c === 'MEXICO' || c === 'MÉXICO') return { code: 'mx', name: 'México' };
    if (c === 'CN' || c === 'CHINA') return { code: 'cn', name: 'China' };
    if (c === 'JP' || c === 'JAPAN' || c === 'JAPÓN') return { code: 'jp', name: 'Japón' };
    if (c === 'CA' || c === 'CANADA' || c === 'CANADÁ') return { code: 'ca', name: 'Canadá' };
    if (c === 'VE' || c === 'VENEZUELA') return { code: 've', name: 'Venezuela' };
    
    // Fallback dinámico para códigos de 2 letras
    const fallbackCode = countryStr.slice(0, 2).toLowerCase();
    return { code: fallbackCode, name: countryStr };
};

export const PortsMaster_V2: React.FC = () => {
    const navigate = navigateHook();
    const [ports, setPorts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Estado para saber qué puerto se está editando
    const [editingPortId, setEditingPortId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    function navigateHook() {
        try {
            return useNavigate();
        } catch {
            return () => {};
        }
    }

    const fetchPorts = async () => {
        try {
            setLoading(true);
            const data = await ForecastService.getPorts();
            // Ordenar de Norte a Sur (latitud descendente de +90 a -90)
            const sorted = (data || []).sort((a: any, b: any) => {
                const latA = parseFloat(a.lat) || 0;
                const latB = parseFloat(b.lat) || 0;
                return latB - latA;
            });
            setPorts(sorted);
        } catch (error) {
            console.error("Error al obtener los puertos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPorts();
    }, []);

    const handleSave = async () => {
        if (!editFormData.port_id || !editFormData.port_name) {
            alert("ID de Puerto y Nombre son obligatorios");
            return;
        }

        try {
            setIsSaving(true);
            const payload = {
                port_id: editFormData.port_id.toUpperCase(),
                port_name: editFormData.port_name,
                country: editFormData.country || 'Peru',
                lat: parseFloat(editFormData.lat || 0),
                lon: parseFloat(editFormData.lon || 0)
            };
            
            await ForecastService.savePorts(payload);
            
            setEditingPortId(null);
            setEditFormData(null);
            await fetchPorts();
        } catch (error) {
            console.error("Error al guardar el puerto:", error);
            alert("Ocurrió un error al guardar el puerto.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditingPortId(null);
        setEditFormData(null);
    };

    const handleEditClick = (port: any) => {
        setEditingPortId(port.port_id);
        setEditFormData({ ...port });
    };

    const handleNewClick = () => {
        setEditingPortId('NUEVO');
        setEditFormData({
            port_id: '',
            port_name: '',
            country: 'PE',
            lat: 0,
            lon: 0
        });
    };

    return (
        <MasterTemplate 
            title="Maestro de Puertos" 
            subtitle="Ubicación geográfica e identificación de puertos"
            activeTab="ports"
            onBackToDashboard={() => navigate('/dashboard')}
        >
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 font-semibold animate-pulse gap-2">
                    <div className="animate-spin h-6 w-6 border-2 border-slate-300 border-t-blue-600 rounded-full"></div>
                    <span>Cargando datos maestros de puertos...</span>
                </div>
            ) : (
                <div className="flex flex-col gap-6 w-full pb-8">
                    
                    {/* Header de la vista con Botón Nuevo */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex flex-col">
                            <h3 className="font-black text-slate-800 text-lg">Catálogo de Puertos</h3>
                            <span className="text-xs text-slate-500 font-medium">{ports.length} puertos registrados</span>
                        </div>
                        <button 
                            onClick={handleNewClick}
                            disabled={editingPortId !== null}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={16} />
                            Nuevo Puerto
                        </button>
                    </div>

                    {/* Grilla de Tarjetas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        
                        {/* Tarjeta temporal para creación de Nuevo Puerto */}
                        {editingPortId === 'NUEVO' && (
                            <div className="bg-blue-50 border-2 border-blue-400 rounded-xl shadow-md overflow-hidden flex flex-col relative transform scale-105 transition-all z-10 ring-4 ring-blue-500/20">
                                <div className="p-4 border-b border-blue-200 bg-white">
                                    <div className="flex flex-col gap-2">
                                        <input 
                                            type="text" 
                                            value={editFormData.port_name}
                                            onChange={e => setEditFormData({...editFormData, port_name: e.target.value})}
                                            className="text-lg font-black text-slate-800 bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                            placeholder="Nombre del Puerto"
                                            autoFocus
                                        />
                                        <input 
                                            type="text" 
                                            value={editFormData.port_id}
                                            onChange={e => setEditFormData({...editFormData, port_id: e.target.value})}
                                            className="text-xs font-bold text-slate-500 bg-white border border-slate-300 rounded px-2 py-1 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                            placeholder="ID Corto (Ej: CALLAO)"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col gap-3 bg-white flex-1">
                                    <div className="flex items-center gap-2">
                                        <Globe size={16} className="text-slate-400 shrink-0" />
                                        <input 
                                            type="text" 
                                            value={editFormData.country}
                                            onChange={e => setEditFormData({...editFormData, country: e.target.value})}
                                            className="text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 w-full uppercase"
                                            placeholder="País (Ej: PE)"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-slate-400 shrink-0" />
                                        <div className="flex gap-2 w-full">
                                            <input 
                                                type="number" 
                                                step="any"
                                                value={editFormData.lat}
                                                onChange={e => setEditFormData({...editFormData, lat: e.target.value})}
                                                className="text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 w-full"
                                                placeholder="Latitud"
                                            />
                                            <input 
                                                type="number" 
                                                step="any"
                                                value={editFormData.lon}
                                                onChange={e => setEditFormData({...editFormData, lon: e.target.value})}
                                                className="text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 w-full"
                                                placeholder="Longitud"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 justify-end">
                                    <button 
                                        onClick={handleCancel}
                                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1 shadow-sm"
                                    >
                                        {isSaving ? "Guardando..." : <><Save size={14} /> Guardar</>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Tarjetas de Puertos Existentes */}
                        {ports.map((port: any) => {
                            const isEditing = editingPortId === port.port_id;
                            
                            if (isEditing) {
                                return (
                                    <div key={port.port_id} className="bg-blue-50 border-2 border-blue-400 rounded-xl shadow-md overflow-hidden flex flex-col relative transform scale-105 transition-all z-10 ring-4 ring-blue-500/20">
                                        <div className="p-4 border-b border-blue-200 bg-white">
                                            <div className="flex flex-col gap-2">
                                                <input 
                                                    type="text" 
                                                    value={editFormData.port_name}
                                                    onChange={e => setEditFormData({...editFormData, port_name: e.target.value})}
                                                    className="text-lg font-black text-slate-800 bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                                    placeholder="Nombre del Puerto"
                                                />
                                                <span className="text-xs font-bold text-slate-400 px-2 uppercase tracking-wider">ID: {port.port_id}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 flex flex-col gap-3 bg-white flex-1">
                                            <div className="flex items-center gap-2">
                                                <Globe size={16} className="text-slate-400 shrink-0" />
                                                <input 
                                                    type="text" 
                                                    value={editFormData.country}
                                                    onChange={e => setEditFormData({...editFormData, country: e.target.value})}
                                                    className="text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 w-full uppercase"
                                                    placeholder="País"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-slate-400 shrink-0" />
                                                <div className="flex gap-2 w-full">
                                                    <input 
                                                        type="number" 
                                                        step="any"
                                                        value={editFormData.lat}
                                                        onChange={e => setEditFormData({...editFormData, lat: e.target.value})}
                                                        className="text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 w-full"
                                                        placeholder="Latitud"
                                                    />
                                                    <input 
                                                        type="number" 
                                                        step="any"
                                                        value={editFormData.lon}
                                                        onChange={e => setEditFormData({...editFormData, lon: e.target.value})}
                                                        className="text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 w-full"
                                                        placeholder="Longitud"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 justify-end">
                                            <button 
                                                onClick={handleCancel}
                                                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1 shadow-sm"
                                            >
                                                {isSaving ? "Guardando..." : <><Save size={14} /> Guardar</>}
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            // Vista de Lectura Normal
                            const mapsUrl = `https://www.google.com/maps?q=${port.lat},${port.lon}`;

                            return (
                                <div key={port.port_id} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
                                    <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-br from-white to-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                                <Anchor size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1" title={port.port_name}>
                                                    {port.port_name}
                                                </h3>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{port.port_id}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleEditClick(port)}
                                            className="text-slate-300 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Editar Puerto"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </div>
                                    
                                    <div className="p-4 flex flex-col gap-3 flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <Globe size={14} className="text-slate-400" />
                                                <span className="flex items-center gap-2">
                                                    <img 
                                                        src={`https://flagcdn.com/16x12/${getCountryInfo(port.country).code}.png`} 
                                                        alt={getCountryInfo(port.country).name} 
                                                        className="w-4 h-3 object-cover rounded shadow-sm border border-slate-200"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                    <span>{getCountryInfo(port.country).name}</span>
                                                </span>
                                            </div>
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold border border-slate-200 uppercase">
                                                {getCountryInfo(port.country).code}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-col gap-1.5 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <MapPin size={12} className="text-teal-500" />
                                                <span className="font-mono">{port.lat}, {port.lon}</span>
                                            </div>
                                            <a 
                                                href={mapsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1 w-fit hover:underline"
                                            >
                                                Ver en Google Maps <ExternalLink size={10} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </MasterTemplate>
    );
};
