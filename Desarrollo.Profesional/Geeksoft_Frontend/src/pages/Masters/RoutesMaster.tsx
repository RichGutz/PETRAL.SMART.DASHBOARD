import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MasterTemplate } from '../../components/Masters/MasterTemplate';
import { ForecastService } from '../../services/api';
import { Save, AlertCircle, Plus } from 'lucide-react';

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
    const color = "00000".substring(0, 6 - c.length) + c;
    const r = Math.floor((parseInt(color.substring(0, 2), 16) + 255 * 4) / 5);
    const g = Math.floor((parseInt(color.substring(2, 4), 16) + 255 * 4) / 5);
    const b = Math.floor((parseInt(color.substring(4, 6), 16) + 255 * 4) / 5);
    return `rgb(${r}, ${g}, ${b})`;
};

export const RoutesMaster: React.FC = () => {
    const navigate = navigateHook();
    const [allDbPorts, setAllDbPorts] = useState<any[]>([]);
    const [ports, setPorts] = useState<string[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [matrix, setMatrix] = useState<Record<string, Record<string, RouteCell>>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const [newPortId, setNewPortId] = useState("");
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [dragOverItem, setDragOverItem] = useState<string | null>(null);
    const initialOrder = ['TALARA', 'CALLAO', 'MARCONA', 'MATARANI', 'ILO', 'MEJILLONES', 'BARQUITO'];

    function navigateHook() {
        try {
            return useNavigate();
        } catch {
            return () => {};
        }
    }

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [portsData, routesData] = await Promise.all([
                    ForecastService.getPorts(),
                    ForecastService.getRoutes()
                ]);

                setAllDbPorts(portsData);
                
                const validPorts = initialOrder.filter(po => portsData.some((p: any) => p.port_id === po));
                setPorts(validPorts);
                setRoutes(routesData);

                const mat: Record<string, Record<string, RouteCell>> = {};
                
                validPorts.forEach(p1 => {
                    mat[p1] = {};
                    validPorts.forEach(p2 => {
                        if (p1 !== p2) {
                            mat[p1][p2] = {
                                port_a: p1 < p2 ? p1 : p2,
                                port_b: p1 < p2 ? p2 : p1,
                                route_distance: 0,
                                weather_factor_laden: 0.03,
                                weather_factor_ballast: 0.03
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
                    weather_factor_ballast: 0.03
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
        } catch (error) {
            console.error("Error saving routes:", error);
            alert("Error al guardar las rutas");
        } finally {
            setIsSaving(false);
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

    if (loading) {
        return (
            <MasterTemplate title="Maestro de Rutas" activeTab="routes">
                <div className="flex items-center justify-center h-64 text-slate-500 font-bold">Cargando matriz de rutas...</div>
            </MasterTemplate>
        );
    }

    const availablePortsToAdd = allDbPorts.filter(p => !ports.includes(p.port_id));

    return (
        <MasterTemplate title="Maestro de Rutas" subtitle="Gestión de distancias y fricción climática (Matriz No Dirigida)" activeTab="routes">
            <div className="flex flex-col gap-4">
                
                {/* Header Actions */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-blue-500" />
                        <span className="text-xs text-slate-600 font-medium">La matriz es espejo. Arrastra las cabeceras (filas o columnas) para reordenar la tabla.</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <input 
                                type="text"
                                placeholder="NOMBRE DEL PUERTO"
                                value={newPortId} 
                                onChange={(e) => setNewPortId(e.target.value.toUpperCase())}
                                className="h-8 w-40 text-xs border border-slate-300 rounded px-2 outline-none focus:border-blue-500 font-bold uppercase"
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddPort(); }}
                            />
                            <button 
                                onClick={handleAddPort}
                                disabled={!newPortId.trim()}
                                className="flex items-center gap-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <Plus size={14} /> Agregar
                            </button>
                        </div>
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
                                        const bgColor = getTwinColor(rowPort, colPort);
                                        
                                        return (
                                            <td key={colPort} className="p-2 border-b border-r border-slate-200" style={{ backgroundColor: bgColor }}>
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

            </div>
        </MasterTemplate>
    );
};
