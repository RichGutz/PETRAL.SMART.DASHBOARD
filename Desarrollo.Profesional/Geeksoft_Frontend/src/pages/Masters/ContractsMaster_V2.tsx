import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Save, Plus, Trash2, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ContractTariff {
    min_tonnage: number;
    max_tonnage: number;
    freight_rate: number;
}

interface Contract {
    contract_id: string;
    client_id: string;
    origin_port_id: string;
    destination_port_id: string;
    is_active: boolean;
    valid_from: string | null;
    valid_to: string | null;
    load_rate: number;
    discharge_rate: number;
    address_commission: number;
    broker_commission: number;
    bunker_baseline_price_ifo: number;
    baf_rules: string | null;
    time_to_count_carga_hrs: number;
    maneuver_carga_hrs: number;
    time_to_count_descarga_hrs: number;
    maneuver_descarga_hrs: number;
    tariffs: ContractTariff[];
}

export const ContractsMaster: React.FC = () => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [ports, setPorts] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    
    // UI State for grouping
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [selectedRouteKey, setSelectedRouteKey] = useState<string | null>(null);

    const getRouteKey = (c: Contract) => {
        // If it's a new unsaved route, it might have empty ports, but contract_id (uuid) makes it unique
        return `${c.contract_id}|${c.origin_port_id}|${c.destination_port_id}`;
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [contractsData, clientsData, portsData] = await Promise.all([
                    ForecastService.getContractsMaster(),
                    ForecastService.getClientsMaster(),
                    ForecastService.getPorts()
                ]);
                setContracts(contractsData || []);
                setClients(clientsData || []);
                setPorts(portsData || []);
            } catch (err) {
                console.error("Error loading contracts:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Unique clients that have contracts
    const activeClientIds = useMemo(() => {
        const ids = new Set(contracts.map(c => c.client_id));
        return Array.from(ids);
    }, [contracts]);

    // Set a default selected client if none is selected
    useEffect(() => {
        if (!loading && activeClientIds.length > 0 && selectedClientId === null) {
            setSelectedClientId(activeClientIds[0]);
        }
    }, [loading, activeClientIds, selectedClientId]);

    const handleAddClientContract = () => {
        const newContract: Contract = {
            contract_id: uuidv4(),
            client_id: '', // Starts empty, user picks it
            origin_port_id: '',
            destination_port_id: '',
            is_active: true,
            valid_from: '',
            valid_to: '',
            load_rate: 0,
            discharge_rate: 0,
            address_commission: 0,
            broker_commission: 0,
            bunker_baseline_price_ifo: 0,
            baf_rules: '',
            time_to_count_carga_hrs: 6,
            maneuver_carga_hrs: 0,
            time_to_count_descarga_hrs: 6,
            maneuver_descarga_hrs: 0,
            tariffs: []
        };
        setContracts([...contracts, newContract]);
        setSelectedClientId('');
        setSelectedRouteKey(getRouteKey(newContract));
        setHasChanges(true);
    };

    const handleAddRouteToClient = (clientId: string) => {
        // Find existing contract_id for this client to share it, or generate new
        const existingRoute = contracts.find(c => c.client_id === clientId);
        const sharedContractId = existingRoute ? existingRoute.contract_id : uuidv4();
        
        const newContract: Contract = {
            contract_id: sharedContractId,
            client_id: clientId,
            origin_port_id: '',
            destination_port_id: '',
            is_active: true,
            valid_from: '',
            valid_to: '',
            load_rate: 0,
            discharge_rate: 0,
            address_commission: 0,
            broker_commission: 0,
            bunker_baseline_price_ifo: 0,
            baf_rules: '',
            time_to_count_carga_hrs: 6,
            maneuver_carga_hrs: 0,
            time_to_count_descarga_hrs: 6,
            maneuver_descarga_hrs: 0,
            tariffs: []
        };
        setContracts([...contracts, newContract]);
        setSelectedRouteKey(getRouteKey(newContract));
        setHasChanges(true);
    };

    const handleRemoveContract = (routeKey: string) => {
        if (confirm('¿Estás seguro de eliminar esta ruta del contrato?')) {
            const nextContracts = contracts.filter(c => getRouteKey(c) !== routeKey);
            setContracts(nextContracts);
            if (selectedRouteKey === routeKey) setSelectedRouteKey(null);
            
            // If we deleted the last route for a client, clear selected client
            const contractToRemove = contracts.find(c => getRouteKey(c) === routeKey);
            if (contractToRemove) {
                const remainingRoutesForClient = nextContracts.filter(c => c.client_id === contractToRemove.client_id);
                if (remainingRoutesForClient.length === 0) {
                    setSelectedClientId(null);
                }
            }
            setHasChanges(true);
        }
    };

    const handleChange = (routeKey: string, field: keyof Contract, value: any) => {
        let newRouteKey = routeKey;
        setContracts(contracts.map(c => {
            if (getRouteKey(c) === routeKey) {
                const updated = { ...c, [field]: value };
                if (field === 'client_id' && c.client_id === selectedClientId) {
                    setSelectedClientId(value);
                }
                newRouteKey = getRouteKey(updated);
                return updated;
            }
            return c;
        }));
        if (newRouteKey !== routeKey) {
            setSelectedRouteKey(newRouteKey);
        }
        setHasChanges(true);
    };

    const handleAddTariff = (routeKey: string) => {
        setContracts(contracts.map(c => {
            if (getRouteKey(c) === routeKey) {
                return {
                    ...c,
                    tariffs: [...c.tariffs, { min_tonnage: 0, max_tonnage: 0, freight_rate: 0 }]
                };
            }
            return c;
        }));
        setHasChanges(true);
    };

    const handleTariffChange = (routeKey: string, tariffIdx: number, field: keyof ContractTariff, value: number) => {
        setContracts(contracts.map(c => {
            if (getRouteKey(c) === routeKey) {
                const nextTariffs = [...c.tariffs];
                nextTariffs[tariffIdx] = { ...nextTariffs[tariffIdx], [field]: value };
                return { ...c, tariffs: nextTariffs };
            }
            return c;
        }));
        setHasChanges(true);
    };

    const handleRemoveTariff = (routeKey: string, tariffIdx: number) => {
        setContracts(contracts.map(c => {
            if (getRouteKey(c) === routeKey) {
                const nextTariffs = [...c.tariffs];
                nextTariffs.splice(tariffIdx, 1);
                return { ...c, tariffs: nextTariffs };
            }
            return c;
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await ForecastService.saveContractsMaster(contracts);
            setHasChanges(false);
            alert("Maestro de contratos guardado con éxito.");
        } catch (err) {
            console.error("Error saving contracts:", err);
            alert("Error al guardar contratos.");
        } finally {
            setIsSaving(false);
        }
    };

    // Client's routes (contracts in DB)
    const clientRoutes = contracts.filter(c => c.client_id === selectedClientId);
    
    // Auto-select first route if none selected when clicking a client
    useEffect(() => {
        if (selectedClientId && clientRoutes.length > 0) {
            if (!selectedRouteKey || !clientRoutes.find(c => getRouteKey(c) === selectedRouteKey)) {
                setSelectedRouteKey(getRouteKey(clientRoutes[0]));
            }
        }
    }, [selectedClientId, clientRoutes, selectedRouteKey]);

    const selectedRoute = contracts.find(c => getRouteKey(c) === selectedRouteKey);

    if (loading) {
        return (
            <MasterTemplate title="Maestro de Contratos" activeTab="contracts">
                <div className="flex justify-center items-center h-64 text-slate-500 font-medium">
                    Cargando maestro de contratos...
                </div>
            </MasterTemplate>
        );
    }

    return (
        <MasterTemplate title="Maestro de Contratos" activeTab="contracts">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 flex flex-col h-[calc(100vh-140px)]">
                {/* Cabecera / Controles Superiores */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={18} className="text-blue-600" />
                            Libros de Contrato
                        </h2>
                        
                        {/* Pestañas Horizontales de Clientes */}
                        <div className="flex bg-slate-200 p-1 rounded-lg gap-1">
                            {activeClientIds.map(clientId => {
                                const isSelected = selectedClientId === clientId;
                                const clientInfo = clients.find(cl => cl.client_id === clientId);
                                const clientName = clientInfo?.client_name || clientId || 'Nuevo (Sin Asignar)';
                                return (
                                    <button
                                        key={clientId}
                                        onClick={() => setSelectedClientId(clientId)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
                                            isSelected 
                                                ? 'bg-white text-blue-700 shadow-sm' 
                                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-300'
                                        }`}
                                    >
                                        {clientName}
                                    </button>
                                );
                            })}
                            
                            <button 
                                onClick={handleAddClientContract}
                                className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold px-3 py-1.5 rounded-md transition-colors ml-2"
                            >
                                <Plus size={14} /> Nuevo Contrato
                            </button>
                        </div>
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

                <div className="flex flex-1 overflow-hidden">
                    {/* Contenedor Principal (100% de ancho, sin panel lateral) */}
                    <div className="flex-1 flex flex-col bg-slate-50">
                        {selectedClientId !== null ? (
                            <>
                                {/* Pestañas Horizontales de Rutas */}
                                <div className="bg-slate-100 border-b border-slate-200 px-6 pt-4 flex gap-2 overflow-x-auto shadow-inner">
                                    {clientRoutes.map(route => {
                                        const routeKey = getRouteKey(route);
                                        const isSelected = selectedRouteKey === routeKey;
                                        const tabName = (!route.origin_port_id && !route.destination_port_id) 
                                            ? 'Nueva Ruta' 
                                            : `${route.origin_port_id} → ${route.destination_port_id}`;
                                            
                                        return (
                                            <button
                                                key={routeKey}
                                                onClick={() => setSelectedRouteKey(routeKey)}
                                                className={`px-5 py-2.5 text-xs font-bold rounded-t-lg transition-colors border border-b-0 flex items-center gap-2 ${
                                                    isSelected 
                                                        ? 'bg-white text-blue-700 border-slate-200 relative top-[1px]' 
                                                        : 'bg-slate-200 text-slate-500 border-transparent hover:bg-slate-300 hover:text-slate-700'
                                                }`}
                                            >
                                                <span className={`w-2 h-2 rounded-full ${route.is_active ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                                {tabName}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => handleAddRouteToClient(selectedClientId)}
                                        className="px-4 py-2 text-xs font-bold rounded-t-lg bg-white/50 text-slate-500 border border-slate-200 border-dashed border-b-0 hover:bg-slate-200 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                    >
                                        <Plus size={12} /> Agregar Ruta a {clients.find(c => c.client_id === selectedClientId)?.client_name || selectedClientId || 'Cliente'}
                                    </button>
                                </div>

                                {/* Contenido de la Ruta Seleccionada (Formulario) */}
                                <div className="flex-1 overflow-auto bg-white p-8">
                                    {selectedRoute ? (
                                        <div className="max-w-4xl mx-auto space-y-8">
                                            
                                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                                                <h3 className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                                    Configuración de la Ruta {selectedRoute.origin_port_id && selectedRoute.destination_port_id ? `(${selectedRoute.origin_port_id} - ${selectedRoute.destination_port_id})` : ''}
                                                </h3>
                                                <button 
                                                    onClick={() => handleRemoveContract(selectedRouteKey!)}
                                                    className="text-xs text-red-600 hover:text-white font-bold px-3 py-1.5 bg-red-50 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-1 border border-red-200 hover:border-red-600"
                                                >
                                                    <Trash2 size={14} /> Eliminar Ruta del Contrato
                                                </button>
                                            </div>

                                            {/* 1. Definición */}
                                            <section className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm">
                                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">1. Definición Operativa & Vigencia</h4>
                                                
                                                <div className="grid grid-cols-2 gap-5">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Cliente Asignado</label>
                                                        <select 
                                                            value={selectedRoute.client_id}
                                                            onChange={(e) => handleChange(selectedRouteKey!, 'client_id', e.target.value)}
                                                            className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white font-semibold text-slate-700"
                                                        >
                                                            <option value="">Seleccione Cliente...</option>
                                                            {clients.map(c => (
                                                                <option key={c.client_id} value={c.client_id}>{c.client_name} ({c.client_id})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex items-end">
                                                        <label className="flex items-center gap-3 cursor-pointer bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm w-full transition-colors hover:border-blue-300">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={selectedRoute.is_active}
                                                                onChange={(e) => handleChange(selectedRouteKey!, 'is_active', e.target.checked)}
                                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm font-bold text-slate-700">Ruta Activa en el Contrato</span>
                                                        </label>
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Puerto Origen</label>
                                                        <select 
                                                            value={selectedRoute.origin_port_id}
                                                            onChange={(e) => handleChange(selectedRouteKey!, 'origin_port_id', e.target.value)}
                                                            className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
                                                        >
                                                            <option value="">Seleccione Puerto...</option>
                                                            {ports.map(p => (
                                                                <option key={p.port_id} value={p.port_id}>{p.port_name} ({p.country})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Puerto Destino</label>
                                                        <select 
                                                            value={selectedRoute.destination_port_id}
                                                            onChange={(e) => handleChange(selectedRouteKey!, 'destination_port_id', e.target.value)}
                                                            className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
                                                        >
                                                            <option value="">Seleccione Puerto...</option>
                                                            {ports.map(p => (
                                                                <option key={p.port_id} value={p.port_id}>{p.port_name} ({p.country})</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Válido Desde</label>
                                                        <input 
                                                            type="date" 
                                                            value={selectedRoute.valid_from || ''}
                                                            onChange={(e) => handleChange(selectedRouteKey!, 'valid_from', e.target.value)}
                                                            className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Válido Hasta</label>
                                                        <input 
                                                            type="date" 
                                                            value={selectedRoute.valid_to || ''}
                                                            onChange={(e) => handleChange(selectedRouteKey!, 'valid_to', e.target.value)}
                                                            className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
                                                        />
                                                    </div>
                                                </div>
                                            </section>

                                            {/* 2. Operativo & Tiempos */}
                                            <div className="grid grid-cols-2 gap-8">
                                                <section className="space-y-4">
                                                    <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider border-b border-blue-200 pb-2">Operaciones Origen</h4>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Load Rate (mt/día)</label>
                                                            <input 
                                                                type="number" 
                                                                value={selectedRoute.load_rate}
                                                                onChange={(e) => handleChange(selectedRouteKey!, 'load_rate', parseFloat(e.target.value))}
                                                                className="w-full text-sm border border-blue-200 rounded-lg p-2.5 font-mono bg-blue-50/50 focus:border-blue-400 focus:outline-none"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Time to Count (hrs)</label>
                                                                <input 
                                                                    type="number" 
                                                                    value={selectedRoute.time_to_count_carga_hrs}
                                                                    onChange={(e) => handleChange(selectedRouteKey!, 'time_to_count_carga_hrs', parseFloat(e.target.value))}
                                                                    className="w-full text-sm border border-blue-200 rounded-lg p-2.5 font-mono bg-blue-50/50 focus:border-blue-400 focus:outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Maneuver (hrs)</label>
                                                                <input 
                                                                    type="number" 
                                                                    value={selectedRoute.maneuver_carga_hrs}
                                                                    onChange={(e) => handleChange(selectedRouteKey!, 'maneuver_carga_hrs', parseFloat(e.target.value))}
                                                                    className="w-full text-sm border border-blue-200 rounded-lg p-2.5 font-mono bg-blue-50/50 focus:border-blue-400 focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>

                                                <section className="space-y-4">
                                                    <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider border-b border-amber-200 pb-2">Operaciones Destino</h4>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Discharge Rate (mt/día)</label>
                                                            <input 
                                                                type="number" 
                                                                value={selectedRoute.discharge_rate}
                                                                onChange={(e) => handleChange(selectedRouteKey!, 'discharge_rate', parseFloat(e.target.value))}
                                                                className="w-full text-sm border border-amber-200 rounded-lg p-2.5 font-mono bg-amber-50/50 focus:border-amber-400 focus:outline-none"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Time to Count (hrs)</label>
                                                                <input 
                                                                    type="number" 
                                                                    value={selectedRoute.time_to_count_descarga_hrs}
                                                                    onChange={(e) => handleChange(selectedRouteKey!, 'time_to_count_descarga_hrs', parseFloat(e.target.value))}
                                                                    className="w-full text-sm border border-amber-200 rounded-lg p-2.5 font-mono bg-amber-50/50 focus:border-amber-400 focus:outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Maneuver (hrs)</label>
                                                                <input 
                                                                    type="number" 
                                                                    value={selectedRoute.maneuver_descarga_hrs}
                                                                    onChange={(e) => handleChange(selectedRouteKey!, 'maneuver_descarga_hrs', parseFloat(e.target.value))}
                                                                    className="w-full text-sm border border-amber-200 rounded-lg p-2.5 font-mono bg-amber-50/50 focus:border-amber-400 focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>
                                            </div>

                                            {/* 4. Financiero */}
                                            <section className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm">
                                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Acuerdos Financieros & Comisiones</h4>
                                                <div className="grid grid-cols-3 gap-5">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Address Comm. (%)</label>
                                                        <input 
                                                            type="number" step="0.01"
                                                            value={selectedRoute.address_commission}
                                                            onChange={(e) => handleChange(selectedRouteKey!, 'address_commission', parseFloat(e.target.value))}
                                                            className="w-full text-sm border border-slate-300 rounded-lg p-2 font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Broker Comm. (%)</label>
                                                        <input 
                                                            type="number" step="0.01"
                                                            value={selectedRoute.broker_commission}
                                                            onChange={(e) => handleChange(selectedRouteKey!, 'broker_commission', parseFloat(e.target.value))}
                                                            className="w-full text-sm border border-slate-300 rounded-lg p-2 font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Baseline IFO Price ($)</label>
                                                        <input 
                                                            type="number" step="0.01"
                                                            value={selectedRoute.bunker_baseline_price_ifo}
                                                            onChange={(e) => handleChange(selectedRouteKey!, 'bunker_baseline_price_ifo', parseFloat(e.target.value))}
                                                            className="w-full text-sm border border-slate-300 rounded-lg p-2 font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            </section>

                                            {/* 5. Tarifas (Tiers) */}
                                            <section className="space-y-4 pt-2">
                                                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                                    <h4 className="text-sm font-black text-teal-800 uppercase tracking-wider">Bandas de Tarifas (Tiers) para esta Ruta</h4>
                                                    <button 
                                                        onClick={() => handleAddTariff(selectedRouteKey!)}
                                                        className="text-[11px] bg-teal-50 border border-teal-200 hover:bg-teal-100 font-bold px-4 py-2 rounded-lg text-teal-700 flex items-center gap-1 transition-colors"
                                                    >
                                                        <Plus size={14} /> Agregar Tarifa
                                                    </button>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-2 text-[10px] font-bold text-slate-500 uppercase">
                                                        <div>Min Tonnage (MT)</div>
                                                        <div>Max Tonnage (MT)</div>
                                                        <div>Flete ($/mt)</div>
                                                        <div className="w-8"></div>
                                                    </div>
                                                    
                                                    {selectedRoute.tariffs.map((t, idx) => (
                                                        <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                                            <input 
                                                                type="number" 
                                                                value={t.min_tonnage}
                                                                onChange={(e) => handleTariffChange(selectedRouteKey!, idx, 'min_tonnage', parseFloat(e.target.value))}
                                                                className="w-full text-sm border border-slate-300 rounded-lg p-2 font-mono"
                                                                placeholder="Ej: 0"
                                                            />
                                                            <input 
                                                                type="number" 
                                                                value={t.max_tonnage}
                                                                onChange={(e) => handleTariffChange(selectedRouteKey!, idx, 'max_tonnage', parseFloat(e.target.value))}
                                                                className="w-full text-sm border border-slate-300 rounded-lg p-2 font-mono"
                                                                placeholder="Ej: 5000"
                                                            />
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                                                                <input 
                                                                    type="number" step="0.01"
                                                                    value={t.freight_rate}
                                                                    onChange={(e) => handleTariffChange(selectedRouteKey!, idx, 'freight_rate', parseFloat(e.target.value))}
                                                                    className="w-full pl-7 pr-2 py-2 text-sm border border-teal-300 bg-white focus:border-teal-500 focus:outline-none rounded-lg font-mono text-teal-900 font-bold shadow-sm"
                                                                    placeholder="Ej: 25.50"
                                                                />
                                                            </div>
                                                            <button 
                                                                onClick={() => handleRemoveTariff(selectedRouteKey!, idx)}
                                                                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                                                title="Eliminar tarifa"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    
                                                    {selectedRoute.tariffs.length === 0 && (
                                                        <div className="text-center text-sm text-slate-500 py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 font-medium">
                                                            No hay bandas de precios configuradas. El simulador usará $0.
                                                        </div>
                                                    )}
                                                </div>
                                            </section>

                                            {/* Espaciado final */}
                                            <div className="h-10"></div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                                            <FileText size={48} className="opacity-20" />
                                            <p className="font-medium text-lg">Selecciona una ruta o crea una nueva.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                                <FileText size={48} className="opacity-20" />
                                <p className="font-medium text-lg">Crea un Nuevo Contrato para comenzar.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MasterTemplate>
    );
};
