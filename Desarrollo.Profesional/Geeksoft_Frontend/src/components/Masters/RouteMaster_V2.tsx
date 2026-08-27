import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from './MasterTemplate_V2';
import { Map, ChevronDown, ChevronRight, FileText, RefreshCw, Trash2, Printer, ExternalLink, User } from 'lucide-react';
import { ForecastService } from '../../services/api';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';
import { SharedYearlyRouteList } from '../CommercialForecast/SharedYearlyRouteList';

interface RouteMasterProps {
    mode?: 'routes' | 'quotes';
}

export const RouteMaster_V2: React.FC<RouteMasterProps> = ({ mode = 'quotes' }) => {
    const isQuotesMode = mode === 'quotes';
    const [routes, setRoutes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    const loadRoutes = async () => {
        try {
            setIsLoading(true);
            const data = await ForecastService.getSpotVoyages();
            setRoutes(data || []);
        } catch (error) {
            console.error("Error al cargar maestro de rutas/cotizaciones:", error);
            alert("Error al cargar datos.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRoutes();
    }, []);

    // Filtrar rutas según el modo (Cotizaciones Spot vs Rutas de Contratos)
    const filteredRoutes = useMemo(() => {
        return routes.filter(r => {
            const desc = (r.description || '').trim();
            const isCOA = desc === 'COA Cliente Activo' || desc.includes('COA') || r.is_contract === true;
            if (isQuotesMode) {
                return !isCOA;
            }
            return isCOA;
        });
    }, [routes, isQuotesMode]);

    // Helper de normalización de cliente
    const normalizeClientId = (val?: string | null): string => {
        if (!val) return '';
        const upper = String(val).toUpperCase().trim();
        if (upper.includes('SPCC') || upper.includes('SOUTHERN')) return 'SPCC';
        if (upper.includes('NEXA')) return 'NEXA';
        return upper;
    };

    // Extraer Clientes Activos que tienen cotizaciones
    const activeClients = useMemo(() => {
        const clientSet = new Set<string>();
        clientSet.add("SPCC");
        clientSet.add("NEXA");

        filteredRoutes.forEach(r => {
            const rawCid = r.client_id || r.client || r.legs_data?.contract_metadata?.client_id || (r.name?.toUpperCase().startsWith("SPCC") ? "SPCC" : (r.name?.toUpperCase().startsWith("NEXA") ? "NEXA" : ""));
            const cid = normalizeClientId(rawCid);
            if (cid) clientSet.add(cid);
        });

        return Array.from(clientSet);
    }, [filteredRoutes]);

    // Seleccionar el primer cliente activo por defecto
    useEffect(() => {
        if (!selectedClientId && activeClients.length > 0) {
            setSelectedClientId(activeClients[0]);
        }
    }, [activeClients, selectedClientId]);

    // Filtrar cotizaciones para el cliente seleccionado
    const clientRoutes = useMemo(() => {
        if (!selectedClientId) return filteredRoutes;
        return filteredRoutes.filter(r => {
            const rawCid = r.client_id || r.client || r.legs_data?.contract_metadata?.client_id || (r.name?.toUpperCase().startsWith("SPCC") ? "SPCC" : (r.name?.toUpperCase().startsWith("NEXA") ? "NEXA" : ""));
            const cid = normalizeClientId(rawCid);
            return cid === selectedClientId;
        });
    }, [filteredRoutes, selectedClientId]);

    const handleDeleteRoute = async (spotIdOrName: any, routeName?: string) => {
        const identifier = typeof spotIdOrName === 'string' ? spotIdOrName : (spotIdOrName.name || spotIdOrName.route_id || spotIdOrName.spot_id);
        const name = routeName || (typeof spotIdOrName === 'object' ? spotIdOrName.name : identifier);
        if (!identifier) return;

        const confirmDelete = window.confirm(`¿Está seguro de que desea eliminar la cotización "${name}"?`);
        if (!confirmDelete) return;

        try {
            setIsLoading(true);
            await ForecastService.deleteSpot(identifier);
            alert(`Cotización "${name}" eliminada exitosamente.`);
            await loadRoutes();
        } catch (error) {
            console.error("Error al eliminar cotización:", error);
            alert("Ocurrió un error al intentar borrar la cotización.");
            setIsLoading(false);
        }
    };

    // Columnas para exportación Excel / PDF
    const exportColumns: ExportColumn[] = [
        { header: 'Cotización / Ruta', key: 'name', type: 'string' },
        { header: 'Cliente', key: 'client_id', type: 'string' },
        { header: 'Válido Desde', key: 'valid_from', type: 'string' },
        { header: 'Válido Hasta', key: 'valid_to', type: 'string' },
        { header: 'Descripción', key: 'description', type: 'string' },
        { header: 'Fecha Creación', key: 'created_at', type: 'date' }
    ];

    return (
        <MasterTemplate 
            title={isQuotesMode ? "Maestro de Cotizaciones" : "Maestro de Rutas"} 
            subtitle={isQuotesMode ? "Cotizaciones Spot de Prospectos Comercial y Costos (routes_quotes)" : "Rutas Físicas de Recorridos Reales para Contratos Activos (routes_clients)"}
            activeTab={isQuotesMode ? "quotes" : "spot-routes"}
            onExportExcel={() => exportMasterToExcel(isQuotesMode ? 'Maestro_Cotizaciones' : 'Maestro_Rutas', exportColumns, clientRoutes)}
            onExportPDF={() => exportMasterToPDF(isQuotesMode ? 'Maestro_Cotizaciones' : 'Maestro_Rutas', exportColumns, clientRoutes)}
        >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 flex flex-col min-h-[calc(100vh-140px)]">
                
                {/* CABECERA: TÍTULO Y PESTAÑAS HORIZONTALES DE CLIENTES */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-6">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={18} className="text-amber-600" />
                            Clientes & Cotizaciones Spot
                        </h2>

                        {/* Pestañas Horizontales de Clientes */}
                        <div className="flex bg-slate-200 p-1 rounded-lg gap-1 overflow-x-auto">
                            {activeClients.map(cid => {
                                const isSelected = selectedClientId === cid;
                                const count = filteredRoutes.filter(r => {
                                    const raw = r.client_id || r.client || r.legs_data?.contract_metadata?.client_id || (r.name?.toUpperCase().startsWith("SPCC") ? "SPCC" : (r.name?.toUpperCase().startsWith("NEXA") ? "NEXA" : ""));
                                    return normalizeClientId(raw) === cid;
                                }).length;

                                return (
                                    <button
                                        key={cid}
                                        onClick={() => setSelectedClientId(cid)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                            isSelected 
                                                ? 'bg-white text-amber-800 shadow-sm' 
                                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-300'
                                        }`}
                                    >
                                        <span>{cid}</span>
                                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                            isSelected ? 'bg-amber-100 text-amber-900' : 'bg-slate-300 text-slate-700'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={loadRoutes}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        Actualizar
                    </button>
                </div>

                {/* CONTENIDO PRINCIPAL: ACORDEÓN POR AÑO Y RUTAS CON DOBLE DRAG & DROP PERSISTENTE */}
                <div className="flex-1 p-6 bg-slate-100/60 overflow-y-auto space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64 text-slate-500 font-medium">
                            <div className="animate-spin h-6 w-6 border-2 border-amber-600 border-t-transparent rounded-full mr-3"></div>
                            Cargando cotizaciones del multicotizador...
                        </div>
                    ) : (
                        <SharedYearlyRouteList
                            storageKey="quotes"
                            clientId={selectedClientId || 'ALL'}
                            routes={clientRoutes}
                            onDeleteRoute={handleDeleteRoute}
                            emptyMessage={`No hay cotizaciones registradas para el cliente ${selectedClientId}.`}
                        />
                    )}
                </div>

            </div>
        </MasterTemplate>
    );
};
