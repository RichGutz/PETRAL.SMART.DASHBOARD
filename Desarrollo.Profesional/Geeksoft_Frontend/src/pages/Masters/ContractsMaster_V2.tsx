import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { FileText, Calendar, ChevronDown, ChevronRight, Anchor, DollarSign, Ship, CheckCircle2, Clock, Layers, RefreshCw, Trash2, ExternalLink, ShieldCheck } from 'lucide-react';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';
import { QuoteExecutiveCardSummary } from '../../components/CommercialForecast/QuoteExecutiveCardSummary';
import { SharedYearlyRouteList } from '../../components/CommercialForecast/SharedYearlyRouteList';
import { CierreApprovalModal } from '../../components/Masters/CierreApprovalModal';

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
    status?: string;
    approved_by?: string;
    approved_by_name?: string;
    approved_at?: string;
    approval_notes?: string;
    demurrage_rates?: Record<string, number>;
    demurrage_rate?: number;
    comments?: Array<{ text: string; date?: string; user?: string }>;
    legs_data?: {
        is_multicotizador?: boolean;
        valid_from?: string;
        valid_to?: string;
        status?: string;
        approved_by?: string;
        approved_by_name?: string;
        approved_at?: string;
        approval_notes?: string;
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
            status?: string;
            approved_by?: string;
            approved_by_name?: string;
            approved_at?: string;
            approval_notes?: string;
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
    const [approvalModalRoute, setApprovalModalRoute] = useState<EnrichedRoute | null>(null);

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

    // Helper de normalización de cliente (SPCC, NEXA, etc.)
    const normalizeClientId = (val?: string | null): string => {
        if (!val) return '';
        const upper = String(val).toUpperCase().trim();
        if (upper.includes('SPCC') || upper.includes('SOUTHERN')) return 'SPCC';
        if (upper.includes('NEXA')) return 'NEXA';
        return upper;
    };

    // 2. Clientes Activos que tienen contratos o presencia en catálogo (SPCC siempre garantizado)
    const activeClients = useMemo(() => {
        const clientSet = new Set<string>();
        
        // Garantizar SPCC y NEXA siempre como opciones prioritarias fijas
        clientSet.add("SPCC");
        clientSet.add("NEXA");

        contractRoutesAll.forEach(r => {
            const rawCid = r.client_id || r.legs_data?.contract_metadata?.client_id || (r.name.toUpperCase().startsWith("SPCC") ? "SPCC" : (r.name.toUpperCase().startsWith("NEXA") ? "NEXA" : ""));
            const cid = normalizeClientId(rawCid);
            if (cid) clientSet.add(cid);
        });

        (clients || []).forEach((c: any) => {
            const rawCid = typeof c === 'string' ? c : (c.client_id || c.client_name || c.name || c.id);
            const cid = normalizeClientId(rawCid);
            if (cid && c.is_active !== false) clientSet.add(cid);
        });

        const list = Array.from(clientSet).filter(Boolean);
        return list.sort((a, b) => {
            if (a === 'SPCC') return -1;
            if (b === 'SPCC') return 1;
            if (a === 'NEXA') return -1;
            if (b === 'NEXA') return 1;
            return a.localeCompare(b);
        });
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
        const normSelected = normalizeClientId(selectedClientId);
        return contractRoutesAll.filter(r => {
            const rawCid = r.client_id || r.legs_data?.contract_metadata?.client_id || (r.name.toUpperCase().startsWith("SPCC") ? "SPCC" : (r.name.toUpperCase().startsWith("NEXA") ? "NEXA" : ""));
            const normCid = normalizeClientId(rawCid);
            const rName = (r.name || '').toUpperCase();
            return normCid === normSelected || rName.startsWith(normSelected) || (normSelected === 'SPCC' && (rName.includes('SPCC') || rName.includes('SOUTHERN')));
        });
    }, [contractRoutesAll, selectedClientId]);

    // Helper de visualización de nombres de pestañas
    const getClientDisplayName = (cid: string): string => {
        const norm = normalizeClientId(cid);
        if (norm === 'SPCC') return 'SPCC';
        if (norm === 'NEXA') return 'Nexa Resources';
        const clientObj = (clients || []).find((c: any) => {
            const id = typeof c === 'string' ? c : (c.client_id || c.client_name || c.name || c.id);
            return id && normalizeClientId(String(id)) === norm;
        });
        if (clientObj && typeof clientObj !== 'string') {
            return clientObj.client_name || clientObj.name || cid;
        }
        return cid;
    };

    // Helper de conteo de rutas por cliente
    const getRouteCountForClient = (cid: string): number => {
        const targetNorm = normalizeClientId(cid);
        return contractRoutesAll.filter(r => {
            const rawCid = r.client_id || r.legs_data?.contract_metadata?.client_id || (r.name.toUpperCase().startsWith("SPCC") ? "SPCC" : (r.name.toUpperCase().startsWith("NEXA") ? "NEXA" : ""));
            const rCidNorm = normalizeClientId(rawCid);
            const rName = (r.name || '').toUpperCase();
            return rCidNorm === targetNorm || rName.startsWith(targetNorm) || (targetNorm === 'SPCC' && (rName.includes('SPCC') || rName.includes('SOUTHERN')));
        }).length;
    };

    // 4. Agrupar rutas por AÑO DE VIGENCIA (Orden Descendente)
    const groupedByYear = useMemo(() => {
        const groups: Record<string, EnrichedRoute[]> = {};

        clientRoutes.forEach(route => {
            const ld = route.legs_data || {};
            const meta = ld.contract_metadata || {};
            // La fecha final de validez (valid_to) determina estrictamente el año de vigencia
            const validToStr = route.valid_to || ld.valid_to || (ld as any).validTo || meta.valid_to || (meta as any).validTo || ld.baf_valid_to;
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

    // Exportaciones
    const exportColumns: ExportColumn[] = [
        { header: 'Contrato / Ruta', key: 'name', type: 'string' },
        { header: 'Cliente', key: 'client_id', type: 'string' },
        { header: 'Válido Desde', key: 'valid_from', type: 'string' },
        { header: 'Válido Hasta', key: 'valid_to', type: 'string' },
        { header: 'Estado', key: 'status', type: 'string' },
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
                                const isSelected = selectedClientId === cid || (selectedClientId && normalizeClientId(selectedClientId) === normalizeClientId(cid));
                                const displayName = getClientDisplayName(cid);
                                const routeCount = getRouteCountForClient(cid);

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

                {/* CONTENIDO PRINCIPAL: ACORDEON POR AÑO Y RUTAS CON DOBLE DRAG & DROP PERSISTENTE */}
                <div className="flex-1 p-6 bg-slate-100/60 overflow-y-auto space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-64 text-slate-500 font-medium">
                            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
                            Cargando maestro de contratos y rutas del multicotizador...
                        </div>
                    ) : (
                        <SharedYearlyRouteList
                            storageKey="contracts"
                            clientId={selectedClientId || 'ALL'}
                            routes={clientRoutes}
                            onDeleteRoute={handleDeleteRoute}
                            onStatusClick={(route) => setApprovalModalRoute(route as any)}
                            emptyMessage={`No hay contratos o rutas registradas para el cliente ${selectedClientId}.`}
                        />
                    )}
                </div>
            </div>

            {approvalModalRoute && (
                <CierreApprovalModal
                    route={approvalModalRoute}
                    isOpen={Boolean(approvalModalRoute)}
                    onClose={() => setApprovalModalRoute(null)}
                    onSuccess={() => {
                        setApprovalModalRoute(null);
                        loadData();
                    }}
                />
            )}
        </MasterTemplate>
    );
};
