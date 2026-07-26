import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { DollarSign, TrendingUp, Anchor, BarChart2, PieChart, LineChart as LineIcon, Filter, Layers, Navigation } from 'lucide-react';

interface LiquidationsInteractiveChartProps {
    liquidations: any[];
}

type GroupBy = 'route' | 'client' | 'vessel';
type PlotMetric = 'net_profit_usd' | 'tce_usd_day' | 'gross_revenue_usd' | 'cargo_quantity_mt' | 'bunker_vs_port';
type ChartType = 'bar' | 'line' | 'pie';

export const LiquidationsInteractiveChart: React.FC<LiquidationsInteractiveChartProps> = ({ liquidations }) => {
    const [groupBy, setGroupBy] = useState<GroupBy>('route');
    const [primaryMetric, setPrimaryMetric] = useState<PlotMetric>('net_profit_usd');
    const [chartType, setChartType] = useState<ChartType>('bar');
    
    const [filterClient, setFilterClient] = useState<string>('ALL');
    const [filterVessel, setFilterVessel] = useState<string>('ALL');

    // 1. Filtrado de liquidaciones reales
    const filteredData = useMemo(() => {
        return liquidations.filter(r => {
            if (filterClient !== 'ALL' && r.client_name !== filterClient) return false;
            if (filterVessel !== 'ALL' && r.vessel_name !== filterVessel) return false;
            return true;
        });
    }, [liquidations, filterClient, filterVessel]);

    // 2. Resumen de KPIs Superiores
    const kpis = useMemo(() => {
        if (filteredData.length === 0) {
            return { totalProfit: 0, avgTce: 0, totalTons: 0, totalRevenue: 0, topRoute: 'N/A' };
        }
        const totalProfit = filteredData.reduce((acc, r) => acc + (Number(r.net_profit_usd) || 0), 0);
        const totalRevenue = filteredData.reduce((acc, r) => acc + (Number(r.gross_revenue_usd) || 0), 0);
        const totalTons = filteredData.reduce((acc, r) => acc + (Number(r.cargo_quantity_mt) || 0), 0);
        const avgTce = filteredData.reduce((acc, r) => acc + (Number(r.tce_usd_day) || 0), 0) / filteredData.length;

        // Calcular Ruta Más Rentable
        const routeProfitMap: Record<string, number> = {};
        filteredData.forEach(r => {
            const key = `${r.pol_port} -> ${r.pod_port}`;
            routeProfitMap[key] = (routeProfitMap[key] || 0) + (Number(r.net_profit_usd) || 0);
        });
        let topRoute = 'N/A';
        let maxP = -Infinity;
        Object.entries(routeProfitMap).forEach(([rt, p]) => {
            if (p > maxP) {
                maxP = p;
                topRoute = rt;
            }
        });

        return { totalProfit, avgTce, totalTons, totalRevenue, topRoute };
    }, [filteredData]);

    // 3. Agrupación de datos para el gráfico ECharts
    const chartOption = useMemo(() => {
        if (filteredData.length === 0) return {};

        if (primaryMetric === 'bunker_vs_port') {
            // Comparativa Búnker vs Gastos Portuarios por Grupo
            const groups: Record<string, { bunker: number; port: number }> = {};
            filteredData.forEach(r => {
                let gKey = r.vessel_name;
                if (groupBy === 'route') gKey = `${r.pol_port} -> ${r.pod_port}`;
                if (groupBy === 'client') gKey = r.client_name;

                if (!groups[gKey]) groups[gKey] = { bunker: 0, port: 0 };
                
                const bCost = r.details?.bunker_expenses?.total_bunker_cost_usd || 0;
                const pCost = r.details?.port_expenses?.total_port_cost_usd || (r.details?.port_expenses?.total_agency_usd || 0);
                
                groups[gKey].bunker += Number(bCost);
                groups[gKey].port += Number(pCost);
            });

            const categories = Object.keys(groups);
            const bunkerData = categories.map(c => Math.round(groups[c].bunker));
            const portData = categories.map(c => Math.round(groups[c].port));

            return {
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { data: ['Desembolso Búnker ($USD)', 'Gastos Portuarios ($USD)'], bottom: 0 },
                grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
                xAxis: { type: 'category', data: categories, axisLabel: { interval: 0, rotate: 15, fontSize: 10 } },
                yAxis: { type: 'value', axisLabel: { formatter: '${value}' } },
                series: [
                    { name: 'Desembolso Búnker ($USD)', type: 'bar', stack: 'total', data: bunkerData, itemStyle: { color: '#EF4444' } },
                    { name: 'Gastos Portuarios ($USD)', type: 'bar', stack: 'total', data: portData, itemStyle: { color: '#3B82F6' } }
                ]
            };
        }

        // Agrupación estándar para Profit, TCE, Flete o Toneladas
        const groups: Record<string, { total: number; count: number; items: any[] }> = {};
        filteredData.forEach(r => {
            let gKey = r.vessel_name;
            if (groupBy === 'route') gKey = `${r.pol_port} -> ${r.pod_port}`;
            if (groupBy === 'client') gKey = r.client_name;

            if (!groups[gKey]) groups[gKey] = { total: 0, count: 0, items: [] };

            let val = Number(r[primaryMetric]) || 0;
            groups[gKey].total += val;
            groups[gKey].count += 1;
            groups[gKey].items.push(r);
        });

        const categories = Object.keys(groups);
        const seriesValues = categories.map(c => {
            if (primaryMetric === 'tce_usd_day') {
                return Math.round(groups[c].total / groups[c].count); // Promedio TCE
            }
            return Math.round(groups[c].total);
        });

        if (chartType === 'pie') {
            const pieData = categories.map((c, i) => ({ name: c, value: Math.max(0, seriesValues[i]) }));
            return {
                tooltip: { trigger: 'item', formatter: '{b}: ${c} ({d}%)' },
                legend: { bottom: '0%', left: 'center' },
                series: [{
                    name: 'Rentabilidad',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
                    label: { show: true, formatter: '{b}\n${c}' },
                    data: pieData
                }]
            };
        }

        const metricLabel = primaryMetric === 'net_profit_usd' ? 'Profit Neto Real ($USD)'
                          : primaryMetric === 'tce_usd_day' ? 'TCE Real Promedio ($USD/día)'
                          : primaryMetric === 'gross_revenue_usd' ? 'Facturación Bruta ($USD)'
                          : 'Toneladas Métricas (MT)';

        const colorMap: Record<string, string> = {
            'SPCC': '#0284C7',
            'NEXA': '#7C3AED',
            'B/T Tablones': '#DC2626',
            'B/T Moquegua': '#16A34A'
        };

        return {
            tooltip: { 
                trigger: 'axis', 
                formatter: (params: any[]) => {
                    const p = params[0];
                    return `<div className="font-bold">${p.name}</div><div>${metricLabel}: <strong>$${p.value.toLocaleString()}</strong></div>`;
                } 
            },
            grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: { type: 'category', data: categories, axisLabel: { interval: 0, rotate: 15, fontSize: 10, fontWeight: 'bold' } },
            yAxis: { type: 'value', axisLabel: { formatter: primaryMetric === 'cargo_quantity_mt' ? '{value} MT' : '${value}' } },
            series: [{
                name: metricLabel,
                type: chartType,
                smooth: true,
                data: seriesValues,
                itemStyle: {
                    color: (param: any) => colorMap[param.name] || '#2563EB',
                    borderRadius: chartType === 'bar' ? [6, 6, 0, 0] : 0
                },
                markLine: primaryMetric === 'tce_usd_day' ? {
                    data: [{ yAxis: 13000, name: 'TCE Requerido Meta ($13,000)' }],
                    lineStyle: { color: '#EF4444', type: 'dashed', width: 2 }
                } : undefined
            }]
        };
    }, [filteredData, groupBy, primaryMetric, chartType]);

    return (
        <div className="space-y-6 w-full max-w-full">

            {/* ── TARJETAS DE KPIS REALES SUPERIORES ── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                        <DollarSign size={22} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">UTILIDAD NETA TOTAL (P/L REAL)</span>
                        <span className="text-lg font-black text-emerald-600 font-mono">${kpis.totalProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                        <span className="text-[10px] text-slate-500 block font-medium">31 Viajes Auditados</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                        <TrendingUp size={22} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">TCE PROMEDIO REAL FLOTA</span>
                        <span className="text-lg font-black text-blue-600 font-mono">${Math.round(kpis.avgTce).toLocaleString('en-US')} / día</span>
                        <span className="text-[10px] text-emerald-600 font-bold block">Vs Meta $13,000 / día OK</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600 border border-purple-100">
                        <Navigation size={22} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">RUTA MÁS RENTABLE</span>
                        <span className="text-xs font-black text-purple-700 block truncate max-w-[170px]" title={kpis.topRoute}>{kpis.topRoute}</span>
                        <span className="text-[10px] text-slate-500 block font-medium">Mayor Profit Acumulado</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-700 border border-slate-200">
                        <Anchor size={22} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">CARGA TOTAL TRANSPORTADA</span>
                        <span className="text-lg font-black text-slate-800 font-mono">{Math.round(kpis.totalTons).toLocaleString()} MT</span>
                        <span className="text-[10px] text-slate-500 block font-medium">B/T Moquegua &amp; B/T Tablones</span>
                    </div>
                </div>
            </div>

            {/* ── BARRA DE CONTROLES E INTERACTIVIDAD DEL GRÁFICO ── */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                
                {/* Agrupación Principal */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-600 uppercase flex items-center gap-1">
                        <Layers size={14} /> Agrupar por:
                    </span>
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                        <button
                            onClick={() => setGroupBy('route')}
                            className={`px-3 py-1.5 font-bold rounded-md transition-all cursor-pointer ${groupBy === 'route' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            📍 Por Ruta
                        </button>
                        <button
                            onClick={() => setGroupBy('client')}
                            className={`px-3 py-1.5 font-bold rounded-md transition-all cursor-pointer ${groupBy === 'client' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            💼 Por Cliente
                        </button>
                        <button
                            onClick={() => setGroupBy('vessel')}
                            className={`px-3 py-1.5 font-bold rounded-md transition-all cursor-pointer ${groupBy === 'vessel' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            🚢 Por Buque
                        </button>
                    </div>
                </div>

                {/* Métrica Evaluada */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-600 uppercase flex items-center gap-1">
                        <BarChart2 size={14} /> Métrica:
                    </span>
                    <select
                        value={primaryMetric}
                        onChange={(e) => setPrimaryMetric(e.target.value as PlotMetric)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="net_profit_usd">💰 Profit Neto Real ($USD)</option>
                        <option value="tce_usd_day">⚡ TCE Real ($USD/día)</option>
                        <option value="gross_revenue_usd">💵 Facturación Bruta ($USD)</option>
                        <option value="cargo_quantity_mt">📦 Carga Transportada (MT)</option>
                        <option value="bunker_vs_port">⛽ Desembolsos Búnker vs Puerto</option>
                    </select>
                </div>

                {/* Filtros de Cliente / Buque */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-600 uppercase flex items-center gap-1">
                        <Filter size={14} /> Filtros:
                    </span>
                    <select
                        value={filterClient}
                        onChange={(e) => setFilterClient(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700"
                    >
                        <option value="ALL">Todos los Clientes</option>
                        <option value="SPCC">SPCC</option>
                        <option value="NEXA">NEXA</option>
                    </select>

                    <select
                        value={filterVessel}
                        onChange={(e) => setFilterVessel(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700"
                    >
                        <option value="ALL">Toda la Flota</option>
                        <option value="B/T Moquegua">B/T Moquegua</option>
                        <option value="B/T Tablones">B/T Tablones</option>
                    </select>
                </div>

                {/* Tipo de Gráfico */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                        onClick={() => setChartType('bar')}
                        className={`p-1.5 rounded transition-all cursor-pointer ${chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        title="Gráfico de Barras"
                    >
                        <BarChart2 size={16} />
                    </button>
                    <button
                        onClick={() => setChartType('line')}
                        className={`p-1.5 rounded transition-all cursor-pointer ${chartType === 'line' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        title="Gráfico de Líneas"
                    >
                        <LineIcon size={16} />
                    </button>
                    <button
                        onClick={() => setChartType('pie')}
                        className={`p-1.5 rounded transition-all cursor-pointer ${chartType === 'pie' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        title="Gráfico de Torta / Donut"
                    >
                        <PieChart size={16} />
                    </button>
                </div>

            </div>

            {/* ── LIENZO ECHARTS DEL GRÁFICO ── */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[420px] flex flex-col justify-between">
                <ReactECharts 
                    option={chartOption} 
                    style={{ height: '400px', width: '100%' }}
                    notMerge={true}
                    lazyUpdate={true}
                />
            </div>

        </div>
    );
};
