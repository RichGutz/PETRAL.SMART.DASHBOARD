import React, { useMemo, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useForecastContext_V2 } from '../../../context/ForecastContext_V2';
import { ForecastService } from '../../../services/api';
import '../ForecastGrid.css';

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

interface FinancialMatrixNavitransoGridTableProps {
    data: any;
    months: string[];
    projectionLines?: any[];
}

export const FinancialMatrixNavitransoGridTable: React.FC<FinancialMatrixNavitransoGridTableProps> = ({
    data,
    months = [],
    projectionLines = []
}) => {
    const { 
        hiddenClients = [], 
        hiddenRoutes = [], 
        hiddenVessels = [], 
        hiddenMonths = [], 
        showSubtotals = true, 
        showAccumulatedTotal = true, 
        setProjectionLines = (() => {}),
        hideNaRows = false,
        handleFrequencyChange: onFrequencyChange,
        handleDeleteNode: onDeleteNode
    } = useForecastContext_V2() || {};

    const [expandedHire, setExpandedHire] = useState<Record<string, boolean>>({});
    const [expandedDemurrage, setExpandedDemurrage] = useState<Record<string, boolean>>({});
    const [expandedBunker, setExpandedBunker] = useState<Record<string, boolean>>({});
    const [expandedPortCosts, setExpandedPortCosts] = useState<Record<string, boolean>>({});

    const [groupOrder, setGroupOrder] = useState<('client' | 'route' | 'vessel')[]>(['client', 'route', 'vessel']);
    const [vesselsList, setVesselsList] = useState<any[]>([]);

    useEffect(() => {
        ForecastService.getVessels().then(vList => {
            setVesselsList(vList || []);
        }).catch(err => console.error("Error loading vessels in NavitransoGrid:", err));
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

    // Sort orders & Context Menu
    const [clientOrder, setClientOrder] = useState<string[]>([]);
    const [routeOrder, setRouteOrder] = useState<Record<string, string[]>>({});
    const [vesselOrder, setVesselOrder] = useState<Record<string, string[]>>({});
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'client'|'route'|'vessel', client?: string, route?: string, vessel?: string } | null>(null);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const handleMove = (type: 'client' | 'route' | 'vessel', client?: string, route?: string, vessel?: string, dir?: 'up' | 'down') => {
        if (!dir) return;
        if (type === 'client') {
            const currentOrder = clientOrder.length > 0 ? [...clientOrder] : Object.keys(data.aggregated_data);
            const idx = currentOrder.indexOf(client!);
            if (idx === -1) return;
            const newIdx = dir === 'up' ? Math.max(0, idx - 1) : Math.min(currentOrder.length - 1, idx + 1);
            if (idx === newIdx) return;
            [currentOrder[idx], currentOrder[newIdx]] = [currentOrder[newIdx], currentOrder[idx]];
            setClientOrder(currentOrder);
        } else if (type === 'route') {
            const currentOrder = routeOrder[client!] && routeOrder[client!].length > 0 ? [...routeOrder[client!]] : Object.keys(data.aggregated_data[client!]);
            const idx = currentOrder.indexOf(route!);
            if (idx === -1) return;
            const newIdx = dir === 'up' ? Math.max(0, idx - 1) : Math.min(currentOrder.length - 1, idx + 1);
            if (idx === newIdx) return;
            [currentOrder[idx], currentOrder[newIdx]] = [currentOrder[newIdx], currentOrder[idx]];
            setRouteOrder(prev => ({ ...prev, [client!]: currentOrder }));
        } else if (type === 'vessel') {
            const routeKey = `${client}-${route}`;
            const currentOrder = vesselOrder[routeKey] && vesselOrder[routeKey].length > 0 ? [...vesselOrder[routeKey]] : Object.keys(data.aggregated_data[client!][route!]);
            const idx = currentOrder.indexOf(vessel!);
            if (idx === -1) return;
            const newIdx = dir === 'up' ? Math.max(0, idx - 1) : Math.min(currentOrder.length - 1, idx + 1);
            if (idx === newIdx) return;
            [currentOrder[idx], currentOrder[newIdx]] = [currentOrder[newIdx], currentOrder[idx]];
            setVesselOrder(prev => ({ ...prev, [routeKey]: currentOrder }));
        }
    };

    const rows = useMemo(() => {
        if (!data || !data.aggregated_data || !months || !Array.isArray(months) || months.length === 0) return [];
        
        const result: any[] = [];
        const sum = (arr: number[]) => arr.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);

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

        // Totales globales para el acumulado de flota
        const globalHire = new Array(months.length).fill(0);
        const globalVentaTerc = new Array(months.length).fill(0);
        const globalDemRev = new Array(months.length).fill(0);
        const globalIngPto = new Array(months.length).fill(0);
        const globalOtrosIng = new Array(months.length).fill(0);
        const globalVentas = new Array(months.length).fill(0);

        const globalCombustible = new Array(months.length).fill(0);
        const globalGastosPuerto = new Array(months.length).fill(0);
        const globalCostosDemora = new Array(months.length).fill(0);
        const globalComisiones = new Array(months.length).fill(0);
        const globalOtrosCostos = new Array(months.length).fill(0);
        const globalCostosDirectos = new Array(months.length).fill(0);

        const globalTce = new Array(months.length).fill(0);
        const globalArriendo = new Array(months.length).fill(0);
        const globalMargenBruto = new Array(months.length).fill(0);

        const level1List = sortKeys(Object.keys(regroupedTree), groupOrder[0]);

        level1List.forEach((level1Name) => {
            const level2Data = regroupedTree[level1Name];
            const level1RowSpanRef = { value: 0 };
            let isFirstLevel1Row = true;

            const level1Hire = new Array(months.length).fill(0);
            const level1VentaTerc = new Array(months.length).fill(0);
            const level1DemRev = new Array(months.length).fill(0);
            const level1IngPto = new Array(months.length).fill(0);
            const level1OtrosIng = new Array(months.length).fill(0);
            const level1Ventas = new Array(months.length).fill(0);

            const level1Combustible = new Array(months.length).fill(0);
            const level1GastosPuerto = new Array(months.length).fill(0);
            const level1CostosDemora = new Array(months.length).fill(0);
            const level1Comisiones = new Array(months.length).fill(0);
            const level1OtrosCostos = new Array(months.length).fill(0);
            const level1CostosDirectos = new Array(months.length).fill(0);

            const level1Tce = new Array(months.length).fill(0);
            const level1Arriendo = new Array(months.length).fill(0);
            const level1MargenBruto = new Array(months.length).fill(0);

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

                    const trips = months.map(m => {
                        const line = projectionLines.find(p => 
                            p.client_id === client && 
                            `${p.origin_port_id}-${p.destination_port_id}` === route && 
                            p.vessel_id === vessel && 
                            p.month_index === m
                        );
                        return line ? (line.monthly_frequency || 0) : (monthData[m]?.freq !== undefined ? monthData[m]?.freq : 1);
                    });

                    // 1. VENTAS
                    const hire = months.map((m, i) => {
                        const mD = monthData[m] || {};
                        const freq = trips[i] || 0;
                        if (freq <= 0) return 0;
                        return (Number(mD.gross_income || mD.hire || mD.freight_revenue) || (Number(mD.carga_unit || 13500) * Number(mD.flete_unit || 30) * freq));
                    });
                    const ventaTerc = new Array(months.length).fill(0);
                    const demRev = months.map((m, i) => {
                        const mD = monthData[m] || {};
                        const freq = trips[i] || 0;
                        if (freq <= 0) return 0;
                        return Number(mD.demurrage_revenue || mD.demurrage_income || mD.demurrage || 0) * freq;
                    });
                    const ingPto = months.map((m, i) => {
                        const mD = monthData[m] || {};
                        const freq = trips[i] || 0;
                        if (freq <= 0) return 0;
                        return Number(mD.refacturacion_muellaje || mD.dockage_revenue || mD.port_rebate_income || (Number(mD.total_port_costs || mD.port_costs || 0) * 0.10)) * (mD.total_port_costs_unit ? freq : 1);
                    });
                    const otrosIng = new Array(months.length).fill(0);

                    const subtotalVentas = months.map((_, i) => hire[i] + ventaTerc[i] + demRev[i] + ingPto[i] + otrosIng[i]);

                    // 2. COSTOS DIRECTOS
                    const combustible = months.map((m, i) => {
                        const mD = monthData[m] || {};
                        const freq = trips[i] || 0;
                        if (freq <= 0) return 0;
                        const val = Number(mD.total_bunker_costs || mD.bunker_costs || mD.bunker_cost || 0);
                        return -val * (mD.total_bunker_costs_unit ? freq : (val > 50000 && freq === 1 ? 1 : freq));
                    });
                    const gastosPuerto = months.map((m, i) => {
                        const mD = monthData[m] || {};
                        const freq = trips[i] || 0;
                        if (freq <= 0) return 0;
                        const val = Number(mD.total_port_costs || mD.port_costs || mD.costos_puerto_total || 0);
                        return -val * (mD.total_port_costs_unit ? freq : (val > 30000 && freq === 1 ? 1 : freq));
                    });
                    const costosDemora = months.map((m, i) => {
                        const mD = monthData[m] || {};
                        const freq = trips[i] || 0;
                        if (freq <= 0) return 0;
                        return -Number(mD.demurrage_hire_cost || mD.costos_demora || mD.demurrage_cost || 0) * freq;
                    });
                    const comisiones = months.map((m, i) => {
                        const mD = monthData[m] || {};
                        const freq = trips[i] || 0;
                        if (freq <= 0) return 0;
                        return -Number(mD.commissions_cost || mD.total_commissions || 0) * freq;
                    });
                    const otrosCostos = new Array(months.length).fill(0);

                    const subtotalCostosDirectos = months.map((_, i) => combustible[i] + gastosPuerto[i] + costosDemora[i] + comisiones[i] + otrosCostos[i]);

                    // 3. TIME CHARTER EQUIVALENT & MARGEN BRUTO
                    const tce = months.map((_, i) => subtotalVentas[i] + subtotalCostosDirectos[i]);
                    const arriendo = months.map((m, i) => {
                        const mD = monthData[m] || {};
                        const freq = trips[i] || 0;
                        if (freq <= 0) return 0;
                        return -Number(mD.charter_hire || mD.charter_hire_cost || 0) * freq;
                    });
                    const margenBruto = months.map((_, i) => tce[i] + arriendo[i]);

                    // Acumulaciones de niveles
                    hire.forEach((v, i) => { level1Hire[i] += v; globalHire[i] += v; });
                    ventaTerc.forEach((v, i) => { level1VentaTerc[i] += v; globalVentaTerc[i] += v; });
                    demRev.forEach((v, i) => { level1DemRev[i] += v; globalDemRev[i] += v; });
                    ingPto.forEach((v, i) => { level1IngPto[i] += v; globalIngPto[i] += v; });
                    otrosIng.forEach((v, i) => { level1OtrosIng[i] += v; globalOtrosIng[i] += v; });
                    subtotalVentas.forEach((v, i) => { level1Ventas[i] += v; globalVentas[i] += v; });

                    combustible.forEach((v, i) => { level1Combustible[i] += v; globalCombustible[i] += v; });
                    gastosPuerto.forEach((v, i) => { level1GastosPuerto[i] += v; globalGastosPuerto[i] += v; });
                    costosDemora.forEach((v, i) => { level1CostosDemora[i] += v; globalCostosDemora[i] += v; });
                    comisiones.forEach((v, i) => { level1Comisiones[i] += v; globalComisiones[i] += v; });
                    otrosCostos.forEach((v, i) => { level1OtrosCostos[i] += v; globalOtrosCostos[i] += v; });
                    subtotalCostosDirectos.forEach((v, i) => { level1CostosDirectos[i] += v; globalCostosDirectos[i] += v; });

                    tce.forEach((v, i) => { level1Tce[i] += v; globalTce[i] += v; });
                    arriendo.forEach((v, i) => { level1Arriendo[i] += v; globalArriendo[i] += v; });
                    margenBruto.forEach((v, i) => { level1MargenBruto[i] += v; globalMargenBruto[i] += v; });

                    // Construir array de métricas del nodo en formato Navitranso
                    const isExpHire = !!expandedHire[rowKey];
                    const isExpDem = !!expandedDemurrage[rowKey];
                    const isExpBunk = !!expandedBunker[rowKey];
                    const isExpPort = !!expandedPortCosts[rowKey];

                    const nodeMetrics: any[] = [];

                    // Fila 0: Frecuencia
                    nodeMetrics.push({
                        name: "Viajes (freq)",
                        values: trips,
                        total: sum(trips),
                        isCurrency: false,
                        isTotal: false,
                        isFrequencyEditable: true,
                        client, route, vessel,
                        rowKey
                    });

                    // Bloque 1: VENTAS
                    nodeMetrics.push({
                        name: "VENTAS",
                        values: subtotalVentas,
                        total: sum(subtotalVentas),
                        isCurrency: true,
                        isTotal: false,
                        isNavSubtotal: 'ventas'
                    });

                    nodeMetrics.push({
                        name: "  HIRE",
                        values: hire,
                        total: sum(hire),
                        isCurrency: true,
                        isTotal: false,
                        isExpandableNav: true,
                        navExpandKey: 'hire',
                        rowKey,
                        isExpanded: isExpHire
                    });
                    if (isExpHire) {
                        nodeMetrics.push({
                            name: "  ↳ Base Flete (TM x Tarifa)",
                            values: months.map((m, i) => (trips[i] > 0 ? (monthData[m]?.carga_unit || 13500) * trips[i] : 0)),
                            total: sum(months.map((m, i) => (trips[i] > 0 ? (monthData[m]?.carga_unit || 13500) * trips[i] : 0))),
                            isCurrency: false,
                            isSubRowMetric: true
                        });
                    }

                    if (!hideNaRows) {
                        nodeMetrics.push({
                            name: "  VENTA DE TERCEROS",
                            values: ventaTerc,
                            total: 0,
                            isCurrency: true,
                            isNaRow: true
                        });
                    }

                    nodeMetrics.push({
                        name: "  DEMORAS",
                        values: demRev,
                        total: sum(demRev),
                        isCurrency: true,
                        isTotal: false,
                        isExpandableNav: true,
                        navExpandKey: 'demurrage',
                        rowKey,
                        isExpanded: isExpDem
                    });
                    if (isExpDem) {
                        nodeMetrics.push({
                            name: "  ↳ Demurrage Revenue (Días x Rate)",
                            values: demRev,
                            total: sum(demRev),
                            isCurrency: true,
                            isSubRowMetric: true
                        });
                    }

                    nodeMetrics.push({
                        name: "  INGRESOS DE PUERTO",
                        values: ingPto,
                        total: sum(ingPto),
                        isCurrency: true,
                        isTotal: false
                    });

                    if (!hideNaRows) {
                        nodeMetrics.push({
                            name: "  OTROS INGRESOS",
                            values: otrosIng,
                            total: 0,
                            isCurrency: true,
                            isNaRow: true
                        });
                    }

                    // Bloque 2: COSTOS DIRECTOS
                    nodeMetrics.push({
                        name: "COSTOS DIRECTOS",
                        values: subtotalCostosDirectos,
                        total: sum(subtotalCostosDirectos),
                        isCurrency: true,
                        isTotal: false,
                        isNavSubtotal: 'costos'
                    });

                    nodeMetrics.push({
                        name: "  COMBUSTIBLE",
                        values: combustible,
                        total: sum(combustible),
                        isCurrency: true,
                        isTotal: false,
                        isExpandableNav: true,
                        navExpandKey: 'bunker',
                        rowKey,
                        isExpanded: isExpBunk
                    });
                    if (isExpBunk) {
                        nodeMetrics.push({
                            name: "  ↳ Búnker Mar (Navegación)",
                            values: combustible.map(v => v * 0.75),
                            total: sum(combustible) * 0.75,
                            isCurrency: true,
                            isSubRowMetric: true
                        });
                        nodeMetrics.push({
                            name: "  ↳ Búnker Puerto (Operación)",
                            values: combustible.map(v => v * 0.25),
                            total: sum(combustible) * 0.25,
                            isCurrency: true,
                            isSubRowMetric: true
                        });
                    }

                    nodeMetrics.push({
                        name: "  GASTOS DE PUERTO",
                        values: gastosPuerto,
                        total: sum(gastosPuerto),
                        isCurrency: true,
                        isTotal: false,
                        isExpandableNav: true,
                        navExpandKey: 'port',
                        rowKey,
                        isExpanded: isExpPort
                    });
                    if (isExpPort) {
                        nodeMetrics.push({
                            name: "  ↳ Agenciamiento POL + POD",
                            values: gastosPuerto,
                            total: sum(gastosPuerto),
                            isCurrency: true,
                            isSubRowMetric: true
                        });
                    }

                    nodeMetrics.push({
                        name: "  COSTOS DE DEMORA",
                        values: costosDemora,
                        total: sum(costosDemora),
                        isCurrency: true,
                        isTotal: false
                    });

                    nodeMetrics.push({
                        name: "  COMISIONES VARIAS",
                        values: comisiones,
                        total: sum(comisiones),
                        isCurrency: true,
                        isTotal: false
                    });

                    if (!hideNaRows) {
                        nodeMetrics.push({
                            name: "  OTROS COSTOS DIRECTOS",
                            values: otrosCostos,
                            total: 0,
                            isCurrency: true,
                            isNaRow: true
                        });
                    }

                    // Bloque 3: TIME CHARTER EQUIVALENT
                    nodeMetrics.push({
                        name: "TIME CHARTER EQUIVALENT",
                        values: tce,
                        total: sum(tce),
                        isCurrency: true,
                        isTotal: false,
                        isNavSubtotal: 'tce'
                    });

                    nodeMetrics.push({
                        name: "  COSTO DE ARRIENDO NAVES",
                        values: arriendo,
                        total: sum(arriendo),
                        isCurrency: true,
                        isTotal: false
                    });

                    // Bloque 4: MARGEN BRUTO
                    nodeMetrics.push({
                        name: "MARGEN BRUTO",
                        values: margenBruto,
                        total: sum(margenBruto),
                        isCurrency: true,
                        isTotal: true,
                        isNavSubtotal: 'margenBruto'
                    });

                    const vesselRowSpan = nodeMetrics.length;
                    level1RowSpanRef.value += vesselRowSpan;
                    level2RowSpanRef.value += vesselRowSpan;

                    nodeMetrics.forEach((metric, index) => {
                        result.push({
                            col1: isFirstLevel1Row && isFirstLevel2Row && index === 0 ? { type: groupOrder[0], name: level1Name, rowSpanRef: level1RowSpanRef } : null,
                            col2: isFirstLevel2Row && index === 0 ? { type: groupOrder[1], name: level2Name, rowSpanRef: level2RowSpanRef } : null,
                            col3: index === 0 ? { type: groupOrder[2], name: level3Name, rowSpan: vesselRowSpan } : null,
                            clientName: client,
                            routeName: route,
                            vesselName: vessel,
                            metric: metric,
                            isSubRow: !!metric.isSubRowMetric
                        });
                    });

                    isFirstLevel2Row = false;
                    isFirstLevel1Row = false;
                });
            });

            // Subtotal por cliente con Desglose Completo NAVITRANSO
            if (showSubtotals) {
                const subMetrics: any[] = [
                    // 1. VENTAS
                    { name: "VENTAS", values: level1Ventas, total: sum(level1Ventas), isCurrency: true, isTotal: false, isNavSubtotal: 'ventas' },
                    { name: "  HIRE", values: level1Hire, total: sum(level1Hire), isCurrency: true, isTotal: false },
                ];

                if (!hideNaRows) {
                    subMetrics.push({ name: "  VENTA DE TERCEROS", values: level1VentaTerc, total: sum(level1VentaTerc), isCurrency: true, isNaRow: true });
                }

                subMetrics.push(
                    { name: "  DEMORAS", values: level1DemRev, total: sum(level1DemRev), isCurrency: true, isTotal: false },
                    { name: "  INGRESOS DE PUERTO", values: level1IngPto, total: sum(level1IngPto), isCurrency: true, isTotal: false }
                );

                if (!hideNaRows) {
                    subMetrics.push({ name: "  OTROS INGRESOS", values: level1OtrosIng, total: sum(level1OtrosIng), isCurrency: true, isNaRow: true });
                }

                // 2. COSTOS DIRECTOS
                subMetrics.push(
                    { name: "COSTOS DIRECTOS", values: level1CostosDirectos, total: sum(level1CostosDirectos), isCurrency: true, isTotal: false, isNavSubtotal: 'costos' },
                    { name: "  COMBUSTIBLE", values: level1Combustible, total: sum(level1Combustible), isCurrency: true, isTotal: false },
                    { name: "  GASTOS DE PUERTO", values: level1GastosPuerto, total: sum(level1GastosPuerto), isCurrency: true, isTotal: false },
                    { name: "  COSTOS DE DEMORA", values: level1CostosDemora, total: sum(level1CostosDemora), isCurrency: true, isTotal: false },
                    { name: "  COMISIONES VARIAS", values: level1Comisiones, total: sum(level1Comisiones), isCurrency: true, isTotal: false }
                );

                if (!hideNaRows) {
                    subMetrics.push({ name: "  OTROS COSTOS DIRECTOS", values: level1OtrosCostos, total: sum(level1OtrosCostos), isCurrency: true, isNaRow: true });
                }

                // 3. TIME CHARTER EQUIVALENT
                subMetrics.push(
                    { name: "TIME CHARTER EQUIVALENT", values: level1Tce, total: sum(level1Tce), isCurrency: true, isTotal: false, isNavSubtotal: 'tce' },
                    { name: "  COSTO DE ARRIENDO NAVES", values: level1Arriendo, total: sum(level1Arriendo), isCurrency: true, isTotal: false }
                );

                // 4. MARGEN BRUTO
                subMetrics.push({
                    name: "MARGEN BRUTO (P&L)",
                    values: level1MargenBruto,
                    total: sum(level1MargenBruto),
                    isCurrency: true,
                    isTotal: true,
                    isNavSubtotal: 'margenBruto'
                });

                level1RowSpanRef.value += subMetrics.length;
                const subtotalRouteRowSpanRef = { value: subMetrics.length };

                subMetrics.forEach((metric, index) => {
                    result.push({
                        col1: null,
                        col2: index === 0 ? { name: "Σ SUBTOTAL", rowSpanRef: subtotalRouteRowSpanRef, isSubtotal: true } : null,
                        col3: index === 0 ? { name: `TOTAL ${level1Name}`, rowSpan: subMetrics.length, isSubtotal: true } : null,
                        clientName: level1Name,
                        routeName: "",
                        vesselName: "",
                        metric: metric,
                        isSubRow: false,
                        isClientSubtotal: true
                    });
                });
            }
        });

        // Bloque Global de Flota Acumulada con Desglose Completo NAVITRANSO
        if (showAccumulatedTotal) {
            const globalMetrics: any[] = [
                // 1. VENTAS
                { name: "VENTAS CONSOLIDADAS", values: globalVentas, total: sum(globalVentas), isCurrency: true, isTotal: false, isNavSubtotal: 'ventas' },
                { name: "  HIRE", values: globalHire, total: sum(globalHire), isCurrency: true, isTotal: false },
            ];

            if (!hideNaRows) {
                globalMetrics.push({ name: "  VENTA DE TERCEROS", values: globalVentaTerc, total: sum(globalVentaTerc), isCurrency: true, isNaRow: true });
            }

            globalMetrics.push(
                { name: "  DEMORAS", values: globalDemRev, total: sum(globalDemRev), isCurrency: true, isTotal: false },
                { name: "  INGRESOS DE PUERTO", values: globalIngPto, total: sum(globalIngPto), isCurrency: true, isTotal: false }
            );

            if (!hideNaRows) {
                globalMetrics.push({ name: "  OTROS INGRESOS", values: globalOtrosIng, total: sum(globalOtrosIng), isCurrency: true, isNaRow: true });
            }

            // 2. COSTOS DIRECTOS
            globalMetrics.push(
                { name: "COSTOS DIRECTOS", values: globalCostosDirectos, total: sum(globalCostosDirectos), isCurrency: true, isTotal: false, isNavSubtotal: 'costos' },
                { name: "  COMBUSTIBLE", values: globalCombustible, total: sum(globalCombustible), isCurrency: true, isTotal: false },
                { name: "  GASTOS DE PUERTO", values: globalGastosPuerto, total: sum(globalGastosPuerto), isCurrency: true, isTotal: false },
                { name: "  COSTOS DE DEMORA", values: globalCostosDemora, total: sum(globalCostosDemora), isCurrency: true, isTotal: false },
                { name: "  COMISIONES VARIAS", values: globalComisiones, total: sum(globalComisiones), isCurrency: true, isTotal: false }
            );

            if (!hideNaRows) {
                globalMetrics.push({ name: "  OTROS COSTOS DIRECTOS", values: globalOtrosCostos, total: sum(globalOtrosCostos), isCurrency: true, isNaRow: true });
            }

            // 3. TIME CHARTER EQUIVALENT
            globalMetrics.push(
                { name: "TIME CHARTER EQUIVALENT", values: globalTce, total: sum(globalTce), isCurrency: true, isTotal: false, isNavSubtotal: 'tce' },
                { name: "  COSTO DE ARRIENDO NAVES", values: globalArriendo, total: sum(globalArriendo), isCurrency: true, isTotal: false }
            );

            // 4. MARGEN BRUTO
            globalMetrics.push({
                name: "MARGEN BRUTO (P&L)",
                values: globalMargenBruto,
                total: sum(globalMargenBruto),
                isCurrency: true,
                isTotal: true,
                isNavSubtotal: 'margenBruto'
            });

            const globalRouteRowSpanRef = { value: globalMetrics.length };

            globalMetrics.forEach((metric, index) => {
                result.push({
                    col1: index === 0 ? { name: "TOTAL FLOTA", rowSpanRef: globalRouteRowSpanRef, isSubtotal: true, color: "bg-slate-800 text-white" } : null,
                    col2: null,
                    col3: null,
                    clientName: "TOTAL FLOTA",
                    routeName: "",
                    vesselName: "",
                    metric: metric,
                    isSubRow: false,
                    isGlobalTotal: true
                });
            });
        }

        return result;
    }, [data, months, projectionLines, groupOrder, clientOrder, routeOrder, vesselOrder, hiddenClients, hiddenRoutes, hiddenVessels, showSubtotals, showAccumulatedTotal, hideNaRows, expandedHire, expandedDemurrage, expandedBunker, expandedPortCosts]);

    const formatCurrency = (val: number | undefined | null) => {
        if (val === 0 || val === undefined || val === null || isNaN(val)) return "-";
        const isNeg = val < 0;
        const absFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(val));
        return isNeg ? `-${absFmt}` : absFmt;
    };

    const formatNumber = (val: number | undefined | null) => {
        if (val === 0 || val === undefined || val === null || isNaN(val)) return "-";
        return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(val);
    };

    const toggleNavExpand = (key: 'hire'|'demurrage'|'bunker'|'port', rowKey: string) => {
        if (key === 'hire') setExpandedHire(p => ({ ...p, [rowKey]: !p[rowKey] }));
        if (key === 'demurrage') setExpandedDemurrage(p => ({ ...p, [rowKey]: !p[rowKey] }));
        if (key === 'bunker') setExpandedBunker(p => ({ ...p, [rowKey]: !p[rowKey] }));
        if (key === 'port') setExpandedPortCosts(p => ({ ...p, [rowKey]: !p[rowKey] }));
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
            <div className="table-container shadow-xs border border-slate-200 rounded-lg overflow-auto max-h-[75vh] bg-white relative">
                <table id="forecast-grid-table" className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-800 text-white uppercase font-semibold text-xs tracking-wider sticky top-0 z-20 shadow-xs">
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
                            <th className="py-1 px-2 border border-slate-700 bg-slate-800 text-center font-bold text-xs tracking-wider w-36 min-w-[120px]">
                                Métrica
                            </th>
                            {months.filter(m => !hiddenMonths.includes(m)).map((m, idx) => (
                                <th key={idx} className="py-1 px-2 border border-slate-700 bg-slate-800 text-center font-extrabold text-xs tracking-wider min-w-[60px] w-16">{m}</th>
                            ))}
                            <th className="py-1 px-2 border border-sky-800 bg-sky-900 text-sky-100 text-center font-black text-[11px] tracking-wider min-w-[70px] w-20 shadow-2xs">TOTAL ACUM</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => {
                            const isVentasSub = row.metric.isNavSubtotal === 'ventas';
                            const isCostosSub = row.metric.isNavSubtotal === 'costos';
                            const isTceSub = row.metric.isNavSubtotal === 'tce';
                            const isMbSub = row.metric.isNavSubtotal === 'margenBruto';

                            let rowStyleClass = 'hover:bg-slate-50';
                            if (row.isSubRow) rowStyleClass = 'bg-slate-50/60 text-xs text-slate-500';
                            if (row.metric.isNaRow) rowStyleClass = 'bg-slate-50/40 text-slate-400 text-xs';
                            if (isVentasSub) rowStyleClass = 'bg-slate-100/90 font-bold text-slate-800 border-t border-slate-300';
                            if (isCostosSub) rowStyleClass = 'bg-slate-100/90 font-bold text-slate-800 border-t border-slate-300';
                            if (isTceSub) rowStyleClass = 'bg-slate-100/90 font-bold text-slate-800 border-t border-slate-300';
                            if (isMbSub) rowStyleClass = 'bg-slate-200/80 font-bold text-slate-900 border-y border-slate-400';
                            if (row.isClientSubtotal) rowStyleClass = 'bg-slate-100 font-bold text-slate-800';
                            if (row.isGlobalTotal) rowStyleClass = 'bg-slate-200 font-black text-slate-900';

                            return (
                                <tr key={i} className={`border border-slate-200 transition-colors ${rowStyleClass} ${row.metric.isTotal ? 'bg-slate-100 font-semibold' : ''}`}>
                                    {row.col1 && (
                                        <td rowSpan={row.col1.rowSpanRef ? row.col1.rowSpanRef.value : row.col1.rowSpan} colSpan={row.isGlobalTotal ? 3 : 1}
                                            onContextMenu={(e) => { 
                                                if (row.col1.type) {
                                                    e.preventDefault(); 
                                                    setContextMenu({ x: e.clientX, y: e.clientY, type: row.col1.type, client: row.clientName, route: row.routeName, vessel: row.vesselName }); 
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
                                                <div className="w-full h-full flex items-center justify-center relative min-h-[60px]">
                                                    <div className="vertical-text mx-auto px-2 pointer-events-none text-white font-extrabold text-xs">
                                                        {row.col1.name}
                                                    </div>
                                                    <select
                                                        value={row.col1.name}
                                                        onChange={(e) => handleVesselChange(row.clientName, row.routeName, row.col1.name, e.target.value)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    >
                                                        {vesselsList.map(v => (
                                                            <option key={v.vessel_id} value={v.vessel_id} className="bg-slate-800 text-white text-xs">
                                                                {v.vessel_id}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <div className={`vertical-text mx-auto px-2 ${row.isGlobalTotal ? 'text-sm tracking-wider transform rotate-0 writing-mode-unset flex items-center justify-center h-full font-bold' : ''}`} style={row.isGlobalTotal ? { writingMode: 'unset', transform: 'none' } : {}}>{row.col1.name}</div>
                                            )}
                                        </td>
                                    )}
                                    {row.col2 && (
                                        <td rowSpan={row.col2.rowSpanRef ? row.col2.rowSpanRef.value : row.col2.rowSpan} 
                                            onContextMenu={(e) => { 
                                                if (!row.col2.isSubtotal && row.col2.type) { 
                                                    e.preventDefault(); 
                                                    setContextMenu({ x: e.clientX, y: e.clientY, type: row.col2.type, client: row.clientName, route: row.routeName, vessel: row.vesselName }); 
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
                                                <div className="w-full h-full flex items-center justify-center relative min-h-[60px]">
                                                    <div className="vertical-text mx-auto px-2 pointer-events-none text-white font-extrabold text-xs">
                                                        {row.col2.name}
                                                    </div>
                                                    <select
                                                        value={row.col2.name}
                                                        onChange={(e) => handleVesselChange(row.clientName, row.routeName, row.col2.name, e.target.value)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    >
                                                        {vesselsList.map(v => (
                                                            <option key={v.vessel_id} value={v.vessel_id} className="bg-slate-800 text-white text-xs">
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
                                        <td rowSpan={row.col3.rowSpan} 
                                            onContextMenu={(e) => { 
                                                if (!row.col3.isSubtotal && row.col3.type) { 
                                                    e.preventDefault(); 
                                                    setContextMenu({ x: e.clientX, y: e.clientY, type: row.col3.type, client: row.clientName, route: row.routeName, vessel: row.vesselName }); 
                                                } 
                                            }}
                                            className={`p-0 border border-slate-200 align-middle relative group ${row.col3.isSubtotal ? 'bg-slate-800 text-amber-400 font-bold' : getCellColor(row.col3.type, row.col3.name) + ' cursor-context-menu'}`}>
                                            {!row.col3.isSubtotal && row.col3.type && (
                                                <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <button onClick={() => handleMove(row.col3.type, row.clientName, row.routeName, row.vesselName, 'up')} className="text-slate-400 hover:text-white"><ChevronUp size={14} /></button>
                                                    <button onClick={() => handleMove(row.col3.type, row.clientName, row.routeName, row.vesselName, 'down')} className="text-slate-400 hover:text-white"><ChevronDown size={14} /></button>
                                                </div>
                                            )}
                                            {row.col3.type === 'vessel' && !row.col3.isSubtotal ? (
                                                <div className="w-full h-full flex items-center justify-center relative min-h-[60px]">
                                                    <div className="vertical-text mx-auto px-2 pointer-events-none text-white font-extrabold text-xs">
                                                        {row.col3.name}
                                                    </div>
                                                    <select
                                                        value={row.col3.name}
                                                        onChange={(e) => handleVesselChange(row.clientName, row.routeName, row.col3.name, e.target.value)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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

                                    {/* Celda de Métrica */}
                                    <td className={`py-1 px-2 border border-slate-200 whitespace-nowrap ${row.isSubRow ? 'text-xs text-slate-500' : 'font-semibold text-slate-800'} ${row.metric.isNavSubtotal ? 'font-bold' : ''}`}>
                                        <div className="flex items-center gap-1.5 justify-between">
                                            <div className="flex items-center gap-1">
                                                {row.metric.isExpandableNav && (
                                                    <button 
                                                        onClick={() => toggleNavExpand(row.metric.navExpandKey, row.metric.rowKey)} 
                                                        className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                                    >
                                                        {row.metric.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </button>
                                                )}
                                                <span>{row.metric.name}</span>
                                            </div>
                                            {row.metric.isNaRow && (
                                                <span className="text-[8.5px] bg-slate-200 text-slate-600 px-1 rounded font-normal">N/A</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Celdas Mensuales */}
                                    {months.filter(m => !hiddenMonths.includes(m)).map((m, idx) => {
                                        const val = row.metric.values ? row.metric.values[idx] : undefined;
                                        return (
                                            <td key={idx} className={`py-1 px-2 border border-slate-200 text-right tabular-nums ${row.isSubRow ? 'text-xs text-slate-500' : val === 0 ? 'text-slate-400' : 'text-slate-800'} ${row.metric.isNavSubtotal ? 'font-bold' : ''}`}>
                                                {row.metric.isFrequencyEditable && onFrequencyChange ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={val !== undefined ? val : 0}
                                                        onChange={(e) => onFrequencyChange(row.clientName, row.routeName, row.vesselName, m, parseInt(e.target.value) || 0)}
                                                        className="w-12 text-center text-xs font-bold border border-slate-200 rounded py-0.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                                                    />
                                                ) : (
                                                    row.metric.isCurrency ? formatCurrency(val) : formatNumber(val)
                                                )}
                                            </td>
                                        );
                                    })}

                                    {/* Celda TOTAL ACUM */}
                                    <td className={`py-1 px-2 border border-slate-200 text-right tabular-nums font-bold bg-slate-100 ${row.metric.isNavSubtotal ? 'font-black bg-slate-200/60' : ''}`}>
                                        {row.metric.isCurrency ? formatCurrency(row.metric.total) : formatNumber(row.metric.total)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Context Menu Clic Derecho */}
            {contextMenu && (
                <div 
                    style={{ top: contextMenu.y, left: contextMenu.x }} 
                    className="fixed bg-white border border-slate-200 shadow-xl rounded-lg py-1 z-50 text-xs w-44 text-slate-700"
                >
                    <button 
                        onClick={() => handleMove(contextMenu.type, contextMenu.client, contextMenu.route, contextMenu.vessel, 'up')} 
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                    >
                        <ChevronUp size={14} /> Mover Arriba
                    </button>
                    <button 
                        onClick={() => handleMove(contextMenu.type, contextMenu.client, contextMenu.route, contextMenu.vessel, 'down')} 
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                    >
                        <ChevronDown size={14} /> Mover Abajo
                    </button>
                    {onDeleteNode && (
                        <>
                            <div className="h-px bg-slate-200 my-1"></div>
                            <button 
                                onClick={() => onDeleteNode(contextMenu.type, contextMenu.client!, contextMenu.route, contextMenu.vessel)} 
                                className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Eliminar {getColumnHeaderLabel(contextMenu.type)}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
