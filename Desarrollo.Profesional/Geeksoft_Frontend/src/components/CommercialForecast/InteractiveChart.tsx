import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';

interface InteractiveChartProps {
    data: any;
    months: string[];
}

type GroupBy = 'vessel' | 'route' | 'client' | 'petral';
type PlotMetric = 'viajes' | 'net_income' | 'total_port_costs' | 'total_bunker_costs' | 'voyage_result' | 'total_cargo' | 'none';

const getHexColor = (name: string, type: GroupBy) => {
    if (type === 'petral') return '#0089CF'; // Petral Blue (RGB 0-137-207)
    if (type === 'client') {
        if (name.includes('SPCC')) return '#0369A1';
        if (name.includes('SPOT')) return '#F97316';
        return '#1E3A8A';
    }
    if (type === 'route') {
        if (name.includes('MATARANI')) return '#06B6D4';
        if (name.includes('MARCONA')) return '#A855F7';
        if (name.includes('MEJILLONES')) return '#D946EF';
        if (name.includes('SPOT')) return '#F97316';
        return '#334155';
    }
    if (type === 'vessel') {
        if (name.includes('TABLONES')) return '#DC2626';
        if (name.includes('MOQUEGUA')) return '#16A34A';
        if (name.includes('CONCON')) return '#475569';
        if (name.includes('HUEMUL')) return '#4F46E5';
        return '#94A3B8';
    }
    return '#94A3B8';
};

