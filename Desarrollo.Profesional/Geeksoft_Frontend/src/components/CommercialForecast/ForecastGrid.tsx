import React, { useMemo, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';
import { ForecastGridFilters } from './ForecastGridFilters';
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

const getCellColor = (type: 'client' | 'route' | 'vessel' | undefined, name: string) => {
    if (!type) return '';
    if (type === 'client') return getClientColor(name);
    if (type === 'route') return getRouteColor(name);
    return getVesselColor(name);
};

const getColumnHeaderLabel = (type: 'client' | 'route' | 'vessel') => {
    if (type === 'client') return 'Cliente';
    if (type === 'route') return 'Ruta';
    return 'Buque';
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
    spotRoutes?: any[];
}

export const ForecastGrid: React.FC<ForecastGridProps> = ({ 
    data, months, projectionLines, onFrequencyChange, onTariffChange, onDeleteNode, displayMode, 
    demurragePct = '', showDemurrage = false,
    excludedDemurrages = [], customDemurrages = {}, onExcludeDemurrage, onCustomDemurrageChange,
    spotRoutes = []
}) => {
    const { hiddenClients, hiddenRoutes, hiddenVessels, hiddenMonths, showSubtotals, showAccumulatedTotal } = useForecastContext_V2();
    
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [expandedDemurrages, setExpandedDemurrages] = useState<Record<string, boolean>>({});
    const [collapsedSubtotals, setCollapsedSubtotals] = useState<Record<string, boolean>>({});
    const [groupOrder, setGroupOrder] = useState<('client' | 'route' | 'vessel')[]>(['client', 'route', 'vessel']);

    const handleGroupOrderSwap = (idx1: number, idx2: number) => {
        setGroupOrder(prev => {
            const next = [...prev];
            [next[idx1], next[idx2]] = [next[idx2], next[idx1]];
            return next;
        });
    };
    
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
        const sum = (arr: number[]) => arr.reduce((a,b) => a+b, 0);

        // 1. Aplanar las hojas del árbol original
        const flatLeaves: Array<{
            client: string;
            route: string;
            vessel: string;
            monthData: any;
        }> = [];

        Object.entries(data.aggregated_data).forEach(([client, routesData]: any) => {
            Object.entries(routesData).forEach(([route, vesselsData]: any) => {
                Object.entries(vesselsData).forEach(([vessel, monthData]: any) => {
                    flatLeaves.push({ client, route, vessel, monthData });
                });
            });
        });

        // 2. Re-agrupar en base al orden dinámico especificado en groupOrder
        const regroupedTree: Record<string, Record<string, Record<string, any>>> = {};
        flatLeaves.forEach(({ client, route, vessel, monthData }) => {
            const keys = { client, route, vessel };
            const l1 = keys[groupOrder[0]];
            const l2 = keys[groupOrder[1]];
            const l3 = keys[groupOrder[2]];

            if (!regroupedTree[l1]) regroupedTree[l1] = {};
            if (!regroupedTree[l1][l2]) regroupedTree[l1][l2] = {};
            regroupedTree[l1][l2][l3] = monthData;
        });

        // Mapeador para resolver los IDs originales según la jerarquía actual
        const getOriginalKeys = (l1: string, l2: string, l3: string) => {
            const keys: Record<string, string> = {};
            keys[groupOrder[0]] = l1;
            keys[groupOrder[1]] = l2;
            keys[groupOrder[2]] = l3;
            return {
                client: keys['client'],
                route: keys['route'],
                vessel: keys['vessel']
            };
        };

        // Helper de ordenamiento
        const sortKeys = (keysList: string[], type: 'client' | 'route' | 'vessel', parentKey?: string) => {
            if (type === 'client' && clientOrder.length > 0) {
                return [...keysList].sort((a, b) => {
                    const idxA = clientOrder.indexOf(a);
                    const idxB = clientOrder.indexOf(b);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    return 0;
                });
            }
            if (type === 'route' && parentKey && routeOrder[parentKey] && routeOrder[parentKey].length > 0) {
                return [...keysList].sort((a, b) => {
                    const idxA = routeOrder[parentKey].indexOf(a);
                    const idxB = routeOrder[parentKey].indexOf(b);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    return 0;
                });
            }
            if (type === 'vessel' && parentKey && vesselOrder[parentKey] && vesselOrder[parentKey].length > 0) {
                return [...keysList].sort((a, b) => {
                    const idxA = vesselOrder[parentKey].indexOf(a);
                    const idxB = vesselOrder[parentKey].indexOf(b);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    return 0;
                });
            }
            return [...keysList].sort();
        };

        const globalTrips = new Array(months.length).fill(0);
        const globalTons = new Array(months.length).fill(0);
        const globalRevenues = new Array(months.length).fill(0);
        const globalPortCosts = new Array(months.length).fill(0);
        const globalBunkerCosts = new Array(months.length).fill(0);
        const globalVoyageResult = new Array(months.length).fill(0);
        const globalPlVsRequired = new Array(months.length).fill(0);
        const globalDemurrage = new Array(months.length).fill(0);

        const level1List = sortKeys(Object.keys(regroupedTree), groupOrder[0]);

        level1List.forEach((level1Name) => {
            const level2Data = regroupedTree[level1Name];
            const level1RowSpanRef = { value: 0 };
            let isFirstLevel1Row = true;

            const level1GrossRevenue = new Array(months.length).fill(0);
            const level1PortCosts = new Array(months.length).fill(0);
            const level1BunkerCosts = new Array(months.length).fill(0);
            const level1VoyageResult = new Array(months.length).fill(0);
            const level1PlVsRequired = new Array(months.length).fill(0);
            const level1Demurrage = new Array(months.length).fill(0);
            const level1TonsTotal = new Array(months.length).fill(0);

            const level2List = sortKeys(Object.keys(level2Data), groupOrder[1], groupOrder[0] === 'client' ? level1Name : undefined);

            level2List.forEach((level2Name) => {
                const level3Data = level2Data[level2Name];
                const level2RowSpanRef = { value: 0 };
                let isFirstLevel2Row = true;

                let parentKeyLevel3: string | undefined = undefined;
                if (groupOrder[0] === 'client' && groupOrder[1] === 'route') {
                    parentKeyLevel3 = `${level1Name}-${level2Name}`;
                }
                const level3List = sortKeys(Object.keys(level3Data), groupOrder[2], parentKeyLevel3);

                level3List.forEach((level3Name) => {
                    const monthData = level3Data[level3Name];
                    const { client, route, vessel } = getOriginalKeys(level1Name, level2Name, level3Name);

                    const rowKey = `${client}-${route}-${vessel}`;
                    const isExpanded = !!expandedRows[rowKey];
                    const numSubRows = isExpanded ? 17 : 0;
                    const isDemurrageExcluded = excludedDemurrages.includes(rowKey);
                    const isDemurrageVisible = showDemurrage && demurragePct !== '' && !isDemurrageExcluded;
                    
                    const isDemurrageExpanded = !!expandedDemurrages[rowKey];
                    const demurrageRowsCount = isDemurrageVisible ? (isDemurrageExpanded ? 3 : 1) : 0;
                    
                    const vesselRowSpan = 6 + numSubRows + demurrageRowsCount;
                    
                    level1RowSpanRef.value += vesselRowSpan;
                    level2RowSpanRef.value += vesselRowSpan;

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
                    const plVsRequired = getMonthlyValues("pl_vs_required");

                    revenues.forEach((v, i) => level1GrossRevenue[i] += v);
                    portCosts.forEach((v, i) => level1PortCosts[i] += v);
                    bunker.forEach((v, i) => level1BunkerCosts[i] += v);
                    voyageResult.forEach((v, i) => level1VoyageResult[i] += v);
                    plVsRequired.forEach((v, i) => level1PlVsRequired[i] += v);
                    
                    const demurragePctArray = months.map((_, i) => {
                        if (customDemurrages[rowKey] && customDemurrages[rowKey][i] !== undefined) {
                            return parseFloat(customDemurrages[rowKey][i]) || 0;
                        }
                        return parseFloat(demurragePct) || 0;
                    });

                    const demurrageArr = isDemurrageVisible ? revenues.map((r, i) => r * (demurragePctArray[i] / 100)) : new Array(months.length).fill(0);
                    if (isDemurrageVisible) {
                        demurrageArr.forEach((v, i) => level1Demurrage[i] += v);
                    }

                    const unitCargos = getMonthlyValues("carga_unit");
                    const tonsTotal = months.map((_, i) => unitCargos[i] * trips[i]);
                    tonsTotal.forEach((v, i) => level1TonsTotal[i] += v);

                    const calcPct = (arr: number[]) => arr.map((v, i) => revenues[i] ? (v / revenues[i]) * 100 : 0);
                    const calcTotalPct = (totalVal: number, totalRev: number) => totalRev ? (totalVal / totalRev) * 100 : 0;

                    const metrics: any[] = [
                        { name: "Viajes (freq)", values: trips, total: sum(trips), pct: null, totalPct: null, isCurrency: false, isTotal: false, isExpandable: true, rowKey, isExpanded },
                        { name: "Toneladas", values: tonsTotal, total: sum(tonsTotal), pct: null, totalPct: null, isCurrency: false, isTotal: false },
                        { name: "Gross Revenue", values: revenues, total: sum(revenues), pct: revenues.map(r => r ? 100 : 0), totalPct: sum(revenues) ? 100 : 0, isCurrency: true, isTotal: false },
                        { name: "Port Costs", values: portCosts, total: sum(portCosts), pct: calcPct(portCosts), totalPct: calcTotalPct(sum(portCosts), sum(revenues)), isCurrency: true, isTotal: false },
                        { name: "Bunker Costs", values: bunker, total: sum(bunker), pct: calcPct(bunker), totalPct: calcTotalPct(sum(bunker), sum(revenues)), isCurrency: true, isTotal: false },
                        { name: "P/L", values: plVsRequired, total: sum(plVsRequired), pct: calcPct(plVsRequired), totalPct: calcTotalPct(sum(plVsRequired), sum(revenues)), isCurrency: true, isTotal: true }
                    ];

                    if (isDemurrageVisible) {
                        metrics.push({ name: "Demurrage", values: demurrageArr, total: sum(demurrageArr), pct: null, totalPct: null, isCurrency: true, isTotal: false, isExpandableDemurrage: true, rowKey, isExpanded: isDemurrageExpanded });
                    }

                    metrics.forEach((metric, index) => {
                        result.push({
                            col1: isFirstLevel1Row && isFirstLevel2Row && index === 0 ? { type: groupOrder[0], name: level1Name, rowSpanRef: level1RowSpanRef } : null,
                            col2: isFirstLevel2Row && index === 0 ? { type: groupOrder[1], name: level2Name, rowSpanRef: level2RowSpanRef } : null,
                            col3: index === 0 ? { type: groupOrder[2], name: level3Name, rowSpan: vesselRowSpan } : null,
                            clientName: client,
                            routeName: route,
                            vesselName: vessel,
                            metric: metric,
                            isSubRow: false
                        });

                        if (metric.name === "Demurrage" && isDemurrageExpanded) {
                            result.push({
                                col1: null, col2: null, col3: null,
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
                            result.push({
                                col1: null, col2: null, col3: null,
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
                                { name: "Distancia (MN)", key: "distancia_total", curr: false },
                                { name: "Carga Transportada (MT)", key: "carga_unit", curr: false },
                                { name: "Flete (USD/MT)", key: "flete_unit", curr: true },
                                { name: "Gross Revenue (USD)", key: "net_income_unit", curr: true },
                                { name: "Sea Days", key: "sea_days_unit", curr: false },
                                { name: "Port/Idle Days", key: "port_days_unit", curr: false },
                                { name: "Duración Total (Días)", key: "total_duration_unit", curr: false },
                                { name: "Bunker IFO (MT)", key: "bunker_ifo_tonnage_unit", curr: false },
                                { name: "Bunker MDO (MT)", key: "bunker_mdo_tonnage_unit", curr: false },
                                { name: "Port Costs (USD)", key: "total_port_costs_unit", curr: true },
                                { name: "Bunker Costs (USD)", key: "total_bunker_costs_unit", curr: true },
                                { name: "TCE (USD/Día)", key: "tce_real_unit", curr: true },
                                { name: "PCM (USD)", key: "pcm_projected", curr: true },
                                { name: "P/L Neto (USD)", key: "pl_vs_required_unit", curr: true }
                            ];
                            
                            subMetricsData.forEach(sub => {
                                let vals = getMonthlyValues(sub.key as string);
                                if (sub.name === "Flete (USD/MT)") {
                                    vals = months.map((m, mIdx) => {
                                        const line = projectionLines.find(p => 
                                            p.client_id === client && 
                                            `${p.origin_port_id}-${p.destination_port_id}` === route && 
                                            p.vessel_id === vessel && 
                                            p.month_index === m
                                        );
                                        if (line && line.custom_tariff !== undefined) {
                                            return line.custom_tariff;
                                        }
                                        return vals[mIdx];
                                    });
                                }

                                result.push({
                                    col1: null, col2: null, col3: null,
                                    clientName: client, routeName: route, vesselName: vessel,
                                    metric: {
                                        name: sub.name,
                                        values: vals,
                                        total: 0,
                                        pct: null,
                                        totalPct: null,
                                        isCurrency: sub.curr,
                                        isTotal: false,
                                        isSubRowMetric: true
                                    },
                                    isSubRow: true
                                });
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
                        globalPlVsRequired[i] += plVsRequired[i] || 0;
                        globalDemurrage[i] += demurrageArr[i] || 0;
                    });

                    isFirstLevel2Row = false;
                    isFirstLevel1Row = false;
                });
            });

            const level1CalcPct = (arr: number[]) => arr.map((v, i) => level1GrossRevenue[i] ? (v / level1GrossRevenue[i]) * 100 : 0);
            const level1CalcTotalPct = (totalVal: number, totalRev: number) => totalRev ? (totalVal / totalRev) * 100 : 0;

            const level1GrossPlusDem = level1GrossRevenue.map((rev, i) => rev + (level1Demurrage[i] || 0));
            const totalGrossPlusDem = sum(level1GrossPlusDem);
            const totalLevel1Tons = sum(level1TonsTotal);
            const level1Yield = level1TonsTotal.map((tons, i) => tons ? level1GrossPlusDem[i] / tons : 0);
            const totalLevel1Yield = totalLevel1Tons ? totalGrossPlusDem / totalLevel1Tons : 0;
            const level1YieldFlete = level1TonsTotal.map((tons, i) => tons ? level1GrossRevenue[i] / tons : 0);
            const totalLevel1YieldFlete = totalLevel1Tons ? sum(level1GrossRevenue) / totalLevel1Tons : 0;

            const subMetrics = [
                { name: "P/L", values: level1PlVsRequired, total: sum(level1PlVsRequired), pct: level1CalcPct(level1PlVsRequired), totalPct: level1CalcTotalPct(sum(level1PlVsRequired), sum(level1GrossRevenue)), isCurrency: true, isTotal: false },
                { name: "Toneladas", values: level1TonsTotal, total: totalLevel1Tons, pct: null, totalPct: null, isCurrency: false, isTotal: false },
                { name: "Gross Revenue", values: level1GrossRevenue, total: sum(level1GrossRevenue), pct: level1GrossRevenue.map(r => r ? 100 : 0), totalPct: sum(level1GrossRevenue) ? 100 : 0, isCurrency: true, isTotal: false },
                { name: "Demurrage", values: level1Demurrage, total: sum(level1Demurrage), pct: level1CalcPct(level1Demurrage), totalPct: level1CalcTotalPct(sum(level1Demurrage), sum(level1GrossRevenue)), isCurrency: true, isTotal: false },
                { name: "Gross + Demurrage", values: level1GrossPlusDem, total: totalGrossPlusDem, pct: level1CalcPct(level1GrossPlusDem), totalPct: level1CalcTotalPct(totalGrossPlusDem, sum(level1GrossRevenue)), isCurrency: true, isTotal: false },
                { name: "Yield Flete (USD/MT)", values: level1YieldFlete, total: totalLevel1YieldFlete, pct: null, totalPct: null, isCurrency: true, isTotal: true },
                { name: "Yield (USD/MT)", values: level1Yield, total: totalLevel1Yield, pct: null, totalPct: null, isCurrency: true, isTotal: true }
            ];

            const isSubtotalCollapsed = !!collapsedSubtotals[level1Name];
            const visibleSubMetrics = isSubtotalCollapsed ? [subMetrics[0]] : subMetrics;

            level1RowSpanRef.value += visibleSubMetrics.length;
            const subtotalRouteRowSpanRef = { value: visibleSubMetrics.length };

            visibleSubMetrics.forEach((metric, index) => {
                const isExpandableRow = metric.name === "P/L";
                
                result.push({
                    col1: null,
                    col2: index === 0 ? { name: "Σ SUBTOTAL", rowSpanRef: subtotalRouteRowSpanRef, isSubtotal: true } : null,
                    col3: index === 0 ? { name: `TOTAL ${groupOrder[0].toUpperCase()}`, rowSpan: visibleSubMetrics.length, isSubtotal: true } : null,
                    clientName: level1Name,
                    routeName: "",
                    vesselName: "",
                    metric: {
                        ...metric,
                        isExpandableSubtotal: isExpandableRow,
                        clientKey: level1Name,
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
            { name: "P/L", values: globalPlVsRequired, total: sum(globalPlVsRequired), pct: globalCalcPct(globalPlVsRequired), totalPct: globalCalcTotalPct(sum(globalPlVsRequired), sum(globalRevenues)), isCurrency: true, isTotal: false },
            { name: "Toneladas", values: globalTons, total: totalGlobalTons, pct: null, totalPct: null, isCurrency: false, isTotal: false },
            { name: "Gross Revenue", values: globalRevenues, total: sum(globalRevenues), pct: globalRevenues.map(r => r ? 100 : 0), totalPct: sum(globalRevenues) ? 100 : 0, isCurrency: true, isTotal: false },
            { name: "Demurrage", values: globalDemurrage, total: sum(globalDemurrage), pct: globalCalcPct(globalDemurrage), totalPct: globalCalcTotalPct(sum(globalDemurrage), sum(globalRevenues)), isCurrency: true, isTotal: false },
            { name: "Gross + Demurrage", values: globalGrossPlusDem, total: totalGlobalGrossPlusDem, pct: globalCalcPct(globalGrossPlusDem), totalPct: globalCalcTotalPct(totalGlobalGrossPlusDem, sum(globalRevenues)), isCurrency: true, isTotal: false },
            { name: "Yield Flete (USD/MT)", values: globalYieldFlete, total: totalGlobalYieldFlete, pct: null, totalPct: null, isCurrency: true, isTotal: true },
            { name: "Yield (USD/MT)", values: globalYield, total: totalGlobalYield, pct: null, totalPct: null, isCurrency: true, isTotal: true }
        ];

        const visibleGlobalMetrics = isGlobalTotalCollapsed ? [globalMetrics[0]] : globalMetrics;
        const globalRouteRowSpanRef = { value: visibleGlobalMetrics.length };

        visibleGlobalMetrics.forEach((metric, index) => {
            const isExpandableRow = metric.name === "P/L";
            result.push({
                col1: index === 0 ? { name: "TOTAL FLOTA", rowSpanRef: globalRouteRowSpanRef, isSubtotal: true, color: "bg-slate-800 text-white" } : null,
                col2: null,
                col3: null,
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
        const accumPlVsRequired = accumArray(globalPlVsRequired);
        const accumDemurrage = accumArray(globalDemurrage);

        const accumCalcPct = (arr: number[]) => arr.map((v, i) => accumRevenues[i] ? (v / accumRevenues[i]) * 100 : 0);
        const lastVal = (arr: number[]) => arr.length > 0 ? arr[arr.length - 1] : 0;

        const accumGrossPlusDem = accumRevenues.map((rev, i) => rev + (accumDemurrage[i] || 0));
        const accumYield = accumTons.map((tons, i) => tons ? accumGrossPlusDem[i] / tons : 0);
        const accumYieldFlete = accumTons.map((tons, i) => tons ? accumRevenues[i] / tons : 0);

        const accumMetrics = [
            { name: "P/L", values: accumPlVsRequired, total: lastVal(accumPlVsRequired), pct: accumCalcPct(accumPlVsRequired), totalPct: globalCalcTotalPct(lastVal(accumPlVsRequired), lastVal(accumRevenues)), isCurrency: true, isTotal: false },
            { name: "Toneladas", values: accumTons, total: lastVal(accumTons), pct: null, totalPct: null, isCurrency: false, isTotal: false },
            { name: "Gross Revenue", values: accumRevenues, total: lastVal(accumRevenues), pct: accumRevenues.map(r => r ? 100 : 0), totalPct: sum(accumRevenues) ? 100 : 0, isCurrency: true, isTotal: false },
            { name: "Demurrage", values: accumDemurrage, total: lastVal(accumDemurrage), pct: accumCalcPct(accumDemurrage), totalPct: globalCalcTotalPct(lastVal(accumDemurrage), lastVal(accumRevenues)), isCurrency: true, isTotal: false },
            { name: "Gross + Demurrage", values: accumGrossPlusDem, total: lastVal(accumGrossPlusDem), pct: accumCalcPct(accumGrossPlusDem), totalPct: globalCalcTotalPct(lastVal(accumGrossPlusDem), lastVal(accumRevenues)), isCurrency: true, isTotal: false },
            { name: "Yield Flete (USD/MT)", values: accumYieldFlete, total: lastVal(accumYieldFlete), pct: null, totalPct: null, isCurrency: true, isTotal: true },
            { name: "Yield (USD/MT)", values: accumYield, total: lastVal(accumYield), pct: null, totalPct: null, isCurrency: true, isTotal: true }
        ];

        const visibleAccumMetrics = isGlobalAcumCollapsed ? [accumMetrics[0]] : accumMetrics;
        const accumRouteRowSpanRef = { value: visibleAccumMetrics.length };

        visibleAccumMetrics.forEach((metric, index) => {
            const isExpandableRow = metric.name === "P/L";
            result.push({
                col1: index === 0 ? { name: "TOTAL ACUMULADO", rowSpanRef: accumRouteRowSpanRef, isSubtotal: true, color: "bg-petral-teal text-white" } : null,
                col2: null,
                col3: null,
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
    }, [data, months, projectionLines, expandedRows, clientOrder, routeOrder, vesselOrder, collapsedSubtotals, isGlobalTotalCollapsed, isGlobalAcumCollapsed, demurragePct, showDemurrage, expandedDemurrages, excludedDemurrages, customDemurrages, groupOrder]);

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
            <ForecastGridFilters />
            <div className="table-container shadow-sm border border-slate-200 rounded-lg overflow-auto max-h-[75vh] bg-white relative">
                <table id="forecast-grid-table" className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-800 text-white uppercase font-semibold text-xs tracking-wider sticky top-0 z-20 shadow-md">
                    <tr>
                        <th className="py-1 px-1 border border-slate-700 w-12 bg-slate-800 text-center font-bold text-[10px] tracking-normal">
                            <div className="flex items-center justify-center gap-0.5 min-w-[46px]">
                                <span className="truncate">{getColumnHeaderLabel(groupOrder[0])}</span>
                                <button 
                                    onClick={() => handleGroupOrderSwap(0, 1)} 
                                    className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-700 flex items-center justify-center"
                                    title="Mover a la derecha"
                                >
                                    <ChevronRight size={12} />
                                </button>
                            </div>
                        </th>
                        <th className="py-1 px-1 border border-slate-700 w-12 bg-slate-800 text-center font-bold text-[10px] tracking-normal">
                            <div className="flex items-center justify-center gap-0.5 min-w-[46px]">
                                <button 
                                    onClick={() => handleGroupOrderSwap(1, 0)} 
                                    className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-700 flex items-center justify-center"
                                    title="Mover a la izquierda"
                                >
                                    <ChevronLeft size={12} />
                                </button>
                                <span className="truncate">{getColumnHeaderLabel(groupOrder[1])}</span>
                                <button 
                                    onClick={() => handleGroupOrderSwap(1, 2)} 
                                    className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-700 flex items-center justify-center"
                                    title="Mover a la derecha"
                                >
                                    <ChevronRight size={12} />
                                </button>
                            </div>
                        </th>
                        <th className="py-1 px-1 border border-slate-700 w-12 bg-slate-800 text-center font-bold text-[10px] tracking-normal">
                            <div className="flex items-center justify-center gap-0.5 min-w-[46px]">
                                <button 
                                    onClick={() => handleGroupOrderSwap(2, 1)} 
                                    className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-700 flex items-center justify-center"
                                    title="Mover a la izquierda"
                                >
                                    <ChevronLeft size={12} />
                                </button>
                                <span className="truncate">{getColumnHeaderLabel(groupOrder[2])}</span>
                            </div>
                        </th>
                        <th className="py-1 px-2 border border-slate-700 bg-slate-800 text-center font-bold text-xs tracking-wider w-36 min-w-[120px]">Métrica</th>
                        {months.filter(m => !hiddenMonths.includes(m)).map((m, idx) => (
                            <th key={idx} className="py-1 px-2 border border-slate-700 bg-slate-800 text-center font-bold text-xs tracking-wider min-w-[60px] w-16">{m}</th>
                        ))}
                        <th className="py-1 px-2 border border-slate-700 bg-petral-teal text-white text-center font-bold text-xs tracking-wider min-w-[80px]">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.filter(row => {
                        if (row.isGlobalTotal) {
                            if (row.metric.globalType === 'accum' && !showAccumulatedTotal) return false;
                            return true;
                        }
                        if (row.isClientSubtotal && !showSubtotals) return false;
                        
                        if (hiddenClients.includes(row.clientName)) return false;
                        if (row.routeName && hiddenRoutes.includes(row.routeName)) return false;
                        if (row.vesselName && hiddenVessels.includes(row.vesselName)) return false;
                        return true;
                    }).map((row, i) => (
                        <tr key={i} 
                            onDoubleClick={() => {
                                if (row.metric.isExpandableGlobal) {
                                    if (row.metric.globalType === 'total') setIsGlobalTotalCollapsed(!isGlobalTotalCollapsed);
                                    if (row.metric.globalType === 'accum') setIsGlobalAcumCollapsed(!isGlobalAcumCollapsed);
                                }
                            }}
                            className={`border border-slate-200 transition-colors ${row.isSubRow ? 'bg-slate-50/50' : 'hover:bg-slate-50'} ${row.metric.isTotal ? 'bg-slate-100 font-semibold' : ''} ${row.isClientSubtotal ? 'bg-amber-50/30 font-semibold' : ''} ${row.isGlobalTotal ? 'bg-indigo-50/20 font-bold' : ''}`}>
                            {row.col1 && (
                                <td rowSpan={row.col1.rowSpanRef ? row.col1.rowSpanRef.value : row.col1.rowSpan} colSpan={row.isGlobalTotal ? 3 : 1}
                                    onContextMenu={(e) => { 
                                        if (row.col1.type) {
                                            e.preventDefault(); 
                                            setContextMenu({ x: e.clientX, y: e.clientY, type: row.col1.type, client: row.clientName, route: row.routeName, vessel: row.vesselName, rowKey: row.metric.rowKey }); 
                                        }
                                    }}
                                    className={`p-0 border border-slate-200 align-middle ${row.col1.color || getCellColor(row.col1.type, row.col1.name)} relative group cursor-context-menu`}>
                                    {!row.isGlobalTotal && row.col1.type && (
                                    <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleMove(row.col1.type, row.clientName, row.routeName, row.vesselName, 'up')} className="text-slate-300 hover:text-white"><ChevronUp size={14} /></button>
                                        <button onClick={() => handleMove(row.col1.type, row.clientName, row.routeName, row.vesselName, 'down')} className="text-slate-300 hover:text-white"><ChevronDown size={14} /></button>
                                    </div>
                                    )}
                                    <div className={`vertical-text mx-auto px-2 ${row.isGlobalTotal ? 'text-lg tracking-wider transform rotate-0 writing-mode-unset flex items-center justify-center h-full' : ''}`} style={row.isGlobalTotal ? { writingMode: 'unset', transform: 'none' } : {}}>{row.col1.name}</div>
                                </td>
                            )}
                            {row.col2 && (
                                <td rowSpan={row.col2.rowSpanRef ? row.col2.rowSpanRef.value : row.col2.rowSpan} 
                                    onContextMenu={(e) => { 
                                        if (!row.col2.isSubtotal && row.col2.type) { 
                                            e.preventDefault(); 
                                            setContextMenu({ x: e.clientX, y: e.clientY, type: row.col2.type, client: row.clientName, route: row.routeName, vessel: row.vesselName, rowKey: row.metric.rowKey }); 
                                        } 
                                    }}
                                    className={`p-0 border border-slate-200 align-middle relative group ${row.col2.isSubtotal ? 'bg-slate-800 text-amber-400 font-bold' : getCellColor(row.col2.type, row.col2.name) + ' cursor-context-menu'}`}>
                                    {!row.col2.isSubtotal && row.col2.type && (
                                        <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button onClick={() => handleMove(row.col2.type, row.clientName, row.routeName, row.vesselName, 'up')} className="text-slate-400 hover:text-white"><ChevronUp size={14} /></button>
                                            <button onClick={() => handleMove(row.col2.type, row.clientName, row.routeName, row.vesselName, 'down')} className="text-slate-400 hover:text-white"><ChevronDown size={14} /></button>
                                        </div>
                                    )}
                                    <div className="vertical-text mx-auto px-2">{row.col2.name}</div>
                                </td>
                            )}
                            {row.col3 && (
                                <td rowSpan={row.col3.rowSpanRef ? row.col3.rowSpanRef.value : row.col3.rowSpan} 
                                    onContextMenu={(e) => { 
                                        if (!row.col3.isSubtotal && row.col3.type) { 
                                            e.preventDefault(); 
                                            setContextMenu({ x: e.clientX, y: e.clientY, type: row.col3.type, client: row.clientName, route: row.routeName, vessel: row.vesselName, rowKey: row.metric.rowKey }); 
                                        } 
                                    }}
                                    className={`p-0 border border-slate-200 align-middle relative group ${row.col3.isSubtotal ? 'bg-amber-100 text-amber-900 font-bold' : getCellColor(row.col3.type, row.col3.name) + ' cursor-context-menu'}`}>
                                    {!row.col3.isSubtotal && row.col3.type && (
                                        <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button onClick={() => handleMove(row.col3.type, row.clientName, row.routeName, row.vesselName, 'up')} className="text-slate-400 hover:text-petral-blue"><ChevronUp size={14} /></button>
                                            <button onClick={() => handleMove(row.col3.type, row.clientName, row.routeName, row.vesselName, 'down')} className="text-slate-400 hover:text-petral-blue"><ChevronDown size={14} /></button>
                                        </div>
                                    )}
                                    <div className="vertical-text mx-auto px-2">{row.col3.name}</div>
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
                            {months.filter(m => !hiddenMonths.includes(m)).map((m: string, visibleIdx: number) => {
                                const origColIdx = months.indexOf(m);
                                const v = row.metric.values[origColIdx];
                                return (
                                <td key={visibleIdx} className={`py-1 px-2 text-right tabular-nums border border-slate-200 ${row.isSubRow ? 'text-xs text-slate-600' : ''} ${v === 0 ? 'text-slate-400' : 'text-slate-800'} ${row.metric.isTotal && (v ?? 0) < 0 ? 'text-red-600' : ''} ${row.metric.isTotal && (v ?? 0) > 0 ? 'text-teal-700' : ''} ${row.metric.isCategoryHeader ? 'bg-slate-100/50' : ''}`}>
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
                                                                [origColIdx]: val
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
                                                    onFrequencyChange && onFrequencyChange(row.clientName, row.routeName, row.vesselName, months[origColIdx], val);
                                                }}
                                                className="w-14 p-1 text-center block mx-auto text-xs font-bold border border-slate-200 rounded focus:border-petral-teal focus:ring-1 focus:ring-petral-teal bg-white"
                                            />
                                        ) : row.metric.name === "Flete (USD/MT)" && (() => {
                                            const ports = row.routeName.split('-');
                                            if (ports.length < 2) return false;
                                            const routeWithPoints = `${ports[0]}.${ports[1]}.${ports[0]}`;
                                            const key = `${row.clientName.toUpperCase()}.${routeWithPoints.toUpperCase()}.${row.vesselName.toUpperCase()}`;
                                            const isComplexRoute = spotRoutes.some(s => (s.name || "").toUpperCase() === key);
                                            return row.clientName.startsWith("SPOT") || row.clientName.startsWith("NEXA") || isComplexRoute;
                                        })() && !row.isClientSubtotal && !row.isGlobalTotal ? (
                                            <input 
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={v}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    onTariffChange && onTariffChange(row.clientName, row.routeName, row.vesselName, months[origColIdx], val);
                                                }}
                                                className="w-16 p-1 text-right text-xs font-bold border border-slate-300 rounded focus:border-petral-teal focus:ring-1 focus:ring-petral-teal bg-white text-petral-blue"
                                            />
                                        ) : (
                                            row.metric.isCurrency ? (
                                                <div className="flex items-center justify-end w-full min-w-[60px]">
                                                    {displayMode === 'pct' && row.metric.pct && row.metric.pct[origColIdx] !== null && row.metric.pct[origColIdx] !== undefined ? (
                                                        <span className="font-medium text-slate-700">
                                                            {row.metric.pct[origColIdx].toFixed(1)}%
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
                                );
                            })}
                            <td className={`py-1 px-2 text-right tabular-nums font-bold border border-slate-200 ${row.metric.isTotal ? 'bg-slate-200' : 'bg-slate-50'} ${row.isSubRow ? 'text-slate-300' : ''} ${row.metric.isCategoryHeader ? 'bg-slate-100/50' : ''}`}>
                                {row.metric.isCategoryHeader ? '' : (row.metric.isSubRowMetric ? '-' : (() => {
                                    // Recalculate total using only visible months
                                    const visibleIndices = months
                                        .map((m, i) => ({ m, i }))
                                        .filter(({ m }) => !hiddenMonths.includes(m))
                                        .map(({ i }) => i);
                                    const isYieldMetric = row.metric.name === "Yield (USD/MT)" || row.metric.name === "Yield Flete (USD/MT)" || row.metric.name === "Flete (USD/MT)";
                                    const visibleValues = visibleIndices.map(i => row.metric.values[i] ?? 0).filter(v => v !== null);
                                    const visibleTotal = isYieldMetric
                                        ? (visibleValues.length > 0 ? visibleValues.reduce((a, b) => a + b, 0) / visibleValues.length : 0)
                                        : visibleValues.reduce((a, b) => a + b, 0);

                                    return row.metric.isCurrency ? (
                                        <div className="flex items-center justify-end w-full min-w-[60px]">
                                            {displayMode === 'pct' && row.metric.totalPct !== null && row.metric.totalPct !== undefined ? (
                                                <span className="font-bold">
                                                    {row.metric.totalPct.toFixed(1)}%
                                                </span>
                                            ) : (
                                                <span className="font-bold">
                                                    {isYieldMetric ? formatYield(visibleTotal) : formatCurrency(visibleTotal)}
                                                </span>
                                            )}
                                        </div>
                                    ) : formatNumber(visibleTotal);
                                })())}
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
