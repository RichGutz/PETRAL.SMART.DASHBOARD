import React, { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useSpaghettiData } from './useSpaghettiData';

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

    if (pair === 'ILO-MATARANI' || reverse === 'ILO-MATARANI') return 0.10;
    if (pair === 'ILO-MARCONA' || reverse === 'ILO-MARCONA') return 0.22;
    if (pair === 'ILO-CALLAO' || reverse === 'ILO-CALLAO') return 0.55;

    if (pair === 'CALLAO-MARCONA' || reverse === 'CALLAO-MARCONA') return 0.15;
    if (pair === 'CALLAO-MATARANI' || reverse === 'CALLAO-MATARANI') return 0.28;

    if (pair === 'ILO-MEJILLONES' || reverse === 'ILO-MEJILLONES') return -0.15;
    if (pair === 'ILO-BARQUITO' || reverse === 'ILO-BARQUITO') return -0.32;
    if (pair === 'CALLAO-MEJILLONES' || reverse === 'CALLAO-MEJILLONES') return -0.45;

    return 0.20;
};

// Función pura para calcular datos de espaguetis acumulados para un mes dado
function computeSpaghettiDataForMonth(
    aggregatedData: any,
    selectedMonths: string[],
    months: string[],
    ports: any[]
) {
    if (!aggregatedData || !selectedMonths || selectedMonths.length === 0 || !months || months.length === 0 || !ports) {
        return { nodes: [], edges: [], pieSeries: [] };
    }

    // Since we now receive an array of months directly from the multi-select UI
    const targetMonths = selectedMonths;

    const portMap: Record<string, { carga: number; descarga: number }> = {};
    ports.forEach(p => {
        portMap[p.port_id] = { carga: 0, descarga: 0 };
    });

    const edgeAccumulator: Record<string, { source: string; target: string; vessel: string; tons: number, freq: number }> = {};

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
                                        tons: 0,
                                        freq: 0
                                    };
                                }
                                edgeAccumulator[edgeKey].tons += tons;
                                edgeAccumulator[edgeKey].freq += freq;
                            });
                        }
                    }
                });
            });
        });
    });

    const edgesGroupedByPair: Record<string, any[]> = {};
    Object.values(edgeAccumulator).forEach((edge: any) => {
        if (edge.tons > 0) {
            const pairKey = `${edge.source}-${edge.target}`;
            if (!edgesGroupedByPair[pairKey]) {
                edgesGroupedByPair[pairKey] = [];
            }
            if (targetMonths.length === 1) {
                // Modo 1 mes: Línea individual por cada viaje
                const trips = Math.max(1, Math.round(edge.freq));
                for (let i = 0; i < trips; i++) {
                    edgesGroupedByPair[pairKey].push({
                        ...edge,
                        tons: edge.tons / trips, // Toneladas promediadas por viaje
                        isAggregated: false
                    });
                }
            } else {
                // Modo acumulado: Una sola línea gruesa
                edgesGroupedByPair[pairKey].push({
                    ...edge,
                    isAggregated: true
                });
            }
        }
    });

    const finalEdges: any[] = [];
    Object.entries(edgesGroupedByPair).forEach(([pairKey, edgesInPair]) => {
        const [source, target] = pairKey.split('-');
        const baseCurveness = getBaseCurveness(source, target);

        edgesInPair.forEach((edge, index) => {
            const curveness = baseCurveness + index * 0.06;
            
            const edgeConfig: any = {
                source: edge.source,
                target: edge.target,
                value: Math.round(edge.tons),
                vessel: edge.vessel,
                lineStyle: {
                    width: Math.max(1.5, Math.min(8, edge.tons / 12000)),
                    color: getVesselColor(edge.vessel),
                    curveness: curveness
                }
            };

            if (edge.isAggregated && edge.freq > 0) {
                // Bolita con el número de viajes (horizontal, estilo bola de billar)
                edgeConfig.label = {
                    show: true,
                    formatter: `${Math.round(edge.freq)}`,
                    backgroundColor: getVesselColor(edge.vessel),
                    color: '#fff',
                    width: 16,
                    height: 16,
                    lineHeight: 16,
                    align: 'center',
                    verticalAlign: 'middle',
                    padding: 0,
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 'bold',
                    position: 'middle',
                    rotate: 0
                };
            }

            finalEdges.push(edgeConfig);
        });
    });

    const maxCapacity = Math.max(...ports.map(p => p.capacity_mt || 0), 1);
    const activePorts = ports.filter(p => p.lat !== null && p.lon !== null);

    const nodesForGraph = activePorts.map(p => {
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
            symbolSize: symbolSize,
            sources_sinks: p.sources_sinks || []
        };
    });

    // 6. Generar las series de Pie Charts (Tierra y Mar)
    const pieSeries: any[] = [];
    nodesForGraph.forEach(n => {
        const petralTotal = n.carga + n.descarga;

        // Offset centers for the pies (degrees longitude)
        const landOffset = 0.55;
        const seaOffset = -0.55;
        
        let latOffset = 0;
        if (n.name.includes('ILO') || n.id.includes('ILO')) {
            latOffset = -0.3; // Mover al sur
        }
        
        const landCenter = [n.value[0] + landOffset, n.value[1] + latOffset];
        const seaCenter = [n.value[0] + seaOffset, n.value[1] + latOffset];

        // A. Pie de Tierra (Mercado)
        const marketData = n.sources_sinks?.map((ss: any) => ({
            value: ss.capacity_mt,
            name: `${ss.empresa} (${ss.type})`,
            itemStyle: { color: ss.color_hex || '#64748B' },
            portInfo: n
        })) || [];
        
        if (marketData.length === 0) {
            let fallbackColor = '#64748B';
            if (n.type === 'SOURCE') fallbackColor = '#A78BFA';
            if (n.type === 'MIXED') fallbackColor = '#3B82F6';
            marketData.push({
                value: n.capacity_mt,
                name: `Capacidad Mercado (${n.type})`,
                itemStyle: { color: fallbackColor },
                portInfo: n
            });
        }

        pieSeries.push({
            type: 'pie',
            coordinateSystem: 'geo',
            center: landCenter,
            radius: [0, n.symbolSize],
            silent: false,
            label: { show: false },
            emphasis: { 
                label: { 
                    show: true, 
                    formatter: '{b}',
                    position: 'inside',
                    fontSize: 9,
                    color: '#ffffff'
                } 
            },
            data: marketData,
            zlevel: 3
        });

        // B. Pie de Mar (Operación de PETRAL)
        if (petralTotal > 0) {
            pieSeries.push({
                type: 'pie',
                coordinateSystem: 'geo',
                center: seaCenter,
                radius: [0, n.symbolSize * 0.8],
                label: { show: false },
                emphasis: { 
                    label: { 
                        show: true, 
                        formatter: '{b}',
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
                center: seaCenter,
                radius: [0, n.symbolSize * 0.8],
                label: { show: false },
                silent: true,
                data: [
                    { value: 1, name: 'Sin Operación Petral', itemStyle: { color: '#334155' }, portInfo: n }
                ],
                zlevel: 4
            });
        }
    });

    return { nodes: nodesForGraph, edges: finalEdges, pieSeries };
}

interface SpaghettiMapProps {
    data: any;
    months: string[];
    selectedMonths: string[];
    ports: any[];
    isDarkMode?: boolean;
}

export const SpaghettiMap: React.FC<SpaghettiMapProps> = ({
    data,
    months,
    selectedMonths,
    ports,
    isDarkMode = true
}) => {
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        const loadMap = async () => {
            try {
                const response = await fetch('/peru_chile.json');
                const geoJson = await response.json();
                echarts.registerMap('peru_chile', geoJson);
                setMapLoaded(true);
            } catch (error) {
                console.error("Error loading Peru/Chile GeoJSON map:", error);
            }
        };
        loadMap();
    }, []);

    const option = useMemo(() => {
        if (!mapLoaded || !data || !data.aggregated_data || selectedMonths.length === 0 || !ports) return;

        const { nodes, edges, pieSeries } = computeSpaghettiDataForMonth(data.aggregated_data, selectedMonths, months, ports);

        return {
            backgroundColor: 'transparent',
            title: {
                text: `Flujos y Viajes Acumulados a ${selectedMonths[selectedMonths.length - 1]}`,
                subtext: 'Donut Externo: Capacidad Mercado Acumulada | Pie Interno: Carga vs Descarga Petral',
                left: '20px',
                top: '20px',
                textStyle: {
                    color: isDarkMode ? '#f1f5f9' : '#1e293b',
                    fontSize: 16,
                    fontWeight: 'bold'
                },
                subtextStyle: {
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                    fontSize: 12
                }
            },
            geo: {
                map: 'peru_chile',
                roam: true,
                zoom: 2.8,
                center: [-73.0, -20.0],
                aspectScale: 0.85,
                itemStyle: {
                    areaColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                    borderWidth: 0.8
                },
                emphasis: {
                    itemStyle: {
                        areaColor: isDarkMode ? '#273549' : '#d1d5db'
                    },
                    label: { show: false }
                }
            },
            tooltip: {
                trigger: 'item',
                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                textStyle: { color: isDarkMode ? '#f1f5f9' : '#1e293b' },
                formatter: (params: any) => {
                    if (params.dataType === 'node') {
                        const d = params.data;
                        const totalPetral = d.carga + d.descarga;
                        const pct = d.capacity_mt > 0 ? ((totalPetral / d.capacity_mt) * 100).toFixed(1) : '0';
                        
                        return `
                            <div style="font-family: Inter, sans-serif; padding: 4px;">
                                <b style="font-size: 13px; color: #0EA5E9;">${d.name}</b> (${d.type})<br/>
                                <hr style="margin: 6px 0; border-color: #334155;"/>
                                <b>Operación Petral (Acumulada):</b><br/>
                                • Carga: <span style="color: #0EA5E9; font-family: monospace;">${d.carga.toLocaleString()} MT</span><br/>
                                • Descarga: <span style="color: #F97316; font-family: monospace;">${d.descarga.toLocaleString()} MT</span><br/>
                                • Total: <span style="font-weight: bold; font-family: monospace;">${totalPetral.toLocaleString()} MT</span><br/>
                                <hr style="margin: 6px 0; border-color: #334155;"/>
                                <b>Capacidad Mercado (Anual):</b> <span style="font-family: monospace;">${d.capacity_mt.toLocaleString()} MT</span><br/>
                                <b>Market Share Petral:</b> <span style="font-weight: bold; color: #16A34A; font-family: monospace;">${pct}%</span>
                            </div>
                        `;
                    }
                    if (params.dataType === 'edge') {
                        const d = params.data;
                        return `
                            <div style="font-family: Inter, sans-serif; padding: 4px;">
                                <b>${d.source} &rarr; ${d.target}</b><br/>
                                <hr style="margin: 6px 0; border-color: #334155;"/>
                                <b>Buque:</b> ${d.vessel}<br/>
                                <b>Volumen Transportado:</b> <span style="font-weight: bold; color: #10B981; font-family: monospace;">${d.value.toLocaleString()} MT</span>
                            </div>
                        `;
                    }
                    if (params.componentType === 'series' && params.seriesType === 'pie') {
                        const d = params.data;
                        if (d.portInfo) {
                            const pi = d.portInfo;
                            if (params.name.includes('Capacidad')) {
                                return `
                                    <div style="font-family: Inter, sans-serif;">
                                        <b>${pi.name}</b><br/>
                                        Capacidad Mercado Acumulada: <span style="font-weight: bold; font-family: monospace;">${params.value.toLocaleString()} MT</span>
                                    </div>
                                `;
                            }
                            return `
                                <div style="font-family: Inter, sans-serif;">
                                    <b>${pi.name}</b> - Petral<br/>
                                    ${params.name}: <span style="font-weight: bold; font-family: monospace;">${params.value.toLocaleString()} MT (${params.percent}%)</span>
                                </div>
                            `;
                        }
                    }
                    return '';
                }
            },
            series: [
                {
                    name: 'Rutas y Puertos',
                    type: 'graph',
                    coordinateSystem: 'geo',
                    layout: 'none',
                    data: nodes,
                    links: edges,
                    zlevel: 2,
                    label: {
                        show: true,
                        position: 'top',
                        formatter: '{b}',
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: isDarkMode ? '#f1f5f9' : '#1e293b',
                        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                        padding: [3, 5],
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                        distance: 10
                    },
                    emphasis: {
                        focus: 'adjacency',
                        lineStyle: {
                            width: 8,
                            opacity: 1
                        }
                    },
                    lineStyle: {
                        curveness: 0.2,
                        opacity: 0.8
                    }
                },
                ...pieSeries
            ]
        };
    }, [mapLoaded, data, months, selectedMonths, ports, isDarkMode]);

    if (!mapLoaded || !option) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] w-full">
                <div className="animate-spin h-8 w-8 border-4 border-petral-teal border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-400 font-medium">Cargando Mapa de Espaguetis...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 relative w-full h-full">
            <ReactECharts 
                option={option} 
                style={{ height: '100%', width: '100%', minHeight: '600px' }}
                notMerge={true}
                lazyUpdate={true}
            />
        </div>
    );
};
