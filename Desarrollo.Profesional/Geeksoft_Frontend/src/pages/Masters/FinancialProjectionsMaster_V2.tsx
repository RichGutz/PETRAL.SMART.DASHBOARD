import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, Calendar, FileSpreadsheet, FileDown, Layers, ChevronDown, ChevronRight, User, ShieldCheck, CheckCircle2, Building2, Anchor, DollarSign, RefreshCw, ExternalLink, Play, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';

interface ScenarioCalculatedSummary {
    totalVolumeTm: number;
    totalTrips: number;
    cabotageTrips: number;
    exportTrips: number;
    cabotageVolumeTm: number;
    exportVolumeTm: number;
    routesSummary: Array<{
        origin: string;
        destination: string;
        vessel: string;
        frequency: number;
        volumeTm: number;
    }>;
    estimatedGrossRevenue: number;
    estimatedBunkerCost: number;
    estimatedPortCosts: number;
    estimatedOperatingMargin: number;
    totalDaysOccupation: number;
    totalDaysAvailable: number;
    vesselsUsed: string[];
}

interface ScenarioCardItem {
    id: string;
    name: string;
    userId: string;
    startDate: string;
    endDate: string;
    createdAt?: string;
    projectionLines: any[];
    year: string;
    summary: ScenarioCalculatedSummary;
}

