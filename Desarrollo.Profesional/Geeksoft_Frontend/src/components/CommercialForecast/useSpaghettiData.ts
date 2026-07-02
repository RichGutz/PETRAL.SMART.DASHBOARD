import { useMemo } from 'react';

export interface Port {
    port_id: string;
    port_name: string;
    country: string;
    lat: number | null;
    lon: number | null;
    capacity_mt: number | null;
    type: string | null;
}

export interface SpaghettiEdge {
    source: string;
    target: string;
    value: number;
    vessel: string;
    lineStyle: {
        width: number;
        color: string;
        curveness: number;
    };
    label?: {
        show: boolean;
        formatter: string;
    };
}

export interface SpaghettiNode {
    id: string;
    name: string;
    value: [number, number];
    carga: number;
    descarga: number;
    capacity_mt: number;
    type: string;
    symbolSize: number;
}

// Colores de barcos según Manual.Estilos.md
const getVesselColor = (vesselName: string): string => {
    const name = vesselName.toUpperCase();
    if (name.includes('TABLONES')) return '#DC2626'; // Rojo
    if (name.includes('MOQUEGUA')) return '#16A34A'; // Verde
    if (name.includes('CONCON') || name.includes('TRADER')) return '#475569'; // Gris
    if (name.includes('HUEMUL')) return '#4F46E5'; // Índigo / Azul
    return '#94A3B8'; // Fallback Slate
};

// Reglas de curvatura del usuario para evitar solapamientos
const getBaseCurveness = (origin: string, dest: string): number => {
    const pair = `${origin}-${dest}`;
    const reverse = `${dest}-${origin}`;

    // 1. Cabotaje Norte/Centro (menor curvatura a rutas más cortas)
    if (pair === 'ILO-MATARANI' || reverse === 'ILO-MATARANI') return 0.10; // Muy corta, pegada a la costa
    if (pair === 'ILO-MARCONA' || reverse === 'ILO-MARCONA') return 0.22; // Curvada exterior
    if (pair === 'ILO-CALLAO' || reverse === 'ILO-CALLAO') return 0.35; // Ruta larga, curva amplia

    if (pair === 'CALLAO-MARCONA' || reverse === 'CALLAO-MARCONA') return 0.15;
    if (pair === 'CALLAO-MATARANI' || reverse === 'CALLAO-MATARANI') return 0.28;

    // 2. Rutas Sur (Chile)
    if (pair === 'ILO-MEJILLONES' || reverse === 'ILO-MEJILLONES') return -0.15; // "Abajo"
    if (pair === 'ILO-BARQUITO' || reverse === 'ILO-BARQUITO') return -0.32; // "Arriba", rodea a Mejillones

    return 0.20; // Fallback
};

