import React, { useMemo, useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import './ForecastGrid.css';

const getClientColor = (name: string) => {
    if (name.includes('SPCC')) return 'bg-sky-700 text-white';
    if (name.includes('SPOT')) return 'bg-orange-500 text-white';
    return 'bg-petral-blue text-white';
};

const getRouteColor = (name: string) => {
    if (name.includes('MATARANI')) return 'bg-cyan-500 text-white';
    if (name.includes('MARCONA')) return 'bg-purple-500 text-white';
    if (name.includes('MEJILLONES')) return 'bg-fuchsia-500 text-white';
    if (name.includes('SPOT')) return 'bg-orange-500 text-white';
    return 'bg-slate-700 text-white';
};

const getVesselColor = (name: string) => {
    if (name.includes('TABLONES')) return 'bg-red-600 text-white';
    if (name.includes('MOQUEGUA')) return 'bg-green-600 text-white';
    if (name.includes('CONCON')) return 'bg-slate-600 text-white';
    if (name.includes('HUEMUL')) return 'bg-indigo-600 text-white';
    return 'bg-slate-100 text-slate-800 font-bold';
};

interface ForecastGridProps {
    data: any;
    months: string[];
    projectionLines: any[];
    onFrequencyChange?: (client_id: string, route_key: string, vessel_id: string, month_index: string, newFrequency: number) => void;
    onTariffChange?: (client_id: string, route_key: string, vessel_id: string, month_index: string, newTariff: number) => void;
    onDeleteNode?: (type: 'client'|'route'|'vessel', client_id: string, route_key?: string, vessel_id?: string) => void;
    displayMode: 'usd' | 'pct';
    demurragePct?: string;
    showDemurrage?: boolean;
    excludedDemurrages?: string[];
    customDemurrages?: Record<string, Record<number, string>>;
    onExcludeDemurrage?: React.Dispatch<React.SetStateAction<string[]>>;
    onCustomDemurrageChange?: React.Dispatch<React.SetStateAction<Record<string, Record<number, string>>>>;
}

export const ForecastGrid: React.FC<ForecastGridProps> = ({ 
    data, months, projectionLines, onFrequencyChange, onTariffChange, onDeleteNode, displayMode, 
    demurragePct = '', showDemurrage = false,
    excludedDemurrages = [], customDemurrages = {}, onExcludeDemurrage, onCustomDemurrageChange
}) => {
    
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [expandedDemurrages, setExpandedDemurrages] = useState<Record<string, boolean>>({});
    const [collapsedSubtotals, setCollapsedSubtotals] = useState<Record<string, boolean>>({});
    
    // Sort orders
    const [clientOrder, setClientOrder] = useState<string[]>([]);
    const [routeOrder, setRouteOrder] = useState<Record<string, string[]>>({});
    const [vesselOrder, setVesselOrder] = useState<Record<string, string[]>>({});

    // Context Menu
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'client'|'route'|'vessel'|'demurrage', client?: string, route?: string, vessel?: string, rowKey?: string } | null>(null);
    const [isGlobalTotalCollapsed, setIsGlobalTotalCollapsed] = useState(true);
    const [isGlobalAcumCollapsed, setIsGlobalAcumCollapsed] = useState(true);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const toggleRow = (rowKey: string) => {
        setExpandedRows(prev => ({
            ...prev,
            [rowKey]: !prev[rowKey]
        }));
    };

    const toggleDemurrage = (rowKey: string) => {
        setExpandedDemurrages(prev => ({
            ...prev,
            [rowKey]: !prev[rowKey]
        }));
    };

    const toggleSubtotal = (client: string) => {
        setCollapsedSubtotals(prev => ({
            ...prev,
            [client]: !prev[client]
        }));
    };

    const handleMove = (type: 'client'|'route'|'vessel', client: string, route: string, vessel: string, dir: 'up'|'down') => {
        if (!data || !data.aggregated_data) return;
        
        if (type === 'client') {
            const currentOrder = clientOrder.length > 0 ? [...clientOrder] : Object.keys(data.aggregated_data);
            const idx = currentOrder.indexOf(client);
            if (idx === -1) return;
            const newIdx = dir === 'up' ? Math.max(0, idx - 1) : Math.min(currentOrder.length - 1, idx + 1);
            if (idx === newIdx) return;
            [currentOrder[idx], currentOrder[newIdx]] = [currentOrder[newIdx], currentOrder[idx]];
            setClientOrder(currentOrder);
        } else if (type === 'route') {
            const currentOrder = routeOrder[client] && routeOrder[client].length > 0 ? [...routeOrder[client]] : Object.keys(data.aggregated_data[client]);
            const idx = currentOrder.indexOf(route);
            if (idx === -1) return;
            const newIdx = dir === 'up' ? Math.max(0, idx - 1) : Math.min(currentOrder.length - 1, idx + 1);
            if (idx === newIdx) return;
            [currentOrder[idx], currentOrder[newIdx]] = [currentOrder[newIdx], currentOrder[idx]];
            setRouteOrder(prev => ({ ...prev, [client]: currentOrder }));
        } else if (type === 'vessel') {
            const routeKey = `${client}-${route}`;
            const currentOrder = vesselOrder[routeKey] && vesselOrder[routeKey].length > 0 ? [...vesselOrder[routeKey]] : Object.keys(data.aggregated_data[client][route]);
            const idx = currentOrder.indexOf(vessel);
            if (idx === -1) return;
            const newIdx = dir === 'up' ? Math.max(0, idx - 1) : Math.min(currentOrder.length - 1, idx + 1);
            if (idx === newIdx) return;
            [currentOrder[idx], currentOrder[newIdx]] = [currentOrder[newIdx], currentOrder[idx]];
            setVesselOrder(prev => ({ ...prev, [routeKey]: currentOrder }));
        }
    };

    const rows = useMemo(() => {
        if (!data || !data.aggregated_data) return [];
        
        const result: any[] = [];
        
        let clients = Object.keys(data.aggregated_data);
        if (clientOrder.length > 0) {
            clients.sort((a,b) => {
                const idxA = clientOrder.indexOf(a);
                const idxB = clientOrder.indexOf(b);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                return 0;
            });
        }

        const sum = (arr: number[]) => arr.reduce((a,b) => a+b, 0);

        const globalTrips = new Array(months.length).fill(0);
        const globalTons = new Array(months.length).fill(0);
        const globalRevenues = new Array(months.length).fill(0);
        const globalPortCosts = new Array(months.length).fill(0);
        const globalBunkerCosts = new Array(months.length).fill(0);
        const globalVoyageResult = new Array(months.length).fill(0);
        const globalDemurrage = new Array(months.length).fill(0);

        clients.forEach((client) => {
            const routesData = data.aggregated_data[client];
            const clientRowSpanRef = { value: 0 };
            
            let isFirstClientRow = true;

            const clientGrossRevenue = new Array(months.length).fill(0);
            const clientPortCosts = new Array(months.length).fill(0);
            const clientBunkerCosts = new Array(months.length).fill(0);
            const clientVoyageResult = new Array(months.length).fill(0);
            const clientDemurrage = new Array(months.length).fill(0);
            const clientTonsTotal = new Array(months.length).fill(0);
            
            let routesList = Object.keys(routesData);
            if (routeOrder[client] && routeOrder[client].length > 0) {
                routesList.sort((a,b) => {
                    const idxA = routeOrder[client].indexOf(a);
                    const idxB = routeOrder[client].indexOf(b);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    return 0;
                });
            }

            routesList.forEach((route) => {
                const vesselsData = routesData[route];
                const routeRowSpanRef = { value: 0 };
                let isFirstRouteRow = true;
                
                let vesselsList = Object.keys(vesselsData);
                const rKey = `${client}-${route}`;
                if (vesselOrder[rKey] && vesselOrder[rKey].length > 0) {
                    vesselsList.sort((a,b) => {
                        const idxA = vesselOrder[rKey].indexOf(a);
                        const idxB = vesselOrder[rKey].indexOf(b);
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        return 0;
                    });
                }

                vesselsList.forEach((vessel) => {
                    const monthData = vesselsData[vessel];
                    const rowKey = `${client}-${route}-${vessel}`;
                    const isExpanded = !!expandedRows[rowKey];
                    const numSubRows = isExpanded ? 17 : 0;
                    const isDemurrageExcluded = excludedDemurrages.includes(rowKey);
                    const isDemurrageVisible = showDemurrage && demurragePct !== '' && !isDemurrageExcluded;
                    
                    const isDemurrageExpanded = !!expandedDemurrages[rowKey];
                    // If visible, it adds 1 main row. If expanded, it adds 2 sub-rows.
                    const demurrageRowsCount = isDemurrageVisible ? (isDemurrageExpanded ? 3 : 1) : 0;
                    
                    const vesselRowSpan = 6 + numSubRows + demurrageRowsCount;
                    
                    clientRowSpanRef.value += vesselRowSpan;
                    routeRowSpanRef.value += vesselRowSpan;

                    const getMonthlyValues = (metricKey: string) => {
                        return months.map(m => {
                            const val = monthData[m]?.[metricKey];
                            return val || 0;
                        });
                    };

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
                    
                    // Calculamos el demurrage con porcentajes customizados si los hay
                    const demurragePctArray = months.map((_, i) => {
                        if (customDemurrages[rowKey] && customDemurrages[rowKey][i] !== undefined) {
                            return parseFloat(customDemurrages[rowKey][i]) || 0;
                        }
                        return parseFloat(demurragePct) || 0;
                    });

                    const demurrageArr = isDemurrageVisible ? revenues.map((r, i) => r * (demurragePctArray[i] / 100)) : new Array(months.length).fill(0);
                    if (isDemurrageVisible) {
                        demurrageArr.forEach((v, i) => clientDemurrage[i] += v);
                    }

                    const unitCargos = getMonthlyValues("carga_unit");
                    const tonsTotal = months.map((_, i) => unitCargos[i] * trips[i]);
                    tonsTotal.forEach((v, i) => clientTonsTotal[i] += v);

                    const sum = (arr: number[]) => arr.reduce((a,b) => a+b, 0);
                    const calcPct = (arr: number[]) => arr.map((v, i) => revenues[i] ? (v / revenues[i]) * 100 : 0);
                    const calcTotalPct = (totalVal: number, totalRev: number) => totalRev ? (totalVal / totalRev) * 100 : 0;

                    const metrics: any[] = [
                        { name: "Viajes (freq)", values: trips, total: sum(trips), pct: null, totalPct: null, isCurrency: false, isTotal: false, isExpandable: true, rowKey, isExpanded },
                        { name: "Toneladas", values: tonsTotal, total: sum(tonsTotal), pct: null, totalPct: null, isCurrency: false, isTotal: false },
                        { name: "Gross Revenue", values: revenues, total: sum(revenues), pct: revenues.map(r => r ? 100 : 0), totalPct: sum(revenues) ? 100 : 0, isCurrency: true, isTotal: false },
                        { name: "Port Costs", values: portCosts, total: sum(portCosts), pct: calcPct(portCosts), totalPct: calcTotalPct(sum(portCosts), sum(revenues)), isCurrency: true, isTotal: false },
                        { name: "Bunker Costs", values: bunker, total: sum(bunker), pct: calcPct(bunker), totalPct: calcTotalPct(sum(bunker), sum(revenues)), isCurrency: true, isTotal: false },
                        { name: "Voyage Result", values: voyageResult, total: sum(voyageResult), pct: calcPct(voyageResult), totalPct: calcTotalPct(sum(voyageResult), sum(revenues)), isCurrency: true, isTotal: true }
                    ];

                    if (isDemurrageVisible) {
                        metrics.push({ name: "Demurrage", values: demurrageArr, total: sum(demurrageArr), pct: null, totalPct: null, isCurrency: true, isTotal: false, isExpandableDemurrage: true, rowKey, isExpanded: isDemurrageExpanded });
                    }

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

                        if (metric.name === "Demurrage" && isDemurrageExpanded) {
                            // Sub-row 1: Demurrage (%) - editable
                            result.push({
                                client: null, route: null, vessel: null,
                                clientName: client, routeName: route, vesselName: vessel,
                                metric: {
                                    name: "↳ Demurrage (%)",
                                    values: demurragePctArray,
                                    total: 0,
                                    pct: null,
                                    totalPct: null,
                                    isCurrency: false,
                                    isTotal: false,
                                    isDemurragePctEditable: true,
                                    rowKey
                                },
                                isSubRow: true
                            });
                            // Sub-row 2: Demurrage (USD) - calculated
                            result.push({
                                client: null, route: null, vessel: null,
                                clientName: client, routeName: route, vesselName: vessel,
                                metric: {
                                    name: "↳ Demurrage (USD)",
                                    values: demurrageArr,
                                    total: sum(demurrageArr),
                                    pct: null,
                                    totalPct: null,
                                    isCurrency: true,
                                    isTotal: false
                                },
                                isSubRow: true
                            });
                        }

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

                    months.forEach((_, i) => {
                        globalTrips[i] += trips[i] || 0;
                        globalTons[i] += tonsTotal[i] || 0;
                        globalRevenues[i] += revenues[i] || 0;
                        globalPortCosts[i] += portCosts[i] || 0;
                        globalBunkerCosts[i] += bunker[i] || 0;
                        globalVoyageResult[i] += voyageResult[i] || 0;
                        globalDemurrage[i] += demurrageArr[i] || 0;
                    });

                    isFirstRouteRow = false;
                    isFirstClientRow = false;
                });
            });

            const clientCalcPct = (arr: number[]) => arr.map((v, i) => clientGrossRevenue[i] ? (v / clientGrossRevenue[i]) * 100 : 0);
            const clientCalcTotalPct = (totalVal: number, totalRev: number) => totalRev ? (totalVal / totalRev) * 100 : 0;

            // New 6-KPI layout for Subtotals
            const clientGrossPlusDem = clientGrossRevenue.map((rev, i) => rev + (clientDemurrage[i] || 0));
            const totalGrossPlusDem = sum(clientGrossPlusDem);
            const totalClientTons = sum(clientTonsTotal);
            const clientYield = clientTonsTotal.map((tons, i) => tons ? clientGrossPlusDem[i] / tons : 0);
            const totalClientYield = totalClientTons ? totalGrossPlusDem / totalClientTons : 0;
            const clientYieldFlete = clientTonsTotal.map((tons, i) => tons ? clientGrossRevenue[i] / tons : 0);
            const totalClientYieldFlete = totalClientTons ? sum(clientGrossRevenue) / totalClientTons : 0;

            const subMetrics = [
                { name: "Gross Revenue", values: clientGrossRevenue, total: sum(clientGrossRevenue), pct: clientGrossRevenue.map(r => r ? 100 : 0), totalPct: sum(clientGrossRevenue) ? 100 : 0, isCurrency: true, isTotal: false },
                { name: "Voyage Result", values: clientVoyageResult, total: sum(clientVoyageResult), pct: clientCalcPct(clientVoyageResult), totalPct: clientCalcTotalPct(sum(clientVoyageResult), sum(clientGrossRevenue)), isCurrency: true, isTotal: false },
                { name: "Demurrage", values: clientDemurrage, total: sum(clientDemurrage), pct: clientCalcPct(clientDemurrage), totalPct: clientCalcTotalPct(sum(clientDemurrage), sum(clientGrossRevenue)), isCurrency: true, isTotal: false },
                { name: "Toneladas", values: clientTonsTotal, total: totalClientTons, pct: null, totalPct: null, isCurrency: false, isTotal: false },
                { name: "Gross + Demurrage", values: clientGrossPlusDem, total: totalGrossPlusDem, pct: clientCalcPct(clientGrossPlusDem), totalPct: clientCalcTotalPct(totalGrossPlusDem, sum(clientGrossRevenue)), isCurrency: true, isTotal: false },
                { name: "Yield Flete (USD/MT)", values: clientYieldFlete, total: totalClientYieldFlete, pct: null, totalPct: null, isCurrency: true, isTotal: true },
                { name: "Yield (USD/MT)", values: clientYield, total: totalClientYield, pct: null, totalPct: null, isCurrency: true, isTotal: true }
            ];

            const isSubtotalCollapsed = !!collapsedSubtotals[client];
            const visibleSubMetrics = isSubtotalCollapsed ? [subMetrics[0]] : subMetrics;

            clientRowSpanRef.value += visibleSubMetrics.length;
            const subtotalRouteRowSpanRef = { value: visibleSubMetrics.length };

            visibleSubMetrics.forEach((metric, index) => {
                const isExpandableRow = metric.name === "Gross Revenue";
                
                result.push({
                    client: null,
                    route: index === 0 ? { name: "Σ SUBTOTAL", rowSpanRef: subtotalRouteRowSpanRef, isSubtotal: true } : null,
                    vessel: index === 0 ? { name: "TOTAL CLIENTE", rowSpan: visibleSubMetrics.length, isSubtotal: true } : null,
                    clientName: client,
                    routeName: "",
                    vesselName: "",
                    metric: {
                        ...metric,
                        isExpandableSubtotal: isExpandableRow,
                        clientKey: client,
                        isCollapsed: isSubtotalCollapsed
                    },
                    isSubRow: false,
                    isClientSubtotal: true
                });
            });

        });
        
        // TOTAL FLOTA
        const globalCalcPct = (arr: number[]) => arr.map((v, i) => globalRevenues[i] ? (v / globalRevenues[i]) * 100 : 0);
        const globalCalcTotalPct = (totalVal: number, totalRev: number) => totalRev ? (totalVal / totalRev) * 100 : 0;

        const globalGrossPlusDem = globalRevenues.map((rev, i) => rev + (globalDemurrage[i] || 0));
        const totalGlobalGrossPlusDem = sum(globalGrossPlusDem);
        const totalGlobalTons = sum(globalTons);
        const globalYield = globalTons.map((tons, i) => tons ? globalGrossPlusDem[i] / tons : 0);
        const totalGlobalYield = totalGlobalTons ? totalGlobalGrossPlusDem / totalGlobalTons : 0;
        const globalYieldFlete = globalTons.map((tons, i) => tons ? globalRevenues[i] / tons : 0);
        const totalGlobalYieldFlete = totalGlobalTons ? sum(globalRevenues) / totalGlobalTons : 0;

        const globalMetrics = [
            { name: "Gross Revenue", values: globalRevenues, total: sum(globalRevenues), pct: globalRevenues.map(r => r ? 100 : 0), totalPct: sum(globalRevenues) ? 100 : 0, isCurrency: true, isTotal: false },
            { name: "Voyage Result", values: globalVoyageResult, total: sum(globalVoyageResult), pct: globalCalcPct(globalVoyageResult), totalPct: globalCalcTotalPct(sum(globalVoyageResult), sum(globalRevenues)), isCurrency: true, isTotal: false },
            { name: "Demurrage", values: globalDemurrage, total: sum(globalDemurrage), pct: globalCalcPct(globalDemurrage), totalPct: globalCalcTotalPct(sum(globalDemurrage), sum(globalRevenues)), isCurrency: true, isTotal: false },
            { name: "Toneladas", values: globalTons, total: totalGlobalTons, pct: null, totalPct: null, isCurrency: false, isTotal: false },
            { name: "Gross + Demurrage", values: globalGrossPlusDem, total: totalGlobalGrossPlusDem, pct: globalCalcPct(globalGrossPlusDem), totalPct: globalCalcTotalPct(totalGlobalGrossPlusDem, sum(globalRevenues)), isCurrency: true, isTotal: false },
            { name: "Yield Flete (USD/MT)", values: globalYieldFlete, total: totalGlobalYieldFlete, pct: null, totalPct: null, isCurrency: true, isTotal: true },
            { name: "Yield (USD/MT)", values: globalYield, total: totalGlobalYield, pct: null, totalPct: null, isCurrency: true, isTotal: true }
        ];

        const visibleGlobalMetrics = isGlobalTotalCollapsed ? [globalMetrics[0]] : globalMetrics;
        const globalRouteRowSpanRef = { value: visibleGlobalMetrics.length };

        visibleGlobalMetrics.forEach((metric, index) => {
            const isExpandableRow = metric.name === "Gross Revenue";
            result.push({
                client: index === 0 ? { name: "TOTAL FLOTA", rowSpanRef: globalRouteRowSpanRef, isSubtotal: true, color: "bg-slate-800 text-white" } : null,
                route: null,
                vessel: null,
                clientName: "TOTAL FLOTA",
                routeName: "",
                vesselName: "",
                metric: {
                    ...metric,
                    isExpandableGlobal: isExpandableRow,
                    globalType: 'total',
                    isCollapsed: isGlobalTotalCollapsed
                },
                isSubRow: false,
                isGlobalTotal: true
            });
        });

        // TOTAL ACUMULADO
        const accumArray = (arr: number[]) => {
            let running = 0;
            return arr.map(v => { running += v; return running; });
        };
        const accumTons = accumArray(globalTons);
        const accumRevenues = accumArray(globalRevenues);
        const accumVoyageResult = accumArray(globalVoyageResult);
        const accumDemurrage = accumArray(globalDemurrage);

        const accumCalcPct = (arr: number[]) => arr.map((v, i) => accumRevenues[i] ? (v / accumRevenues[i]) * 100 : 0);
        const lastVal = (arr: number[]) => arr.length > 0 ? arr[arr.length - 1] : 0;

        const accumGrossPlusDem = accumRevenues.map((rev, i) => rev + (accumDemurrage[i] || 0));
        const accumYield = accumTons.map((tons, i) => tons ? accumGrossPlusDem[i] / tons : 0);
        const accumYieldFlete = accumTons.map((tons, i) => tons ? accumRevenues[i] / tons : 0);

        const accumMetrics = [
            { name: "Gross Revenue", values: accumRevenues, total: lastVal(accumRevenues), pct: accumRevenues.map(r => r ? 100 : 0), totalPct: sum(accumRevenues) ? 100 : 0, isCurrency: true, isTotal: false },
            { name: "Voyage Result", values: accumVoyageResult, total: lastVal(accumVoyageResult), pct: accumCalcPct(accumVoyageResult), totalPct: globalCalcTotalPct(lastVal(accumVoyageResult), lastVal(accumRevenues)), isCurrency: true, isTotal: false },
            { name: "Demurrage", values: accumDemurrage, total: lastVal(accumDemurrage), pct: accumCalcPct(accumDemurrage), totalPct: globalCalcTotalPct(lastVal(accumDemurrage), lastVal(accumRevenues)), isCurrency: true, isTotal: false },
            { name: "Toneladas", values: accumTons, total: lastVal(accumTons), pct: null, totalPct: null, isCurrency: false, isTotal: false },
            { name: "Gross + Demurrage", values: accumGrossPlusDem, total: lastVal(accumGrossPlusDem), pct: accumCalcPct(accumGrossPlusDem), totalPct: globalCalcTotalPct(lastVal(accumGrossPlusDem), lastVal(accumRevenues)), isCurrency: true, isTotal: false },
            { name: "Yield Flete (USD/MT)", values: accumYieldFlete, total: lastVal(accumYieldFlete), pct: null, totalPct: null, isCurrency: true, isTotal: true },
            { name: "Yield (USD/MT)", values: accumYield, total: lastVal(accumYield), pct: null, totalPct: null, isCurrency: true, isTotal: true }
        ];

        const visibleAccumMetrics = isGlobalAcumCollapsed ? [accumMetrics[0]] : accumMetrics;
        const accumRouteRowSpanRef = { value: visibleAccumMetrics.length };

        visibleAccumMetrics.forEach((metric, index) => {
            const isExpandableRow = metric.name === "Gross Revenue";
            result.push({
                client: index === 0 ? { name: "TOTAL ACUMULADO", rowSpanRef: accumRouteRowSpanRef, isSubtotal: true, color: "bg-petral-teal text-white" } : null,
                route: null,
                vessel: null,
                clientName: "TOTAL ACUMULADO",
                routeName: "",
                vesselName: "",
                metric: {
                    ...metric,
                    isExpandableGlobal: isExpandableRow,
                    globalType: 'accum',
                    isCollapsed: isGlobalAcumCollapsed
                },
                isSubRow: false,
                isGlobalTotal: true
            });
        });

        return result;
    }, [data, months, projectionLines, expandedRows, clientOrder, routeOrder, vesselOrder, collapsedSubtotals, isGlobalTotalCollapsed, isGlobalAcumCollapsed, demurragePct, showDemurrage, expandedDemurrages, excludedDemurrages, customDemurrages]);

    const formatCurrency = (val: number) => {
        if (val === 0) return "-";
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
    };

    const formatYield = (val: number) => {
        if (val === 0) return "-";
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
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
        <div className="flex flex-col gap-2 relative">
            <div className="table-container shadow-sm border border-slate-200 rounded-lg overflow-auto max-h-[75vh] bg-white relative">
                <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-800 text-white uppercase font-semibold text-xs tracking-wider sticky top-0 z-20 shadow-md">
                    <tr>
                        <th className="py-1 px-2 text-center border border-slate-700 w-12 bg-slate-800">Cliente</th>
                        <th className="py-1 px-2 text-center border border-slate-700 w-12 bg-slate-800">Ruta</th>
                        <th className="py-1 px-2 text-center border border-slate-700 w-12 bg-slate-800">Buque</th>
                        <th className="py-1 px-2 border border-slate-700 w-48 bg-slate-800">Métricas</th>
                        {months.map(m => {
                            const date = new Date(`${m}-02`);
                            const formatted = new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(date).replace('.', '');
                            return <th key={m} className="py-1 px-2 text-center border border-slate-700 capitalize bg-slate-800">{formatted}</th>;
                        })}
                        <th className="py-1 px-2 text-right border border-slate-700 bg-slate-900">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} 
                            onDoubleClick={() => {
                                if (row.metric.isExpandableGlobal) {
                                    if (row.metric.globalType === 'total') setIsGlobalTotalCollapsed(!isGlobalTotalCollapsed);
                                    if (row.metric.globalType === 'accum') setIsGlobalAcumCollapsed(!isGlobalAcumCollapsed);
                                }
                            }}
                            className={`border border-slate-200 transition-colors ${row.isSubRow ? 'bg-slate-50/50' : 'hover:bg-slate-50'} ${row.metric.isTotal ? 'bg-slate-100 font-semibold' : ''} ${row.isClientSubtotal ? 'bg-amber-50/30 font-semibold' : ''} ${row.isGlobalTotal ? 'bg-indigo-50/20 font-bold' : ''}`}>
                            {row.client && (
                                <td rowSpan={row.client.rowSpanRef.value} colSpan={row.isGlobalTotal ? 3 : 1}
                                    onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'client', client: row.client.name }); }}
                                    className={`p-0 border border-slate-200 align-middle ${row.client.color || getClientColor(row.client.name)} relative group cursor-context-menu`}>
                                    {!row.isGlobalTotal && (
                                    <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleMove('client', row.client.name, '', '', 'up')} className="text-slate-300 hover:text-white"><ChevronUp size={14} /></button>
                                        <button onClick={() => handleMove('client', row.client.name, '', '', 'down')} className="text-slate-300 hover:text-white"><ChevronDown size={14} /></button>
                                    </div>
                                    )}
                                    <div className={`vertical-text mx-auto px-2 ${row.isGlobalTotal ? 'text-lg tracking-wider transform rotate-0 writing-mode-unset flex items-center justify-center h-full' : ''}`} style={row.isGlobalTotal ? { writingMode: 'unset', transform: 'none' } : {}}>{row.client.name}</div>
                                </td>
                            )}
                            {row.route && (
                                <td rowSpan={row.route.rowSpanRef.value} 
                                    onContextMenu={(e) => { if(!row.route.isSubtotal) { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'route', client: row.clientName, route: row.route.name }); } }}
                                    className={`p-0 border border-slate-200 align-middle relative group ${row.route.isSubtotal ? 'bg-slate-800 text-amber-400 font-bold' : getRouteColor(row.route.name) + ' cursor-context-menu'}`}>
                                    {!row.route.isSubtotal && (
                                        <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button onClick={() => handleMove('route', row.clientName, row.route.name, '', 'up')} className="text-slate-400 hover:text-white"><ChevronUp size={14} /></button>
                                            <button onClick={() => handleMove('route', row.clientName, row.route.name, '', 'down')} className="text-slate-400 hover:text-white"><ChevronDown size={14} /></button>
                                        </div>
                                    )}
                                    <div className="vertical-text mx-auto px-2">{row.route.name}</div>
                                </td>
                            )}
                            {row.vessel && (
                                <td rowSpan={row.vessel.rowSpan} 
                                    onContextMenu={(e) => { if(!row.vessel.isSubtotal) { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'vessel', client: row.clientName, route: row.routeName, vessel: row.vessel.name }); } }}
                                    className={`p-0 border border-slate-200 align-middle relative group ${row.vessel.isSubtotal ? 'bg-amber-100 text-amber-900 font-bold' : getVesselColor(row.vessel.name) + ' cursor-context-menu'}`}>
                                    {!row.vessel.isSubtotal && (
                                        <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button onClick={() => handleMove('vessel', row.clientName, row.routeName, row.vessel.name, 'up')} className="text-slate-400 hover:text-petral-blue"><ChevronUp size={14} /></button>
                                            <button onClick={() => handleMove('vessel', row.clientName, row.routeName, row.vessel.name, 'down')} className="text-slate-400 hover:text-petral-blue"><ChevronDown size={14} /></button>
                                        </div>
                                    )}
                                    <div className="vertical-text mx-auto px-2">{row.vessel.name}</div>
                                </td>
                            )}
                            <td 
                                onContextMenu={(e) => {
                                    if (row.metric.isExpandableDemurrage) {
                                        e.preventDefault();
                                        setContextMenu({ x: e.clientX, y: e.clientY, type: 'demurrage', client: row.clientName, route: row.routeName, vessel: row.vesselName, rowKey: row.metric.rowKey });
                                    }
                                }}
                                className={`py-1 px-2 border border-slate-200 ${row.isSubRow ? (row.metric.isCategoryHeader ? 'pl-6 text-xs text-slate-800 font-bold uppercase tracking-wider bg-slate-100/50' : 'pl-10 text-xs text-slate-500') : 'font-medium text-slate-700'} ${row.metric.isExpandableDemurrage ? 'cursor-context-menu bg-amber-50' : ''}`}
                            >
                                {row.metric.isExpandable ? (
                                    <button 
                                        onClick={() => toggleRow(row.metric.rowKey)}
                                        className="flex items-center gap-1 hover:text-petral-teal focus:outline-none transition-colors"
                                    >
                                        {row.metric.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        {row.metric.name}
                                    </button>
                                ) : row.metric.isExpandableDemurrage ? (
                                    <button 
                                        onClick={() => toggleDemurrage(row.metric.rowKey)}
                                        className="flex items-center gap-1 text-amber-700 hover:text-amber-900 focus:outline-none transition-colors font-bold w-full h-full text-left"
                                    >
                                        {row.metric.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        {row.metric.name}
                                    </button>
                                ) : row.metric.isExpandableSubtotal ? (
                                    <button 
                                        onClick={() => toggleSubtotal(row.metric.clientKey)}
                                        className="flex items-center gap-1 text-petral-teal hover:text-petral-blue focus:outline-none transition-colors font-bold"
                                    >
                                        {row.metric.isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        {row.metric.name}
                                    </button>
                                ) : row.metric.isExpandableGlobal ? (
                                    <button 
                                        onClick={() => {
                                            if (row.metric.globalType === 'total') setIsGlobalTotalCollapsed(!isGlobalTotalCollapsed);
                                            if (row.metric.globalType === 'accum') setIsGlobalAcumCollapsed(!isGlobalAcumCollapsed);
                                        }}
                                        className="flex items-center gap-1 text-indigo-700 hover:text-indigo-900 focus:outline-none transition-colors font-bold w-full h-full text-left"
                                    >
                                        {row.metric.isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        {row.metric.name}
                                    </button>
                                ) : (
                                    row.metric.name
                                )}
                            </td>
                            {row.metric.values.map((v: number | null, colIdx: number) => (
                                <td key={colIdx} className={`py-1 px-2 text-right tabular-nums border border-slate-200 ${row.isSubRow ? 'text-xs text-slate-600' : ''} ${v === 0 ? 'text-slate-400' : 'text-slate-800'} ${row.metric.isTotal && (v ?? 0) < 0 ? 'text-red-600' : ''} ${row.metric.isTotal && (v ?? 0) > 0 ? 'text-teal-700' : ''} ${row.metric.isCategoryHeader ? 'bg-slate-100/50' : ''}`}>
                                    {v === null ? '' : (
                                        row.metric.isDemurragePctEditable ? (
                                            <input 
                                                type="number"
                                                min="0"
                                                value={v}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (onCustomDemurrageChange) {
                                                        onCustomDemurrageChange(prev => ({
                                                            ...prev,
                                                            [row.metric.rowKey]: {
                                                                ...(prev[row.metric.rowKey] || {}),
                                                                [colIdx]: val
                                                            }
                                                        }));
                                                    }
                                                }}
                                                className="w-14 p-1 text-center block mx-auto text-xs font-bold border border-slate-200 rounded focus:border-petral-teal focus:ring-1 focus:ring-petral-teal bg-amber-50"
                                            />
                                        ) : row.metric.name === "Viajes (freq)" && !row.isClientSubtotal && !row.isGlobalTotal ? (
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
                                        ) : row.metric.name === "Flete (USD/MT)" && (row.clientName.startsWith("SPOT") || row.clientName.startsWith("NEXA")) && !row.isClientSubtotal && !row.isGlobalTotal ? (
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
                                                <div className="flex items-center justify-end w-full min-w-[60px]">
                                                    {displayMode === 'pct' && row.metric.pct && row.metric.pct[colIdx] !== null ? (
                                                        <span className="font-medium text-slate-700">
                                                            {row.metric.pct[colIdx].toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="font-medium">
                                                            {row.metric.name === "Yield (USD/MT)" || row.metric.name === "Yield Flete (USD/MT)" || row.metric.name === "Flete (USD/MT)" ? formatYield(v) : formatCurrency(v)}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="font-medium text-slate-700">{formatNumber(v)}</span>
                                            )
                                        )
                                    )}
                                </td>
                            ))}
                            <td className={`py-1 px-2 text-right tabular-nums font-bold border border-slate-200 ${row.metric.isTotal ? 'bg-slate-200' : 'bg-slate-50'} ${row.isSubRow ? 'text-slate-300' : ''} ${row.metric.isCategoryHeader ? 'bg-slate-100/50' : ''}`}>
                                {row.metric.isCategoryHeader ? '' : (row.metric.isSubRowMetric ? '-' : (
                                    row.metric.isCurrency ? (
                                        <div className="flex items-center justify-end w-full min-w-[60px]">
                                            {displayMode === 'pct' && row.metric.totalPct !== null && row.metric.totalPct !== undefined ? (
                                                <span className="font-bold">
                                                    {row.metric.totalPct.toFixed(1)}%
                                                </span>
                                            ) : (
                                                <span className="font-bold">
                                                    {row.metric.name === "Yield (USD/MT)" || row.metric.name === "Yield Flete (USD/MT)" || row.metric.name === "Flete (USD/MT)" ? formatYield(row.metric.total) : formatCurrency(row.metric.total)}
                                                </span>
                                            )}
                                        </div>
                                    ) : formatNumber(row.metric.total)
                                ))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        {/* Custom Context Menu */}
        {contextMenu && (
            <div 
                className="fixed z-50 bg-white border border-slate-200 rounded-md shadow-lg py-1 min-w-[150px] animate-in fade-in zoom-in-95 duration-100"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-3 py-2 border-b border-slate-100 text-xs font-bold text-slate-500 bg-slate-50/50">
                    {contextMenu.type === 'client' && 'Cliente: ' + contextMenu.client}
                    {contextMenu.type === 'route' && 'Ruta: ' + contextMenu.route}
                    {contextMenu.type === 'vessel' && 'Buque: ' + contextMenu.vessel}
                    {contextMenu.type === 'demurrage' && 'Demurrage: ' + contextMenu.vessel}
                </div>
                <button 
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    onClick={() => {
                        if (contextMenu.type === 'demurrage' && contextMenu.rowKey && onExcludeDemurrage) {
                            onExcludeDemurrage(prev => [...prev, contextMenu.rowKey!]);
                        } else if (onDeleteNode && contextMenu.client) {
                            onDeleteNode(contextMenu.type as any, contextMenu.client, contextMenu.route, contextMenu.vessel);
                        }
                        setContextMenu(null);
                    }}
                >
                    <Trash2 size={16} /> 
                    Borrar {contextMenu.type === 'client' ? 'Cliente' : contextMenu.type === 'route' ? 'Ruta' : contextMenu.type === 'demurrage' ? 'Demurrage' : 'Buque'}
                </button>
            </div>
        )}
        </div>
    );
};