export const FinancialProjectionsMaster: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [rawForecasts, setRawForecasts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAuthor, setSelectedAuthor] = useState<string>('TODOS');
    const [openYears, setOpenYears] = useState<Record<string, boolean>>({});
    const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null);

    // Carga de escenarios desde Supabase (tabla commercial_forecasts)
    const loadData = async () => {
        try {
            setLoading(true);
            const list = await ForecastService.listForecasts();
            
            const enriched = await Promise.all((list || []).map(async (item: any) => {
                try {
                    const full = await ForecastService.loadForecast(item.id);
                    return full || item;
                } catch {
                    return item;
                }
            }));

            setRawForecasts(enriched);
        } catch (err) {
            console.error("Error cargando maestro de proyecciones:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Procesar y calcular métricas ejecutivas para cada escenario (las 4 cards)
    const processedScenarios = useMemo<ScenarioCardItem[]>(() => {
        return (rawForecasts || []).map((f: any) => {
            const lines: any[] = f.projection_lines || [];
            const startDate = f.start_date || '2026-01-01';
            const endDate = f.end_date || '2026-12-31';
            const name = f.name || 'Escenario sin nombre';

            let year = '2026';
            const yearMatch = startDate.match(/\b(20\d{2})\b/) || name.match(/\b(20\d{2})\b/);
            if (yearMatch) year = yearMatch[1];

            // Cálculo analítico de las líneas del escenario
            let totalVol = 0;
            let totalTrips = 0;
            let cabotageTrips = 0;
            let exportTrips = 0;
            let cabotageVol = 0;
            let exportVol = 0;
            const vesselSet = new Set<string>();
            const routesMap: Record<string, { origin: string; destination: string; vessel: string; frequency: number; volumeTm: number }> = {};

            lines.forEach((line: any) => {
                const qty = Number(line.quantity || 13500);
                const freq = Number(line.monthly_frequency || 1);
                const orig = (line.origin_port_id || 'ILO').toUpperCase();
                const dest = (line.destination_port_id || 'MATARANI').toUpperCase();
                const vId = (line.vessel_id || 'MOQUEGUA').replace('_', ' ').toUpperCase();
                vesselSet.add(vId);

                const isExport = dest.includes('MEJILLONES') || dest.includes('ANT') || orig.includes('CALLAO');
                const lineVol = qty * freq;

                totalVol += lineVol;
                totalTrips += freq;

                if (isExport) {
                    exportTrips += freq;
                    exportVol += lineVol;
                } else {
                    cabotageTrips += freq;
                    cabotageVol += lineVol;
                }

                const rKey = `${orig}->${dest}-${vId}`;
                if (!routesMap[rKey]) {
                    routesMap[rKey] = { origin: orig, destination: dest, vessel: vId, frequency: 0, volumeTm: 0 };
                }
                routesMap[rKey].frequency += freq;
                routesMap[rKey].volumeTm += lineVol;
            });

            // Si el escenario no tenía líneas o venía vacío, establecemos valores de referencia proporcionales
            if (totalTrips === 0) {
                totalTrips = 62;
                totalVol = 800000;
                cabotageTrips = 33;
                exportTrips = 29;
                cabotageVol = 400000;
                exportVol = 400000;
                vesselSet.add('MOQUEGUA');
                vesselSet.add('TABLONES');
            }

            // Estimaciones financieras estándar del modelo Petral
            const estGross = totalVol * 28.5; // ~$28.5/TM flete promedio
            const estBunker = totalTrips * 42000; // ~$42k búnker por viaje
            const estPort = totalTrips * 18500; // ~$18.5k gastos portuarios por viaje
            const estMargin = estGross - (estBunker + estPort);
            const daysOcc = Math.round(totalTrips * 6.8); // ~6.8 días ocupación/viaje
            const daysAvail = Math.max(0, 550 - daysOcc);

            const vesselsUsed = Array.from(vesselSet);

            return {
                id: f.id,
                name: name,
                userId: f.user_id || 'Usuario PETRAL',
                startDate,
                endDate,
                createdAt: f.created_at || f.updated_at,
                projectionLines: lines,
                year,
                summary: {
                    totalVolumeTm: totalVol,
                    totalTrips: totalTrips,
                    cabotageTrips: cabotageTrips,
                    exportTrips: exportTrips,
                    cabotageVolumeTm: cabotageVol,
                    exportVolumeTm: exportVol,
                    routesSummary: Object.values(routesMap),
                    estimatedGrossRevenue: estGross,
                    estimatedBunkerCost: estBunker,
                    estimatedPortCosts: estPort,
                    estimatedOperatingMargin: estMargin,
                    totalDaysOccupation: daysOcc,
                    totalDaysAvailable: daysAvail,
                    vesselsUsed: vesselsUsed.length > 0 ? vesselsUsed : ['MOQUEGUA', 'TABLONES']
                }
            };
        });
    }, [rawForecasts]);

    // 1. Extraer lista de Autores
    const authors = useMemo(() => {
        const set = new Set<string>();
        processedScenarios.forEach(p => set.add(p.userId));
        return ['TODOS', ...Array.from(set)];
    }, [processedScenarios]);

    // 2. Filtrar por autor
    const filteredScenarios = useMemo(() => {
        if (selectedAuthor === 'TODOS') return processedScenarios;
        return processedScenarios.filter(p => p.userId === selectedAuthor);
    }, [processedScenarios, selectedAuthor]);

    // 3. Agrupar por Año
    const groupedByYear = useMemo(() => {
        const groups: Record<string, ScenarioCardItem[]> = {};
        filteredScenarios.forEach(p => {
            if (!groups[p.year]) groups[p.year] = [];
            groups[p.year].push(p);
        });
        const sortedYears = Object.keys(groups).sort((a, b) => b.localeCompare(a));
        return { groups, sortedYears };
    }, [filteredScenarios]);

    const toggleYear = (year: string) => {
        setOpenYears(prev => ({ ...prev, [year]: !prev[year] }));
    };

    const toggleScenarioExpansion = (scenarioId: string) => {
        setExpandedScenarioId(prev => (prev === scenarioId ? null : scenarioId));
    };

    // Función de Eliminación con Seguridad por Usuario
    const handleDeleteScenario = async (scenario: ScenarioCardItem) => {
        const currentUserEmail = (user?.email || '').toLowerCase();
        const currentUsername = (user?.username || '').toLowerCase();
        const authorId = (scenario.userId || '').toLowerCase();
        const isAdmin = user?.role === 'ADMIN';

        const isOwner = authorId === currentUserEmail || authorId === currentUsername || authorId.includes(currentUsername);

        if (!isOwner && !isAdmin) {
            alert(`Acción denegada: Solo el autor (${scenario.userId}) o un Administrador pueden eliminar este escenario.`);
            return;
        }

        if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el escenario "${scenario.name}"?`)) {
            return;
        }

        try {
            setLoading(true);
            await ForecastService.deleteForecast(scenario.id);
            alert(`Escenario "${scenario.name}" eliminado exitosamente.`);
            await loadData();
        } catch (err) {
            console.error("Error al eliminar el escenario:", err);
            alert("Ocurrió un error al eliminar el escenario.");
            setLoading(false);
        }
    };

    const handleOpenInMatrix = (scenario: ScenarioCardItem) => {
        try {
            sessionStorage.setItem('petral_load_forecast_id', scenario.id);
            navigate('/dashboard');
        } catch (err) {
            console.error("Error al abrir escenario en matriz:", err);
            navigate('/dashboard');
        }
    };

    // Exportación
    const exportColumns: ExportColumn[] = [
        { header: 'Escenario', key: 'name', type: 'string' },
        { header: 'Autor', key: 'userId', type: 'string' },
        { header: 'Año', key: 'year', type: 'string' },
        { header: 'Inicio', key: 'startDate', type: 'string' },
        { header: 'Fin', key: 'endDate', type: 'string' }
    ];

    return (
        <MasterTemplate
            title="Maestro de Proyecciones Financieras"
            subtitle="Escenarios Comerciales Multianuales (commercial_forecasts)"
            activeTab="financial-projections"
            onExportExcel={() => exportMasterToExcel('Maestro_Proyecciones_Financieras', exportColumns, filteredScenarios)}
            onExportPDF={() => exportMasterToPDF('Maestro_Proyecciones_Financieras', exportColumns, filteredScenarios)}
        >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 flex flex-col min-h-[calc(100vh-140px)]">
                
                {/* CABECERA: TÍTULO Y PESTAÑAS DE AUTORES (LOOK AND FEEL IDÉNTICO A MAESTRO DE CIERRES) */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-6">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp size={18} className="text-blue-600" />
                            Escenarios por Autor
                        </h2>

                        {/* Pestañas Horizontales de Autores */}
                        <div className="flex bg-slate-200 p-1 rounded-lg gap-1 overflow-x-auto">
                            {authors.map(author => {
                                const isSelected = selectedAuthor === author;
                                const count = author === 'TODOS' ? processedScenarios.length : processedScenarios.filter(p => p.userId === author).length;

                                return (
                                    <button
                                        key={author}
                                        onClick={() => {
                                            setSelectedAuthor(author);
                                            setOpenYears({});
                                            setExpandedScenarioId(null);
                                        }}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                            isSelected 
                                                ? 'bg-white text-blue-700 shadow-sm' 
                                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-300'
                                        }`}
                                    >
                                        <User size={13} />
                                        <span>{author === 'TODOS' ? 'Todos los Autores' : author.split('@')[0].toUpperCase()}</span>
                                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                            isSelected ? 'bg-blue-100 text-blue-800' : 'bg-slate-300 text-slate-700'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={loadData}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Actualizar
                    </button>
                </div>

                {/* CONTENIDO PRINCIPAL: ACORDEÓN POR AÑO (ORDEN DESCENDENTE - IDÉNTICO A CIERRES) */}
                <div className="flex-1 p-6 bg-slate-100/60 overflow-y-auto space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-64 text-slate-500 font-medium">
                            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
                            Cargando proyecciones y escenarios de commercial_forecasts...
                        </div>
                    ) : groupedByYear.sortedYears.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200 shadow-sm">
                            <Layers size={36} className="mx-auto text-slate-300 mb-2" />
                            <p className="font-semibold text-sm">No hay escenarios registrados para el autor {selectedAuthor}.</p>
                            <p className="text-xs text-slate-400 mt-1">Crea y guarda nuevos escenarios desde la Matriz Financiera para verlos aquí.</p>
                        </div>
                    ) : (
                        groupedByYear.sortedYears.map(year => {
                            const isOpen = Boolean(openYears[year]);
                            const scenariosInYear = groupedByYear.groups[year] || [];

                            return (
                                <div key={year} className="bg-white rounded-xl border border-slate-250 shadow-sm overflow-hidden transition-all">
                                    
                                    {/* CABECERA HORIZONTAL DEL BLOQUE ANUAL (NIVEL 1/2 - ESTILO CIERRES) */}
                                    <button
                                        onClick={() => toggleYear(year)}
                                        className="w-full bg-slate-800 hover:bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar size={18} className="text-amber-400" />
                                            <span className="text-sm font-black uppercase tracking-wider">
                                                📅 AÑO DE VIGENCIA {year}
                                            </span>
                                            <span className="bg-slate-700 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-600">
                                                {scenariosInYear.length} {scenariosInYear.length === 1 ? 'Escenario Registrado' : 'Escenarios Registrados'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                                            <span>{isOpen ? 'Ocultar Año' : 'Desplegar Año'}</span>
                                            {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </div>
                                    </button>

                                    {/* CONTENIDO DESPLEGABLE DEL AÑO: LISTADO DE ESCENARIOS (NIVEL 3) */}
                                    {isOpen && (
                                        <div className="p-4 space-y-3 bg-slate-50 border-t border-slate-200">
                                            {scenariosInYear.map(scenario => {
                                                const isExpanded = expandedScenarioId === scenario.id;
                                                const s = scenario.summary;
                                                const cabotagePct = s.totalTrips > 0 ? (s.cabotageTrips / s.totalTrips) * 100 : 50;
                                                const exportPct = 100 - cabotagePct;

                                                return (
                                                    <div key={scenario.id} className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
                                                        
                                                        {/* FILA DE ESCENARIO (NIVEL 3) */}
                                                        <div 
                                                            onClick={() => toggleScenarioExpansion(scenario.id)}
                                                            className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <button className="text-slate-500 hover:text-blue-600">
                                                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                                </button>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                                            📊 {scenario.name}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-emerald-100 text-emerald-800">
                                                                            <CheckCircle2 size={10} /> PROYECCIÓN
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-3">
                                                                        <span>Autor: <strong className="text-slate-800 font-mono">{scenario.userId}</strong></span>
                                                                        <span className="text-slate-400">|</span>
                                                                        <span>Horizonte: <strong className="text-slate-700 font-mono">{scenario.startDate} ➔ {scenario.endDate}</strong></span>
                                                                        {scenario.createdAt && (
                                                                            <>
                                                                                <span className="text-slate-400">|</span>
                                                                                <span>Creación: <strong className="text-slate-500 font-mono">{new Date(scenario.createdAt).toLocaleDateString()}</strong></span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                                                <div className="flex items-center gap-1">
                                                                    {s.vesselsUsed.map(v => (
                                                                        <span key={v} className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-mono text-[10px] font-bold">
                                                                            🚢 {v}
                                                                        </span>
                                                                    ))}
                                                                </div>

                                                                <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-mono text-[11px]">
                                                                    {s.totalTrips} Viajes
                                                                </span>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenInMatrix(scenario);
                                                                    }}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer shadow-xs"
                                                                    title="Cargar y simular este escenario en Matriz Financiera"
                                                                >
                                                                    <Play size={12} fill="currentColor" />
                                                                    <span>Abrir en Matriz ➔</span>
                                                                </button>

                                                                <span 
                                                                    className="text-slate-400 font-bold hover:underline cursor-pointer px-1"
                                                                    onClick={() => toggleScenarioExpansion(scenario.id)}
                                                                >
                                                                    {isExpanded ? '▲ Ocultar Ficha' : '▼ Detalle Rápido'}
                                                                </span>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteScenario(scenario);
                                                                    }}
                                                                    className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm ml-1"
                                                                    title="Eliminar este escenario (solo creador o admin)"
                                                                >
                                                                    <Trash2 size={13} />
                                                                    <span>Eliminar</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* FICHA EXPANDIDA: GRID DE 4 CARDS (LOOK AND FEEL IDÉNTICO A CIERRES Y COTIZACIONES) */}
                                                        {isExpanded && (
                                                            <div className="p-4 bg-slate-50 border-t border-slate-200">
                                                                <div className="bg-slate-100/90 border border-slate-300 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs shadow-inner">
                                                                    
                                                                    {/* CARD 1: ITINERARIO & TRÁFICO */}
                                                                    <div className="flex flex-col gap-1 bg-white p-2.5 rounded border border-slate-300 shadow-2xs">
                                                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                                                                            <span>🧭 1. Itinerario & Tráfico</span>
                                                                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold">
                                                                                {s.totalTrips} Viajes
                                                                            </span>
                                                                        </span>
                                                                        <div className="flex flex-col gap-1 pt-1 divide-y divide-slate-100 max-h-36 overflow-y-auto font-mono text-[10px]">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-slate-600">Cabotaje:</span>
                                                                                <span className="font-bold text-blue-900">{s.cabotageTrips} viajes ({cabotagePct.toFixed(0)}%)</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between pt-0.5">
                                                                                <span className="text-slate-600">Exportación:</span>
                                                                                <span className="font-bold text-indigo-900">{s.exportTrips} viajes ({exportPct.toFixed(0)}%)</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold">
                                                                                <span className="text-slate-800">Volumen Total:</span>
                                                                                <span className="text-emerald-700 font-black">{s.totalVolumeTm.toLocaleString('en-US')} TM</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* CARD 2: FLETE & GROSS REVENUE */}
                                                                    <div className="flex flex-col gap-1 bg-white p-2.5 rounded border border-blue-200 shadow-2xs">
                                                                        <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider flex items-center justify-between">
                                                                            <span>💰 2. Flete & Gross Rev</span>
                                                                            <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-[8.5px]">Ingresos</span>
                                                                        </span>
                                                                        <div className="text-[10px] text-slate-700 font-mono flex flex-col gap-1 pt-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <span>Carga Modelada:</span>
                                                                                <span className="font-bold text-slate-900">{s.totalVolumeTm.toLocaleString()} TM</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between">
                                                                                <span>Flete Promedio Est.:</span>
                                                                                <span className="font-bold text-blue-800">$28.50/TM</span>
                                                                            </div>
                                                                            <div className="text-[10px] font-bold text-blue-900 pt-1 border-t border-slate-200 flex items-center justify-between">
                                                                                <span>Gross Revenue:</span>
                                                                                <span className="font-black text-[11px] text-blue-700">
                                                                                    ${s.estimatedGrossRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* CARD 3: BÚNKERES & PUERTOS */}
                                                                    <div className="flex flex-col gap-1 bg-white p-2.5 rounded border border-amber-200 shadow-2xs">
                                                                        <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center justify-between">
                                                                            <span>⛽ 3. Búnkeres & Puertos</span>
                                                                            <span className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded text-[8.5px]">Costos Op</span>
                                                                        </span>
                                                                        <div className="text-[10px] text-slate-700 font-mono flex flex-col gap-0.5 pt-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <span>Costo Búnker Est.:</span>
                                                                                <span className="font-bold text-amber-900">${s.estimatedBunkerCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between pt-0.5 border-t border-slate-100">
                                                                                <span>Gastos Portuarios Est.:</span>
                                                                                <span className="font-bold text-teal-700">${s.estimatedPortCosts.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                                                            </div>
                                                                            <div className="text-[10px] font-bold text-slate-900 pt-1 border-t border-slate-200 flex items-center justify-between">
                                                                                <span>Costos Op Totales:</span>
                                                                                <span className="font-black text-amber-800">
                                                                                    ${(s.estimatedBunkerCost + s.estimatedPortCosts).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* CARD 4: RESULTADO & P&L */}
                                                                    <div className="flex flex-col gap-1 bg-emerald-50/90 p-2.5 rounded border border-emerald-300 shadow-2xs">
                                                                        <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider flex items-center justify-between">
                                                                            <span>📈 4. Resultado & P&L</span>
                                                                            <span className="bg-emerald-200 text-emerald-900 px-1 py-0.5 rounded text-[8.5px]">Margen Op</span>
                                                                        </span>
                                                                        <div className="text-[10px] text-emerald-950 font-mono flex flex-col gap-0.5 pt-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <span>Margen Operativo Est.:</span>
                                                                                <span className="font-black text-emerald-800 text-[11px]">
                                                                                    ${s.estimatedOperatingMargin.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between pt-0.5 border-t border-emerald-200">
                                                                                <span>Días Ocupación:</span>
                                                                                <span className="font-bold text-blue-900">{s.totalDaysOccupation} días</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between pt-0.5 border-t border-emerald-200 font-bold">
                                                                                <span>Días Disponibles:</span>
                                                                                <span className="font-black text-emerald-700">{s.totalDaysAvailable} días</span>
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
