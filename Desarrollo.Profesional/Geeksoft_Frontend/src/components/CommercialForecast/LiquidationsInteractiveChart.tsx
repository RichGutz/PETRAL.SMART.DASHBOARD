import React, { useMemo, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';

interface LiquidationsInteractiveChartProps {
    liquidations: any[];
}

type GroupBy = 'vessel' | 'route' | 'client' | 'petral';
type PlotMetric = 'net_profit_usd' | 'tce_usd_day' | 'gross_revenue_usd' | 'cargo_quantity_mt' | 'port_costs_usd' | 'bunker_costs_usd' | 'yield_flete' | 'total_duration_days' | 'none';

const getHexColor = (name: string, type: GroupBy) => {
    if (type === 'petral') return '#0089CF';
    if (type === 'client') {
        if (name.includes('SPCC')) return '#0369A1';
        if (name.includes('NEXA')) return '#7C3AED';
        return '#1E3A8A';
    }
    if (type === 'route') {
        if (name.includes('MATARANI')) return '#06B6D4';
        if (name.includes('MARCONA')) return '#A855F7';
        if (name.includes('MEJILLONES')) return '#D946EF';
        if (name.includes('CALLAO')) return '#3B82F6';
        return '#334155';
    }
    if (type === 'vessel') {
        if (name.includes('TABLONES')) return '#DC2626';
        if (name.includes('MOQUEGUA')) return '#16A34A';
        return '#475569';
    }
    return '#2563EB';
};

export const LiquidationsInteractiveChart: React.FC<LiquidationsInteractiveChartProps> = ({ liquidations }) => {
    const [groupBy, setGroupBy] = useState<GroupBy>('vessel');
    const [filterClient, setFilterClient] = useState<string>('ALL');
    const [filterRoute, setFilterRoute] = useState<string>('ALL');
    const [filterVessel, setFilterVessel] = useState<string>('ALL');

    // Eje Primario
    const [primaryMetric, setPrimaryMetric] = useState<PlotMetric>('net_profit_usd');
    const [primaryGraphType, setPrimaryGraphType] = useState<'bar_stack' | 'bar_group' | 'line' | 'line_straight'>('bar_stack');

    // Eje Secundario
    const [secondaryMetric, setSecondaryMetric] = useState<PlotMetric>('tce_usd_day');
    const [secondaryGraphType, setSecondaryGraphType] = useState<'bar' | 'line' | 'line_straight'>('line');

    // Acumulaciones secundarias
    const [isSecondaryCumulativeSeries, setIsSecondaryCumulativeSeries] = useState<boolean>(false);
    const [isSecondaryPercentage, setIsSecondaryPercentage] = useState<boolean>(false);

    // Desplegables
    const [isPriOpen, setIsPriOpen] = useState<boolean>(false);
    const [isSecOpen, setIsSecOpen] = useState<boolean>(false);

    // Labels limpios arriba por defecto
    const [primaryLabelPos, setPrimaryLabelPos] = useState<'inside' | 'top' | 'none'>('top');
    const [primaryLabelColor, setPrimaryLabelColor] = useState<'#ffffff' | '#000000'>('#000000');
    const [secondaryLabelPos, setSecondaryLabelPos] = useState<'inside' | 'top' | 'none'>('none');
    const [secondaryLabelColor, setSecondaryLabelColor] = useState<'#ffffff' | '#000000'>('#000000');

    // Filter Popovers
    const [isClientFilterOpen, setIsClientFilterOpen] = useState(false);
    const [isRouteFilterOpen, setIsRouteFilterOpen] = useState(false);
    const [isVesselFilterOpen, setIsVesselFilterOpen] = useState(false);

    useEffect(() => {
        const handleOutsideClick = () => {
            setIsPriOpen(false);
            setIsSecOpen(false);
            setIsClientFilterOpen(false);
            setIsRouteFilterOpen(false);
            setIsVesselFilterOpen(false);
        };
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, []);

    const filterOptions = useMemo(() => {
        const clients = new Set<string>();
        const routes = new Set<string>();
        const vessels = new Set<string>();

        liquidations.forEach(r => {
            if (r.client_name) clients.add(r.client_name);
            const rt = `${r.pol_port} -> ${r.pod_port}`;
            routes.add(rt);
            if (r.vessel_name) vessels.add(r.vessel_name);
        });

        return {
            clients: Array.from(clients).sort(),
            routes: Array.from(routes).sort(),
            vessels: Array.from(vessels).sort()
        };
    }, [liquidations]);

    const monthsAxisKeys = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];

    const getVoyageMonthKey = (r: any): string => {
        const code = String(r.voyage_code || '').toUpperCase();
        const vName = String(r.vessel_name || '').toUpperCase();
        const vNum = parseInt(code.replace(/\D/g, '')) || 0;

        // B/T TABLONES (v.038 a v.052)
        if (vName.includes('TABLONES') || code.includes('TABLONES') || (vNum >= 38 && vNum <= 52)) {
            if (vNum <= 40) return '2026-01'; // Ene 26: v.038, v.039, v.040
            if (vNum <= 43) return '2026-02'; // Feb 26: v.041, v.042, v.043
            if (vNum <= 45) return '2026-03'; // Mar 26: v.044 NEXA, v.045
            if (vNum <= 47) return '2026-04'; // Abr 26: v.046, v.047
            if (vNum <= 50) return '2026-05'; // May 26: v.048, v.049, v.050
            return '2026-06';                 // Jun 26: v.051, v.052
        }

        // B/T MOQUEGUA (V.761 a V.777)
        if (vNum <= 762) return '2026-01';     // Ene 26: V.761, V.762
        if (vNum <= 765) return '2026-02';     // Feb 26: V.763 NEXA, V.764, V.765
        if (vNum <= 768) return '2026-03';     // Mar 26: V.766, V.767, V.768
        if (vNum <= 771) return '2026-04';     // Abr 26: V.769, V.770, V.771
        if (vNum <= 774) return '2026-05';     // May 26: V.772, V.773, V.774 NEXA
        return '2026-06';                     // Jun 26: V.775, V.776, V.777
    };

    // Ordenar viajes cronológicamente
    const sortedFilteredData = useMemo(() => {
        const filtered = liquidations.filter(r => {
            if (filterClient !== 'ALL' && r.client_name !== filterClient) return false;
            const rt = `${r.pol_port} -> ${r.pod_port}`;
            if (filterRoute !== 'ALL' && rt !== filterRoute) return false;
            if (filterVessel !== 'ALL' && r.vessel_name !== filterVessel) return false;
            return true;
        });

        return filtered.sort((a, b) => {
            const codeA = a.voyage_code || '';
            const codeB = b.voyage_code || '';
            return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
        });
    }, [liquidations, filterClient, filterRoute, filterVessel]);

    const getMetricLabel = (m: PlotMetric) => {
        switch (m) {
            case 'net_profit_usd': return 'Profit Real (P/L)';
            case 'tce_usd_day': return 'TCE Real ($/día)';
            case 'gross_revenue_usd': return 'Gross Revenue';
            case 'cargo_quantity_mt': return 'Toneladas (MT)';
            case 'port_costs_usd': return 'Port Costs';
            case 'bunker_costs_usd': return 'Bunker Costs';
            case 'yield_flete': return 'Yield Flete ($/MT)';
            case 'total_duration_days': return 'Duración (Días)';
            case 'none': return 'Ninguna';
            default: return m;
        }
    };

    const getMetricValue = (r: any, m: PlotMetric) => {
        if (m === 'none') return 0;
        if (m === 'net_profit_usd') return Number(r.net_profit_usd) || 0;
        if (m === 'tce_usd_day') return Number(r.tce_usd_day) || 0;
        if (m === 'gross_revenue_usd') return Number(r.gross_revenue_usd) || 0;
        if (m === 'cargo_quantity_mt') return Number(r.cargo_quantity_mt) || 0;
        if (m === 'port_costs_usd') {
            const p = r.details?.port_expenses?.total_port_cost_usd || (r.details?.port_expenses?.total_agency_usd || 0);
            return Number(p);
        }
        if (m === 'bunker_costs_usd') {
            const b = r.details?.bunker_expenses?.total_bunker_cost_usd || 0;
            return Number(b);
        }
        if (m === 'yield_flete') return Number(r.freight_rate_usd) || 0;
        if (m === 'total_duration_days') return Number(r.details?.consumption_and_duration?.duration_days?.total_duration_days || 0);
        return 0;
    };

    // DETERMINAR SI MOSTRAR EJE X POR MESES (bar_stack) O POR VIAJES UNO AL LADO DEL OTRO (bar_group)
    const isGroupGranularVoyages = primaryGraphType === 'bar_group' || primaryGraphType.includes('line');

    const xAxisLabels = useMemo(() => {
        if (isGroupGranularVoyages) {
            // Eje X mostrando CADA VIAJE INDIVIDUAL UNO AL LADO DEL OTRO
            return sortedFilteredData.map(r => `${r.voyage_code}`);
        }
        // Eje X por MESES DEL AÑO (Ene 26 - Jun 26)
        return ['Ene 26', 'Feb 26', 'Mar 26', 'Abr 26', 'May 26', 'Jun 26'];
    }, [isGroupGranularVoyages, sortedFilteredData]);

    const options = useMemo(() => {
        if (sortedFilteredData.length === 0) return {};

        if (isGroupGranularVoyages) {
            // ── MODO 1: VIAJES INDIVIDUALES UNO AL LADO DEL OTRO (bar_group / line) ──
            const seriesGroupMap: Record<string, number[]> = {};

            sortedFilteredData.forEach((r) => {
                let sKey = r.vessel_name;
                if (groupBy === 'petral') sKey = 'PETRAL';
                if (groupBy === 'route') sKey = `${r.pol_port} -> ${r.pod_port}`;
                if (groupBy === 'client') sKey = r.client_name;

                if (!seriesGroupMap[sKey]) {
                    seriesGroupMap[sKey] = new Array(sortedFilteredData.length).fill(0);
                }
            });

            const buildSeriesList = (metric: PlotMetric, graphType: string, yAxisIndex: number) => {
                if (metric === 'none') return [];

                const labelPos = yAxisIndex === 0 ? primaryLabelPos : secondaryLabelPos;
                const labelColor = yAxisIndex === 0 ? primaryLabelColor : secondaryLabelColor;
                const isBar = graphType.includes('bar');

                const seriesKeys = Object.keys(seriesGroupMap);

                return seriesKeys.map(sKey => {
                    const dataArr = sortedFilteredData.map(r => {
                        let rKey = r.vessel_name;
                        if (groupBy === 'petral') rKey = 'PETRAL';
                        if (groupBy === 'route') rKey = `${r.pol_port} -> ${r.pod_port}`;
                        if (groupBy === 'client') rKey = r.client_name;

                        if (rKey === sKey) {
                            return Math.round(getMetricValue(r, metric));
                        }
                        return 0;
                    });

                    const cColor = getHexColor(sKey, groupBy);

                    return {
                        name: `${sKey} ${yAxisIndex === 0 ? '(Pri)' : '(Sec)'}`,
                        type: isBar ? 'bar' : 'line',
                        yAxisIndex: yAxisIndex,
                        smooth: graphType === 'line',
                        symbol: graphType.includes('line') ? 'circle' : undefined,
                        symbolSize: graphType.includes('line') ? 7 : undefined,
                        barMaxWidth: 35,
                        barGap: '10%',
                        data: dataArr,
                        itemStyle: { 
                            borderRadius: isBar ? [3, 3, 0, 0] : undefined, 
                            color: cColor 
                        },
                        lineStyle: graphType.includes('line') ? { width: 3, type: yAxisIndex === 1 ? 'dashed' : 'solid' } : undefined,
                        label: {
                            show: labelPos !== 'none',
                            position: labelPos === 'none' ? undefined : labelPos,
                            formatter: (params: any) => {
                                if (params.value === 0) return '';
                                return `$${(params.value / 1000).toFixed(0)}k`;
                            },
                            fontSize: 9,
                            fontWeight: 'bold',
                            color: labelColor
                        }
                    };
                });
            };

            const priSeries = buildSeriesList(primaryMetric, primaryGraphType, 0);
            const secSeries = buildSeriesList(secondaryMetric, secondaryGraphType, 1);

            return {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'cross', crossStyle: { color: '#94A3B8' } },
                    formatter: (params: any[]) => {
                        if (!params || params.length === 0) return '';
                        const index = params[0].dataIndex;
                        const r = sortedFilteredData[index];
                        let html = `<div style="font-weight:bold;margin-bottom:4px;border-bottom:1px solid #cbd5e1;padding-bottom:2px;font-size:12px;">
                            ${r.voyage_code} (${r.client_name}) — ${r.pol_port} ➔ ${r.pod_port}
                        </div>`;

                        params.forEach(p => {
                            if (p.value !== 0) {
                                html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11px;margin-top:2px;">
                                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${p.color};"></span>
                                    <span style="color:#475569;">${p.seriesName}:</span>
                                    <span style="font-weight:bold;color:#0F172A;">$${p.value.toLocaleString()}</span>
                                </div>`;
                            }
                        });

                        if (r.tce_usd_day) {
                            html += `<div style="margin-top:4px;font-size:10px;color:#0284C7;font-weight:bold;">⚡ TCE Real: $${Math.round(r.tce_usd_day).toLocaleString()} / día</div>`;
                        }

                        return html;
                    }
                },
                legend: { top: 0, type: 'scroll', textStyle: { fontSize: 11, fontWeight: 'bold', color: '#334155' } },
                grid: { left: '3%', right: '4%', bottom: '12%', top: '12%', containLabel: true },
                xAxis: [{
                    type: 'category',
                    name: 'Viajes Reales (Uno al Lado del Otro)',
                    nameLocation: 'middle',
                    nameGap: 32,
                    nameTextStyle: { fontWeight: 'bold', fontSize: 11, color: '#475569' },
                    data: xAxisLabels,
                    axisPointer: { type: 'shadow' },
                    axisLabel: { interval: 0, rotate: 30, fontWeight: 'bold', fontSize: 10, color: '#1E293B' }
                }],
                yAxis: [
                    {
                        type: 'value',
                        name: getMetricLabel(primaryMetric),
                        nameTextStyle: { fontWeight: 'bold', fontSize: 11, color: '#0284C7' },
                        axisLabel: { formatter: (val: number) => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}` },
                        splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } }
                    },
                    {
                        type: 'value',
                        name: secondaryMetric !== 'none' ? getMetricLabel(secondaryMetric) : '',
                        nameTextStyle: { fontWeight: 'bold', fontSize: 11, color: '#059669' },
                        show: secondaryMetric !== 'none',
                        axisLabel: { formatter: (val: number) => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}` },
                        splitLine: { show: false }
                    }
                ],
                series: [...priSeries, ...secSeries]
            };
        }

        // ── MODO 2: BARRAS APILADAS POR MESES (bar_stack) ──
        const seriesGroupMap: Record<string, Record<string, { totalVal: number; count: number; voyages: string[] }>> = {};

        filteredData.forEach((r) => {
            let sKey = r.vessel_name;
            if (groupBy === 'petral') sKey = 'PETRAL';
            if (groupBy === 'route') sKey = `${r.pol_port} -> ${r.pod_port}`;
            if (groupBy === 'client') sKey = r.client_name;

            const mKey = getVoyageMonthKey(r);

            if (!seriesGroupMap[sKey]) seriesGroupMap[sKey] = {};
            monthsAxisKeys.forEach(m => {
                if (!seriesGroupMap[sKey][m]) {
                    seriesGroupMap[sKey][m] = { totalVal: 0, count: 0, voyages: [] };
                }
            });

            seriesGroupMap[sKey][mKey].count += 1;
            const vCode = r.voyage_code ? r.voyage_code : '';
            if (vCode && !seriesGroupMap[sKey][mKey].voyages.includes(vCode)) {
                seriesGroupMap[sKey][mKey].voyages.push(vCode);
            }
        });

        filteredData.forEach((r) => {
            let sKey = r.vessel_name;
            if (groupBy === 'petral') sKey = 'PETRAL';
            if (groupBy === 'route') sKey = `${r.pol_port} -> ${r.pod_port}`;
            if (groupBy === 'client') sKey = r.client_name;

            const mKey = getVoyageMonthKey(r);

            if (seriesGroupMap[sKey] && seriesGroupMap[sKey][mKey]) {
                const pVal = getMetricValue(r, primaryMetric);
                seriesGroupMap[sKey][mKey].totalVal += pVal;
            }
        });

        const buildSeriesList = (metric: PlotMetric, graphType: string, yAxisIndex: number) => {
            if (metric === 'none') return [];

            const labelPos = yAxisIndex === 0 ? primaryLabelPos : secondaryLabelPos;
            const labelColor = yAxisIndex === 0 ? primaryLabelColor : secondaryLabelColor;

            const seriesKeys = Object.keys(seriesGroupMap);

            return seriesKeys.map(sKey => {
                let runningVal = 0;

                const dataArr = monthsAxisKeys.map(mKey => {
                    const cell = seriesGroupMap[sKey]?.[mKey];
                    if (!cell || cell.count === 0) {
                        return { value: 0, voyagesStr: '' };
                    }

                    let val = Math.round(cell.totalVal);
                    if (metric === 'tce_usd_day' || metric === 'yield_flete') {
                        val = Math.round(cell.totalVal / cell.count);
                    }

                    runningVal += val;
                    const finalVal = (yAxisIndex === 1 && isSecondaryCumulativeSeries) ? runningVal : val;
                    const voyagesStr = cell.voyages.join(', ');

                    return {
                        value: finalVal,
                        voyagesStr: voyagesStr
                    };
                });

                const cColor = getHexColor(sKey, groupBy);

                return {
                    name: `${sKey} ${yAxisIndex === 0 ? '(Pri)' : '(Sec)'}`,
                    type: 'bar',
                    stack: `total_${yAxisIndex}`,
                    yAxisIndex: yAxisIndex,
                    barMaxWidth: 45,
                    data: dataArr,
                    itemStyle: { 
                        borderRadius: [2, 2, 0, 0], 
                        color: cColor 
                    },
                    label: {
                        show: labelPos !== 'none',
                        position: labelPos === 'none' ? undefined : labelPos,
                        formatter: (params: any) => {
                            if (!params.data || params.data.value === 0) return '';
                            return `$${(params.data.value / 1000).toFixed(0)}k`;
                        },
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: labelColor
                    }
                };
            });
        };

        const priSeries = buildSeriesList(primaryMetric, primaryGraphType, 0);
        const secSeries = buildSeriesList(secondaryMetric, secondaryGraphType, 1);

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross', crossStyle: { color: '#94A3B8' } },
                formatter: (params: any[]) => {
                    if (!params || params.length === 0) return '';
                    const mName = params[0].name;
                    let html = `<div style="font-weight:bold;margin-bottom:6px;border-bottom:1px solid #cbd5e1;padding-bottom:4px;font-size:12px;color:#0F172A;">
                        📅 Período: ${mName}
                    </div>`;

                    params.forEach(p => {
                        if (p.value !== 0 && p.data) {
                            const valStr = typeof p.data === 'object' ? p.data.value : p.value;
                            const vStr = p.data?.voyagesStr ? `<br/><span style="color:#0284C7;font-weight:bold;font-size:10px;padding-left:14px;">Viajes: ${p.data.voyagesStr}</span>` : '';
                            html += `<div style="margin-top:4px;">
                                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11px;">
                                    <div>
                                        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${p.color};"></span>
                                        <span style="color:#475569;font-weight:bold;">${p.seriesName}:</span>
                                    </div>
                                    <span style="font-weight:extrabold;color:#0F172A;">$${valStr.toLocaleString()}</span>
                                </div>
                                ${vStr}
                            </div>`;
                        }
                    });

                    return html;
                }
            },
            legend: { top: 0, type: 'scroll', textStyle: { fontSize: 11, fontWeight: 'bold', color: '#334155' } },
            grid: { left: '3%', right: '4%', bottom: '8%', top: '12%', containLabel: true },
            xAxis: [{
                type: 'category',
                name: 'Meses del Año (Eje X)',
                nameLocation: 'middle',
                nameGap: 28,
                nameTextStyle: { fontWeight: 'bold', fontSize: 11, color: '#475569' },
                data: xAxisLabels,
                axisPointer: { type: 'shadow' },
                axisLabel: { interval: 0, fontWeight: 'bold', fontSize: 11, color: '#1E293B' }
            }],
            yAxis: [
                {
                    type: 'value',
                    name: getMetricLabel(primaryMetric),
                    nameTextStyle: { fontWeight: 'bold', fontSize: 11, color: '#0284C7' },
                    axisLabel: { formatter: (val: number) => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}` },
                    splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } }
                },
                {
                    type: 'value',
                    name: secondaryMetric !== 'none' ? getMetricLabel(secondaryMetric) : '',
                    nameTextStyle: { fontWeight: 'bold', fontSize: 11, color: '#059669' },
                    show: secondaryMetric !== 'none',
                    axisLabel: { formatter: (val: number) => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}` },
                    splitLine: { show: false }
                }
            ],
            series: [...priSeries, ...secSeries]
        };
    }, [sortedFilteredData, isGroupGranularVoyages, xAxisLabels, groupBy, primaryMetric, primaryGraphType, secondaryMetric, secondaryGraphType, isSecondaryCumulativeSeries, primaryLabelPos, primaryLabelColor, secondaryLabelPos, secondaryLabelColor]);

    const renderFilterDropdown = (
        selectedVal: string, 
        onSelect: (val: string) => void, 
        optionsList: string[],
        isOpen: boolean, 
        setIsOpen: (open: boolean) => void,
        title: string
    ) => {
        return (
            <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={() => {
                        setIsClientFilterOpen(false);
                        setIsRouteFilterOpen(false);
                        setIsVesselFilterOpen(false);
                        setIsPriOpen(false);
                        setIsSecOpen(false);
                        setIsOpen(!isOpen);
                    }}
                    className="w-full flex items-center justify-between gap-1 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded hover:border-slate-350 focus:outline-none transition-all cursor-pointer text-slate-700 font-bold"
                >
                    <span className="truncate">{selectedVal === 'ALL' ? 'Todos' : selectedVal}</span>
                    <span className="text-[8px] text-slate-400 shrink-0">{isOpen ? '▲' : '▼'}</span>
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
                        {optionsList.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => {
                                    onSelect(opt);
                                    setIsOpen(false);
                                }}
                                className={`text-left text-[11px] p-1.5 rounded transition-all cursor-pointer border truncate ${
                                    opt === selectedVal 
                                        ? 'bg-blue-50 border-blue-200 font-bold text-blue-900' 
                                        : 'border-transparent hover:bg-slate-50 font-medium text-slate-600'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const metricOptionsList: { value: PlotMetric; label: string; icon: string; desc: string }[] = [
        { value: 'net_profit_usd', label: 'Profit Real (P/L)', icon: '💰', desc: 'Utilidad Neta Real por Viaje ($USD)' },
        { value: 'tce_usd_day', label: 'TCE Real ($/día)', icon: '⚡', desc: 'Time Charter Equivalent Real Diario' },
        { value: 'gross_revenue_usd', label: 'Gross Revenue', icon: '💵', desc: 'Facturación Bruta Total del Viaje' },
        { value: 'cargo_quantity_mt', label: 'Toneladas (MT)', icon: '📦', desc: 'Carga Total Transportada en MT' },
        { value: 'port_costs_usd', label: 'Port Costs', icon: '⚓', desc: 'Desembolsos y Gastos Portuarios' },
        { value: 'bunker_costs_usd', label: 'Bunker Costs', icon: '⛽', desc: 'Costo Total de Búnker Consumido' },
        { value: 'yield_flete', label: 'Yield Flete ($/MT)', icon: '📈', desc: 'Tarifa Flete por Tonelada' },
        { value: 'total_duration_days', label: 'Duración (Días)', icon: '⏱️', desc: 'Duración Total Operativa del Viaje' },
    ];

    const renderCustomDropdown = (
        selectedVal: PlotMetric, 
        onSelect: (val: PlotMetric) => void, 
        isOpen: boolean, 
        setIsOpen: (open: boolean) => void,
        colorClass: 'blue' | 'emerald'
    ) => {
        const currentOpt = metricOptionsList.find(o => o.value === selectedVal) || metricOptionsList[0];

        return (
            <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between p-2 rounded-md border shadow-sm transition-all cursor-pointer bg-white ${
                        colorClass === 'blue' ? 'border-blue-200 hover:border-blue-300' : 'border-emerald-200 hover:border-emerald-300'
                    }`}
                >
                    <div className="flex items-center gap-2 truncate">
                        <span className="text-sm shrink-0">{currentOpt.icon}</span>
                        <div className="flex flex-col text-left truncate">
                            <span className={`text-[11px] font-extrabold truncate ${colorClass === 'blue' ? 'text-blue-900' : 'text-emerald-900'}`}>
                                {currentOpt.label}
                            </span>
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 w-[240px] p-1 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        {metricOptionsList.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => { onSelect(opt.value); setIsOpen(false); }}
                                className={`text-left p-1.5 flex flex-col gap-0.5 rounded hover:bg-slate-50 transition-all cursor-pointer border ${
                                    selectedVal === opt.value 
                                        ? (colorClass === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200') 
                                        : 'border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm shrink-0">{opt.icon}</span>
                                    <span className="text-[11px] font-bold text-slate-800">{opt.label}</span>
                                </div>
                                <span className="text-[9px] text-slate-400 pl-5">{opt.desc}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full bg-white pt-4 pb-6 px-6 shadow-sm rounded-b-lg flex flex-row gap-6 items-stretch min-h-[calc(100vh-220px)]">
            
            {/* SIDEBAR IZQUIERDO DE CONTROLES (ANCHO FIX W-[240PX]) */}
            <div className="flex flex-col gap-3 shrink-0 w-[240px]">
                
                {/* 1. BLOQUE DE FILTROS (SLATE) */}
                <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className="bg-slate-700 w-7 flex items-center justify-center shrink-0 rounded-l-lg">
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Filtros</span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col gap-2 bg-slate-50/50 rounded-r-lg relative">
                        <button 
                            onClick={() => setGroupBy('petral')} 
                            className={`w-full h-8 flex items-center justify-center text-center px-2 text-[12px] font-extrabold rounded-md transition-colors cursor-pointer ${
                                groupBy === 'petral' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-blue-600 border border-slate-300 hover:bg-slate-100'
                            }`}
                        >
                            PETRAL (Todo)
                        </button>
                        <div className="h-px w-full bg-slate-200 my-0.5"></div>
                        
                        {/* Cliente */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => setGroupBy('client')} className={`w-[75px] shrink-0 h-8 flex items-center justify-center text-[11px] font-bold rounded-md transition-colors cursor-pointer ${groupBy === 'client' || filterClient !== 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                Cliente
                            </button>
                            {renderFilterDropdown(filterClient, setFilterClient, filterOptions.clients, isClientFilterOpen, setIsClientFilterOpen, 'Cliente')}
                        </div>

                        {/* Ruta */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => setGroupBy('route')} className={`w-[75px] shrink-0 h-8 flex items-center justify-center text-[11px] font-bold rounded-md transition-colors cursor-pointer ${groupBy === 'route' || filterRoute !== 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                Ruta
                            </button>
                            {renderFilterDropdown(filterRoute, setFilterRoute, filterOptions.routes, isRouteFilterOpen, setIsRouteFilterOpen, 'Ruta')}
                        </div>

                        {/* Buque */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => setGroupBy('vessel')} className={`w-[75px] shrink-0 h-8 flex items-center justify-center text-[11px] font-bold rounded-md transition-colors cursor-pointer ${groupBy === 'vessel' || filterVessel !== 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                Buque
                            </button>
                            {renderFilterDropdown(filterVessel, setFilterVessel, filterOptions.vessels, isVesselFilterOpen, setIsVesselFilterOpen, 'Buque')}
                        </div>
                    </div>
                </div>

                {/* 2. BLOQUE EJE PRIMARIO (AZUL) */}
                <div className="flex bg-white rounded-lg border border-blue-200 shadow-sm">
                    <div className="bg-blue-600 w-7 flex items-center justify-center shrink-0 rounded-l-lg">
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Eje Primario</span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col gap-2.5 bg-blue-50/30 rounded-r-lg relative">
                        {renderCustomDropdown(primaryMetric, setPrimaryMetric, isPriOpen, setIsPriOpen, 'blue')}

                        <div className="flex flex-row gap-4 pt-2 border-t border-blue-200/40 mt-1">
                            {/* Iconos de Tipo de Gráfico */}
                            <div className="flex flex-col gap-1 w-9 shrink-0">
                                <button 
                                    onClick={() => setPrimaryGraphType('bar_stack')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${primaryGraphType === 'bar_stack' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                    title="Barras Stack (Por Meses)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><rect x="7" y="13" width="10" height="4" rx="1"/><rect x="7" y="7" width="10" height="4" rx="1"/></svg>
                                </button>
                                <button 
                                    onClick={() => setPrimaryGraphType('bar_group')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${primaryGraphType === 'bar_group' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                    title="Barras Adjuntas (Viaje por Viaje uno al lado del otro)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18"/><path d="M7 17v-6"/><path d="M11 17V9"/><path d="M15 17v-4"/><path d="M19 17V5"/></svg>
                                </button>
                                <button 
                                    onClick={() => setPrimaryGraphType('line')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${primaryGraphType === 'line' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                    title="Línea Suavizada"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18"/><path d="M7 17c2-5 4-10 8-10s6 5 8 5"/></svg>
                                </button>
                                <button 
                                    onClick={() => setPrimaryGraphType('line_straight')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${primaryGraphType === 'line_straight' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                    title="Línea Recta"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18"/><path d="M7 15l5-8 5 6 4-6"/></svg>
                                </button>
                            </div>

                            {/* Control de Etiquetas */}
                            <div className="flex-1 flex flex-col gap-1">
                                <button
                                    onClick={() => setPrimaryLabelColor(primaryLabelColor === '#ffffff' ? '#000000' : '#ffffff')}
                                    className={`w-full text-center py-1 text-[10px] font-extrabold rounded border transition-colors shadow-sm cursor-pointer ${primaryLabelColor === '#ffffff' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-800 border-slate-200'}`}
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

                {/* 3. BLOQUE EJE SECUNDARIO (VERDE/EMERALD) */}
                <div className="flex bg-white rounded-lg border border-emerald-200 shadow-sm">
                    <div className="bg-emerald-600 w-7 flex items-center justify-center shrink-0 rounded-l-lg">
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Eje Secundario</span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col gap-2.5 bg-emerald-50/30 rounded-r-lg relative">
                        {renderCustomDropdown(secondaryMetric, setSecondaryMetric, isSecOpen, setIsSecOpen, 'emerald')}

                        <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-200/50 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-3 h-3 cursor-pointer" checked={isSecondaryCumulativeSeries} onChange={(e) => setIsSecondaryCumulativeSeries(e.target.checked)} />
                                <span className="text-[11px] font-medium text-slate-700">Acumular por serie</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-3 h-3 cursor-pointer" checked={isSecondaryPercentage} onChange={(e) => setIsSecondaryPercentage(e.target.checked)} />
                                <span className="text-[11px] font-medium text-slate-700">Mostrar en % (Share)</span>
                            </label>
                        </div>
                        
                        <div className="flex flex-row gap-4 pt-2 border-t border-emerald-200/40 mt-1">
                            {/* Iconos Eje Secundario */}
                            <div className="flex flex-col gap-1 w-9 shrink-0">
                                <button 
                                    onClick={() => setSecondaryGraphType('bar')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${secondaryGraphType === 'bar' ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                    title="Barras"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18"/><path d="M7 17v-6"/><path d="M11 17V9"/><path d="M15 17v-4"/><path d="M19 17V5"/></svg>
                                </button>
                                <button 
                                    onClick={() => setSecondaryGraphType('line')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${secondaryGraphType === 'line' ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                    title="Línea Suavizada"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18"/><path d="M7 17c2-5 4-10 8-10s6 5 8 5"/></svg>
                                </button>
                                <button 
                                    onClick={() => setSecondaryGraphType('line_straight')}
                                    className={`p-1.5 rounded border flex items-center justify-center transition-all cursor-pointer ${secondaryGraphType === 'line_straight' ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                    title="Línea Recta"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18"/><path d="M7 15l5-8 5 6 4-6"/></svg>
                                </button>
                            </div>

                            {/* Control de Etiquetas Secundario */}
                            <div className="flex-1 flex flex-col gap-1">
                                <button
                                    onClick={() => setSecondaryLabelColor(secondaryLabelColor === '#ffffff' ? '#000000' : '#ffffff')}
                                    className={`w-full text-center py-1 text-[10px] font-extrabold rounded border transition-colors shadow-sm cursor-pointer ${secondaryLabelColor === '#ffffff' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-800 border-slate-200'}`}
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

            {/* CONTENEDOR DEL GRÁFICO (COLUMNA DERECHA FLEX-1 MIN-H-[650PX]) */}
            <div className="flex-1 flex flex-col min-h-[650px] bg-white rounded-lg border border-slate-200 p-2 shadow-sm">
                <ReactECharts 
                    option={options} 
                    style={{ flex: 1, height: '100%', minHeight: '650px', width: '100%' }} 
                    notMerge={true} 
                    lazyUpdate={true}
                />
            </div>

        </div>
    );
};
