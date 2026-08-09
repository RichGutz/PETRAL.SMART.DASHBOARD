import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Save, Plus, Trash2, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import { useAuth } from '../../context/AuthContext';
import type { ExportColumn } from '../../lib/masterExport';

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
    bunker_baseline_price_mdo: number;
    baf_rules: string | null;
    comments: { text: string; date: string; user: string }[];
    time_to_count_carga_hrs: number;
    maneuver_carga_hrs: number;
    time_to_count_descarga_hrs: number;
    maneuver_descarga_hrs: number;
    tariffs: ContractTariff[];
    demurrage_rates: Record<string, number>;
}

export const ContractsMaster: React.FC = () => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [rawClients, setRawClients] = useState<any[]>([]);
    const [ports, setPorts] = useState<any[]>([]);
    const [vessels, setVessels] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    
    // Auth context for comments
    const { user } = useAuth();
    const [newCommentText, setNewCommentText] = useState('');
    
    // UI State for grouping
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [selectedRouteKey, setSelectedRouteKey] = useState<string | null>(null);

    const getRouteKey = (c: Contract) => {
        // If it's a new unsaved route, it might have empty ports, but contract_id (uuid) makes it unique
        return `${c.contract_id}|${c.origin_port_id}|${c.destination_port_id}`;
    };

    const [bunkerPrices, setBunkerPrices] = useState<{ ifo: number; mdo: number; date: string }>({
        ifo: 0,
        mdo: 0,
        date: 'N/A'
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [contractsData, clientsData, portsData, vesselsData, bunkerData] = await Promise.all([
                    ForecastService.getContractsMaster(),
                    ForecastService.getClientsMaster(),
                    ForecastService.getPorts(),
                    ForecastService.getVessels(),
                    ForecastService.getBunkerPrices()
                ]);
                setContracts(contractsData || []);
                setRawClients(clientsData || []);
                setPorts(portsData || []);
                setVessels(vesselsData || []);

                if (bunkerData && bunkerData.length > 0) {
                    const sorted = [...bunkerData].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
                    const latestDate = sorted[0]?.date || 'N/A';
                    const ifoRow = sorted.find(b => b.fuel_type === 'IFO');
                    const mdoRow = sorted.find(b => b.fuel_type === 'MDO');
                    const liveIfo = ifoRow ? Number(ifoRow.market_price_usd) || 0 : 0;
                    const liveMdo = mdoRow ? Number(mdoRow.market_price_usd) || 0 : 0;
                    setBunkerPrices({
                        ifo: liveIfo,
                        mdo: liveMdo,
                        date: latestDate
                    });
                }
            } catch (err) {
                console.error("Error loading contracts:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Ordenar catálogo completo de puertos (Norte a Sur / alfabético)
    const sortedPorts = useMemo(() => {
        return [...(ports || [])].sort((a, b) => {
            const latA = a.lat !== undefined && a.lat !== null ? parseFloat(a.lat) : 0;
            const latB = b.lat !== undefined && b.lat !== null ? parseFloat(b.lat) : 0;
            if (latA !== 0 || latB !== 0) return latB - latA;
            return (a.port_id || '').localeCompare(b.port_id || '');
        });
    }, [ports]);

    useEffect(() => {
        // En contratos solo mostramos clientes activos
        const activeClients = rawClients.filter(c => c.is_active !== false);
        setClients(activeClients);
    }, [rawClients]);

    const activeClientIds = useMemo(() => {
        const ids = new Set([
            ...contracts.map(c => c.client_id),
            ...clients.map(c => c.client_id)
        ]);
        const filteredIds = Array.from(ids).filter(cid => cid && clients.some(c => c.client_id === cid));
        return filteredIds;
    }, [contracts, clients]);

    // Set a default selected client if none is selected
    useEffect(() => {
        if (!loading && activeClientIds.length > 0 && selectedClientId === null) {
            setSelectedClientId(activeClientIds[0]);
        }
    }, [loading, activeClientIds, selectedClientId]);

    const handleAddClientContract = () => {
        const defaultDemurrage: Record<string, number> = {};
        vessels.forEach(v => { defaultDemurrage[v.vessel_id] = 20000; });

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
            bunker_baseline_price_mdo: 0,
            baf_rules: '',
            comments: [],
            time_to_count_carga_hrs: 6,
            maneuver_carga_hrs: 0,
            time_to_count_descarga_hrs: 6,
            maneuver_descarga_hrs: 0,
            tariffs: [],
            demurrage_rates: defaultDemurrage
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
        
        const defaultDemurrage: Record<string, number> = {};
        vessels.forEach(v => { defaultDemurrage[v.vessel_id] = 20000; });

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
            bunker_baseline_price_mdo: 0,
            baf_rules: '',
            comments: [],
            time_to_count_carga_hrs: 6,
            maneuver_carga_hrs: 0,
            time_to_count_descarga_hrs: 6,
            maneuver_descarga_hrs: 0,
            tariffs: [],
            demurrage_rates: defaultDemurrage
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

    const exportColumns: ExportColumn[] = [
        { 
            header: 'Cliente', 
            key: 'client_id', 
            type: 'string',
            render: (val) => {
                const c = rawClients.find(x => x.client_id === val);
                return c ? c.client_name : val;
            }
        },
        { header: 'Puerto Origen', key: 'origin_port_id', type: 'string' },
        { header: 'Puerto Destino', key: 'destination_port_id', type: 'string' },
        { header: 'Ritmo Carga (MT/Día)', key: 'load_rate', type: 'number' },
        { header: 'Ritmo Descarga (MT/Día)', key: 'discharge_rate', type: 'number' },
        { header: 'Comisión Dirección (%)', key: 'address_commission', type: 'percent' },
        { header: 'Comisión Broker (%)', key: 'broker_commission', type: 'percent' },
        { header: 'Bunker Base IFO (USD)', key: 'bunker_baseline_price_ifo', type: 'currency' },
        { 
            header: 'Bandas Tarifarias', 
            key: 'tariffs', 
            type: 'string',
            render: (val: any) => {
                if (!val || !Array.isArray(val) || val.length === 0) return 'Sin tarifas';
                return val.map((t: any) => `${t.min_tonnage.toLocaleString()}-${t.max_tonnage.toLocaleString()} MT: $${t.freight_rate}`).join(' | ');
            }
        },
        { header: 'Activo', key: 'is_active', type: 'boolean' }
    ];

    const handleExportExcel = () => {
        exportMasterToExcel('Maestro de Contratos', exportColumns, contracts);
    };

    const handleExportPDF = () => {
        exportMasterToPDF('Maestro de Contratos', exportColumns, contracts);
    };

    const selectedRoute = contracts.find(c => getRouteKey(c) === selectedRouteKey);

    const bafData = useMemo(() => {
        if (!selectedRoute) return null;

        const baseIfo = Number(selectedRoute.bunker_baseline_price_ifo) || bunkerPrices.ifo;
        const baseMdo = Number(selectedRoute.bunker_baseline_price_mdo) || bunkerPrices.mdo;
        const initialBaf = Number((selectedRoute as any).bunker_baseline_baf_initial) || 2.86;

        const coeffIfo = 38.40;
        const coeffMdo = 9.50;

        const costoBase = (baseIfo * coeffIfo) + (baseMdo * coeffMdo);
        const costoActual = (bunkerPrices.ifo * coeffIfo) + (bunkerPrices.mdo * coeffMdo);

        const factorBaf = costoBase > 0 ? (costoActual / costoBase) : 1.0;
        const variacionPct = (factorBaf - 1) * 100;
        const nuevoBaf = initialBaf * factorBaf;
        const deltaBaf = nuevoBaf - initialBaf;
        const deltaCostoTotal = costoActual - costoBase;

        return {
            baseIfo,
            baseMdo,
            initialBaf,
            actualIfo: bunkerPrices.ifo,
            actualMdo: bunkerPrices.mdo,
            bunkerDate: bunkerPrices.date,
            coeffIfo,
            coeffMdo,
            costoBase,
            costoActual,
            factorBaf,
            variacionPct,
            nuevoBaf,
            deltaBaf,
            deltaCostoTotal
        };
    }, [selectedRoute, bunkerPrices]);

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
        <MasterTemplate 
            title="Maestro de Contratos" 
            activeTab="contracts"
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
        >
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
                                <div className="flex-1 overflow-auto bg-white p-6 xl:p-8">
                                    {selectedRoute ? (
                                        <div className="w-full max-w-none mx-auto space-y-6">
                                            
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

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-stretch">
                                                {/* ================= COLUMNA 1 ================= */}
                                                <div className="flex flex-col gap-6 h-full">
                                                    {/* 1. Definición */}
                                                    <section className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm flex-1">
                                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-200 pb-2">1. Definición Operativa & Vigencia</h4>
                                                        
                                                        <div className="flex flex-col gap-4">
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
                                                            <div className="flex items-center">
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
                                                            
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Puerto Origen</label>
                                                                    <select 
                                                                        value={selectedRoute.origin_port_id}
                                                                        onChange={(e) => handleChange(selectedRouteKey!, 'origin_port_id', e.target.value)}
                                                                        className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white font-semibold text-slate-700"
                                                                    >
                                                                        <option value="">Seleccione Puerto...</option>
                                                                        {sortedPorts.map(p => (
                                                                            <option key={p.port_id} value={p.port_id}>{p.port_name} ({p.country || 'PE'})</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Puerto Destino</label>
                                                                    <select 
                                                                        value={selectedRoute.destination_port_id}
                                                                        onChange={(e) => handleChange(selectedRouteKey!, 'destination_port_id', e.target.value)}
                                                                        className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white font-semibold text-slate-700"
                                                                    >
                                                                        <option value="">Seleccione Puerto...</option>
                                                                        {sortedPorts.map(p => (
                                                                            <option key={p.port_id} value={p.port_id}>{p.port_name} ({p.country || 'PE'})</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3">
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
                                                        </div>
                                                    </section>

                                                    {/* 4. Comisiones y Recargos */}
                                                     <section className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm flex-1">
                                                         <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">4. Comisiones y Recargos</h4>
                                                         
                                                         {/* Comisiones Arriba */}
                                                         <div className="grid grid-cols-2 gap-3 mb-4">
                                                             <div>
                                                                 <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Address Comm. (%)</label>
                                                                 <input 
                                                                     type="number" step="0.01"
                                                                     value={selectedRoute.address_commission}
                                                                     onFocus={(e) => e.target.select()}
                                                                     onChange={(e) => handleChange(selectedRouteKey!, 'address_commission', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                                     className="w-full text-sm border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                 />
                                                             </div>
                                                             <div>
                                                                 <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Broker Comm. (%)</label>
                                                                 <input 
                                                                     type="number" step="0.01"
                                                                     value={selectedRoute.broker_commission}
                                                                     onFocus={(e) => e.target.select()}
                                                                     onChange={(e) => handleChange(selectedRouteKey!, 'broker_commission', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                                     className="w-full text-sm border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                 />
                                                             </div>
                                                         </div>

                                                         {/* Demurrage Abajo */}
                                                         <div className="border-t border-slate-200 pt-3">
                                                             <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Demurrage por Buque ($/día)</h5>

                                                             <div className="grid grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-1">
                                                                 {vessels.map(v => {
                                                                     const currentRate = selectedRoute.demurrage_rates?.[v.vessel_id] !== undefined 
                                                                         ? selectedRoute.demurrage_rates[v.vessel_id] 
                                                                         : 20000;
                                                                     return (
                                                                         <div key={v.vessel_id}>
                                                                             <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase truncate" title={v.vessel_name}>
                                                                                 {v.vessel_name}
                                                                             </label>
                                                                             <input 
                                                                                 type="number"
                                                                                 value={currentRate}
                                                                                 onFocus={(e) => e.target.select()}
                                                                                 onChange={(e) => {
                                                                                     const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                                                     const newRates = { ...(selectedRoute.demurrage_rates || {}) };
                                                                                     newRates[v.vessel_id] = isNaN(val) ? 0 : val;
                                                                                     handleChange(selectedRouteKey!, 'demurrage_rates', newRates);
                                                                                 }}
                                                                                 className="w-full text-xs border border-slate-300 rounded p-1.5 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                             />
                                                                         </div>
                                                                     );
                                                                 })}
                                                             </div>
                                                         </div>
                                                     </section>
                                                </div>

                                                {/* ================= COLUMNA 2 ================= */}
                                                <div className="flex flex-col gap-6 h-full">
                                                    {/* 2. Operativo & Tiempos */}
                                                    <section className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-6 shadow-sm flex-1">
                                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-200 pb-2">2. Operaciones & Tiempos</h4>
                                                        
                                                        <div className="space-y-4">
                                                            <h5 className="text-xs font-black text-blue-800 uppercase tracking-wider bg-blue-100/50 p-2 rounded">Origen</h5>
                                                            <div className="grid grid-cols-2 gap-3 px-1">
                                                                <div className="col-span-2">
                                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Load Rate (mt/día)</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={selectedRoute.load_rate}
                                                                        onChange={(e) => handleChange(selectedRouteKey!, 'load_rate', parseFloat(e.target.value))}
                                                                        className="w-full text-sm border border-blue-200 rounded-lg p-2 font-mono bg-blue-50/50 focus:border-blue-400 focus:outline-none"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Time to Count</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={selectedRoute.time_to_count_carga_hrs}
                                                                        onChange={(e) => handleChange(selectedRouteKey!, 'time_to_count_carga_hrs', parseFloat(e.target.value))}
                                                                        className="w-full text-sm border border-blue-200 rounded-lg p-2 font-mono bg-blue-50/50 focus:border-blue-400 focus:outline-none"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Maneuver (hrs)</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={selectedRoute.maneuver_carga_hrs}
                                                                        onChange={(e) => handleChange(selectedRouteKey!, 'maneuver_carga_hrs', parseFloat(e.target.value))}
                                                                        className="w-full text-sm border border-blue-200 rounded-lg p-2 font-mono bg-blue-50/50 focus:border-blue-400 focus:outline-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4 mt-6">
                                                            <h5 className="text-xs font-black text-amber-800 uppercase tracking-wider bg-amber-100/50 p-2 rounded">Destino</h5>
                                                            <div className="grid grid-cols-2 gap-3 px-1">
                                                                <div className="col-span-2">
                                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Discharge Rate (mt/día)</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={selectedRoute.discharge_rate}
                                                                        onChange={(e) => handleChange(selectedRouteKey!, 'discharge_rate', parseFloat(e.target.value))}
                                                                        className="w-full text-sm border border-amber-200 rounded-lg p-2 font-mono bg-amber-50/50 focus:border-amber-400 focus:outline-none"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Time to Count</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={selectedRoute.time_to_count_descarga_hrs}
                                                                        onChange={(e) => handleChange(selectedRouteKey!, 'time_to_count_descarga_hrs', parseFloat(e.target.value))}
                                                                        className="w-full text-sm border border-amber-200 rounded-lg p-2 font-mono bg-amber-50/50 focus:border-amber-400 focus:outline-none"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Maneuver (hrs)</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={selectedRoute.maneuver_descarga_hrs}
                                                                        onChange={(e) => handleChange(selectedRouteKey!, 'maneuver_descarga_hrs', parseFloat(e.target.value))}
                                                                        className="w-full text-sm border border-amber-200 rounded-lg p-2 font-mono bg-amber-50/50 focus:border-amber-400 focus:outline-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </section>

                                                    {/* 5. BAF */}
                                                     <section className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm flex-1">
                                                         <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                                             <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">5. Acuerdos BAF (Bunker Adjustment Factor)</h4>
                                                             {bafData && (
                                                                 <span className={`px-2.5 py-0.5 rounded text-[11px] font-black font-mono border ${
                                                                     bafData.deltaBaf >= 0 
                                                                         ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                                                         : 'bg-red-50 text-red-800 border-red-200'
                                                                 }`}>
                                                                     Δ BAF: {bafData.deltaBaf >= 0 ? '+' : ''}${bafData.deltaBaf.toFixed(4)}/PMT ({bafData.factorBaf.toFixed(4)}x)
                                                                 </span>
                                                             )}
                                                         </div>
                                                         
                                                         <div className="grid grid-cols-3 gap-2">
                                                             <div>
                                                                 <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Baseline IFO ($/mt)</label>
                                                                 <input 
                                                                     type="number" step="0.01"
                                                                     value={selectedRoute.bunker_baseline_price_ifo ?? bunkerPrices.ifo}
                                                                     onFocus={(e) => e.target.select()}
                                                                     onChange={(e) => handleChange(selectedRouteKey!, 'bunker_baseline_price_ifo', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                                     className="w-full text-xs border border-slate-300 rounded p-1.5 font-mono"
                                                                 />
                                                             </div>
                                                             <div>
                                                                 <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Baseline MDO ($/mt)</label>
                                                                 <input 
                                                                     type="number" step="0.01"
                                                                     value={selectedRoute.bunker_baseline_price_mdo ?? bunkerPrices.mdo}
                                                                     onFocus={(e) => e.target.select()}
                                                                     onChange={(e) => handleChange(selectedRouteKey!, 'bunker_baseline_price_mdo', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                                     className="w-full text-xs border border-slate-300 rounded p-1.5 font-mono"
                                                                 />
                                                             </div>
                                                             <div>
                                                                 <label className="block text-[9px] font-bold text-blue-600 mb-1 uppercase">BAF Inicial ($/PMT)</label>
                                                                 <input 
                                                                     type="number" step="0.01"
                                                                     value={(selectedRoute as any).bunker_baseline_baf_initial ?? 2.86}
                                                                     onFocus={(e) => e.target.select()}
                                                                     onChange={(e) => handleChange(selectedRouteKey!, 'bunker_baseline_baf_initial' as any, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                                     className="w-full text-xs border border-blue-300 bg-blue-50/50 rounded p-1.5 font-mono font-bold text-blue-900"
                                                                 />
                                                             </div>
                                                         </div>

                                                         {/* Fórmula Polinómica Explicativa */}
                                                         <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                                                             <div className="font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between text-[10px]">
                                                                 <span>Fórmula Polinómica Contractual:</span>
                                                                 <span className="text-slate-400 font-mono">Consumos: 38.40 IFO / 9.50 MDO</span>
                                                             </div>
                                                             <div className="font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 text-[10px] leading-relaxed">
                                                                 Δ BAF = (BAF_Inicial × Factor_fa) - BAF_Inicial
                                                             </div>
                                                         </div>
                                                     </section>
                                                 </div>

                                                {/* ================= COLUMNA 3 ================= */}
                                                <div className="flex flex-col gap-6 h-full">
                                                    {/* 3. Tarifas (Tiers) */}
                                                     <section className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1">
                                                         <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                                                             <h4 className="text-xs font-black text-teal-800 uppercase tracking-wider">3. Tarifas por Tramo & Ajuste BAF</h4>
                                                             <button 
                                                                 onClick={() => handleAddTariff(selectedRouteKey!)}
                                                                 className="text-[10px] bg-teal-50 border border-teal-200 hover:bg-teal-100 font-bold px-3 py-1.5 rounded text-teal-700 flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                                                             >
                                                                 <Plus size={12} /> Añadir
                                                             </button>
                                                         </div>
                                                         
                                                         <div className="space-y-3 overflow-y-auto pr-1">
                                                             {selectedRoute.tariffs.map((t, idx) => {
                                                                 const adjustedFreight = bafData ? (t.freight_rate + bafData.deltaBaf) : t.freight_rate;
                                                                 return (
                                                                     <div key={idx} className="flex flex-col gap-2 bg-white p-3 pr-8 rounded-lg border border-slate-200 shadow-sm relative">
                                                                         <button 
                                                                             onClick={() => handleRemoveTariff(selectedRouteKey!, idx)}
                                                                             className="absolute right-1 top-[50%] -translate-y-[50%] p-1.5 text-slate-300 hover:text-red-500 transition-colors bg-white rounded cursor-pointer"
                                                                             title="Eliminar tarifa"
                                                                         >
                                                                             <Trash2 size={14} />
                                                                         </button>
                                                                         
                                                                         <div className="grid grid-cols-4 gap-2">
                                                                             <div>
                                                                                 <label className="block text-[9px] font-bold text-slate-400 uppercase">Min (MT)</label>
                                                                                 <input 
                                                                                     type="number" 
                                                                                     value={t.min_tonnage}
                                                                                     onFocus={(e) => e.target.select()}
                                                                                     onChange={(e) => handleTariffChange(selectedRouteKey!, idx, 'min_tonnage', parseFloat(e.target.value) || 0)}
                                                                                     className="w-full text-[11px] border border-slate-300 rounded p-1 font-mono"
                                                                                 />
                                                                             </div>
                                                                             <div>
                                                                                 <label className="block text-[9px] font-bold text-slate-400 uppercase">Max (MT)</label>
                                                                                 <input 
                                                                                     type="number" 
                                                                                     value={t.max_tonnage}
                                                                                     onFocus={(e) => e.target.select()}
                                                                                     onChange={(e) => handleTariffChange(selectedRouteKey!, idx, 'max_tonnage', parseFloat(e.target.value) || 0)}
                                                                                     className="w-full text-[11px] border border-slate-300 rounded p-1 font-mono"
                                                                                 />
                                                                             </div>
                                                                             <div>
                                                                                 <label className="block text-[9px] font-bold text-teal-700 uppercase">Flete Base</label>
                                                                                 <div className="relative">
                                                                                     <span className="absolute left-1.5 top-1 text-teal-600 font-bold text-[10px]">$</span>
                                                                                     <input 
                                                                                         type="number" step="0.01"
                                                                                         value={t.freight_rate}
                                                                                         onFocus={(e) => e.target.select()}
                                                                                         onChange={(e) => handleTariffChange(selectedRouteKey!, idx, 'freight_rate', parseFloat(e.target.value) || 0)}
                                                                                         className="w-full pl-4 pr-1 py-1 text-[11px] border border-teal-300 bg-teal-50/30 focus:border-teal-500 focus:outline-none rounded font-mono text-teal-900 font-bold"
                                                                                     />
                                                                                 </div>
                                                                             </div>
                                                                             <div>
                                                                                 <label className="block text-[9px] font-black text-emerald-700 uppercase">Flete Ajustado BAF</label>
                                                                                 <div className="bg-emerald-50 border border-emerald-300 rounded p-1 text-[11px] font-mono font-black text-emerald-900 text-right flex items-center justify-between">
                                                                                     <span className="text-[9px] font-bold text-emerald-600">
                                                                                         {bafData && bafData.deltaBaf >= 0 ? `+${bafData.deltaBaf.toFixed(2)}` : bafData?.deltaBaf.toFixed(2)}
                                                                                     </span>
                                                                                     <span>${adjustedFreight.toFixed(2)}</span>
                                                                                 </div>
                                                                             </div>
                                                                         </div>
                                                                     </div>
                                                                 );
                                                             })}
                                                             
                                                             {selectedRoute.tariffs.length === 0 && (
                                                                 <div className="text-center text-xs text-slate-400 py-6 bg-white rounded-lg border border-dashed border-slate-300 font-medium flex items-center justify-center">
                                                                     Sin bandas configuradas ($0)
                                                                 </div>
                                                             )}
                                                         </div>
                                                     </section>

                                                    {/* 6. Comentarios */}
                                                    <section className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm flex-1 flex flex-col">
                                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-200 pb-2">6. Comentarios</h4>
                                                        
                                                        <div className="flex gap-2 mb-4">
                                                            <textarea 
                                                                value={newCommentText}
                                                                onChange={(e) => setNewCommentText(e.target.value)}
                                                                placeholder="Escribe un comentario o bitácora..."
                                                                className="flex-grow text-sm border border-slate-300 rounded-lg p-2 bg-white resize-none"
                                                                rows={2}
                                                            />
                                                            <button 
                                                                onClick={() => {
                                                                    if (!newCommentText.trim()) return;
                                                                    const newComment = {
                                                                        text: newCommentText.trim(),
                                                                        date: new Date().toISOString(),
                                                                        user: user?.full_name || 'Administrador'
                                                                    };
                                                                    const existingComments = selectedRoute.comments || [];
                                                                    handleChange(selectedRouteKey!, 'comments', [newComment, ...existingComments]);
                                                                    setNewCommentText('');
                                                                }}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
                                                            >
                                                                <Plus className="w-4 h-4" /> Agregar
                                                            </button>
                                                        </div>

                                                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                                            {(!selectedRoute.comments || selectedRoute.comments.length === 0) ? (
                                                                <div className="text-center text-slate-400 text-xs py-4 border border-dashed border-slate-300 rounded">
                                                                    No hay comentarios registrados
                                                                </div>
                                                            ) : (
                                                                selectedRoute.comments.map((c, i) => (
                                                                    <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 text-sm shadow-sm">
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <span className="font-bold text-slate-700 text-xs">{c.user}</span>
                                                                            <span className="text-slate-400 text-[10px]">{new Date(c.date).toLocaleString()}</span>
                                                                        </div>
                                                                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </section>
                                                </div>
                                            </div>

                                            {/* ================= SECCIÓN 7: DESGLOSE MATEMÁTICO & AUDITORÍA BAF ================= */}
                                            {bafData && (
                                                <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                                                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base">📊</span>
                                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                                                7. Desglose Matemático & Auditoría del Ajuste BAF (Bunker Adjustment Factor)
                                                            </h4>
                                                        </div>
                                                        <span className="text-[10px] font-mono bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded border border-blue-200">
                                                            Ref. Último Bunker: {bafData.bunkerDate}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                                        {/* Paso A: Precios Comparativos */}
                                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                                                            <div>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Paso A: Comparativo de Combustibles ($/MT)</span>
                                                                <table className="w-full text-xs font-mono">
                                                                    <thead>
                                                                        <tr className="border-b border-slate-200 text-left text-[10px] text-slate-500">
                                                                            <th className="pb-1">Combustible</th>
                                                                            <th className="pb-1 text-right">Baseline Contrato</th>
                                                                            <th className="pb-1 text-right">Último Bunker</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100">
                                                                        <tr>
                                                                            <td className="py-1.5 font-bold text-slate-700">IFO 380 VLSFO</td>
                                                                            <td className="py-1.5 text-right font-bold text-slate-600">${bafData.baseIfo.toFixed(2)}</td>
                                                                            <td className="py-1.5 text-right font-bold text-blue-600">${bafData.actualIfo.toFixed(2)}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td className="py-1.5 font-bold text-slate-700">MDO Diesel (MGO)</td>
                                                                            <td className="py-1.5 text-right font-bold text-slate-600">${bafData.baseMdo.toFixed(2)}</td>
                                                                            <td className="py-1.5 text-right font-bold text-amber-600">${bafData.actualMdo.toFixed(2)}</td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            <div className="mt-3 text-[10px] text-slate-400 border-t border-slate-200 pt-2 italic">
                                                                * Coeficientes B/T Moquegua: 38.40 (IFO) / 9.50 (MDO)
                                                            </div>
                                                        </div>

                                                        {/* Paso B: Ecuaciones Resueltas */}
                                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Paso B: Estructura Polinómica Resuelta</span>
                                                            
                                                            <div className="text-[11px] font-mono space-y-2">
                                                                <div className="bg-white p-2 rounded border border-slate-200">
                                                                    <span className="text-[9px] text-slate-400 uppercase block font-bold">1. Costo Ponderado Base (N-1):</span>
                                                                    <span className="text-slate-800">(${bafData.baseIfo.toFixed(2)} × 38.40) + (${bafData.baseMdo.toFixed(2)} × 9.50)</span>
                                                                    <span className="block font-bold text-slate-900 text-right text-xs mt-0.5">= ${bafData.costoBase.toFixed(2)} USD</span>
                                                                </div>

                                                                <div className="bg-white p-2 rounded border border-slate-200">
                                                                    <span className="text-[9px] text-slate-400 uppercase block font-bold">2. Costo Ponderado Actual (N):</span>
                                                                    <span className="text-slate-800">(${bafData.actualIfo.toFixed(2)} × 38.40) + (${bafData.actualMdo.toFixed(2)} × 9.50)</span>
                                                                    <span className="block font-bold text-blue-700 text-right text-xs mt-0.5">= ${bafData.costoActual.toFixed(2)} USD</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Paso C: Traducción a Tarifa BAF */}
                                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Paso C: Traducción a Tarifa BAF</span>
                                                            
                                                            <div className="text-[11px] font-mono space-y-2">
                                                                <div className="bg-white p-2 rounded border border-slate-200">
                                                                    <span className="text-[9px] text-slate-400 uppercase block font-bold">1. Factor BAF (fa):</span>
                                                                    <span className="text-slate-800">${bafData.costoActual.toFixed(2)} ÷ ${bafData.costoBase.toFixed(2)}</span>
                                                                    <span className="block font-bold text-emerald-700 text-right text-xs mt-0.5">= {bafData.factorBaf.toFixed(6)}x ({bafData.variacionPct >= 0 ? '+' : ''}{bafData.variacionPct.toFixed(2)}%)</span>
                                                                </div>

                                                                <div className="bg-white p-2 rounded border border-slate-200">
                                                                    <span className="text-[9px] text-slate-400 uppercase block font-bold">2. Nuevo BAF vs. Inicial:</span>
                                                                    <span className="text-slate-800">${bafData.initialBaf.toFixed(2)} × {bafData.factorBaf.toFixed(4)} = ${bafData.nuevoBaf.toFixed(4)}</span>
                                                                    <span className={`block font-bold text-right text-xs mt-0.5 ${bafData.deltaBaf >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                                                        Δ PMT = {bafData.deltaBaf >= 0 ? '+' : ''}${bafData.deltaBaf.toFixed(4)} USD/PMT
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Paso D: Resumen Ejecutivo */}
                                                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-xl border border-slate-700 shadow-md flex flex-col justify-between">
                                                            <div>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Paso D: Ajuste a Facturar por Tonelada</span>
                                                                <div className="flex items-baseline justify-between mt-2">
                                                                    <span className="text-xs text-slate-300 font-bold">Variación Net Δ BAF:</span>
                                                                    <span className={`text-xl font-black font-mono ${bafData.deltaBaf >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                        {bafData.deltaBaf >= 0 ? '+' : ''}${bafData.deltaBaf.toFixed(4)} / MT
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-baseline justify-between mt-1">
                                                                    <span className="text-xs text-slate-300 font-bold">Factor Multiplicador:</span>
                                                                    <span className="text-sm font-bold font-mono text-slate-300">
                                                                        {bafData.factorBaf.toFixed(4)}x
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-xs mt-4">
                                                                <span className="text-[10px] text-slate-400 uppercase block font-bold">Variación Absoluta Total por Viaje:</span>
                                                                <span className="font-mono font-bold text-white text-sm">
                                                                    ${bafData.deltaCostoTotal >= 0 ? '+' : ''}${bafData.deltaCostoTotal.toFixed(2)} USD / ciclo
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Resumen por Tiers */}
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-3">
                                                            Matriz de Tarifas Finales Ajustadas por Tramo (Tarifa Base + Δ BAF)
                                                        </span>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                            {selectedRoute.tariffs.map((t, idx) => {
                                                                const adjPrice = t.freight_rate + bafData.deltaBaf;
                                                                return (
                                                                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
                                                                        <div>
                                                                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-1 mb-2">
                                                                                <span>Tramo {idx + 1}</span>
                                                                                <span>{t.min_tonnage.toLocaleString()} - {t.max_tonnage.toLocaleString()} MT</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center text-xs text-slate-600 mb-1 font-mono">
                                                                                <span>Tarifa Base:</span>
                                                                                <span className="font-bold">${t.freight_rate.toFixed(2)}/MT</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center text-xs text-slate-600 mb-1 font-mono">
                                                                                <span>Ajuste Δ BAF:</span>
                                                                                <span className={`font-bold ${bafData.deltaBaf >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                                    {bafData.deltaBaf >= 0 ? '+' : ''}${bafData.deltaBaf.toFixed(2)}/MT
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center text-xs text-emerald-800 font-mono font-black bg-emerald-50 p-1.5 rounded border border-emerald-200">
                                                                                <span>Flete Final Ajustado:</span>
                                                                                <span>${adjPrice.toFixed(2)}/MT</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                            {selectedRoute.tariffs.length === 0 && (
                                                                <div className="col-span-full text-center text-xs text-slate-400 py-3 italic">
                                                                    No hay tramos configurados para auditar BAF.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </section>
                                            )}

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
