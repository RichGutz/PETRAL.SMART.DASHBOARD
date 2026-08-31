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

    const { allClientsList, allRoutesList, allVesselsList } = useMemo(() => {
        const cSet = new Set<string>();
        const rSet = new Set<string>();
        const vSet = new Set<string>();
        if (data?.aggregated_data) {
            Object.entries(data.aggregated_data).forEach(([client, routesData]: any) => {
                cSet.add(client);
                if (routesData && typeof routesData === 'object') {
                    Object.entries(routesData).forEach(([route, vesselsData]: any) => {
                        rSet.add(route);
                        if (vesselsData && typeof vesselsData === 'object') {
                            Object.entries(vesselsData).forEach(([vessel]: any) => {
                                vSet.add(vessel);
                            });
                        }
                    });
                }
            });
        }
        return {
            allClientsList: Array.from(cSet),
            allRoutesList: Array.from(rSet),
            allVesselsList: Array.from(vSet)
        };
    }, [data]);

    // Determinar qué dimensiones están activas según los filtros (si están todos desmarcados = roll-up de esa dimensión)
    const isClientActive = allClientsList.length === 0 || hiddenClients.length < allClientsList.length;
    const isRouteActive = allRoutesList.length > 0 && hiddenRoutes.length < allRoutesList.length;
    const isVesselActive = allVesselsList.length > 0 && hiddenVessels.length < allVesselsList.length;

    // Dimensiones que se mostrarán en columnas (mínimo 1)
    const activeDimensions: ('client' | 'route' | 'vessel')[] = useMemo(() => {
        const dims = groupOrder.filter(dim => {
            if (dim === 'client') return isClientActive;
            if (dim === 'route') return isRouteActive;
            if (dim === 'vessel') return isVesselActive;
            return false;
        });
        return dims.length > 0 ? dims : [groupOrder[0]];
    }, [groupOrder, isClientActive, isRouteActive, isVesselActive]);

    const rows = useMemo(() => {
        if (!data || !data.aggregated_data) return [];
        
        const result: any[] = [];
        const sum = (arr: number[]) => arr.reduce((a,b) => a+b, 0);

        // 1. Aplanar las hojas del árbol original aplicando filtros inteligentes
        const flatLeaves: Array<{
            client: string;
            route: string;
            vessel: string;
            monthData: any;
        }> = [];

        Object.entries(data.aggregated_data).forEach(([client, routesData]: any) => {
            // Si la dimensión de clientes está activa y este cliente fue excluido, omitir
            if (isClientActive && hiddenClients.includes(client)) return;

            if (routesData && typeof routesData === 'object') {
                Object.entries(routesData).forEach(([route, vesselsData]: any) => {
                    // Si la dimensión de rutas está activa y esta ruta fue excluida, omitir
                    if (isRouteActive && hiddenRoutes.includes(route)) return;

                    if (vesselsData && typeof vesselsData === 'object') {
                        Object.entries(vesselsData).forEach(([vessel, monthData]: any) => {
                            // Si la dimensión de buques está activa y este buque fue excluido, omitir
                            if (isVesselActive && hiddenVessels.includes(vessel)) return;

                            flatLeaves.push({ client, route, vessel, monthData });
                        });
                    }
                });
            }
        });

        // 2. Re-agrupar en base a las dimensiones activas
        // Si hay menos de 3 dimensiones activas, los niveles no activos se colapsan a '__ALL__'
        const dim0 = activeDimensions[0] || 'client';
        const dim1 = activeDimensions[1] || null;
        const dim2 = activeDimensions[2] || null;

        const regroupedTree: Record<string, Record<string, Record<string, any>>> = {};
        flatLeaves.forEach(({ client, route, vessel, monthData }) => {
            const keys: Record<string, string> = { client, route, vessel };
            const l1 = keys[dim0];
            const l2 = dim1 ? keys[dim1] : '__ALL__';
            const l3 = dim2 ? keys[dim2] : '__ALL__';

            if (!regroupedTree[l1]) regroupedTree[l1] = {};
            if (!regroupedTree[l1][l2]) regroupedTree[l1][l2] = {};
            
            // Si ya existe un monthData en esta celda agrupada, fusionar sus métricas
            if (!regroupedTree[l1][l2][l3]) {
                regroupedTree[l1][l2][l3] = JSON.parse(JSON.stringify(monthData));
                regroupedTree[l1][l2][l3]._associatedLeaves = [{ client, route, vessel }];
            } else {
                // Fusión de métricas sumando las hojas
                const existing = regroupedTree[l1][l2][l3];
                existing._associatedLeaves = existing._associatedLeaves || [];
                existing._associatedLeaves.push({ client, route, vessel });

                months.forEach(m => {
                    if (monthData[m]) {
                        if (!existing[m]) existing[m] = {};
                        const numKeys = [
                            'trips', 'monthly_frequency', 'tonnage', 'tons', 'gross_income', 'freight_revenue', 
                            'net_revenue', 'hire', 'bunker_costs', 'total_bunker_costs', 'port_costs', 'total_port_costs',
                            'dockage_costs', 'charter_hire', 'charter_hire_cost', 'voyage_result', 'demurrage',
                            'ifo_tons', 'bunker_ifo_tonnage', 'mdo_tons', 'bunker_mdo_tonnage', 'tot_sea_days', 'tot_port_days'
                        ];
                        numKeys.forEach(k => {
                            if (monthData[m][k] !== undefined) {
                                existing[m][k] = (Number(existing[m][k]) || 0) + (Number(monthData[m][k]) || 0);
                            }
                        });
                    }
                });
            }
        });

        // Mapeador para resolver los IDs originales según la jerarquía actual
        const getOriginalKeys = (l1: string, l2: string, l3: string, associatedLeaves?: any[]) => {
            if (associatedLeaves && associatedLeaves.length > 0) {
                return associatedLeaves[0];
            }
            const keys: Record<string, string> = { client: l1, route: l2, vessel: l3 };
            keys[dim0] = l1;
            if (dim1) keys[dim1] = l2;
            if (dim2) keys[dim2] = l3;
            return {
                client: keys['client'] || l1,
                route: keys['route'] || (dim1 ? l2 : 'Todas las Rutas'),
                vessel: keys['vessel'] || (dim2 ? l3 : 'Todos los Buques')
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
        const globalShipDays = new Array(months.length).fill(0);
        const globalTons = new Array(months.length).fill(0);
        const globalFreightRevenues = new Array(months.length).fill(0);
        const globalRevenues = new Array(months.length).fill(0);
        const globalCommissions = new Array(months.length).fill(0);
        const globalNetRevenues = new Array(months.length).fill(0);
        const globalHire = new Array(months.length).fill(0);
        const globalPortCosts = new Array(months.length).fill(0);
        const globalDockageCosts = new Array(months.length).fill(0);
        const globalBunkerCosts = new Array(months.length).fill(0);
        const globalCharterHire = new Array(months.length).fill(0);
        const globalVoyageResult = new Array(months.length).fill(0);
        const globalPlVsRequired = new Array(months.length).fill(0);
        const globalDemurrage = new Array(months.length).fill(0);

        const level1List = sortKeys(Object.keys(regroupedTree), dim0);

        level1List.forEach((level1Name) => {
            const level2Data = regroupedTree[level1Name];
            const level1RowSpanRef = { value: 0 };
            let isFirstLevel1Row = true;

            const level1Trips = new Array(months.length).fill(0);
            const level1ShipDays = new Array(months.length).fill(0);
            const level1FreightRevenue = new Array(months.length).fill(0);
            const level1GrossRevenue = new Array(months.length).fill(0);
            const level1Commissions = new Array(months.length).fill(0);
            const level1NetRevenue = new Array(months.length).fill(0);
            const level1Hire = new Array(months.length).fill(0);
            const level1PortCosts = new Array(months.length).fill(0);
            const level1DockageCosts = new Array(months.length).fill(0);
            const level1BunkerCosts = new Array(months.length).fill(0);
            const level1CharterHire = new Array(months.length).fill(0);
            const level1VoyageResult = new Array(months.length).fill(0);
            const level1PlVsRequired = new Array(months.length).fill(0);
            const level1Demurrage = new Array(months.length).fill(0);
            const level1TonsTotal = new Array(months.length).fill(0);

            const level2List = dim1 ? sortKeys(Object.keys(level2Data), dim1, dim0 === 'client' ? level1Name : undefined) : ['__ALL__'];

            level2List.forEach((level2Name) => {
                const level3Data = level2Data[level2Name] || {};
                const level2RowSpanRef = { value: 0 };
                let isFirstLevel2Row = true;

                let parentKeyLevel3: string | undefined = undefined;
                if (dim0 === 'client' && dim1 === 'route') {
                    parentKeyLevel3 = `${level1Name}-${level2Name}`;
                }
                const level3List = dim2 ? sortKeys(Object.keys(level3Data), dim2, parentKeyLevel3) : ['__ALL__'];

                level3List.forEach((level3Name) => {
                    const monthData = level3Data[level3Name] || {};
                    const { client, route, vessel } = getOriginalKeys(level1Name, level2Name, level3Name, monthData._associatedLeaves);

                    const rowKey = `${client}-${route}-${vessel}`;
                    const isExpanded = !!expandedRows[rowKey];
                    const numSubRows = isExpanded ? 25 : 0;
                    const isDemurrageExcluded = excludedDemurrages.includes(rowKey);
                    const isDemurrageVisible = showDemurrage && demurragePct !== '' && !isDemurrageExcluded;
                    const isDemurrageDaysVisible = showDemurrageDays && demurrageDays !== '' && !isDemurrageExcluded;
                    
                    const isDemurrageExpanded = !!expandedDemurrages[rowKey];
                    
                    const leaves = monthData._associatedLeaves || [{ client, route, vessel }];
                    const trips = months.map(m => {
                        let totalFreq = 0;
                        leaves.forEach((lf: any) => {
                            const line = projectionLines.find(p => 
                                p.client_id === lf.client && 
                                `${p.origin_port_id}-${p.destination_port_id}` === lf.route && 
                                p.vessel_id === lf.vessel && 
                                p.month_index === m
                            );
                            if (line) totalFreq += (line.monthly_frequency || 0);
                        });
                        return totalFreq > 0 ? totalFreq : (monthData[m]?.trips || monthData[m]?.monthly_frequency || 0);
                    });

                    const vesselDemurrageRate = months.map(m => monthData[m]?.["vessel_demurrage_rate"] ?? monthData[m]?.["demurrage_rate"] ?? monthData[m]?.["demurrageRate"] ?? 20000);
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

                    const getMonthlyValues = (metricKey: string) => {
                        return months.map((m, idx) => {
                            const tripCount = trips[idx] || 0;
                            if (tripCount <= 0) {
                                return undefined;
                            }

                            const seaDays = Number(monthData[m]?.["sea_days_unit"] ?? monthData[m]?.["sea_days"] ?? monthData[m]?.["tot_sea_days"] ?? 0);
                            const portDays = Number(monthData[m]?.["port_days_unit"] ?? monthData[m]?.["port_days"] ?? monthData[m]?.["tot_port_days"] ?? 0);
                            const nativeDemurrageDays = Number(monthData[m]?.["demurrage_days_unit"] ?? monthData[m]?.["demurrage_days"] ?? 0);
                            const dailyRate = Number(vesselDemurrageRate[idx] || 20000);

                            let effectiveDemurrageDays = nativeDemurrageDays;
                            if (isDemurrageVisible) {
                                // Opción B: Demurrage % convertido a días equivalentes (Demurrage USD / Tarifa Diaria)
                                const unitFreight = Number(monthData[m]?.["freight_revenue_unit"] ?? monthData[m]?.["gross_income"] ?? ((monthData[m]?.["carga_unit"] || 0) * (monthData[m]?.["flete_unit"] || 0)) ?? 0);
                                const unitDemurrageUsd = unitFreight * (demurragePctArray[idx] / 100);
                                effectiveDemurrageDays = dailyRate > 0 ? (unitDemurrageUsd / dailyRate) : 0;
                            } else if (isDemurrageDaysVisible) {
                                effectiveDemurrageDays = demurrageDaysArray[idx] || 0;
                            }

                            const dynamicTotalDuration = (seaDays > 0 || portDays > 0)
                                ? (seaDays + portDays + effectiveDemurrageDays)
                                : (Number(monthData[m]?.["total_duration"] ?? monthData[m]?.["total_days"] ?? 0) + (isDemurrageDaysVisible || isDemurrageVisible ? (effectiveDemurrageDays - nativeDemurrageDays) : 0));

                            // Delta de búnker por días extras de demora (si se sobreescribió en la matriz)
                            const extraDemurrageDays = (isDemurrageVisible || isDemurrageDaysVisible)
                                ? Math.max(0, effectiveDemurrageDays - nativeDemurrageDays)
                                : 0;
                            const idleIfo = Number(monthData[m]?.["consumption_idle_ifo"] ?? 1.5);
                            const idleMdo = Number(monthData[m]?.["consumption_idle_mdo"] ?? 0.8);
                            const priceIfo = Number(monthData[m]?.["price_ifo_unit"] ?? monthData[m]?.["bunker_price_ifo"] ?? 650);
                            const priceMdo = Number(monthData[m]?.["price_mdo_unit"] ?? monthData[m]?.["bunker_price_mdo"] ?? 950);
                            const extraBunkerCostPerTrip = extraDemurrageDays * ((idleIfo * priceIfo) + (idleMdo * priceMdo));

                            if (metricKey === "distancia_total") return monthData[m]?.["total_distance"] || monthData[m]?.["distancia"];
                            if (metricKey === "sea_days_unit") return seaDays;
                            if (metricKey === "port_days_unit") return portDays;
                            if (metricKey === "demurrage_days_unit") return effectiveDemurrageDays;
                            if (metricKey === "total_duration_unit") return dynamicTotalDuration;

                            if (metricKey === "total_bunker_costs_unit") {
                                const baseBunkerUnit = Number(monthData[m]?.["total_bunker_costs_unit"] ?? monthData[m]?.["total_bunker_costs"] ?? monthData[m]?.["bunker_costs"] ?? 0);
                                return baseBunkerUnit + extraBunkerCostPerTrip;
                            }
                            if (metricKey === "total_bunker_costs") {
                                const baseBunkerUnit = Number(monthData[m]?.["total_bunker_costs_unit"] ?? monthData[m]?.["total_bunker_costs"] ?? monthData[m]?.["bunker_costs"] ?? 0);
                                return (baseBunkerUnit + extraBunkerCostPerTrip) * tripCount;
                            }

                            let val = monthData[m]?.[metricKey];
                            if (val === undefined || val === null || val === 0) {
                                if (metricKey === "bunker_ifo_tonnage_unit") val = monthData[m]?.["bunker_ifo_tonnage"] || monthData[m]?.["ifo_tons"];
                                if (metricKey === "bunker_mdo_tonnage_unit") val = monthData[m]?.["bunker_mdo_tonnage"] || monthData[m]?.["mdo_tons"];
                                if (metricKey === "total_port_costs_unit") val = monthData[m]?.["total_port_costs"] || monthData[m]?.["port_costs"];
                                if (metricKey === "gross_income_unit") val = monthData[m]?.["freight_revenue_unit"] ?? monthData[m]?.["freight_revenue"] ?? monthData[m]?.["gross_income"] ?? (monthData[m]?.["carga_unit"] && monthData[m]?.["flete_unit"] ? monthData[m]?.["carga_unit"] * monthData[m]?.["flete_unit"] : undefined);
                                if (metricKey === "address_comm_pct") val = monthData[m]?.["address_comm_pct"];
                                if (metricKey === "broker_comm_pct") val = monthData[m]?.["broker_comm_pct"];
                                if (metricKey === "total_commissions_unit") val = monthData[m]?.["total_commissions"];
                                if (metricKey === "price_ifo_unit") val = monthData[m]?.["price_ifo_unit"] ?? 0;
                                if (metricKey === "bunker_ifo_cost_unit") val = monthData[m]?.["bunker_ifo_cost_unit"] ?? ((monthData[m]?.["bunker_ifo_tonnage_unit"] && monthData[m]?.["price_ifo_unit"]) ? monthData[m]?.["bunker_ifo_tonnage_unit"] * monthData[m]?.["price_ifo_unit"] : 0);
                                if (metricKey === "price_mdo_unit") val = monthData[m]?.["price_mdo_unit"] ?? 0;
                                if (metricKey === "bunker_mdo_cost_unit") val = monthData[m]?.["bunker_mdo_cost_unit"] ?? ((monthData[m]?.["bunker_mdo_tonnage_unit"] && monthData[m]?.["price_mdo_unit"]) ? monthData[m]?.["bunker_mdo_tonnage_unit"] * monthData[m]?.["price_mdo_unit"] : 0);
                                if (metricKey === "voyage_result_unit") val = monthData[m]?.["voyage_result"] || monthData[m]?.["voyage_result_unit"];
                                if (metricKey === "tce_real_unit") val = monthData[m]?.["tce_real"] || monthData[m]?.["tce"];
                                if (metricKey === "tce_required_unit") val = monthData[m]?.["tce_required_unit"] ?? monthData[m]?.["tce_required"] ?? 0;
                                if (metricKey === "tce_cost_total_unit") val = dynamicTotalDuration * Number(monthData[m]?.["tce_required_unit"] ?? monthData[m]?.["tce_required"] ?? 0);
                                if (metricKey === "flete_unit") val = monthData[m]?.["flete_unit"] || monthData[m]?.["freight_rate"];
                                if (metricKey === "charter_hire_cost_unit") val = monthData[m]?.["charter_hire_cost_unit"] ?? monthData[m]?.["charter_hire_cost"] ?? monthData[m]?.["charterHireCost"] ?? monthData[m]?.["charter_hire"] ?? 0;
                                if (metricKey === "pl_vs_required_unit") val = monthData[m]?.["pl_vs_required_unit"] || monthData[m]?.["pl_vs_required"] || monthData[m]?.["pl_neto"];
                            }
                            if (metricKey === "tce_cost_total_unit") {
                                val = dynamicTotalDuration * Number(monthData[m]?.["tce_required_unit"] ?? monthData[m]?.["tce_required"] ?? 0);
                            }
                            return val;
                        });
                    };

                    const freightRevenues = getMonthlyValues("gross_income_unit").map((val, i) => (val !== undefined ? val * trips[i] : (getMonthlyValues("carga_unit")[i] || 0) * (getMonthlyValues("flete_unit")[i] || 0) * trips[i]));
                    const refacturacionMuellaje = months.map((m, i) => {
                        const tripCount = trips[i] || 0;
                        if (tripCount <= 0) return 0;
                        const mUnit = monthData[m]?.["dockage_revenue_unit"] ?? monthData[m]?.["refacturacion_muellaje_unit"];
                        if (mUnit !== undefined && mUnit !== null && Number(mUnit) > 0) {
                            return Number(mUnit) * tripCount;
                        }
                        const mVal = monthData[m]?.["dockage_revenue"] ?? monthData[m]?.["refacturacion_muellaje"] ?? monthData[m]?.["total_refacturacion_muellaje"] ?? monthData[m]?.["muellaje_refacturado"] ?? monthData[m]?.["muellaje"] ?? 0;
                        return Number(mVal);
                    });

                    let demurrageArr = new Array(months.length).fill(0);
                    if (isDemurrageVisible) {
                        // Demurrage % sobre Freight Revenue (Botón 8)
                        demurrageArr = freightRevenues.map((fRev, i) => (fRev || 0) * (demurragePctArray[i] / 100));
                    } else if (isDemurrageDaysVisible) {
                        // Demurrage Días * Tarifa diaria (Botón 9)
                        demurrageArr = trips.map((t, i) => t * demurrageDaysArray[i] * (vesselDemurrageRate[i] || 20000));
                    } else {
                        // Demurrage nativo de la foto
                        demurrageArr = months.map((m, i) => {
                            const tripCount = trips[i] || 0;
                            if (tripCount <= 0) return 0;
                            const dUnit = monthData[m]?.["demurrage_revenue_unit"] ?? monthData[m]?.["demurrage_income_unit"];
                            if (dUnit !== undefined && dUnit !== null && Number(dUnit) > 0) {
                                return Number(dUnit) * tripCount;
                            }
                            const dVal = monthData[m]?.["demurrage_revenue"] ?? monthData[m]?.["demurrage_income"] ?? 0;
                            return Number(dVal);
                        });
                    }
                    demurrageArr.forEach((v, i) => {
                        level1Demurrage[i] += (v || 0);
                        globalDemurrage[i] += (v || 0);
                    });

                    const grossRevenues = months.map((_, i) => freightRevenues[i] + refacturacionMuellaje[i] + (demurrageArr[i] || 0));
                    const commissions = getMonthlyValues("total_commissions");
                    const netRevenues = months.map((_, i) => grossRevenues[i] - (commissions[i] || 0));
                    
                    const portCostsTotal = getMonthlyValues("total_port_costs");
                    const dockageCosts = refacturacionMuellaje;
                    const portCosts = months.map((_, i) => Math.max(0, (portCostsTotal[i] || 0) - (dockageCosts[i] || 0)));
                    const bunker = getMonthlyValues("total_bunker_costs");

                    // ARRIENDO DE NAVES (CHARTER HIRE)
                    const charterHireCosts = months.map((m, i) => {
                        const tripCount = trips[i] || 0;
                        if (tripCount <= 0) return 0;
                        const cUnit = monthData[m]?.["charter_hire_cost_unit"] ?? monthData[m]?.["charter_hire_cost"] ?? monthData[m]?.["charterHireCost"] ?? monthData[m]?.["charter_hire"] ?? 0;
                        return Number(cUnit) * tripCount;
                    });

                    const voyageResult = months.map((_, i) => (trips[i] > 0 ? (netRevenues[i] || 0) - (portCosts[i] || 0) - (dockageCosts[i] || 0) - (bunker[i] || 0) - (charterHireCosts[i] || 0) : 0));
                    
                    const totalDaysArr = getMonthlyValues("total_duration_unit");
                    const tceReq = getMonthlyValues("tce_required_unit");
                    const tceCostTotal = months.map((_, i) => (trips[i] > 0 ? (tceReq[i] || 13000) * (totalDaysArr[i] || 0) * trips[i] : 0));
                    
                    const plVsRequired = months.map((_, i) => (trips[i] > 0 ? (voyageResult[i] || 0) - (tceCostTotal[i] || 0) : 0));
                    
                    const tceReal = months.map((_, i) => {
                        const d = (totalDaysArr[i] || 0) * trips[i];
                        return d > 0 ? (voyageResult[i] || 0) / d : 0;
                    });
                    const tceDiff = months.map((_, i) => (trips[i] > 0 ? (tceReal[i] - (tceReq[i] || 13000)) : 0));

                    trips.forEach((v, i) => {
                        level1Trips[i] += (v || 0);
                        globalTrips[i] += (v || 0);
                    });
                    freightRevenues.forEach((v, i) => {
                        level1FreightRevenue[i] += (v || 0);
                        globalFreightRevenues[i] += (v || 0);
                    });
                    grossRevenues.forEach((v, i) => {
                        level1GrossRevenue[i] += (v || 0);
                        globalRevenues[i] += (v || 0);
                    });
                    commissions.forEach((v, i) => {
                        level1Commissions[i] += (v || 0);
                        globalCommissions[i] += (v || 0);
                    });
                    netRevenues.forEach((v, i) => {
                        level1NetRevenue[i] += (v || 0);
                        globalNetRevenues[i] += (v || 0);
                    });
                    tceCostTotal.forEach((v, i) => {
                        level1Hire[i] += (v || 0);
                        globalHire[i] += (v || 0);
                    });
                    portCosts.forEach((v, i) => {
                        level1PortCosts[i] += (v || 0);
                        globalPortCosts[i] += (v || 0);
                    });
                    dockageCosts.forEach((v, i) => {
                        level1DockageCosts[i] += (v || 0);
                        globalDockageCosts[i] += (v || 0);
                    });
                    bunker.forEach((v, i) => {
                        level1BunkerCosts[i] += (v || 0);
                        globalBunkerCosts[i] += (v || 0);
                    });
                    charterHireCosts.forEach((v, i) => {
                        level1CharterHire[i] += (v || 0);
                        globalCharterHire[i] += (v || 0);
                    });
                    voyageResult.forEach((v, i) => {
                        level1VoyageResult[i] += (v || 0);
                        globalVoyageResult[i] += (v || 0);
                    });
                    plVsRequired.forEach((v, i) => {
                        level1PlVsRequired[i] += (v || 0);
                        globalPlVsRequired[i] += (v || 0);
                    });

                    const unitCargos = getMonthlyValues("carga_unit");
                    const tonsTotal = months.map((_, i) => (trips[i] > 0 ? (unitCargos[i] || monthData[months[i]]?.["carga_unit"] || 0) * trips[i] : 0));
                    tonsTotal.forEach((v, i) => {
                        level1TonsTotal[i] += (v || 0);
                        globalTons[i] += (v || 0);
                    });

                    const nodeShipDays = months.map((_, i) => (trips[i] > 0 ? (totalDaysArr[i] || 0) * trips[i] : 0));
                    nodeShipDays.forEach((v, i) => {
                        level1ShipDays[i] += (v || 0);
                        globalShipDays[i] += (v || 0);
                    });

                    const calcPct = (arr: number[]) => arr.map((v, i) => grossRevenues[i] ? (v / grossRevenues[i]) * 100 : 0);
                    const calcTotalPct = (totalVal: number, totalRev: number) => totalRev ? (totalVal / totalRev) * 100 : 0;

                    const isExpandedGross = !!expandedGrossRevenue[rowKey];
                    const isExpandedTceRow = !!expandedTce[rowKey];

                    const isRollUpMode = activeDimensions.length < 3;

                    const metrics: any[] = [
                        { 
                            name: isRollUpMode ? "Viajes" : "Viajes (freq)", 
                            values: trips, 
                            total: sum(trips), 
                            pct: null, 
                            totalPct: null, 
                            isCurrency: false, 
                            isTotal: false, 
                            isExpandable: !isRollUpMode, 
                            isFrequencyEditable: !isRollUpMode, 
                            rowKey, 
                            isExpanded: isRollUpMode ? false : isExpanded 
                        },
                        { name: "Días-Buque", values: nodeShipDays, total: sum(nodeShipDays), pct: null, totalPct: null, isCurrency: false, isTotal: false },
                        { name: "Toneladas", values: tonsTotal, total: sum(tonsTotal), pct: null, totalPct: null, isCurrency: false, isTotal: false },
                        { name: "Net Revenue", values: netRevenues, total: sum(netRevenues), pct: calcPct(netRevenues), totalPct: calcTotalPct(sum(netRevenues), sum(grossRevenues)), isCurrency: true, isTotal: false, isExpandableGrossRevenue: true, rowKey, isExpanded: isExpandedGross },
                        { name: "(-) Hire (TCE x días)", values: tceCostTotal, total: sum(tceCostTotal), pct: calcPct(tceCostTotal), totalPct: calcTotalPct(sum(tceCostTotal), sum(grossRevenues)), isCurrency: true, isTotal: false },
                        { name: "(-) Bunker Costs", values: bunker, total: sum(bunker), pct: calcPct(bunker), totalPct: calcTotalPct(sum(bunker), sum(grossRevenues)), isCurrency: true, isTotal: false },
                        { name: "(-) Port Costs", values: portCosts, total: sum(portCosts), pct: calcPct(portCosts), totalPct: calcTotalPct(sum(portCosts), sum(grossRevenues)), isCurrency: true, isTotal: false },
                        { name: "(-) Dockage", values: dockageCosts, total: sum(dockageCosts), pct: calcPct(dockageCosts), totalPct: calcTotalPct(sum(dockageCosts), sum(grossRevenues)), isCurrency: true, isTotal: false },
                        { name: "(-) Arriendo de Naves", values: charterHireCosts, total: sum(charterHireCosts), pct: calcPct(charterHireCosts), totalPct: calcTotalPct(sum(charterHireCosts), sum(grossRevenues)), isCurrency: true, isTotal: false },
                        { name: "(=) VOYAGE RESULT / P&L", values: plVsRequired, total: sum(plVsRequired), pct: calcPct(plVsRequired), totalPct: calcTotalPct(sum(plVsRequired), sum(grossRevenues)), isCurrency: true, isTotal: true },
                        { name: "▶ Métricas TCE ($/d)", values: tceReal, total: null, pct: null, totalPct: null, isCurrency: false, isTotal: false, isExpandableTce: true, rowKey, isExpanded: isExpandedTceRow }
                    ];

                    const demurrageSubSubRowsCount = (isExpandedGross && isDemurrageExpanded && (isDemurrageVisible || isDemurrageDaysVisible)) ? 1 : 0;
                    const netRevenueSubRowsCount = isExpandedGross ? (5 + demurrageSubSubRowsCount) : 0;
                    const tceSubRowsCount = isExpandedTceRow ? 3 : 0;

                    const vesselRowSpan = metrics.length + numSubRows + netRevenueSubRowsCount + tceSubRowsCount;
                    
                    level1RowSpanRef.value += vesselRowSpan;
                    level2RowSpanRef.value += vesselRowSpan;

                    metrics.forEach((metric, index) => {
                        result.push({
                            col1: isFirstLevel1Row && isFirstLevel2Row && index === 0 ? { type: dim0, name: level1Name, rowSpanRef: level1RowSpanRef } : null,
                            col2: dim1 && isFirstLevel2Row && index === 0 ? { type: dim1, name: level2Name, rowSpanRef: level2RowSpanRef } : null,
                            col3: dim2 && index === 0 ? { type: dim2, name: level3Name, rowSpan: vesselRowSpan } : null,
                            clientName: client,
                            routeName: route,
                            vesselName: vessel,
                            metric: metric,
                            isSubRow: false
                        });

                        // 1. Acordeón de Net Revenue (5 sub-filas ordenadas con Demurrage)
                        if (metric.isExpandableGrossRevenue && isExpandedGross) {
                            // 1.1. Freight Revenue
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

                            // 1.2. Demurrage (Integrado en Net Revenue)
                            result.push({
                                col1: null, col2: null, col3: null,
                                clientName: client, routeName: route, vesselName: vessel,
                                metric: {
                                    name: "↳ (+) Demurrage",
                                    values: demurrageArr,
                                    total: sum(demurrageArr),
                                    pct: calcPct(demurrageArr),
                                    totalPct: calcTotalPct(sum(demurrageArr), sum(grossRevenues)),
                                    isCurrency: true,
                                    isTotal: false,
                                    isSubRowMetric: true,
                                    isExpandableDemurrage: (isDemurrageVisible || isDemurrageDaysVisible),
                                    rowKey,
                                    isExpanded: isDemurrageExpanded
                                },
                                isSubRow: true
                            });

                            // Desglose interactivo si Demurrage está expandido
                            if (isDemurrageExpanded) {
                                if (isDemurrageVisible) {
                                    result.push({
                                        col1: null, col2: null, col3: null,
                                        clientName: client, routeName: route, vesselName: vessel,
                                        metric: {
                                            name: "    ↳ Demurrage (%)",
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
                                            name: "    ↳ Demurrage (días)",
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
                            }

                            // 1.3. Dockage Revenue
                            result.push({
                                col1: null, col2: null, col3: null,
                                clientName: client, routeName: route, vesselName: vessel,
                                metric: {
                                    name: "↳ (+) Dockage Revenue",
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

                            // 1.4. Gross Revenue
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

                            // 1.5. Comisiones
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
                                { name: "↳ Días de Demora", key: "demurrage_days_unit", curr: false, isPct: false },
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

                    isFirstLevel2Row = false;
                    isFirstLevel1Row = false;
                });
            });

            const level1CalcPct = (arr: number[]) => arr.map((v, i) => level1GrossRevenue[i] ? (v / level1GrossRevenue[i]) * 100 : 0);
            const level1CalcTotalPct = (totalVal: number, totalRev: number) => totalRev ? (totalVal / totalRev) * 100 : 0;

            const totalLevel1FreightRevenue = sum(level1FreightRevenue);
            const level1GrossPlusDem = level1FreightRevenue.map((fRev, i) => fRev + (level1Demurrage[i] || 0));
            const totalGrossPlusDem = sum(level1GrossPlusDem);
            const totalLevel1Tons = sum(level1TonsTotal);
            const totalLevel1ShipDays = sum(level1ShipDays);

            const isExpandedSubtotalGross = !!expandedGrossRevenue[`subtotal-gross-${level1Name}`];

            const subMetrics = [
                { name: "Viajes", values: level1Trips, total: sum(level1Trips), pct: null, totalPct: null, isCurrency: false, isTotal: false },
                { name: "Días-Buque", values: level1ShipDays, total: totalLevel1ShipDays, pct: null, totalPct: null, isCurrency: false, isTotal: false },
                { name: "Toneladas", values: level1TonsTotal, total: totalLevel1Tons, pct: null, totalPct: null, isCurrency: false, isTotal: false },
                { 
                    name: "Net Revenue", 
                    values: level1NetRevenue, 
                    total: sum(level1NetRevenue), 
                    pct: level1CalcPct(level1NetRevenue), 
                    totalPct: level1CalcTotalPct(sum(level1NetRevenue), sum(level1GrossRevenue)), 
                    isCurrency: true, 
                    isTotal: false,
                    isExpandableGrossRevenue: true,
                    rowKey: `subtotal-gross-${level1Name}`,
                    isExpanded: isExpandedSubtotalGross
                },
                { name: "(-) Hire (TCE x días)", values: level1Hire, total: sum(level1Hire), pct: level1CalcPct(level1Hire), totalPct: level1CalcTotalPct(sum(level1Hire), sum(level1GrossRevenue)), isCurrency: true, isTotal: false },
                { name: "(-) Bunker Costs", values: level1BunkerCosts, total: sum(level1BunkerCosts), pct: level1CalcPct(level1BunkerCosts), totalPct: level1CalcTotalPct(sum(level1BunkerCosts), sum(level1GrossRevenue)), isCurrency: true, isTotal: false },
                { name: "(-) Port Costs", values: level1PortCosts, total: sum(level1PortCosts), pct: level1CalcPct(level1PortCosts), totalPct: level1CalcTotalPct(sum(level1PortCosts), sum(level1GrossRevenue)), isCurrency: true, isTotal: false },
                { name: "(-) Dockage", values: level1DockageCosts, total: sum(level1DockageCosts), pct: level1CalcPct(level1DockageCosts), totalPct: level1CalcTotalPct(sum(level1DockageCosts), sum(level1GrossRevenue)), isCurrency: true, isTotal: false },
                { name: "(-) Arriendo de Naves", values: level1CharterHire, total: sum(level1CharterHire), pct: level1CalcPct(level1CharterHire), totalPct: level1CalcTotalPct(sum(level1CharterHire), sum(level1GrossRevenue)), isCurrency: true, isTotal: false },
                { name: "(=) VOYAGE RESULT / P&L", values: level1PlVsRequired, total: sum(level1PlVsRequired), pct: level1CalcPct(level1PlVsRequired), totalPct: level1CalcTotalPct(sum(level1PlVsRequired), sum(level1GrossRevenue)), isCurrency: true, isTotal: true }
            ];

            // Solo agregar bloque de subtotales si la tabla está en desglose total a 3 niveles (para no duplicar en modo Rollup)
            if (showSubtotals && activeDimensions.length === 3) {
                const isSubtotalCollapsed = !!collapsedSubtotals[level1Name];
                const subtotalNetRevenueSubRowsCount = isExpandedSubtotalGross && !isSubtotalCollapsed ? 5 : 0;
                const visibleSubMetrics = isSubtotalCollapsed ? [subMetrics[0]] : subMetrics;
                const totalSubtotalRows = visibleSubMetrics.length + subtotalNetRevenueSubRowsCount;

                level1RowSpanRef.value += totalSubtotalRows;
                const subtotalRouteRowSpanRef = { value: totalSubtotalRows };

                visibleSubMetrics.forEach((metric, index) => {
                    const isExpandableRow = index === 0;
                    
                    result.push({
                        col1: null,
                        col2: dim1 && index === 0 ? { name: "Σ SUBTOTAL", rowSpanRef: subtotalRouteRowSpanRef, isSubtotal: true } : null,
                        col3: dim2 && index === 0 ? { name: `TOTAL ${dim0.toUpperCase()}`, rowSpan: totalSubtotalRows, isSubtotal: true } : (!dim1 && index === 0 ? { name: `TOTAL ${dim0.toUpperCase()}`, rowSpan: totalSubtotalRows, isSubtotal: true } : null),
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

                    // Si se expande Net Revenue en Subtotal Cliente
                    if (metric.isExpandableGrossRevenue && isExpandedSubtotalGross && !isSubtotalCollapsed) {
                        // 1.1 Freight Revenue
                        result.push({
                            col1: null, col2: null, col3: null,
                            clientName: level1Name, routeName: "", vesselName: "",
                            metric: {
                                name: "↳ (+) Freight Revenue",
                                values: level1FreightRevenue,
                                total: sum(level1FreightRevenue),
                                pct: level1CalcPct(level1FreightRevenue),
                                totalPct: level1CalcTotalPct(sum(level1FreightRevenue), sum(level1GrossRevenue)),
                                isCurrency: true,
                                isTotal: false,
                                isSubRowMetric: true
                            },
                            isSubRow: true,
                            isClientSubtotal: true
                        });
                        // 1.2 Demurrage
                        result.push({
                            col1: null, col2: null, col3: null,
                            clientName: level1Name, routeName: "", vesselName: "",
                            metric: {
                                name: "↳ (+) Demurrage",
                                values: level1Demurrage,
                                total: sum(level1Demurrage),
                                pct: level1CalcPct(level1Demurrage),
                                totalPct: level1CalcTotalPct(sum(level1Demurrage), sum(level1GrossRevenue)),
                                isCurrency: true,
                                isTotal: false,
                                isSubRowMetric: true
                            },
                            isSubRow: true,
                            isClientSubtotal: true
                        });
                        // 1.3 Dockage Revenue
                        result.push({
                            col1: null, col2: null, col3: null,
                            clientName: level1Name, routeName: "", vesselName: "",
                            metric: {
                                name: "↳ (+) Dockage Revenue",
                                values: level1DockageCosts,
                                total: sum(level1DockageCosts),
                                pct: level1CalcPct(level1DockageCosts),
                                totalPct: level1CalcTotalPct(sum(level1DockageCosts), sum(level1GrossRevenue)),
                                isCurrency: true,
                                isTotal: false,
                                isSubRowMetric: true
                            },
                            isSubRow: true,
                            isClientSubtotal: true
                        });
                        // 1.4 Gross Revenue
                        result.push({
                            col1: null, col2: null, col3: null,
                            clientName: level1Name, routeName: "", vesselName: "",
                            metric: {
                                name: "↳ (=) Gross Revenue",
                                values: level1GrossRevenue,
                                total: sum(level1GrossRevenue),
                                pct: level1GrossRevenue.map(r => r ? 100 : 0),
                                totalPct: sum(level1GrossRevenue) ? 100 : 0,
                                isCurrency: true,
                                isTotal: false,
                                isSubRowMetric: true
                            },
                            isSubRow: true,
                            isClientSubtotal: true
                        });
                        // 1.5 Comisiones
                        result.push({
                            col1: null, col2: null, col3: null,
                            clientName: level1Name, routeName: "", vesselName: "",
                            metric: {
                                name: "↳ (-) Comisiones",
                                values: level1Commissions,
                                total: sum(level1Commissions),
                                pct: level1CalcPct(level1Commissions),
                                totalPct: level1CalcTotalPct(sum(level1Commissions), sum(level1GrossRevenue)),
                                isCurrency: true,
                                isTotal: false,
                                isSubRowMetric: true
                            },
                            isSubRow: true,
                            isClientSubtotal: true
                        });
                    }
                });
            }
        });
        
        // TOTAL FLOTA
        const globalCalcPct = (arr: number[]) => arr.map((v, i) => globalRevenues[i] ? (v / globalRevenues[i]) * 100 : 0);
        const globalCalcTotalPct = (totalVal: number, totalRev: number) => totalRev ? (totalVal / totalRev) * 100 : 0;

        const totalGlobalTons = sum(globalTons);
        const totalGlobalShipDays = sum(globalShipDays);

        const isExpandedGlobalTotalGross = !isGlobalTotalCollapsed && !!expandedGrossRevenue['global-total-gross'];

        const globalMetrics = [
            { name: "Viajes", values: globalTrips, total: sum(globalTrips), pct: null, totalPct: null, isCurrency: false, isTotal: false },
            { name: "Días-Buque", values: globalShipDays, total: totalGlobalShipDays, pct: null, totalPct: null, isCurrency: false, isTotal: false },
            { name: "Toneladas", values: globalTons, total: totalGlobalTons, pct: null, totalPct: null, isCurrency: false, isTotal: false },
            { 
                name: "Net Revenue", 
                values: globalNetRevenues, 
                total: sum(globalNetRevenues), 
                pct: globalCalcPct(globalNetRevenues), 
                totalPct: globalCalcTotalPct(sum(globalNetRevenues), sum(globalRevenues)), 
                isCurrency: true, 
                isTotal: false,
                isExpandableGrossRevenue: true,
                rowKey: 'global-total-gross',
                isExpanded: isExpandedGlobalTotalGross
            },
            { name: "(-) Hire (TCE x días)", values: globalHire, total: sum(globalHire), pct: globalCalcPct(globalHire), totalPct: globalCalcTotalPct(sum(globalHire), sum(globalRevenues)), isCurrency: true, isTotal: false },
            { name: "(-) Bunker Costs", values: globalBunkerCosts, total: sum(globalBunkerCosts), pct: globalCalcPct(globalBunkerCosts), totalPct: globalCalcTotalPct(sum(globalBunkerCosts), sum(globalRevenues)), isCurrency: true, isTotal: false },
            { name: "(-) Port Costs", values: globalPortCosts, total: sum(globalPortCosts), pct: globalCalcPct(globalPortCosts), totalPct: globalCalcTotalPct(sum(globalPortCosts), sum(globalRevenues)), isCurrency: true, isTotal: false },
            { name: "(-) Dockage", values: globalDockageCosts, total: sum(globalDockageCosts), pct: globalCalcPct(globalDockageCosts), totalPct: globalCalcTotalPct(sum(globalDockageCosts), sum(globalRevenues)), isCurrency: true, isTotal: false },
            { name: "(-) Arriendo de Naves", values: globalCharterHire, total: sum(globalCharterHire), pct: globalCalcPct(globalCharterHire), totalPct: globalCalcTotalPct(sum(globalCharterHire), sum(globalRevenues)), isCurrency: true, isTotal: false },
            { name: "(=) VOYAGE RESULT / P&L", values: globalPlVsRequired, total: sum(globalPlVsRequired), pct: globalCalcPct(globalPlVsRequired), totalPct: globalCalcTotalPct(sum(globalPlVsRequired), sum(globalRevenues)), isCurrency: true, isTotal: true }
        ];

        const visibleGlobalMetrics = isGlobalTotalCollapsed ? [globalMetrics[0]] : globalMetrics;
        const globalTotalSubRowsCount = (!isGlobalTotalCollapsed && isExpandedGlobalTotalGross) ? 5 : 0;
        const totalGlobalRows = visibleGlobalMetrics.length + globalTotalSubRowsCount;
        const globalRouteRowSpanRef = { value: totalGlobalRows };

        visibleGlobalMetrics.forEach((metric, index) => {
            const isExpandableRow = index === 0;
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

            if (metric.isExpandableGrossRevenue && isExpandedGlobalTotalGross) {
                // 1.1 Freight
                result.push({
                    col1: null, col2: null, col3: null,
                    clientName: "TOTAL FLOTA", routeName: "", vesselName: "",
                    metric: {
                        name: "↳ (+) Freight Revenue",
                        values: globalFreightRevenues,
                        total: sum(globalFreightRevenues),
                        pct: globalCalcPct(globalFreightRevenues),
                        totalPct: globalCalcTotalPct(sum(globalFreightRevenues), sum(globalRevenues)),
                        isCurrency: true,
                        isTotal: false,
                        isSubRowMetric: true
                    },
                    isSubRow: true,
                    isGlobalTotal: true
                });
                // 1.2 Demurrage
                result.push({
                    col1: null, col2: null, col3: null,
                    clientName: "TOTAL FLOTA", routeName: "", vesselName: "",
                    metric: {
                        name: "↳ (+) Demurrage",
                        values: globalDemurrage,
                        total: sum(globalDemurrage),
                        pct: globalCalcPct(globalDemurrage),
                        totalPct: globalCalcTotalPct(sum(globalDemurrage), sum(globalRevenues)),
                        isCurrency: true,
                        isTotal: false,
                        isSubRowMetric: true
                    },
                    isSubRow: true,
                    isGlobalTotal: true
                });
                // 1.3 Dockage
                result.push({
                    col1: null, col2: null, col3: null,
                    clientName: "TOTAL FLOTA", routeName: "", vesselName: "",
                    metric: {
                        name: "↳ (+) Dockage Revenue",
                        values: globalDockageCosts,
                        total: sum(globalDockageCosts),
                        pct: globalCalcPct(globalDockageCosts),
                        totalPct: globalCalcTotalPct(sum(globalDockageCosts), sum(globalRevenues)),
                        isCurrency: true,
                        isTotal: false,
                        isSubRowMetric: true
                    },
                    isSubRow: true,
                    isGlobalTotal: true
                });
                // 1.4 Gross
                result.push({
                    col1: null, col2: null, col3: null,
                    clientName: "TOTAL FLOTA", routeName: "", vesselName: "",
                    metric: {
                        name: "↳ (=) Gross Revenue",
                        values: globalRevenues,
                        total: sum(globalRevenues),
                        pct: globalRevenues.map(r => r ? 100 : 0),
                        totalPct: sum(globalRevenues) ? 100 : 0,
                        isCurrency: true,
                        isTotal: false,
                        isSubRowMetric: true
                    },
                    isSubRow: true,
                    isGlobalTotal: true
                });
                // 1.5 Comisiones
                result.push({
                    col1: null, col2: null, col3: null,
                    clientName: "TOTAL FLOTA", routeName: "", vesselName: "",
                    metric: {
                        name: "↳ (-) Comisiones",
                        values: globalCommissions,
                        total: sum(globalCommissions),
                        pct: globalCalcPct(globalCommissions),
                        totalPct: globalCalcTotalPct(sum(globalCommissions), sum(globalRevenues)),
                        isCurrency: true,
                        isTotal: false,
                        isSubRowMetric: true
                    },
                    isSubRow: true,
                    isGlobalTotal: true
                });
            }
        });

        // TOTAL ACUMULADO
        const accumArray = (arr: number[]) => {
            let running = 0;
            return arr.map(v => { running += v; return running; });
        };
        const accumTrips = accumArray(globalTrips);
        const accumShipDays = accumArray(globalShipDays);
        const accumTons = accumArray(globalTons);
        const accumNetRevenues = accumArray(globalNetRevenues);
        const accumHire = accumArray(globalHire);
        const accumBunkerCosts = accumArray(globalBunkerCosts);
        const accumPortCosts = accumArray(globalPortCosts);
        const accumDockageCosts = accumArray(globalDockageCosts);
        const accumCharterHire = accumArray(globalCharterHire);
        const accumPlVsRequired = accumArray(globalPlVsRequired);
        const accumRevenues = accumArray(globalRevenues);
        const accumFreight = accumArray(globalFreightRevenues);
        const accumDemurrage = accumArray(globalDemurrage);
        const accumCommissions = accumArray(globalCommissions);

        const accumCalcPct = (arr: number[]) => arr.map((v, i) => accumRevenues[i] ? (v / accumRevenues[i]) * 100 : 0);
        const lastVal = (arr: number[]) => arr.length > 0 ? arr[arr.length - 1] : 0;

        const isExpandedGlobalAcumGross = !isGlobalAcumCollapsed && !!expandedGrossRevenue['global-acum-gross'];

        const accumMetrics = [
            { name: "Viajes", values: accumTrips, total: lastVal(accumTrips), pct: null, totalPct: null, isCurrency: false, isTotal: false },
            { name: "Días-Buque", values: accumShipDays, total: lastVal(accumShipDays), pct: null, totalPct: null, isCurrency: false, isTotal: false },
            { name: "Toneladas", values: accumTons, total: lastVal(accumTons), pct: null, totalPct: null, isCurrency: false, isTotal: false },
            { 
                name: "Net Revenue", 
                values: accumNetRevenues, 
                total: lastVal(accumNetRevenues), 
                pct: accumCalcPct(accumNetRevenues), 
                totalPct: globalCalcTotalPct(lastVal(accumNetRevenues), lastVal(accumRevenues)), 
                isCurrency: true, 
                isTotal: false,
                isExpandableGrossRevenue: true,
                rowKey: 'global-acum-gross',
                isExpanded: isExpandedGlobalAcumGross
            },
            { name: "(-) Hire (TCE x días)", values: accumHire, total: lastVal(accumHire), pct: accumCalcPct(accumHire), totalPct: globalCalcTotalPct(lastVal(accumHire), lastVal(accumRevenues)), isCurrency: true, isTotal: false },
            { name: "(-) Bunker Costs", values: accumBunkerCosts, total: lastVal(accumBunkerCosts), pct: accumCalcPct(accumBunkerCosts), totalPct: globalCalcTotalPct(lastVal(accumBunkerCosts), lastVal(accumRevenues)), isCurrency: true, isTotal: false },
            { name: "(-) Port Costs", values: accumPortCosts, total: lastVal(accumPortCosts), pct: accumCalcPct(accumPortCosts), totalPct: globalCalcTotalPct(lastVal(accumPortCosts), lastVal(accumRevenues)), isCurrency: true, isTotal: false },
            { name: "(-) Dockage", values: accumDockageCosts, total: lastVal(accumDockageCosts), pct: accumCalcPct(accumDockageCosts), totalPct: globalCalcTotalPct(lastVal(accumDockageCosts), lastVal(accumRevenues)), isCurrency: true, isTotal: false },
            { name: "(-) Arriendo de Naves", values: accumCharterHire, total: lastVal(accumCharterHire), pct: accumCalcPct(accumCharterHire), totalPct: globalCalcTotalPct(lastVal(accumCharterHire), lastVal(accumRevenues)), isCurrency: true, isTotal: false },
            { name: "(=) VOYAGE RESULT / P&L", values: accumPlVsRequired, total: lastVal(accumPlVsRequired), pct: accumCalcPct(accumPlVsRequired), totalPct: globalCalcTotalPct(lastVal(accumPlVsRequired), lastVal(accumRevenues)), isCurrency: true, isTotal: true }
        ];

        if (showAccumulatedTotal) {
            const visibleAccumMetrics = isGlobalAcumCollapsed ? [accumMetrics[0]] : accumMetrics;
            const accumTotalSubRowsCount = (!isGlobalAcumCollapsed && isExpandedGlobalAcumGross) ? 5 : 0;
            const totalAccumRows = visibleAccumMetrics.length + accumTotalSubRowsCount;
            const accumRouteRowSpanRef = { value: totalAccumRows };

            visibleAccumMetrics.forEach((metric, index) => {
                const isExpandableRow = index === 0;
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

                if (metric.isExpandableGrossRevenue && isExpandedGlobalAcumGross) {
                    // 1.1 Freight
                    result.push({
                        col1: null, col2: null, col3: null,
                        clientName: "TOTAL ACUMULADO", routeName: "", vesselName: "",
                        metric: {
                            name: "↳ (+) Freight Revenue",
                            values: accumFreight,
                            total: lastVal(accumFreight),
                            pct: accumCalcPct(accumFreight),
                            totalPct: globalCalcTotalPct(lastVal(accumFreight), lastVal(accumRevenues)),
                            isCurrency: true,
                            isTotal: false,
                            isSubRowMetric: true
                        },
                        isSubRow: true,
                        isGlobalTotal: true
                    });
                    // 1.2 Demurrage
                    result.push({
                        col1: null, col2: null, col3: null,
                        clientName: "TOTAL ACUMULADO", routeName: "", vesselName: "",
                        metric: {
                            name: "↳ (+) Demurrage",
                            values: accumDemurrage,
                            total: lastVal(accumDemurrage),
                            pct: accumCalcPct(accumDemurrage),
                            totalPct: globalCalcTotalPct(lastVal(accumDemurrage), lastVal(accumRevenues)),
                            isCurrency: true,
                            isTotal: false,
                            isSubRowMetric: true
                        },
                        isSubRow: true,
                        isGlobalTotal: true
                    });
                    // 1.3 Dockage
                    result.push({
                        col1: null, col2: null, col3: null,
                        clientName: "TOTAL ACUMULADO", routeName: "", vesselName: "",
                        metric: {
                            name: "↳ (+) Dockage Revenue",
                            values: accumDockageCosts,
                            total: lastVal(accumDockageCosts),
                            pct: accumCalcPct(accumDockageCosts),
                            totalPct: globalCalcTotalPct(lastVal(accumDockageCosts), lastVal(accumRevenues)),
                            isCurrency: true,
                            isTotal: false,
                            isSubRowMetric: true
                        },
                        isSubRow: true,
                        isGlobalTotal: true
                    });
                    // 1.4 Gross
                    result.push({
                        col1: null, col2: null, col3: null,
                        clientName: "TOTAL ACUMULADO", routeName: "", vesselName: "",
                        metric: {
                            name: "↳ (=) Gross Revenue",
                            values: accumGross,
                            total: lastVal(accumGross),
                            pct: accumGross.map(r => r ? 100 : 0),
                            totalPct: lastVal(accumGross) ? 100 : 0,
                            isCurrency: true,
                            isTotal: false,
                            isSubRowMetric: true
                        },
                        isSubRow: true,
                        isGlobalTotal: true
                    });
                    // 1.5 Comisiones
                    result.push({
                        col1: null, col2: null, col3: null,
                        clientName: "TOTAL ACUMULADO", routeName: "", vesselName: "",
                        metric: {
                            name: "↳ (-) Comisiones",
                            values: accumCommissions,
                            total: lastVal(accumCommissions),
                            pct: accumCalcPct(accumCommissions),
                            totalPct: globalCalcTotalPct(lastVal(accumCommissions), lastVal(accumRevenues)),
                            isCurrency: true,
                            isTotal: false,
                            isSubRowMetric: true
                        },
                        isSubRow: true,
                        isGlobalTotal: true
                    });
                }
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

    if (!data || !data.aggregated_data || projectionLines.length === 0 || rows.length === 0) {
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
                        {activeDimensions.map((dim, idx) => (
                            <th key={dim} className="py-1 px-1 border border-slate-700 w-12 bg-slate-800 text-center font-bold text-[10px] tracking-normal">
                                <div className="flex items-center justify-center gap-0.5 min-w-[46px]">
                                    {activeDimensions.length > 1 && idx > 0 && (
                                        <button 
                                            onClick={() => handleGroupOrderSwap(idx, idx - 1)} 
                                            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-700 flex items-center justify-center"
                                            title="Mover a la izquierda"
                                        >
                                            <ChevronLeft size={12} />
                                        </button>
                                    )}
                                    <span className="truncate">{getColumnHeaderLabel(dim)}</span>
                                    {activeDimensions.length > 1 && idx < activeDimensions.length - 1 && (
                                        <button 
                                            onClick={() => handleGroupOrderSwap(idx, idx + 1)} 
                                            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-700 flex items-center justify-center"
                                            title="Mover a la derecha"
                                        >
                                            <ChevronRight size={12} />
                                        </button>
                                    )}
                                </div>
                            </th>
                        ))}
                        <th className="py-1 px-2 border border-slate-700 bg-slate-800 text-center font-bold text-xs tracking-wider w-36 min-w-[120px]">Métrica</th>
                        {months.filter(m => !hiddenMonths.includes(m)).map((m, idx) => (
                            <th key={idx} className="py-1 px-2 border border-slate-700 bg-slate-800 text-center font-extrabold text-xs tracking-wider min-w-[60px] w-16">{m}</th>
                        ))}
                        <th className="py-1 px-2 border border-sky-800 bg-sky-900 text-sky-100 text-center font-black text-[11px] tracking-wider min-w-[70px] w-20 shadow-2xs">TOTAL ACUM</th>
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
                                <td rowSpan={row.col1.rowSpanRef ? row.col1.rowSpanRef.value : row.col1.rowSpan} colSpan={row.isGlobalTotal ? activeDimensions.length : 1}
                                    onContextMenu={(e) => { 
                                        if (row.col1.type) {
                                            e.preventDefault(); 
                                            setContextMenu({ x: e.clientX, y: e.clientY, type: row.col1.type, client: row.clientName, route: row.routeName, vessel: row.vesselName, rowKey: row.metric.rowKey }); 
                                        }
                                    }}
                                    className={`p-0 border border-slate-200 align-middle ${row.col1.color || getCellColor(row.col1.type, row.col1.name)} relative group cursor-context-menu`}>
                                    {!row.isGlobalTotal && row.col1.type && (
                                    <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleMove(row.col1.type, row.clientName, row.routeName, row.vesselName, 'up'); }} className="text-slate-300 hover:text-white cursor-pointer"><ChevronUp size={14} /></button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleMove(row.col1.type, row.clientName, row.routeName, row.vesselName, 'down'); }} className="text-slate-300 hover:text-white cursor-pointer"><ChevronDown size={14} /></button>
                                    </div>
                                    )}
                                    {row.col1.type === 'vessel' && !row.isGlobalTotal ? (
                                        <div className="w-full h-full flex items-center justify-center relative min-h-[60px] p-0.5">
                                            <div className="vertical-text mx-auto px-2 pointer-events-none text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center">
                                                {row.col1.name}
                                            </div>
                                            <select
                                                value={row.col1.name}
                                                onChange={(e) => handleVesselChange(row.clientName, row.routeName, row.col1.name, e.target.value)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                title="Cambiar Buque"
                                                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                                            >
                                                {vesselsList.map(v => (
                                                    <option key={v.vessel_id} value={v.vessel_id} className="bg-slate-800 text-white text-xs">
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
                            {row.col2 && activeDimensions[1] && (
                                <td rowSpan={row.col2.rowSpanRef ? row.col2.rowSpanRef.value : row.col2.rowSpan} 
                                    onContextMenu={(e) => { 
                                        if (!row.col2.isSubtotal && row.col2.type) { 
                                            e.preventDefault(); 
                                            setContextMenu({ x: e.clientX, y: e.clientY, type: row.col2.type, client: row.clientName, route: row.routeName, vessel: row.vesselName, rowKey: row.metric.rowKey }); 
                                        } 
                                    }}
                                    className={`p-0 border border-slate-200 align-middle relative group ${row.col2.isSubtotal ? 'bg-slate-800 text-amber-400 font-bold' : getCellColor(row.col2.type, row.col2.name) + ' cursor-context-menu'}`}>
                                    {!row.col2.isSubtotal && row.col2.type && (
                                        <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleMove(row.col2.type, row.clientName, row.routeName, row.vesselName, 'up'); }} className="text-slate-300 hover:text-white cursor-pointer"><ChevronUp size={14} /></button>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleMove(row.col2.type, row.clientName, row.routeName, row.vesselName, 'down'); }} className="text-slate-300 hover:text-white cursor-pointer"><ChevronDown size={14} /></button>
                                        </div>
                                    )}
                                    <div className="vertical-text mx-auto px-2">{row.col2.name}</div>
                                </td>
                            )}
                            {row.col3 && activeDimensions[2] && (
                                <td rowSpan={row.col3.rowSpanRef ? row.col3.rowSpanRef.value : row.col3.rowSpan} 
                                    onContextMenu={(e) => { 
                                        if (!row.col3.isSubtotal && row.col3.type) { 
                                            e.preventDefault(); 
                                            setContextMenu({ x: e.clientX, y: e.clientY, type: row.col3.type, client: row.clientName, route: row.routeName, vessel: row.vesselName, rowKey: row.metric.rowKey }); 
                                        } 
                                    }}
                                    className={`p-0 border border-slate-200 align-middle relative group ${row.col3.isSubtotal ? 'bg-slate-800 text-amber-400 font-bold' : getCellColor(row.col3.type, row.col3.name) + ' cursor-context-menu'}`}>
                                    {!row.col3.isSubtotal && row.col3.type && (
                                        <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleMove(row.col3.type, row.clientName, row.routeName, row.vesselName, 'up'); }} className="text-slate-300 hover:text-white cursor-pointer"><ChevronUp size={14} /></button>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleMove(row.col3.type, row.clientName, row.routeName, row.vesselName, 'down'); }} className="text-slate-300 hover:text-white cursor-pointer"><ChevronDown size={14} /></button>
                                        </div>
                                    )}
                                    {row.col3.type === 'vessel' && !row.col3.isSubtotal ? (
                                        <div className="w-full h-full flex items-center justify-center relative min-h-[60px] p-0.5">
                                            <div className="vertical-text mx-auto px-2 pointer-events-none text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center">
                                                {row.col3.name}
                                            </div>
                                            <select
                                                value={row.col3.name}
                                                onChange={(e) => handleVesselChange(row.clientName, row.routeName, row.col3.name, e.target.value)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                title="Cambiar Buque"
                                                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                                            >
                                                {vesselsList.map(v => (
                                                    <option key={v.vessel_id} value={v.vessel_id} className="bg-slate-800 text-white text-xs">
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
                                        ) : (row.metric.isFrequencyEditable || row.metric.name === "Viajes (freq)") && !row.isClientSubtotal && !row.isGlobalTotal ? (
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={v !== null && v !== undefined ? v : ''} 
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
                                                        <span className="font-semibold text-slate-700 font-mono">
                                                            {row.metric.pct[origColIdx].toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="font-bold font-mono">
                                                            {(row.metric.name.includes("Flete") || row.metric.name.includes("Yield") || row.metric.name.includes("Tarifa")) ? formatYield(v) : formatCurrency(v)}
                                                        </span>
                                                    )}
                                                </div>
                                             ) : row.metric.isPct ? (
                                                 <span className="font-semibold text-slate-700 font-mono">{v != null && v !== 0 ? `${Number(v).toFixed(1)}%` : '-'}</span>
                                             ) : (
                                                 <span className="font-semibold text-slate-700 font-mono">{formatNumber(v)}</span>
                                             )
                                        )
                                    )}
                                </td>
                                );
                            })}
                            <td className={`py-1.5 px-2 text-right tabular-nums font-black font-mono text-xs border border-slate-200 border-l-2 border-l-sky-300 ${row.metric.isTotal ? 'bg-sky-100/90 text-sky-950 shadow-2xs' : 'bg-sky-50/80 text-sky-900'} ${row.isSubRow ? 'text-slate-600' : ''} ${row.metric.isCategoryHeader ? 'bg-slate-100/50' : ''}`}>
                                {row.metric.isCategoryHeader ? '' : (() => {
                                    // Sub-filas editables de parámetros (días o %) no totalizan horizontalmente
                                    if (row.metric.isDemurragePctEditable || row.metric.isDemurrageDaysEditable) {
                                        return '-';
                                    }

                                    // Recalculate total using only visible months
                                    const visibleIndices = months
                                        .map((m, i) => ({ m, i }))
                                        .filter(({ m }) => !hiddenMonths.includes(m))
                                        .map(({ i }) => i);
                                    const isYieldMetric = row.metric.name.includes("Flete") || row.metric.name.includes("Yield") || row.metric.name.includes("Tarifa");
                                    const isTceRateMetric = row.metric.isExpandableTce || row.metric.isTceDay || row.metric.isTceDiff || row.metric.name.includes("Métricas TCE") || (row.metric.name.includes("TCE") && row.metric.name.includes("$/d"));
                                    const visibleValues = visibleIndices.map(i => row.metric.values[i] ?? 0).filter(v => v !== null && !isNaN(v));
                                    const isAccumMetric = row.metric.globalType === 'accum' || row.clientName === 'TOTAL ACUMULADO';
                                    const visibleTotal = isTceRateMetric
                                        ? 0
                                        : isAccumMetric
                                            ? (visibleValues.length > 0 ? visibleValues[visibleValues.length - 1] : 0)
                                            : isYieldMetric
                                                ? (visibleValues.length > 0 ? visibleValues.reduce((a, b) => a + b, 0) / visibleValues.length : 0)
                                                : visibleValues.reduce((a, b) => a + b, 0);

                                    if (row.metric.isSubRowMetric && !row.metric.isCurrency && !row.metric.isPct && !row.metric.isTotal) {
                                        if (row.metric.name.includes("Tarifa") || row.metric.name.includes("Precio")) {
                                            return formatYield(visibleTotal);
                                        }
                                        if (visibleTotal === 0 && row.metric.total === 0) return '-';
                                    }

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
                                    ) : row.metric.isPct ? (
                                        <span className="font-semibold text-slate-700 font-mono">
                                            {row.metric.totalPct !== null && row.metric.totalPct !== undefined ? `${Number(row.metric.totalPct).toFixed(1)}%` : '-'}
                                        </span>
                                    ) : (
                                        <span className="font-bold">{formatNumber(visibleTotal)}</span>
                                    );
                                })()}
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
