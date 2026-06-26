import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';

interface InteractiveChartProps {
    data: any;
    months: string[];
}

type GroupBy = 'vessel' | 'route' | 'client';
type PlotMetric = 'net_income' | 'total_port_costs' | 'total_bunker_costs' | 'voyage_result' | 'gross_profit_breakdown';

const getHexColor = (name: string, type: 'client' | 'route' | 'vessel' | 'breakdown') => {
    if (type === 'breakdown') {
        if (name === 'Voyage Result') return '#10B981';
        if (name === 'Bunker Costs') return '#F43F5E';
        if (name === 'Port Costs') return '#F59E0B';
        return '#94A3B8';
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

export const InteractiveChart: React.FC<InteractiveChartProps> = ({ data, months }) => {
    const [groupBy, setGroupBy] = useState<GroupBy>('vessel');
    const [plotMetric, setPlotMetric] = useState<PlotMetric>('voyage_result');
    const [plotMode, setPlotMode] = useState<'usd'|'pct'>('usd');
    const [filterClient, setFilterClient] = useState<string>('ALL');
    const [filterRoute, setFilterRoute] = useState<string>('ALL');
    const [filterVessel, setFilterVessel] = useState<string>('ALL');

    // Extraer opciones únicas para los filtros
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

        const seriesMap: { [key: string]: { [month: string]: number } } = {};
        const totalMap: { [month: string]: number } = {};
        const revenueMap: { [key: string]: { [month: string]: number } } = {};
        const totalRevenueMap: { [month: string]: number } = {};

        const isBreakdown = plotMetric === 'gross_profit_breakdown';

        // Extract and aggregate Voyage Result
        Object.entries(data.aggregated_data).forEach(([client, routes]: any) => {
            if (filterClient !== 'ALL' && client !== filterClient) return;

            Object.entries(routes).forEach(([route, vessels]: any) => {
                if (filterRoute !== 'ALL' && route !== filterRoute) return;

                Object.entries(vessels).forEach(([vessel, mData]: any) => {
                    if (filterVessel !== 'ALL' && vessel !== filterVessel) return;

                    Object.entries(mData).forEach(([month, metrics]: any) => {
                        const revenue = metrics['net_income'] || 0;

                        if (isBreakdown) {
                            const components = [
                                { name: 'Voyage Result', val: metrics['voyage_result'] || 0 },
                                { name: 'Bunker Costs', val: metrics['total_bunker_costs'] || 0 },
                                { name: 'Port Costs', val: metrics['total_port_costs'] || 0 }
                            ];

                            components.forEach(c => {
                                if (!seriesMap[c.name]) {
                                    seriesMap[c.name] = {};
                                    revenueMap[c.name] = {};
                                }
                                seriesMap[c.name][month] = (seriesMap[c.name][month] || 0) + c.val;
                                revenueMap[c.name][month] = (revenueMap[c.name][month] || 0) + revenue;
                            });

                            totalMap[month] = (totalMap[month] || 0) + (metrics['voyage_result'] || 0);
                            totalRevenueMap[month] = (totalRevenueMap[month] || 0) + revenue;

                        } else {
                            let key = vessel;
                            if (groupBy === 'client') key = client;
                            if (groupBy === 'route') key = route;

                            if (!seriesMap[key]) {
                                seriesMap[key] = {};
                                revenueMap[key] = {};
                            }
                            
                            const result = metrics[plotMetric] || 0;

                            seriesMap[key][month] = (seriesMap[key][month] || 0) + result;
                            revenueMap[key][month] = (revenueMap[key][month] || 0) + revenue;

                            totalMap[month] = (totalMap[month] || 0) + result;
                            totalRevenueMap[month] = (totalRevenueMap[month] || 0) + revenue;
                        }
                    });
                });
            });
        });

        const xAxisData = [...months];

        const isPct = plotMode === 'pct';

        // 1. Build Bar Series
        const series: any[] = Object.entries(seriesMap).map(([name, mData]) => {
            const dataArr = xAxisData.map(m => {
                const val = mData[m] || 0;
                const rev = revenueMap[name][m] || 0;
                const pct = rev ? (val / rev) * 100 : 0;
                return {
                    value: isPct ? pct : val,
                    pct: pct
                };
            });
            const cType = isBreakdown ? 'breakdown' : groupBy;
            const barColor = getHexColor(name, cType);

            return {
                name,
                type: 'bar',
                stack: 'total', // Apilar barras
                barWidth: '40%', // Hacer barras más angostas
                data: dataArr,
                itemStyle: { borderRadius: [2, 2, 0, 0], color: barColor }, // Ligero redondeo y color asignado
                label: {
                    show: true,
                    position: 'inside',
                    formatter: (params: any) => {
                        const pct = params.data.pct;
                        // Ocultar la etiqueta si el bloque es muy pequeño para evitar que el texto se salga
                        if (!pct || pct < 4) return ''; 
                        
                        if (isPct) {
                            return `${pct.toFixed(1)}%`;
                        } else {
                            const val = params.data.value;
                            return val >= 1000 ? `$${(val/1000).toFixed(0)}k` : `$${val.toFixed(0)}`;
                        }
                    },
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: 10
                }
            };
        });

        // 2. Build Cumulative Line Series
        let cumulativeSum = 0;
        let cumulativeRev = 0;
        const cumulativeData = xAxisData.map(m => {
            cumulativeSum += (totalMap[m] || 0);
            cumulativeRev += (totalRevenueMap[m] || 0);
            if (isPct) {
                return cumulativeRev ? (cumulativeSum / cumulativeRev) * 100 : 0;
            }
            return cumulativeSum;
        });

        series.push({
            name: 'Total Acumulado',
            type: 'line',
            yAxisIndex: 1, // Enrutar al segundo eje
            smooth: true,
            symbolSize: 10,
            data: cumulativeData,
            lineStyle: { width: 3, color: '#F59E0B', type: 'dashed' }, // Amber
            itemStyle: { color: '#F59E0B' },
            z: 10 // Dibujar por encima de las barras
        });

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params: any) => {
                    let tooltip = `<div style="font-weight:600;margin-bottom:4px">${params[0].axisValue}</div>`;
                    // Separar line (acumulado) y barras
                    params.forEach((p: any) => {
                        const valStr = isPct ? `${p.value.toFixed(1)}%` : `$${Math.round(p.value).toLocaleString()}`;
                        tooltip += `<div>${p.marker} <b>${p.seriesName}</b>: ${valStr}</div>`;
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
                // Alineación geométrica con la tabla superior (336px approx de cabeceras fijas)
                left: 360, 
                right: 80,
                bottom: 30,
                top: 40,
                containLabel: false // Importante para que los pixeles sean absolutos
            },
            xAxis: {
                type: 'category',
                data: xAxisData.map(m => {
                    const date = new Date(`${m}-02`);
                    return new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(date).replace('.', '').toUpperCase();
                }),
                axisLine: { lineStyle: { color: '#cbd5e1' } },
                axisTick: { alignWithLabel: true },
                axisLabel: { color: '#64748b', fontWeight: 600 }
            },
            yAxis: [
                {
                    type: 'value',
                    name: plotMetric === 'net_income' ? 'Gross Revenue' : plotMetric === 'total_port_costs' ? 'Port Costs' : plotMetric === 'total_bunker_costs' ? 'Bunker Costs' : plotMetric === 'gross_profit_breakdown' ? 'Gross Profit' : 'Voyage Result',
                    nameTextStyle: { color: '#64748b', padding: [0, 0, 0, -40] },
                    axisLine: { show: false },
                    axisLabel: { color: '#94a3b8', formatter: (v: number) => isPct ? `${v}%` : `$${(v/1000)}k` },
                    splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
                    ...(isPct ? { max: 100 } : {})
                },
                {
                    type: 'value',
                    name: 'Acumulado',
                    nameTextStyle: { color: '#F59E0B', padding: [0, -40, 0, 0] },
                    axisLine: { show: false },
                    axisLabel: { color: '#F59E0B', fontWeight: 'bold', formatter: (v: number) => isPct ? `${v}%` : `$${(v/1000)}k` },
                    splitLine: { show: false },
                    ...(isPct ? { max: 100 } : {})
                }
            ],
            series,
            // Paleta de colores profesionales
            color: ['#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#10B981']
        };
    }, [data, groupBy, months, filterClient, filterRoute, filterVessel, plotMetric, plotMode]);

    if (!data || !data.aggregated_data || months.length === 0) return null;

    return (
        <div className="w-full bg-white pt-6 pb-2 px-6 shadow-sm rounded-b-lg flex flex-col relative">
            
            {/* Controles (Ribbon Vertical a la izquierda) */}
            <div className="absolute left-6 top-10 flex flex-col gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 w-[270px] shadow-sm z-10">
                
                {/* Agrupación y Filtros (3 Filas) */}
                <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Cruzar Data:</span>
                    
                    {/* Fila Cliente */}
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setGroupBy('client')} 
                            className={`w-[30%] text-center px-1 py-1.5 text-[11px] font-bold rounded-md transition-colors ${groupBy === 'client' ? 'bg-petral-blue text-white shadow-sm' : 'bg-white text-slate-500 hover:bg-slate-200 border border-slate-200'}`}
                        >
                            Cliente
                        </button>
                        <select 
                            className="w-[70%] text-[11px] bg-white border border-slate-200 rounded px-1 py-1.5 focus:outline-none focus:border-petral-teal text-slate-700" 
                            value={filterClient} 
                            onChange={(e) => setFilterClient(e.target.value)}
                        >
                            <option value="ALL">Todos los Clientes</option>
                            {filterOptions.clients.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Fila Ruta */}
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setGroupBy('route')} 
                            className={`w-[30%] text-center px-1 py-1.5 text-[11px] font-bold rounded-md transition-colors ${groupBy === 'route' ? 'bg-petral-blue text-white shadow-sm' : 'bg-white text-slate-500 hover:bg-slate-200 border border-slate-200'}`}
                        >
                            Ruta
                        </button>
                        <select 
                            className="w-[70%] text-[11px] bg-white border border-slate-200 rounded px-1 py-1.5 focus:outline-none focus:border-petral-teal text-slate-700" 
                            value={filterRoute} 
                            onChange={(e) => setFilterRoute(e.target.value)}
                        >
                            <option value="ALL">Todas las Rutas</option>
                            {filterOptions.routes.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {/* Fila Buque */}
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setGroupBy('vessel')} 
                            className={`w-[30%] text-center px-1 py-1.5 text-[11px] font-bold rounded-md transition-colors ${groupBy === 'vessel' ? 'bg-petral-blue text-white shadow-sm' : 'bg-white text-slate-500 hover:bg-slate-200 border border-slate-200'}`}
                        >
                            Buque
                        </button>
                        <select 
                            className="w-[70%] text-[11px] bg-white border border-slate-200 rounded px-1 py-1.5 focus:outline-none focus:border-petral-teal text-slate-700" 
                            value={filterVessel} 
                            onChange={(e) => setFilterVessel(e.target.value)}
                        >
                            <option value="ALL">Todos los Buques</option>
                            {filterOptions.vessels.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                </div>

                <div className="h-px w-full bg-slate-300 my-1"></div>

                {/* Selección de Métrica */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Métrica Y:</span>
                    <select 
                        className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-2 focus:outline-none focus:border-petral-teal text-slate-700 font-bold"
                        value={plotMetric}
                        onChange={(e) => setPlotMetric(e.target.value as PlotMetric)}
                    >
                        <option value="voyage_result">Voyage Result</option>
                        <option value="net_income">Gross Revenue</option>
                        <option value="total_port_costs">Port Costs</option>
                        <option value="total_bunker_costs">Bunker Costs</option>
                        <option value="gross_profit_breakdown">Gross Profit (100%)</option>
                    </select>
                </div>

                <div className="h-px w-full bg-slate-300 my-1"></div>

                {/* Modalidad USD / % */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Unidad:</span>
                    <div className="flex bg-slate-200 rounded p-1">
                        <button
                            onClick={() => setPlotMode('usd')}
                            className={`flex-1 text-center py-1 text-xs font-bold rounded transition-colors ${plotMode === 'usd' ? 'bg-white shadow-sm text-petral-blue' : 'text-slate-500 hover:bg-slate-300'}`}
                        >
                            $ USD
                        </button>
                        <button
                            onClick={() => setPlotMode('pct')}
                            className={`flex-1 text-center py-1 text-xs font-bold rounded transition-colors ${plotMode === 'pct' ? 'bg-white shadow-sm text-petral-blue' : 'text-slate-500 hover:bg-slate-300'}`}
                        >
                            % Pct
                        </button>
                    </div>
                </div>
            </div>

            {/* Gráfico */}
            <ReactECharts option={options} style={{ height: '650px', width: '100%' }} notMerge={true} />

        </div>
    );
};
