import React, { useEffect, useState, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import peruChileGeoJson from '../../assets/peru_chile.json';


// Colores unificados por Buque según Manual.Estilos.md
const getVesselColor = (vesselName: string): string => {
    const name = vesselName.toUpperCase();
    if (name.includes('TABLONES')) return '#DC2626'; // Rojo
    if (name.includes('MOQUEGUA')) return '#16A34A'; // Verde
    if (name.includes('CONCON') || name.includes('TRADER')) return '#475569'; // Gris / Slate
    if (name.includes('HUEMUL')) return '#4F46E5'; // Índigo / Azul
    return '#0EA5E9'; // Fallback Cían
};

// Reglas de curvatura monolíticas con signos ajustados para que todas las piernas abomben al Pacífico (Oeste)
const getBaseCurveness = (origin: string, dest: string): number => {
    const pair = `${origin}-${dest}`;

    if (pair === 'ILO-MATARANI') return 0.10;
    if (pair === 'MATARANI-ILO') return -0.10;

    if (pair === 'ILO-MARCONA') return 0.22;
    if (pair === 'MARCONA-ILO') return -0.22;

    if (pair === 'ILO-CALLAO') return 0.55;
    if (pair === 'CALLAO-ILO') return -0.55;

    if (pair === 'CALLAO-MARCONA') return -0.15;
    if (pair === 'MARCONA-CALLAO') return 0.15;

    if (pair === 'CALLAO-MATARANI') return -0.28;
    if (pair === 'MATARANI-CALLAO') return 0.28;

    if (pair === 'ILO-MEJILLONES') return -0.25;
    if (pair === 'MEJILLONES-ILO') return 0.25;

    if (pair === 'ILO-BARQUITO') return -0.32;
    if (pair === 'BARQUITO-ILO') return 0.32;

    if (pair === 'CALLAO-MEJILLONES') return -0.45;
    if (pair === 'MEJILLONES-CALLAO') return 0.45;

    return -0.20;
};

// Interpolador Bézier Cuadrático para autopistas marítimas curvas en el Océano Pacífico
const getBezierPoints = (
    src: { lon: number; lat: number },
    dst: { lon: number; lat: number },
    curveness: number,
    steps: number = 20
): Array<[number, number]> => {
    const x1 = src.lon;
    const y1 = src.lat;
    const x2 = dst.lon;
    const y2 = dst.lat;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    const dx = x2 - x1;
    const dy = y2 - y1;

    const cx = mx - curveness * dy;
    const cy = my + curveness * dx;

    const points: Array<[number, number]> = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const invT = 1 - t;
        const px = invT * invT * x1 + 2 * invT * t * cx + t * t * x2;
        const py = invT * invT * y1 + 2 * invT * t * cy + t * t * y2;
        points.push([px, py]);
    }
    return points;
};

