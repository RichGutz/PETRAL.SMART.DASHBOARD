import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MasterTemplate } from '../../components/Masters/MasterTemplate';
import { ForecastService } from '../../services/api';
import { Ship, Shield, Settings, Fuel, Save, Edit3, Plus, Activity } from 'lucide-react';

export const VesselsMaster: React.FC = () => {
    const navigate = navigateHook();
    const [vessels, setVessels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeVesselId, setActiveVesselId] = useState('MOQUEGUA');
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [dragOverItem, setDragOverItem] = useState<string | null>(null);

    function navigateHook() {
        try {
            return useNavigate();
        } catch {
            return () => {};
        }
    }

    useEffect(() => {
        const fetchVessels = async () => {
            try {
                setLoading(true);
                const data = await ForecastService.getVessels();
                setVessels(data);
                if (data.length > 0 && !data.some((v: any) => v.vessel_id === 'MOQUEGUA')) {
                    setActiveVesselId(data[0].vessel_id);
                }
            } catch (error) {
                console.error("Error al obtener los buques:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVessels();
    }, []);

    const selectedVessel = activeVesselId === 'NUEVO' 
        ? editFormData 
        : vessels.find((v: any) => v.vessel_id === activeVesselId);

    return (
        <MasterTemplate 
            title="Maestro de Flota" 

            subtitle="Ficha técnica detallada, límites operativos e hidráulicos y consumos granulares"
            activeTab="vessels"
            onBackToDashboard={() => navigate('/dashboard')}
        >
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 font-semibold animate-pulse gap-2">
                    <div className="animate-spin h-6 w-6 border-2 border-slate-300 border-t-blue-600 rounded-full"></div>
                    <span>Cargando datos maestros de flota...</span>
                </div>
            ) : vessels.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 font-semibold gap-2 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <span>No se encontraron naves registradas en Supabase.</span>
                </div>
            ) : (
                <div className="flex flex-col gap-6 w-full">
                    
                    {/* Selector de Pestañas */}
                    <div className="flex border-b border-slate-200 w-full overflow-x-auto gap-2 pb-px scrollbar-none items-center">
                        {vessels.map((v: any) => {
                            const isActive = v.vessel_id === activeVesselId;
                            return (
                                <button
                                    key={v.vessel_id}
                                    draggable={!isEditing}
                                    onDragStart={(e) => {
                                        setDraggedItem(v.vessel_id);
                                        e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (dragOverItem !== v.vessel_id) setDragOverItem(v.vessel_id);
                                    }}
                                    onDragLeave={() => {
                                        if (dragOverItem === v.vessel_id) setDragOverItem(null);
                                    }}
                                    onDrop={async (e) => {
                                        e.preventDefault();
                                        if (draggedItem && draggedItem !== v.vessel_id) {
                                            const draggedIdx = vessels.findIndex(x => x.vessel_id === draggedItem);
                                            const dropIdx = vessels.findIndex(x => x.vessel_id === v.vessel_id);
                                            
                                            const newVessels = [...vessels];
                                            const [removed] = newVessels.splice(draggedIdx, 1);
                                            newVessels.splice(dropIdx, 0, removed);
                                            
                                            const payload = newVessels.map((vsl, idx) => ({
                                                vessel_id: vsl.vessel_id,
                                                display_order: idx + 1
                                            }));
                                            
                                            setVessels(newVessels);
                                            setDraggedItem(null);
                                            setDragOverItem(null);
                                            
                                            try {
                                                await ForecastService.reorderVessels(payload);
                                            } catch (err) {
                                                console.error("Error reordering", err);
                                            }
                                        }
                                    }}
                                    onDragEnd={() => {
                                        setDraggedItem(null);
                                        setDragOverItem(null);
                                    }}
                                    onClick={() => {
                                        if (isEditing) {
                                            if (!confirm("Hay cambios sin guardar. ¿Desea descartarlos?")) return;
                                            setIsEditing(false);
                                        }
                                        setActiveVesselId(v.vessel_id);
                                    }}
                                    className={`px-6 py-2.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 shrink-0 ${!isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${
                                        isActive 
                                            ? 'border-blue-600 text-blue-600' 
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    } ${draggedItem === v.vessel_id ? 'opacity-30 border-dashed' : ''} ${dragOverItem === v.vessel_id && draggedItem !== v.vessel_id ? 'bg-blue-50 border-blue-300 rounded-t-md border-b-2 border-b-blue-600 scale-105 shadow-sm' : ''}`}
                                >
                                    <span className="text-sm">🚢</span> {v.vessel_name || v.vessel_id}
                                </button>
                            );
                        })}
                        <button 
                            onClick={() => {
                                if (isEditing && activeVesselId !== 'NUEVO') {
                                    if (!confirm("Hay cambios sin guardar. ¿Desea descartarlos?")) return;
                                }
                                setIsEditing(true);
                                setEditFormData({ 
                                    vessel_id: '', 
                                    vessel_name: 'NUEVO BARCO',
                                    flag: 'Peruana',
                                    imo: '',
                                    mmsi: '',
                                    flag_ais: 'Peru',
                                    ais_type: 'Tanker',
                                    draft_m: 6.0
                                });
                                setActiveVesselId('NUEVO');
                            }}
                            className="px-4 py-1.5 ml-2 text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors flex items-center gap-1 shrink-0"
                        >
                            <Plus size={14} /> Agregar Nuevo Barco
                        </button>
                    </div>

                    {selectedVessel && (
                        <div className="flex flex-col gap-6 w-full">
                            
                            {/* FILA 1: Imagen (Col 1) e Identificación Naval (Col 2 y 3) */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-stretch">
                                
                                {/* FOTO DEL BARCO */}
                                <div className="bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-sm relative group h-full min-h-[224px]">
                                    {selectedVessel.vessel_id === 'MOQUEGUA' ? (
                                        <img 
                                            src="/moquegua_1.jpg" 
                                            alt="B/T MOQUEGUA" 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                        />
                                    ) : selectedVessel.vessel_id === 'TABLONES' ? (
                                        <img 
                                            src="/tablones.jpeg" 
                                            alt="B/T TABLONES" 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-blue-900 flex flex-col items-center justify-center text-white p-6 gap-3">
                                            <Ship size={48} className="text-blue-300 animate-pulse" />
                                            <div className="text-center">
                                                <span className="font-bold text-sm block">Sin fotografía oficial</span>
                                                <span className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">Maqueta de Fallback</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-white/10">
                                        🇵🇪 {selectedVessel.flag || 'Peruana'}
                                    </div>
                                    <div 
                                        className="absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-white shadow-md cursor-help"
                                        style={{ backgroundColor: selectedVessel.color_hex || '#ccc' }}
                                        title={`Identificador visual: ${selectedVessel.color_hex || 'N/A'}`}
                                    ></div>
                                </div>

                                {/* IDENTIFICACIÓN NAVAL (Ahora en Col 2 y 3, en 3 columnas) */}
                                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
                                    <div className="border-b border-slate-100 pb-3 mb-2 flex justify-between items-center">
                                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                                            <Shield size={16} className="text-blue-600" /> Identificación Naval y Registro
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-5">
                                        {/* COLUMNA INTERNA 1 */}
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                                <span className="text-slate-500 font-bold uppercase text-[10px]">Identificador</span>
                                                {isEditing ? (
                                                    <input className="border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 w-24" value={editFormData?.vessel_id || ''} onChange={e => setEditFormData({...editFormData, vessel_id: e.target.value.toUpperCase()})} disabled={activeVesselId !== 'NUEVO'} />
                                                ) : <span className="font-mono font-bold text-slate-800">{selectedVessel.vessel_id}</span>}
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                                <span className="text-slate-500 font-bold uppercase text-[10px]">Nombre Oficial</span>
                                                {isEditing ? (
                                                    <input className="border border-slate-300 rounded px-1.5 py-0.5 text-right font-bold text-slate-800 focus:outline-none focus:border-blue-500 w-28" value={editFormData?.vessel_name || ''} onChange={e => setEditFormData({...editFormData, vessel_name: e.target.value.toUpperCase()})} />
                                                ) : <span className="font-bold text-slate-800">{selectedVessel.vessel_name}</span>}
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                                <span className="text-slate-500 font-bold uppercase text-[10px]">Año Construcción</span>
                                                {isEditing ? (
                                                    <input type="number" className="border border-slate-300 rounded px-1.5 py-0.5 text-right font-bold text-slate-800 focus:outline-none focus:border-blue-500 w-16" value={editFormData?.built || ''} onChange={e => setEditFormData({...editFormData, built: e.target.value})} />
                                                ) : <span className="font-bold text-slate-800">{selectedVessel.built || 'N/A'}</span>}
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                                <span className="text-slate-500 font-bold uppercase text-[10px]">Bandera AIS</span>
                                                {isEditing ? (
                                                    <input className="border border-slate-300 rounded px-1.5 py-0.5 text-right font-bold text-slate-800 focus:outline-none focus:border-blue-500 w-24" value={editFormData?.flag_ais || ''} onChange={e => setEditFormData({...editFormData, flag_ais: e.target.value})} />
                                                ) : <span className="font-bold text-slate-800 flex items-center gap-1">{selectedVessel.flag_ais === 'Peru' ? '🇵🇪' : (selectedVessel.flag_ais === 'Chile' ? '🇨🇱' : '')} {selectedVessel.flag_ais || 'N/A'}</span>}
                                            </div>
                                        </div>

                                        {/* COLUMNA INTERNA 2 */}
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                                <span className="text-slate-500 font-bold uppercase text-[10px]">IMO</span>
                                                {isEditing ? (
                                                    <input className="border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 w-24" value={editFormData?.imo || ''} onChange={e => setEditFormData({...editFormData, imo: e.target.value})} />
                                                ) : <span className="font-mono font-bold text-slate-800">{selectedVessel.imo || 'N/A'}</span>}
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                                <span className="text-slate-500 font-bold uppercase text-[10px]">MMSI</span>
                                                {isEditing ? (
                                                    <input className="border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 w-24" value={editFormData?.mmsi || ''} onChange={e => setEditFormData({...editFormData, mmsi: e.target.value})} />
                                                ) : <span className="font-mono font-bold text-slate-800">{selectedVessel.mmsi || 'N/A'}</span>}
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                                <span className="text-slate-500 font-bold uppercase text-[10px]">Tipo AIS</span>
                                                {isEditing ? (
                                                    <input className="border border-slate-300 rounded px-1.5 py-0.5 text-right font-bold text-slate-800 focus:outline-none focus:border-blue-500 w-28" value={editFormData?.ais_type || ''} onChange={e => setEditFormData({...editFormData, ais_type: e.target.value})} />
                                                ) : <span className="font-bold text-slate-800">{selectedVessel.ais_type || 'N/A'}</span>}
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                                <span className="text-slate-500 font-bold uppercase text-[10px]">Calado (Draft)</span>
                                                {isEditing ? (
                                                    <div className="flex gap-1 items-center"><input type="number" step="0.1" className="border border-slate-300 rounded px-1 w-16 text-right font-mono" value={editFormData?.draft_m || ''} onChange={e => setEditFormData({...editFormData, draft_m: Number(e.target.value)})} /><span className="text-[10px]">m</span></div>
                                                ) : <span className="font-mono font-bold text-slate-800">{selectedVessel.draft_m ? `${selectedVessel.draft_m} m` : 'N/A'}</span>}
                                            </div>
                                        </div>

                                        {/* COLUMNA INTERNA 3 */}
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                                <span className="text-slate-500 font-bold uppercase text-[10px]">Gross Tonnage (GRT)</span>
                                                {isEditing ? (
                                                    <div className="flex gap-1 items-center"><input type="number" className="border border-slate-300 rounded px-1 w-20 text-right font-mono" value={editFormData?.grt || ''} onChange={e => setEditFormData({...editFormData, grt: Number(e.target.value)})} /><span className="text-[10px]">t</span></div>
                                                ) : <span className="font-mono font-bold text-slate-800">{new Intl.NumberFormat().format(selectedVessel.grt || 0)} t</span>}
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                                <span className="text-slate-500 font-bold uppercase text-[10px]">Deadweight (DWT)</span>
                                                {isEditing ? (
                                                    <div className="flex gap-1 items-center"><input type="number" className="border border-slate-300 rounded px-1 w-20 text-right font-mono" value={editFormData?.dwt || ''} onChange={e => setEditFormData({...editFormData, dwt: Number(e.target.value)})} /><span className="text-[10px]">t</span></div>
                                                ) : <span className="font-mono font-bold text-slate-800">{new Intl.NumberFormat().format(selectedVessel.dwt || 0)} t</span>}
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                                <span className="text-slate-500 font-bold uppercase text-[10px]">Carga Comercial (DWCC)</span>
                                                {isEditing ? (
                                                    <div className="flex gap-1 items-center"><input type="number" className="border border-slate-300 rounded px-1 w-20 text-right font-mono text-blue-600 font-bold" value={editFormData?.dwcc || ''} onChange={e => setEditFormData({...editFormData, dwcc: Number(e.target.value)})} /><span className="text-[10px]">t</span></div>
                                                ) : <span className="font-mono font-bold text-slate-800 text-blue-600">{new Intl.NumberFormat().format(selectedVessel.dwcc || 0)} t</span>}
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                                <span className="text-slate-500 font-bold uppercase text-[10px]">Color Interfaz</span>
                                                {isEditing ? (
                                                    <div className="flex gap-2 items-center">
                                                        <input type="color" className="h-6 w-8 cursor-pointer rounded border border-slate-300 p-0.5" value={editFormData?.color_hex || '#cccccc'} onChange={e => setEditFormData({...editFormData, color_hex: e.target.value})} />
                                                        <span className="text-[10px] font-mono text-slate-500 uppercase">{editFormData?.color_hex || '#CCCCCC'}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2 items-center">
                                                        <div className="h-4 w-4 rounded-sm border border-slate-300" style={{ backgroundColor: selectedVessel.color_hex || '#ccc' }}></div>
                                                        <span className="font-mono font-bold text-slate-800 text-[10px]">{selectedVessel.color_hex || 'N/A'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* BOTONES DE EDICIÓN - Alineados al fondo */}
                                    <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2 justify-end">
                                        {!isEditing ? (
                                            <button 
                                                onClick={() => {
                                                    setEditFormData(selectedVessel);
                                                    setIsEditing(true);
                                                }}
                                                className="flex items-center gap-1 text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-6 py-2 rounded-lg font-bold transition-colors shadow-sm justify-center"
                                            >
                                                <Edit3 size={14} /> Editar Registro Naval
                                            </button>
                                        ) : (
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button 
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        if (activeVesselId === 'NUEVO' && vessels.length > 0) {
                                                            setActiveVesselId(vessels[0].vessel_id);
                                                        }
                                                    }}
                                                    className="flex items-center justify-center gap-1 text-xs bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 px-4 py-2 rounded-lg font-bold transition-colors shadow-sm"
                                                >
                                                    Cancelar
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            setIsSaving(true);
                                                            await ForecastService.saveVessel(editFormData);
                                                            alert("Barco guardado correctamente");
                                                            setIsEditing(false);
                                                            const data = await ForecastService.getVessels();
                                                            setVessels(data);
                                                            if (activeVesselId === 'NUEVO') {
                                                                setActiveVesselId(editFormData.vessel_id || data[data.length - 1]?.vessel_id);
                                                            }
                                                        } catch (error) {
                                                            console.error("Error al guardar barco:", error);
                                                            alert("Error al guardar barco");
                                                        } finally {
                                                            setIsSaving(false);
                                                        }
                                                    }}
                                                    disabled={isSaving}
                                                    className="flex items-center justify-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm disabled:opacity-50"
                                                >
                                                    <Save size={14} /> {isSaving ? 'Grabando...' : 'Grabar Cambios'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* FILA 2: Parámetros Operativos (Col 1) y Matriz de Consumos (Col 2 y 3) */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-stretch">
                                
                                {/* CARD 1: Parámetros Operativos (Ahora en Col 1, en vertical) */}
                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                                    <div className="border-b border-slate-100 pb-2 mb-1 flex justify-between items-center">
                                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5" title="Especificaciones técnicas de navegación del barco">
                                            <Settings size={14} className="text-blue-600" /> Parámetros de Navegación
                                        </h4>
                                    </div>

                                    <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                        <span className="text-slate-500 font-bold uppercase text-[10px]">Velocidad</span>
                                        {isEditing ? (
                                            <div className="flex gap-1 items-center"><input type="number" step="0.1" className="border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono text-sm" value={editFormData?.vessel_speed || ''} onChange={e => setEditFormData({...editFormData, vessel_speed: Number(e.target.value)})} /><span className="text-[10px]">kn</span></div>
                                        ) : <span className="font-mono font-bold text-slate-800">{selectedVessel.vessel_speed} <span className="text-[10px] font-bold">kn</span></span>}
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                        <span className="text-slate-500 font-bold uppercase text-[10px]">Eslora (LOA)</span>
                                        {isEditing ? (
                                            <div className="flex gap-1 items-center"><input type="number" step="0.1" className="border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono text-sm" value={editFormData?.length || ''} onChange={e => setEditFormData({...editFormData, length: Number(e.target.value)})} /><span className="text-[10px]">m</span></div>
                                        ) : <span className="font-mono font-bold text-slate-800">{selectedVessel.length || '—'} <span className="text-[10px] font-bold">m</span></span>}
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                        <span className="text-slate-500 font-bold uppercase text-[10px]">Manga (Beam)</span>
                                        {isEditing ? (
                                            <div className="flex gap-1 items-center"><input type="number" step="0.1" className="border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono text-sm" value={editFormData?.beam || ''} onChange={e => setEditFormData({...editFormData, beam: Number(e.target.value)})} /><span className="text-[10px]">m</span></div>
                                        ) : <span className="font-mono font-bold text-slate-800">{selectedVessel.beam || '—'} <span className="text-[10px] font-bold">m</span></span>}
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1 bg-blue-50 -mx-4 px-4 py-1">
                                        <span className="text-blue-700 font-black uppercase text-[10px]">TCE Requerido</span>
                                        {isEditing ? (
                                            <div className="flex gap-1 items-center"><input type="number" className="border border-blue-300 rounded px-1 w-20 text-right font-mono font-bold text-blue-700" value={editFormData?.tce_required || ''} onChange={e => setEditFormData({...editFormData, tce_required: Number(e.target.value)})} /><span className="text-[9px] text-blue-700">/d</span></div>
                                        ) : (
                                            <span className="font-mono font-black text-blue-700">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(selectedVessel.tce_required || 0)}
                                                <span className="text-[9px] font-bold">/d</span>
                                            </span>
                                        )}
                                    </div>

                                    <div className="border-b border-slate-100 pb-2 mt-4 mb-1 flex justify-between items-center">
                                        <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5" title="Restricciones físicas al conectar mangueras en el muelle">
                                            <Activity size={12} className="text-blue-600" /> Restricciones Hidráulicas
                                        </h4>
                                    </div>

                                    <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                        <span className="text-slate-500 font-bold uppercase text-[10px] pr-4">Admisión Max Carga</span>
                                        {isEditing ? (
                                            <div className="flex gap-1 items-center"><input type="number" className="border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono" value={editFormData?.vessel_max_load_intake_limit || ''} onChange={e => setEditFormData({...editFormData, vessel_max_load_intake_limit: Number(e.target.value)})} /><span className="text-[10px]">T/h</span></div>
                                        ) : <span className="font-mono font-bold text-slate-800 shrink-0">{new Intl.NumberFormat().format(selectedVessel.vessel_max_load_intake_limit)} T/h</span>}
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-1">
                                        <span className="text-slate-500 font-bold uppercase text-[10px] pr-4">Bombeo de Descarga</span>
                                        {isEditing ? (
                                            <div className="flex gap-1 items-center"><input type="number" className="border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono" value={editFormData?.vessel_pump_discharge_rate || ''} onChange={e => setEditFormData({...editFormData, vessel_pump_discharge_rate: Number(e.target.value)})} /><span className="text-[10px]">T/h</span></div>
                                        ) : <span className="font-mono font-bold text-slate-800 shrink-0">{new Intl.NumberFormat().format(selectedVessel.vessel_pump_discharge_rate)} T/h</span>}
                                    </div>

                                </div>

                                {/* CARD 2: Matriz de Consumos de Combustible Granulares (Col 2 y 3) */}
                                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
                                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                                            <Fuel size={15} className="text-blue-600" /> Matriz de Consumo Granular (Combustibles)
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* IFO */}
                                        <div className="flex flex-col border border-slate-200 rounded-lg overflow-hidden h-full">
                                            <div className="bg-slate-800 text-white p-2.5 font-bold text-xs uppercase tracking-wider text-center">
                                                IFO (Fuel Oil Pesado)
                                            </div>
                                            <div className="p-3 flex flex-col gap-2 font-mono text-xs flex-1">
                                                <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Capacidad Máx</span>{isEditing ? <input type="number" className="border border-slate-300 rounded px-1 w-16 text-right" value={editFormData?.max_capacity_ifo ?? ''} onChange={e => setEditFormData({...editFormData, max_capacity_ifo: e.target.value === '' ? '' : Number(e.target.value)})} /> : <span className="font-bold text-slate-800">{selectedVessel.max_capacity_ifo ?? 0} t</span>}</div>
                                                <div className="flex justify-between items-center border-t border-slate-100 pt-1.5"><span className="text-[9px] font-bold text-slate-500 uppercase">Navegando (Sea)</span>{isEditing ? <input type="number" step="0.1" className="border border-slate-300 rounded px-1 w-16 text-right" value={editFormData?.consumption_sea_ifo ?? ''} onChange={e => setEditFormData({...editFormData, consumption_sea_ifo: e.target.value === '' ? '' : Number(e.target.value)})} /> : <span className="font-bold text-slate-800 text-sm">{selectedVessel.consumption_sea_ifo ?? 0} t/d</span>}</div>
                                                <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Puerto (Port)</span>{isEditing ? <input type="number" step="0.1" className="border border-slate-300 rounded px-1 w-16 text-right" value={editFormData?.consumption_port_ifo ?? ''} onChange={e => setEditFormData({...editFormData, consumption_port_ifo: e.target.value === '' ? '' : Number(e.target.value)})} /> : <span className="font-bold text-slate-850">{selectedVessel.consumption_port_ifo ?? 0} t/d</span>}</div>
                                                <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Espera (Idle)</span>{isEditing ? <input type="number" step="0.1" className="border border-slate-300 rounded px-1 w-16 text-right" value={editFormData?.consumption_idle_ifo ?? ''} onChange={e => setEditFormData({...editFormData, consumption_idle_ifo: e.target.value === '' ? '' : Number(e.target.value)})} /> : <span className="font-bold text-slate-850">{selectedVessel.consumption_idle_ifo ?? 0} t/d</span>}</div>
                                                <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Maniobra Carga</span>{isEditing ? <input type="number" step="0.1" className="border border-slate-300 rounded px-1 w-16 text-right" value={editFormData?.consumption_load_ifo ?? ''} onChange={e => setEditFormData({...editFormData, consumption_load_ifo: e.target.value === '' ? '' : Number(e.target.value)})} /> : <span className="font-bold text-slate-850">{selectedVessel.consumption_load_ifo ?? 0} t/d</span>}</div>
                                                <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Maniobra Descarga</span>{isEditing ? <input type="number" step="0.1" className="border border-slate-300 rounded px-1 w-16 text-right" value={editFormData?.consumption_disch_ifo ?? ''} onChange={e => setEditFormData({...editFormData, consumption_disch_ifo: e.target.value === '' ? '' : Number(e.target.value)})} /> : <span className="font-bold text-slate-850">{selectedVessel.consumption_disch_ifo ?? 0} t/d</span>}</div>
                                            </div>
                                        </div>

                                        {/* MDO */}
                                        <div className="flex flex-col border border-slate-200 rounded-lg overflow-hidden h-full">
                                            <div className="bg-amber-600 text-white p-2.5 font-bold text-xs uppercase tracking-wider text-center">
                                                MDO (Marine Diesel Oil)
                                            </div>
                                            <div className="p-3 flex flex-col gap-2 font-mono text-xs flex-1">
                                                <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Capacidad Máx</span>{isEditing ? <input type="number" className="border border-slate-300 rounded px-1 w-16 text-right" value={editFormData?.max_capacity_mdo ?? ''} onChange={e => setEditFormData({...editFormData, max_capacity_mdo: e.target.value === '' ? '' : Number(e.target.value)})} /> : <span className="font-bold text-slate-800">{selectedVessel.max_capacity_mdo ?? 0} t</span>}</div>
                                                <div className="flex justify-between items-center border-t border-slate-100 pt-1.5"><span className="text-[9px] font-bold text-slate-500 uppercase">Navegando (Sea)</span>{isEditing ? <input type="number" step="0.1" className="border border-slate-300 rounded px-1 w-16 text-right" value={editFormData?.consumption_sea_mdo ?? ''} onChange={e => setEditFormData({...editFormData, consumption_sea_mdo: e.target.value === '' ? '' : Number(e.target.value)})} /> : <span className="font-bold text-slate-800 text-sm">{selectedVessel.consumption_sea_mdo ?? 0} t/d</span>}</div>
                                                <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Espera (Idle)</span>{isEditing ? <input type="number" step="0.1" className="border border-slate-300 rounded px-1 w-16 text-right" value={editFormData?.consumption_idle_mdo ?? ''} onChange={e => setEditFormData({...editFormData, consumption_idle_mdo: e.target.value === '' ? '' : Number(e.target.value)})} /> : <span className="font-bold text-slate-850">{selectedVessel.consumption_idle_mdo ?? 0} t/d</span>}</div>
                                                <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Maniobra Carga</span>{isEditing ? <input type="number" step="0.1" className="border border-slate-300 rounded px-1 w-16 text-right" value={editFormData?.consumption_load_mdo ?? ''} onChange={e => setEditFormData({...editFormData, consumption_load_mdo: e.target.value === '' ? '' : Number(e.target.value)})} /> : <span className="font-bold text-slate-850">{selectedVessel.consumption_load_mdo ?? 0} t/d</span>}</div>
                                                <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-500 uppercase">Maniobra Descarga</span>{isEditing ? <input type="number" step="0.1" className="border border-slate-300 rounded px-1 w-16 text-right" value={editFormData?.consumption_disch_mdo ?? ''} onChange={e => setEditFormData({...editFormData, consumption_disch_mdo: e.target.value === '' ? '' : Number(e.target.value)})} /> : <span className="font-bold text-slate-850">{selectedVessel.consumption_disch_mdo ?? 0} t/d</span>}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </MasterTemplate>
    );
};