export function useSpaghettiData(
    aggregatedData: any,
    activeMonth: string,
    months: string[],
    ports: Port[]
) {
    return useMemo(() => {
        if (!aggregatedData || !activeMonth || !months || months.length === 0 || !ports) {
            return { nodes: [], edges: [], pieSeries: [] };
        }

        // 1. Obtener la lista de meses a acumular (desde el inicio hasta el mes seleccionado)
        const activeIndex = months.indexOf(activeMonth);
        const targetMonths = activeIndex >= 0 ? months.slice(0, activeIndex + 1) : [activeMonth];

        // 2. Inicializar acumuladores de carga y descarga por puerto para Petral
        const portMap: Record<string, { carga: number; descarga: number }> = {};
        ports.forEach(p => {
            portMap[p.port_id] = { carga: 0, descarga: 0 };
        });

        // Mapa para acumular las aristas por (source -> target) y barco
        const edgeAccumulator: Record<string, { source: string; target: string; vessel: string; tons: number }> = {};

        // Helper para extraer piernas físicas válidas de una ruta
        const getRouteLegs = (routeKey: string): Array<{ origin: string; dest: string }> => {
            if (routeKey.includes('SPOT-NEXA')) {
                const parts = routeKey.split(/[\.-]/);
                const validRoutePorts = parts.filter(part => ports.some(p => p.port_id === part));
                
                const legs: Array<{ origin: string; dest: string }> = [];
                for (let i = 0; i < validRoutePorts.length - 1; i++) {
                    legs.push({ origin: validRoutePorts[i], dest: validRoutePorts[i + 1] });
                }
                return legs;
            } else {
                const parts = routeKey.split('-');
                if (parts.length === 2) {
                    return [{ origin: parts[0], dest: parts[1] }];
                }
            }
            return [];
        };

        // 3. Iterar sobre los datos agregados para acumular toneladas
        Object.entries(aggregatedData).forEach(([_client, rMap]: any) => {
            Object.entries(rMap).forEach(([route, vMap]: any) => {
                const legs = getRouteLegs(route);
                if (legs.length === 0) return;

                Object.entries(vMap).forEach(([vessel, mMap]: any) => {
                    Object.entries(mMap).forEach(([month, metrics]: any) => {
                        if (targetMonths.includes(month)) {
                            const rawFreq = metrics['raw_inputs']?.['monthly_frequency'];
                            const freq = rawFreq !== undefined ? rawFreq : (metrics['freq'] !== undefined ? metrics['freq'] : 0);
                            const carga_unit = metrics['carga_unit'] || 0;
                            const tons = carga_unit * freq;

                            if (tons > 0) {
                                legs.forEach((leg) => {
                                    if (portMap[leg.origin]) {
                                        portMap[leg.origin].carga += tons / legs.length;
                                    }
                                    if (portMap[leg.dest]) {
                                        portMap[leg.dest].descarga += tons / legs.length;
                                    }

                                    const edgeKey = `${leg.origin}-${leg.dest}|${vessel}`;
                                    if (!edgeAccumulator[edgeKey]) {
                                        edgeAccumulator[edgeKey] = {
                                            source: leg.origin,
                                            target: leg.dest,
                                            vessel: vessel,
                                            tons: 0
                                        };
                                    }
                                    edgeAccumulator[edgeKey].tons += tons;
                                });
                            }
                        }
                    });
                });
            });
        });

        // 4. Agrupar aristas por par origen-destino para aplicar curvaturas paralelas
        const edgesGroupedByPair: Record<string, typeof edgeAccumulator[string][]> = {};
        Object.values(edgeAccumulator).forEach(edge => {
            if (edge.tons > 0) {
                const pairKey = `${edge.source}-${edge.target}`;
                if (!edgesGroupedByPair[pairKey]) {
                    edgesGroupedByPair[pairKey] = [];
                }
                edgesGroupedByPair[pairKey].push(edge);
            }
        });

        // Construir aristas finales con sus curvaturas
        const finalEdges: SpaghettiEdge[] = [];
        Object.entries(edgesGroupedByPair).forEach(([pairKey, edgesInPair]) => {
            const [source, target] = pairKey.split('-');
            const baseCurveness = getBaseCurveness(source, target);

            edgesInPair.forEach((edge, index) => {
                const curveness = baseCurveness + index * 0.06;

                finalEdges.push({
                    source: edge.source,
                    target: edge.target,
                    value: Math.round(edge.tons),
                    vessel: edge.vessel,
                    lineStyle: {
                        width: Math.max(1.5, Math.min(8, edge.tons / 12000)),
                        color: getVesselColor(edge.vessel),
                        curveness: curveness
                    }
                });
            });
        });

        // 5. Configurar los Nodos (Puertos)
        const maxCapacity = Math.max(...ports.map(p => p.capacity_mt || 0), 1);
        const activePorts = ports.filter(p => p.lat !== null && p.lon !== null);

        const nodesForGraph: SpaghettiNode[] = activePorts.map(p => {
            const petralCarga = portMap[p.port_id]?.carga || 0;
            const petralDescarga = portMap[p.port_id]?.descarga || 0;
            const capacity = p.capacity_mt || 50000;
            const symbolSize = 12 + (capacity / maxCapacity) * 16;

            return {
                id: p.port_id,
                name: p.port_name || p.port_id,
                value: [p.lon!, p.lat!],
                carga: Math.round(petralCarga),
                descarga: Math.round(petralDescarga),
                capacity_mt: capacity,
                type: p.type || 'SINK',
                symbolSize: symbolSize
            };
        });

        // 6. Generar las series de Pie Charts Concéntricos (uno por puerto)
        const pieSeries: any[] = [];
        nodesForGraph.forEach(n => {
            const petralTotal = n.carga + n.descarga;

            let marketColor = '#64748B';
            if (n.type === 'SOURCE') marketColor = '#A78BFA';
            if (n.type === 'MIXED') marketColor = '#3B82F6';

            // A. Donut Exterior (Capacidad del Puerto de Mercado - Fija)
            pieSeries.push({
                type: 'pie',
                coordinateSystem: 'geo',
                center: n.value,
                radius: [n.symbolSize * 0.70, n.symbolSize],
                silent: false,
                label: { show: false },
                emphasis: { label: { show: false } },
                data: [
                    { 
                        value: n.capacity_mt, 
                        name: `Capacidad Mercado (${n.type})`, 
                        itemStyle: { color: marketColor },
                        portInfo: n
                    }
                ],
                zlevel: 3
            });

            // B. Pie Interno (Operación de PETRAL - Carga vs Descarga Acumulado)
            if (petralTotal > 0) {
                pieSeries.push({
                    type: 'pie',
                    coordinateSystem: 'geo',
                    center: n.value,
                    radius: [0, n.symbolSize * 0.55],
                    label: { show: false },
                    emphasis: { 
                        label: { 
                            show: true, 
                            formatter: '{b}: {c} MT ({d}%)',
                            position: 'inside',
                            fontSize: 9,
                            color: '#ffffff'
                        } 
                    },
                    data: [
                        { 
                            value: n.carga, 
                            name: 'Carga Petral', 
                            itemStyle: { color: '#0EA5E9' }, 
                            portInfo: n
                        },
                        { 
                            value: n.descarga, 
                            name: 'Descarga Petral', 
                            itemStyle: { color: '#F97316' }, 
                            portInfo: n
                        }
                    ],
                    zlevel: 4
                });
            } else {
                pieSeries.push({
                    type: 'pie',
                    coordinateSystem: 'geo',
                    center: n.value,
                    radius: [0, n.symbolSize * 0.55],
                    label: { show: false },
                    silent: true,
                    data: [
                        { value: 1, name: 'Sin Operación Petral', itemStyle: { color: '#334155' } }
                    ],
                    zlevel: 4
                });
            }
        });

        return { nodes: nodesForGraph, edges: finalEdges, pieSeries };
    }, [aggregatedData, activeMonth, months, ports]);
}
