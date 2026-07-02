import React, { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import type { Port } from './useSpaghettiData';

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
    if (pair === 'ILO-CALLAO' || reverse === 'ILO-CALLAO') return 0.35;

    if (pair === 'CALLAO-MARCONA' || reverse === 'CALLAO-MARCONA') return 0.15;
    if (pair === 'CALLAO-MATARANI' || reverse === 'CALLAO-MATARANI') return 0.28;

    if (pair === 'ILO-MEJILLONES' || reverse === 'ILO-MEJILLONES') return -0.15;
    if (pair === 'ILO-BARQUITO' || reverse === 'ILO-BARQUITO') return -0.32;

    return 0.20;
};

// Función pura para calcular datos de espaguetis acumulados para un mes dado
function computeSpaghettiDataForMonth(
    aggregatedData: any,
    targetMonth: string,
    months: string[],
    ports: Port[]
) {
    if (!aggregatedData || !targetMonth || !months || months.length === 0 || !ports) {
        return { nodes: [], edges: [], pieSeries: [] };
    }

    const activeIndex = months.indexOf(targetMonth);
    const targetMonths = activeIndex >= 0 ? months.slice(0, activeIndex + 1) : [targetMonth];

    const portMap: Record<string, { carga: number; descarga: number }> = {};
    ports.forEach(p => {
        portMap[p.port_id] = { carga: 0, descarga: 0 };
    });

    const edgeAccumulator: Record<string, { source: string; target: string; vessel: string; tons: number }> = {};

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

    const finalEdges: any[] = [];
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
            symbolSize: symbolSize
        };
    });

    const pieSeries: any[] = [];
    nodesForGraph.forEach(n => {
        const petralTotal = n.carga + n.descarga;
        let marketColor = '#64748B';
        if (n.type === 'SOURCE') marketColor = '#A78BFA';
        if (n.type === 'MIXED') marketColor = '#3B82F6';

        const monthsCount = targetMonths.length;
        const totalMonthsInHorizon = months.length;
        const scaledCapacity = Math.round(n.capacity_mt * (monthsCount / totalMonthsInHorizon));

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
                    value: scaledCapacity, 
                    name: `Capacidad Mercado Acum. (${n.type})`, 
                    itemStyle: { color: marketColor },
                    portInfo: n
                }
            ],
            zlevel: 3
        });

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
                        fontSize: 8,
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
}

interface SpaghettiMapProps {
    data: any;
    months: string[];
    ports: Port[];
    isDarkMode?: boolean;
}

export const SpaghettiMap: React.FC<SpaghettiMapProps> = ({
    data,
    months,
    ports,
    isDarkMode = true
}) => {
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        const loadMap = async () => {
            try {
                const response = await fetch('/peru.json');
                const geoJson = await response.json();
                echarts.registerMap('peru', geoJson);
                setMapLoaded(true);
            } catch (error) {
                console.error("Error loading Peru GeoJSON map:", error);
            }
        };
        loadMap();
    }, []);

    const timelineOptions = useMemo(() => {
        if (!data || !data.aggregated_data || months.length === 0 || ports.length === 0) {
            return [];
        }

        return months.map(m => {
            const { nodes, edges, pieSeries } = computeSpaghettiDataForMonth(data.aggregated_data, m, months, ports);
            
            return {
                title: {
                    text: `Flujos y Viajes Acumulados a ${m}`,
                    subtext: 'Donut Externo: Capacidad Mercado Acumulada | Pie Interno: Carga vs Descarga Petral',
                    left: 'center',
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
                series: [
                    {
                        name: 'Rutas y Puertos',
                        type: 'graph',
                        coordinateSystem: 'geo',
                        layout: 'none',
                        data: nodes,
                        links: edges,
                        roam: true,
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
        });
    }, [data, months, ports, isDarkMode]);

    const option = useMemo(() => {
        if (!mapLoaded || timelineOptions.length === 0) return null;

        return {
            baseOption: {
                backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                timeline: {
                    axisType: 'category',
                    data: months,
                    autoPlay: false,
                    playInterval: 2000,
                    loop: false,
                    bottom: 15,
                    left: '10%',
                    right: '10%',
                    label: {
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        formatter: (value: string) => {
                            const [y, m] = value.split('-');
                            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                            return `${monthNames[parseInt(m) - 1]} ${y}`;
                        }
                    },
                    controlStyle: {
                        color: '#0EA5E9',
                        borderColor: '#0EA5E9',
                        prevIcon: 'M0 0 L10 5 L0 10 Z',
                        nextIcon: 'M10 0 L0 5 L10 10 Z'
                    },
                    lineStyle: { color: isDarkMode ? '#334155' : '#cbd5e1' },
                    checkpointStyle: {
                        color: '#0EA5E9',
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }
                },
                geo: {
                    map: 'peru',
                    roam: true,
                    zoom: 5.2,
                    center: [-75.5, -14.0],
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
                }
            },
            options: timelineOptions
        };
    }, [mapLoaded, timelineOptions, months, isDarkMode]);

    if (!mapLoaded || !option) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-xl p-8 min-h-[500px]">
                <div className="animate-spin h-8 w-8 border-4 border-petral-teal border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-400 font-medium">Cargando Mapa de Espaguetis...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-4 min-h-[550px] flex flex-col">
            <div className="flex-1 relative w-full h-full min-h-[500px]">
                <ReactECharts 
                    option={option} 
                    style={{ height: '100%', width: '100%', minHeight: '500px' }}
                    notMerge={true}
                    lazyUpdate={true}
                />
            </div>
        </div>
    );
};
