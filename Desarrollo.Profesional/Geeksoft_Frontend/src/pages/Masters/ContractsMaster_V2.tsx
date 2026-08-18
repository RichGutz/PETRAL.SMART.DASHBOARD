import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { FileText, Calendar, ChevronDown, ChevronRight, Anchor, DollarSign, Ship, CheckCircle2, Layers, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';
import { QuoteExecutiveCardSummary } from '../../components/CommercialForecast/QuoteExecutiveCardSummary';

interface EnrichedRoute {
    route_id?: string;
    name: string;
    description?: string;
    client_id?: string;
    is_contract?: boolean;
    contract_id?: string;
    table_source?: string;
    created_at?: string;
    created_by?: string;
    valid_from?: string;
    valid_to?: string;
    demurrage_rates?: Record<string, number>;
    demurrage_rate?: number;
    comments?: Array<{ text: string; date?: string; user?: string }>;
    legs_data?: {
        is_multicotizador?: boolean;
        valid_from?: string;
        valid_to?: string;
        bunker_price_ifo?: number;
        bunker_price_mdo?: number;
        tramos?: any[];
        puertosConfig?: any[];
        vesselParams?: any;
        addressCommPct?: number;
        brokerCommPct?: number;
        baf_formula?: string;
        baf_valid_from?: string;
        baf_valid_to?: string;
        baf_ifo_base?: number;
        baf_mdo_base?: number;
        tariff_tiers?: any[];
        demurrage_rates?: Record<string, number>;
        demurrage_rate?: number;
        comments?: Array<{ text: string; date?: string; user?: string }>;
        contract_metadata?: {
            contract_id?: string;
            client_id?: string;
            valid_from?: string;
            valid_to?: string;
            validity_years?: number;
            contract_status?: string;
            baf_formula?: string;
            baf_valid_from?: string;
            baf_valid_to?: string;
            baf_ifo_base?: number;
            baf_mdo_base?: number;
            tariff_tiers?: any[];
            demurrage_rates?: Record<string, number>;
            demurrage_rate?: number;
            comments?: Array<{ text: string; date?: string; user?: string }>;
        };
    };
}

export const ContractsMaster: React.FC = () => {
    const [allRoutes, setAllRoutes] = useState<EnrichedRoute[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Selecciones de UI
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [openYears, setOpenYears] = useState<Record<string, boolean>>({});
    const [expandedRouteName, setExpandedRouteName] = useState<string | null>(null);

    // Carga de Datos desde Backend (Supabase / FastAPI)
    const loadData = async () => {
        try {
            setLoading(true);
            const [routesList, clientsData] = await Promise.all([
                ForecastService.listSpots(),
                ForecastService.getClientsMaster()
            ]);
            setAllRoutes(routesList || []);
            setClients(clientsData || []);
        } catch (err) {
            console.error("Error cargando maestro de contratos:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoute = async (route: EnrichedRoute) => {
        const identifier = route.name || route.contract_id || route.route_id;
        if (!identifier) return;

        if (!window.confirm(`¿Estás seguro de que deseas eliminar la ruta de contrato "${route.name}"? Esta acción eliminará el registro de la base de datos.`)) {
            return;
        }

        try {
            setLoading(true);
            await ForecastService.deleteSpot(identifier);
            await loadData();
            alert(`Ruta "${route.name}" eliminada exitosamente.`);
        } catch (err) {
            console.error("Error al eliminar la ruta:", err);
            alert("Ocurrió un error al eliminar la ruta.");
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // 1. Filtrar solo las rutas contractuales COA (unificadas en routes_quotes)
    const contractRoutesAll = useMemo(() => {
        return allRoutes.filter(r => {
            const desc = (r.description || '').trim();
            return desc === 'COA Cliente Activo' || desc.includes('COA') || r.is_contract === true;
        });
    }, [allRoutes]);

    // 2. Clientes Activos que tienen contratos o presencia en catálogo
    const activeClients = useMemo(() => {
        const clientSet = new Set<string>();
        contractRoutesAll.forEach(r => {
            const cid = r.client_id || r.legs_data?.contract_metadata?.client_id || (r.name.toUpperCase().startsWith("SPCC") ? "SPCC" : "NEXA");
            if (cid) clientSet.add(cid.toUpperCase());
        });
        (clients || []).forEach((c: any) => {
            const cid = typeof c === 'string' ? c : (c.client_id || c.name || c.id);
            if (cid && c.is_active !== false) clientSet.add(cid.toString().toUpperCase());
        });
        const list = Array.from(clientSet).filter(Boolean);
        return list.length > 0 ? list : ['NEXA', 'SPCC'];
    }, [contractRoutesAll, clients]);

    // Auto-seleccionar primer cliente si no hay uno elegido
    useEffect(() => {
        if (!selectedClientId && activeClients.length > 0) {
            setSelectedClientId(activeClients[0]);
        }
    }, [activeClients, selectedClientId]);

    // 3. Filtrar rutas pertenecientes al cliente seleccionado
    const clientRoutes = useMemo(() => {
        if (!selectedClientId) return [];
        const cidUpper = selectedClientId.toUpperCase();
        return contractRoutesAll.filter(r => {
            const rCid = (r.client_id || r.legs_data?.contract_metadata?.client_id || (r.name.toUpperCase().startsWith("SPCC") ? "SPCC" : "NEXA")).toUpperCase();
            const rName = (r.name || '').toUpperCase();
            return rCid === cidUpper || rName.startsWith(cidUpper);
        });
    }, [contractRoutesAll, selectedClientId]);

    // 4. Agrupar rutas por AÑO DE VIGENCIA (Orden Descendente)
    const groupedByYear = useMemo(() => {
        const groups: Record<string, EnrichedRoute[]> = {};

        clientRoutes.forEach(route => {
            const ld = route.legs_data || {};
            const meta = ld.contract_metadata || {};
            // La fecha final de validez (valid_to) determina estrictamente el año de vigencia
            const validToStr = route.valid_to || ld.valid_to || ld.validTo || meta.valid_to || meta.validTo || ld.baf_valid_to;
            const nameStr = route.name || '';

            let year = '';
            if (validToStr) {
                const match = String(validToStr).match(/\b(20\d{2})\b/);
                if (match) year = match[1];
            }
            if (!year && nameStr) {
                const match = nameStr.match(/\b(20\d{2})\b/);
                if (match) year = match[1];
            }
            if (!year) {
                year = new Date().getFullYear().toString();
            }

            if (!groups[year]) groups[year] = [];
            groups[year].push(route);
        });

        // Ordenar años en orden descendente (más reciente arriba, p. ej. 2027, 2026, 2025)
        const sortedYears = Object.keys(groups).sort((a, b) => b.localeCompare(a));
        return { groups, sortedYears };
    }, [clientRoutes]);

    // Inicializar el primer año (más reciente) desplegado
    useEffect(() => {
        if (groupedByYear.sortedYears.length > 0) {
            const topYear = groupedByYear.sortedYears[0];
            setOpenYears(prev => ({ ...prev, [topYear]: true }));
        }
    }, [groupedByYear.sortedYears]);

    const toggleYear = (year: string) => {
        setOpenYears(prev => ({ ...prev, [year]: !prev[year] }));
    };

    const toggleRouteExpansion = (routeName: string) => {
        setExpandedRouteName(prev => (prev === routeName ? null : routeName));
    };

    // Funciones de formateo numérico
    const fmtCur = (v: any) => {
        const num = Number(v) || 0;
        return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    const fmtThousandSep = (v: any) => (Number(v) || 0).toLocaleString('en-US');

    // Exportaciones
    const exportColumns: ExportColumn[] = [
        { header: 'Contrato / Ruta', key: 'name', type: 'string' },
        { header: 'Cliente', key: 'client_id', type: 'string' },
        { header: 'Válido Desde', key: 'valid_from', type: 'string' },
        { header: 'Válido Hasta', key: 'valid_to', type: 'string' },
        { header: 'Tabla Origen', key: 'table_source', type: 'string' }
    ];

    return (
        <MasterTemplate
            title="Maestro de Cierres"
            activeTab="contracts"
            onExportExcel={() => exportMasterToExcel('Maestro_Contratos', exportColumns, clientRoutes)}
            onExportPDF={() => exportMasterToPDF('Maestro_Contratos', exportColumns, clientRoutes)}
        >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 flex flex-col min-h-[calc(100vh-140px)]">
                
                {/* CABECERA: TITULO Y SELECCION DE CLIENTES */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-6">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={18} className="text-blue-600" />
                            Clientes Bajo Contrato
                        </h2>

                        {/* Pestañas Horizontales de Clientes */}
                        <div className="flex bg-slate-200 p-1 rounded-lg gap-1 overflow-x-auto">
                            {activeClients.map(cid => {
                                const isSelected = selectedClientId === cid;
                                const clientObj = (clients || []).find((c: any) => (typeof c === 'string' ? c : (c.client_id || c.name || c.id)) === cid);
                                const displayName = (clientObj && typeof clientObj !== 'string') ? (clientObj.client_name || clientObj.name || cid) : cid;
                                const routeCount = contractRoutesAll.filter(r => {
                                    const rCid = (r.client_id || r.legs_data?.contract_metadata?.client_id || (r.name.toUpperCase().startsWith("SPCC") ? "SPCC" : "NEXA")).toUpperCase();
                                    return rCid === cid.toUpperCase() || (r.name || '').toUpperCase().startsWith(cid.toUpperCase());
                                }).length;

                                return (
                                    <button
                                        key={cid}
                                        onClick={() => setSelectedClientId(cid)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${
                                            isSelected
                                                ? 'bg-white text-blue-700 shadow-sm'
                                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-300'
                                        }`}
                                    >
                                        <span>{displayName}</span>
                                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-blue-100 text-blue-800' : 'bg-slate-300 text-slate-700'}`}>
                                            {routeCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={loadData}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Actualizar
                    </button>
                </div>

                {/* CONTENIDO PRINCIPAL: ACORDEON POR AÑO (ORDEN DESCENDENTE) */}
                <div className="flex-1 p-6 bg-slate-100/60 overflow-y-auto space-y-4">
                    
                    {loading ? (
                        <div className="flex justify-center items-center h-64 text-slate-500 font-medium">
                            Cargando maestro de contratos y rutas del multicotizador...
                        </div>
                    ) : groupedByYear.sortedYears.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200 shadow-sm">
                            <Layers size={36} className="mx-auto text-slate-300 mb-2" />
                            <p className="font-semibold text-sm">No hay contratos o rutas registradas para el cliente {selectedClientId}.</p>
                            <p className="text-xs text-slate-400 mt-1">Crea o guarda rutas desde el Multicotizador asignadas a este cliente para verlas aquí.</p>
                        </div>
                    ) : (
                        groupedByYear.sortedYears.map(year => {
                            const isOpen = Boolean(openYears[year]);
                            const routesInYear = groupedByYear.groups[year] || [];

                            return (
                                <div key={year} className="bg-white rounded-xl border border-slate-250 shadow-sm overflow-hidden transition-all">
                                    
                                    {/* CABECERA HORIZONTAL DEL BLOQUE ANUAL (NIVEL 1/2) */}
                                    <button
                                        onClick={() => toggleYear(year)}
                                        className="w-full bg-slate-800 hover:bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar size={18} className="text-amber-400" />
                                            <span className="text-sm font-black uppercase tracking-wider">
                                                📅 AÑO DE VIGENCIA {year}
                                            </span>
                                            <span className="bg-slate-700 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-600">
                                                {routesInYear.length} {routesInYear.length === 1 ? 'Ruta Registrada' : 'Rutas Registradas'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                                            <span>{isOpen ? 'Ocultar Año' : 'Desplegar Año'}</span>
                                            {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </div>
                                    </button>

                                    {/* CONTENIDO DESPLEGABLE DEL AÑO: LISTADO DE RUTAS (NIVEL 3) */}
                                    {isOpen && (
                                        <div className="p-4 space-y-3 bg-slate-50 border-t border-slate-200">
                                            {routesInYear.map(route => {
                                                const isExpanded = expandedRouteName === route.name;
                                                const tramos = route.legs_data?.tramos || [];
                                                const puertosConfig = route.legs_data?.puertosConfig || [];
                                                const meta = route.legs_data?.contract_metadata || {};
                                                
                                                const validFrom = meta.valid_from || route.legs_data?.baf_valid_from || route.valid_from || '01/01/2026';
                                                const validTo = meta.valid_to || route.legs_data?.baf_valid_to || route.valid_to || '31/12/2026';
                                                const isContractActive = (meta.contract_status || 'ACTIVE') === 'ACTIVE';

                                                // Generar secuencia visual de tramos (ej: PEMAR ➔ CLVAP ➔ PEILO)
                                                const portsList: string[] = [];
                                                tramos.forEach((tr: any) => {
                                                    if (tr.origin_port_id && !portsList.includes(tr.origin_port_id)) portsList.push(tr.origin_port_id);
                                                    if (tr.destination_port_id && !portsList.includes(tr.destination_port_id)) portsList.push(tr.destination_port_id);
                                                });
                                                const portsSequence = portsList.length > 0 ? portsList.join(' ➔ ') : 'Ruta Multicotizador';

                                                return (
                                                    <div key={route.name} className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
                                                        
                                                        {/* FILA DE RUTA (NIVEL 3) */}
                                                        <div 
                                                            onClick={() => toggleRouteExpansion(route.name)}
                                                            className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <button className="text-slate-500 hover:text-blue-600">
                                                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                                </button>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                                            📍 {route.name}
                                                                        </span>
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${isContractActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                                            <CheckCircle2 size={10} /> {isContractActive ? 'ACTIVO' : 'INACTIVO'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-3">
                                                                        <span>Secuencia: <strong className="text-slate-800 font-mono">[{portsSequence}]</strong></span>
                                                                        <span className="text-slate-400">|</span>
                                                                        <span>Vigencia: <strong className="text-slate-700 font-mono">{validFrom} ➔ {validTo}</strong></span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                                                <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-mono text-[11px]">
                                                                    {tramos.length} Tramos
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        try {
                                                                            sessionStorage.setItem('petral_load_quote', JSON.stringify(route));
                                                                            window.open('/multicotizador', '_blank');
                                                                        } catch (err) {
                                                                            console.error("Error opening quote:", err);
                                                                            window.open('/multicotizador', '_blank');
                                                                        }
                                                                    }}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer shadow-xs"
                                                                    title="Abrir esta ruta COA en vivo en el Multicotizador"
                                                                >
                                                                    <ExternalLink size={12} />
                                                                    <span>Ver en Multicotizador ➔</span>
                                                                </button>
                                                                <span className="text-slate-400 font-bold hover:underline cursor-pointer px-1" onClick={() => toggleRow(routeId)}>
                                                                    {isExpanded ? '▲ Ocultar Ficha' : '▼ Detalle Rápido'}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteRoute(route);
                                                                    }}
                                                                    className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm ml-1"
                                                                    title="Eliminar ruta de contrato COA"
                                                                >
                                                                    <Trash2 size={13} />
                                                                    <span>Eliminar</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* FICHA EXPANDIDA: UI UNIFICADA MULTICOTIZADOR (4 CARDS + MOTOR PURO) */}
                                                        {isExpanded && (
                                                            <div className="p-4 bg-slate-50 border-t border-slate-200">
                                                                <QuoteExecutiveCardSummary route={route} />
                                                            </div>
                                                        )}

                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                </div>
                            );
                        })
                    )}

                </div>

            </div>
        </MasterTemplate>
    );
};
