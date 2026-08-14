import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { FileText, Calendar, ChevronDown, ChevronRight, Anchor, DollarSign, Ship, CheckCircle2, Layers, RefreshCw } from 'lucide-react';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';

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

    useEffect(() => {
        loadData();
    }, []);

    // 1. Filtrar solo las rutas contractuales (contracts)
    const contractRoutesAll = useMemo(() => {
        return allRoutes.filter(r => r.is_contract === true || r.table_source === 'contracts' || r.legs_data?.contract_metadata?.contract_id);
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
            let year = '2025';
            const metaFrom = route.valid_from || route.legs_data?.contract_metadata?.valid_from || route.legs_data?.baf_valid_from;
            if (metaFrom && metaFrom.length >= 4) {
                year = metaFrom.substring(0, 4);
            } else {
                const nameYearMatch = (route.name || '').match(/\.(20\d{2})\./);
                if (nameYearMatch) {
                    year = nameYearMatch[1];
                }
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
            title="Maestro de Contratos"
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

                                                            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                                                                <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-mono text-[11px]">
                                                                    {tramos.length} Tramos
                                                                </span>
                                                                <span className="text-blue-600 font-bold hover:underline">
                                                                    {isExpanded ? 'Ocultar UI Multicotizador' : 'Ver UI Multicotizador ➔'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* FICHA EXPANDIDA: UI COMPLETA DEL MULTICOTIZADOR (NIVEL 4) */}
                                                        {isExpanded && (
                                                            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-6">
                                                                
                                                                <div className="bg-blue-950 text-white p-3 rounded-lg flex items-center justify-between">
                                                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                                                        <Ship size={16} className="text-blue-400" />
                                                                        <span>Ficha Comercial Multicotizador — {route.name}</span>
                                                                    </div>
                                                                    <span className="text-[11px] font-mono text-blue-200 bg-blue-900/80 px-2 py-0.5 rounded">
                                                                        Origen: Supabase DB ({route.table_source || 'contracts'})
                                                                    </span>
                                                                </div>

                                                                {/* 1. TRAMOS Y TARIFAS DE FLETE */}
                                                                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                                                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
                                                                        <Anchor size={14} className="text-blue-600" />
                                                                        1. Tramos & Tarifas de Flete
                                                                    </h4>
                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-xs font-mono border-collapse">
                                                                            <thead>
                                                                                <tr className="bg-slate-100 border-b border-slate-300 font-sans text-slate-600 font-bold">
                                                                                    <th className="text-left py-1.5 px-2">Tramo</th>
                                                                                    <th className="text-left py-1.5 px-2">Tipo</th>
                                                                                    <th className="text-left py-1.5 px-2">Origen ➔ Destino</th>
                                                                                    <th className="text-right py-1.5 px-2">Cantidad (MT)</th>
                                                                                    <th className="text-right py-1.5 px-2">Flete ($/MT)</th>
                                                                                    <th className="text-right py-1.5 px-2">Distancia (NM)</th>
                                                                                    <th className="text-right py-1.5 px-2">Velocidad (kn)</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {tramos.map((tr: any, idx: number) => (
                                                                                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                                                                                        <td className="py-1.5 px-2 font-bold text-slate-700">Pierna {idx + 1}</td>
                                                                                        <td className="py-1.5 px-2 font-sans">
                                                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${tr.type === 'LADEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                                                                {tr.type || 'LADEN'}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="py-1.5 px-2 font-bold text-blue-900">
                                                                                            {tr.origin_port_id || 'N/A'} ➔ {tr.destination_port_id || 'N/A'}
                                                                                        </td>
                                                                                        <td className="py-1.5 px-2 text-right">{fmtThousandSep(tr.quantity)} MT</td>
                                                                                        <td className="py-1.5 px-2 text-right font-bold text-emerald-700">{fmtCur(tr.freight_rate)}/MT</td>
                                                                                        <td className="py-1.5 px-2 text-right">{fmtThousandSep(tr.route_distance)} NM</td>
                                                                                        <td className="py-1.5 px-2 text-right">{tr.speed || 11} kn</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>

                                                                {/* 2. MATRIZ DE PUERTOS Y COSTOS PORTUARIOS */}
                                                                {puertosConfig.length > 0 && (
                                                                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                                                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
                                                                            <DollarSign size={14} className="text-emerald-600" />
                                                                            2. Configuración Operativa & Costos Portuarios por Terminal
                                                                        </h4>
                                                                        <div className="overflow-x-auto">
                                                                            <table className="w-full text-xs font-mono border-collapse">
                                                                                <thead>
                                                                                    <tr className="bg-slate-100 border-b border-slate-300 font-sans text-slate-600 font-bold">
                                                                                        <th className="text-left py-1.5 px-2">Puerto</th>
                                                                                        <th className="text-left py-1.5 px-2">Operación</th>
                                                                                        <th className="text-right py-1.5 px-2">Ritmo Op. (TH)</th>
                                                                                        <th className="text-right py-1.5 px-2">Laytime (Hrs)</th>
                                                                                        <th className="text-right py-1.5 px-2">Posicionamiento (Hrs)</th>
                                                                                        <th className="text-right py-1.5 px-2">Costo Puerto Est. (USD)</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {puertosConfig.map((p: any, idx: number) => {
                                                                                        if (p.action === 'NONE' && !p.manual_port_cost) return null;
                                                                                        const portName = idx === 0 
                                                                                            ? (tramos[0]?.origin_port_id || 'Origen') 
                                                                                            : (tramos[idx - 1]?.destination_port_id || `Destino ${idx}`);

                                                                                        return (
                                                                                            <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                                                                                                <td className="py-1.5 px-2 font-bold text-slate-800">{portName}</td>
                                                                                                <td className="py-1.5 px-2 font-sans">
                                                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${p.action === 'CARGAR' ? 'bg-blue-100 text-blue-800' : p.action === 'DESCARGAR' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                                                                                        {p.action || 'NONE'}
                                                                                                    </span>
                                                                                                </td>
                                                                                                <td className="py-1.5 px-2 text-right">{p.op_rate || 0} TH</td>
                                                                                                <td className="py-1.5 px-2 text-right">{p.time_to_count || 0} hrs</td>
                                                                                                <td className="py-1.5 px-2 text-right">{p.positioning || 0} hrs</td>
                                                                                                <td className="py-1.5 px-2 text-right font-bold text-slate-800">{fmtCur(p.manual_port_cost || p.muellaje_cost)}</td>
                                                                                            </tr>
                                                                                        );
                                                                                    })}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* 3. FILA INFERIOR DE CARDS (COMMENTS, BAF Y DEMURRAGE) */}
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                    
                                                                    {/* CARD 1: COMMENTS */}
                                                                    <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm flex flex-col justify-between">
                                                                        <div>
                                                                            <h5 className="text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 pb-1 mb-2 font-sans flex items-center justify-between">
                                                                                <span>Comments (Observaciones)</span>
                                                                                <span className="text-[9.5px] font-mono text-slate-400">Bitácora</span>
                                                                            </h5>
                                                                            {(() => {
                                                                                const commentList = route.comments || route.legs_data?.comments || route.legs_data?.contract_metadata?.comments;
                                                                                if (Array.isArray(commentList) && commentList.length > 0) {
                                                                                    return (
                                                                                        <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                                                                                            {commentList.map((c: any, cIdx: number) => (
                                                                                                <div key={cIdx} className="bg-slate-50 p-1.5 rounded border border-slate-200 text-[11px] font-sans">
                                                                                                    <div className="flex justify-between items-center text-[9.5px] text-slate-500 font-bold mb-0.5">
                                                                                                        <span>👤 {c.user || 'Sistema'}</span>
                                                                                                        <span>📅 {c.date || 'Sin fecha'}</span>
                                                                                                    </div>
                                                                                                    <p className="text-slate-800 italic">{c.text}</p>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                                return (
                                                                                    <p className="text-xs text-slate-700 font-sans italic bg-slate-50 p-2 rounded border border-slate-200 min-h-[60px]">
                                                                                        {route.description || route.legs_data?.contract_metadata?.contract_status || 'Sin observaciones registradas.'}
                                                                                    </p>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                    </div>

                                                                    {/* CARD 2: BAF SIMETRICO */}
                                                                    <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm flex flex-col justify-between">
                                                                        <div>
                                                                            <h5 className="text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 pb-1 mb-2 font-sans flex items-center justify-between">
                                                                                <span>BAF (Bunker Adjustment Factor)</span>
                                                                                <span className="text-[9.5px] font-mono text-blue-600 font-bold">Base</span>
                                                                            </h5>
                                                                            <div className="space-y-2 text-xs font-mono">
                                                                                <div>
                                                                                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Fórmula BAF:</span>
                                                                                    <div className="bg-slate-50 border border-slate-200 p-1 rounded font-bold text-blue-900 text-[11px]">
                                                                                        {route.legs_data?.baf_formula || route.legs_data?.contract_metadata?.baf_formula || 'Sin fórmula asignada'}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="grid grid-cols-2 gap-1.5">
                                                                                    <div>
                                                                                        <span className="text-[9px] text-slate-500 uppercase block font-bold">Inicio Validez:</span>
                                                                                        <div className="bg-white border border-slate-200 p-1 rounded font-bold text-slate-800 text-[10.5px]">
                                                                                            {route.legs_data?.baf_valid_from || validFrom}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-[9px] text-slate-500 uppercase block font-bold">Fin Validez:</span>
                                                                                        <div className="bg-white border border-slate-200 p-1 rounded font-bold text-slate-800 text-[10.5px]">
                                                                                            {route.legs_data?.baf_valid_to || validTo}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="grid grid-cols-2 gap-1.5">
                                                                                    <div>
                                                                                        <span className="text-[9px] text-slate-500 uppercase block font-bold">IFO Base ($/T):</span>
                                                                                        <div className="bg-white border border-slate-200 p-1 rounded font-bold text-slate-800 text-right text-[11px]">
                                                                                            {fmtCur(route.legs_data?.baf_ifo_base || route.legs_data?.contract_metadata?.baf_ifo_base)}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-[9px] text-slate-500 uppercase block font-bold">MDO Base ($/T):</span>
                                                                                        <div className="bg-white border border-slate-200 p-1 rounded font-bold text-slate-800 text-right text-[11px]">
                                                                                            {fmtCur(route.legs_data?.baf_mdo_base || route.legs_data?.contract_metadata?.baf_mdo_base)}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* COLUMNA 3: 2 CARDS SEPARADAS (DEMURRAGE ARRIBA, BANDAS TARIFARIAS ABAJO) */}
                                                                    <div className="flex flex-col gap-2 justify-between flex-1 h-full">
                                                                        
                                                                        {/* CARD 3A: DEMURRAGE (CARD INDEPENDIENTE ARRIBA) */}
                                                                        <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm flex flex-col justify-between">
                                                                            <h5 className="text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 pb-1 mb-1.5 font-sans flex items-center justify-between">
                                                                                <span>Demurrage (Estadías)</span>
                                                                                <span className="text-[9.5px] font-mono text-slate-400">$ / día</span>
                                                                            </h5>
                                                                            {(() => {
                                                                                const demMap = route.demurrage_rates || route.legs_data?.demurrage_rates || route.legs_data?.contract_metadata?.demurrage_rates;
                                                                                if (demMap && typeof demMap === 'object' && Object.keys(demMap).length > 0) {
                                                                                    return (
                                                                                        <div className="space-y-1 max-h-[80px] overflow-y-auto pr-1">
                                                                                            {Object.entries(demMap).map(([vesselName, rateVal]) => (
                                                                                                <div key={vesselName} className="bg-slate-50 px-2 py-1 rounded border border-slate-200 flex justify-between items-center text-xs font-sans">
                                                                                                    <span className="font-semibold text-slate-700 text-[10.5px]">🚢 {vesselName}:</span>
                                                                                                    <span className="font-mono font-bold text-amber-700">{fmtCur(rateVal as number)} / día</span>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                                const singleRate = route.demurrage_rate || route.legs_data?.contract_metadata?.demurrage_rate || 20000;
                                                                                return (
                                                                                    <div className="bg-slate-50 p-1.5 rounded border border-slate-200 flex justify-between items-center text-xs font-sans">
                                                                                        <span className="font-semibold text-slate-600">Rate ($/día):</span>
                                                                                        <span className="font-mono font-bold text-amber-700">{fmtCur(singleRate)} / día</span>
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                        </div>

                                                                        {/* CARD 3B: BANDAS TARIFARIAS POR VOLUMEN (CARD INDEPENDIENTE ABAJO) */}
                                                                        <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm flex flex-col justify-between">
                                                                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1 font-sans flex items-center justify-between">
                                                                                <span>Bandas Tarifarias por Volumen ($/MT)</span>
                                                                                <span className="text-[9px] font-mono text-emerald-600 font-bold">4 Bandas</span>
                                                                            </h5>
                                                                            <div className="grid grid-cols-4 gap-1 pt-0.5 font-mono">
                                                                                {(() => {
                                                                                    const tiers = (route as any).tariff_tiers || route.legs_data?.tariff_tiers || route.legs_data?.contract_metadata?.tariff_tiers || (route as any).contract_tariffs || [];
                                                                                    return [0, 1, 2, 3].map((idx) => {
                                                                                        const t = tiers[idx] || {};
                                                                                        const labelText = t.label || (idx === 0 ? "10k-11.5k" : idx === 1 ? "11.5k-13k" : idx === 2 ? "13k-13.5k" : "13.6k-14.5k");
                                                                                        const rateVal = t.rate ?? t.freight_rate ?? 0;

                                                                                        return (
                                                                                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-1 text-center">
                                                                                                <div className="text-[8.5px] font-bold text-slate-600 truncate border-b border-slate-200 pb-0.5 mb-0.5">
                                                                                                    {labelText}
                                                                                                </div>
                                                                                                <div className="text-[10px] font-bold text-emerald-700">
                                                                                                    {rateVal ? `${fmtCur(rateVal)}/MT` : '$0.00'}
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    });
                                                                                })()}
                                                                            </div>
                                                                        </div>

                                                                    </div>

                                                                </div>

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
