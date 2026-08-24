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
type PlotMetricSec = 'none' | 'rolling_avg_ytd_voyage' | 'rolling_avg_ytd_port' | 'avg_days' | 'global_total_days';
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
    
    // Filtro de Año puntual (Sin opción 'ALL')
    const [filterYear, setFilterYear] = useState<string>('2024');

    const [isClientFilterOpen, setIsClientFilterOpen] = useState(false);
    const [isPortFilterOpen, setIsPortFilterOpen] = useState(false);
    const [isVesselFilterOpen, setIsVesselFilterOpen] = useState(false);
    const [isYearFilterOpen, setIsYearFilterOpen] = useState(false);

    // Eje Primario
    const [primaryMetric, setPrimaryMetric] = useState<PlotMetricPri>('total_days');
    const [primaryGraphType, setPrimaryGraphType] = useState<GraphType>('bar_stack');
    const [isPriOpen, setIsPriOpen] = useState(false);
    const [primaryLabelPos, setPrimaryLabelPos] = useState<'none' | 'top' | 'inside'>('inside');
    const [primaryLabelColor, setPrimaryLabelColor] = useState<string>('#ffffff');

    // Eje Secundario
    const [secondaryMetric, setSecondaryMetric] = useState<PlotMetricSec>('rolling_avg_ytd_voyage');
    const [secondaryGraphType, setSecondaryGraphType] = useState<'line' | 'line_straight' | 'bar'>('line');
    const [isSecOpen, setIsSecOpen] = useState(false);
    const [isSecondaryCumulativeGlobal, setIsSecondaryCumulativeGlobal] = useState(false);
    const [isSecondaryPercentage, setIsSecondaryPercentage] = useState(false);
    const [secondaryLabelPos, setSecondaryLabelPos] = useState<'none' | 'top' | 'inside'>('top');
    const [secondaryLabelColor, setSecondaryLabelColor] = useState<string>('#059669');

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

        const sortedYears = Array.from(years).sort().reverse();

        return {
            clients: Array.from(clients).sort(),
            ports: PortDemurrageRatesService.STANDARD_PORTS.map(p => p.id),
            vessels: Array.from(vessels).sort(),
            years: sortedYears.length > 0 ? sortedYears : ['2026', '2025', '2024']
        };
    }, [records]);

    // Establecer año inicial por defecto al más reciente si no está seteado
    useEffect(() => {
        if (filterOptions.years.length > 0 && (!filterYear || filterYear === 'ALL')) {
            setFilterYear(filterOptions.years[0]);
        }
    }, [filterOptions.years]);

    // Paleta de colores oficial
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
        { value: 'rolling_avg_ytd_voyage', label: 'Rolling Avg YTD (Días/Viaje)', icon: '🚢', desc: 'Promedio móvil acumulado por viaje completo' },
        { value: 'rolling_avg_ytd_port', label: 'Rolling Avg YTD (Días/Recalada)', icon: '⚓', desc: 'Promedio móvil acumulado por operación portuaria' },
        { value: 'avg_days', label: 'Promedio Mensual (Días/Viaje)', icon: '⚖️', desc: 'Días promedio por viaje en el mes' },
        { value: 'global_total_days', label: 'Días de Demora (Mes)', icon: '⏳', desc: 'Suma total de días de demora en el mes' }
    ];

    const options = useMemo(() => {
        if (!records || records.length === 0) return null;

        // Filtrado puntual por Año, Cliente, Buque
        const targetYear = filterYear && filterYear !== 'ALL' ? filterYear : (filterOptions.years[0] || '2024');

        const filtered = records.filter(r => {
            if (String(r.year) !== targetYear) return false;
            if (filterClient !== 'ALL' && r.client !== filterClient) return false;
            if (filterVessel !== 'ALL' && r.vessel !== filterVessel) return false;
            return true;
        });

        // Modo de Apilamiento y Coloreo Cruzado
        const isVesselFiltered = filterVessel !== 'ALL' && filterPort === 'ALL';
        const isPortFiltered = filterPort !== 'ALL' && filterVessel === 'ALL';

        // Totales mensuales para el eje secundario
        const monthTotals = Array(12).fill(0).map(() => ({ totalDays: 0, totalHours: 0, totalVoyages: 0, totalPortTouches: 0 }));

        // Agrupación granular por Viaje para el stack del Eje Primario
        interface VoyageSeriesItem {
            seriesName: string;
            legendGroup: string;
            color: string;
            voyageNumber: number;
            vesselName: string;
            clientName: string;
            portName: string;
            dataByMonth: (number | null)[];
            daysByMonth: number[];
            hoursByMonth: number[];
        }

        const voyageSeriesMap: Record<string, VoyageSeriesItem> = {};

        filtered.forEach(r => {
            const mIdx = (r.month >= 1 && r.month <= 12) ? r.month - 1 : 0;
            const voyageNum = r.voyage || 0;
            const vesselName = r.vessel || 'Buque';
            const clientName = r.client || 'PETRAL';
            let voyagePortTouches = 0;

            if (isVesselFiltered) {
                // Filtro por Buque activo: Desglosar por cada PUERTO donde tuvo estadía en ese viaje
                if (r.ports) {
                    Object.entries(r.ports).forEach(([pKey, pVal]) => {
                        const pDays = Number(pVal.days) || 0;
                        const pHrs = Number(pVal.hours) || 0;
                        if (pDays > 0 || pHrs > 0) {
                            voyagePortTouches += 1;
                            const key = `V.${voyageNum} - ${pKey}`;
                            if (!voyageSeriesMap[key]) {
                                voyageSeriesMap[key] = {
                                    seriesName: key,
                                    legendGroup: pKey,
                                    color: getHexColor(pKey, 'port'),
                                    voyageNumber: voyageNum,
                                    vesselName,
                                    clientName,
                                    portName: pKey,
                                    dataByMonth: Array(12).fill(0),
                                    daysByMonth: Array(12).fill(0),
                                    hoursByMonth: Array(12).fill(0)
                                };
                            }
                            (voyageSeriesMap[key].daysByMonth[mIdx]) += pDays;
                            (voyageSeriesMap[key].hoursByMonth[mIdx]) += pHrs;
                            
                            monthTotals[mIdx].totalDays += pDays;
                            monthTotals[mIdx].totalHours += pHrs;
                            monthTotals[mIdx].totalPortTouches += 1;
                        }
                    });
                }
                monthTotals[mIdx].totalVoyages += 1;
            } else if (isPortFiltered) {
                // Filtro por Puerto activo: Desglosar por cada BUQUE en ese viaje
                let pDays = 0;
                let pHrs = 0;
                if (r.ports && r.ports[filterPort]) {
                    pDays = Number(r.ports[filterPort].days) || 0;
                    pHrs = Number(r.ports[filterPort].hours) || 0;
                }
                if (pDays > 0 || pHrs > 0) {
                    const key = `${vesselName} - V.${voyageNum}`;
                    if (!voyageSeriesMap[key]) {
                        voyageSeriesMap[key] = {
                            seriesName: key,
                            legendGroup: vesselName,
                            color: getHexColor(vesselName, 'vessel'),
                            voyageNumber: voyageNum,
                            vesselName,
                            clientName,
                            portName: filterPort,
                            dataByMonth: Array(12).fill(0),
                            daysByMonth: Array(12).fill(0),
                            hoursByMonth: Array(12).fill(0)
                        };
                    }
                    (voyageSeriesMap[key].daysByMonth[mIdx]) += pDays;
                    (voyageSeriesMap[key].hoursByMonth[mIdx]) += pHrs;

                    monthTotals[mIdx].totalDays += pDays;
                    monthTotals[mIdx].totalHours += pHrs;
                    monthTotals[mIdx].totalPortTouches += 1;
                    monthTotals[mIdx].totalVoyages += 1;
                }
            } else {
                // Vista General Flota / Petral Todo: Desglosar por Buque y Viaje
                const totalDays = Number(r.total_days) || 0;
                const totalHrs = Number(r.total_hours) || 0;
                
                // Contar puertos tocados con demora en este viaje
                if (r.ports) {
                    Object.values(r.ports).forEach(pVal => {
                        if (Number(pVal.days) > 0 || Number(pVal.hours) > 0) {
                            voyagePortTouches += 1;
                        }
                    });
                }
                if (voyagePortTouches === 0 && totalDays > 0) voyagePortTouches = 2; // Default 2 recaladas si no están desglosados

                if (totalDays > 0 || totalHrs > 0) {
                    const key = `${vesselName} - V.${voyageNum}`;
                    if (!voyageSeriesMap[key]) {
                        voyageSeriesMap[key] = {
                            seriesName: key,
                            legendGroup: vesselName,
                            color: getHexColor(vesselName, 'vessel'),
                            voyageNumber: voyageNum,
                            vesselName,
                            clientName,
                            portName: 'Varios',
                            dataByMonth: Array(12).fill(0),
                            daysByMonth: Array(12).fill(0),
                            hoursByMonth: Array(12).fill(0)
                        };
                    }
                    (voyageSeriesMap[key].daysByMonth[mIdx]) += totalDays;
                    (voyageSeriesMap[key].hoursByMonth[mIdx]) += totalHrs;

                    monthTotals[mIdx].totalDays += totalDays;
                    monthTotals[mIdx].totalHours += totalHrs;
                    monthTotals[mIdx].totalPortTouches += voyagePortTouches;
                    monthTotals[mIdx].totalVoyages += 1;
                }
            }
        });

        // 1. Series del Eje Primario (Barras apiladas con delimitador horizontal translúcido y rótulo V.<número>)
        const seriesPri = Object.values(voyageSeriesMap).map(vItem => {
            const rawValues = MONTH_LABELS.map((_, i) => {
                let val = 0;
                if (primaryMetric === 'total_days') val = Number(vItem.daysByMonth[i].toFixed(2));
                else if (primaryMetric === 'total_hours') val = Number(vItem.hoursByMonth[i].toFixed(1));
                else val = vItem.daysByMonth[i] > 0 ? 1 : 0;
                return val > 0 ? val : null;
            });

            return {
                name: vItem.seriesName,
                type: 'bar',
                stack: 'demurrage_trips_stack',
                yAxisIndex: 0,
                barMaxWidth: 65,
                itemStyle: {
                    color: vItem.color,
                    borderColor: 'rgba(255, 255, 255, 0.65)',
                    borderWidth: 1.5,
                    borderType: 'solid',
                    borderRadius: 0
                },
                label: {
                    show: primaryLabelPos !== 'none',
                    position: primaryLabelPos === 'none' ? undefined : primaryLabelPos,
                    formatter: (params: any) => {
                        const val = params.value;
                        if (!val || val <= 0) return '';
                        // Rótulo compacto del viaje
                        return `V.${vItem.voyageNumber}`;
                    },
                    color: primaryLabelColor,
                    fontWeight: 'bold',
                    fontSize: 9.5,
                    overflow: 'truncate'
                },
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        borderColor: '#ffffff',
                        borderWidth: 2.5,
                        shadowBlur: 6,
                        shadowColor: 'rgba(0,0,0,0.35)'
                    }
                },
                data: rawValues
            };
        });

        // 2. Series del Eje Secundario (Rolling Avg YTD Viaje / Recalada / Promedios)
        const seriesSec: any[] = [];
        if (secondaryMetric !== 'none') {
            let runningTotalDays = 0;
            let runningTotalVoyages = 0;
            let runningTotalTouches = 0;
            let runningTotal = 0;

            // Determinar cuál es el último mes que tiene actividad para cortar limpiamente la curva
            let lastActiveMonthIdx = -1;
            for (let i = 11; i >= 0; i--) {
                if (monthTotals[i].totalVoyages > 0) {
                    lastActiveMonthIdx = i;
                    break;
                }
            }

            const secValues = MONTH_LABELS.map((_, i) => {
                if (i > lastActiveMonthIdx || lastActiveMonthIdx === -1) {
                    return null;
                }

                const m = monthTotals[i];
                runningTotalDays += m.totalDays;
                runningTotalVoyages += m.totalVoyages;
                runningTotalTouches += m.totalPortTouches;

                if (secondaryMetric === 'rolling_avg_ytd_voyage') {
                    if (runningTotalVoyages === 0) return null;
                    return Number((runningTotalDays / runningTotalVoyages).toFixed(2));
                }

                if (secondaryMetric === 'rolling_avg_ytd_port') {
                    if (runningTotalTouches === 0) return null;
                    return Number((runningTotalDays / runningTotalTouches).toFixed(2));
                }

                if (m.totalVoyages === 0) {
                    return null;
                }

                let val = 0;
                if (secondaryMetric === 'avg_days') {
                    val = Number((m.totalDays / m.totalVoyages).toFixed(2));
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

            const getSecSeriesName = () => {
                if (secondaryMetric === 'rolling_avg_ytd_voyage') return 'Rolling Avg YTD (Días/Viaje)';
                if (secondaryMetric === 'rolling_avg_ytd_port') return 'Rolling Avg YTD (Días/Recalada)';
                if (secondaryMetric === 'avg_days') return 'Promedio Mensual (Días/Viaje)';
                return 'Días de Demora Mes (Sec)';
            };

            seriesSec.push({
                name: getSecSeriesName(),
                type: isBarSec ? 'bar' : 'line',
                yAxisIndex: 1,
                connectNulls: false, // NO conectar meses vacíos
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
                        if (val === null || val === undefined || val === '') return '';
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
            if (secondaryMetric === 'rolling_avg_ytd_voyage') return 'Rolling Avg YTD (d/viaje)';
            if (secondaryMetric === 'rolling_avg_ytd_port') return 'Rolling Avg YTD (d/recalada)';
            if (secondaryMetric === 'avg_days') return 'Promedio Días / Viaje' + (isSecondaryCumulativeGlobal ? ' (Acum)' : '');
            if (secondaryMetric === 'global_total_days') return 'Días Totales Mes' + (isSecondaryCumulativeGlobal ? ' (Acum)' : '');
            return '';
        };

        return {
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: '#334155',
                borderWidth: 1,
                textStyle: { color: '#F8FAFC', fontSize: 11.5 },
                formatter: (params: any) => {
                    if (!params) return '';
                    const isSec = params?.seriesName?.includes('(Sec)');
                    const seriesName = params?.seriesName || '';
                    const monthName = params?.name || '';
                    const val = typeof params?.value === 'number' ? params.value : (parseFloat(params?.value) || 0);

                    if (isSec) {
                        return `<div style="font-weight:bold;margin-bottom:4px;border-bottom:1px solid #475569;padding-bottom:2px">
                            ${monthName} — Eje Secundario
                        </div>
                        <div style="display:flex;justify-content:space-between;gap:12px">
                            <span>${params?.marker || '•'} <b>${seriesName}</b></span>
                            <span style="font-family:monospace;font-weight:bold">${val} d</span>
                        </div>`;
                    }

                    const itemObj = voyageSeriesMap[seriesName];
                    const vNum = itemObj ? `Viaje ${itemObj.voyageNumber}` : seriesName;
                    const vVessel = itemObj?.vesselName || '';
                    const vPort = itemObj?.portName || '';
                    const vClient = itemObj?.clientName || '';
                    const unit = primaryMetric === 'total_days' ? 'días' : (primaryMetric === 'total_hours' ? 'horas' : 'viaje');

                    return `<div style="font-weight:bold;margin-bottom:4px;border-bottom:1px solid #475569;padding-bottom:2px">
                        📅 ${monthName} • ${vNum} (${targetYear})
                    </div>
                    <div style="font-size:11px;color:#94A3B8;margin-bottom:3px">
                        🚢 <b>Buque:</b> ${vVessel} ${vPort ? `• ⚓ <b>Puerto:</b> ${vPort}` : ''} • 🏢 <b>Cliente:</b> ${vClient}
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:12px;margin-top:4px">
                        <span>Demora Registrada:</span>
                        <span style="font-family:monospace;font-weight:bold;color:#38BDF8">${val} ${unit}</span>
                    </div>`;
                }
            },
            legend: {
                show: false // Ocultar leyenda masiva de viajes para mantener limpia la gráfica
            },
            grid: {
                left: 65, 
                right: secondaryMetric !== 'none' ? 65 : 25,
                bottom: 30,
                top: 35,
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
                    name: getPrimaryLabel(),
                    nameTextStyle: { color: '#0EA5E9', padding: [0, 0, 0, -35], fontWeight: 'bold' },
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
                    nameTextStyle: { color: '#059669', padding: [0, -35, 0, 0], fontWeight: 'bold' },
                    show: secondaryMetric !== 'none',
                    axisLine: { show: false },
                    axisLabel: { color: '#059669', fontWeight: 'bold', formatter: (v: number) => `${v} d` },
                    splitLine: { show: false }
                }
            ],
            series: [...seriesPri, ...seriesSec]
        };
    }, [records, groupBy, filterClient, filterPort, filterVessel, filterYear, primaryMetric, primaryLabelPos, primaryLabelColor, secondaryMetric, secondaryGraphType, isSecondaryCumulativeGlobal, isSecondaryPercentage, secondaryLabelPos, secondaryLabelColor, filterOptions, vesselsMap]);

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
        title: string,
        allowAll: boolean = true
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
                    <span className="truncate block max-w-full">{selectedVal === 'ALL' ? 'Todos' : (title === 'Año' ? `Año ${selectedVal}` : selectedVal)}</span>
                    <span className="text-[8px] text-slate-400 shrink-0 ml-1">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                    <div className="absolute left-[130px] top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 w-[240px] max-h-[220px] overflow-y-auto p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-left-2 duration-150">
                        <div className="px-2 py-1 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                            <span>Filtrar {title}</span>
                            <button onClick={() => setIsOpen(false)} className="text-[10px] text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer">✕</button>
                        </div>
                        {allowAll && (
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
                        )}
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
                                    {title === 'Año' ? `Año ${opt}` : opt}
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
                            }} 
                            className={`w-full h-8 flex items-center justify-center text-center px-2 text-[11.5px] font-black rounded-lg transition-all cursor-pointer ${groupBy === 'petral' && filterVessel === 'ALL' && filterPort === 'ALL' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-white text-sky-700 border border-slate-200 hover:bg-slate-100 font-extrabold'}`}
                        >
                            PETRAL (Todo)
                        </button>
                        <div className="h-px w-full bg-slate-200 my-0.5"></div>
                        
                        {/* Cliente filter row */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => setGroupBy('client')} className={`w-[75px] shrink-0 h-7.5 flex items-center justify-center text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${groupBy === 'client' || filterClient !== 'ALL' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>
                                Cliente
                            </button>
                            {renderFilterDropdown(filterClient, setFilterClient, filterOptions.clients, isClientFilterOpen, setIsClientFilterOpen, 'Cliente', true)}
                        </div>

                        {/* Puerto filter row */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => setGroupBy('port')} className={`w-[75px] shrink-0 h-7.5 flex items-center justify-center text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${groupBy === 'port' || filterPort !== 'ALL' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>
                                Puerto
                            </button>
                            {renderFilterDropdown(filterPort, setFilterPort, filterOptions.ports, isPortFilterOpen, setIsPortFilterOpen, 'Puerto', true)}
                        </div>

                        {/* Buque filter row */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => setGroupBy('vessel')} className={`w-[75px] shrink-0 h-7.5 flex items-center justify-center text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${groupBy === 'vessel' || filterVessel !== 'ALL' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>
                                Buque
                            </button>
                            {renderFilterDropdown(filterVessel, setFilterVessel, filterOptions.vessels, isVesselFilterOpen, setIsVesselFilterOpen, 'Buque', true)}
                        </div>

                        {/* Año filter row (Sin opción 'Todos') */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => {}} className="w-[75px] shrink-0 h-7.5 flex items-center justify-center text-[11px] font-extrabold rounded-lg transition-all cursor-default bg-white text-slate-700 border border-slate-200">
                                Año
                            </button>
                            {renderFilterDropdown(filterYear, setFilterYear, filterOptions.years, isYearFilterOpen, setIsYearFilterOpen, 'Año', false)}
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
                            {/* Columna Izquierda: Tipo de Gráfico */}
                            <div className="flex flex-col gap-1 w-9 shrink-0">
                                <button 
                                    onClick={() => setPrimaryGraphType('bar_stack')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${primaryGraphType === 'bar_stack' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-55'}`}
                                    title="Barras Stack (Viajes)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="13" width="10" height="4" rx="1"/><rect x="7" y="7" width="10" height="4" rx="1"/></svg>
                                </button>
                            </div>

                            {/* Columna Derecha: Control de Etiquetas */}
                            <div className="flex-1 flex flex-col gap-1">
                                <button
                                    onClick={() => setPrimaryLabelColor(primaryLabelColor === '#ffffff' ? '#000000' : '#ffffff')}
                                    className={`w-full text-center py-1 text-[10px] font-extrabold rounded border transition-colors shadow-sm cursor-pointer ${primaryLabelColor === '#ffffff' ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'}`}
                                    title="Alternar Color Rótulos (Blanco/Negro)"
                                >
                                    Rótulo Viaje
                                </button>
                                <div className="flex flex-col rounded border border-slate-200 overflow-hidden bg-white mt-1 w-full">
                                    {(['none', 'inside', 'top'] as const).map(pos => (
                                        <button
                                            key={pos}
                                            onClick={() => setPrimaryLabelPos(pos)}
                                            className={`text-[9px] font-bold py-1 px-1 transition-all cursor-pointer border-b last:border-0 border-slate-100 ${primaryLabelPos === pos ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            {pos === 'none' ? 'Ocultar' : (pos === 'inside' ? 'V.###' : 'Encima')}
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
                            {/* Columna Izquierda: Tipo de Gráfico */}
                            <div className="flex flex-col gap-1 w-9 shrink-0">
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
                        <p className="text-slate-500 text-xs font-semibold">Procesando gráficos ECharts por viaje...</p>
                    </div>
                )}
            </div>

        </div>
    );
};