// Función pura para calcular datos de espaguetis acumulados para un mes dado
const computeSpaghettiDataForMonth = (
    aggregatedData: any,
    selectedMonths: string[],
    months: string[],
    ports: any[],
    showPies: boolean = true,
    playSpeed: number = 2
) => {
    if (!aggregatedData || !selectedMonths || selectedMonths.length === 0 || !months || months.length === 0 || !ports) {
        return { nodes: [], edges: [], pieSeries: [], missileSeries: [] };
    }

    const targetMonths = selectedMonths;

    const portMap: Record<string, { carga: number; descarga: number }> = {};
    ports.forEach(p => {
        portMap[p.port_id] = { carga: 0, descarga: 0 };
    });

    const edgeAccumulator: Record<string, { source: string; target: string; vessel: string; tons: number; freq: number; isLaden: boolean }> = {};
    const rotationList: Array<{ vessel: string; fullRouteName: string; legs: Array<{ origin: string; dest: string }>; freq: number }> = [];

    const getRouteLegs = (routeKey: string): Array<{ origin: string; dest: string }> => {
        if (routeKey.includes('SPOT-NEXA') || routeKey.includes('QUOTE:') || routeKey.includes('.')) {
            const parts = routeKey.split(/[\.-]/);
            const validRoutePorts = parts.filter(part => ports.some(p => p.port_id === part));
            
            const legs: Array<{ origin: string; dest: string }> = [];
            for (let i = 0; i < validRoutePorts.length - 1; i++) {
                legs.push({ origin: validRoutePorts[i], dest: validRoutePorts[i + 1] });
            }
            if (legs.length > 0) return legs;
        }
        const parts = routeKey.split('-');
        if (parts.length === 2) {
            return [
                { origin: parts[0], dest: parts[1] },
                { origin: parts[1], dest: parts[0] }
            ];
        }
        return [];
    };

    Object.entries(aggregatedData).forEach(([_client, rMap]: any) => {
        Object.entries(rMap).forEach(([routeKey, vMap]: any) => {
            if (!vMap || typeof vMap !== 'object') return;

            Object.entries(vMap).forEach(([vessel, mMap]: any) => {
                if (!mMap || typeof mMap !== 'object') return;

                Object.entries(mMap).forEach(([month, metrics]: any) => {
                    if (targetMonths.includes(month)) {
                        const fullRouteName = metrics?.['route_name'] || metrics?.['raw_inputs']?.['route_id'] || routeKey;
                        const legs = getRouteLegs(fullRouteName);
                        if (legs.length === 0) return;

                        const rawFreq = metrics['raw_inputs']?.['monthly_frequency'];
                        const freq = rawFreq !== undefined ? rawFreq : (metrics['freq'] !== undefined ? metrics['freq'] : 0);
                        const carga_unit = metrics['carga_unit'] || 0;
                        let tons = carga_unit * freq;

                        if (freq > 0 && tons <= 0) {
                            tons = freq * 13500;
                        }

                        if (tons > 0 || freq > 0) {
                            const effectiveTons = tons > 0 ? tons : 13500;

                            // REFINAMIENTO 1: Contabilidad estricta de Carga Paga SOLO en la pierna LADEN (Pierna 0)
                            legs.forEach((leg, legIdx) => {
                                const isLaden = legIdx === 0;
                                const legTons = isLaden ? effectiveTons : 0;

                                if (portMap[leg.origin]) {
                                    portMap[leg.origin].carga += legTons;
                                }
                                if (portMap[leg.dest]) {
                                    portMap[leg.dest].descarga += legTons;
                                }

                                const edgeKey = `${leg.origin}-${leg.dest}|${vessel}`;
                                if (!edgeAccumulator[edgeKey]) {
                                    edgeAccumulator[edgeKey] = {
                                        source: leg.origin,
                                        target: leg.dest,
                                        vessel: vessel,
                                        tons: 0,
                                        freq: 0,
                                        isLaden: isLaden
                                    };
                                }
                                edgeAccumulator[edgeKey].tons += legTons;
                                edgeAccumulator[edgeKey].freq += freq;
                            });

                            if (targetMonths.length === 1) {
                                rotationList.push({ vessel, fullRouteName, legs, freq });
                            }
                        }
                    }
                });
            });
        });
    });

    const edgesGroupedByPair: Record<string, any[]> = {};
    Object.values(edgeAccumulator).forEach((edge: any) => {
        const pairKey = `${edge.source}-${edge.target}`;
        if (!edgesGroupedByPair[pairKey]) {
            edgesGroupedByPair[pairKey] = [];
        }
        edgesGroupedByPair[pairKey].push({
            ...edge,
            isAggregated: true
        });
    });

    const activePorts = ports.filter(p => p.lat !== null && p.lon !== null);

    const finalEdges: any[] = [];
    const missileSeries: any[] = [];

    // Generar aristas estáticas del grafo con curvaturas monolíticas traslúcidas
    Object.entries(edgesGroupedByPair).forEach(([pairKey, edgesInPair]) => {
        const [source, target] = pairKey.split('-');
        const baseCurveness = getBaseCurveness(source, target);

        edgesInPair.forEach((edge, index) => {
            // REFINAMIENTO 2: Offset dinámico de curvatura para evitar superposición de rutas que comparten piernas
            const offsetSign = baseCurveness >= 0 ? 1 : -1;
            const curveness = baseCurveness + (index * 0.08 * offsetSign);
            
            const edgeConfig: any = {
                source: edge.source,
                target: edge.target,
                value: Math.round(edge.tons),
                vessel: edge.vessel,
                freq: Math.round(edge.freq),
                isLaden: edge.isLaden,
                lineStyle: {
                    width: targetMonths.length === 1 ? 1.2 : Math.max(0.5, Math.min(2, edge.tons / 50000)),
                    color: getVesselColor(edge.vessel),
                    opacity: targetMonths.length === 1 ? 0.35 : 0.8,
                    curveness: curveness
                }
            };

            if (edge.isAggregated && edge.freq > 0 && targetMonths.length > 1) {
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

    // Generar misiles de color UNIFICADO por Buque en trayectoria polilineal continua cerrada
    if (targetMonths.length === 1) {
        rotationList.forEach(({ legs, freq }, vIdx) => {
            if (legs.length === 0) return;

            const fullPolyCoords: Array<[number, number]> = [];

            legs.forEach((leg, legIdx) => {
                const sourcePort = activePorts.find(p => p.port_id === leg.origin);
                const targetPort = activePorts.find(p => p.port_id === leg.dest);

                if (sourcePort && targetPort && sourcePort.lon !== null && sourcePort.lat !== null && targetPort.lon !== null && targetPort.lat !== null) {
                    const baseCurveness = getBaseCurveness(leg.origin, leg.dest);
                    // REFINAMIENTO 2: Offset dinámico por vIdx para separar autopistas marítimas paralelas
                    const offsetSign = baseCurveness >= 0 ? 1 : -1;
                    const curveness = baseCurveness + (vIdx * 0.08 * offsetSign);

                    const legPoints = getBezierPoints(
                        { lon: sourcePort.lon, lat: sourcePort.lat },
                        { lon: targetPort.lon, lat: targetPort.lat },
                        curveness,
                        20
                    );

                    if (legIdx === 0) {
                        fullPolyCoords.push(...legPoints);
                    } else {
                        fullPolyCoords.push(...legPoints.slice(1));
                    }
                }
            });

            if (fullPolyCoords.length >= 2) {
                const trips = Math.max(1, freq || 1);
                const totalPeriod = Math.max(2.5, (playSpeed * 1.5) / trips);
                const routeColorsPalette = ['#0EA5E9', '#F97316', '#8B5CF6', '#10B981', '#DC2626'];
                const vesselColor = routeColorsPalette[vIdx % routeColorsPalette.length];

                missileSeries.push({
                    type: 'lines',
                    coordinateSystem: 'geo',
                    polyline: true,
                    zlevel: 3,
                    effect: {
                        show: true,
                        period: totalPeriod,
                        trailLength: 0.5,
                        color: vesselColor,
                        symbol: 'arrow',
                        symbolSize: 6
                    },
                    lineStyle: {
                        color: vesselColor,
                        width: 1.8,
                        opacity: 0.45
                    },
                    data: [
                        {
                            coords: fullPolyCoords
                        }
                    ],
                    silent: true
                });
            }
        });
    }

    const maxCapacity = Math.max(...ports.map(p => p.capacity_mt || 0), 1);

    const nodesForGraph = activePorts.map(p => {
        const petralCarga = portMap[p.port_id]?.carga || 0;
        const petralDescarga = portMap[p.port_id]?.descarga || 0;
        const capacity = p.capacity_mt || 50000;
        const pieRadius = 14 + (capacity / maxCapacity) * 20;

        return {
            id: p.port_id,
            name: p.port_name || p.port_id,
            value: [p.lon!, p.lat!],
            carga: Math.round(petralCarga),
            descarga: Math.round(petralDescarga),
            capacity_mt: capacity,
            type: p.type || 'SINK',
            symbolSize: 6,
            pieRadius: pieRadius,
            sources_sinks: p.sources_sinks || []
        };
    });

    const pieSeries: any[] = [];
    const calloutLinesData: any[] = [];

    if (showPies) {
        nodesForGraph.forEach(n => {
            let marketOffset = 4.0;
            let petralOffset = -4.0;
            let latOffset = 0.0;

            if (n.name.includes('ILO') || n.id.includes('ILO')) {
                marketOffset = 10.0;
                petralOffset = -10.0;
                latOffset = -1.2;
            } else if (n.name.toUpperCase().includes('SAN JUAN') || n.id.toUpperCase().includes('SAN JUAN')) {
                marketOffset = 8.0;
                petralOffset = -8.0;
            }
            
            const landCenter = [n.value[0] + marketOffset, n.value[1] + latOffset];
            const seaCenter = [n.value[0] + petralOffset, n.value[1] + latOffset];

            const monthsCount = targetMonths.length;

            const marketData = n.sources_sinks?.map((ss: any) => {
                const proratedCapacity = (ss.capacity_mt / 12) * monthsCount;
                return {
                    value: Math.round(proratedCapacity),
                    name: `${ss.empresa} (${ss.type})`,
                    itemStyle: { color: ss.color_hex || '#64748B' },
                    portInfo: n
                };
            }) || [];
            
            if (marketData.length === 0) {
                let fallbackColor = '#64748B';
                if (n.type === 'SOURCE') fallbackColor = '#A78BFA';
                if (n.type === 'MIXED') fallbackColor = '#3B82F6';
                const proratedFallback = (n.capacity_mt / 12) * monthsCount;
                marketData.push({
                    value: Math.round(proratedFallback),
                    name: `Capacidad Mercado (${n.type})`,
                    itemStyle: { color: fallbackColor },
                    portInfo: n
                });
            }

            pieSeries.push({
                type: 'pie',
                coordinateSystem: 'geo',
                center: landCenter,
                radius: [0, n.pieRadius],
                label: { show: false },
                emphasis: { 
                    label: { 
                        show: true, 
                        position: 'inside', 
                        formatter: '{b}\n{c} MT',
                        fontSize: 9,
                        color: '#ffffff',
                        fontWeight: 'bold'
                    } 
                },
                data: marketData,
                zlevel: 4
            });

            const totalProratedCapacity = (n.capacity_mt / 12) * monthsCount;

            if (n.carga > 0) {
                const cargaRatio = totalProratedCapacity > 0 ? (n.carga / totalProratedCapacity) : 0;
                const cargaRadius = Math.max(3, n.pieRadius * cargaRatio);
                
                pieSeries.push({
                    type: 'pie',
                    coordinateSystem: 'geo',
                    center: seaCenter,
                    radius: [0, cargaRadius],
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
                        }
                    ],
                    zlevel: 4
                });
            }

            const seaCenterDescarga = [seaCenter[0] - 2.5, seaCenter[1]];

            if (n.descarga > 0) {
                const descargaRatio = totalProratedCapacity > 0 ? (n.descarga / totalProratedCapacity) : 0;
                const descargaRadius = Math.max(3, n.pieRadius * descargaRatio);
                
                pieSeries.push({
                    type: 'pie',
                    coordinateSystem: 'geo',
                    center: seaCenterDescarga,
                    radius: [0, descargaRadius],
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
                            value: n.descarga, 
                            name: 'Descarga Petral', 
                            itemStyle: { color: '#F97316' }, 
                            portInfo: n
                        }
                    ],
                    zlevel: 4
                });
            }

            calloutLinesData.push({
                coords: [n.value, landCenter],
                lineStyle: { color: '#94A3B8', type: 'dashed', width: 1.2, opacity: 0.7 }
            });
            
            if (n.carga > 0 || n.descarga > 0) {
                const targetCenter = n.carga > 0 ? seaCenter : seaCenterDescarga;
                calloutLinesData.push({
                    coords: [n.value, targetCenter],
                    lineStyle: { color: '#94A3B8', type: 'dashed', width: 1.2, opacity: 0.7 }
                });
            }
        });

        if (calloutLinesData.length > 0) {
            pieSeries.push({
                type: 'lines',
                coordinateSystem: 'geo',
                zlevel: 1,
                silent: true,
                data: calloutLinesData
            });
        }
    }

    return { nodes: nodesForGraph, edges: finalEdges, pieSeries, missileSeries };
}

interface SpaghettiMapProps {
    data: any;
    months: string[];
    selectedMonths: string[];
    ports: any[];
    clients?: any[];
    isDarkMode?: boolean;
    showPies?: boolean;
    playSpeed?: number;
    onPortClick?: (portId: string) => void;
}

export const SpaghettiMap: React.FC<SpaghettiMapProps> = ({
    data,
    months,
    selectedMonths,
    ports,
    isDarkMode = true,
    showPies = true,
    playSpeed = 2,
    onPortClick
}) => {
    const [mapLoaded, setMapLoaded] = useState(false);
    const chartRef = useRef<any>(null);
    const zoomRef = useRef<number>(2.8);
    const centerRef = useRef<[number, number]>([-73.0, -20.0]);

    useEffect(() => {
        try {
            echarts.registerMap('peru_chile', peruChileGeoJson as any);
            setMapLoaded(true);
        } catch (error) {
            console.error("Error registering Peru/Chile GeoJSON map:", error);
        }
    }, []);

    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-resize de ECharts con ResizeObserver para garantizar dimensiones en transiciones de React Router sin F5
    useEffect(() => {
        const handleResize = () => {
            if (chartRef.current && mapLoaded) {
                try {
                    const chartInstance = chartRef.current.getEchartsInstance();
                    if (chartInstance && typeof chartInstance.resize === 'function' && !chartInstance.isDisposed()) {
                        chartInstance.resize();
                    }
                } catch (e) {
                    // Prevenir que errores de layout internos de ECharts rompan el árbol de React
                }
            }
        };

        let resizeObserver: ResizeObserver | null = null;
        if (containerRef.current && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => {
                handleResize();
            });
            resizeObserver.observe(containerRef.current);
        }

        const timers = [50, 150, 300, 500, 800, 1200].map(delay => setTimeout(handleResize, delay));
        window.addEventListener('resize', handleResize);

        return () => {
            timers.forEach(clearTimeout);
            window.removeEventListener('resize', handleResize);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [mapLoaded]);




    const option = useMemo(() => {
        if (!mapLoaded || !data || !data.aggregated_data || selectedMonths.length === 0 || !ports) return;

        const { nodes, edges, pieSeries, missileSeries } = computeSpaghettiDataForMonth(data.aggregated_data, selectedMonths, months, ports, showPies, playSpeed);

        return {
            backgroundColor: isDarkMode ? 'transparent' : '#ebf8ff',
            title: {
                text: `Flujos y Viajes Acumulados a ${selectedMonths[selectedMonths.length - 1]}`,
                left: '20px',
                top: '20px',
                textStyle: {
                    color: isDarkMode ? '#f1f5f9' : '#1e293b',
                    fontSize: 16,
                    fontWeight: 'bold'
                }
            },
            geo: {
                map: 'peru_chile',
                roam: true,
                zoom: zoomRef.current,
                center: centerRef.current,
                aspectScale: 0.85,
                itemStyle: {
                    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                    borderWidth: 0.8
                },
                regions: [
                    {
                        name: 'Peru',
                        itemStyle: {
                            areaColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.75)'
                        }
                    },
                    {
                        name: 'Chile',
                        itemStyle: {
                            areaColor: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(226, 232, 240, 0.75)'
                        }
                    }
                ],
                emphasis: {
                    itemStyle: {
                        areaColor: isDarkMode ? '#273549' : '#e2e8f0'
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
                        const monthsCount = selectedMonths.length;
                        const proratedCapacity = (d.capacity_mt / 12) * monthsCount;
                        const totalPetral = d.carga + d.descarga;
                        const pct = proratedCapacity > 0 ? ((totalPetral / proratedCapacity) * 100).toFixed(1) : '0';
                        
                        return `
                            <div style="font-family: Inter, sans-serif; padding: 4px;">
                                <b style="font-size: 13px; color: #0EA5E9;">${d.name}</b> (${d.type})<br/>
                                <hr style="margin: 6px 0; border-color: #334155;"/>
                                <b>Operación Petral (Acumulada):</b><br/>
                                • Carga: <span style="color: #0EA5E9; font-family: monospace;">${Math.round(d.carga).toLocaleString()} MT</span><br/>
                                • Descarga: <span style="color: #F97316; font-family: monospace;">${Math.round(d.descarga).toLocaleString()} MT</span><br/>
                                • Total: <span style="font-weight: bold; font-family: monospace;">${Math.round(totalPetral).toLocaleString()} MT</span><br/>
                                <hr style="margin: 6px 0; border-color: #334155;"/>
                                <b>Cap. Mercado (${monthsCount} mes${monthsCount > 1 ? 'es' : ''}):</b> <span style="font-family: monospace;">${Math.round(proratedCapacity).toLocaleString()} MT</span><br/>
                                <b>Market Share Petral:</b> <span style="font-weight: bold; color: #16A34A; font-family: monospace;">${pct}%</span>
                            </div>
                        `;
                    }
                    if (params.dataType === 'edge') {
                        const d = params.data;
                        const isLaden = d.value > 0;
                        return `
                            <div style="font-family: Inter, sans-serif; padding: 4px;">
                                <b>${d.source} &rarr; ${d.target}</b> <span style="font-size: 11px; color: ${isLaden ? '#10B981' : '#94A3B8'};">(${isLaden ? 'Pierna LADEN / Carga Paga' : 'Pierna BALLAST / Lastre'})</span><br/>
                                <hr style="margin: 6px 0; border-color: #334155;"/>
                                <b>Buque:</b> ${d.vessel}<br/>
                                <b>Viajes Redondos Cerrados:</b> ${d.freq || 1} viaje${(d.freq || 1) > 1 ? 's' : ''}<br/>
                                ${isLaden 
                                    ? `<b>Carga Paga Transportada:</b> <span style="font-weight: bold; color: #10B981; font-family: monospace;">${d.value.toLocaleString()} MT</span>`
                                    : `<b>Estado:</b> <span style="color: #94A3B8;">Re-posicionamiento en Vacío (0 MT Paga)</span>`
                                }
                            </div>
                        `;
                    }
                    if (params.componentType === 'series' && params.seriesType === 'pie') {
                        const d = params.data;
                        if (d.portInfo) {
                            const pi = d.portInfo;
                            const isPetralSlice = params.name.includes('Petral');
                            
                            return `
                                <div style="font-family: Inter, sans-serif;">
                                    <b>${pi.name}</b> - ${isPetralSlice ? 'Operación Petral' : 'Mercado (Sinks/Sources)'}<br/>
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
                    links: selectedMonths.length === 1 ? [] : edges,
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
                ...pieSeries,
                ...missileSeries
            ]
        };
    }, [mapLoaded, data, months, selectedMonths, ports, isDarkMode, showPies, playSpeed]);

    const onEvents = useMemo(() => {
        return {
            click: (params: any) => {
                if (params.componentSubType === 'pie' && params.seriesName && params.seriesName.includes('-Market')) {
                    const portId = params.seriesName.replace('-Market', '');
                    if (onPortClick) {
                        onPortClick(portId);
                    }
                }
            },
            georoam: () => {
                const chartInstance = chartRef.current?.getEchartsInstance();
                if (chartInstance) {
                    const opt = chartInstance.getOption();
                    const geo = opt.geo;
                    const newZoom = Array.isArray(geo) ? geo[0].zoom : geo?.zoom;
                    const newCenter = Array.isArray(geo) ? geo[0].center : geo?.center;
                    
                    if (newZoom !== undefined) {
                        zoomRef.current = newZoom;
                    }
                    if (newCenter !== undefined) {
                        centerRef.current = newCenter;
                    }
                }
            }
        };
    }, [onPortClick]);

    if (!data || !data.aggregated_data) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] w-full bg-white rounded-lg border border-slate-200">
                <p className="text-slate-500 font-medium text-lg">Ingresar o cargar escenario para mostrar herramienta.</p>
            </div>
        );
    }

    if (!mapLoaded || !option) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] w-full">
                <div className="animate-spin h-8 w-8 border-4 border-petral-teal border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-400 font-medium">Cargando Mapa de Espaguetis...</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="flex-1 relative w-full h-full min-h-[600px]">
            <ReactECharts 
                ref={chartRef}
                option={option} 
                style={{ height: '100%', width: '100%', minHeight: '600px' }}
                notMerge={true}
                lazyUpdate={true}
                onEvents={onEvents}
            />
        </div>
    );
};

