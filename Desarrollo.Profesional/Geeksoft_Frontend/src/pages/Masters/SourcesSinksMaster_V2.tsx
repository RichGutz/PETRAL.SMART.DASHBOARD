import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Anchor, Save, Plus, Trash2, Compass, Layers } from 'lucide-react';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';

interface GroupedRow {
    empresa: string;
    producto: string;
    color_hex: string;
    capacities: { [year: number]: number };
    isNew?: boolean;
    // Guardamos la empresa/producto original por si cambiamos el nombre (parte de PK)
    originalEmpresa?: string;
    originalProducto?: string;
}

export const SourcesSinksMaster_V2: React.FC = () => {
    const navigate = navigateHook();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Maestros
    const [ports, setPorts] = useState<any[]>([]);
    const [dbData, setDbData] = useState<any[]>([]);
    const [clientsMaster, setClientsMaster] = useState<any[]>([]);
    const [rawClients, setRawClients] = useState<any[]>([]);
    const [filterActivo, setFilterActivo] = useState(true);
    const [filterProspecto, setFilterProspecto] = useState(false);
    
    // Configuración de Años (Arranca en 2026, se agregan dinámicamente)
    const [years, setYears] = useState<number[]>([2026, 2027, 2028, 2029, 2030]);
    
    // Selección Activa
    const [activePortId, setActivePortId] = useState('');
    const [activeType, setActiveType] = useState<'SOURCE' | 'SINK'>('SOURCE');
    
    // Estado de la tabla agrupada por empresa + producto
    const [tableRows, setTableRows] = useState<GroupedRow[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    function navigateHook() {
        try {
            return useNavigate();
        } catch {
            return () => {};
        }
    }

    const fetchData = async () => {
        try {
            setLoading(true);
            const [portsData, sourcesSinksData, clientsMasterData] = await Promise.all([
                ForecastService.getPorts(),
                ForecastService.getSourcesSinks(),
                ForecastService.getClientsMaster()
            ]);
            
            // Ordenar todos los puertos geográficamente de Norte a Sur (de mayor a menor latitud)
            const sortedPorts = [...(portsData || [])].sort((a: any, b: any) => {
                const latA = a.lat !== undefined && a.lat !== null ? parseFloat(a.lat) : 0;
                const latB = b.lat !== undefined && b.lat !== null ? parseFloat(b.lat) : 0;
                return latB - latA; // De mayor a menor (Norte a Sur)
            });

            setPorts(sortedPorts);
            setDbData(sourcesSinksData);
            setRawClients(clientsMasterData || []);
            
            // Detectar si hay más años guardados en la BD y agregarlos al listado
            const dbYears = sourcesSinksData.map((row: any) => row.year);
            const allYears = Array.from(new Set([2026, 2027, 2028, 2029, 2030, ...dbYears])).sort((a, b) => a - b);
            setYears(allYears);
            
            if (sortedPorts.length > 0 && !activePortId) {
                setActivePortId(sortedPorts[0].port_id);
            }
        } catch (error) {
            console.error("Error al cargar datos de Sinks & Sources:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = rawClients;
        if (filterActivo && !filterProspecto) {
            filtered = rawClients.filter(c => c.is_active !== false);
        } else if (!filterActivo && filterProspecto) {
            filtered = rawClients.filter(c => c.is_prospect === true);
        } else if (!filterActivo && !filterProspecto) {
            filtered = [];
        }
        setClientsMaster(filtered);
    }, [rawClients, filterActivo, filterProspecto]);

    const toggleActivo = () => {
        setFilterActivo(prev => {
            if (prev && !filterProspecto) return prev;
            return !prev;
        });
    };

    const toggleProspecto = () => {
        setFilterProspecto(prev => {
            if (prev && !filterActivo) return prev;
            return !prev;
        });
    };

    // Al cambiar de puerto o cargarse datos, auto-seleccionar el tipo que tenga información
    useEffect(() => {
        if (!activePortId || dbData.length === 0) return;
        
        const hasActiveTypeData = dbData.some(row => 
            row.port_id === activePortId && 
            row.type === activeType
        );
        
        if (!hasActiveTypeData) {
            const otherType = activeType === 'SOURCE' ? 'SINK' : 'SOURCE';
            const hasOtherTypeData = dbData.some(row => 
                row.port_id === activePortId && 
                row.type === otherType
            );
            
            if (hasOtherTypeData) {
                setActiveType(otherType);
            }
        }
    }, [activePortId, dbData]);

    // Agrupar los datos de la base de datos para mostrarlos en filas
    useEffect(() => {
        if (!activePortId) return;
        
        // Filtrar datos que coincidan con el Puerto y Tipo activo
        const filtered = dbData.filter(row => 
            row.port_id === activePortId && 
            row.type === activeType
        );
        
        // Agrupar por (empresa, producto)
        const groups: { [key: string]: GroupedRow } = {};
        
        filtered.forEach(row => {
            const key = `${row.empresa.toUpperCase()}||${row.producto.toUpperCase()}`;
            if (!groups[key]) {
                groups[key] = {
                    empresa: row.empresa,
                    producto: row.producto,
                    color_hex: row.color_hex || '#3b82f6',
                    capacities: {},
                    isNew: false,
                    originalEmpresa: row.empresa,
                    originalProducto: row.producto
                };
            }
            groups[key].capacities[row.year] = Number(row.capacity_mt || 0);
        });
        
        // Convertir objeto agrupado a array
        const rowsArray = Object.values(groups);
        setTableRows(rowsArray);
        setIsDirty(false);
    }, [activePortId, activeType, dbData]);

    const handleRowFieldChange = (index: number, field: keyof GroupedRow, value: any) => {
        setTableRows(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
        setIsDirty(true);
    };

    const handleCapacityChange = (rowIndex: number, year: number, value: string) => {
        const numVal = parseFloat(value) || 0;
        setTableRows(prev => {
            const copy = [...prev];
            copy[rowIndex] = {
                ...copy[rowIndex],
                capacities: {
                    ...copy[rowIndex].capacities,
                    [year]: numVal
                }
            };
            return copy;
        });
        setIsDirty(true);
    };

    const handleAddRow = () => {
        // Inicializar capacidades vacías para todos los años del listado
        const initCapacities: { [year: number]: number } = {};
        years.forEach(y => {
            initCapacities[y] = 0;
        });

        const newRow: GroupedRow = {
            empresa: '',
            producto: 'H2SO4',
            color_hex: '#3b82f6',
            capacities: initCapacities,
            isNew: true
        };
        
        setTableRows(prev => [...prev, newRow]);
        setIsDirty(true);
    };

    const handleDeleteRow = async (index: number) => {
        const row = tableRows[index];
        if (row.isNew) {
            setTableRows(prev => prev.filter((_, i) => i !== index));
            return;
        }
        
        if (confirm(`¿Estás seguro de eliminar por completo a la empresa "${row.originalEmpresa}" para el producto "${row.originalProducto}" en todos sus años?`)) {
            try {
                setSaving(true);
                // Si la fila ya existía en la base de datos, debemos borrarla para todos los años
                await Promise.all(years.map(y => 
                    ForecastService.deleteSourceSink({
                        port_id: activePortId,
                        year: y,
                        empresa: row.originalEmpresa || row.empresa,
                        producto: row.originalProducto || row.producto
                    }).catch(err => console.error(`Error al borrar año ${y}:`, err))
                ));
                
                await fetchData();
            } catch (error) {
                console.error("Error al eliminar fila:", error);
                alert("Ocurrió un error al eliminar.");
            } finally {
                setSaving(false);
            }
        }
    };

    const handleSave = async () => {
        // Validar campos vacíos
        const hasEmpty = tableRows.some(row => !row.empresa.trim() || !row.producto.trim());
        if (hasEmpty) {
            alert("Los campos Empresa y Producto no pueden estar vacíos.");
            return;
        }

        try {
            setSaving(true);
            const payload: any[] = [];
            
            // Si una fila existente cambió de nombre de empresa o producto (que son PK),
            // debemos borrar los registros originales primero para evitar duplicados huérfanos.
            for (const row of tableRows) {
                const renamed = !row.isNew && 
                    ((row.empresa.trim().toUpperCase() !== row.originalEmpresa?.toUpperCase()) || 
                     (row.producto.trim().toUpperCase() !== row.originalProducto?.toUpperCase()));
                
                if (renamed) {
                    // Borrar el registro con la llave compuesta anterior para todos los años
                    await Promise.all(years.map(y => 
                        ForecastService.deleteSourceSink({
                            port_id: activePortId,
                            year: y,
                            empresa: row.originalEmpresa!,
                            producto: row.originalProducto!
                        }).catch(err => console.error("Error al borrar llave previa:", err))
                    ));
                }
            }

            // Armar el payload plano (un registro por cada combinación fila-año)
            tableRows.forEach(row => {
                years.forEach(y => {
                    payload.push({
                        port_id: activePortId,
                        year: y,
                        capacity_mt: Number(row.capacities[y] || 0),
                        type: activeType,
                        empresa: row.empresa.trim(),
                        color_hex: row.color_hex || '#3b82f6',
                        producto: row.producto.trim()
                    });
                });
            });
            
            await ForecastService.saveSourcesSinks(payload);
            setIsDirty(false);
            await fetchData();
            alert("Datos maestros guardados correctamente.");
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("No se pudieron guardar los datos.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddYear = () => {
        const yearInput = prompt("Ingrese el nuevo año a habilitar en el horizonte (Ej: 2031):");
        if (yearInput) {
            const newYear = parseInt(yearInput);
            if (isNaN(newYear) || newYear < 2000 || newYear > 2100) {
                alert("Año inválido.");
                return;
            }
            if (years.includes(newYear)) {
                alert("El año ya existe.");
                return;
            }
            
            // Añadir año al listado y actualizar el estado de las filas locales
            const sortedYears = [...years, newYear].sort((a, b) => a - b);
            setYears(sortedYears);
            setTableRows(prev => prev.map(row => ({
                ...row,
                capacities: {
                    ...row.capacities,
                    [newYear]: 0
                }
            })));
            setIsDirty(true);
        }
    };

    const exportData = useMemo(() => {
        const groups: { [key: string]: any } = {};
        dbData.forEach(row => {
            const portObj = ports.find(p => p.port_id === row.port_id);
            const portName = portObj ? portObj.port_name : row.port_id;
            const key = `${row.port_id}||${row.type}||${row.empresa.toUpperCase()}||${row.producto.toUpperCase()}`;
            if (!groups[key]) {
                groups[key] = {
                    port_name: portName,
                    type: row.type === 'SOURCE' ? 'Origen (Source)' : 'Destino (Sink)',
                    empresa: row.empresa,
                    producto: row.producto,
                };
                // Inicializar años con 0
                years.forEach(y => {
                    groups[key][`year_${y}`] = 0;
                });
            }
            groups[key][`year_${row.year}`] = Number(row.capacity_mt || 0);
        });
        return Object.values(groups);
    }, [dbData, ports, years]);

    const exportColumns = useMemo(() => {
        const cols: ExportColumn[] = [
            { header: 'Puerto', key: 'port_name', type: 'string' },
            { header: 'Tipo', key: 'type', type: 'string' },
            { header: 'Empresa', key: 'empresa', type: 'string' },
            { header: 'Producto', key: 'producto', type: 'string' },
        ];
        years.forEach(y => {
            cols.push({
                header: `Año ${y} (MT)`,
                key: `year_${y}`,
                type: 'number'
            });
        });
        return cols;
    }, [years]);

    const handleExportExcel = () => {
        exportMasterToExcel('Maestro de Origenes y Destinos', exportColumns, exportData);
    };

    const handleExportPDF = () => {
        exportMasterToPDF('Maestro de Origenes y Destinos', exportColumns, exportData);
    };

    return (
        <MasterTemplate 
            title="Maestro de Originación / Destino" 
            subtitle="Planificación del horizonte de capacidad por Puerto, Empresa y Año"
            activeTab="sources-sinks"
            onBackToDashboard={() => navigate('/dashboard')}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
        >
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 font-semibold animate-pulse gap-2">
                    <div className="animate-spin h-6 w-6 border-2 border-slate-300 border-t-blue-600 rounded-full"></div>
                    <span>Cargando matriz multianual de Originación / Destino...</span>
                </div>
            ) : (
                <div className="flex flex-col gap-6 w-full pb-8">
                    
                    {/* Panel de Mandos */}
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
                        <div className="flex flex-col">
                            <h3 className="font-black text-slate-800 text-base">Planilla de Capacidades</h3>
                            <span className="text-xs text-slate-500 font-medium">
                                Puerto: <b className="text-slate-700">{activePortId}</b> | Tipo: <b className="text-slate-700">{activeType === 'SOURCE' ? 'Originación' : 'Destino'}</b>
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* Selector elegante de Activos / Prospectos */}
                            <div className="flex items-center gap-2 select-none">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Clientes:</span>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg h-8 shadow-inner items-center border border-slate-200">
                                    <button
                                        onClick={toggleActivo}
                                        className={`px-3 py-1 text-xs font-black rounded-md transition-all cursor-pointer ${filterActivo ? 'bg-white text-blue-600 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Activos
                                    </button>
                                    <button
                                        onClick={toggleProspecto}
                                        className={`px-3 py-1 text-xs font-black rounded-md transition-all cursor-pointer ${filterProspecto ? 'bg-white text-blue-600 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Prospectos
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={handleAddRow}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg shadow-sm transition-colors font-bold text-xs flex items-center gap-1.5"
                            >
                                <Plus size={14} />
                                Añadir Empresa
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={saving || !isDirty}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                ) : (
                                    <Save size={14} />
                                )}
                                Guardar Todo
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        
                        {/* NIVEL 1: TABS DE PUERTOS */}
                        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 scrollbar-none">
                            {ports.map((p) => (
                                <button
                                    key={p.port_id}
                                    onClick={() => setActivePortId(p.port_id)}
                                    className={`px-6 py-3 font-black text-xs uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                                        activePortId === p.port_id
                                            ? 'border-blue-600 text-blue-600 bg-white'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                    }`}
                                >
                                    <Anchor size={14} />
                                    {p.port_name || p.port_id}
                                </button>
                            ))}
                        </div>

                        {/* NIVEL 2: ORIGINACIÓN / DESTINO */}
                        <div className="flex border-b border-slate-100 bg-white px-4 scrollbar-none gap-2 py-2">
                            <button
                                onClick={() => setActiveType('SOURCE')}
                                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                    activeType === 'SOURCE'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <Compass size={14} />
                                Originación
                            </button>
                            <button
                                onClick={() => setActiveType('SINK')}
                                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                    activeType === 'SINK'
                                        ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <Layers size={14} />
                                Destino
                            </button>
                        </div>

                        {/* TABLA DE PLANIFICACIÓN HORIZONTAL */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider w-64">Empresa</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider w-40">Producto</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider w-28">Color</th>
                                        
                                        {/* Columnas dinámicas de Años */}
                                        {years.map(y => (
                                            <th key={y} className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-wider w-32 bg-blue-50/50">
                                                Cap. {y} (MT)
                                            </th>
                                        ))}
                                        
                                        <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider w-16">
                                            <button 
                                                onClick={handleAddYear}
                                                className="px-2 py-1 bg-white border border-dashed border-slate-300 rounded text-blue-600 hover:bg-blue-50 text-[9px] font-black transition-colors"
                                                title="Añadir año al horizonte"
                                            >
                                                + AÑO
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {tableRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={3 + years.length + 1} className="px-4 py-12 text-center text-slate-400 font-semibold">
                                                No hay registros de {activeType === 'SOURCE' ? 'originación' : 'destino'} para {activePortId}. Haz clic en "Añadir Empresa" para comenzar.
                                            </td>
                                        </tr>
                                    ) : (
                                        tableRows.map((row, rowIndex) => (
                                            <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
                                                {/* Nombre Empresa */}
                                                <td className="px-4 py-2.5">
                                                    {row.isNew ? (
                                                        <select 
                                                            value={row.empresa}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                handleRowFieldChange(rowIndex, 'empresa', val);
                                                                // Intentar auto-asignar el color del cliente si está definido
                                                                const match = clientsMaster.find(c => c.client_id === val);
                                                                if (match && match.color_hex) {
                                                                    handleRowFieldChange(rowIndex, 'color_hex', match.color_hex);
                                                                }
                                                            }}
                                                            className="text-xs font-bold text-slate-800 border border-slate-200 rounded px-2.5 py-1.5 w-full uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                        >
                                                            <option value="">Seleccione Empresa...</option>
                                                            {clientsMaster.map((c) => (
                                                                <option key={c.client_id} value={c.client_id}>
                                                                    {c.client_id}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input 
                                                            type="text"
                                                            value={row.empresa}
                                                            disabled
                                                            className="text-xs font-black text-slate-500 border border-transparent rounded px-2.5 py-1.5 w-full uppercase bg-slate-50 cursor-not-allowed"
                                                        />
                                                    )}
                                                </td>

                                                {/* Producto */}
                                                <td className="px-4 py-2.5">
                                                    <input 
                                                        type="text"
                                                        value={row.producto}
                                                        onChange={(e) => handleRowFieldChange(rowIndex, 'producto', e.target.value)}
                                                        className="text-xs font-semibold text-slate-700 border border-slate-200 rounded px-2.5 py-1.5 w-full uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                                                        placeholder="Ej: H2SO4"
                                                    />
                                                </td>

                                                {/* Color Hex */}
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <input 
                                                            type="color"
                                                            value={row.color_hex || '#3b82f6'}
                                                            onChange={(e) => handleRowFieldChange(rowIndex, 'color_hex', e.target.value)}
                                                            className="w-6 h-6 border-0 p-0 bg-transparent rounded cursor-pointer shrink-0"
                                                        />
                                                        <input 
                                                            type="text"
                                                            value={row.color_hex || '#3b82f6'}
                                                            onChange={(e) => handleRowFieldChange(rowIndex, 'color_hex', e.target.value)}
                                                            className="w-16 text-[9px] font-mono text-slate-500 uppercase border border-slate-200 rounded px-1 py-0.5 text-center bg-slate-50"
                                                        />
                                                    </div>
                                                </td>

                                                {/* Celdas de Capacidades Multianuales */}
                                                {years.map(y => (
                                                    <td key={y} className="px-4 py-2.5 bg-blue-50/20">
                                                        <input 
                                                            type="number"
                                                            value={row.capacities[y] ?? ''}
                                                            onChange={(e) => handleCapacityChange(rowIndex, y, e.target.value)}
                                                            className="w-full text-right text-xs font-bold text-slate-800 bg-transparent border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                ))}

                                                {/* Acciones */}
                                                <td className="px-4 py-2.5 text-center">
                                                    <button 
                                                        onClick={() => handleDeleteRow(rowIndex)}
                                                        className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded transition-colors"
                                                        title="Eliminar fila completa"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </MasterTemplate>
    );
};
