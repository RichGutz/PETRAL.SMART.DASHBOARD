import React, { useState, useEffect } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Save, Plus, Trash2 } from 'lucide-react';

interface Client {
    client_id: string;
    client_name: string;
    color_hex: string;
}

export const ClientsMaster: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await ForecastService.getClientsMaster();
                setClients(data);
            } catch (err) {
                console.error("Error loading clients:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleAddClient = () => {
        const newClient: Client = {
            client_id: `CLIENT_${clients.length + 1}`,
            client_name: "NUEVO CLIENTE",
            color_hex: "#3b82f6"
        };
        setClients([...clients, newClient]);
        setHasChanges(true);
    };

    const handleRemoveClient = (idx: number) => {
        if (confirm('¿Estás seguro de eliminar este cliente? Esto podría afectar contratos y viajes existentes.')) {
            const next = [...clients];
            next.splice(idx, 1);
            setClients(next);
            setHasChanges(true);
        }
    };

    const handleChange = (idx: number, field: keyof Client, value: string) => {
        const next = [...clients];
        next[idx] = { ...next[idx], [field]: value };
        setClients(next);
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await ForecastService.saveClientsMaster(clients);
            setHasChanges(false);
            alert("Maestro de clientes guardado con éxito.");
        } catch (err) {
            console.error("Error saving clients:", err);
            alert("Error al guardar clientes.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <MasterTemplate title="Maestro de Clientes" activeTab="clients">
                <div className="flex justify-center items-center h-64 text-slate-500 font-medium">
                    Cargando maestro de clientes...
                </div>
            </MasterTemplate>
        );
    }

    return (
        <MasterTemplate title="Maestro de Clientes" activeTab="clients">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 flex flex-col h-[calc(100vh-140px)]">
                {/* Cabecera / Controles */}
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleAddClient}
                            className="flex items-center gap-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Plus size={14} /> Agregar Cliente
                        </button>
                    </div>
                    
                    <button 
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                        <Save size={14} />
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>

                <div className="p-6 overflow-auto">
                    <div className="max-w-4xl mx-auto space-y-4">
                        <div className="grid grid-cols-[1fr_2fr_1fr_auto] gap-4 px-4 py-2 bg-slate-100 rounded-lg font-black text-xs text-slate-600 uppercase">
                            <div>ID Cliente</div>
                            <div>Razón Social</div>
                            <div>Color UI</div>
                            <div className="w-8"></div>
                        </div>

                        {clients.map((client, idx) => (
                            <div key={idx} className="grid grid-cols-[1fr_2fr_1fr_auto] gap-4 items-center bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-colors shadow-sm">
                                <div>
                                    <input 
                                        type="text" 
                                        value={client.client_id}
                                        onChange={(e) => handleChange(idx, 'client_id', e.target.value.toUpperCase())}
                                        placeholder="Ej: SPCC"
                                        className="w-full h-9 px-3 text-sm border border-slate-300 rounded focus:border-blue-500 outline-none font-bold text-slate-700 uppercase"
                                    />
                                </div>
                                <div>
                                    <input 
                                        type="text" 
                                        value={client.client_name}
                                        onChange={(e) => handleChange(idx, 'client_name', e.target.value)}
                                        placeholder="Razón Social Completa"
                                        className="w-full h-9 px-3 text-sm border border-slate-300 rounded focus:border-blue-500 outline-none font-medium text-slate-700"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="color" 
                                        value={client.color_hex || "#cccccc"}
                                        onChange={(e) => handleChange(idx, 'color_hex', e.target.value)}
                                        className="h-9 w-12 cursor-pointer rounded border border-slate-300 p-1"
                                    />
                                    <span className="text-xs font-mono text-slate-500 uppercase">{client.color_hex}</span>
                                </div>
                                <div>
                                    <button 
                                        onClick={() => handleRemoveClient(idx)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Eliminar cliente"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {clients.length === 0 && (
                            <div className="text-center py-10 text-slate-500 font-medium">
                                No hay clientes registrados. Agrega uno nuevo.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MasterTemplate>
    );
};
