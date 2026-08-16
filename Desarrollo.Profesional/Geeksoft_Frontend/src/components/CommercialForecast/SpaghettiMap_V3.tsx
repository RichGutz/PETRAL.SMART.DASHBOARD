import React, { useEffect, useState, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';

interface SpaghettiMapProps {
    data?: any;
    activeMonth?: string;
    months?: string[];
    selectedMonths?: string[];
    ports?: any[];
    clients?: any[];
    showPies?: boolean;
    playSpeed?: number;
    onPortClick?: (portId: string | null) => void;
    isDarkMode?: boolean;
}

export const SpaghettiMap_V3: React.FC<SpaghettiMapProps> = ({
    data: propData,
    activeMonth: propActiveMonth,
    months: propMonths,
    selectedMonths: propSelectedMonths,
    ports: propPorts
}) => {
    const context = useForecastContext_V2();
    const data = propData || context.data;
    const months = propMonths || context.dynamicMonths || [];
    const activeMonth = propActiveMonth || (months && months[0]) || '';
    
    const defaultPorts = [
        { port_id: 'CALLAO', port_name: 'Callao', lat: -12.05, lon: -77.15, capacity_mt: 100000, type: 'MIXED' },
        { port_id: 'ILO', port_name: 'Ilo', lat: -17.64, lon: -71.34, capacity_mt: 80000, type: 'SOURCE' },
        { port_id: 'MATARANI', port_name: 'Matarani', lat: -17.00, lon: -72.10, capacity_mt: 75000, type: 'SINK' },
        { port_id: 'MARCONA', port_name: 'Marcona', lat: -15.35, lon: -75.16, capacity_mt: 50000, type: 'SINK' },
        { port_id: 'MEJILLONES', port_name: 'Mejillones', lat: -23.10, lon: -70.45, capacity_mt: 90000, type: 'SINK' },
        { port_id: 'BARQUITO', port_name: 'Barquito', lat: -26.38, lon: -70.69, capacity_mt: 40000, type: 'SINK' }
    ];

    const ports = propPorts && propPorts.length > 0 ? propPorts : defaultPorts;

    const chartRef = useRef<any>(null);
    const [geoJsonLoaded, setGeoJsonLoaded] = useState(false);

    useEffect(() => {
        const fetchGeoJson = async () => {
            try {
                const res = await fetch('/assets/peru_chile_ecuador-BYb8jD7L.json');
                if (res.ok) {
                    const geojson = await res.json();
                    echarts.registerMap('peru_chile_map', geojson);
                    setGeoJsonLoaded(true);
                } else {
                    setGeoJsonLoaded(true);
                }
            } catch (e) {
                setGeoJsonLoaded(true);
            }
        };
        fetchGeoJson();
    }, []);

    const options = useMemo(() => {
        if (!data || !data.aggregated_data) return {};

        const portMap: Record<string, { carga: number; descarga: number }> = {};
        ports.forEach(p => {
            portMap[p.port_id] = { carga: 0, descarga: 0 };
        });

        const activeIndex = months.indexOf(activeMonth);
        const targetMonths = propSelectedMonths && propSelectedMonths.length > 0 
            ? propSelectedMonths 
            : (activeIndex >= 0 ? months.slice(0, activeIndex + 1) : [activeMonth]);

        Object.entries(data.aggregated_data).forEach(([_client, rMap]: any) => {
            if (!rMap || typeof rMap !== 'object') return;
            Object.entries(rMap).forEach(([route, vMap]: any) => {
                if (!vMap || typeof vMap !== 'object') return;
                Object.entries(vMap).forEach(([_vessel, mMap]: any) => {
                    if (!mMap || typeof mMap !== 'object') return;
                    Object.entries(mMap).forEach(([m, metrics]: any) => {
                        if (targetMonths.includes(m)) {
                            const rawFreq = metrics['raw_inputs']?.['monthly_frequency'];
                            const freq = rawFreq !== undefined ? rawFreq : (metrics['freq'] !== undefined ? metrics['freq'] : 1);
                            const carga = (metrics['carga_unit'] || metrics['total_cargo'] || 0) * freq;

                            const parts = route.toUpperCase().split(/[\.\-\s\(\):_]+/).filter(Boolean);
                            const validPorts = parts.filter((pt: string) => ports.some(p => p.port_id.toUpperCase() === pt));
                            
                            if (validPorts.length >= 2) {
                                const orig = validPorts[0];
                                const dest = validPorts[1];
                                if (portMap[orig]) portMap[orig].carga += carga;
                                if (portMap[dest]) portMap[dest].descarga += carga;
                            }
                        }
                    });
                });
            });
        });

        const nodeData = ports.map(p => {
            const pData = portMap[p.port_id] || { carga: 0, descarga: 0 };
            return {
                name: p.port_name || p.port_id,
                value: [p.lon, p.lat, pData.carga + pData.descarga],
                carga: pData.carga,
                descarga: pData.descarga,
                symbolSize: 16
            };
        });

        return {
            backgroundColor: '#0F172A',
            tooltip: {
                trigger: 'item',
                formatter: (params: any) => {
                    if (params.componentType === 'series' && params.seriesType === 'scatter') {
                        return `<div style="font-weight:bold;">${params.name}</div>
                                <div>Carga: ${Math.round(params.data.carga).toLocaleString()} MT</div>
                                <div>Descarga: ${Math.round(params.data.descarga).toLocaleString()} MT</div>`;
                    }
                    return params.name;
                }
            },
            geo: {
                map: geoJsonLoaded ? 'peru_chile_map' : undefined,
                roam: true,
                zoom: 1.2,
                center: [-75.0, -18.0],
                label: { show: false },
                itemStyle: {
                    areaColor: '#1E293B',
                    borderColor: '#334155'
                },
                emphasis: {
                    itemStyle: { areaColor: '#334155' }
                }
            },
            series: [
                {
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    data: nodeData,
                    symbol: 'circle',
                    itemStyle: {
                        color: '#06B6D4',
                        shadowBlur: 10,
                        shadowColor: '#06B6D4'
                    }
                }
            ]
        };
    }, [data, activeMonth, months, propSelectedMonths, ports, geoJsonLoaded]);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-200">🌐 Mapa Spaghetti 2.5D (SPA V3)</span>
                    <span className="text-xs text-slate-500 font-mono">Mes Activo: {activeMonth}</span>
                </div>
            </div>

            <div className="h-[600px] w-full rounded-lg overflow-hidden border border-slate-800">
                {options ? (
                    <ReactECharts ref={chartRef} option={options} style={{ height: '100%', width: '100%' }} />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                        Cargando visualización de mapa...
                    </div>
                )}
            </div>
        </div>
    );
};
