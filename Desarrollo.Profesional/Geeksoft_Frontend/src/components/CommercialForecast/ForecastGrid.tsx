import React, { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import './ForecastGrid.css';

interface ForecastGridProps {
    data: any;
    months: string[];
    projectionLines: any[];
    onFrequencyChange?: (client_id: string, route_key: string, vessel_id: string, month_index: string, newFrequency: number) => void;
    onTariffChange?: (client_id: string, route_key: string, vessel_id: string, month_index: string, newTariff: number) => void;
}

export const ForecastGrid: React.FC<ForecastGridProps> = ({ data, months, projectionLines, onFrequencyChange, onTariffChange }) => {
    
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const toggleRow = (rowKey: string) => {
        setExpandedRows(prev => ({
            ...prev,
            [rowKey]: !prev[rowKey]
        }));
    };

    const rows = useMemo(() => {
        if (!data || !data.aggregated_data) return [];
        
        const result: any[] = [];
        
        Object.entries(data.aggregated_data).forEach(([client, routes]: any) => {
            const clientRowSpanRef = { value: 0 };
            
            let isFirstClientRow = true;

            const clientGrossRevenue = new Array(months.length).fill(0);
            const clientPortCosts = new Array(months.length).fill(0);
            const clientBunkerCosts = new Array(months.length).fill(0);
            const clientVoyageResult = new Array(months.length).fill(0);
            
            Object.entries(routes).forEach(([route, vessels]: any) => {
                const routeRowSpanRef = { value: 0 };
                let isFirstRouteRow = true;
                
                Object.entries(vessels).forEach(([vessel, monthData]: any) => {
                    const rowKey = `${client}-${route}-${vessel}`;
                    const isExpanded = !!expandedRows[rowKey];
                    const numSubRows = isExpanded ? 17 : 0; // 14 metrics + 3 category headers
                    const vesselRowSpan = 5 + numSubRows;
                    
                    clientRowSpanRef.value += vesselRowSpan;
                    routeRowSpanRef.value += vesselRowSpan;

                    const getMonthlyValues = (metricKey: string) => {
                        return months.map(m => {
                            const val = monthData[m]?.[metricKey];
                            return val || 0;
                        });
                    };

                    // Extract trips (frequency) from the raw projection lines sent by the builder
                    const trips = months.map(m => {
                        const line = projectionLines.find(p => 
                            p.client_id === client && 
                            `${p.origin_port_id}-${p.destination_port_id}` === route && 
                            p.vessel_id === vessel && 
                            p.month_index === m
                        );
                        return line ? line.monthly_frequency : 0;
                    });
                    
                    const revenues = getMonthlyValues("net_income");
                    const portCosts = getMonthlyValues("total_port_costs");
                    const bunker = getMonthlyValues("total_bunker_costs");
                    const voyageResult = getMonthlyValues("voyage_result");

                    revenues.forEach((v, i) => clientGrossRevenue[i] += v);
                    portCosts.forEach((v, i) => clientPortCosts[i] += v);
                    bunker.forEach((v, i) => clientBunkerCosts[i] += v);
                    voyageResult.forEach((v, i) => clientVoyageResult[i] += v);

                    const sum = (arr: number[]) => arr.reduce((a,b) => a+b, 0);
                    const calcPct = (arr: number[]) => arr.map((v, i) => revenues[i] ? (v / revenues[i]) * 100 : 0);
                    const calcTotalPct = (totalVal: number, totalRev: number) => totalRev ? (totalVal / totalRev) * 100 : 0;

                    const metrics = [
                        { name: "Viajes (freq)", values: trips, total: sum(trips), pct: null, totalPct: null, isCurrency: false, isTotal: false, isExpandable: true, rowKey, isExpanded },
                        { name: "Gross Revenue", values: revenues, total: sum(revenues), pct: revenues.map(r => r ? 100 : 0), totalPct: sum(revenues) ? 100 : 0, isCurrency: true, isTotal: false },
                        { name: "Port Costs", values: portCosts, total: sum(portCosts), pct: calcPct(portCosts), totalPct: calcTotalPct(sum(portCosts), sum(revenues)), isCurrency: true, isTotal: false },
                        { name: "Bunker Costs", values: bunker, total: sum(bunker), pct: calcPct(bunker), totalPct: calcTotalPct(sum(bunker), sum(revenues)), isCurrency: true, isTotal: false },
                        { name: "Voyage Result", values: voyageResult, total: sum(voyageResult), pct: calcPct(voyageResult), totalPct: calcTotalPct(sum(voyageResult), sum(revenues)), isCurrency: true, isTotal: true }
                    ];

                    metrics.forEach((metric, index) => {
                        result.push({
                            client: isFirstClientRow && isFirstRouteRow && index === 0 ? { name: client, rowSpanRef: clientRowSpanRef } : null,
                            route: isFirstRouteRow && index === 0 ? { name: route, rowSpanRef: routeRowSpanRef } : null,
                            vessel: index === 0 ? { name: vessel, rowSpan: vesselRowSpan } : null,
                            clientName: client,
                            routeName: route,
                            vesselName: vessel,
                            metric: metric,
                            isSubRow: false
                        });

                        if (metric.isExpandable && isExpanded) {
                            const subMetricsData = [
                                { isHeader: true, name: "▶ Operativo" },
                                { name: "Distancia (MN)", key: "distancia_total", curr: false },
                                { name: "Carga Transportada (MT)", key: "carga_unit", curr: false },
                                { name: "Flete (USD/MT)", key: "flete_unit", curr: true },
                                { name: "Gross Revenue (USD)", key: "net_income_unit", curr: true },
                                { isHeader: true, name: "▶ Tiempos / Costos" },
                                { name: "Sea Days", key: "sea_days_unit", curr: false },
                                { name: "Port/Idle Days", key: "port_days_unit", curr: false },
                                { name: "Duración Total (Días)", key: "total_duration_unit", curr: false },
                                { name: "Bunker IFO (MT)", key: "bunker_ifo_tonnage_unit", curr: false },
                                { name: "Bunker MDO (MT)", key: "bunker_mdo_tonnage_unit", curr: false },
                                { name: "Port Costs (USD)", key: "total_port_costs_unit", curr: true },
                                { name: "Bunker Costs (USD)", key: "total_bunker_costs_unit", curr: true },
                                { isHeader: true, name: "▶ Financiero" },
                                { name: "TCE (USD/Día)", key: "tce_real_unit", curr: true },
                                { name: "PCM (USD)", key: "pcm_projected", curr: true },
                                { name: "P/L Neto (USD)", key: "pl_vs_required_unit", curr: true }
                            ];
                            
                            // Adjust numSubRows calculation to account for these 2 new rows
                            // Actually numSubRows is calculated earlier based on `14`. It should now be 16.
                            
                            subMetricsData.forEach(sub => {
                                if (sub.isHeader) {
                                    result.push({
                                        client: null,
                                        route: null,
                                        vessel: null,
                                        clientName: client,
                                        routeName: route,
                                        vesselName: vessel,
                                        metric: {
                                            name: sub.name,
                                            values: months.map(() => null),
                                            total: null,
                                            pct: null,
                                            totalPct: null,
                                            isCurrency: false,
                                            isTotal: false,
                                            isSubRowMetric: true,
                                            isCategoryHeader: true
                                        },
                                        isSubRow: true
                                    });
                                } else {
                                    const vals = getMonthlyValues(sub.key as string);
                                    result.push({
                                        client: null,
                                        route: null,
                                        vessel: null,
                                        clientName: client,
                                        routeName: route,
                                        vesselName: vessel,
                                        metric: {
                                            name: sub.name,
                                            values: vals,
                                            total: 0,
                                            pct: null,
                                            totalPct: null,
                                            isCurrency: sub.curr,
                                            isTotal: false,
                                            isSubRowMetric: true,
                                            isCategoryHeader: false
                                        },
                                        isSubRow: true
                                    });
                                }
                            });
                        }
                    });

                    isFirstRouteRow = false;
                    isFirstClientRow = false;
                });
            });

            // Añadir Subtotal Cliente
            const sum = (arr: number[]) => arr.reduce((a,b) => a+b, 0);
            clientRowSpanRef.value += 4; // 4 rows for subtotal

            const clientCalcPct = (arr: number[]) => arr.map((v, i) => clientGrossRevenue[i] ? (v / clientGrossRevenue[i]) * 100 : 0);
            const clientCalcTotalPct = (totalVal: number, totalRev: number) => totalRev ? (totalVal / totalRev) * 100 : 0;

            const subMetrics = [
                { name: "Gross Revenue", values: clientGrossRevenue, total: sum(clientGrossRevenue), pct: clientGrossRevenue.map(r => r ? 100 : 0), totalPct: sum(clientGrossRevenue) ? 100 : 0, isCurrency: true, isTotal: false },
                { name: "Port Costs", values: clientPortCosts, total: sum(clientPortCosts), pct: clientCalcPct(clientPortCosts), totalPct: clientCalcTotalPct(sum(clientPortCosts), sum(clientGrossRevenue)), isCurrency: true, isTotal: false },
                { name: "Bunker Costs", values: clientBunkerCosts, total: sum(clientBunkerCosts), pct: clientCalcPct(clientBunkerCosts), totalPct: clientCalcTotalPct(sum(clientBunkerCosts), sum(clientGrossRevenue)), isCurrency: true, isTotal: false },
                { name: "Voyage Result", values: clientVoyageResult, total: sum(clientVoyageResult), pct: clientCalcPct(clientVoyageResult), totalPct: clientCalcTotalPct(sum(clientVoyageResult), sum(clientGrossRevenue)), isCurrency: true, isTotal: true }
            ];

            const subtotalRouteRowSpanRef = { value: 4 };

            subMetrics.forEach((metric, index) => {
                result.push({
                    client: null,
                    route: index === 0 ? { name: "Σ SUBTOTAL", rowSpanRef: subtotalRouteRowSpanRef, isSubtotal: true } : null,
                    vessel: index === 0 ? { name: "TOTAL CLIENTE", rowSpan: 4, isSubtotal: true } : null,
                    clientName: client,
                    routeName: "",
                    vesselName: "",
                    metric: metric,
                    isSubRow: false,
                    isClientSubtotal: true
                });
            });

        });
        
        return result;
    }, [data, months, projectionLines, expandedRows]);

    const formatCurrency = (val: number) => {
        if (val === 0) return "-";
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
    };

    const formatNumber = (val: number) => {
        if (val === 0) return "-";
        return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(val);
    };

    if (!data || !data.aggregated_data) {
        return (
            <div className="flex items-center justify-center h-64 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-slate-500">No hay proyecciones para mostrar. Usa el constructor de arriba.</p>
            </div>
        );
    }

    return (
        <div className="table-container shadow-sm border border-slate-200 rounded-lg overflow-x-auto bg-white">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-800 text-white uppercase font-semibold text-xs tracking-wider">
                    <tr>
                        <th className="py-1 px-2 text-center border border-slate-700 w-12">Cliente</th>
                        <th className="py-1 px-2 text-center border border-slate-700 w-12">Ruta</th>
                        <th className="py-1 px-2 text-center border border-slate-700 w-12">Buque</th>
                        <th className="py-1 px-2 border border-slate-700 w-48">Métricas</th>
                        {months.map(m => {
                            const date = new Date(`${m}-02`);
                            const formatted = new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(date).replace('.', '');
                            return <th key={m} className="py-1 px-2 text-center border border-slate-700 capitalize">{formatted}</th>;
                        })}
                        <th className="py-1 px-2 text-right border border-slate-700 bg-slate-900">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className={`border border-slate-200 transition-colors ${row.isSubRow ? 'bg-slate-50/50' : 'hover:bg-slate-50'} ${row.metric.isTotal ? 'bg-slate-100 font-semibold' : ''} ${row.isClientSubtotal ? 'bg-amber-50/30 font-semibold' : ''}`}>
                            {row.client && (
                                <td rowSpan={row.client.rowSpanRef.value} className="p-0 border border-slate-200 align-middle bg-petral-blue text-white">
                                    <div className="vertical-text mx-auto px-2">{row.client.name}</div>
                                </td>
                            )}
                            {row.route && (
                                <td rowSpan={row.route.rowSpanRef.value} className={`p-0 border border-slate-200 align-middle ${row.route.isSubtotal ? 'bg-slate-800 text-amber-400 font-bold' : 'bg-slate-700 text-white'}`}>
                                    <div className="vertical-text mx-auto px-2">{row.route.name}</div>
                                </td>
                            )}
                            {row.vessel && (
                                <td rowSpan={row.vessel.rowSpan} className={`p-0 border border-slate-200 align-middle ${row.vessel.isSubtotal ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-100 text-slate-800 font-bold'}`}>
                                    <div className="vertical-text mx-auto px-2">{row.vessel.name}</div>
                                </td>
                            )}
                            <td className={`py-1 px-2 border border-slate-200 ${row.isSubRow ? (row.metric.isCategoryHeader ? 'pl-6 text-xs text-slate-800 font-bold uppercase tracking-wider bg-slate-100/50' : 'pl-10 text-xs text-slate-500') : 'font-medium text-slate-700'}`}>
                                {row.metric.isExpandable ? (
                                    <button 
                                        onClick={() => toggleRow(row.metric.rowKey)}
                                        className="flex items-center gap-1 hover:text-petral-teal focus:outline-none transition-colors"
                                    >
                                        {row.metric.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        {row.metric.name}
                                    </button>
                                ) : (
                                    row.metric.name
                                )}
                            </td>
                            {row.metric.values.map((v: number | null, colIdx: number) => (
                                <td key={colIdx} className={`py-1 px-2 text-right tabular-nums border border-slate-200 ${row.isSubRow ? 'text-xs text-slate-600' : ''} ${v === 0 ? 'text-slate-400' : 'text-slate-800'} ${row.metric.isTotal && (v ?? 0) < 0 ? 'text-red-600' : ''} ${row.metric.isTotal && (v ?? 0) > 0 ? 'text-teal-700' : ''} ${row.metric.isCategoryHeader ? 'bg-slate-100/50' : ''}`}>
                                    {v === null ? '' : (
                                        row.metric.name === "Viajes (freq)" ? (
                                            <input 
                                                type="number"
                                                min="0"
                                                value={v}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    onFrequencyChange && onFrequencyChange(row.clientName, row.routeName, row.vesselName, months[colIdx], val);
                                                }}
                                                className="w-14 p-1 text-center block mx-auto text-xs font-bold border border-slate-200 rounded focus:border-petral-teal focus:ring-1 focus:ring-petral-teal bg-white"
                                            />
                                        ) : row.metric.name === "Flete (USD/MT)" && row.clientName.startsWith("SPOT") ? (
                                            <input 
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={v}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    onTariffChange && onTariffChange(row.clientName, row.routeName, row.vesselName, months[colIdx], val);
                                                }}
                                                className="w-16 p-1 text-right text-xs font-bold border border-slate-300 rounded focus:border-petral-teal focus:ring-1 focus:ring-petral-teal bg-white text-petral-blue"
                                            />
                                        ) : (
                                            row.metric.isCurrency ? (
                                                <div className={`flex items-center w-full min-w-[100px] ${row.metric.pct && row.metric.pct[colIdx] !== null ? 'justify-between' : 'justify-end'}`}>
                                                    <span className={`${row.metric.pct && row.metric.pct[colIdx] !== null ? 'text-left' : 'text-right'} font-medium`}>{formatCurrency(v)}</span>
                                                    {row.metric.pct && row.metric.pct[colIdx] !== null ? (
                                                        <span className="text-xs text-slate-500 bg-slate-100 px-1 py-[2px] rounded border border-slate-200 min-w-[3rem] text-center ml-2">
                                                            {row.metric.pct[colIdx].toFixed(1)}%
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ) : formatNumber(v)
                                        )
                                    )}
                                </td>
                            ))}
                            <td className={`py-1 px-2 text-right tabular-nums font-bold border border-slate-200 ${row.metric.isTotal ? 'bg-slate-200' : 'bg-slate-50'} ${row.isSubRow ? 'text-slate-300' : ''} ${row.metric.isCategoryHeader ? 'bg-slate-100/50' : ''}`}>
                                {row.metric.isCategoryHeader ? '' : (row.metric.isSubRowMetric ? '-' : (
                                    row.metric.isCurrency ? (
                                        <div className={`flex items-center w-full min-w-[100px] ${row.metric.totalPct !== null && row.metric.totalPct !== undefined ? 'justify-between' : 'justify-end'}`}>
                                            <span className={`${row.metric.totalPct !== null && row.metric.totalPct !== undefined ? 'text-left' : 'text-right'} font-medium`}>{formatCurrency(row.metric.total)}</span>
                                            {row.metric.totalPct !== null && row.metric.totalPct !== undefined ? (
                                                <span className="text-xs text-slate-600 bg-white px-1 py-[2px] rounded border border-slate-300 min-w-[3rem] text-center ml-2">
                                                    {row.metric.totalPct.toFixed(1)}%
                                                </span>
                                            ) : null}
                                        </div>
                                    ) : formatNumber(row.metric.total)
                                ))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