export const InteractiveChart: React.FC<InteractiveChartProps> = ({ data, months }) => {
    const [groupBy, setGroupBy] = useState<GroupBy>('vessel');
    const [filterClient, setFilterClient] = useState<string>('ALL');
    const [filterRoute, setFilterRoute] = useState<string>('ALL');
    const [filterVessel, setFilterVessel] = useState<string>('ALL');

    // Primary Axis
    const [primaryMetric, setPrimaryMetric] = useState<PlotMetric>('voyage_result');
    const [primaryGraphType, setPrimaryGraphType] = useState<'bar_stack' | 'bar_group' | 'line'>('bar_stack');

    // Secondary Axis
    const [secondaryMetric, setSecondaryMetric] = useState<PlotMetric>('none');
    const [secondaryGraphType, setSecondaryGraphType] = useState<'bar' | 'line'>('line');
    const [isSecondaryCumulativeSeries, setIsSecondaryCumulativeSeries] = useState<boolean>(false);
    const [isSecondaryCumulativeGlobal, setIsSecondaryCumulativeGlobal] = useState<boolean>(false);
    const [isSecondaryPercentage, setIsSecondaryPercentage] = useState<boolean>(false);

    const filterOptions = useMemo(() => {
        const clients = new Set<string>();
        const routes = new Set<string>();
        const vessels = new Set<string>();

        if (data && data.aggregated_data) {
            Object.entries(data.aggregated_data).forEach(([c, rMap]: any) => {
                clients.add(c);
                Object.entries(rMap).forEach(([r, vMap]: any) => {
                    routes.add(r);
                    Object.keys(vMap).forEach(v => vessels.add(v));
                });
            });
        }

        return {
            clients: Array.from(clients).sort(),
            routes: Array.from(routes).sort(),
            vessels: Array.from(vessels).sort()
        };
    }, [data]);

    const options = useMemo(() => {
        if (!data || !data.aggregated_data || !months) return {};

        const seriesMapPri: { [key: string]: { [month: string]: number } } = {};
        const seriesMapSec: { [key: string]: { [month: string]: number } } = {};
        const totalPriMap: { [month: string]: number } = {};
        const totalSecMap: { [month: string]: number } = {};

        const getMetricLabel = (m: PlotMetric) => {
            switch (m) {
                case 'viajes': return 'Viajes';
                case 'voyage_result': return 'Voyage Result';
                case 'net_income': return 'Gross Revenue';
                case 'total_port_costs': return 'Port Costs';
                case 'total_bunker_costs': return 'Bunker Costs';
                case 'total_cargo': return 'Toneladas';
                case 'none': return '';
                default: return m;
            }
        };

        const getMetricValue = (metrics: any, m: PlotMetric) => {
            if (m === 'none') return 0;
            
            const rawFreq = metrics['raw_inputs']?.['monthly_frequency'];
            const freq = rawFreq !== undefined ? rawFreq : (metrics['freq'] !== undefined ? metrics['freq'] : 0);
            
            if (m === 'viajes') {
                return freq;
            }
            if (m === 'total_cargo') {
                const carga_unit = metrics['carga_unit'] || 0;
                return carga_unit * freq;
            }
            return metrics[m] || 0;
        };

        // Extract and aggregate
        Object.entries(data.aggregated_data).forEach(([client, routes]: any) => {
            if (filterClient !== 'ALL' && client !== filterClient) return;
            Object.entries(routes).forEach(([route, vessels]: any) => {
                if (filterRoute !== 'ALL' && route !== filterRoute) return;
                Object.entries(vessels).forEach(([vessel, mData]: any) => {
                    if (filterVessel !== 'ALL' && vessel !== filterVessel) return;

                    Object.entries(mData).forEach(([month, metrics]: any) => {
                        let key = vessel;
                        if (groupBy === 'client') key = client;
                        if (groupBy === 'route') key = route;
                        if (groupBy === 'petral') key = 'PETRAL';

                        if (!seriesMapPri[key]) {
                            seriesMapPri[key] = {};
                            seriesMapSec[key] = {};
                        }
                        
                        const priResult = getMetricValue(metrics, primaryMetric);
                        seriesMapPri[key][month] = (seriesMapPri[key][month] || 0) + priResult;
                        totalPriMap[month] = (totalPriMap[month] || 0) + priResult;

                        if (secondaryMetric !== 'none') {
                            const secResult = getMetricValue(metrics, secondaryMetric);
                            seriesMapSec[key][month] = (seriesMapSec[key][month] || 0) + secResult;
                            totalSecMap[month] = (totalSecMap[month] || 0) + secResult;
                        }
                    });
                });
            });
        });

        const xAxisData = months.map(m => {
            const date = new Date(`${m}-02`);
            const formatted = new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(date).replace('.', '');
            return formatted.charAt(0).toUpperCase() + formatted.slice(1);
        });

        const buildSeries = (
            seriesMap: any, 
            totalMap: any, 
            metric: PlotMetric, 
            graphType: string, 
            isCumulative: boolean, 
            isPercentage: boolean, 
            yAxisIndex: number
        ) => {
            if (metric === 'none') return [];
            
            const grandTotal = Object.values(totalMap).reduce((a: any, b: any) => a + b, 0) as number;
            
            return Object.entries(seriesMap).map(([name, mData]: [string, any]) => {
                let runningTotal = 0;
                let runningTotalOfTotals = 0;

                const dataArr = months.map(m => {
                    const val = mData[m] || 0;
                    const tot = totalMap[m] || 0;
                    
                    runningTotal += val;
                    runningTotalOfTotals += tot;

                    const finalVal = isCumulative ? runningTotal : val;
                    const finalTot = isCumulative ? runningTotalOfTotals : tot;

                    const pct = isCumulative ? (grandTotal ? (finalVal / grandTotal) * 100 : 0) : (finalTot ? (finalVal / finalTot) * 100 : 0);
                    
                    return {
                        value: isPercentage ? pct : finalVal,
                        pct: pct,
                        rawVal: finalVal
                    };
                });
                
                const cColor = getHexColor(name, groupBy);
                const isBar = graphType.includes('bar');
                const isStack = graphType === 'bar_stack' || (yAxisIndex === 1 && graphType === 'bar');

                return {
                    name: `${name} ${yAxisIndex === 0 ? '(Pri)' : '(Sec)'}`,
                    type: isBar ? 'bar' : 'line',
                    stack: isStack ? `total_${yAxisIndex}` : undefined,
                    yAxisIndex: yAxisIndex,
                    smooth: true,
                    symbol: graphType === 'line' ? 'circle' : undefined,
                    symbolSize: graphType === 'line' ? 8 : undefined,
                    barMaxWidth: isBar ? 40 : undefined,
                    barGap: isStack ? undefined : '10%',
                    data: dataArr,
                    itemStyle: { 
                        borderRadius: isBar ? [2, 2, 0, 0] : undefined, 
                        color: cColor 
                    },
                    lineStyle: graphType === 'line' ? { width: 3, type: yAxisIndex === 1 ? 'dashed' : 'solid' } : undefined,
                    label: {
                        show: isBar,
                        position: 'inside',
                        formatter: (params: any) => {
                            if (!isBar) return '';
                            const pct = params.data.pct;
                            if (isPercentage && pct < 4) return ''; 
                            if (!isPercentage && params.data.value === 0) return '';
                            
                            if (isPercentage) {
                                return `${pct.toFixed(1)}%`;
                            } else {
                                const val = params.data.value;
                                if (metric === 'viajes') return val.toString();
                                if (metric === 'total_cargo') return `${(val/1000).toFixed(0)}k`;
                                return val >= 1000 ? `$${(val/1000).toFixed(0)}k` : `$${val.toFixed(0)}`;
                            }
                        },
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: 10
                    }
                };
            });
        };

        const seriesPri = buildSeries(seriesMapPri, totalPriMap, primaryMetric, primaryGraphType, false, false, 0);
        const showSecIndividual = isSecondaryCumulativeSeries || !isSecondaryCumulativeGlobal;
        const seriesSec = showSecIndividual ? buildSeries(seriesMapSec, totalSecMap, secondaryMetric, secondaryGraphType, isSecondaryCumulativeSeries, isSecondaryPercentage, 1) : [];
        
        let globalSeries: any[] = [];
        if (isSecondaryCumulativeGlobal && secondaryMetric !== 'none') {
            const grandTotalSec = Object.values(totalSecMap).reduce((a: any, b: any) => a + b, 0) as number;
            let runningGlobal = 0;
            const globalData = xAxisData.map((_, i) => {
                const month = months[i];
                let val = 0;
                Object.values(seriesMapSec).forEach((mData: any) => {
                    val += (mData[month] || 0);
                });
                runningGlobal += val;
                
                // Active colors alternating logic
                const activeNames = Object.keys(seriesMapSec).filter(name => seriesMapSec[name][month] > 0);
                let colorToUse = '#1E293B';
                if (activeNames.length > 0) {
                    const colors = activeNames.map(name => getHexColor(name, groupBy));
                    colorToUse = colors[i % colors.length];
                }

                const globalPct = grandTotalSec ? (runningGlobal / grandTotalSec) * 100 : 0;
                return {
                    value: isSecondaryPercentage ? globalPct : runningGlobal,
                    pct: globalPct,
                    rawVal: runningGlobal,
                    itemStyle: { color: colorToUse }
                };
            });
            
            globalSeries.push({
                name: `Total Global (Sec)`,
                type: 'line',
                yAxisIndex: 1,
                smooth: true,
                symbol: 'circle',
                symbolSize: 10,
                data: globalData,
                lineStyle: { width: 3, type: 'dashed', color: '#94A3B8' },
                label: { show: false }
            });
        }
        
        const series = [...seriesPri, ...seriesSec, ...globalSeries];

        const getAxisFormatter = (metric: PlotMetric, isPct: boolean) => {
            if (isPct) return '{value}%';
            if (metric === 'viajes') return '{value}';
            if (metric === 'total_cargo') return (v: number) => `${(v/1000).toFixed(0)}k`;
            return (v: number) => `$${(v/1000).toFixed(0)}k`;
        };

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                formatter: (params: any) => {
                    let tooltip = `<div style="font-weight:600;margin-bottom:4px">${params[0].axisValue}</div>`;
                    params.forEach((p: any) => {
                        const isSec = p.seriesName.includes('(Sec)');
                        const m = isSec ? secondaryMetric : primaryMetric;
                        const isPct = isSec ? isSecondaryPercentage : false;
                        
                        let valStr = '';
                        if (isPct) {
                            valStr = `${p.value.toFixed(1)}% (${p.data.rawVal.toLocaleString()})`;
                        } else {
                            if (m === 'viajes') valStr = p.value.toString();
                            else if (m === 'total_cargo') valStr = `${Math.round(p.value).toLocaleString()} MT`;
                            else valStr = `$${Math.round(p.value).toLocaleString()}`;
                        }
                        
                        tooltip += `<div>${p.marker} <b>${p.seriesName.replace(' (Pri)','').replace(' (Sec)','')}</b>: ${valStr}</div>`;
                    });
                    return tooltip;
                }
            },
            legend: {
                top: 0,
                icon: 'circle',
                textStyle: { color: '#475569' }
            },
            grid: {
                left: 360, 
                right: 80,
                bottom: 30,
                top: 40,
                containLabel: false
            },
            xAxis: {
                type: 'category',
                data: xAxisData,
                axisLine: { lineStyle: { color: '#CBD5E1' } },
                axisLabel: { color: '#64748B', fontWeight: 'bold' }
            },
            yAxis: [
                {
                    type: 'value',
                    name: getMetricLabel(primaryMetric),
                    nameTextStyle: { color: '#0EA5E9', padding: [0, 0, 0, -40] },
                    axisLine: { show: false },
                    axisLabel: { color: '#64748B', fontWeight: 'bold', formatter: getAxisFormatter(primaryMetric, false) },
                    splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } }
                },
                {
                    type: 'value',
                    name: secondaryMetric === 'none' ? '' : getMetricLabel(secondaryMetric) + (isSecondaryCumulativeSeries || isSecondaryCumulativeGlobal ? ' (Acum)' : ''),
                    nameTextStyle: { color: '#F59E0B', padding: [0, -40, 0, 0] },
                    axisLine: { show: false },
                    axisLabel: { color: '#F59E0B', fontWeight: 'bold', formatter: getAxisFormatter(secondaryMetric, isSecondaryPercentage) },
                    splitLine: { show: false }
                }
            ],
            series,
            color: ['#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#10B981']
        };
    }, [data, groupBy, months, filterClient, filterRoute, filterVessel, primaryMetric, primaryGraphType, secondaryMetric, secondaryGraphType, isSecondaryCumulativeSeries, isSecondaryCumulativeGlobal, isSecondaryPercentage]);

    if (!data || !data.aggregated_data || months.length === 0) return null;

    const metricOptions = [
        { value: 'voyage_result', label: 'Voyage Result' },
        { value: 'net_income', label: 'Gross Revenue' },
        { value: 'total_port_costs', label: 'Port Costs' },
        { value: 'total_bunker_costs', label: 'Bunker Costs' },
        { value: 'total_cargo', label: 'Toneladas' },
        { value: 'viajes', label: 'Viajes' }
    ];

    return (
        <div className="w-full bg-white pt-6 pb-2 px-6 shadow-sm rounded-b-lg flex flex-col flex-1 relative min-h-[calc(100vh-220px)]">
            <div className="absolute left-6 top-10 flex flex-col gap-2 z-10 w-[240px]">
                
                {/* FILTROS TABS */}
                <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-700 w-7 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Filtros</span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col gap-2 bg-slate-50/50">
                        <button onClick={() => setGroupBy('petral')} className={`w-full h-[70px] flex items-center justify-center text-center px-2 text-[13px] font-extrabold rounded-md transition-colors ${groupBy === 'petral' ? 'bg-petral-blue text-white shadow-sm' : 'bg-white text-petral-blue border border-slate-300 hover:bg-slate-100'}`}>
                            PETRAL
                        </button>
                        <div className="h-px w-full bg-slate-200 my-0.5"></div>
                        
                        <div className="flex flex-col gap-1.5">
                            <button onClick={() => setGroupBy('client')} className={`w-full h-8 flex items-center px-2 text-[13px] font-bold rounded-md transition-colors ${groupBy === 'client' || filterClient !== 'ALL' ? 'bg-petral-blue text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                Cliente
                            </button>
                            <select className="w-full h-8 text-xs bg-white border border-slate-200 rounded px-1" value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
                                <option value="ALL">Todos</option>
                                {filterOptions.clients.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-1">
                            <button onClick={() => setGroupBy('route')} className={`w-full h-8 flex items-center px-2 text-[13px] font-bold rounded-md transition-colors ${groupBy === 'route' || filterRoute !== 'ALL' ? 'bg-petral-blue text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                Ruta
                            </button>
                            <select className="w-full h-8 text-xs bg-white border border-slate-200 rounded px-1" value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)}>
                                <option value="ALL">Todas</option>
                                {filterOptions.routes.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-1">
                            <button onClick={() => setGroupBy('vessel')} className={`w-full h-8 flex items-center px-2 text-[13px] font-bold rounded-md transition-colors ${groupBy === 'vessel' || filterVessel !== 'ALL' ? 'bg-petral-blue text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                Buque
                            </button>
                            <select className="w-full h-8 text-xs bg-white border border-slate-200 rounded px-1" value={filterVessel} onChange={(e) => setFilterVessel(e.target.value)}>
                                <option value="ALL">Todos</option>
                                {filterOptions.vessels.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* EJE PRIMARIO TABS */}
                <div className="flex bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
                    <div className="bg-blue-600 w-7 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Eje Primario</span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col gap-2.5 bg-blue-50/30">
                        <select className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5 font-bold" value={primaryMetric} onChange={(e) => setPrimaryMetric(e.target.value as PlotMetric)}>
                            {metricOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="priType" checked={primaryGraphType === 'bar_stack'} onChange={() => setPrimaryGraphType('bar_stack')} className="w-3 h-3" />
                                <span className="text-xs">Barras Stack</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="priType" checked={primaryGraphType === 'bar_group'} onChange={() => setPrimaryGraphType('bar_group')} className="w-3 h-3" />
                                <span className="text-xs">Barras Adjuntas</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="priType" checked={primaryGraphType === 'line'} onChange={() => setPrimaryGraphType('line')} className="w-3 h-3" />
                                <span className="text-xs">Línea</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* EJE SECUNDARIO TABS */}
                <div className="flex bg-white rounded-lg border border-amber-200 shadow-sm overflow-hidden">
                    <div className="bg-amber-500 w-7 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Eje Secundario</span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col gap-2.5 bg-amber-50/30">
                        <select className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5 font-bold" value={secondaryMetric} onChange={(e) => setSecondaryMetric(e.target.value as PlotMetric)}>
                            <option value="none">--- Ninguno ---</option>
                            {metricOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="secType" checked={secondaryGraphType === 'bar'} onChange={() => setSecondaryGraphType('bar')} className="w-3 h-3" />
                                <span className="text-xs">Barras</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="secType" checked={secondaryGraphType === 'line'} onChange={() => setSecondaryGraphType('line')} className="w-3 h-3" />
                                <span className="text-xs">Línea</span>
                            </label>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-3 h-3" checked={isSecondaryCumulativeSeries} onChange={(e) => setIsSecondaryCumulativeSeries(e.target.checked)} />
                                <span className="text-[11px] font-medium">Acumular por serie</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-3 h-3" checked={isSecondaryCumulativeGlobal} onChange={(e) => setIsSecondaryCumulativeGlobal(e.target.checked)} />
                                <span className="text-[11px] font-medium text-slate-700">Acumular Global</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer mt-1">
                                <input type="checkbox" className="w-3 h-3" checked={isSecondaryPercentage} onChange={(e) => setIsSecondaryPercentage(e.target.checked)} />
                                <span className="text-[11px] font-medium">Mostrar en % (Share)</span>
                            </label>
                        </div>
                    </div>
                </div>

            </div>

            <ReactECharts option={options} style={{ flex: 1, minHeight: '600px', width: '100%' }} notMerge={true} />
        </div>
    );
};
