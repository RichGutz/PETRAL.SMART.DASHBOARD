import React, { useMemo, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';

interface InteractiveChartProps {
    data?: any;
    months?: string[];
    demurragePct?: string;
    showDemurrage?: boolean;
    excludedDemurrages?: string[];
    customDemurrages?: Record<string, Record<number, string>>;
}

type GroupBy = 'vessel' | 'route' | 'client' | 'petral' | 'tradeType';
type PlotMetric = 'viajes' | 'net_income' | 'total_port_costs' | 'total_bunker_costs' | 'voyage_result' | 'pl_vs_required' | 'pl_percentage' | 'total_cargo' | 'demurrage' | 'gross_plus_dem' | 'yield' | 'yield_flete' | 'total_duration' | 'none';

const getHexColor = (name: string, type: GroupBy) => {
    if (type === 'petral') return '#0089CF'; // Petral Blue (RGB 0-137-207)
    if (type === 'tradeType') {
        if (name === 'Chile') return '#D946EF'; // Magenta
        return '#06B6D4'; // Cabotaje / Perú
    }
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

export const InteractiveChart_V2: React.FC<InteractiveChartProps> = ({ 
    data: propData, 
    months: propMonths,
    demurragePct = '',
    showDemurrage = false,
    excludedDemurrages = [],
    customDemurrages = {}
}) => {
    const context = useForecastContext_V2();
    const data = propData || context.data;
    const months = propMonths || context.dynamicMonths || [];

    const [groupBy, setGroupBy] = useState<GroupBy>('vessel');
    const [filterClient, setFilterClient] = useState<string>('ALL');
    const [filterRoute, setFilterRoute] = useState<string>('ALL');
    const [filterVessel, setFilterVessel] = useState<string>('ALL');
    const [filterTradeType] = useState<string[]>(['Cabotaje', 'Chile']);

    // Primary Axis
    const [primaryMetric, setPrimaryMetric] = useState<PlotMetric | 'gross_and_gross_plus_dem'>('voyage_result');
    const [primaryGraphType] = useState<'bar_stack' | 'bar_group' | 'line' | 'line_straight'>('bar_stack');

    // Secondary Axis
    const [secondaryMetric] = useState<PlotMetric | 'gross_and_gross_plus_dem'>('none');

    const [isPriOpen, setIsPriOpen] = useState<boolean>(false);

    // Label settings
    const [primaryLabelPos] = useState<'inside' | 'top' | 'none'>('inside');
    const [primaryLabelColor] = useState<'#ffffff' | '#000000'>('#ffffff');

    // Helper: infiere el tradeType de una ruta por su nombre
    const getTradeType = (route: string): string => {
        const r = route.toUpperCase();
        if (r.includes('MEJILLONES') || r.includes('BARQUITO')) return 'Chile';
        return 'Cabotaje';
    };

    useEffect(() => {
        const handleOutsideClick = () => {
            setIsPriOpen(false);
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
                if (rMap && typeof rMap === 'object') {
                    Object.entries(rMap).forEach(([r, vMap]: any) => {
                        routes.add(r);
                        if (vMap && typeof vMap === 'object') {
                            Object.keys(vMap).forEach(v => vessels.add(v));
                        }
                    });
                }
            });
        }

        return {
            clients: Array.from(clients).sort(),
            routes: Array.from(routes).sort(),
            vessels: Array.from(vessels).sort()
        };
    }, [data]);

    // Resetear filtros si ya no pertenecen al escenario cargado
    useEffect(() => {
        if (filterClient !== 'ALL' && !filterOptions.clients.includes(filterClient)) {
            setFilterClient('ALL');
        }
        if (filterRoute !== 'ALL' && !filterOptions.routes.includes(filterRoute)) {
            setFilterRoute('ALL');
        }
        if (filterVessel !== 'ALL' && !filterOptions.vessels.includes(filterVessel)) {
            setFilterVessel('ALL');
        }
    }, [filterOptions, filterClient, filterRoute, filterVessel]);

    const options = useMemo(() => {
        if (!data || !data.aggregated_data || !months) return {};

        const seriesMapPri: { [key: string]: { [month: string]: number } } = {};
        const seriesMapPri2: { [key: string]: { [month: string]: number } } = {};
        const seriesMapSec: { [key: string]: { [month: string]: number } } = {};
        const seriesMapSec2: { [key: string]: { [month: string]: number } } = {};
        const totalPriMap: { [month: string]: number } = {};
        const totalPriMap2: { [month: string]: number } = {};

        const totalTonsMap: { [key: string]: { [month: string]: number } } = {};
        const totalPLMap: { [key: string]: { [month: string]: number } } = {};
        const totalGrossDemMap: { [key: string]: { [month: string]: number } } = {};
        const totalGrossRevenueMap: { [key: string]: { [month: string]: number } } = {};
        const globalTonsMap: { [month: string]: number } = {};

        const getMetricLabel = (m: PlotMetric | 'gross_and_gross_plus_dem') => {
            switch (m) {
                case 'viajes': return 'Viajes';
                case 'voyage_result': return 'Voyage Result';
                case 'pl_vs_required': return 'P/L';
                case 'pl_percentage': return 'P/L (%)';
                case 'net_income': return 'Gross Revenue';
                case 'total_port_costs': return 'Port Costs';
                case 'total_bunker_costs': return 'Bunker Costs';
                case 'total_cargo': return 'Toneladas';
                case 'demurrage': return 'Demurrage';
                case 'gross_plus_dem': return 'Gross + Demurrage';
                case 'gross_and_gross_plus_dem': return 'Gross & Gross+Dem';
                case 'yield': return 'Yield (USD/MT)';
                case 'yield_flete': return 'Yield Flete (USD/MT)';
                case 'total_duration': return 'Duración Total (Días)';
                case 'none': return '';
                default: return m;
            }
        };

        const getMetricValue = (metrics: any, m: PlotMetric, client: string, route: string, vessel: string, month: string) => {
            if (m === 'none') return 0;
            
            const rawFreq = metrics['raw_inputs']?.['monthly_frequency'];
            const freq = rawFreq !== undefined ? rawFreq : (metrics['freq'] !== undefined ? metrics['freq'] : 0);
            
            if (m === 'viajes') return freq;
            
            if (m === 'total_duration') {
                const duration_unit = metrics['total_duration_unit'] || metrics['total_duration'] || 0;
                return duration_unit * freq;
            }
            
            const carga_unit = metrics['carga_unit'] || metrics['total_cargo'] || 0;
            const tons = carga_unit * freq;
            if (m === 'total_cargo') return tons;

            const revenue = metrics['gross_income'] || metrics['net_income'] || 0;
            
            if (m === 'demurrage' || m === 'gross_plus_dem' || m === 'yield' || m === 'yield_flete') {
                const rowKey = `${client}-${route}-${vessel}`;
                const isDemurrageExcluded = (excludedDemurrages && Array.isArray(excludedDemurrages)) ? excludedDemurrages.includes(rowKey) : false;
                const isDemurrageVisible = showDemurrage && demurragePct !== '' && !isDemurrageExcluded;
                
                let demurrage = 0;
                if (isDemurrageVisible && Array.isArray(months)) {
                    const monthIndex = months.indexOf(month);
                    let customPct = parseFloat(demurragePct) || 0;
                    if (customDemurrages && customDemurrages[rowKey] && customDemurrages[rowKey][monthIndex] !== undefined) {
                        customPct = parseFloat(customDemurrages[rowKey][monthIndex]) || 0;
                    }
                    demurrage = revenue * (customPct / 100);
                }
                
                if (m === 'demurrage') return demurrage;
                if (m === 'gross_plus_dem') return revenue + demurrage;
                if (m === 'yield' || m === 'yield_flete') return 0; 
            }

            if (m === 'pl_vs_required') return metrics['pl_vs_required'] !== undefined ? metrics['pl_vs_required'] : (metrics['voyage_result'] || 0);

            return metrics[m] || 0;
        };

        // Extract and aggregate
        Object.entries(data.aggregated_data).forEach(([client, routes]: any) => {
            if (filterClient !== 'ALL' && client !== filterClient) return;
            if (!routes || typeof routes !== 'object') return;
            Object.entries(routes).forEach(([route, vessels]: any) => {
                if (filterRoute !== 'ALL' && route !== filterRoute) return;
                if (!filterTradeType.includes(getTradeType(route))) return;
                if (!vessels || typeof vessels !== 'object') return;
                Object.entries(vessels).forEach(([vessel, mData]: any) => {
                    if (filterVessel !== 'ALL' && vessel !== filterVessel) return;
                    if (!mData || typeof mData !== 'object') return;

                    Object.entries(mData).forEach(([month, metrics]: any) => {
                        let key = vessel;
                        if (groupBy === 'client') key = client;
                        if (groupBy === 'route') key = route;
                        if (groupBy === 'petral') key = 'PETRAL';
                        if (groupBy === 'tradeType') key = getTradeType(route);

                        if (!seriesMapPri[key]) {
                            seriesMapPri[key] = {};
                            seriesMapPri2[key] = {};
                            seriesMapSec[key] = {};
                            seriesMapSec2[key] = {};
                            totalTonsMap[key] = {};
                            totalPLMap[key] = {};
                            totalGrossDemMap[key] = {};
                            totalGrossRevenueMap[key] = {};
                        }
                        
                        const tons = getMetricValue(metrics, 'total_cargo', client, route, vessel, month);
                        const grossDem = getMetricValue(metrics, 'gross_plus_dem', client, route, vessel, month);
                        const grossRev = getMetricValue(metrics, 'net_income', client, route, vessel, month);
                        const pl = getMetricValue(metrics, 'pl_vs_required', client, route, vessel, month);
                        
                        totalTonsMap[key][month] = (totalTonsMap[key][month] || 0) + tons;
                        totalPLMap[key][month] = (totalPLMap[key][month] || 0) + pl;
                        totalGrossDemMap[key][month] = (totalGrossDemMap[key][month] || 0) + grossDem;
                        totalGrossRevenueMap[key][month] = (totalGrossRevenueMap[key][month] || 0) + grossRev;
                        
                        globalTonsMap[month] = (globalTonsMap[month] || 0) + tons;
                        
                        if (primaryMetric === 'gross_and_gross_plus_dem') {
                            const priResult1 = getMetricValue(metrics, 'net_income', client, route, vessel, month);
                            const priResult2 = getMetricValue(metrics, 'gross_plus_dem', client, route, vessel, month);
                            seriesMapPri[key][month] = (seriesMapPri[key][month] || 0) + priResult1;
                            seriesMapPri2[key][month] = (seriesMapPri2[key][month] || 0) + priResult2;
                            totalPriMap[month] = (totalPriMap[month] || 0) + priResult1;
                            totalPriMap2[month] = (totalPriMap2[month] || 0) + priResult2;
                        } else if (primaryMetric !== 'none' && primaryMetric !== 'yield' && primaryMetric !== 'yield_flete' && primaryMetric !== 'pl_percentage') {
                            const priResult = getMetricValue(metrics, primaryMetric, client, route, vessel, month);
                            seriesMapPri[key][month] = (seriesMapPri[key][month] || 0) + priResult;
                            totalPriMap[month] = (totalPriMap[month] || 0) + priResult;
                        }
                    });
                });
            });
        });

        // Compute Ratios
        const keys = Object.keys(seriesMapPri);
        keys.forEach(key => {
            months.forEach((month: string) => {
                const tons = totalTonsMap[key]?.[month] || 0;
                const pl = totalPLMap[key]?.[month] || 0;
                const grossDem = totalGrossDemMap[key]?.[month] || 0;
                const grossRev = totalGrossRevenueMap[key]?.[month] || 0;

                if (primaryMetric === 'yield') {
                    seriesMapPri[key][month] = tons > 0 ? grossDem / tons : 0;
                } else if (primaryMetric === 'yield_flete') {
                    seriesMapPri[key][month] = tons > 0 ? grossRev / tons : 0;
                } else if (primaryMetric === 'pl_percentage') {
                    seriesMapPri[key][month] = grossRev > 0 ? (pl / grossRev) * 100 : 0;
                }
            });
        });

        const echartsSeries: any[] = [];
        const isPriStack = primaryGraphType === 'bar_stack';

        const formatLabelValue = (val: number, metric: any) => {
            if (val === 0) return '';
            if (metric === 'viajes') return val.toFixed(1);
            if (metric === 'total_cargo') return Math.round(val).toLocaleString();
            if (metric === 'yield' || metric === 'yield_flete') return '$' + val.toFixed(2);
            if (metric === 'pl_percentage') return val.toFixed(1) + '%';
            if (Math.abs(val) >= 1000000) return '$' + (val / 1000000).toFixed(2) + 'M';
            if (Math.abs(val) >= 1000) return '$' + (val / 1000).toFixed(0) + 'k';
            return '$' + Math.round(val).toLocaleString();
        };

        const getSeriesLabelConfig = (pos: 'inside' | 'top' | 'none', color: string, metric: any) => {
            if (pos === 'none') return { show: false };
            return {
                show: true,
                position: pos,
                color: color,
                fontSize: 10,
                fontWeight: 'bold',
                formatter: (params: any) => formatLabelValue(params.value, metric)
            };
        };

        if (primaryMetric !== 'none') {
            keys.forEach(key => {
                const dataValues = months.map((m: string) => seriesMapPri[key]?.[m] || 0);

                if (primaryMetric === 'gross_and_gross_plus_dem') {
                    const dataValues2 = months.map((m: string) => seriesMapPri2[key]?.[m] || 0);
                    echartsSeries.push({
                        name: `${key} (Gross)`,
                        type: 'bar',
                        stack: isPriStack ? 'primary_gross' : undefined,
                        yAxisIndex: 0,
                        data: dataValues,
                        itemStyle: { color: getHexColor(key, groupBy) },
                        label: getSeriesLabelConfig(primaryLabelPos, primaryLabelColor, 'net_income')
                    });
                    echartsSeries.push({
                        name: `${key} (Gross+Dem)`,
                        type: 'bar',
                        stack: isPriStack ? 'primary_dem' : undefined,
                        yAxisIndex: 0,
                        data: dataValues2,
                        itemStyle: { color: getHexColor(key, groupBy), opacity: 0.6 },
                        label: getSeriesLabelConfig(primaryLabelPos, primaryLabelColor, 'gross_plus_dem')
                    });
                } else {
                    echartsSeries.push({
                        name: key,
                        type: (primaryGraphType === 'line' || primaryGraphType === 'line_straight') ? 'line' : 'bar',
                        smooth: primaryGraphType === 'line',
                        stack: isPriStack ? 'primary' : undefined,
                        yAxisIndex: 0,
                        data: dataValues,
                        itemStyle: { color: getHexColor(key, groupBy) },
                        label: getSeriesLabelConfig(primaryLabelPos, primaryLabelColor, primaryMetric)
                    });
                }
            });
        }

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                formatter: (params: any) => {
                    if (!params || params.length === 0) return '';
                    let res = `<div style="font-weight:bold;margin-bottom:4px;border-bottom:1px solid #ccc;padding-bottom:2px;">${params[0].axisValue}</div>`;
                    params.forEach((item: any) => {
                        const val = item.value;
                        let formattedVal = val;
                        if (typeof val === 'number') {
                            if (primaryMetric === 'pl_percentage' || secondaryMetric === 'pl_percentage') {
                                formattedVal = val.toFixed(1) + '%';
                            } else if (primaryMetric === 'yield' || primaryMetric === 'yield_flete') {
                                formattedVal = '$' + val.toFixed(2) + '/MT';
                            } else {
                                formattedVal = '$' + Math.round(val).toLocaleString();
                            }
                        }
                        res += `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                            <span>${item.marker} ${item.seriesName}:</span>
                            <span style="font-weight:bold;">${formattedVal}</span>
                        </div>`;
                    });
                    return res;
                }
            },
            legend: {
                type: 'scroll',
                top: 0,
                textStyle: { color: '#94A3B8' }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '10%',
                top: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: months,
                axisLabel: { color: '#94A3B8' },
                axisLine: { lineStyle: { color: '#334155' } }
            },
            yAxis: [
                {
                    type: 'value',
                    name: getMetricLabel(primaryMetric),
                    axisLabel: {
                        color: '#94A3B8',
                        formatter: (val: number) => {
                            if (primaryMetric === 'pl_percentage') return val.toFixed(0) + '%';
                            if (primaryMetric === 'yield' || primaryMetric === 'yield_flete') return '$' + val.toFixed(0);
                            if (Math.abs(val) >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
                            if (Math.abs(val) >= 1000) return '$' + (val / 1000).toFixed(0) + 'k';
                            return '$' + val;
                        }
                    },
                    splitLine: { lineStyle: { color: '#1E293B' } }
                }
            ],
            series: echartsSeries
        };
    }, [data, months, groupBy, filterClient, filterRoute, filterVessel, filterTradeType, primaryMetric, primaryGraphType, secondaryMetric, primaryLabelPos, primaryLabelColor, demurragePct, showDemurrage, excludedDemurrages, customDemurrages]);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
            {/* Control Ribbon Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agrupar por:</span>
                    {(['vessel', 'route', 'client', 'petral', 'tradeType'] as GroupBy[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setGroupBy(type)}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                                groupBy === type
                                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 font-bold'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                        >
                            {type === 'vessel' ? 'Buque' : type === 'route' ? 'Ruta' : type === 'client' ? 'Cliente' : type === 'petral' ? 'PETRAL' : 'Tráfico'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {/* Primary Metric Dropdown */}
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsPriOpen(!isPriOpen); }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-2"
                        >
                            <span>Eje 1: <strong className="text-sky-400">{primaryMetric}</strong></span>
                        </button>
                        {isPriOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-xs">
                                <div className="font-bold text-slate-400 px-2 py-1 uppercase text-[10px]">Métrica Eje Primario</div>
                                {[
                                    { id: 'voyage_result', label: 'Voyage Result' },
                                    { id: 'pl_vs_required', label: 'P/L Net Target' },
                                    { id: 'net_income', label: 'Gross Revenue (+RF)' },
                                    { id: 'total_port_costs', label: 'Port Costs' },
                                    { id: 'total_bunker_costs', label: 'Bunker Costs' },
                                    { id: 'total_cargo', label: 'Toneladas' },
                                    { id: 'viajes', label: 'Número de Viajes' },
                                    { id: 'total_duration', label: 'Duración Total (Días)' }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => { setPrimaryMetric(m.id as any); setIsPriOpen(false); }}
                                        className={`w-full text-left px-2 py-1.5 rounded hover:bg-slate-700 ${primaryMetric === m.id ? 'text-sky-400 font-bold bg-slate-700/50' : 'text-slate-300'}`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ECharts Viewport */}
            <div className="h-[500px] w-full">
                {options && options.series ? (
                    <ReactECharts option={options} style={{ height: '100%', width: '100%' }} />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                        Cargando gráfico interactivo V2...
                    </div>
                )}
            </div>
        </div>
    );
};
