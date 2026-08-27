import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { FileText, Calendar, ChevronDown, ChevronRight, Anchor, DollarSign, Ship, CheckCircle2, Layers, RefreshCw, Trash2, ExternalLink, PieChart } from 'lucide-react';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';
import { QuoteExecutiveCardSummary } from '../../components/CommercialForecast/QuoteExecutiveCardSummary';
import { SharedYearlyRouteList } from '../../components/CommercialForecast/SharedYearlyRouteList';

interface EnrichedBudgetRoute {
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
        category?: string;
        is_budget?: boolean;
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
        financial_summary?: any;
    };
}

export const BudgetsMaster: React.FC = () => {
    const [allRoutes, setAllRoutes] = useState<EnrichedBudgetRoute[]>([]);
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
                ForecastService.getSpotVoyages(),
                ForecastService.getClientsMaster()
            ]);
            setAllRoutes(routesList || []);
            setClients(clientsData || []);
        } catch (err) {
            console.error("Error cargando maestro de presupuestos:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoute = async (route: EnrichedBudgetRoute) => {
        const identifier = route.name || route.route_id;
        if (!identifier) return;

        if (!window.confirm(`¿Estás seguro de que deseas eliminar la ruta de presupuesto "${route.name}"? Esta acción eliminará el registro de la base de datos.`)) {
            return;
        }

        try {
            setLoading(true);
            await ForecastService.deleteSpot(identifier);
            await loadData();
            alert(`Presupuesto "${route.name}" eliminado exitosamente.`);
        } catch (err) {
            console.error("Error al eliminar el presupuesto:", err);
            alert("Ocurrió un error al eliminar el presupuesto.");
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // 1. Filtrar solo las rutas de PRESUPUESTO (unificadas en routes_quotes)
    const budgetRoutesAll = useMemo(() => {
        return allRoutes.filter(r => {
            const desc = (r.description || '').toUpperCase();
            const cat = (r.legs_data?.category || '').toUpperCase();
            const isBudgetFlag = r.legs_data?.is_budget === true;
            return desc.includes('PRESUPUESTO') || cat === 'PRESUPUESTO' || isBudgetFlag;
        });
    }, [allRoutes]);

    // 2. Clientes con rutas de presupuesto
    const budgetClients = useMemo(() => {
        const clientSet = new Set<string>();
        budgetRoutesAll.forEach(r => {
            const cid = r.client_id || (r.name.toUpperCase().startsWith("SPCC") ? "SPCC" : r.name.toUpperCase().startsWith("NEXA") ? "NEXA" : "");
            if (cid) clientSet.add(cid.toUpperCase());
        });
        (clients || []).forEach((c: any) => {
            const cid = typeof c === 'string' ? c : (c.client_id || c.name || c.id);
            if (cid && c.is_active !== false) clientSet.add(cid.toString().toUpperCase());
        });
        const list = Array.from(clientSet).filter(Boolean);
        return list.length > 0 ? list : ['SPCC', 'NEXA', 'PRIMAX'];
    }, [budgetRoutesAll, clients]);

    // Auto-seleccionar primer cliente si no hay uno elegido
    useEffect(() => {
        if (!selectedClientId && budgetClients.length > 0) {
            setSelectedClientId(budgetClients[0]);
        }
    }, [budgetClients, selectedClientId]);

    // 3. Filtrar rutas pertenecientes al cliente seleccionado
    const clientRoutes = useMemo(() => {
        if (!selectedClientId) return [];
        const cidUpper = selectedClientId.toUpperCase();
        return budgetRoutesAll.filter(r => {
            const rCid = (r.client_id || (r.name.toUpperCase().startsWith("SPCC") ? "SPCC" : r.name.toUpperCase().startsWith("NEXA") ? "NEXA" : "")).toUpperCase();
            const rName = (r.name || '').toUpperCase();
            return rCid === cidUpper || rName.startsWith(cidUpper);
        });
    }, [budgetRoutesAll, selectedClientId]);

    // 4. Agrupar rutas por AÑO DE VIGENCIA (Orden Descendente)
    const groupedByYear = useMemo(() => {
        const groups: Record<string, EnrichedBudgetRoute[]> = {};

        clientRoutes.forEach(route => {
            const ld = route.legs_data || {};
            const validToStr = route.valid_to || ld.valid_to || ld.baf_valid_to;
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

        const sortedYears = Object.keys(groups).sort((a, b) => b.localeCompare(a));
        return { groups, sortedYears };
    }, [clientRoutes]);

    // Inicializar el primer año desplegado
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
        { header: 'Presupuesto / Ruta', key: 'name', type: 'string' },
        { header: 'Cliente', key: 'client_id', type: 'string' },
        { header: 'Válido Desde', key: 'valid_from', type: 'string' },
        { header: 'Válido Hasta', key: 'valid_to', type: 'string' },
        { header: 'Descripción', key: 'description', type: 'string' }
    ];

    return (
        <MasterTemplate
            title="Maestro de Presupuestos"
            subtitle="Presupuestos Comerciales Anuales y Rutas Proyectadas (routes_quotes)"
            activeTab="budgets"
            onExportExcel={() => exportMasterToExcel('Maestro_Presupuestos', exportColumns, clientRoutes)}
            onExportPDF={() => exportMasterToPDF('Maestro_Presupuestos', exportColumns, clientRoutes)}
        >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 flex flex-col min-h-[calc(100vh-140px)]">
                
                {/* CABECERA: TITULO Y SELECCION DE CLIENTES */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-6">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <PieChart size={18} className="text-emerald-600" />
                            Clientes con Presupuestos
                        </h2>

                        {/* Pestañas Horizontales de Clientes */}
                        <div className="flex bg-slate-200 p-1 rounded-lg gap-1 overflow-x-auto">
                            {budgetClients.map(cid => {
                                const isSelected = selectedClientId === cid;
                                const clientObj = (clients || []).find((c: any) => (typeof c === 'string' ? c : (c.client_id || c.name || c.id)) === cid);
                                const displayName = (clientObj && typeof clientObj !== 'string') ? (clientObj.client_name || clientObj.name || cid) : cid;
                                const routeCount = budgetRoutesAll.filter(r => {
                                    const rCid = (r.client_id || (r.name.toUpperCase().startsWith("SPCC") ? "SPCC" : r.name.toUpperCase().startsWith("NEXA") ? "NEXA" : "")).toUpperCase();
                                    return rCid === cid.toUpperCase() || (r.name || '').toUpperCase().startsWith(cid.toUpperCase());
                                }).length;

                                return (
                                    <button
                                        key={cid}
                                        onClick={() => {
                                            setSelectedClientId(cid);
                                            setExpandedRouteName(null);
                                        }}
                                        className={`px-3.5 py-1.5 rounded-md text-xs font-black uppercase transition-all flex items-center gap-2 cursor-pointer ${
                                            isSelected 
                                                ? 'bg-emerald-600 text-white shadow-xs' 
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300'
                                        }`}
                                    >
                                        <span>{displayName}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                            isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-300 text-slate-700'
                                        }`}>
                                            {routeCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadData}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Recargar datos de presupuestos"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <span className="text-xs font-bold text-slate-500 font-mono">
                            Total Presupuestos: <strong className="text-emerald-700">{budgetRoutesAll.length}</strong>
                        </span>
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL: ACORDEÓN POR AÑOS Y RUTAS CON DOBLE DRAG & DROP PERSISTENTE */}
                <div className="p-6 flex-1 bg-slate-50/50 flex flex-col gap-5 overflow-y-auto">
                    {loading ? (
                        <div className="py-16 text-center text-slate-400 font-bold text-sm">
                            <div className="animate-spin h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                            Cargando Presupuestos de Supabase...
                        </div>
                    ) : (
                        <SharedYearlyRouteList
                            storageKey="budgets"
                            clientId={selectedClientId || 'ALL'}
                            routes={clientRoutes as any}
                            onDeleteRoute={handleDeleteRoute}
                            emptyMessage={`No se encontraron presupuestos registrados para ${selectedClientId}.`}
                        />
                    )}
                </div>

            </div>
        </MasterTemplate>
    );
};
