import React, { useState, useEffect } from 'react';
import { MasterTemplate } from './MasterTemplate_V2';
import { Map, ChevronDown, ChevronRight, MapPin, Trash2 } from 'lucide-react';
import { ForecastService } from '../../services/api';

export const RouteMaster_V2: React.FC = () => {
    const [routes, setRoutes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const loadRoutes = async () => {
        try {
            setIsLoading(true);
            const data = await ForecastService.getSpotVoyages();
            setRoutes(data || []);
        } catch (error) {
            console.error("Error al cargar maestro de rutas:", error);
            alert("Error al cargar rutas.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRoutes();
    }, []);

    const toggleRow = (routeId: string) => {
        if (expandedRow === routeId) {
            setExpandedRow(null);
        } else {
            setExpandedRow(routeId);
        }
    };

    const handleDeleteRoute = async (spotId: string, routeName: string) => {
        if (!spotId) return;
        const confirmDelete = window.confirm(`¿Está seguro de que desea borrar permanentemente la ruta "${routeName}"?`);
        if (!confirmDelete) return;

        try {
            await ForecastService.deleteSpotVoyage(spotId);
            alert(`Ruta "${routeName}" eliminada exitosamente.`);
            loadRoutes();
        } catch (error) {
            console.error("Error al eliminar la ruta:", error);
            alert("Ocurrió un error al intentar borrar la ruta.");
        }
    };

    return (
        <MasterTemplate 
            title="Maestro de Rutas" 
            subtitle="Listado y detalle de las rutas grabadas desde el Multicotizador"
            activeTab="spot-routes"
            onBackToDashboard={() => window.history.back()}
        >
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                            <Map size={18} className="text-teal-600" />
                            <span>Rutas Disponibles</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                            {routes.length} ruta(s) encontrada(s)
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 w-10"></th>
                                    <th className="px-4 py-3">Cliente</th>
                                    <th className="px-4 py-3">Nombre de Ruta</th>
                                    <th className="px-4 py-3">Creado Por</th>
                                    <th className="px-4 py-3">País</th>
                                    <th className="px-4 py-3">Descripción</th>
                                    <th className="px-4 py-3 text-center">Fecha Creación</th>
                                    <th className="px-4 py-3 text-center w-24">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                            Cargando rutas...
                                        </td>
                                    </tr>
                                ) : routes.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                            No hay rutas grabadas en la base de datos.
                                        </td>
                                    </tr>
                                ) : (
                                    routes.map((route, idx) => {
                                        const routeId = route.route_id || route.spot_id;
                                        const isExpanded = expandedRow === routeId;
                                        // Extraemos los tramos (piernas) del JSON
                                        const tramos = route.legs_data?.tramos || [];
                                        const createdBy = route.created_by || route.legs_data?.created_by || 'izavala@petral.com.pe';

                                        return (
                                            <React.Fragment key={routeId || idx}>
                                                <tr 
                                                    className={`hover:bg-slate-50 transition-colors border-b border-slate-100 ${isExpanded ? 'bg-slate-50' : ''}`}
                                                >
                                                    <td className="px-4 py-3 text-center cursor-pointer" onClick={() => toggleRow(routeId)}>
                                                        {isExpanded ? (
                                                            <ChevronDown size={16} className="text-teal-600 mx-auto" />
                                                        ) : (
                                                            <ChevronRight size={16} className="text-slate-400 mx-auto" />
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-teal-700">
                                                        {route.name ? route.name.split('.')[0] : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-slate-800">
                                                        {route.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-mono font-medium text-slate-600">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700 font-semibold border border-slate-200">
                                                            {createdBy}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                                                            {route.pais || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs">
                                                        {route.description || 'Sin descripción'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-[11px] text-slate-500 font-medium">
                                                        {route.created_at ? new Date(route.created_at).toLocaleString() : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleDeleteRoute(routeId, route.name)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors cursor-pointer"
                                                            title="Eliminar ruta"
                                                        >
                                                            <Trash2 size={13} />
                                                            <span>Borrar</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                                
                                                {/* Fila Expandida: Detalle de Piernas */}
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/50 border-b border-slate-200">
                                                        <td colSpan={8} className="p-0">
                                                            <div className="p-4 pl-14 pr-6">
                                                                <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
                                                                    <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2">
                                                                        <MapPin size={14} className="text-teal-600"/>
                                                                        Itinerario de la Ruta ({tramos.length} tramos)
                                                                    </div>
                                                                    <table className="w-full text-left text-xs">
                                                                        <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                                                                            <tr>
                                                                                <th className="px-3 py-2">Puerto Origen</th>
                                                                                <th className="px-3 py-2">Acción</th>
                                                                                <th className="px-3 py-2 border-l border-slate-200">Puerto Destino</th>
                                                                                <th className="px-3 py-2">Acción</th>
                                                                                <th className="px-3 py-2 border-l border-slate-200 text-right">Dist. (NM)</th>
                                                                                <th className="px-3 py-2 text-center">Clima</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100">
                                                                            {tramos.length === 0 ? (
                                                                                <tr>
                                                                                    <td colSpan={6} className="px-3 py-4 text-center text-slate-500 italic">No hay detalles de tramos en esta ruta.</td>
                                                                                </tr>
                                                                            ) : tramos.map((tr: any, tIdx: number) => {
                                                                                const wfVal = tr.weather_factor ? (tr.weather_factor > 1 ? tr.weather_factor : tr.weather_factor * 100) : 3;
                                                                                return (
                                                                                    <tr key={tIdx} className="hover:bg-slate-50 transition-colors">
                                                                                        <td className="px-3 py-2 font-medium text-slate-700">{tr.origin_port_id}</td>
                                                                                        <td className="px-3 py-2">
                                                                                            {tr.origin_action === 'CARGAR' && <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">Cargar</span>}
                                                                                            {tr.origin_action === 'DESCARGAR' && <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Descargar</span>}
                                                                                            {tr.origin_action === 'NONE' && <span className="text-slate-400">-</span>}
                                                                                        </td>
                                                                                        <td className="px-3 py-2 font-medium text-slate-700 border-l border-slate-100">{tr.destination_port_id}</td>
                                                                                        <td className="px-3 py-2">
                                                                                            {tr.destination_action === 'CARGAR' && <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">Cargar</span>}
                                                                                            {tr.destination_action === 'DESCARGAR' && <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Descargar</span>}
                                                                                            {tr.destination_action === 'NONE' && <span className="text-slate-400">-</span>}
                                                                                        </td>
                                                                                        <td className="px-3 py-2 text-right border-l border-slate-100 tabular-nums font-medium text-slate-600">
                                                                                            {Number(tr.route_distance).toFixed(1)}
                                                                                        </td>
                                                                                        <td className="px-3 py-2 text-center text-[10px] text-slate-500 tabular-nums font-semibold">
                                                                                            {wfVal.toFixed(1)}%
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MasterTemplate>
    );
};
