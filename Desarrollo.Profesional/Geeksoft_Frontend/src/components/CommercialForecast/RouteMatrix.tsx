import React, { useState, useEffect } from 'react';
import { ForecastService } from '../../services/api';

export const RouteMatrix: React.FC<{ onDragStart: (e: React.DragEvent, route: any) => void }> = ({ onDragStart }) => {
    const [ports, setPorts] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const p = await ForecastService.getPorts();
            const r = await ForecastService.getRoutes();
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
                <table className="w-full text-xs text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="p-1 border bg-slate-50">O \ D</th>
                            {ports.map(p => <th key={p.port_id} className="p-1 border bg-slate-50 font-semibold">{p.port_id}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {ports.map(origin => (
                            <tr key={origin.port_id}>
                                <td className="p-1 border bg-slate-50 font-semibold">{origin.port_id}</td>
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
