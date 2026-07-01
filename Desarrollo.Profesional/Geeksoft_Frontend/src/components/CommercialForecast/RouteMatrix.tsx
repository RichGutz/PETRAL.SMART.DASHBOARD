import React, { useState, useEffect } from 'react';
import { ForecastService } from '../../services/api';

export const RouteMatrix: React.FC<{ onDragStart: (e: React.DragEvent, route: any) => void }> = ({ onDragStart }) => {
    const [ports, setPorts] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const p = await ForecastService.getPorts();
            const r = await ForecastService.getRoutes();
            
            // Ordenar puertos de norte a sur: Talara, Callao, Marcona, Matarani, Ilo, Mejillones y Barquito
            const order = ['TALARA', 'CALLAO', 'MARCONA', 'MATARANI', 'ILO', 'MEJILLONES', 'BARQUITO'];
            p.sort((a: any, b: any) => {
                const idxA = order.indexOf(a.port_id.toUpperCase());
                const idxB = order.indexOf(b.port_id.toUpperCase());
                if (idxA === -1 && idxB === -1) return 0;
                if (idxA === -1) return 1;
                if (idxB === -1) return -1;
                return idxA - idxB;
            });

            setPorts(p);
            setRoutes(r);
        };
        load();
    }, []);

    const getRoute = (origin: string, dest: string) => {
        return routes.find(r => r.origin_port_id === origin && r.destination_port_id === dest);
    };

    return (
        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-slate-700 text-sm">
                Matriz de Rutas (Drag & Drop)
            </div>
            <div className="flex-1 overflow-auto p-2">
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                    <thead>
                        {/* Fila 1: Título Horizontal Destino */}
                        <tr>
                            <th colSpan={2} className="border bg-slate-50"></th>
                            <th 
                                colSpan={ports.length} 
                                className="p-1 border bg-teal-50 border-teal-100 font-bold text-center text-teal-800 tracking-widest uppercase text-[10px]"
                            >
                                Destino
                            </th>
                        </tr>
                        {/* Fila 2: Cabeceras de puertos de destino */}
                        <tr>
                            <th className="p-1 border bg-slate-50"></th>
                            <th className="p-1 border bg-slate-50 font-semibold text-slate-500 text-center text-[10px]">O \ D</th>
                            {ports.map(p => <th key={p.port_id} className="p-1 border bg-slate-50 font-semibold text-slate-600 text-center">{p.port_id}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {ports.map((origin, idx) => (
                            <tr key={origin.port_id}>
                                {/* Celda vertical Origen (solo se renderiza en la primera fila con rowSpan) */}
                                {idx === 0 && (
                                    <td 
                                        rowSpan={ports.length} 
                                        className="p-2 border bg-indigo-50 border-indigo-100 font-bold text-center text-indigo-800 select-none text-[10px] tracking-widest uppercase align-middle"
                                        style={{ 
                                            writingMode: 'vertical-rl', 
                                            transform: 'rotate(180deg)',
                                            textAlign: 'center'
                                        }}
                                    >
                                        Origen
                                    </td>
                                )}
                                <td className="p-1 border bg-slate-50 font-semibold text-slate-600 text-center">{origin.port_id}</td>
                                {ports.map(dest => {
                                    const route = getRoute(origin.port_id, dest.port_id);
                                    if (!route) return <td key={dest.port_id} className="p-1 border bg-slate-100 text-center text-slate-400">-</td>;
                                    
                                    return (
                                        <td 
                                            key={dest.port_id} 
                                            className="p-1 border text-center hover:bg-blue-50 cursor-grab"
                                            draggable
                                            onDragStart={(e) => onDragStart(e, route)}
                                        >
                                            <div className="font-bold text-petral-teal">{route.route_distance} NM</div>
                                            <div className="text-[9px] text-slate-500">W: {route.weather_factor_laden} / {route.weather_factor_ballast}</div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
