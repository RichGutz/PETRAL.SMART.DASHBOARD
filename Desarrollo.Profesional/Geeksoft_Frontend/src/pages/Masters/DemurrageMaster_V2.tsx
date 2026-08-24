import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { Button } from '../../components/ui/button';
import { 
    FileSpreadsheet, 
    Upload, 
    RefreshCw, 
    Plus, 
    Search, 
    Trash2, 
    Filter, 
    BarChart3, 
    TrendingUp, 
    Anchor, 
    Ship, 
    Clock,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Layers,
    SlidersHorizontal
} from 'lucide-react';
import { PortDemurrageRatesService } from '../../services/providers/portDemurrageRatesService';
import type { DemurrageRecord, PortVesselDemurrageProfile } from '../../services/providers/portDemurrageRatesService';

type GroupBy = 'vessel' | 'port' | 'client';
type ChartMetric = 'total_days' | 'total_hours' | 'avg_days' | 'voyages_count';
type ChartType = 'bar_stack' | 'bar' | 'line' | 'area';

const MONTH_NAMES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const COLOR_PALETTE: Record<string, string> = {
    // Buques
    'Moquegua': '#10B981',       // Verde Esmeralda
    'Tablones': '#EF4444',       // Rojo Fuerte
    'Bomar Lynx': '#3B82F6',     // Azul
    'Huemul': '#8B5CF6',         // Púrpura
    'Concon Trader': '#64748B',  // Slate
    // Puertos
    'ILO': '#0089CF',            // Azul Petral
    'CALLAO': '#06B6D4',         // Cyan
    'MARCONA': '#A855F7',        // Violeta
    'MATARANI': '#F59E0B',       // Ámbar
    'MEJILLONES': '#EC4899',     // Rosa
    // Clientes
    'SPCC': '#0284C7',
    'NEXA': '#F97316',
    'PETRAL': '#0089CF'
};

