import React, { useEffect, useState, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Save, AlertCircle, Plus, Compass } from 'lucide-react';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';

interface RouteCell {
    port_a: string;
    port_b: string;
    route_distance: number;
    weather_factor_laden: number;
    weather_factor_ballast: number;
    color_hex?: string;
    pais?: string;
}

const getTwinColor = (p1: string, p2: string) => {
    const pair = p1 < p2 ? `${p1}-${p2}` : `${p2}-${p1}`;
    let hash = 0;
    for (let i = 0; i < pair.length; i++) {
        hash = pair.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return `#` + ("000000" + c).slice(-6);
};


export const RoutesMaster: React.FC = () => {
    const [ports, setPorts] = useState<string[]>([]);
    const [dbPorts, setDbPorts] = useState<any[]>([]);
    const [matrix, setMatrix] = useState<Record<string, Record<string, RouteCell>>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [isEstimating, setIsEstimating] = useState(false);

    const [newPortId, setNewPortId] = useState("");
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [dragOverItem, setDragOverItem] = useState<string | null>(null);

    const [contextMenu, setContextMenu] = useState<{port: string, x: number, y: number} | null>(null);
    const [cellContextMenu, setCellContextMenu] = useState<{rowPort: string, colPort: string, x: number, y: number} | null>(null);


    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.context-menu-container')) {
                setContextMenu(null);
                setCellContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [portsData, routesData] = await Promise.all([
                ForecastService.getPorts(),
                ForecastService.getRoutes()
            ]);

            setDbPorts(portsData || []);

            // Ordenar todos los puertos geográficamente de Norte a Sur (de mayor a menor latitud)
            const sortedPortsData = [...(portsData || [])].sort((a, b) => {
                const latA = a.lat !== undefined && a.lat !== null ? parseFloat(a.lat) : 0;
                const latB = b.lat !== undefined && b.lat !== null ? parseFloat(b.lat) : 0;
                return latB - latA; // De mayor a menor (Norte a Sur)
            });

            const sortedPorts = sortedPortsData.map((p: any) => p.port_id);
            setPorts(sortedPorts);

            const mat: Record<string, Record<string, RouteCell>> = {};
            
            sortedPorts.forEach(p1 => {
                mat[p1] = {};
                sortedPorts.forEach(p2 => {
                    if (p1 !== p2) {
                        mat[p1][p2] = {
                            port_a: p1 < p2 ? p1 : p2,
                            port_b: p1 < p2 ? p2 : p1,
                            route_distance: 0,
                            weather_factor_laden: 0.03,
                            weather_factor_ballast: 0.03,
                            color_hex: getTwinColor(p1, p2)
                        };
                    }
                });
            });

            routesData.forEach((r: any) => {
                const p1 = r.port_a;
                const p2 = r.port_b;
                if (mat[p1] && mat[p1][p2]) {
                    mat[p1][p2] = { ...r };
                }
                if (mat[p2] && mat[p2][p1]) {
                    mat[p2][p1] = { ...r };
                }
            });

            setMatrix(mat);
        } catch (error) {
            console.error("Error loading routes master:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);


    const handleCellChange = (p1: string, p2: string, field: keyof RouteCell, value: string) => {
        const numValue = parseFloat(value) || 0;
        
        setMatrix(prev => {
            const next = { ...prev };
            if (!next[p1]) next[p1] = {};
            if (!next[p2]) next[p2] = {};
            next[p1] = { ...next[p1], [p2]: { ...next[p1][p2], [field]: numValue, port_a: p1 < p2 ? p1 : p2, port_b: p1 < p2 ? p2 : p1 } };
            next[p2] = { ...next[p2], [p1]: { ...next[p2][p1], [field]: numValue, port_a: p1 < p2 ? p1 : p2, port_b: p1 < p2 ? p2 : p1 } };
            return next;
        });
        setHasChanges(true);
    };

    const handleAddPort = () => {
        const portName = newPortId.trim().toUpperCase();
        if (!portName || ports.includes(portName)) return;
        setPorts(prev => [...prev, portName]);
        
        setMatrix(prev => {
            const next = { ...prev };
            next[portName] = {};
            ports.forEach(p => {
                const cell = {
                    port_a: p < portName ? p : portName,
                    port_b: p < portName ? portName : p,
                    route_distance: 0,
                    weather_factor_laden: 0.03,
                    weather_factor_ballast: 0.03,
                    color_hex: getTwinColor(p, portName)
                };
                if (!next[p]) next[p] = {};
                next[p][portName] = cell;
                next[portName][p] = cell;
            });
            return next;
        });
        setNewPortId("");
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const payload: RouteCell[] = [];
            
            const seen = new Set<string>();
            ports.forEach(p1 => {
                ports.forEach(p2 => {
                    if (p1 !== p2) {
                        const cell = matrix[p1][p2];
                        if (cell) {
                            const key = `${cell.port_a}-${cell.port_b}`;
                            if (!seen.has(key)) {
                                if (cell.route_distance > 0) {
                                    payload.push(cell);
                                }
                                seen.add(key);
                            }
                        }
                    }
                });
            });

            await ForecastService.saveRoutes(payload);
            setHasChanges(false);
            alert("Rutas guardadas exitosamente!");
            await loadData();
        } catch (error) {
            console.error("Error saving routes:", error);
            alert("Error al guardar las rutas");
        } finally {
            setIsSaving(false);
        }

    };

    const handleEstimateRoutes = async () => {
        try {
            setIsEstimating(true);
            
            const portCoordsMap: Record<string, { lat: number, lon: number }> = {};
            dbPorts.forEach(p => {
                if (p.lat !== undefined && p.lon !== undefined && p.lat !== null && p.lon !== null) {
                    portCoordsMap[p.port_id] = { lat: Number(p.lat), lon: Number(p.lon) };
                }
            });

            const routesToEstimate: Array<{ origin: string, destination: string, lat_a: number, lon_a: number, lat_b: number, lon_b: number }> = [];

            ports.forEach(p1 => {
                ports.forEach(p2 => {
                    if (p1 !== p2) {
                        const cell = matrix[p1]?.[p2];
                        if (!cell || !cell.route_distance || cell.route_distance <= 0) {
                            const c1 = portCoordsMap[p1];
                            const c2 = portCoordsMap[p2];
                            if (c1 && c2 && c1.lat !== undefined && c1.lon !== undefined && c2.lat !== undefined && c2.lon !== undefined) {
                                routesToEstimate.push({
                                    origin: p1,
                                    destination: p2,
                                    lat_a: c1.lat,
                                    lon_a: c1.lon,
                                    lat_b: c2.lat,
                                    lon_b: c2.lon
                                });
                            }
                        }
                    }
                });
            });

            if (routesToEstimate.length === 0) {
                alert("Todas las rutas de la grilla ya tienen distancias configuradas o falta cargar coordenadas lat/lon en los puertos.");
                return;
            }

            const response = await ForecastService.estimateRoutesDistances({ routes: routesToEstimate });
            const results = response.results || [];

            if (results.length > 0) {
                setMatrix(prev => {
                    const next = { ...prev };
                    results.forEach((res: any) => {
                        const p1 = res.origin;
                        const p2 = res.destination;
                        const dist = res.distance;

                        if (!next[p1]) next[p1] = {};
                        if (!next[p2]) next[p2] = {};

                        const currentCell1 = next[p1][p2] || {
                            port_a: p1 < p2 ? p1 : p2,
                            port_b: p1 < p2 ? p2 : p1,
                            weather_factor_laden: 0.03,
                            weather_factor_ballast: 0.03,
                            color_hex: getTwinColor(p1, p2)
                        };
                        next[p1][p2] = {
                            ...currentCell1,
                            route_distance: dist
                        };

                        const currentCell2 = next[p2][p1] || {
                            port_a: p1 < p2 ? p1 : p2,
                            port_b: p1 < p2 ? p2 : p1,
                            weather_factor_laden: 0.03,
                            weather_factor_ballast: 0.03,
                            color_hex: getTwinColor(p1, p2)
                        };
                        next[p2][p1] = {
                            ...currentCell2,
                            route_distance: dist
                        };
                    });
                    return next;
                });

                setHasChanges(true);
                alert(`¡Se estimaron con éxito ${results.length} rutas mediante SeaRoute! Revisa las distancias en la grilla y presiona 'Guardar Cambios' para persistirlas en Supabase.`);
            } else {
                alert("No se obtuvieron resultados de estimación.");
            }
        } catch (error) {
            console.error("Error estimating routes:", error);
            alert("Ocurrió un error al estimar las rutas marítimas.");
        } finally {
            setIsEstimating(false);
        }
    };

    const onDragStart = (e: React.DragEvent, port: string) => {
        setDraggedItem(port);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e: React.DragEvent, port: string) => {
        e.preventDefault();
        if (dragOverItem !== port) setDragOverItem(port);
    };

    const onDragLeave = (port: string) => {
        if (dragOverItem === port) setDragOverItem(null);
    };

    const onDrop = (e: React.DragEvent, targetPort: string) => {
        e.preventDefault();
        if (draggedItem && draggedItem !== targetPort) {
            setPorts(prev => {
                const newPorts = [...prev];
                const fromIdx = newPorts.indexOf(draggedItem);
                const toIdx = newPorts.indexOf(targetPort);
                newPorts.splice(fromIdx, 1);
                newPorts.splice(toIdx, 0, draggedItem);
                return newPorts;
            });
            setHasChanges(true);
        }
        setDraggedItem(null);
        setDragOverItem(null);
    };

    const onDragEnd = () => {
        setDraggedItem(null);
        setDragOverItem(null);
    };

    const handleContextMenu = (e: React.MouseEvent, port: string) => {
        e.preventDefault();
        setCellContextMenu(null);
        setContextMenu({ port, x: e.pageX, y: e.pageY });
    };

    const handleCellContextMenu = (e: React.MouseEvent, rowPort: string, colPort: string) => {
        e.preventDefault();
        setContextMenu(null);
        setCellContextMenu({ rowPort, colPort, x: e.pageX, y: e.pageY });
    };

    const handleDeletePort = () => {
        if (contextMenu) {
            setPorts(prev => prev.filter(p => p !== contextMenu.port));
            setHasChanges(true);
            setContextMenu(null);
        }
    };

    const exportData = useMemo(() => {
        const list: any[] = [];
        const seen = new Set<string>();
        Object.keys(matrix).forEach(portA => {
            Object.keys(matrix[portA] || {}).forEach(portB => {
                if (portA === portB) return;
                const pairKey = portA < portB ? `${portA}-${portB}` : `${portB}-${portA}`;
                if (seen.has(pairKey)) return;
                seen.add(pairKey);

                const cell = matrix[portA][portB];
                if (cell && cell.route_distance > 0) {
                    list.push({
                        port_a: portA,
                        port_b: portB,
                        route_distance: cell.route_distance,
                        weather_factor_laden: cell.weather_factor_laden,
                        weather_factor_ballast: cell.weather_factor_ballast
                    });
                }
            });
        });
        return list;
    }, [matrix]);

    const exportColumns: ExportColumn[] = [
        { header: 'Puerto Origen', key: 'port_a', type: 'string' },
        { header: 'Puerto Destino', key: 'port_b', type: 'string' },
        { header: 'Distancia (Millas Náuticas)', key: 'route_distance', type: 'number' },
        { header: 'Fricción Clima Cargado (%)', key: 'weather_factor_laden', type: 'percent' },
        { header: 'Fricción Clima Lastre (%)', key: 'weather_factor_ballast', type: 'percent' }
    ];

    const handleExportExcel = () => {
        exportMasterToExcel('Maestro de Distancias y Rutas', exportColumns, exportData);
    };

    const handleExportPDF = () => {
        exportMasterToPDF('Maestro de Distancias y Rutas', exportColumns, exportData);
    };

    if (loading) {
        return (
            <MasterTemplate title="Maestro de Distancias" activeTab="routes">
                <div className="flex items-center justify-center h-64 text-slate-500 font-bold">Cargando matriz de navegación...</div>
            </MasterTemplate>
        );
    }

    return (
        <MasterTemplate 
            title="Maestro de Distancias" 
            subtitle="Gestión de distancias y fricción climática (Matriz No Dirigida)" 
            activeTab="routes"
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
        >
            <div className="flex flex-col gap-4">
                
                {/* Header Actions */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-blue-500" />
                        <span className="text-xs text-slate-600 font-medium">La matriz es espejo. Arrastra las cabeceras (filas o columnas) para reordenar la tabla.</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <select 
                                value={newPortId} 
                                onChange={(e) => setNewPortId(e.target.value)}
                                className="h-8 w-56 text-xs border border-slate-300 rounded px-2 outline-none focus:border-blue-500 font-bold bg-white text-slate-700"
                            >
                                <option value="">-- SELECCIONAR PUERTO --</option>
                                {dbPorts
                                    .filter((p: any) => !ports.includes(p.port_id))
                                    .map((p: any) => (
                                        <option key={p.port_id} value={p.port_id}>
                                            {p.port_name || p.port_id} ({p.port_id})
                                        </option>
                                    ))}
                            </select>
                            <button 
                                onClick={handleAddPort}
                                disabled={!newPortId}
                                className="flex items-center gap-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <Plus size={14} /> Agregar
                            </button>
                        </div>
                        <button 
                            onClick={handleEstimateRoutes}
                            disabled={isEstimating || isSaving}
                            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                            <Compass size={14} className={isEstimating ? "animate-spin" : ""} />
                            {isEstimating ? "Estimando..." : "Estimar Rutas"}
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                            <Save size={14} />
                            {isSaving ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                </div>

                {/* Matrix Container */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr>
                                <th className="bg-slate-100 p-2 border-b border-r border-slate-200 font-black text-slate-400 text-center sticky left-0 z-10 w-24">
                                    {/* Esquina superior izquierda vacía */}
                                </th>
                                {ports.map(p => (
                                    <th 
                                        key={p} 
                                        draggable
                                        onDragStart={(e) => onDragStart(e, p)}
                                        onDragOver={(e) => onDragOver(e, p)}
                                        onDragLeave={() => onDragLeave(p)}
                                        onDrop={(e) => onDrop(e, p)}
                                        onDragEnd={onDragEnd}
                                        onContextMenu={(e) => handleContextMenu(e, p)}
                                        className={`bg-slate-50 p-2 border-b border-r border-slate-200 font-black text-slate-700 text-center min-w-[140px] cursor-grab active:cursor-grabbing transition-colors
                                            ${draggedItem === p ? 'opacity-30 border-dashed' : ''} 
                                            ${dragOverItem === p && draggedItem !== p ? 'bg-blue-50 border-x-2 border-x-blue-600 scale-105 shadow-sm' : ''}
                                        `}
                                    >
                                        {p}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ports.map((rowPort) => (
                                <tr key={rowPort} className="hover:bg-slate-50">
                                    {/* Header Row */}
                                    <td 
                                        draggable
                                        onDragStart={(e) => onDragStart(e, rowPort)}
                                        onDragOver={(e) => onDragOver(e, rowPort)}
                                        onDragLeave={() => onDragLeave(rowPort)}
                                        onDrop={(e) => onDrop(e, rowPort)}
                                        onDragEnd={onDragEnd}
                                        onContextMenu={(e) => handleContextMenu(e, rowPort)}
                                        className={`bg-slate-50 p-2 border-b border-r border-slate-200 font-black text-slate-700 text-center sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0] cursor-grab active:cursor-grabbing transition-colors
                                            ${draggedItem === rowPort ? 'opacity-30 border-dashed' : ''} 
                                            ${dragOverItem === rowPort && draggedItem !== rowPort ? 'bg-blue-50 border-y-2 border-y-blue-600 scale-105 shadow-sm' : ''}
                                        `}
                                    >
                                        {rowPort}
                                    </td>
                                    
                                    {/* Data Cells */}
                                    {ports.map((colPort) => {
                                        if (rowPort === colPort) {
                                            return (
                                                <td key={colPort} className="p-2 border-b border-r border-slate-200 bg-slate-200/50 text-center text-slate-400 font-bold">
                                                    —
                                                </td>
                                            );
                                        }

                                        const cell = matrix[rowPort]?.[colPort];
                                        const bgColor = cell?.color_hex || getTwinColor(rowPort, colPort);
                                        
                                        return (
                                            <td 
                                                key={colPort} 
                                                className="p-2 border-b border-r border-slate-200 cursor-context-menu" 
                                                style={{ backgroundColor: bgColor }}
                                                onContextMenu={(e) => handleCellContextMenu(e, rowPort, colPort)}
                                            >
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] text-slate-500 font-bold">Dist (NM):</span>
                                                        <input 
                                                            type="number"
                                                            value={cell?.route_distance || ""}
                                                            onChange={(e) => handleCellChange(rowPort, colPort, 'route_distance', e.target.value)}
                                                            className="w-16 h-5 border border-white/50 bg-white/70 rounded px-1 text-right font-mono text-[10px] text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white shadow-sm"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] text-slate-500 font-bold">W-Laden:</span>
                                                        <div className="relative">
                                                            <input 
                                                                type="number"
                                                                step="0.1"
                                                                value={cell?.weather_factor_laden != null ? parseFloat((cell.weather_factor_laden * 100).toFixed(2)) : ""}
                                                                onChange={(e) => handleCellChange(rowPort, colPort, 'weather_factor_laden', (parseFloat(e.target.value) / 100).toString())}
                                                                className="w-16 h-5 border border-white/50 bg-white/70 rounded px-1 pr-3 text-right font-mono text-[10px] text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white shadow-sm"
                                                            />
                                                            <span className="absolute right-1 top-0.5 text-[9px] text-slate-400 pointer-events-none font-bold">%</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] text-slate-500 font-bold">W-Ballast:</span>
                                                        <div className="relative">
                                                            <input 
                                                                type="number"
                                                                step="0.1"
                                                                value={cell?.weather_factor_ballast != null ? parseFloat((cell.weather_factor_ballast * 100).toFixed(2)) : ""}
                                                                onChange={(e) => handleCellChange(rowPort, colPort, 'weather_factor_ballast', (parseFloat(e.target.value) / 100).toString())}
                                                                className="w-16 h-5 border border-white/50 bg-white/70 rounded px-1 pr-3 text-right font-mono text-[10px] text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white shadow-sm"
                                                            />
                                                            <span className="absolute right-1 top-0.5 text-[9px] text-slate-400 pointer-events-none font-bold">%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Custom Context Menu for Ports */}
                {contextMenu && (
                    <div 
                        className="fixed bg-white border border-slate-200 shadow-xl rounded-md py-1 z-50 min-w-[150px] context-menu-container"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button 
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors"
                            onClick={handleDeletePort}
                        >
                            Borrar "{contextMenu.port}"
                        </button>
                    </div>
                )}

                {/* Custom Context Menu for Matrix Cells (Color Hex) */}
                {cellContextMenu && (
                    <div 
                        className="fixed bg-white border border-slate-200 shadow-xl rounded-md p-3 z-50 min-w-[200px] context-menu-container flex flex-col gap-3"
                        style={{ top: cellContextMenu.y, left: cellContextMenu.x }}
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Modificar Color de Ruta</span>
                            <span className="text-xs font-black text-slate-800">{cellContextMenu.rowPort} - {cellContextMenu.colPort}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <input 
                                type="color" 
                                className="h-8 w-12 cursor-pointer rounded border border-slate-300 p-0.5" 
                                value={matrix[cellContextMenu.rowPort]?.[cellContextMenu.colPort]?.color_hex || '#cccccc'} 
                                onChange={(e) => handleCellChange(cellContextMenu.rowPort, cellContextMenu.colPort, 'color_hex', e.target.value)} 
                            />
                            <span className="text-xs font-mono text-slate-600 font-bold uppercase">{matrix[cellContextMenu.rowPort]?.[cellContextMenu.colPort]?.color_hex || '#CCCCCC'}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 leading-tight">Usa el botón "Guardar Cambios" arriba para grabar el color en la base de datos.</span>
                    </div>
                )}
            </div>
        </MasterTemplate>
    );
};
