import React, { useMemo } from 'react';
import './ForecastGrid.css';

interface ForecastGridProps {
    data: any;
    months: string[];
    projectionLines?: any[];
}

export const ForecastGrid: React.FC<ForecastGridProps> = ({ data, months, projectionLines = [] }) => {
    
    const rows = useMemo(() => {
        if (!data || !data.aggregated_data) return [];
        
        const result: any[] = [];
        
        Object.entries(data.aggregated_data).forEach(([client, routes]: any) => {
            const clientRowSpan = Object.values(routes).reduce((acc: number, vessels: any) => {
                return acc + Object.keys(vessels).length * 5;
            }, 0) as number;
            
            let isFirstClientRow = true;
            
            Object.entries(routes).forEach(([route, vessels]: any) => {
                const routeRowSpan = Object.keys(vessels).length * 5;
                let isFirstRouteRow = true;
                
                Object.entries(vessels).forEach(([vessel, monthData]: any) => {
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

                    const sum = (arr: number[]) => arr.reduce((a,b) => a+b, 0);

                    const metrics = [
                        { name: "Viajes (freq)", values: trips, total: sum(trips), isCurrency: false, isTotal: false },
                        { name: "Gross Revenue", values: revenues, total: sum(revenues), isCurrency: true, isTotal: false },
                        { name: "Port Costs", values: portCosts, total: sum(portCosts), isCurrency: true, isTotal: false },
                        { name: "Bunker Costs", values: bunker, total: sum(bunker), isCurrency: true, isTotal: false },
                        { name: "Voyage Result", values: voyageResult, total: sum(voyageResult), isCurrency: true, isTotal: true }
                    ];

                    metrics.forEach((metric, index) => {
                        result.push({
                            client: isFirstClientRow && isFirstRouteRow && index === 0 ? { name: client, rowSpan: clientRowSpan } : null,
                            route: isFirstRouteRow && index === 0 ? { name: route, rowSpan: routeRowSpan } : null,
                            vessel: index === 0 ? { name: vessel, rowSpan: 5 } : null,
                            metric: metric
                        });
                    });

                    isFirstRouteRow = false;
                    isFirstClientRow = false;
                });
            });
        });
        
        return result;
    }, [data, months]);

    const formatCurrency = (val: number) => {
        if (val === 0) return "-";
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
    };

    const formatNumber = (val: number) => {
        if (val === 0) return "-";
        return val.toString();
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
                        <th className="p-3 text-center border border-slate-700 w-12">Cliente</th>
                        <th className="p-3 text-center border border-slate-700 w-12">Ruta</th>
                        <th className="p-3 text-center border border-slate-700 w-12">Buque</th>
                        <th className="p-3 border border-slate-700 w-48">Métricas</th>
                        {months.map(m => {
                            const date = new Date(`${m}-02`);
                            const formatted = new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(date).replace('.', '');
                            return <th key={m} className="p-3 text-right border border-slate-700 capitalize">{formatted}</th>;
                        })}
                        <th className="p-3 text-right border border-slate-700 bg-slate-900">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className={`border border-slate-200 hover:bg-slate-50 transition-colors ${row.metric.isTotal ? 'bg-slate-100 font-semibold' : ''}`}>
                            {row.client && (
                                <td rowSpan={row.client.rowSpan} className="p-0 border border-slate-200 align-middle bg-petral-blue text-white">
                                    <div className="vertical-text mx-auto px-2">{row.client.name}</div>
                                </td>
                            )}
                            {row.route && (
                                <td rowSpan={row.route.rowSpan} className="p-0 border border-slate-200 align-middle bg-slate-700 text-white">
                                    <div className="vertical-text mx-auto px-2">{row.route.name}</div>
                                </td>
                            )}
                            {row.vessel && (
                                <td rowSpan={row.vessel.rowSpan} className="p-0 border border-slate-200 align-middle bg-slate-100 text-slate-800 font-bold">
                                    <div className="vertical-text mx-auto px-2">{row.vessel.name}</div>
                                </td>
                            )}
                            <td className="p-3 border border-slate-200 font-medium text-slate-700">
                                {row.metric.name}
                            </td>
                            {row.metric.values.map((v: number, colIdx: number) => (
                                <td key={colIdx} className={`p-3 text-right tabular-nums border border-slate-200 ${v === 0 ? 'text-slate-400' : 'text-slate-800'} ${row.metric.isTotal && v < 0 ? 'text-red-600' : ''} ${row.metric.isTotal && v > 0 ? 'text-teal-700' : ''}`}>
                                    {row.metric.isCurrency ? formatCurrency(v) : formatNumber(v)}
                                </td>
                            ))}
                            <td className={`p-3 text-right tabular-nums font-bold border border-slate-200 ${row.metric.isTotal ? 'bg-slate-200' : 'bg-slate-50'}`}>
                                {row.metric.isCurrency ? formatCurrency(row.metric.total) : formatNumber(row.metric.total)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
