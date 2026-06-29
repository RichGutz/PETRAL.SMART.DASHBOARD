import React, { useMemo, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';

interface InteractiveChartProps {
    data: any;
    months: string[];
    demurragePct?: string;
    showDemurrage?: boolean;
    excludedDemurrages?: string[];
    customDemurrages?: Record<string, Record<number, string>>;
}

type GroupBy = 'vessel' | 'route' | 'client' | 'petral';
type PlotMetric = 'viajes' | 'net_income' | 'total_port_costs' | 'total_bunker_costs' | 'voyage_result' | 'total_cargo' | 'demurrage' | 'gross_plus_dem' | 'yield' | 'yield_flete' | 'none';

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

export const InteractiveChart: React.FC<InteractiveChartProps> = ({ 
    data, 
    months,
    demurragePct = '',
    showDemurrage = false,
    excludedDemurrages = [],
    customDemurrages = {}
}) => {
    const [groupBy, setGroupBy] = useState<GroupBy>('vessel');
    const [filterClient, setFilterClient] = useState<string>('ALL');
    const [filterRoute, setFilterRoute] = useState<string>('ALL');
    const [filterVessel, setFilterVessel] = useState<string>('ALL');

    // Primary Axis
    const [primaryMetric, setPrimaryMetric] = useState<PlotMetric | 'gross_and_gross_plus_dem'>('voyage_result');
    const [primaryGraphType, setPrimaryGraphType] = useState<'bar_stack' | 'bar_group' | 'line' | 'line_straight'>('bar_stack');

    // Secondary Axis
    const [secondaryMetric, setSecondaryMetric] = useState<PlotMetric | 'gross_and_gross_plus_dem'>('none');
    const [secondaryGraphType, setSecondaryGraphType] = useState<'bar' | 'line' | 'line_straight'>('line');
    const [isSecondaryCumulativeSeries, setIsSecondaryCumulativeSeries] = useState<boolean>(false);
    const [isSecondaryCumulativeGlobal, setIsSecondaryCumulativeGlobal] = useState<boolean>(false);
    const [isSecondaryPercentage, setIsSecondaryPercentage] = useState<boolean>(false);

    const [isPriOpen, setIsPriOpen] = useState<boolean>(false);
    const [isSecOpen, setIsSecOpen] = useState<boolean>(false);

    // Label settings
    const [primaryLabelPos, setPrimaryLabelPos] = useState<'inside' | 'top' | 'none'>('inside');
    const [primaryLabelColor, setPrimaryLabelColor] = useState<'#ffffff' | '#000000'>('#ffffff');
    const [secondaryLabelPos, setSecondaryLabelPos] = useState<'inside' | 'top' | 'none'>('none');
    const [secondaryLabelColor, setSecondaryLabelColor] = useState<'#ffffff' | '#000000'>('#000000');

    // Filter popovers
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
        const seriesMapPri2: { [key: string]: { [month: string]: number } } = {};
        const seriesMapSec: { [key: string]: { [month: string]: number } } = {};
        const seriesMapSec2: { [key: string]: { [month: string]: number } } = {};
        const totalPriMap: { [month: string]: number } = {};
        const totalPriMap2: { [month: string]: number } = {};
        const totalSecMap: { [month: string]: number } = {};
        const totalSecMap2: { [month: string]: number } = {};
        
        // For Yield Calculation
        const totalTonsMap: { [key: string]: { [month: string]: number } } = {};
        const totalGrossDemMap: { [key: string]: { [month: string]: number } } = {};
        const totalGrossRevenueMap: { [key: string]: { [month: string]: number } } = {};
        const globalTonsMap: { [month: string]: number } = {};
        const globalGrossDemMap: { [month: string]: number } = {};
        const globalGrossRevenueMap: { [month: string]: number } = {};

        const getMetricLabel = (m: PlotMetric | 'gross_and_gross_plus_dem') => {
            switch (m) {
                case 'viajes': return 'Viajes';
                case 'voyage_result': return 'Voyage Result';
                case 'net_income': return 'Gross Revenue';
                case 'total_port_costs': return 'Port Costs';
                case 'total_bunker_costs': return 'Bunker Costs';
                case 'total_cargo': return 'Toneladas';
                case 'demurrage': return 'Demurrage';
                case 'gross_plus_dem': return 'Gross + Demurrage';
                case 'gross_and_gross_plus_dem': return 'Gross & Gross+Dem';
                case 'yield': return 'Yield (USD/MT)';
                case 'yield_flete': return 'Yield Flete (USD/MT)';
                case 'none': return '';
                default: return m;
            }
        };

        const getMetricValue = (metrics: any, m: PlotMetric, client: string, route: string, vessel: string, month: string) => {
            if (m === 'none') return 0;
            
            const rawFreq = metrics['raw_inputs']?.['monthly_frequency'];
            const freq = rawFreq !== undefined ? rawFreq : (metrics['freq'] !== undefined ? metrics['freq'] : 0);
            
            if (m === 'viajes') return freq;
            
            const carga_unit = metrics['carga_unit'] || 0;
            const tons = carga_unit * freq;
            if (m === 'total_cargo') return tons;

            const revenue = metrics['net_income'] || 0;
            
            if (m === 'demurrage' || m === 'gross_plus_dem' || m === 'yield' || m === 'yield_flete') {
                const rowKey = `${client}-${route}-${vessel}`;
                const isDemurrageExcluded = excludedDemurrages.includes(rowKey);
                const isDemurrageVisible = showDemurrage && demurragePct !== '' && !isDemurrageExcluded;
                
                let demurrage = 0;
                if (isDemurrageVisible) {
                    const monthIndex = months.indexOf(month);
                    let customPct = parseFloat(demurragePct) || 0;
                    if (customDemurrages[rowKey] && customDemurrages[rowKey][monthIndex] !== undefined) {
                        customPct = parseFloat(customDemurrages[rowKey][monthIndex]) || 0;
                    }
                    demurrage = revenue * (customPct / 100);
                }
                
                if (m === 'demurrage') return demurrage;
                if (m === 'gross_plus_dem') return revenue + demurrage;
                // Yield is handled separately because it's a ratio, but we return 0 here to avoid NaNs if directly fetched
                if (m === 'yield' || m === 'yield_flete') return 0; 
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
                            seriesMapPri2[key] = {};
                            seriesMapSec[key] = {};
                            seriesMapSec2[key] = {};
                            totalTonsMap[key] = {};
                            totalGrossDemMap[key] = {};
                            totalGrossRevenueMap[key] = {};
                        }
                        
                        // Accumulate base variables for Yield
                        const tons = getMetricValue(metrics, 'total_cargo', client, route, vessel, month);
                        const grossDem = getMetricValue(metrics, 'gross_plus_dem', client, route, vessel, month);
                        const grossRev = getMetricValue(metrics, 'net_income', client, route, vessel, month);
                        
                        totalTonsMap[key][month] = (totalTonsMap[key][month] || 0) + tons;
                        totalGrossDemMap[key][month] = (totalGrossDemMap[key][month] || 0) + grossDem;
                        totalGrossRevenueMap[key][month] = (totalGrossRevenueMap[key][month] || 0) + grossRev;
                        
                        globalTonsMap[month] = (globalTonsMap[month] || 0) + tons;
                        globalGrossDemMap[month] = (globalGrossDemMap[month] || 0) + grossDem;
                        globalGrossRevenueMap[month] = (globalGrossRevenueMap[month] || 0) + grossRev;
                        
                        if (primaryMetric === 'gross_and_gross_plus_dem') {
                            const priResult1 = getMetricValue(metrics, 'net_income', client, route, vessel, month);
                            const priResult2 = getMetricValue(metrics, 'gross_plus_dem', client, route, vessel, month);
                            seriesMapPri[key][month] = (seriesMapPri[key][month] || 0) + priResult1;
                            seriesMapPri2[key][month] = (seriesMapPri2[key][month] || 0) + priResult2;
                            totalPriMap[month] = (totalPriMap[month] || 0) + priResult1;
                            totalPriMap2[month] = (totalPriMap2[month] || 0) + priResult2;
                        } else {
                            const priResult = getMetricValue(metrics, primaryMetric as PlotMetric, client, route, vessel, month);
                            seriesMapPri[key][month] = (seriesMapPri[key][month] || 0) + priResult;
                            totalPriMap[month] = (totalPriMap[month] || 0) + priResult;
                        }

                        if (secondaryMetric !== 'none') {
                            if (secondaryMetric === 'gross_and_gross_plus_dem') {
                                const secResult1 = getMetricValue(metrics, 'net_income', client, route, vessel, month);
                                const secResult2 = getMetricValue(metrics, 'gross_plus_dem', client, route, vessel, month);
                                seriesMapSec[key][month] = (seriesMapSec[key][month] || 0) + secResult1;
                                seriesMapSec2[key][month] = (seriesMapSec2[key][month] || 0) + secResult2;
                                totalSecMap[month] = (totalSecMap[month] || 0) + secResult1;
                                totalSecMap2[month] = (totalSecMap2[month] || 0) + secResult2;
                            } else {
                                const secResult = getMetricValue(metrics, secondaryMetric as PlotMetric, client, route, vessel, month);
                                seriesMapSec[key][month] = (seriesMapSec[key][month] || 0) + secResult;
                                totalSecMap[month] = (totalSecMap[month] || 0) + secResult;
                            }
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
            
            const labelPos = yAxisIndex === 0 ? primaryLabelPos : secondaryLabelPos;
            const labelColor = yAxisIndex === 0 ? primaryLabelColor : secondaryLabelColor;
            
            const grandTotal = Object.values(totalMap).reduce((a: any, b: any) => a + b, 0) as number;
            
            // For Yield, we use the specific maps instead of seriesMap
            const isYield = metric === 'yield' || metric === 'yield_flete';
            const baseMap = metric === 'yield' ? totalGrossDemMap : (metric === 'yield_flete' ? totalGrossRevenueMap : seriesMap);
            
            return Object.entries(baseMap).map(([name, mData]: [string, any]) => {
                let runningTotal = 0;
                let runningTotalOfTotals = 0;
                
                let runningGrossDem = 0;
                let runningTons = 0;
                let globalRunningGrossDem = 0;
                let globalRunningTons = 0;

                const dataArr = months.map(m => {
                    const val = mData[m] || 0;
                    const tot = totalMap[m] || 0;
                    
                    runningTotal += val;
                    runningTotalOfTotals += tot;

                    let finalVal = isCumulative ? runningTotal : val;
                    let finalTot = isCumulative ? runningTotalOfTotals : tot;

                    if (isYield) {
                        const localTons = totalTonsMap[name]?.[m] || 0;
                        const localValue = val;
                        runningTons += localTons;
                        runningGrossDem += localValue;
                        finalVal = isCumulative ? (runningTons ? runningGrossDem / runningTons : 0) : (localTons ? localValue / localTons : 0);
                        
                        const globTons = globalTonsMap[m] || 0;
                        const globValue = metric === 'yield' ? globalGrossDemMap[m] : globalGrossRevenueMap[m];
                        globalRunningTons += globTons;
                        globalRunningGrossDem += globValue;
                        finalTot = isCumulative ? (globalRunningTons ? globalRunningGrossDem / globalRunningTons : 0) : (globTons ? globValue / globTons : 0);
                    }

                    const pct = isCumulative ? (grandTotal ? (finalVal / grandTotal) * 100 : 0) : (finalTot ? (finalVal / finalTot) * 100 : 0);
                    
                    return {
                        value: isPercentage && !isYield ? pct : finalVal,
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
                    smooth: graphType === 'line',
                    symbol: graphType.includes('line') ? 'circle' : undefined,
                    symbolSize: graphType.includes('line') ? 8 : undefined,
                    barMaxWidth: isBar ? 40 : undefined,
                    barGap: isStack ? undefined : '10%',
                    data: dataArr,
                    itemStyle: { 
                        borderRadius: isBar ? [2, 2, 0, 0] : undefined, 
                        color: cColor 
                    },
                    lineStyle: graphType === 'line' ? { width: 3, type: yAxisIndex === 1 ? 'dashed' : 'solid' } : undefined,
                    label: {
                        show: labelPos !== 'none',
                        position: labelPos === 'none' ? undefined : labelPos,
                        formatter: (params: any) => {
                            const pct = params.data.pct;
                            if (isPercentage && pct < 4) return ''; 
                            if (!isPercentage && params.data.value === 0) return '';
                            
                            if (isPercentage) {
                                return `${pct.toFixed(1)}%`;
                            } else {
                                const val = params.data.value;
                                if (metric === 'viajes') return val.toString();
                                if (metric === 'yield' || metric === 'yield_flete') return `$${val.toFixed(2)}`;
                                if (metric === 'total_cargo') return `${(val/1000).toFixed(0)}k`;
                                return val >= 1000 ? `$${(val/1000).toFixed(0)}k` : `$${val.toFixed(0)}`;
                            }
                        },
                        color: labelColor,
                        fontWeight: 'bold',
                        fontSize: 10
                    }
                };
            });
        };

        let seriesPri: any[] = [];
        if (primaryMetric === 'gross_and_gross_plus_dem') {
            const pri1 = buildSeries(seriesMapPri, totalPriMap, 'net_income', primaryGraphType, false, false, 0);
            pri1.forEach(s => { s.name = `${s.name.replace('(Pri)', '').trim()} Gross`; });
            
            const pri2 = buildSeries(seriesMapPri2, totalPriMap2, 'gross_plus_dem', primaryGraphType, false, false, 0);
            pri2.forEach(s => { 
                s.name = `${s.name.replace('(Pri)', '').trim()} Gross+Dem`; 
                s.itemStyle.color = '#F59E0B'; // Distinct color
            });
            
            seriesPri = [...pri1, ...pri2];
        } else {
            seriesPri = buildSeries(seriesMapPri, totalPriMap, primaryMetric as PlotMetric, primaryGraphType, false, false, 0);
        }

        const showSecIndividual = isSecondaryCumulativeSeries || !isSecondaryCumulativeGlobal;
        
        let seriesSec: any[] = [];
        if (showSecIndividual) {
            if (secondaryMetric === 'gross_and_gross_plus_dem') {
                const sec1 = buildSeries(seriesMapSec, totalSecMap, 'net_income', secondaryGraphType, isSecondaryCumulativeSeries, isSecondaryPercentage, 1);
                sec1.forEach(s => { s.name = `${s.name.replace('(Sec)', '').trim()} Gross`; });
                
                const sec2 = buildSeries(seriesMapSec2, totalSecMap2, 'gross_plus_dem', secondaryGraphType, isSecondaryCumulativeSeries, isSecondaryPercentage, 1);
                sec2.forEach(s => { 
                    s.name = `${s.name.replace('(Sec)', '').trim()} Gross+Dem`; 
                    s.itemStyle.color = '#F59E0B'; // Distinct color
                });
                
                seriesSec = [...sec1, ...sec2];
            } else {
                seriesSec = buildSeries(seriesMapSec, totalSecMap, secondaryMetric as PlotMetric, secondaryGraphType, isSecondaryCumulativeSeries, isSecondaryPercentage, 1);
            }
        }
        
        let globalSeries: any[] = [];
        if (isSecondaryCumulativeGlobal && secondaryMetric !== 'none') {
            const buildGlobalSeries = (mapSec: any, totSecMap: any, nameSuffix: string, forceColor?: string) => {
                const grandTotalSec = Object.values(totSecMap).reduce((a: any, b: any) => a + b, 0) as number;
                let runningGlobal = 0;
                const globalData = xAxisData.map((_, i) => {
                    const month = months[i];
                    let val = 0;
                    Object.values(mapSec).forEach((mData: any) => {
                        val += (mData[month] || 0);
                    });
                    runningGlobal += val;
                    
                    const activeNames = Object.keys(mapSec).filter(name => mapSec[name][month] > 0);
                    let colorToUse = forceColor || '#1E293B';
                    if (!forceColor && activeNames.length > 0) {
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
                
                return {
                    name: `Total Global ${nameSuffix}`,
                    type: 'line',
                    yAxisIndex: 1,
                    smooth: secondaryGraphType === 'line',
                    symbol: 'circle',
                    symbolSize: 8,
                    lineStyle: { width: 3, type: 'dashed' },
                    data: globalData,
                    label: {
                        show: secondaryLabelPos !== 'none',
                        position: secondaryLabelPos === 'none' ? undefined : secondaryLabelPos,
                        formatter: (params: any) => {
                            if (isSecondaryPercentage) {
                                return `${params.data.pct.toFixed(1)}%`;
                            } else {
                                const val = params.data.value;
                                if (secondaryMetric === 'viajes') return val.toString();
                                if (secondaryMetric === 'yield' || secondaryMetric === 'yield_flete') return `$${val.toFixed(2)}`;
                                if (secondaryMetric === 'total_cargo') return `${(val/1000).toFixed(0)}k`;
                                return val >= 1000 ? `$${(val/1000).toFixed(0)}k` : `$${val.toFixed(0)}`;
                            }
                        },
                        color: secondaryLabelColor,
                        fontWeight: 'bold',
                        fontSize: 10
                    }
                };
            };
            
            if (secondaryMetric === 'gross_and_gross_plus_dem') {
                globalSeries.push(buildGlobalSeries(seriesMapSec, totalSecMap, 'Gross'));
                globalSeries.push(buildGlobalSeries(seriesMapSec2, totalSecMap2, 'Gross+Dem', '#F59E0B'));
            } else {
                globalSeries.push(buildGlobalSeries(seriesMapSec, totalSecMap, '(Sec)'));
            }
        }
        
        const series = [...seriesPri, ...seriesSec, ...globalSeries];

        const getAxisFormatter = (metric: PlotMetric | 'gross_and_gross_plus_dem', isPct: boolean) => {
            if (isPct) return '{value}%';
            if (metric === 'viajes') return '{value}';
            if (metric === 'yield' || metric === 'yield_flete') return (v: number) => `$${v.toFixed(2)}`;
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
                        if (isPct && m !== 'yield' && m !== 'yield_flete') {
                            valStr = `${p.value.toFixed(1)}% (${p.data.rawVal.toLocaleString()})`;
                        } else {
                            if (m === 'viajes') valStr = p.value.toString();
                            else if (m === 'yield' || m === 'yield_flete') valStr = `$${p.value.toFixed(2)}`;
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
                    nameTextStyle: { color: '#059669', padding: [0, -40, 0, 0] },
                    axisLine: { show: false },
                    axisLabel: { color: '#059669', fontWeight: 'bold', formatter: getAxisFormatter(secondaryMetric, isSecondaryPercentage) },
                    splitLine: { show: false }
                }
            ],
            series,
            color: ['#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#10B981']
        };
    }, [data, groupBy, months, filterClient, filterRoute, filterVessel, primaryMetric, primaryGraphType, secondaryMetric, secondaryGraphType, isSecondaryCumulativeSeries, isSecondaryCumulativeGlobal, isSecondaryPercentage, demurragePct, showDemurrage, excludedDemurrages, customDemurrages, primaryLabelPos, primaryLabelColor, secondaryLabelPos, secondaryLabelColor]);

    if (!data || !data.aggregated_data || months.length === 0) return null;

    const metricOptions = [
        { value: 'none', label: 'Ninguno', icon: '🚫', desc: 'No graficar' },
        { value: 'voyage_result', label: 'Voyage Result', icon: '💰', desc: 'USD / Resultado Viaje' },
        { value: 'net_income', label: 'Gross Revenue', icon: '💸', desc: 'USD / Flete Bruto' },
        { value: 'demurrage', label: 'Demurrage', icon: '⏳', desc: 'USD / Estadía' },
        { value: 'gross_plus_dem', label: 'Gross + Demurrage', icon: '📊', desc: 'USD / Total Bruto' },
        { value: 'gross_and_gross_plus_dem', label: 'Gross & Gross+Dem', icon: '📈', desc: 'USD / Comparativa' },
        { value: 'yield', label: 'Yield (USD/MT)', icon: '🏆', desc: 'USD/MT / Rendimiento Total' },
        { value: 'yield_flete', label: 'Yield Flete (USD/MT)', icon: '🏅', desc: 'USD/MT / Rendimiento Flete' },
        { value: 'total_port_costs', label: 'Port Costs', icon: '⚓', desc: 'USD / Gastos Puerto' },
        { value: 'total_bunker_costs', label: 'Bunker Costs', icon: '⛽', desc: 'USD / Combustible' },
        { value: 'total_cargo', label: 'Toneladas', icon: '🚢', desc: 'MT / Carga Total' },
        { value: 'viajes', label: 'Viajes', icon: '📅', desc: 'freq / Cantidad Viajes' }
    ];

    const renderCustomDropdown = (
        selectedVal: string, 
        onSelect: (val: string) => void, 
        isOpen: boolean, 
        setIsOpen: (open: boolean) => void,
        colorClass: string,
        isSecondary: boolean
    ) => {
        const selectedOption = metricOptions.find(o => o.value === selectedVal) || metricOptions[0];
        
        return (
            <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={() => {
                        if (isSecondary) {
                            setIsPriOpen(false);
                            setIsOpen(!isOpen);
                        } else {
                            setIsSecOpen(false);
                            setIsOpen(!isOpen);
                        }
                    }}
                    className="w-full flex items-center justify-between gap-1 px-2 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded hover:border-slate-350 focus:outline-none transition-all cursor-pointer text-slate-700"
                >
                    <div className="flex items-center gap-1.5 truncate">
                        <span className="text-sm shrink-0">{selectedOption.icon}</span>
                        <span className="truncate">{selectedOption.label}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 shrink-0">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                    <div className="absolute left-[208px] top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 w-[420px] p-2 grid grid-cols-2 gap-1.5 animate-in fade-in slide-in-from-left-2 duration-150">
                        <div className="col-span-2 px-1 py-0.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                            <span>Métricas ({isSecondary ? 'Eje Secundario' : 'Eje Primario'})</span>
                            <button onClick={() => setIsOpen(false)} className="text-[11px] text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer">✕</button>
                        </div>
                        {metricOptions.map((opt) => {
                            const isSel = opt.value === selectedVal;
                            if (!isSecondary && opt.value === 'none') return null;
                            
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        onSelect(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`text-left p-1.5 flex flex-col gap-0.5 rounded hover:bg-slate-50 transition-all cursor-pointer border ${
                                        isSel 
                                            ? (colorClass === 'blue' ? 'bg-blue-50/70 border-blue-200 hover:bg-blue-50' : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50') 
                                            : 'border-slate-100/50 bg-slate-50/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm shrink-0">{opt.icon}</span>
                                        <span className={`text-[11px] ${isSel ? 'font-bold' : 'font-semibold'} ${isSel ? (colorClass === 'blue' ? 'text-blue-900' : 'text-emerald-900') : 'text-slate-700'} truncate`}>
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

    return (
        <div className="w-full bg-white pt-6 pb-6 px-6 shadow-sm rounded-b-lg flex flex-row gap-6 items-stretch min-h-[calc(100vh-220px)]">
            {/* Sidebar de Controles (Left) */}
            <div className="flex flex-col gap-3 shrink-0 w-[240px]">
                
                {/* FILTROS TABS */}
                <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className="bg-slate-700 w-7 flex items-center justify-center shrink-0 rounded-l-lg">
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Filtros</span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col gap-2 bg-slate-50/50 rounded-r-lg relative">
                        <button onClick={() => setGroupBy('petral')} className={`w-full h-8 flex items-center justify-center text-center px-2 text-[12px] font-extrabold rounded-md transition-colors ${groupBy === 'petral' ? 'bg-petral-blue text-white shadow-sm' : 'bg-white text-petral-blue border border-slate-300 hover:bg-slate-100'}`}>
                            PETRAL (Todo)
                        </button>
                        <div className="h-px w-full bg-slate-200 my-0.5"></div>
                        
                        {/* Cliente filter row */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => setGroupBy('client')} className={`w-[75px] shrink-0 h-8 flex items-center justify-center text-[11px] font-bold rounded-md transition-colors ${groupBy === 'client' || filterClient !== 'ALL' ? 'bg-petral-blue text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                Cliente
                            </button>
                            {renderFilterDropdown(filterClient, setFilterClient, filterOptions.clients, isClientFilterOpen, setIsClientFilterOpen, 'Cliente')}
                        </div>

                        {/* Ruta filter row */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => setGroupBy('route')} className={`w-[75px] shrink-0 h-8 flex items-center justify-center text-[11px] font-bold rounded-md transition-colors ${groupBy === 'route' || filterRoute !== 'ALL' ? 'bg-petral-blue text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                Ruta
                            </button>
                            {renderFilterDropdown(filterRoute, setFilterRoute, filterOptions.routes, isRouteFilterOpen, setIsRouteFilterOpen, 'Ruta')}
                        </div>

                        {/* Buque filter row */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => setGroupBy('vessel')} className={`w-[75px] shrink-0 h-8 flex items-center justify-center text-[11px] font-bold rounded-md transition-colors ${groupBy === 'vessel' || filterVessel !== 'ALL' ? 'bg-petral-blue text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                Buque
                            </button>
                            {renderFilterDropdown(filterVessel, setFilterVessel, filterOptions.vessels, isVesselFilterOpen, setIsVesselFilterOpen, 'Buque')}
                        </div>
                    </div>
                </div>

                {/* EJE PRIMARIO TABS */}
                <div className="flex bg-white rounded-lg border border-blue-200 shadow-sm">
                    <div className="bg-blue-600 w-7 flex items-center justify-center shrink-0 rounded-l-lg">
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Eje Primario</span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col gap-2.5 bg-blue-50/30 rounded-r-lg relative">
                        {renderCustomDropdown(
                            primaryMetric, 
                            (val) => setPrimaryMetric(val as PlotMetric), 
                            isPriOpen, 
                            setIsPriOpen, 
                            'blue',
                            false
                        )}
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="priType" checked={primaryGraphType === 'bar_stack'} onChange={() => setPrimaryGraphType('bar_stack')} className="w-3 h-3" />
                                <span className="text-[11px] font-medium text-slate-700">Barras Stack</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="priType" checked={primaryGraphType === 'bar_group'} onChange={() => setPrimaryGraphType('bar_group')} className="w-3 h-3" />
                                <span className="text-[11px] font-medium text-slate-700">Barras Adjuntas</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="priType" checked={primaryGraphType === 'line'} onChange={() => setPrimaryGraphType('line')} className="w-3 h-3" />
                                <span className="text-[11px] font-medium text-slate-700">Línea Suavizada</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="priType" checked={primaryGraphType === 'line_straight'} onChange={() => setPrimaryGraphType('line_straight')} className="w-3 h-3" />
                                <span className="text-[11px] font-medium text-slate-700">Línea Recta</span>
                            </label>
                        </div>
                        {/* Control de Etiquetas */}
                        <div className="flex flex-col gap-1 border-t border-blue-200/50 pt-2 mt-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">Etiquetas</span>
                                {primaryLabelPos !== 'none' && (
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setPrimaryLabelColor('#ffffff')}
                                            className={`w-3.5 h-3.5 rounded-full border bg-white flex items-center justify-center transition-all cursor-pointer ${primaryLabelColor === '#ffffff' ? 'border-blue-600 ring-2 ring-blue-100 scale-110' : 'border-slate-300'}`}
                                            title="Texto Blanco"
                                        >
                                            <span className="text-[7px] font-extrabold text-slate-800">W</span>
                                        </button>
                                        <button
                                            onClick={() => setPrimaryLabelColor('#000000')}
                                            className={`w-3.5 h-3.5 rounded-full border bg-black flex items-center justify-center transition-all cursor-pointer ${primaryLabelColor === '#000000' ? 'border-blue-600 ring-2 ring-blue-100 scale-110' : 'border-slate-350'}`}
                                            title="Texto Negro"
                                        >
                                            <span className="text-[7px] font-extrabold text-white">B</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] text-slate-500 w-8 shrink-0 font-medium">Posic:</span>
                                <div className="flex rounded border border-slate-200 overflow-hidden bg-white w-full">
                                    {(['none', 'top', 'inside'] as const).map(pos => (
                                        <button
                                            key={pos}
                                            onClick={() => setPrimaryLabelPos(pos)}
                                            className={`flex-1 text-[9px] font-bold py-0.5 px-0.5 capitalize transition-all cursor-pointer ${primaryLabelPos === pos ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
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
                <div className="flex bg-white rounded-lg border border-emerald-200 shadow-sm">
                    <div className="bg-emerald-600 w-7 flex items-center justify-center shrink-0 rounded-l-lg">
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Eje Secundario</span>
                    </div>
                    <div className="flex-1 p-2 flex flex-col gap-2.5 bg-emerald-50/30 rounded-r-lg relative">
                        {renderCustomDropdown(
                            secondaryMetric, 
                            (val) => setSecondaryMetric(val as PlotMetric), 
                            isSecOpen, 
                            setIsSecOpen, 
                            'emerald',
                            true
                        )}
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="secType" checked={secondaryGraphType === 'bar'} onChange={() => setSecondaryGraphType('bar')} className="w-3 h-3" />
                                <span className="text-[11px] font-medium text-slate-700">Barras</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="secType" checked={secondaryGraphType === 'line'} onChange={() => setSecondaryGraphType('line')} className="w-3 h-3" />
                                <span className="text-[11px] font-medium text-slate-700">Línea Suavizada</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="secType" checked={secondaryGraphType === 'line_straight'} onChange={() => setSecondaryGraphType('line_straight')} className="w-3 h-3" />
                                <span className="text-[11px] font-medium text-slate-700">Línea Recta</span>
                            </label>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-3 h-3" checked={isSecondaryCumulativeSeries} onChange={(e) => setIsSecondaryCumulativeSeries(e.target.checked)} />
                                <span className="text-[11px] font-medium text-slate-700">Acumular por serie</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-3 h-3" checked={isSecondaryCumulativeGlobal} onChange={(e) => setIsSecondaryCumulativeGlobal(e.target.checked)} />
                                <span className="text-[11px] font-medium text-slate-700">Acumular Global</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer mt-1">
                                <input type="checkbox" className="w-3 h-3" checked={isSecondaryPercentage} onChange={(e) => setIsSecondaryPercentage(e.target.checked)} />
                                <span className="text-[11px] font-medium text-slate-700">Mostrar en % (Share)</span>
                            </label>
                        </div>
                        {/* Control de Etiquetas */}
                        <div className="flex flex-col gap-1 border-t border-emerald-200/50 pt-2 mt-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Etiquetas</span>
                                {secondaryLabelPos !== 'none' && (
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setSecondaryLabelColor('#ffffff')}
                                            className={`w-3.5 h-3.5 rounded-full border bg-white flex items-center justify-center transition-all cursor-pointer ${secondaryLabelColor === '#ffffff' ? 'border-emerald-600 ring-2 ring-emerald-100 scale-110' : 'border-slate-300'}`}
                                            title="Texto Blanco"
                                        >
                                            <span className="text-[7px] font-extrabold text-slate-800">W</span>
                                        </button>
                                        <button
                                            onClick={() => setSecondaryLabelColor('#000000')}
                                            className={`w-3.5 h-3.5 rounded-full border bg-black flex items-center justify-center transition-all cursor-pointer ${secondaryLabelColor === '#000000' ? 'border-emerald-600 ring-2 ring-emerald-100 scale-110' : 'border-slate-350'}`}
                                            title="Texto Negro"
                                        >
                                            <span className="text-[7px] font-extrabold text-white">B</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] text-slate-500 w-8 shrink-0 font-medium">Posic:</span>
                                <div className="flex rounded border border-slate-200 overflow-hidden bg-white w-full">
                                    {(['none', 'top', 'inside'] as const).map(pos => (
                                        <button
                                            key={pos}
                                            onClick={() => setSecondaryLabelPos(pos)}
                                            className={`flex-1 text-[9px] font-bold py-0.5 px-0.5 capitalize transition-all cursor-pointer ${secondaryLabelPos === pos ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
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
            <div className="flex-1 flex flex-col min-h-[650px]">
                <ReactECharts option={options} style={{ flex: 1, height: '100%', minHeight: '650px', width: '100%' }} notMerge={true} />
            </div>
        </div>
    );
};
