import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { DemurrageRecord } from '../../services/providers/portDemurrageRatesService';
import { PortDemurrageRatesService } from '../../services/providers/portDemurrageRatesService';

interface DemurrageInteractiveChartProps {
    records: DemurrageRecord[];
    vesselsMap?: Record<string, { color_hex?: string; vessel_name?: string }>;
}

type GroupBy = 'vessel' | 'port' | 'client' | 'petral';
type PlotMetricPri = 'total_days' | 'total_hours' | 'voyages_count';
type PlotMetricSec = 'none' | 'avg_days' | 'global_total_days';
type GraphType = 'bar_stack' | 'bar_group' | 'line' | 'line_straight';

const MONTH_LABELS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export const DemurrageInteractiveChart: React.FC<DemurrageInteractiveChartProps> = ({ 
    records = [], 
    vesselsMap = {} 
}) => {
    const [groupBy, setGroupBy] = useState<GroupBy>('vessel');
    const [filterClient, setFilterClient] = useState<string>('ALL');
    const [filterPort, setFilterPort] = useState<string>('ALL');
    const [filterVessel, setFilterVessel] = useState<string>('ALL');
    const [filterYear, setFilterYear] = useState<string>('ALL');

    const [isClientFilterOpen, setIsClientFilterOpen] = useState(false);
    const [isPortFilterOpen, setIsPortFilterOpen] = useState(false);
    const [isVesselFilterOpen, setIsVesselFilterOpen] = useState(false);
    const [isYearFilterOpen, setIsYearFilterOpen] = useState(false);

    // Eje Primario
    const [primaryMetric, setPrimaryMetric] = useState<PlotMetricPri>('total_days');
    const [primaryGraphType, setPrimaryGraphType] = useState<GraphType>('bar_stack');
    const [isPriOpen, setIsPriOpen] = useState(false);
    const [primaryLabelPos, setPrimaryLabelPos] = useState<'none' | 'top' | 'inside'>('none');
    const [primaryLabelColor, setPrimaryLabelColor] = useState<string>('#ffffff');

    // Eje Secundario
    const [secondaryMetric, setSecondaryMetric] = useState<PlotMetricSec>('avg_days');
    const [secondaryGraphType, setSecondaryGraphType] = useState<'line' | 'line_straight' | 'bar'>('line');
    const [isSecOpen, setIsSecOpen] = useState(false);
    const [isSecondaryCumulativeGlobal, setIsSecondaryCumulativeGlobal] = useState(false);
    const [isSecondaryPercentage, setIsSecondaryPercentage] = useState(false);
    const [secondaryLabelPos, setSecondaryLabelPos] = useState<'none' | 'top' | 'inside'>('none');
    const [secondaryLabelColor, setSecondaryLabelColor] = useState<string>('#ffffff');

    // Listas únicas
    const filterOptions = useMemo(() => {
        const clients = new Set<string>();
        const vessels = new Set<string>();
        const years = new Set<string>();

        records.forEach(r => {
            if (r.client) clients.add(r.client);
            if (r.vessel) vessels.add(r.vessel);
            if (r.year) years.add(String(r.year));
        });

        return {
            clients: Array.from(clients).sort(),
            ports: PortDemurrageRatesService.STANDARD_PORTS.map(p => p.id),
            vessels: Array.from(vessels).sort(),
            years: Array.from(years).sort().reverse()
        };
    }, [records]);

    // Paleta de colores oficial de vessels
    const getHexColor = (name: string, type: GroupBy): string => {
        if (type === 'petral') return '#0089CF'; // Petral Blue
        
        if (type === 'vessel') {
            const upper = (name || '').toUpperCase().trim();
            for (const [vKey, vData] of Object.entries(vesselsMap)) {
                if (vKey.toUpperCase() === upper || (vData.vessel_name && vData.vessel_name.toUpperCase() === upper)) {
                    if (vData.color_hex) return vData.color_hex;
                }
            }
            if (upper.includes('MOQUEGUA') || upper.includes('BOMAR')) return '#16A34A'; // Verde
            if (upper.includes('TABLONES')) return '#DC2626'; // Rojo
            if (upper.includes('HUEMUL')) return '#4F46E5';   // Índigo
            if (upper.includes('CONCON')) return '#475569';   // Slate
            return '#0EA5E9';
        }

        if (type === 'port') {
            if (name.includes('ILO')) return '#0089CF';
            if (name.includes('CALLAO')) return '#06B6D4';
            if (name.includes('MARCONA')) return '#A855F7';
            if (name.includes('MATARANI')) return '#F59E0B';
            if (name.includes('MEJILLONES')) return '#EC4899';
            return '#334155';
        }

        if (type === 'client') {
            if (name.includes('SPCC')) return '#0369A1';
            if (name.includes('NEXA')) return '#F97316';
            return '#1E3A8A';
        }

        return '#94A3B8';
    };

    const metricOptionsPri = [
        { value: 'total_days', label: 'Días de Demora', icon: '⏳', desc: 'Días / Total de estadía' },
        { value: 'total_hours', label: 'Horas de Demora', icon: '⏱️', desc: 'Horas / Tiempo total fondeo' },
        { value: 'voyages_count', label: 'Cantidad de Viajes', icon: '📅', desc: 'Recaladas con estadía' }
    ];

    const metricOptionsSec = [
        { value: 'none', label: 'Ninguno', icon: '🚫', desc: 'No graficar' },
        { value: 'avg_days', label: 'Promedio Días/Viaje', icon: '⚖️', desc: 'Días promedio por recalada' },
        { value: 'global_total_days', label: 'Días de Demora (Mes)', icon: '⏳', desc: 'Suma de días de demora en el mes' }
    ];

    const options = useMemo(() => {
        if (!records || records.length === 0) return null;

        // Filtrado de registros
        const filtered = records.filter(r => {
            if (filterClient !== 'ALL' && r.client !== filterClient) return false;
            if (filterVessel !== 'ALL' && r.vessel !== filterVessel) return false;
            if (filterYear !== 'ALL' && String(r.year) !== filterYear) return false;
            return true;
        });

        // Lógica de Desglose y Coloreo Cruzado Dinámico
        // 1. Si se elige un Buque puntual: la barra se desglosa por PUERTOS y se colorea por Puerto.
        // 2. Si se elige un Puerto puntual: la barra se desglosa por BUQUES y se colorea por Buque.
        // 3. En vista general: se desglosa por BUQUES con sus colores oficiales.
        let stackMode: 'by_vessel' | 'by_port' | 'by_client' = 'by_vessel';
        let entities: string[] = [];

        if (filterVessel !== 'ALL' && filterPort === 'ALL') {
            stackMode = 'by_port';
            entities = filterOptions.ports;
        } else if (filterPort !== 'ALL' && filterVessel === 'ALL') {
            stackMode = 'by_vessel';
            entities = filterOptions.vessels;
        } else if (groupBy === 'port') {
            stackMode = 'by_port';
            entities = filterPort !== 'ALL' ? [filterPort] : filterOptions.ports;
        } else if (groupBy === 'client') {
            stackMode = 'by_client';
            entities = filterClient !== 'ALL' ? [filterClient] : filterOptions.clients;
        } else {
            stackMode = 'by_vessel';
            entities = filterVessel !== 'ALL' ? [filterVessel] : (filterOptions.vessels.length > 0 ? filterOptions.vessels : ['Moquegua', 'Tablones', 'Huemul', 'Concon Trader']);
        }

        if (entities.length === 0) {
            entities = ['PETRAL'];
        }

        // Matriz por entidad (12 meses)
        const seriesDataMap: Record<string, { days: number[]; hours: number[]; count: number[] }> = {};
        entities.forEach(ent => {
            seriesDataMap[ent] = {
                days: Array(12).fill(0),
                hours: Array(12).fill(0),
                count: Array(12).fill(0)
            };
        });

        const monthTotals = Array(12).fill(0).map(() => ({ totalDays: 0, totalHours: 0, totalVoyages: 0 }));

        filtered.forEach(r => {
            const mIdx = (r.month >= 1 && r.month <= 12) ? r.month - 1 : 0;
            
            if (stackMode === 'by_port') {
                // Desglose por puertos
                if (r.ports) {
                    Object.entries(r.ports).forEach(([pKey, pVal]) => {
                        const pDays = Number(pVal.days) || 0;
                        const pHrs = Number(pVal.hours) || 0;
                        if (seriesDataMap[pKey]) {
                            seriesDataMap[pKey].days[mIdx] += pDays;
                            seriesDataMap[pKey].hours[mIdx] += pHrs;
                            if (pDays > 0 || pHrs > 0) seriesDataMap[pKey].count[mIdx] += 1;
                        }
                    });
                }
            } else if (stackMode === 'by_vessel') {
                // Desglose por buques
                const v = r.vessel;
                let vDays = 0;
                let vHours = 0;

                if (filterPort === 'ALL') {
                    vDays = Number(r.total_days) || 0;
                    vHours = Number(r.total_hours) || 0;
                } else if (r.ports && r.ports[filterPort]) {
                    vDays = Number(r.ports[filterPort].days) || 0;
                    vHours = Number(r.ports[filterPort].hours) || 0;
                }

                if (seriesDataMap[v]) {
                    seriesDataMap[v].days[mIdx] += vDays;
                    seriesDataMap[v].hours[mIdx] += vHours;
                    if (vDays > 0 || vHours > 0) {
                        seriesDataMap[v].count[mIdx] += 1;
                    }
                }
            } else if (stackMode === 'by_client') {
                const c = r.client || 'PETRAL';
                let cDays = Number(r.total_days) || 0;
                let cHours = Number(r.total_hours) || 0;
                if (seriesDataMap[c]) {
                    seriesDataMap[c].days[mIdx] += cDays;
                    seriesDataMap[c].hours[mIdx] += cHours;
                    if (cDays > 0 || cHours > 0) {
                        seriesDataMap[c].count[mIdx] += 1;
                    }
                }
            }

            // Totales para el eje secundario
            let monthVoyageDays = 0;
            let monthVoyageHours = 0;
            if (filterPort === 'ALL') {
                monthVoyageDays = Number(r.total_days) || 0;
                monthVoyageHours = Number(r.total_hours) || 0;
            } else if (r.ports && r.ports[filterPort]) {
                monthVoyageDays = Number(r.ports[filterPort].days) || 0;
                monthVoyageHours = Number(r.ports[filterPort].hours) || 0;
            }

            monthTotals[mIdx].totalDays += monthVoyageDays;
            monthTotals[mIdx].totalHours += monthVoyageHours;
            if (monthVoyageDays > 0 || monthVoyageHours > 0) {
                monthTotals[mIdx].totalVoyages += 1;
            }
        });

        // 1. Series del Eje Primario
        const seriesPri = entities.map(ent => {
            const dataObj = seriesDataMap[ent] || { days: Array(12).fill(0), hours: Array(12).fill(0), count: Array(12).fill(0) };
            
            const rawValues = MONTH_LABELS.map((_, i) => {
                if (primaryMetric === 'total_days') return Number(dataObj.days[i].toFixed(2));
                if (primaryMetric === 'total_hours') return Number(dataObj.hours[i].toFixed(1));
                return dataObj.count[i];
            });

            const isStack = primaryGraphType === 'bar_stack';
            const isBar = primaryGraphType.startsWith('bar');
            const isStraight = primaryGraphType === 'line_straight';
            const color = getHexColor(ent, stackMode === 'by_port' ? 'port' : (stackMode === 'by_client' ? 'client' : 'vessel'));

            return {
                name: ent,
                type: isBar ? 'bar' : 'line',
                stack: isStack ? 'pri_stack' : undefined,
                yAxisIndex: 0,
                smooth: isBar ? false : !isStraight,
                itemStyle: {
                    color,
                    borderRadius: isStack ? 0 : [3, 3, 0, 0]
                },
                label: {
                    show: primaryLabelPos !== 'none',
                    position: primaryLabelPos === 'none' ? undefined : primaryLabelPos,
                    formatter: (params: any) => {
                        const val = params.data;
                        if (!val || val === 0) return '';
                        return primaryMetric === 'total_days' ? `${val}d` : (primaryMetric === 'total_hours' ? `${val}h` : `${val}`);
                    },
                    color: primaryLabelColor,
                    fontWeight: 'bold',
                    fontSize: 10
                },
                emphasis: { focus: 'series' },
                data: rawValues
            };
        });

        // 2. Series del Eje Secundario
        const seriesSec: any[] = [];
        if (secondaryMetric !== 'none') {
            let runningTotal = 0;
            const secValues = MONTH_LABELS.map((_, i) => {
                const m = monthTotals[i];
                let val = 0;
                if (secondaryMetric === 'avg_days') {
                    val = m.totalVoyages > 0 ? Number((m.totalDays / m.totalVoyages).toFixed(2)) : 0;
                } else if (secondaryMetric === 'global_total_days') {
                    val = Number(m.totalDays.toFixed(2));
                }

                if (isSecondaryCumulativeGlobal) {
                    runningTotal += val;
                    return Number(runningTotal.toFixed(2));
                }
                return val;
            });

            const isBarSec = secondaryGraphType === 'bar';
            const isStraightSec = secondaryGraphType === 'line_straight';

            seriesSec.push({
                name: secondaryMetric === 'avg_days' ? 'Promedio Días/Viaje (Sec)' : 'Total Días Mes (Sec)',
                type: isBarSec ? 'bar' : 'line',
                yAxisIndex: 1,
                smooth: isBarSec ? false : !isStraightSec,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: { width: 3, type: 'dashed', color: '#10B981' },
                itemStyle: { color: '#10B981' },
                label: {
                    show: secondaryLabelPos !== 'none',
                    position: secondaryLabelPos === 'none' ? undefined : secondaryLabelPos,
                    formatter: (params: any) => {
                        const val = params.data;
                        if (!val || val === 0) return '';
                        return isSecondaryPercentage ? `${val}%` : `${val} d`;
                    },
                    color: secondaryLabelColor,
                    fontWeight: 'bold',
                    fontSize: 10
                },
                data: secValues
            });
        }

        const getPrimaryLabel = () => {
            if (primaryMetric === 'total_days') return 'Días de Demora';
            if (primaryMetric === 'total_hours') return 'Horas de Demora';
            return 'Cantidad de Viajes';
        };

        const getSecondaryLabel = () => {
            if (secondaryMetric === 'avg_days') return 'Promedio Días / Viaje' + (isSecondaryCumulativeGlobal ? ' (Acum)' : '');
            if (secondaryMetric === 'global_total_days') return 'Días Totales Mes' + (isSecondaryCumulativeGlobal ? ' (Acum)' : '');
            return '';
        };

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: '#334155',
                borderWidth: 1,
                textStyle: { color: '#F8FAFC', fontSize: 11 },
                formatter: (params: any) => {
                    if (!params || !Array.isArray(params) || params.length === 0) return '';
                    let tooltip = `<div style="font-weight:600;margin-bottom:4px;border-bottom:1px solid #475569;padding-bottom:2px">${params[0]?.axisValue || ''}</div>`;
                    params.forEach((p: any) => {
                        const isSec = p?.seriesName?.includes('(Sec)');
                        const val = typeof p?.value === 'number' ? p.value : (parseFloat(p?.value) || 0);
                        const unit = isSec 
                            ? (isSecondaryPercentage ? '%' : ' d') 
                            : (primaryMetric === 'total_days' ? ' d' : (primaryMetric === 'total_hours' ? ' h' : ' viajes'));
                        const cleanName = (p?.seriesName || '').replace(' (Sec)', '');
                        tooltip += `<div style="display:flex;justify-content:space-between;gap:12px;margin:2px 0">
                            <span>${p?.marker || '•'} <b>${cleanName}</b></span>
                            <span style="font-family:monospace;font-weight:bold">${val}${unit}</span>
                        </div>`;
                    });
                    return tooltip;
                }
            },
            legend: {
                top: 0,
                icon: 'circle',
                textStyle: { color: '#475569', fontWeight: 'bold' }
            },
            grid: {
                left: 70, 
                right: secondaryMetric !== 'none' ? 70 : 30,
                bottom: 30,
                top: 40,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: MONTH_LABELS,
                axisLine: { lineStyle: { color: '#CBD5E1' } },
                axisLabel: { color: '#64748B', fontWeight: 'bold' }
            },
            yAxis: [
                {
                    type: 'value',
                    name: getPrimaryLabel(),
                    nameTextStyle: { color: '#0EA5E9', padding: [0, 0, 0, -40], fontWeight: 'bold' },
                    axisLine: { show: false },
                    axisLabel: { 
                        color: '#64748B', 
                        fontWeight: 'bold', 
                        formatter: (v: number) => primaryMetric === 'total_days' ? `${v} d` : (primaryMetric === 'total_hours' ? `${v} h` : `${v}`)
                    },
                    splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } }
                },
                {
                    type: 'value',
                    name: getSecondaryLabel(),
                    nameTextStyle: { color: '#059669', padding: [0, -40, 0, 0], fontWeight: 'bold' },
                    show: secondaryMetric !== 'none',
                    axisLine: { show: false },
                    axisLabel: { color: '#059669', fontWeight: 'bold', formatter: (v: number) => `${v} d` },
                    splitLine: { show: false }
                }
            ],
            series: [...seriesPri, ...seriesSec]
        };
    }, [records, groupBy, filterClient, filterPort, filterVessel, filterYear, primaryMetric, primaryGraphType, primaryLabelPos, primaryLabelColor, secondaryMetric, secondaryGraphType, isSecondaryCumulativeGlobal, isSecondaryPercentage, secondaryLabelPos, secondaryLabelColor, filterOptions, vesselsMap]);

    const echartsRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-resize
    useEffect(() => {
        const handleResize = () => {
            if (echartsRef.current && options && options.series && options.series.length > 0) {
                try {
                    const chartInstance = echartsRef.current.getEchartsInstance();
                    if (chartInstance && typeof chartInstance.resize === 'function' && !chartInstance.isDisposed()) {
                        chartInstance.resize();
                    }
                } catch (e) {}
            }
        };

        let resizeObserver: ResizeObserver | null = null;
        if (containerRef.current && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => handleResize());
            resizeObserver.observe(containerRef.current);
        }

        const timer = setTimeout(handleResize, 100);
        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [options]);

    const renderCustomDropdownPri = () => {
        const selectedOption = metricOptionsPri.find(o => o.value === primaryMetric) || metricOptionsPri[0];
        
        return (
            <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={() => {
                        setIsSecOpen(false);
                        setIsPriOpen(!isPriOpen);
                    }}
                    className="w-full flex items-center justify-between gap-1 px-2 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded hover:border-slate-350 focus:outline-none transition-all cursor-pointer text-slate-700"
                >
                    <div className="flex items-center gap-1.5 truncate">
                        <span className="text-sm shrink-0">{selectedOption.icon}</span>
                        <span className="truncate">{selectedOption.label}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 shrink-0">{isPriOpen ? '▲' : '▼'}</span>
                </button>

                {isPriOpen && (
                    <div className="absolute left-[208px] top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 w-[380px] p-2 grid grid-cols-1 gap-1.5 animate-in fade-in slide-in-from-left-2 duration-150">
                        <div className="px-1 py-0.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                            <span>Métricas (Eje Primario)</span>
                            <button onClick={() => setIsPriOpen(false)} className="text-[11px] text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer">✕</button>
                        </div>
                        {metricOptionsPri.map((opt) => {
                            const isSel = opt.value === primaryMetric;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setPrimaryMetric(opt.value as PlotMetricPri);
                                        setIsPriOpen(false);
                                    }}
                                    className={`text-left p-1.5 flex flex-col gap-0.5 rounded hover:bg-slate-50 transition-all cursor-pointer border ${
                                        isSel ? 'bg-blue-50/70 border-blue-200 hover:bg-blue-50' : 'border-slate-100/50 bg-slate-50/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm shrink-0">{opt.icon}</span>
                                        <span className={`text-[11px] ${isSel ? 'font-bold text-blue-900' : 'font-semibold text-slate-700'} truncate`}>
                                            {opt.label}
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-medium pl-5 truncate block">
                                        {opt.desc}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderCustomDropdownSec = () => {
        const selectedOption = metricOptionsSec.find(o => o.value === secondaryMetric) || metricOptionsSec[0];
        
        return (
            <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={() => {
                        setIsPriOpen(false);
                        setIsSecOpen(!isSecOpen);
                    }}
                    className="w-full flex items-center justify-between gap-1 px-2 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded hover:border-slate-350 focus:outline-none transition-all cursor-pointer text-slate-700"
                >
                    <div className="flex items-center gap-1.5 truncate">
                        <span className="text-sm shrink-0">{selectedOption.icon}</span>
                        <span className="truncate">{selectedOption.label}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 shrink-0">{isSecOpen ? '▲' : '▼'}</span>
                </button>

                {isSecOpen && (
                    <div className="absolute left-[208px] top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 w-[380px] p-2 grid grid-cols-1 gap-1.5 animate-in fade-in slide-in-from-left-2 duration-150">
                        <div className="px-1 py-0.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                            <span>Métricas (Eje Secundario)</span>
                            <button onClick={() => setIsSecOpen(false)} className="text-[11px] text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer">✕</button>
                        </div>
                        {metricOptionsSec.map((opt) => {
                            const isSel = opt.value === secondaryMetric;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setSecondaryMetric(opt.value as PlotMetricSec);
                                        setIsSecOpen(false);
                                    }}
                                    className={`text-left p-1.5 flex flex-col gap-0.5 rounded hover:bg-slate-50 transition-all cursor-pointer border ${
                                        isSel ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50' : 'border-slate-100/50 bg-slate-50/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm shrink-0">{opt.icon}</span>
                                        <span className={`text-[11px] ${isSel ? 'font-bold text-emerald-900' : 'font-semibold text-slate-700'} truncate`}>
                                            {opt.label}
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-medium pl-5 truncate block">
                                        {opt.desc}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderFilterDropdown = (
        selectedVal: string, 
        onSelect: (val: string) => void, 
        optionsList: string[],
        isOpen: boolean, 
        setIsOpen: (open: boolean) => void,
        title: string
    ) => {
        return (
            <div className="relative flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={() => {
                        setIsClientFilterOpen(false);
                        setIsPortFilterOpen(false);
                        setIsVesselFilterOpen(false);
                        setIsYearFilterOpen(false);
                        setIsPriOpen(false);
                        setIsSecOpen(false);
                        setIsOpen(!isOpen);
                    }}
                    className="w-full flex items-center justify-between gap-1 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded hover:border-slate-350 focus:outline-none transition-all cursor-pointer text-slate-700 font-bold overflow-hidden"
                >
                    <span className="truncate block max-w-full">{selectedVal === 'ALL' ? 'Todos' : selectedVal}</span>
                    <span className="text-[8px] text-slate-400 shrink-0 ml-1">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                    <div className="absolute left-[130px] top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 w-[240px] max-h-[220px] overflow-y-auto p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-left-2 duration-150">
                        <div className="px-2 py-1 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                            <span>Filtrar {title}</span>
                            <button onClick={() => setIsOpen(false)} className="text-[10px] text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer">✕</button>
                        </div>
                        <button
                            onClick={() => {
                                onSelect('ALL');
                                setIsOpen(false);
                            }}
                            className={`text-left text-[11px] p-1.5 rounded transition-all cursor-pointer border ${
                                selectedVal === 'ALL' 
                                    ? 'bg-blue-50 border-blue-200 font-bold text-blue-900' 
                                    : 'border-transparent hover:bg-slate-50 font-medium text-slate-600'
                            }`}
                        >
                            Todos
                        </button>
                        {optionsList.map((opt) => {
                            const isSel = opt === selectedVal;
                            return (
                                <button
                                    key={opt}
                                    onClick={() => {
                                        onSelect(opt);
                                        setIsOpen(false);
                                    }}
                                    className={`text-left text-[11px] p-1.5 rounded transition-all cursor-pointer border truncate ${
                                        isSel 
                                            ? 'bg-blue-50 border-blue-200 font-bold text-blue-900' 
                                            : 'border-transparent hover:bg-slate-50 font-medium text-slate-600'
                                    }`}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const hasValidOptions = options && options.series && Array.isArray(options.series) && options.series.length > 0;

    return (
        <div className="w-full glass-card bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex flex-row gap-6 items-stretch min-h-[calc(100vh-220px)]">
            
            {/* Sidebar de Controles (Left) */}
            <div className="flex flex-col gap-3 shrink-0 min-w-[245px] w-fit">
                
                {/* FILTROS TABS */}
                <div className="flex flex-row items-stretch bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <div className="bg-slate-900 w-7 flex items-center justify-center shrink-0 rounded-l-xl self-stretch min-h-full">
                        <span className="text-[10.5px] font-black text-white uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Filtros</span>
                    </div>
                    <div className="flex-1 p-2.5 flex flex-col gap-2 bg-slate-50/70 rounded-r-xl">
                        <button 
                            onClick={() => {
                                setGroupBy('petral');
                                setFilterClient('ALL');
                                setFilterPort('ALL');
                                setFilterVessel('ALL');
                                setFilterYear('ALL');
                            }} 
                            className={`w-full h-8 flex items-center justify-center text-center px-2 text-[11.5px] font-black rounded-lg transition-all cursor-pointer ${groupBy === 'petral' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-white text-sky-700 border border-slate-200 hover:bg-slate-100 font-extrabold'}`}
                        >
                            PETRAL (Todo)
                        </button>
                        <div className="h-px w-full bg-slate-200 my-0.5"></div>
                        
                        {/* Cliente filter row */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => setGroupBy('client')} className={`w-[75px] shrink-0 h-7.5 flex items-center justify-center text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${groupBy === 'client' || filterClient !== 'ALL' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>
                                Cliente
                            </button>
                            {renderFilterDropdown(filterClient, setFilterClient, filterOptions.clients, isClientFilterOpen, setIsClientFilterOpen, 'Cliente')}
                        </div>

                        {/* Puerto filter row */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => setGroupBy('port')} className={`w-[75px] shrink-0 h-7.5 flex items-center justify-center text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${groupBy === 'port' || filterPort !== 'ALL' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>
                                Puerto
                            </button>
                            {renderFilterDropdown(filterPort, setFilterPort, filterOptions.ports, isPortFilterOpen, setIsPortFilterOpen, 'Puerto')}
                        </div>

                        {/* Buque filter row */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => setGroupBy('vessel')} className={`w-[75px] shrink-0 h-7.5 flex items-center justify-center text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${groupBy === 'vessel' || filterVessel !== 'ALL' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>
                                Buque
                            </button>
                            {renderFilterDropdown(filterVessel, setFilterVessel, filterOptions.vessels, isVesselFilterOpen, setIsVesselFilterOpen, 'Buque')}
                        </div>

                        {/* Año filter row */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => {}} className="w-[75px] shrink-0 h-7.5 flex items-center justify-center text-[11px] font-extrabold rounded-lg transition-all cursor-default bg-white text-slate-700 border border-slate-200">
                                Año
                            </button>
                            {renderFilterDropdown(filterYear, setFilterYear, filterOptions.years, isYearFilterOpen, setIsYearFilterOpen, 'Año')}
                        </div>
                    </div>
                </div>

                {/* EJE PRIMARIO TABS */}
                <div className="flex flex-row items-stretch bg-white rounded-xl border border-blue-200 shadow-2xs">
                    <div className="bg-blue-600 w-7 flex items-center justify-center shrink-0 rounded-l-xl self-stretch min-h-full">
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Eje Primario</span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col gap-2.5 bg-blue-50/30 rounded-r-xl relative">
                        {renderCustomDropdownPri()}
                        <div className="flex flex-row gap-4 pt-2 border-t border-blue-200/40 mt-1">
                            {/* Columna Izquierda: Tipo de Gráfico (Iconos apilados) */}
                            <div className="flex flex-col gap-1 w-9 shrink-0">
                                <button 
                                    onClick={() => setPrimaryGraphType('bar_stack')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${primaryGraphType === 'bar_stack' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-55'}`}
                                    title="Barras Stack"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="13" width="10" height="4" rx="1"/><rect x="7" y="7" width="10" height="4" rx="1"/></svg>
                                </button>
                                <button 
                                    onClick={() => setPrimaryGraphType('bar_group')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${primaryGraphType === 'bar_group' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-55'}`}
                                    title="Barras Adjuntas"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 17v-6"/><path d="M11 17V9"/><path d="M15 17v-4"/><path d="M19 17V5"/></svg>
                                </button>
                                <button 
                                    onClick={() => setPrimaryGraphType('line')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${primaryGraphType === 'line' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-55'}`}
                                    title="Línea Suavizada"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 17c2-5 4-10 8-10s6 5 8 5"/></svg>
                                </button>
                                <button 
                                    onClick={() => setPrimaryGraphType('line_straight')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${primaryGraphType === 'line_straight' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-55'}`}
                                    title="Línea Recta"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 15l5-8 5 6 4-6"/></svg>
                                </button>
                            </div>

                            {/* Columna Derecha: Control de Etiquetas */}
                            <div className="flex-1 flex flex-col gap-1">
                                <button
                                    onClick={() => setPrimaryLabelColor(primaryLabelColor === '#ffffff' ? '#000000' : '#ffffff')}
                                    className={`w-full text-center py-1 text-[10px] font-extrabold rounded border transition-colors shadow-sm cursor-pointer ${primaryLabelColor === '#ffffff' ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'}`}
                                    title="Alternar Color (Blanco/Negro)"
                                >
                                    Etiquetas
                                </button>
                                <div className="flex flex-col rounded border border-slate-200 overflow-hidden bg-white mt-1 w-full">
                                    {(['none', 'top', 'inside'] as const).map(pos => (
                                        <button
                                            key={pos}
                                            onClick={() => setPrimaryLabelPos(pos)}
                                            className={`text-[9px] font-bold py-1 px-1 transition-all cursor-pointer border-b last:border-0 border-slate-100 ${primaryLabelPos === pos ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            {pos === 'none' ? 'Ocultar' : (pos === 'top' ? 'Encima' : 'Centro')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* EJE SECUNDARIO TABS */}
                <div className="flex flex-row items-stretch bg-white rounded-xl border border-emerald-200 shadow-2xs">
                    <div className="bg-emerald-600 w-7 flex items-center justify-center shrink-0 rounded-l-xl self-stretch min-h-full">
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Eje Secundario</span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col gap-2.5 bg-emerald-50/30 rounded-r-xl relative">
                        {renderCustomDropdownSec()}
                        <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-200/50 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-3 h-3" checked={isSecondaryCumulativeGlobal} onChange={(e) => setIsSecondaryCumulativeGlobal(e.target.checked)} />
                                <span className="text-[11px] font-medium text-slate-700">Acumular Global</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-3 h-3" checked={isSecondaryPercentage} onChange={(e) => setIsSecondaryPercentage(e.target.checked)} />
                                <span className="text-[11px] font-medium text-slate-700">Mostrar en %</span>
                            </label>
                        </div>
                        
                        <div className="flex flex-row gap-4 pt-2 border-t border-emerald-200/40 mt-1">
                            {/* Columna Izquierda: Tipo de Gráfico (Iconos apilados) */}
                            <div className="flex flex-col gap-1 w-9 shrink-0">
                                <button 
                                    onClick={() => setSecondaryGraphType('bar')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${secondaryGraphType === 'bar' ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-55'}`}
                                    title="Barras"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 17v-6"/><path d="M11 17V9"/><path d="M15 17v-4"/><path d="M19 17V5"/></svg>
                                </button>
                                <button 
                                    onClick={() => setSecondaryGraphType('line')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${secondaryGraphType === 'line' ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-55'}`}
                                    title="Línea Suavizada"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 17c2-5 4-10 8-10s6 5 8 5"/></svg>
                                </button>
                                <button 
                                    onClick={() => setSecondaryGraphType('line_straight')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${secondaryGraphType === 'line_straight' ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-55'}`}
                                    title="Línea Recta"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 15l5-8 5 6 4-6"/></svg>
                                </button>
                            </div>

                            {/* Columna Derecha: Control de Etiquetas */}
                            <div className="flex-1 flex flex-col gap-1">
                                <button
                                    onClick={() => setSecondaryLabelColor(secondaryLabelColor === '#ffffff' ? '#000000' : '#ffffff')}
                                    className={`w-full text-center py-1 text-[10px] font-extrabold rounded border transition-colors shadow-sm cursor-pointer ${secondaryLabelColor === '#ffffff' ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'}`}
                                    title="Alternar Color (Blanco/Negro)"
                                >
                                    Etiquetas
                                </button>
                                <div className="flex flex-col rounded border border-slate-200 overflow-hidden bg-white mt-1 w-full">
                                    {(['none', 'top', 'inside'] as const).map(pos => (
                                        <button
                                            key={pos}
                                            onClick={() => setSecondaryLabelPos(pos)}
                                            className={`text-[9px] font-bold py-1 px-1 transition-all cursor-pointer border-b last:border-0 border-slate-100 ${secondaryLabelPos === pos ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            {pos === 'none' ? 'Ocultar' : (pos === 'top' ? 'Encima' : 'Centro')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Contenedor del Gráfico (Right) */}
            <div ref={containerRef} className="flex-1 flex flex-col min-h-[650px] min-w-0">
                {hasValidOptions ? (
                    <ReactECharts ref={echartsRef} option={options} style={{ flex: 1, height: '100%', minHeight: '650px', width: '100%' }} notMerge={true} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[650px] w-full bg-slate-50 rounded border border-slate-200">
                        <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                        <p className="text-slate-500 text-xs font-semibold">Procesando gráficos ECharts...</p>
                    </div>
                )}
            </div>

        </div>
    );
};
