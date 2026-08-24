import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
    Filter, 
    BarChart3, 
    SlidersHorizontal, 
    Ship, 
    Anchor, 
    Calendar, 
    Building2,
    TrendingUp
} from 'lucide-react';
import type { DemurrageRecord } from '../../services/providers/portDemurrageRatesService';
import { PortDemurrageRatesService } from '../../services/providers/portDemurrageRatesService';

interface DemurrageInteractiveChartProps {
    records: DemurrageRecord[];
    vesselsMap?: Record<string, { color_hex?: string; vessel_name?: string }>;
}

type PlotMetricPri = 'total_days' | 'total_hours' | 'voyages_count';
type PlotMetricSec = 'avg_days' | 'global_avg_days' | 'none';
type GraphType = 'bar_stack' | 'bar' | 'line' | 'area';

const MONTH_LABELS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export const DemurrageInteractiveChart: React.FC<DemurrageInteractiveChartProps> = ({ 
    records, 
    vesselsMap = {} 
}) => {
    // Filtros
    const [filterVessel, setFilterVessel] = useState<string>('ALL');
    const [filterPort, setFilterPort] = useState<string>('ALL');
    const [filterYear, setFilterYear] = useState<string>('ALL');
    const [filterClient, setFilterClient] = useState<string>('ALL');

    // Eje Primario
    const [primaryMetric, setPrimaryMetric] = useState<PlotMetricPri>('total_days');
    const [primaryGraphType, setPrimaryGraphType] = useState<GraphType>('bar_stack');

    // Eje Secundario
    const [secondaryMetric, setSecondaryMetric] = useState<PlotMetricSec>('avg_days');
    const [secondaryGraphType, setSecondaryGraphType] = useState<GraphType>('line');

    // Opciones únicas para filtros
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

    // Paleta de colores obtenida de la tabla vessels con fallbacks seguros
    const getVesselColor = (vesselName: string): string => {
        const upper = (vesselName || '').toUpperCase().trim();
        
        // 1. Buscar en vesselsMap cargado desde la tabla vessels
        for (const [vKey, vData] of Object.entries(vesselsMap)) {
            if (vKey.toUpperCase() === upper || (vData.vessel_name && vData.vessel_name.toUpperCase() === upper)) {
                if (vData.color_hex) return vData.color_hex;
            }
        }

        // 2. Colores estándar de la flota Petral
        if (upper.includes('MOQUEGUA') || upper.includes('BOMAR')) return '#16A34A'; // Verde Moquegua
        if (upper.includes('TABLONES')) return '#DC2626';                            // Rojo Tablones
        if (upper.includes('HUEMUL')) return '#4F46E5';                              // Índigo Huemul
        if (upper.includes('CONCON')) return '#475569';                              // Slate Concon Trader

        return '#0089CF'; // Petral Blue
    };

    // Construcción de Opciones ECharts
    const chartOptions = useMemo(() => {
        // Filtrar registros
        const filtered = records.filter(r => {
            if (filterVessel !== 'ALL' && r.vessel !== filterVessel) return false;
            if (filterYear !== 'ALL' && String(r.year) !== filterYear) return false;
            if (filterClient !== 'ALL' && r.client !== filterClient) return false;
            return true;
        });

        // Barcos a graficar en el Eje Primario
        const vesselsToDisplay = filterVessel !== 'ALL' 
            ? [filterVessel] 
            : (uniqueVessels.length > 0 ? uniqueVessels : ['Moquegua', 'Tablones', 'Huemul', 'Concon Trader']);

        // Data map por buque y por mes (12 meses)
        const seriesMapPri: Record<string, { days: number[]; hours: number[]; count: number[] }> = {};
        vesselsToDisplay.forEach(v => {
            seriesMapPri[v] = {
                days: Array(12).fill(0),
                hours: Array(12).fill(0),
                count: Array(12).fill(0)
            };
        });

        // Totales globales mensuales para el Eje Secundario (Promedio)
        const monthTotals = Array(12).fill(0).map(() => ({ totalDays: 0, totalHours: 0, totalVoyages: 0 }));

        filtered.forEach(r => {
            const mIdx = (r.month >= 1 && r.month <= 12) ? r.month - 1 : 0;
            const v = r.vessel;

            let voyageDays = 0;
            let voyageHours = 0;

            if (filterPort === 'ALL') {
                voyageDays = Number(r.total_days) || 0;
                voyageHours = Number(r.total_hours) || 0;
            } else if (r.ports && r.ports[filterPort]) {
                voyageDays = Number(r.ports[filterPort].days) || 0;
                voyageHours = Number(r.ports[filterPort].hours) || 0;
            }

            if (seriesMapPri[v]) {
                seriesMapPri[v].days[mIdx] += voyageDays;
                seriesMapPri[v].hours[mIdx] += voyageHours;
                if (voyageDays > 0 || voyageHours > 0) {
                    seriesMapPri[v].count[mIdx] += 1;
                }
            }

            monthTotals[mIdx].totalDays += voyageDays;
            monthTotals[mIdx].totalHours += voyageHours;
            if (voyageDays > 0 || voyageHours > 0) {
                monthTotals[mIdx].totalVoyages += 1;
            }
        });

        // Series del Eje Primario (Barras / Líneas por Buque)
        const seriesPri = vesselsToDisplay.map(v => {
            const vData = seriesMapPri[v] || { days: Array(12).fill(0), hours: Array(12).fill(0), count: Array(12).fill(0) };
            
            const dataValues = MONTH_LABELS.map((_, i) => {
                if (primaryMetric === 'total_days') return Number(vData.days[i].toFixed(2));
                if (primaryMetric === 'total_hours') return Number(vData.hours[i].toFixed(1));
                return vData.count[i];
            });

            const color = getVesselColor(v);
            const isStack = primaryGraphType === 'bar_stack';
            const isBar = primaryGraphType.startsWith('bar');
            const isArea = primaryGraphType === 'area';

            return {
                name: v,
                type: isBar ? 'bar' : 'line',
                stack: isStack ? 'vessels_total' : undefined,
                yAxisIndex: 0,
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

        // Series del Eje Secundario (Línea de Promedio)
        const seriesSec: any[] = [];
        if (secondaryMetric !== 'none') {
            const secData = MONTH_LABELS.map((_, i) => {
                const m = monthTotals[i];
                if (secondaryMetric === 'avg_days') {
                    return m.totalVoyages > 0 ? Number((m.totalDays / m.totalVoyages).toFixed(2)) : 0;
                }
                if (secondaryMetric === 'global_avg_days') {
                    // Media acumulada
                    return Number(m.totalDays.toFixed(2));
                }
                return 0;
            });

            const isBarSec = secondaryGraphType.startsWith('bar');
            const isAreaSec = secondaryGraphType === 'area';

            seriesSec.push({
                name: 'Promedio de Demora (Sec)',
                type: isBarSec ? 'bar' : 'line',
                yAxisIndex: 1,
                smooth: true,
                symbol: 'circle',
                symbolSize: 7,
                areaStyle: isAreaSec ? { opacity: 0.15, color: '#F59E0B' } : undefined,
                lineStyle: { width: 3, type: 'dashed', color: '#F59E0B' },
                itemStyle: { color: '#F59E0B' },
                data: secData
            });
        }

        const getPrimaryMetricLabel = () => {
            if (primaryMetric === 'total_days') return 'Días de Demora (Totales)';
            if (primaryMetric === 'total_hours') return 'Horas de Demora (Totales)';
            return 'Cantidad de Viajes';
        };

        const getSecondaryMetricLabel = () => {
            if (secondaryMetric === 'avg_days') return 'Promedio Días / Viaje';
            if (secondaryMetric === 'global_avg_days') return 'Días Totales Mes';
            return '';
        };

        return {
            backgroundColor: '#ffffff',
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: '#334155',
                borderWidth: 1,
                textStyle: { color: '#F8FAFC', fontSize: 11 },
                formatter: (params: any) => {
                    if (!params || !Array.isArray(params) || params.length === 0) return '';
                    let out = `<div style="font-weight:bold;margin-bottom:5px;border-bottom:1px solid #475569;padding-bottom:2px">${params[0]?.axisValue || ''}</div>`;
                    params.forEach((p: any) => {
                        const isSec = p?.seriesName?.includes('(Sec)');
                        const val = typeof p?.value === 'number' ? p.value : (parseFloat(p?.value) || 0);
                        const unit = isSec 
                            ? ' d/viaje' 
                            : (primaryMetric === 'total_days' ? ' d' : (primaryMetric === 'total_hours' ? ' h' : ' viajes'));
                        const cleanName = (p?.seriesName || '').replace(' (Sec)', '');
                        out += `<div style="display:flex;justify-content:space-between;gap:12px;margin:2px 0">
                            <span>${p?.marker || '•'} <b>${cleanName}</b></span>
                            <span style="font-family:monospace;font-weight:bold">${val}${unit}</span>
                        </div>`;
                    });
                    return out;
                }
            },
            legend: {
                top: 5,
                left: 10,
                right: 10,
                type: 'scroll',
                icon: 'circle',
                textStyle: { color: '#334155', fontWeight: 'bold', fontSize: 11 }
            },
            grid: {
                left: 55,
                right: secondaryMetric !== 'none' ? 55 : 20,
                bottom: 25,
                top: 45,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: MONTH_LABELS,
                axisLine: { lineStyle: { color: '#CBD5E1' } },
                axisLabel: { color: '#475569', fontWeight: 'bold', fontSize: 11 }
            },
            yAxis: [
                {
                    type: 'value',
                    name: getPrimaryMetricLabel(),
                    nameTextStyle: { color: '#0EA5E9', fontSize: 10.5, fontWeight: 'bold', align: 'left' },
                    axisLine: { show: false },
                    axisLabel: { 
                        color: '#64748B', 
                        fontWeight: 'bold',
                        formatter: (val: number) => primaryMetric === 'total_days' ? `${val} d` : (primaryMetric === 'total_hours' ? `${val} h` : `${val}`)
                    },
                    splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } }
                },
                {
                    type: 'value',
                    name: getSecondaryMetricLabel(),
                    nameTextStyle: { color: '#D97706', fontSize: 10.5, fontWeight: 'bold', align: 'right' },
                    show: secondaryMetric !== 'none',
                    axisLine: { show: false },
                    axisLabel: { 
                        color: '#D97706', 
                        fontWeight: 'bold',
                        formatter: (val: number) => `${val} d`
                    },
                    splitLine: { show: false }
                }
            ],
            series: [...seriesPri, ...seriesSec]
        };
    }, [records, filterVessel, filterPort, filterYear, filterClient, primaryMetric, primaryGraphType, secondaryMetric, secondaryGraphType, uniqueVessels, vesselsMap]);

    const echartsRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-resize con ResizeObserver
    useEffect(() => {
        const handleResize = () => {
            if (echartsRef.current) {
                try {
                    const instance = echartsRef.current.getEchartsInstance();
                    if (instance && typeof instance.resize === 'function' && !instance.isDisposed()) {
                        instance.resize();
                    }
                } catch {}
            }
        };

        let observer: ResizeObserver | null = null;
        if (containerRef.current && typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(() => handleResize());
            observer.observe(containerRef.current);
        }

        const timer = setTimeout(handleResize, 100);
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
            if (observer) observer.disconnect();
        };
    }, []);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col gap-3.5 w-full">
            
            {/* RIBBON SUPERIOR: FILTROS + EJE PRIMARIO + EJE SECUNDARIO */}
            <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                
                {/* 1. SECCIÓN DE FILTROS (BARCO, PUERTO, AÑO, CLIENTE) */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-1.5 text-slate-700">
                        <Filter size={14} className="text-blue-600" />
                        <span className="text-[11px] font-black uppercase tracking-tight">Filtros:</span>
                    </div>

                    {/* Filtro Barco */}
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <Ship size={12} className="text-emerald-600" />
                        <select
                            value={filterVessel}
                            onChange={(e) => setFilterVessel(e.target.value)}
                            className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                        >
                            <option value="ALL">Todos los Buques</option>
                            {uniqueVessels.map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Puerto */}
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <Anchor size={12} className="text-blue-600" />
                        <select
                            value={filterPort}
                            onChange={(e) => setFilterPort(e.target.value)}
                            className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                        >
                            <option value="ALL">Todos los Puertos</option>
                            {PortDemurrageRatesService.STANDARD_PORTS.map(p => (
                                <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Año */}
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <Calendar size={12} className="text-purple-600" />
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                        >
                            <option value="ALL">Todos los Años (Consolidado)</option>
                            {uniqueYears.map(y => (
                                <option key={y} value={String(y)}>Año {y}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Cliente */}
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <Building2 size={12} className="text-amber-600" />
                        <select
                            value={filterClient}
                            onChange={(e) => setFilterClient(e.target.value)}
                            className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                        >
                            <option value="ALL">Todos los Clientes</option>
                            {uniqueClients.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. SECCIÓN DE EJES (PRIMARIO Y SECUNDARIO) */}
                <div className="flex items-center gap-3 flex-wrap">
                    
                    {/* Control Eje Primario (Y1) */}
                    <div className="flex items-center gap-1.5 bg-blue-50/70 p-1 rounded-lg border border-blue-200/80">
                        <span className="text-[10px] font-black text-blue-900 uppercase px-1">Eje Primario (Y1):</span>
                        <select
                            value={primaryMetric}
                            onChange={(e) => setPrimaryMetric(e.target.value as PlotMetricPri)}
                            className="text-xs bg-white border border-blue-200 rounded px-1.5 py-0.5 font-bold text-blue-950 focus:outline-none cursor-pointer"
                        >
                            <option value="total_days">Días de Demora</option>
                            <option value="total_hours">Horas de Demora</option>
                            <option value="voyages_count">Conteo de Viajes</option>
                        </select>
                        <select
                            value={primaryGraphType}
                            onChange={(e) => setPrimaryGraphType(e.target.value as GraphType)}
                            className="text-xs bg-white border border-blue-200 rounded px-1.5 py-0.5 font-bold text-blue-950 focus:outline-none cursor-pointer"
                        >
                            <option value="bar_stack">Barras Apiladas</option>
                            <option value="bar">Barras Agrupadas</option>
                            <option value="line">Líneas</option>
                            <option value="area">Área</option>
                        </select>
                    </div>

                    {/* Control Eje Secundario (Y2) */}
                    <div className="flex items-center gap-1.5 bg-amber-50/70 p-1 rounded-lg border border-amber-200/80">
                        <span className="text-[10px] font-black text-amber-900 uppercase px-1">Eje Secundario (Y2):</span>
                        <select
                            value={secondaryMetric}
                            onChange={(e) => setSecondaryMetric(e.target.value as PlotMetricSec)}
                            className="text-xs bg-white border border-amber-200 rounded px-1.5 py-0.5 font-bold text-amber-950 focus:outline-none cursor-pointer"
                        >
                            <option value="avg_days">Promedio (Días / Viaje)</option>
                            <option value="global_avg_days">Total Días Mensual</option>
                            <option value="none">Ninguno (Desactivado)</option>
                        </select>
                        {secondaryMetric !== 'none' && (
                            <select
                                value={secondaryGraphType}
                                onChange={(e) => setSecondaryGraphType(e.target.value as GraphType)}
                                className="text-xs bg-white border border-amber-200 rounded px-1.5 py-0.5 font-bold text-amber-950 focus:outline-none cursor-pointer"
                            >
                                <option value="line">Línea</option>
                                <option value="bar">Barras</option>
                                <option value="area">Área</option>
                            </select>
                        )}
                    </div>

                </div>

            </div>

            {/* CONTENEDOR GRÁFICO ECHARTS */}
            <div ref={containerRef} className="w-full h-[470px] relative">
                <ReactECharts
                    ref={echartsRef}
                    option={chartOptions}
                    style={{ height: '100%', width: '100%' }}
                    notMerge={true}
                    lazyUpdate={true}
                />
            </div>

        </div>
    );
};