const getColorForEntity = (name: string): string => {
    if (COLOR_PALETTE[name]) return COLOR_PALETTE[name];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export const DemurrageMaster_V2: React.FC = () => {
    const [records, setRecords] = useState<DemurrageRecord[]>([]);
    const [activeTab, setActiveTab] = useState<'chart' | 'matrix' | 'voyages'>('chart');
    
    // Controles del Gráfico Interactivo
    const [groupBy, setGroupBy] = useState<GroupBy>('vessel');
    const [chartMetric, setChartMetric] = useState<ChartMetric>('total_days');
    const [chartType, setChartType] = useState<ChartType>('bar_stack');
    const [selectedYearChart, setSelectedYearChart] = useState<string>('ALL');
    const [selectedPortFilterChart, setSelectedPortFilterChart] = useState<string>('ALL');

    // Filtros de Tablas
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVesselFilter, setSelectedVesselFilter] = useState('ALL');
    const [selectedClientFilter, setSelectedClientFilter] = useState('ALL');
    const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');
    
    const [isUploading, setIsUploading] = useState(false);
    const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Modal nuevo viaje manual
    const [showNewModal, setShowNewModal] = useState(false);
    const [newClient, setNewClient] = useState('PETRAL');
    const [newYear, setNewYear] = useState(new Date().getFullYear());
    const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
    const [newVessel, setNewVessel] = useState('Moquegua');
    const [newVoyage, setNewVoyage] = useState<number>(0);
    const [newPortsData, setNewPortsData] = useState<Record<string, { hours: string; days: string }>>({
        ILO: { hours: '', days: '' },
        CALLAO: { hours: '', days: '' },
        MARCONA: { hours: '', days: '' },
        MATARANI: { hours: '', days: '' },
        MEJILLONES: { hours: '', days: '' }
    });

    const loadData = () => {
        const loaded = PortDemurrageRatesService.getRecords();
        setRecords(loaded);
    };

    useEffect(() => {
        loadData();
        // Sincronizar en segundo plano con Supabase
        PortDemurrageRatesService.syncFromBackend().then(synced => {
            if (synced && synced.length > 0) setRecords(synced);
        }).catch(() => {});

        const handleUpdated = () => loadData();
        window.addEventListener('petral_demurrage_updated', handleUpdated);
        return () => window.removeEventListener('petral_demurrage_updated', handleUpdated);
    }, []);

    // Lista única de Buques, Clientes, Puertos y Años
    const uniqueVessels = useMemo(() => {
        const set = new Set<string>();
        records.forEach(r => { if (r.vessel) set.add(r.vessel); });
        return Array.from(set).sort();
    }, [records]);

    const uniqueClients = useMemo(() => {
        const set = new Set<string>();
        records.forEach(r => { if (r.client) set.add(r.client); });
        return Array.from(set).sort();
    }, [records]);

    const uniqueYears = useMemo(() => {
        const set = new Set<number>();
        records.forEach(r => { if (r.year) set.add(r.year); });
        return Array.from(set).sort((a, b) => b - a);
    }, [records]);

    // Estadísticas / KPIs Superiores
    const stats = useMemo(() => {
        const totalVoyages = records.length;
        const totalVessels = uniqueVessels.length;
        
        let sumGlobalDays = 0;
        let totalPortTouches = 0;
        const portTotals: Record<string, { days: number; touches: number }> = {};

        records.forEach(r => {
            if (r.ports) {
                Object.entries(r.ports).forEach(([pKey, pVal]) => {
                    const d = Number(pVal.days) || 0;
                    sumGlobalDays += d;
                    totalPortTouches += 1;

                    if (!portTotals[pKey]) portTotals[pKey] = { days: 0, touches: 0 };
                    portTotals[pKey].days += d;
                    portTotals[pKey].touches += 1;
                });
            }
        });

        const globalAvgDays = totalPortTouches > 0 ? (sumGlobalDays / totalPortTouches) : 0;

        let maxPortKey = 'MEJILLONES';
        let maxPortAvg = 0;
        Object.entries(portTotals).forEach(([pKey, data]) => {
            const avg = data.touches > 0 ? (data.days / data.touches) : 0;
            if (avg > maxPortAvg) {
                maxPortAvg = avg;
                maxPortKey = pKey;
            }
        });

        return {
            totalVoyages,
            totalVessels,
            globalAvgDays: globalAvgDays.toFixed(2),
            globalAvgHours: (globalAvgDays * 24).toFixed(1),
            criticalPort: maxPortKey,
            criticalPortAvg: maxPortAvg.toFixed(2)
        };
    }, [records, uniqueVessels]);

    // Construcción de la Opción de ECharts
    const chartOption = useMemo(() => {
        // Filtrar registros para el gráfico
        const filteredForChart = records.filter(r => {
            if (selectedYearChart !== 'ALL' && String(r.year) !== selectedYearChart) return false;
            return true;
        });

        // Agrupar entidades (Buques, Puertos o Clientes)
        let entities: string[] = [];
        if (groupBy === 'vessel') {
            entities = uniqueVessels.length > 0 ? uniqueVessels : ['Moquegua', 'Tablones', 'Huemul', 'Concon Trader'];
        } else if (groupBy === 'port') {
            entities = PortDemurrageRatesService.STANDARD_PORTS.map(p => p.id);
        } else if (groupBy === 'client') {
            entities = uniqueClients.length > 0 ? uniqueClients : ['SPCC', 'NEXA', 'PETRAL'];
        }

        // Matriz de 12 meses para cada entidad
        const seriesDataMap: Record<string, { sumDays: number[]; sumHrs: number[]; count: number[] }> = {};
        entities.forEach(ent => {
            seriesDataMap[ent] = {
                sumDays: Array(12).fill(0),
                sumHrs: Array(12).fill(0),
                count: Array(12).fill(0)
            };
        });

        filteredForChart.forEach(r => {
            const mIdx = (r.month >= 1 && r.month <= 12) ? r.month - 1 : 0;
            
            if (groupBy === 'vessel') {
                const ent = r.vessel;
                if (!seriesDataMap[ent]) {
                    seriesDataMap[ent] = { sumDays: Array(12).fill(0), sumHrs: Array(12).fill(0), count: Array(12).fill(0) };
                }

                if (selectedPortFilterChart === 'ALL') {
                    seriesDataMap[ent].sumDays[mIdx] += (Number(r.total_days) || 0);
                    seriesDataMap[ent].sumHrs[mIdx] += (Number(r.total_hours) || 0);
                    seriesDataMap[ent].count[mIdx] += 1;
                } else if (r.ports && r.ports[selectedPortFilterChart]) {
                    seriesDataMap[ent].sumDays[mIdx] += (Number(r.ports[selectedPortFilterChart].days) || 0);
                    seriesDataMap[ent].sumHrs[mIdx] += (Number(r.ports[selectedPortFilterChart].hours) || 0);
                    seriesDataMap[ent].count[mIdx] += 1;
                }
            } else if (groupBy === 'client') {
                const ent = r.client || 'PETRAL';
                if (!seriesDataMap[ent]) {
                    seriesDataMap[ent] = { sumDays: Array(12).fill(0), sumHrs: Array(12).fill(0), count: Array(12).fill(0) };
                }

                if (selectedPortFilterChart === 'ALL') {
                    seriesDataMap[ent].sumDays[mIdx] += (Number(r.total_days) || 0);
                    seriesDataMap[ent].sumHrs[mIdx] += (Number(r.total_hours) || 0);
                    seriesDataMap[ent].count[mIdx] += 1;
                } else if (r.ports && r.ports[selectedPortFilterChart]) {
                    seriesDataMap[ent].sumDays[mIdx] += (Number(r.ports[selectedPortFilterChart].days) || 0);
                    seriesDataMap[ent].sumHrs[mIdx] += (Number(r.ports[selectedPortFilterChart].hours) || 0);
                    seriesDataMap[ent].count[mIdx] += 1;
                }
            } else if (groupBy === 'port') {
                if (r.ports) {
                    Object.entries(r.ports).forEach(([pKey, pVal]) => {
                        const ent = pKey;
                        if (!seriesDataMap[ent]) {
                            seriesDataMap[ent] = { sumDays: Array(12).fill(0), sumHrs: Array(12).fill(0), count: Array(12).fill(0) };
                        }
                        seriesDataMap[ent].sumDays[mIdx] += (Number(pVal.days) || 0);
                        seriesDataMap[ent].sumHrs[mIdx] += (Number(pVal.hours) || 0);
                        seriesDataMap[ent].count[mIdx] += 1;
                    });
                }
            }
        });

        // Crear las series de ECharts
        const series = Object.keys(seriesDataMap).map(ent => {
            const dataObj = seriesDataMap[ent];
            const dataValues = MONTH_NAMES.map((_, i) => {
                if (chartMetric === 'total_days') {
                    return Number(dataObj.sumDays[i].toFixed(2));
                } else if (chartMetric === 'total_hours') {
                    return Number(dataObj.sumHrs[i].toFixed(1));
                } else if (chartMetric === 'avg_days') {
                    return dataObj.count[i] > 0 ? Number((dataObj.sumDays[i] / dataObj.count[i]).toFixed(2)) : 0;
                } else {
                    return dataObj.count[i];
                }
            });

            const color = getColorForEntity(ent);
            const isStack = chartType === 'bar_stack';
            const isBar = chartType.startsWith('bar');
            const isArea = chartType === 'area';

            return {
                name: ent,
                type: isBar ? 'bar' : 'line',
                stack: isStack ? 'total' : undefined,
                smooth: true,
                areaStyle: isArea ? { opacity: 0.25, color } : undefined,
                itemStyle: {
                    color: color,
                    borderRadius: isStack ? 0 : [3, 3, 0, 0]
                },
                emphasis: {
                    focus: 'series'
                },
                data: dataValues
            };
        });

        const metricLabels: Record<ChartMetric, string> = {
            total_days: 'Días de Demora Totales',
            total_hours: 'Horas de Demora Totales',
            avg_days: 'Demora Promedio por Viaje (Días)',
            voyages_count: 'Número de Recaladas'
        };

        const metricUnit: Record<ChartMetric, string> = {
            total_days: ' d',
            total_hours: ' h',
            avg_days: ' d/viaje',
            voyages_count: ' viajes'
        };

        return {
            backgroundColor: '#ffffff',
            title: {
                text: `Evolución de Demoras Históricas — ${metricLabels[chartMetric]}`,
                subtext: `Agrupado por ${groupBy.toUpperCase()} • Período: ${selectedYearChart === 'ALL' ? 'Histórico Consolidado 2024-2026' : `Año ${selectedYearChart}`} • Puerto: ${selectedPortFilterChart}`,
                left: 10,
                top: 10,
                textStyle: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
                subtextStyle: { fontSize: 10.5, color: '#64748B' }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                borderColor: '#334155',
                borderWidth: 1,
                textStyle: { color: '#F8FAFC', fontSize: 11 },
                valueFormatter: (value: any) => `${value !== undefined && value !== null ? value : 0}${metricUnit[chartMetric]}`
            },
            legend: {
                type: 'scroll',
                top: 45,
                left: 10,
                right: 10,
                textStyle: { fontSize: 11, color: '#334155', fontWeight: 'bold' }
            },
            grid: {
                left: 45,
                right: 25,
                bottom: 30,
                top: 90,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: MONTH_NAMES,
                axisLine: { lineStyle: { color: '#CBD5E1' } },
                axisLabel: { color: '#475569', fontWeight: 'bold', fontSize: 11 }
            },
            yAxis: {
                type: 'value',
                name: metricLabels[chartMetric],
                nameTextStyle: { color: '#64748B', fontSize: 10, align: 'right' },
                axisLine: { show: false },
                splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
                axisLabel: { color: '#64748B', fontSize: 10 }
            },
            series
        };
    }, [records, groupBy, chartMetric, chartType, selectedYearChart, selectedPortFilterChart, uniqueVessels, uniqueClients]);

    // Perfiles consolidados para la matriz (Buque × Puerto)
    const matrixProfiles = useMemo(() => {
        const ports = PortDemurrageRatesService.STANDARD_PORTS;
        const vesselList = uniqueVessels.length > 0 ? uniqueVessels : ['Moquegua', 'Tablones', 'Huemul', 'Concon Trader'];
        
        const list: { vessel: string; port: { id: string; label: string }; profile: PortVesselDemurrageProfile }[] = [];
        
        vesselList.forEach(v => {
            ports.forEach(p => {
                const profile = PortDemurrageRatesService.getDemurrageProfile(p.id, v, records);
                list.push({
                    vessel: v,
                    port: p,
                    profile
                });
            });
        });

        return list;
    }, [records, uniqueVessels]);

    // Filtrado de viajes granulares
    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const matchesSearch = searchQuery === '' || 
                r.vessel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                String(r.voyage).includes(searchQuery);
            
            const matchesVessel = selectedVesselFilter === 'ALL' || r.vessel === selectedVesselFilter;
            const matchesClient = selectedClientFilter === 'ALL' || r.client === selectedClientFilter;
            const matchesYear = selectedYearFilter === 'ALL' || String(r.year) === selectedYearFilter;

            return matchesSearch && matchesVessel && matchesClient && matchesYear;
        });
    }, [records, searchQuery, selectedVesselFilter, selectedClientFilter, selectedYearFilter]);

    // Manejador de Descarga Excel
    const handleDownloadExcel = () => {
        PortDemurrageRatesService.exportToExcel(records);
    };

    // Manejador de Carga Excel
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadFeedback(null);

        const result = await PortDemurrageRatesService.importFromExcel(file);
        setIsUploading(false);

        if (result.success) {
            setUploadFeedback({
                type: 'success',
                message: `¡Éxito! Se han importado y sincronizado ${result.count} recaladas históricas.`
            });
            loadData();
        } else {
            setUploadFeedback({
                type: 'error',
                message: result.error || 'Error al procesar el archivo Excel.'
            });
        }

        e.target.value = '';
    };

    // Manejador de Restauración
    const handleReset = () => {
        if (confirm('¿Desea restaurar las demoras a la base histórica oficial de 161 viajes?')) {
            PortDemurrageRatesService.resetToDefault();
            setUploadFeedback({
                type: 'success',
                message: 'Base de datos restaurada a la versión oficial.'
            });
            loadData();
        }
    };

    // Manejador de Eliminación de Viaje
    const handleDeleteRow = (id: string) => {
        if (confirm('¿Eliminar este registro de viaje?')) {
            PortDemurrageRatesService.deleteRecord(id);
            loadData();
        }
    };

    // Manejador de Guardado de Nuevo Viaje Manual
    const handleSaveNewVoyage = () => {
        if (!newVessel.trim()) {
            alert('Ingrese el nombre de la nave');
            return;
        }

        const portMap: Record<string, { hours: number; days: number }> = {};
        let sumHrs = 0;
        let sumDays = 0;

        Object.entries(newPortsData).forEach(([pKey, val]) => {
            const h = parseFloat(val.hours);
            const d = parseFloat(val.days);
            if (!isNaN(h) || !isNaN(d)) {
                const finalH = !isNaN(h) ? h : (!isNaN(d) ? d * 24 : 0);
                const finalD = !isNaN(d) ? d : (!isNaN(h) ? h / 24 : 0);
                portMap[pKey] = {
                    hours: Number(finalH.toFixed(2)),
                    days: Number(finalD.toFixed(4))
                };
                sumHrs += finalH;
                sumDays += finalD;
            }
        });

        const newRec: DemurrageRecord = {
            id: `${newVessel}_${newVoyage}_${newYear}_${Date.now()}`,
            client: newClient.trim() || 'PETRAL',
            year: Number(newYear) || 2026,
            month: Number(newMonth) || 1,
            date: `${newYear}-${String(newMonth).padStart(2, '0')}-01`,
            vessel: newVessel.trim(),
            voyage: Number(newVoyage) || 0,
            ports: portMap,
            total_hours: Number(sumHrs.toFixed(2)),
            total_days: Number(sumDays.toFixed(4))
        };

        PortDemurrageRatesService.upsertRecord(newRec);
        setShowNewModal(false);
        setUploadFeedback({
            type: 'success',
            message: `Viaje ${newVoyage} de ${newVessel} registrado exitosamente.`
        });
        loadData();
    };

    return (
        <MasterTemplate
            title="Maestro de Demoras"
            subtitle="Estadías históricas por buque y puerto, importador/exportador Excel y promedios a 0ms"
            activeTab="demurrage"
            onExportExcel={handleDownloadExcel}
        >
            <div className="flex flex-col gap-4 p-4 lg:p-6 max-w-full overflow-y-auto h-[calc(100vh-70px)] bg-slate-50/60 font-sans">
                
                {/* 1. CARDS DE KPIS Y RESUMEN EJECUTIVO */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Recaladas Registradas</span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.totalVoyages} <span className="text-xs text-slate-400 font-semibold">viajes</span></span>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                            <Ship size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Demora Promedio Flota</span>
                            <span className="text-2xl font-black text-emerald-600 tracking-tight">{stats.globalAvgDays} <span className="text-xs text-emerald-700 font-semibold">días</span></span>
                            <span className="text-[10px] text-slate-400 font-bold ml-1.5">({stats.globalAvgHours} h)</span>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                            <Clock size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Puerto de Mayor Fondeo</span>
                            <span className="text-lg font-black text-amber-600 tracking-tight">{stats.criticalPort}</span>
                            <span className="text-[10px] text-amber-800 font-bold block">Promedio: {stats.criticalPortAvg} d</span>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                            <Anchor size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Buques Monitoreados</span>
                            <span className="text-2xl font-black text-indigo-600 tracking-tight">{stats.totalVessels} <span className="text-xs text-indigo-400 font-semibold">naves</span></span>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                            <Layers size={20} />
                        </div>
                    </div>
                </div>

                {/* 2. FEEDBACK NOTIFICATIONS */}
                {uploadFeedback && (
                    <div className={`p-3 rounded-lg border flex items-center justify-between text-xs font-bold ${
                        uploadFeedback.type === 'success' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                        <div className="flex items-center gap-2">
                            {uploadFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            <span>{uploadFeedback.message}</span>
                        </div>
                        <button onClick={() => setUploadFeedback(null)} className="text-xs hover:underline cursor-pointer">Cerrar</button>
                    </div>
                )}

                {/* 3. BARRA DE HERRAMIENTAS Y PESTAÑAS */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                    
                    {/* Switch de Pestañas */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setActiveTab('chart')}
                            className={`px-3 py-1.5 rounded-md text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === 'chart' 
                                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <BarChart3 size={14} />
                            <span>Análisis Gráfico</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('matrix')}
                            className={`px-3 py-1.5 rounded-md text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === 'matrix' 
                                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <TrendingUp size={14} />
                            <span>Matriz de Promedios</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('voyages')}
                            className={`px-3 py-1.5 rounded-md text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === 'voyages' 
                                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Calendar size={14} />
                            <span>Bitácora de Viajes ({records.length})</span>
                        </button>
                    </div>

                    {/* Acciones de Archivo y Operaciones */}
                    <div className="flex items-center gap-2">
                        {/* Botón Descargar Excel */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadExcel}
                            className="h-8.5 text-xs font-bold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 border-emerald-200 flex items-center gap-1.5 cursor-pointer"
                        >
                            <FileSpreadsheet size={14} className="text-emerald-600" />
                            <span>Bajar Datos / Plantilla Excel</span>
                        </Button>

                        {/* Botón Cargar Excel (Hidden Input) */}
                        <label className="h-8.5 px-3 rounded-md border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors">
                            <Upload size={14} className="text-sky-600" />
                            <span>{isUploading ? 'Cargando...' : 'Cargar Excel'}</span>
                            <input 
                                type="file" 
                                accept=".xlsx, .xls" 
                                className="hidden" 
                                onChange={handleFileUpload} 
                                disabled={isUploading}
                            />
                        </label>

                        {/* Botón Nuevo Viaje */}
                        <Button
                            size="sm"
                            onClick={() => setShowNewModal(true)}
                            className="h-8.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <Plus size={14} />
                            <span>+ Nuevo Viaje</span>
                        </Button>

                        {/* Botón Reset */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            title="Restaurar a los 161 viajes oficiales de Petral"
                            className="h-8.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-1 cursor-pointer"
                        >
                            <RefreshCw size={13} />
                            <span className="hidden xl:inline">Restaurar Oficial</span>
                        </Button>
                    </div>
                </div>

                {/* 4. CONTENIDO SEGÚN PESTAÑA */}
                {activeTab === 'chart' ? (
                    /* TAB 1: ANÁLISIS GRÁFICO INTERACTIVO (ECHARTS) */
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col gap-3">
                        {/* Controles del Gráfico */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200">
                            
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <SlidersHorizontal size={14} className="text-slate-500" />
                                    <span className="text-[11px] font-black text-slate-600 uppercase">Agrupar por:</span>
                                </div>
                                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                                    <button 
                                        onClick={() => setGroupBy('vessel')} 
                                        className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${groupBy === 'vessel' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Buque
                                    </button>
                                    <button 
                                        onClick={() => setGroupBy('port')} 
                                        className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${groupBy === 'port' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Puerto
                                    </button>
                                    <button 
                                        onClick={() => setGroupBy('client')} 
                                        className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${groupBy === 'client' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Cliente
                                    </button>
                                </div>

                                <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-black text-slate-600 uppercase">Métrica:</span>
                                    <select
                                        value={chartMetric}
                                        onChange={(e) => setChartMetric(e.target.value as ChartMetric)}
                                        className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none"
                                    >
                                        <option value="total_days">Días de Demora Totales</option>
                                        <option value="total_hours">Horas de Demora Totales</option>
                                        <option value="avg_days">Demora Promedio por Viaje (Días)</option>
                                        <option value="voyages_count">Conteo de Recaladas</option>
                                    </select>
                                </div>

                                <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-black text-slate-600 uppercase">Tipo:</span>
                                    <select
                                        value={chartType}
                                        onChange={(e) => setChartType(e.target.value as ChartType)}
                                        className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none"
                                    >
                                        <option value="bar_stack">Barras Apiladas</option>
                                        <option value="bar">Barras Agrupadas</option>
                                        <option value="line">Líneas de Tendencia</option>
                                        <option value="area">Área Suave</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedYearChart}
                                    onChange={(e) => setSelectedYearChart(e.target.value)}
                                    className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none"
                                >
                                    <option value="ALL">Todos los Años (Consolidado)</option>
                                    {uniqueYears.map(y => <option key={y} value={String(y)}>Año {y}</option>)}
                                </select>

                                {groupBy === 'vessel' && (
                                    <select
                                        value={selectedPortFilterChart}
                                        onChange={(e) => setSelectedPortFilterChart(e.target.value)}
                                        className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none"
                                    >
                                        <option value="ALL">Todos los Puertos</option>
                                        {PortDemurrageRatesService.STANDARD_PORTS.map(p => (
                                            <option key={p.id} value={p.id}>{p.label}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                        </div>

                        {/* Contenedor del Gráfico ECharts */}
                        <div className="w-full h-[460px] relative">
                            <ReactECharts 
                                option={chartOption} 
                                style={{ height: '100%', width: '100%' }}
                                notMerge={true}
                                lazyUpdate={true}
                            />
                        </div>
                    </div>
                ) : activeTab === 'matrix' ? (
                    /* TAB 2: MATRIZ DE PROMEDIOS CONSOLIDADOS */
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <span>📊</span> Perfiles de Estadía Promedio (Días de Demora por Par Buque - Puerto)
                                </h3>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    Cálculo dinámico en tiempo real (0ms). Los valores en gris alimentan automáticamente las sugerencias en el Multicotizador (Modo P / Modo M).
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                        <th className="py-2.5 px-3">Buque</th>
                                        <th className="py-2.5 px-3">Puerto</th>
                                        <th className="py-2.5 px-2 text-center bg-blue-50/70 border-x border-blue-100 text-blue-900 font-black">Promedio Anual (P)</th>
                                        <th className="py-2.5 px-2 text-center">ENE</th>
                                        <th className="py-2.5 px-2 text-center">FEB</th>
                                        <th className="py-2.5 px-2 text-center">MAR</th>
                                        <th className="py-2.5 px-2 text-center">ABR</th>
                                        <th className="py-2.5 px-2 text-center">MAY</th>
                                        <th className="py-2.5 px-2 text-center">JUN</th>
                                        <th className="py-2.5 px-2 text-center">JUL</th>
                                        <th className="py-2.5 px-2 text-center">AGO</th>
                                        <th className="py-2.5 px-2 text-center">SEP</th>
                                        <th className="py-2.5 px-2 text-center">OCT</th>
                                        <th className="py-2.5 px-2 text-center">NOV</th>
                                        <th className="py-2.5 px-2 text-center">DIC</th>
                                        <th className="py-2.5 px-3 text-center text-slate-400">Viajes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {matrixProfiles.map((item, idx) => {
                                        const p = item.profile;
                                        const hasData = p.voyage_count > 0;
                                        return (
                                            <tr key={`${item.vessel}-${item.port.id}-${idx}`} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                                                    <span className="text-xs">🚢</span> {item.vessel}
                                                </td>
                                                <td className="py-2 px-3 font-bold text-slate-700">
                                                    {item.port.label}
                                                </td>
                                                <td className="py-2 px-2 text-center bg-blue-50/40 border-x border-blue-100 font-black font-mono text-blue-900">
                                                    {hasData ? `${p.annual_average.toFixed(2)} d` : '—'}
                                                </td>
                                                {PortDemurrageRatesService.MONTH_KEYS.map(mKey => {
                                                    const val = p.months[mKey as keyof typeof p.months];
                                                    return (
                                                        <td key={mKey} className="py-2 px-2 text-center font-mono text-slate-700">
                                                            {hasData ? val.toFixed(2) : '—'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="py-2 px-3 text-center font-bold text-slate-400">
                                                    {p.voyage_count}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* TAB 3: BITÁCORA GRANULAR DE VIAJES */
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                        
                        {/* Filtros de la Tabla */}
                        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1 max-w-sm">
                                <div className="relative w-full">
                                    <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por buque, cliente o viaje..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <Filter size={13} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Filtros:</span>
                                </div>

                                <select
                                    value={selectedVesselFilter}
                                    onChange={(e) => setSelectedVesselFilter(e.target.value)}
                                    className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none"
                                >
                                    <option value="ALL">Todos los Buques</option>
                                    {uniqueVessels.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>

                                <select
                                    value={selectedClientFilter}
                                    onChange={(e) => setSelectedClientFilter(e.target.value)}
                                    className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none"
                                >
                                    <option value="ALL">Todos los Clientes</option>
                                    {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>

                                <select
                                    value={selectedYearFilter}
                                    onChange={(e) => setSelectedYearFilter(e.target.value)}
                                    className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none"
                                >
                                    <option value="ALL">Todos los Años</option>
                                    {uniqueYears.map(y => <option key={y} value={String(y)}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Tabla de Registros */}
                        <div className="overflow-x-auto max-h-[520px]">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="sticky top-0 bg-slate-100 z-10">
                                    <tr className="border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                        <th className="py-2.5 px-3">Cliente</th>
                                        <th className="py-2.5 px-2 text-center">Año</th>
                                        <th className="py-2.5 px-2">Fecha / Mes</th>
                                        <th className="py-2.5 px-3">Buque</th>
                                        <th className="py-2.5 px-2 text-center">Viaje</th>
                                        <th className="py-2.5 px-2 text-right">Puerto ILO (d)</th>
                                        <th className="py-2.5 px-2 text-right">Callao (d)</th>
                                        <th className="py-2.5 px-2 text-right">Marcona (d)</th>
                                        <th className="py-2.5 px-2 text-right">Matarani (d)</th>
                                        <th className="py-2.5 px-2 text-right">Mejillones (d)</th>
                                        <th className="py-2.5 px-3 text-right bg-sky-50 font-black text-sky-900 border-x border-sky-100">Total Días</th>
                                        <th className="py-2.5 px-2 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredRecords.map((r) => {
                                        return (
                                            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-2 px-3 font-bold text-slate-800">
                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-black border border-slate-200">
                                                        {r.client}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-2 text-center font-mono text-slate-600">{r.year}</td>
                                                <td className="py-2 px-2 font-mono text-slate-600">{r.date}</td>
                                                <td className="py-2 px-3 font-bold text-slate-900">{r.vessel}</td>
                                                <td className="py-2 px-2 text-center font-bold text-blue-600 font-mono">#{r.voyage}</td>
                                                <td className="py-2 px-2 text-right font-mono text-slate-700">{r.ports?.ILO ? `${r.ports.ILO.days.toFixed(2)}` : '—'}</td>
                                                <td className="py-2 px-2 text-right font-mono text-slate-700">{r.ports?.CALLAO ? `${r.ports.CALLAO.days.toFixed(2)}` : '—'}</td>
                                                <td className="py-2 px-2 text-right font-mono text-slate-700">{r.ports?.MARCONA ? `${r.ports.MARCONA.days.toFixed(2)}` : '—'}</td>
                                                <td className="py-2 px-2 text-right font-mono text-slate-700">{r.ports?.MATARANI ? `${r.ports.MATARANI.days.toFixed(2)}` : '—'}</td>
                                                <td className="py-2 px-2 text-right font-mono text-slate-700">{r.ports?.MEJILLONES ? `${r.ports.MEJILLONES.days.toFixed(2)}` : '—'}</td>
                                                <td className="py-2 px-3 text-right font-mono font-black text-sky-900 bg-sky-50/40 border-x border-sky-100">
                                                    {r.total_days.toFixed(2)} d
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    <button
                                                        onClick={() => handleDeleteRow(r.id)}
                                                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                                                        title="Eliminar viaje"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredRecords.length === 0 && (
                                        <tr>
                                            <td colSpan={12} className="py-8 text-center text-slate-400 font-medium">
                                                No se encontraron recaladas con los filtros seleccionados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 5. MODAL NUEVO VIAJE MANUAL */}
                {showNewModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                    <Plus size={16} className="text-blue-600" />
                                    Registrar Nuevo Viaje / Estadía
                                </h3>
                                <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="flex flex-col gap-1">
                                    <label className="font-bold text-slate-600">Cliente</label>
                                    <input 
                                        type="text" 
                                        value={newClient} 
                                        onChange={(e) => setNewClient(e.target.value)} 
                                        className="p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                                        placeholder="SPCC / NEXA / PETRAL"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="font-bold text-slate-600">Buque</label>
                                    <input 
                                        type="text" 
                                        value={newVessel} 
                                        onChange={(e) => setNewVessel(e.target.value)} 
                                        className="p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                                        placeholder="Moquegua / Tablones..."
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="font-bold text-slate-600">Año</label>
                                    <input 
                                        type="number" 
                                        value={newYear} 
                                        onChange={(e) => setNewYear(Number(e.target.value))} 
                                        className="p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="font-bold text-slate-600">Mes (1-12) / N° Viaje</label>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <input 
                                            type="number" 
                                            min={1} 
                                            max={12} 
                                            value={newMonth} 
                                            onChange={(e) => setNewMonth(Number(e.target.value))} 
                                            className="p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                                            placeholder="Mes"
                                        />
                                        <input 
                                            type="number" 
                                            value={newVoyage} 
                                            onChange={(e) => setNewVoyage(Number(e.target.value))} 
                                            className="p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                                            placeholder="# Viaje"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Demoras en puertos */}
                            <div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Demoras por Puerto (Horas / Días)</span>
                                <div className="grid grid-cols-5 gap-2 mt-1">
                                    {PortDemurrageRatesService.STANDARD_PORTS.map(p => (
                                        <div key={p.id} className="flex flex-col gap-0.5">
                                            <label className="text-[9px] font-black text-slate-500 text-center uppercase">{p.id}</label>
                                            <input
                                                type="number"
                                                step="any"
                                                placeholder="Días"
                                                value={newPortsData[p.id]?.days || ''}
                                                onChange={(e) => {
                                                    const d = e.target.value;
                                                    const h = d ? (parseFloat(d) * 24).toFixed(2) : '';
                                                    setNewPortsData(prev => ({
                                                        ...prev,
                                                        [p.id]: { days: d, hours: h }
                                                    }));
                                                }}
                                                className="w-full text-xs font-mono text-center p-1 bg-white border border-slate-200 rounded focus:border-blue-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <Button variant="outline" size="sm" onClick={() => setShowNewModal(false)}>Cancelar</Button>
                                <Button size="sm" onClick={handleSaveNewVoyage} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                                    Guardar Viaje
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </MasterTemplate>
    );
};
