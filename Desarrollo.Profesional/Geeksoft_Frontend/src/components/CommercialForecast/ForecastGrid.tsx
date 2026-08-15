import React, { useMemo, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';
import { ForecastService } from '../../services/api';
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
    onBunkerPriceChange?: (client_id: string, route_key: string, vessel_id: string, month_index: string, fuelType: 'ifo' | 'mdo', newPrice: number) => void;
    onDeleteNode?: (type: 'client'|'route'|'vessel', client_id: string, route_key?: string, vessel_id?: string) => void;
    displayMode: 'usd' | 'pct';
    demurragePct?: string;
    showDemurrage?: boolean;
    excludedDemurrages?: string[];
    customDemurrages?: Record<string, Record<number, string>>;
    onExcludeDemurrage?: React.Dispatch<React.SetStateAction<string[]>>;
    onCustomDemurrageChange?: React.Dispatch<React.SetStateAction<Record<string, Record<number, string>>>>;
    showDemurrageDays?: boolean;
    demurrageDays?: string;
    customDemurrageDays?: Record<string, Record<number, string>>;
    onCustomDemurrageDaysChange?: React.Dispatch<React.SetStateAction<Record<string, Record<number, string>>>>;
}

export const ForecastGrid: React.FC<ForecastGridProps> = ({ 
    data, months, projectionLines, onFrequencyChange, onTariffChange, onBunkerPriceChange, onDeleteNode, displayMode, 
    demurragePct = '', showDemurrage = false,
    excludedDemurrages = [], customDemurrages = {}, onExcludeDemurrage, onCustomDemurrageChange,
    demurrageDays = '', showDemurrageDays = false,
    customDemurrageDays = {}, onCustomDemurrageDaysChange
}) => {
    const { hiddenClients, hiddenRoutes, hiddenVessels, hiddenMonths, showSubtotals, showAccumulatedTotal, setProjectionLines } = useForecastContext_V2();
    
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [expandedDemurrages, setExpandedDemurrages] = useState<Record<string, boolean>>({});
    const [expandedGrossRevenue, setExpandedGrossRevenue] = useState<Record<string, boolean>>({});
    const [expandedTce, setExpandedTce] = useState<Record<string, boolean>>({});
    const [collapsedSubtotals, setCollapsedSubtotals] = useState<Record<string, boolean>>({});
    const [groupOrder, setGroupOrder] = useState<('client' | 'route' | 'vessel')[]>(['client', 'route', 'vessel']);

    const [vesselsList, setVesselsList] = useState<any[]>([]);

    useEffect(() => {
        ForecastService.getVessels().then(vList => {
            setVesselsList(vList || []);
        }).catch(err => console.error("Error loading vessels in ForecastGrid:", err));
    }, []);

    const handleVesselChange = (clientName: string, routeName: string, oldVesselName: string, newVesselId: string) => {
        const ports = routeName.split('-');
        if (ports.length < 2) return;
        const origin_port_id = ports[0];
        const destination_port_id = ports[1];

        setProjectionLines(prev => {
            return prev.map(p => {
                if (p.client_id === clientName && 
                    p.origin_port_id === origin_port_id && 
                    p.destination_port_id === destination_port_id && 
                    p.vessel_id === oldVesselName) {
                    return { ...p, vessel_id: newVesselId };
                }
                return p;
            });
        });
    };

    const handleGroupOrderSwap = (idx1: number, idx2: number) => {
        setGroupOrder(prev => {
            const next = [...prev];
            [next[idx1], next[idx2]] = [next[idx2], next[idx1]];
            return next;
        });
    };

    const toggleGrossRevenue = (rowKey: string) => {
        setExpandedGrossRevenue(prev => ({
            ...prev,
            [rowKey]: !prev[rowKey]
        }));
    };

    const toggleTce = (rowKey: string) => {
        setExpandedTce(prev => ({
            ...prev,
            [rowKey]: !prev[rowKey]
        }));
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
            if (hiddenClients.includes(client)) return;
            Object.entries(routesData).forEach(([route, vesselsData]: any) => {
                if (hiddenRoutes.includes(route)) return;
                Object.entries(vesselsData).forEach(([vessel, monthData]: any) => {
                    if (hiddenVessels.includes(vessel)) return;
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
                    const numSubRows = isExpanded ? 24 : 0;
                    const isDemurrageExcluded = excludedDemurrages.includes(rowKey);
                    const isDemurrageVisible = showDemurrage && demurragePct !== '' && !isDemurrageExcluded;
                    const isDemurrageDaysVisible = showDemurrageDays && demurrageDays !== '' && !isDemurrageExcluded;
                    
                    const isDemurrageExpanded = !!expandedDemurrages[rowKey];
                    
                    const trips = months.map(m => {
                        const line = projectionLines.find(p => 
                            p.client_id === client && 
                            `${p.origin_port_id}-${p.destination_port_id}` === route && 
                            p.vessel_id === vessel && 
                            p.month_index === m
                        );
                        return line ? (line.monthly_frequency || 0) : 0;
                    });

                    const activeIfoPrice = months.map(m => monthData[m]?.["price_ifo_unit"] || monthData[m]?.["p_ifo"]).find(v => typeof v === 'number' && v > 0) || 0;
                    const activeMdoPrice = months.map(m => monthData[m]?.["price_mdo_unit"] || monthData[m]?.["p_mdo"]).find(v => typeof v === 'number' && v > 0) || 0;

                    const getMonthlyValues = (metricKey: string) => {
                        return months.map((m, idx) => {
                            const tripCount = trips[idx] || 0;
                            if (tripCount <= 0) {
                                return undefined;
                            }
                            let val = monthData[m]?.[metricKey];
                            if (val === undefined || val === null || val === 0) {
                                if (metricKey === "distancia_total") val = monthData[m]?.["total_distance"] || monthData[m]?.["distancia"];
                                if (metricKey === "sea_days_unit") val = monthData[m]?.["sea_days"] || monthData[m]?.["tot_sea_days"];
                                if (metricKey === "port_days_unit") val = monthData[m]?.["port_days"] || monthData[m]?.["tot_port_days"];
                                if (metricKey === "total_duration_unit") val = monthData[m]?.["total_duration"] || monthData[m]?.["total_days"];
                                if (metricKey === "bunker_ifo_tonnage_unit") val = monthData[m]?.["bunker_ifo_tonnage"] || monthData[m]?.["ifo_tons"];
                                if (metricKey === "bunker_mdo_tonnage_unit") val = monthData[m]?.["bunker_mdo_tonnage"] || monthData[m]?.["mdo_tons"];
                                if (metricKey === "total_port_costs_unit") val = monthData[m]?.["total_port_costs"] || monthData[m]?.["port_costs"];
                                if (metricKey === "total_bunker_costs_unit") val = monthData[m]?.["total_bunker_costs"] || monthData[m]?.["bunker_costs"];
                                if (metricKey === "gross_income_unit") val = monthData[m]?.["gross_income"] || (monthData[m]?.["carga_unit"] && monthData[m]?.["flete_unit"] ? monthData[m]?.["carga_unit"] * monthData[m]?.["flete_unit"] : undefined);
                                if (metricKey === "address_comm_pct") val = monthData[m]?.["address_comm_pct"];
                                if (metricKey === "broker_comm_pct") val = monthData[m]?.["broker_comm_pct"];
                                if (metricKey === "total_commissions_unit") val = monthData[m]?.["total_commissions"];
                                if (metricKey === "price_ifo_unit") val = monthData[m]?.["price_ifo_unit"] || monthData[m]?.["p_ifo"] || activeIfoPrice || 0;
                                if (metricKey === "bunker_ifo_cost_unit") val = monthData[m]?.["bunker_ifo_cost_unit"] || (monthData[m]?.["bunker_ifo_tonnage_unit"] ? monthData[m]?.["bunker_ifo_tonnage_unit"] * (monthData[m]?.["price_ifo_unit"] || activeIfoPrice || 0) : undefined);
                                if (metricKey === "price_mdo_unit") val = monthData[m]?.["price_mdo_unit"] || monthData[m]?.["p_mdo"] || activeMdoPrice || 0;
                                if (metricKey === "bunker_mdo_cost_unit") val = monthData[m]?.["bunker_mdo_cost_unit"] || (monthData[m]?.["bunker_mdo_tonnage_unit"] ? monthData[m]?.["bunker_mdo_tonnage_unit"] * (monthData[m]?.["price_mdo_unit"] || activeMdoPrice || 0) : undefined);
                                if (metricKey === "voyage_result_unit") val = monthData[m]?.["voyage_result"] || monthData[m]?.["voyage_result_unit"];
                                if (metricKey === "tce_real_unit") val = monthData[m]?.["tce_real"] || monthData[m]?.["tce"];
                                if (metricKey === "tce_required_unit") val = monthData[m]?.["tce_required_unit"] || monthData[m]?.["tce_required"] || 13000;
                                if (metricKey === "tce_cost_total_unit") val = monthData[m]?.["tce_cost_total_unit"] || (monthData[m]?.["total_duration_unit"] ? monthData[m]?.["total_duration_unit"] * (monthData[m]?.["tce_required_unit"] || 13000) : undefined);
                                if (metricKey === "flete_unit") val = monthData[m]?.["flete_unit"] || monthData[m]?.["freight_rate"];
                                if (metricKey === "pl_vs_required_unit") val = monthData[m]?.["pl_vs_required_unit"] || monthData[m]?.["pl_vs_required"] || monthData[m]?.["pl_neto"];
                            }
                            return val;
                        });
                    };

                    const freightRevenues = getMonthlyValues("gross_income_unit").map((val, i) => (val !== undefined ? val * trips[i] : (getMonthlyValues("carga_unit")[i] || 0) * (getMonthlyValues("flete_unit")[i] || 0) * trips[i]));
                    const refacturacionMuellaje = months.map((m, i) => {
                        const tripCount = trips[i] || 0;
                        if (tripCount <= 0) return 0;
                        const mVal = monthData[m]?.["refacturacion_muellaje"] || monthData[m]?.["muellaje_refacturado"] || 0;
                        return Number(mVal) * tripCount;
                    });

                    const grossRevenues = months.map((_, i) => freightRevenues[i] + refacturacionMuellaje[i]);
                    const commissions = getMonthlyValues("total_commissions");
                    const netRevenues = months.map((_, i) => grossRevenues[i] - (commissions[i] || 0));
                    
                    const portCosts = getMonthlyValues("total_port_costs");
                    const bunker = getMonthlyValues("total_bunker_costs");
                    const voyageResult = months.map((_, i) => (trips[i] > 0 ? (netRevenues[i] || 0) - (portCosts[i] || 0) - (bunker[i] || 0) : 0));
                    
                    const totalDaysArr = getMonthlyValues("total_duration_unit");
                    const tceReq = getMonthlyValues("tce_required_unit");
                    const tceCostTotal = months.map((_, i) => (trips[i] > 0 ? (tceReq[i] || 13000) * (totalDaysArr[i] || 0) * trips[i] : 0));
                    
                    const plVsRequired = months.map((_, i) => (trips[i] > 0 ? (voyageResult[i] || 0) - (tceCostTotal[i] || 0) : 0));
                    
                    const tceReal = months.map((_, i) => {
                        const d = (totalDaysArr[i] || 0) * trips[i];
                        return d > 0 ? (voyageResult[i] || 0) / d : 0;
                    });
                    const tceDiff = months.map((_, i) => (trips[i] > 0 ? (tceReal[i] - (tceReq[i] || 13000)) : 0));

                    grossRevenues.forEach((v, i) => level1GrossRevenue[i] += v);
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
                    
                    const demurrageDaysArray = months.map((_, i) => {
                        if (customDemurrageDays[rowKey] && customDemurrageDays[rowKey][i] !== undefined) {
                            return parseFloat(customDemurrageDays[rowKey][i]) || 0;
                        }
                        return parseFloat(demurrageDays) || 0;
                    });
                    
                    const vesselDemurrageRate = getMonthlyValues("vessel_demurrage_rate");

                    let demurrageArr = new Array(months.length).fill(0);
                    if (isDemurrageVisible) {
                        // Demurrage % calculado estrictamente sobre Freight Revenue
                        demurrageArr = freightRevenues.map((fRev, i) => (fRev || 0) * (demurragePctArray[i] / 100));
                        demurrageArr.forEach((v, i) => level1Demurrage[i] += v);
                    } else if (isDemurrageDaysVisible) {
                        demurrageArr = trips.map((t, i) => t * demurrageDaysArray[i] * (vesselDemurrageRate[i] || 20000));
                        demurrageArr.forEach((v, i) => level1Demurrage[i] += v);
                    }

                    const unitCargos = getMonthlyValues("carga_unit");
                    const tonsTotal = months.map((_, i) => unitCargos[i] * trips[i]);
                    tonsTotal.forEach((v, i) => level1TonsTotal[i] += v);

                    const calcPct = (arr: number[]) => arr.map((v, i) => grossRevenues[i] ? (v / grossRevenues[i]) * 100 : 0);
                    const calcTotalPct = (totalVal: number, totalRev: number) => totalRev ? (totalVal / totalRev) * 100 : 0;

                    const isExpandedGross = !!expandedGrossRevenue[rowKey];
                    const isExpandedTceRow = !!expandedTce[rowKey];

                    const metrics: any[] = [
                        { name: "Viajes (freq)", values: trips, total: sum(trips), pct: null, totalPct: null, isCurrency: false, isTotal: false, isExpandable: true, rowKey, isExpanded },
                        { name: "Toneladas", values: tonsTotal, total: sum(tonsTotal), pct: null, totalPct: null, isCurrency: false, isTotal: false },
                        { name: "Net Revenue", values: netRevenues, total: sum(netRevenues), pct: calcPct(netRevenues), totalPct: calcTotalPct(sum(netRevenues), sum(grossRevenues)), isCurrency: true, isTotal: false, isExpandableGrossRevenue: true, rowKey, isExpanded: isExpandedGross },
                        { name: "(-) Port Costs", values: portCosts, total: sum(portCosts), pct: calcPct(portCosts), totalPct: calcTotalPct(sum(portCosts), sum(grossRevenues)), isCurrency: true, isTotal: false },
                        { name: "(-) Bunker Costs", values: bunker, total: sum(bunker), pct: calcPct(bunker), totalPct: calcTotalPct(sum(bunker), sum(grossRevenues)), isCurrency: true, isTotal: false },
                        { name: "(=) Voyage Result", values: voyageResult, total: sum(voyageResult), pct: calcPct(voyageResult), totalPct: calcTotalPct(sum(voyageResult), sum(grossRevenues)), isCurrency: true, isTotal: false },
                        { name: "TCE x días", values: tceCostTotal, total: sum(tceCostTotal), pct: calcPct(tceCostTotal), totalPct: calcTotalPct(sum(tceCostTotal), sum(grossRevenues)), isCurrency: true, isTotal: false, isExpandableTce: true, rowKey, isExpanded: isExpandedTceRow },
                        { name: "(=) P/L", values: plVsRequired, total: sum(plVsRequired), pct: calcPct(plVsRequired), totalPct: calcTotalPct(sum(plVsRequired), sum(grossRevenues)), isCurrency: true, isTotal: true }
                    ];

                    if (isDemurrageVisible || isDemurrageDaysVisible) {
                        metrics.push({ name: "Demurrage", values: demurrageArr, total: sum(demurrageArr), pct: calcPct(demurrageArr), totalPct: calcTotalPct(sum(demurrageArr), sum(grossRevenues)), isCurrency: true, isTotal: false, isExpandableDemurrage: true, rowKey, isExpanded: isDemurrageExpanded });
                    }

                    const netRevenueSubRowsCount = isExpandedGross ? 4 : 0;
                    const tceSubRowsCount = isExpandedTceRow ? 3 : 0;
                    const demurrageSubRowsCount = (isDemurrageVisible || isDemurrageDaysVisible) ? (isDemurrageExpanded ? 2 : 0) : 0;

                    const vesselRowSpan = metrics.length + numSubRows + netRevenueSubRowsCount + tceSubRowsCount + demurrageSubRowsCount;
                    
                    level1RowSpanRef.value += vesselRowSpan;
                    level2RowSpanRef.value += vesselRowSpan;

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

                        // 1. Acordeón de Net Revenue (4 sub-filas fijas)
                        if (metric.isExpandableGrossRevenue && isExpandedGross) {
                            result.push({
                                col1: null, col2: null, col3: null,
                                clientName: client, routeName: route, vesselName: vessel,
                                metric: {
                                    name: "↳ (+) Freight Revenue",
                                    values: freightRevenues,
                                    total: sum(freightRevenues),
                                    pct: calcPct(freightRevenues),
                                    totalPct: calcTotalPct(sum(freightRevenues), sum(grossRevenues)),
                                    isCurrency: true,
                                    isTotal: false,
                                    isSubRowMetric: true
                                },
                                isSubRow: true
                            });

                            result.push({
                                col1: null, col2: null, col3: null,
                                clientName: client, routeName: route, vesselName: vessel,
                                metric: {
                                    name: "↳ (+) Pass-Through Revenue",
                                    values: refacturacionMuellaje,
                                    total: sum(refacturacionMuellaje),
                                    pct: calcPct(refacturacionMuellaje),
                                    totalPct: calcTotalPct(sum(refacturacionMuellaje), sum(grossRevenues)),
                                    isCurrency: true,
                                    isTotal: false,
                                    isSubRowMetric: true
                                },
                                isSubRow: true
                            });

                            result.push({
                                col1: null, col2: null, col3: null,
                                clientName: client, routeName: route, vesselName: vessel,
                                metric: {
                                    name: "↳ (=) Gross Revenue",
                                    values: grossRevenues,
                                    total: sum(grossRevenues),
                                    pct: grossRevenues.map(r => r ? 100 : 0),
                                    totalPct: sum(grossRevenues) ? 100 : 0,
                                    isCurrency: true,
                                    isTotal: false,
                                    isSubRowMetric: true
                                },
                                isSubRow: true
                            });

                            result.push({
                                col1: null, col2: null, col3: null,
                                clientName: client, routeName: route, vesselName: vessel,
                                metric: {
                                    name: "↳ (-) Comisiones",
                                    values: commissions,
                                    total: sum(commissions),
                                    pct: calcPct(commissions),
                                    totalPct: calcTotalPct(sum(commissions), sum(grossRevenues)),
                                    isCurrency: true,
                                    isTotal: false,
                                    isSubRowMetric: true
                                },
                                isSubRow: true
                            });
                        }

                        // 2. Acordeón de TCE x días
                        if (metric.isExpandableTce && isExpandedTceRow) {
                            result.push({
                                col1: null, col2: null, col3: null,
                                clientName: client, routeName: route, vesselName: vessel,
                                metric: {
                                    name: "↳ TCE Realizado ($/d)",
                                    values: tceReal,
                                    total: trips.reduce((a, b) => a + b, 0) > 0 ? sum(voyageResult) / sum(months.map((_, i) => (totalDaysArr[i] || 0) * trips[i])) : 0,
                                    pct: null,
                                    totalPct: null,
                                    isCurrency: true,
                                    isTceDay: true,
                                    isTotal: false,
                                    isSubRowMetric: true
                                },
                                isSubRow: true
                            });

                            result.push({
                                col1: null, col2: null, col3: null,
                                clientName: client, routeName: route, vesselName: vessel,
                                metric: {
                                    name: "↳ TCE Requerido ($/d)",
                                    values: tceReq,
                                    total: tceReq.find(v => typeof v === 'number' && v > 0) || 13000,
                                    pct: null,
                                    totalPct: null,
                                    isCurrency: true,
                                    isTceDay: true,
                                    isTotal: false,
                                    isSubRowMetric: true
                                },
                                isSubRow: true
                            });

                            result.push({
                                col1: null, col2: null, col3: null,
                                clientName: client, routeName: route, vesselName: vessel,
                                metric: {
                                    name: "↳ Diferencia TCE (+/- $/d)",
                                    values: tceDiff,
                                    total: (trips.reduce((a, b) => a + b, 0) > 0 ? sum(voyageResult) / sum(months.map((_, i) => (totalDaysArr[i] || 0) * trips[i])) : 0) - (tceReq.find(v => typeof v === 'number' && v > 0) || 13000),
                                    pct: null,
                                    totalPct: null,
                                    isCurrency: true,
                                    isTceDiff: true,
                                    isTotal: false,
                                    isSubRowMetric: true
                                },
                                isSubRow: true
                            });
                        }

                        // 3. Acordeón de Demurrage
                        if (metric.name === "Demurrage" && isDemurrageExpanded) {
                            if (isDemurrageVisible) {
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
                            } else if (isDemurrageDaysVisible) {
                                result.push({
                                    col1: null, col2: null, col3: null,
                                    clientName: client, routeName: route, vesselName: vessel,
                                    metric: {
                                        name: "↳ Demurrage (días)",
                                        values: demurrageDaysArray,
                                        total: 0,
                                        pct: null,
                                        totalPct: null,
                                        isCurrency: false,
                                        isTotal: false,
                                        isDemurrageDaysEditable: true,
                                        rowKey
                                    },
                                    isSubRow: true
                                });
                            }
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
                                { name: "↳ Distancia (MN)", key: "distancia_total", curr: false, isPct: false },
                                { name: "↳ Carga Transportada Q (MT)", key: "carga_unit", curr: false, isPct: false },
                                { name: "↳ Tarifa Flete Base P (USD/MT)", key: "flete_unit", curr: true, isPct: false },
                                { name: "↳ Ingreso Bruto de Flete (USD)", key: "gross_income_unit", curr: true, isPct: false },
                                { name: "↳ Comisión Address (%)", key: "address_comm_pct", curr: false, isPct: true },
                                { name: "↳ Comisión Broker (%)", key: "broker_comm_pct", curr: false, isPct: true },
                                { name: "↳ Comisiones Totales (USD)", key: "total_commissions_unit", curr: true, isPct: false },
                                { name: "↳ Flete Neto (USD)", key: "net_income_unit", curr: true, isPct: false },
                                { name: "↳ Días de Mar", key: "sea_days_unit", curr: false, isPct: false },
                                { name: "↳ Días de Puerto", key: "port_days_unit", curr: false, isPct: false },
                                { name: "↳ Duración Total (Días)", key: "total_duration_unit", curr: false, isPct: false },
                                { name: "↳ Precio IFO (USD/MT)", key: "price_ifo_unit", curr: true, isPct: false },
                                { name: "↳ Consumo Bunker IFO (MT)", key: "bunker_ifo_tonnage_unit", curr: false, isPct: false },
                                { name: "↳ Costo IFO (USD)", key: "bunker_ifo_cost_unit", curr: true, isPct: false },
                                { name: "↳ Precio MDO (USD/MT)", key: "price_mdo_unit", curr: true, isPct: false },
                                { name: "↳ Consumo Bunker MDO (MT)", key: "bunker_mdo_tonnage_unit", curr: false, isPct: false },
                                { name: "↳ Costo MDO (USD)", key: "bunker_mdo_cost_unit", curr: true, isPct: false },
                                { name: "↳ Costos de Puerto (USD)", key: "total_port_costs_unit", curr: true, isPct: false },
                                { name: "↳ Costos de Combustible Total (USD)", key: "total_bunker_costs_unit", curr: true, isPct: false },
                                { name: "↳ Resultado del Viaje / Voyage Result (USD)", key: "voyage_result_unit", curr: true, isPct: false },
                                { name: "↳ TCE Real (USD/Día)", key: "tce_real_unit", curr: true, isPct: false },
                                { name: "↳ TCE Requerido del Buque (USD/Día)", key: "tce_required_unit", curr: true, isPct: false },
                                { name: "↳ Costo TCE x Días (USD)", key: "tce_cost_total_unit", curr: true, isPct: false },
                                { name: "↳ P/L Neto Auditable (USD)", key: "pl_vs_required_unit", curr: true, isPct: false }
                            ];
                            
                            subMetricsData.forEach(sub => {
                                let vals = getMonthlyValues(sub.key as string);

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
                                        isPct: sub.isPct,
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
                        globalRevenues[i] += grossRevenues[i] || 0;
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

            if (showSubtotals) {
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
            }
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

        if (showAccumulatedTotal) {
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
        }

        return result;
    }, [data, months, projectionLines, expandedRows, expandedGrossRevenue, expandedTce, clientOrder, routeOrder, vesselOrder, collapsedSubtotals, isGlobalTotalCollapsed, isGlobalAcumCollapsed, demurragePct, showDemurrage, demurrageDays, showDemurrageDays, customDemurrageDays, expandedDemurrages, excludedDemurrages, customDemurrages, groupOrder, hiddenClients, hiddenRoutes, hiddenVessels, showSubtotals, showAccumulatedTotal]);

    const formatCurrency = (val: number | undefined | null) => {
        if (val === 0 || val === undefined || val === null || isNaN(val)) return "-";
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
    };

    const formatYield = (val: number | undefined | null) => {
        if (val === 0 || val === undefined || val === null || isNaN(val)) return "-";
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    };

    const formatNumber = (val: number | undefined | null) => {
        if (val === 0 || val === undefined || val === null || isNaN(val)) return "-";
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
                        <th className="py-1 px-1 border border-slate-700 bg-petral-teal text-white text-center font-bold text-xs tracking-wider min-w-[60px] w-16">TOTAL</th>
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
                                    {row.col1.type === 'vessel' && !row.isGlobalTotal ? (
                                        <div className="flex items-center justify-center w-full h-full p-0.5">
                                            <select
                                                value={row.col1.name}
                                                onChange={(e) => handleVesselChange(row.clientName, row.routeName, row.col1.name, e.target.value)}
                                                className="bg-transparent text-white font-extrabold text-[10px] text-center border-0 focus:outline-none focus:ring-0 cursor-pointer w-full py-2"
                                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', WebkitAppearance: 'none' }}
                                            >
                                                {vesselsList.map(v => (
                                                    <option key={v.vessel_id} value={v.vessel_id} className="bg-slate-800 text-white text-[10px]">
                                                        {v.vessel_id}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className={`vertical-text mx-auto px-2 ${row.isGlobalTotal ? 'text-lg tracking-wider transform rotate-0 writing-mode-unset flex items-center justify-center h-full' : ''}`} style={row.isGlobalTotal ? { writingMode: 'unset', transform: 'none' } : {}}>{row.col1.name}</div>
                                    )}
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
                                    {row.col2.type === 'vessel' && !row.col2.isSubtotal ? (
                                        <div className="flex items-center justify-center w-full h-full p-0.5">
                                            <select
                                                value={row.col2.name}
                                                onChange={(e) => handleVesselChange(row.clientName, row.routeName, row.col2.name, e.target.value)}
                                                className="bg-transparent text-white font-extrabold text-[10px] text-center border-0 focus:outline-none focus:ring-0 cursor-pointer w-full py-2"
                                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', WebkitAppearance: 'none' }}
                                            >
                                                {vesselsList.map(v => (
                                                    <option key={v.vessel_id} value={v.vessel_id} className="bg-slate-800 text-white text-[10px]">
                                                        {v.vessel_id}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="vertical-text mx-auto px-2">{row.col2.name}</div>
                                    )}
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
                                    {row.col3.type === 'vessel' && !row.col3.isSubtotal ? (
                                        <div className="w-full h-full flex items-center justify-center relative min-h-[60px]">
                                            <div className="vertical-text mx-auto px-2 pointer-events-none text-white">
                                                {row.col3.name}
                                            </div>
                                            <select
                                                value={row.col3.name}
                                                onChange={(e) => handleVesselChange(row.clientName, row.routeName, row.col3.name, e.target.value)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                                            >
                                                {vesselsList.map(v => (
                                                    <option key={v.vessel_id} value={v.vessel_id} className="bg-slate-800 text-white text-[10px]">
                                                        {v.vessel_id}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="vertical-text mx-auto px-2">{row.col3.name}</div>
                                    )}
                                </td>
                            )}
                            <td 
                                onClick={(e) => {
                                    if (row.metric.isExpandableGrossRevenue) {
                                        e.stopPropagation();
                                        toggleGrossRevenue(row.metric.rowKey);
                                    } else if (row.metric.isExpandableTce) {
                                        e.stopPropagation();
                                        toggleTce(row.metric.rowKey);
                                    }
                                }}
                                onContextMenu={(e) => {
                                    if (row.metric.isExpandableDemurrage) {
                                        e.preventDefault();
                                        setContextMenu({ x: e.clientX, y: e.clientY, type: 'demurrage', client: row.clientName, route: row.routeName, vessel: row.vesselName, rowKey: row.metric.rowKey });
                                    }
                                }}
                                className={`py-1 px-2 border border-slate-200 ${row.isSubRow ? (row.metric.isCategoryHeader ? 'pl-6 text-xs text-slate-800 font-bold uppercase tracking-wider bg-slate-100/50' : 'pl-10 text-xs text-slate-500') : 'font-medium text-slate-700'} ${row.metric.isExpandableDemurrage ? 'cursor-context-menu bg-amber-50' : ''} ${(row.metric.isExpandableGrossRevenue || row.metric.isExpandableTce) ? 'cursor-pointer hover:bg-slate-100/80 transition-colors' : ''}`}
                            >
                                {row.metric.isExpandable ? (
                                    <button 
                                        onClick={() => toggleRow(row.metric.rowKey)}
                                        className="flex items-center gap-1 hover:text-petral-teal focus:outline-none transition-colors"
                                    >
                                        {row.metric.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        {row.metric.name}
                                    </button>
                                ) : row.metric.isExpandableGrossRevenue ? (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleGrossRevenue(row.metric.rowKey); }}
                                        className="flex items-center gap-1 text-emerald-800 hover:text-emerald-950 focus:outline-none transition-colors font-bold w-full text-left cursor-pointer"
                                        title="Desglosar Freight Revenue, Refacturación de Muellaje y Comisiones"
                                    >
                                        {row.metric.isExpanded ? <ChevronDown className="h-4 w-4 text-emerald-600 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-emerald-600 flex-shrink-0" />}
                                        <span>{row.metric.name}</span>
                                        <span className="text-[9px] text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded border border-emerald-300 ml-1 font-mono">Net</span>
                                    </button>
                                ) : row.metric.isExpandableTce ? (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleTce(row.metric.rowKey); }}
                                        className="flex items-center gap-1 text-blue-800 hover:text-blue-950 focus:outline-none transition-colors font-bold w-full text-left cursor-pointer"
                                        title="Desglosar TCE Realizado vs Requerido y Diferencial Diario"
                                    >
                                        {row.metric.isExpanded ? <ChevronDown className="h-4 w-4 text-blue-600 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                                        <span>{row.metric.name}</span>
                                        <span className="text-[9px] text-blue-700 bg-blue-100/80 px-1 py-0.2 rounded border border-blue-300 ml-1 font-mono">TCE $/d</span>
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
                                        ) : row.metric.isDemurrageDaysEditable ? (
                                            <input 
                                                type="number"
                                                min="0"
                                                value={v}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (onCustomDemurrageDaysChange) {
                                                        onCustomDemurrageDaysChange(prev => ({
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
                                        ) : row.metric.isBunkerPriceEditable && !row.isClientSubtotal && !row.isGlobalTotal ? (
                                            <input 
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={v || ''}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    onBunkerPriceChange && onBunkerPriceChange(row.clientName, row.routeName, row.vesselName, months[origColIdx], row.metric.fuelType, val);
                                                }}
                                                className="w-16 p-1 text-right text-xs font-bold border border-slate-300 rounded focus:border-petral-teal focus:ring-1 focus:ring-petral-teal bg-white text-petral-blue"
                                            />
                                        ) : row.metric.isFrequencyEditable && !row.isClientSubtotal && !row.isGlobalTotal ? (
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={v || ''} 
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    onFrequencyChange && onFrequencyChange(row.clientName, row.routeName, row.vesselName, months[origColIdx], val);
                                                }}
                                                className="w-12 p-1 text-center text-xs font-bold border border-slate-300 rounded focus:border-petral-teal focus:ring-1 focus:ring-petral-teal bg-white text-petral-blue"
                                            />
                                        ) : (row.metric.name === "Flete (USD/MT)" || row.metric.name.includes("Tarifa Flete Base P")) && !row.isClientSubtotal && !row.isGlobalTotal ? (
                                            <input 
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={v || ''}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    onTariffChange && onTariffChange(row.clientName, row.routeName, row.vesselName, months[origColIdx], val);
                                                }}
                                                className="w-16 p-1 text-right text-xs font-bold border border-slate-300 rounded focus:border-petral-teal focus:ring-1 focus:ring-petral-teal bg-white text-petral-blue"
                                            />
                                        ) : row.metric.isTceDiff ? (
                                            <span className={`font-mono text-xs font-bold ${v > 0 ? 'text-emerald-700' : v < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                                {v > 0 ? `+${formatCurrency(v)}/d` : v < 0 ? `-${formatCurrency(Math.abs(v))}/d` : '-'}
                                            </span>
                                        ) : row.metric.isTceDay ? (
                                            <span className="font-mono text-xs font-bold text-slate-700">
                                                {v ? `${formatCurrency(v)}/d` : '-'}
                                            </span>
                                        ) : (
                                            row.metric.isCurrency ? (
                                                <div className="flex items-center justify-end w-full min-w-[60px]">
                                                    {displayMode === 'pct' && row.metric.pct && row.metric.pct[origColIdx] !== null && row.metric.pct[origColIdx] !== undefined ? (
                                                        <span className="font-medium text-slate-700">
                                                            {row.metric.pct[origColIdx].toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="font-medium">
                                                            {(row.metric.name.includes("Flete") || row.metric.name.includes("Yield") || row.metric.name.includes("Tarifa")) ? formatYield(v) : formatCurrency(v)}
                                                        </span>
                                                    )}
                                                </div>
                                             ) : row.metric.isPct ? (
                                                 <span className="font-medium text-slate-700">{v != null && v !== 0 ? `${Number(v).toFixed(1)}%` : '-'}</span>
                                             ) : (
                                                 <span className="font-medium text-slate-700">{formatNumber(v)}</span>
                                             )
                                        )
                                    )}
                                </td>
                                );
                            })}
                            <td className={`py-1 px-1 text-right tabular-nums font-bold border border-slate-200 ${row.metric.isTotal ? 'bg-slate-200' : 'bg-slate-50'} ${row.isSubRow ? 'text-slate-300' : ''} ${row.metric.isCategoryHeader ? 'bg-slate-100/50' : ''}`}>
                                {row.metric.isCategoryHeader ? '' : (row.metric.isSubRowMetric ? '-' : (() => {
                                    // Recalculate total using only visible months
                                    const visibleIndices = months
                                        .map((m, i) => ({ m, i }))
                                        .filter(({ m }) => !hiddenMonths.includes(m))
                                        .map(({ i }) => i);
                                    const isYieldMetric = row.metric.name.includes("Flete") || row.metric.name.includes("Yield") || row.metric.name.includes("Tarifa");
                                    const visibleValues = visibleIndices.map(i => row.metric.values[i] ?? 0).filter(v => v !== null);
                                    const isAccumMetric = row.metric.globalType === 'accum';
                                    const visibleTotal = isAccumMetric
                                        ? (visibleValues.length > 0 ? visibleValues[visibleValues.length - 1] : 0)
                                        : isYieldMetric
                                            ? (visibleValues.length > 0 ? visibleValues.reduce((a, b) => a + b, 0) / visibleValues.length : 0)
                                            : visibleValues.reduce((a, b) => a + b, 0);

                                    return row.metric.isCurrency ? (
                                        <div className="flex items-center justify-end w-full min-w-[50px]">
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
                                    ) : (
                                        <span className="font-bold">{formatNumber(visibleTotal)}</span>
                                    );
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
