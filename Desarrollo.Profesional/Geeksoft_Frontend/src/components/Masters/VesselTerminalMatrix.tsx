import React, { useState, useEffect } from 'react';
import { ForecastService } from '../../services/api';
import { Save, RefreshCw, FileText } from 'lucide-react';

interface VesselTerminalMatrixProps {
    portId: string;
    terminalId: string;
}


export const VesselTerminalMatrix: React.FC<VesselTerminalMatrixProps> = ({ portId, terminalId }) => {
    const [vessels, setVessels] = useState<any[]>([]);
    const [matrixData, setMatrixData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [vesselsRes, opsRes] = await Promise.all([
                ForecastService.getVessels(),
                ForecastService.getVesselTerminalOperations()
            ]);
            
            const activeVessels = (vesselsRes || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
            setVessels(activeVessels);
            
            const filteredOps = (opsRes || []).filter((op: any) => op.port_id === portId && op.terminal_id === terminalId);
            setMatrixData(filteredOps.map((op: any) => ({
                ...op,
                parameters: op.parameters || {}
            })));
        } catch (error) {
            console.error("Error fetching ops data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (portId && terminalId) {
            fetchData();
        }
    }, [portId, terminalId]);

    const getBaseValue = (vesselId: string, conceptKey: string) => {
        const row = matrixData.find(m => m.vessel_id === vesselId);
        if (row && row[conceptKey] !== undefined && row[conceptKey] !== null && row[conceptKey] !== 0 && row[conceptKey] !== '') {
            return row[conceptKey];
        }
        
        if (conceptKey === 'ritmo_carga') return 500;
        if (conceptKey === 'ritmo_descarga') return (cleanPort.includes('MARCONA') || cleanPort.includes('SAN_JUAN')) ? 345 : 500;
        if (conceptKey === 'amarre_hrs') return 3;
        if (conceptKey === 'desamarre_hrs') return 2;
        if (conceptKey === 'tugboats_in' || conceptKey === 'tugboats_out') return 2;
        if (conceptKey === 'time_to_count_carga_hrs' || conceptKey === 'time_to_count_descarga_hrs') return 6;
        if (conceptKey === 'maneuver_carga_hrs' || conceptKey === 'maneuver_descarga_hrs') return 2;
        return '';
    };


    const handleBaseChange = (vesselId: string, conceptKey: string, value: string) => {
        const numVal = parseFloat(value) || 0;
        updateMatrixRow(vesselId, { [conceptKey]: numVal });
    };

    const createDefaultRow = (vesselId: string) => ({
        port_id: portId,
        terminal_id: terminalId,
        vessel_id: vesselId,
        ritmo_carga: 500,
        ritmo_descarga: 500,
        amarre_hrs: 3.0,
        desamarre_hrs: 2.0,
        time_to_count_carga_hrs: 6.0,
        time_to_count_descarga_hrs: 6.0,
        maneuver_carga_hrs: 2.0,
        maneuver_descarga_hrs: 2.0,
        tugboats_in: 2,
        tugboats_out: 2,
        tugboats_count: 2,
        parameters: {} as Record<string, any>
    });

    const updateMatrixRow = (vesselId: string, updates: any) => {
        setMatrixData(prev => {
            const existingIdx = prev.findIndex(m => m.vessel_id === vesselId);
            if (existingIdx >= 0) {
                const newData = [...prev];
                newData[existingIdx] = { ...newData[existingIdx], ...updates };
                return newData;
            } else {
                return [...prev, { ...createDefaultRow(vesselId), ...updates }];
            }
        });
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const payload = matrixData.map(m => ({
                port_id: m.port_id,
                terminal_id: m.terminal_id,
                vessel_id: m.vessel_id,
                ritmo_carga: Number(m.ritmo_carga) || 0,
                ritmo_descarga: Number(m.ritmo_descarga) || 0,
                amarre_hrs: Number(m.amarre_hrs) || 0,
                desamarre_hrs: Number(m.desamarre_hrs) || 0,
                time_to_count_carga_hrs: Number(m.time_to_count_carga_hrs) || 0,
                time_to_count_descarga_hrs: Number(m.time_to_count_descarga_hrs) || 0,
                maneuver_carga_hrs: Number(m.maneuver_carga_hrs) || 0,
                maneuver_descarga_hrs: Number(m.maneuver_descarga_hrs) || 0,
                tugboats_in: Number(m.tugboats_in) || Number(m.tugboats_count) || 0,
                tugboats_out: Number(m.tugboats_out) || Number(m.tugboats_count) || 0,
                tugboats_count: Number(m.tugboats_in) || Number(m.tugboats_count) || 0,
                parameters: m.parameters || {}
            }));
            
            await ForecastService.saveVesselTerminalOperations(payload);
            alert("Matriz de operaciones guardada exitosamente");
        } catch (error) {
            console.error("Error saving ops matrix", error);
            alert("Error al guardar la matriz");
        } finally {
            setIsSaving(false);
        }
    };

    const cleanPort = (portId || '').toUpperCase();

    const baseConcepts = [
        { key: 'ritmo_carga', label: 'Ritmo de Carga (MT/hr)', comment: 'Velocidad neta de bombeo/transferencia de carga por hora' },
        { key: 'ritmo_descarga', label: 'Ritmo de Descarga (MT/hr)', comment: 'Velocidad neta de descarga de producto por hora' },
        { key: 'amarre_hrs', label: 'Tiempo Amarre / Atraque (Hrs)', comment: 'Maniobra desde canal a muelle, amarrado de espías' },
        { key: 'desamarre_hrs', label: 'Tiempo Desamarre / Zarpe (Hrs)', comment: 'Suelta de espías, maniobra de práctico y salida a mar' },
        { key: 'time_to_count_carga_hrs', label: 'Time to Count Carga (Hrs)', comment: 'Tiempo de preparación (mangueras/aduana) previo al Laytime' },
        { key: 'time_to_count_descarga_hrs', label: 'Time to Count Descarga (Hrs)', comment: 'Tiempo de inspección tanques/desglose previo al Laytime' },
        { key: 'maneuver_carga_hrs', label: 'Tiempo Maniobra Carga Extra (Hrs)', comment: 'Horas muertas adicionales por congestión/marejadas/noches' },
        { key: 'maneuver_descarga_hrs', label: 'Tiempo Maniobra Descarga Extra (Hrs)', comment: 'Horas muertas adicionales por congestión/marejadas/noches' },
        { key: 'tugboats_in', label: 'Remolcadores Ingreso (Tugboats IN)', comment: 'Nro remolcadores exigidos por Capitanía para atraque ingreso' },
        { key: 'tugboats_out', label: 'Remolcadores Salida (Tugboats OUT)', comment: 'Nro remolcadores exigidos por Capitanía para zarpe salida' }
    ];

    const handlePrintPDF = () => {
        window.print();
    };

    if (loading) {
        return <div className="p-4 text-center text-slate-500 animate-pulse">Cargando matriz...</div>;
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm mt-4 overflow-hidden">
            <div className="bg-slate-800 p-3 flex justify-between items-center text-white">
                <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                    <RefreshCw size={14} className="text-blue-300" />
                    Matriz Dinámica: Parámetros y Conceptos Tarifarios
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrintPDF}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Imprimir tabla en PDF A4 vertical"
                    >
                        <FileText size={14} />
                        PDF A4
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                        <Save size={14} />
                        {isSaving ? "Guardando..." : "Guardar Matriz"}
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-3 font-bold text-slate-600 uppercase w-64 sticky left-0 bg-slate-50 border-r border-slate-200 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                Concepto Operativo / Tarifa
                            </th>
                            <th className="p-3 font-bold text-slate-600 uppercase w-32 border-r border-slate-200 text-center">
                                Lógica de Cálculo
                            </th>
                            <th className="p-3 font-bold text-slate-600 uppercase w-48 border-r border-slate-200">
                                Comentarios / Lógica
                            </th>
                            {vessels.map(v => (
                                <th key={v.vessel_id} className="p-3 font-bold text-slate-800 text-center min-w-[100px] border-r border-slate-200">
                                    {v.vessel_name || v.vessel_id}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* BASE CONCEPTS */}
                        <tr className="bg-slate-200/80 border-b border-slate-300">
                            <td colSpan={vessels.length + 2} className="px-3 py-2 font-black text-slate-800 text-xs uppercase tracking-wider sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                Estadía y Rendimiento (Base)
                            </td>
                        </tr>
                        {baseConcepts.map((concept, idx) => (
                            <tr key={concept.key} className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50/50' : 'bg-slate-50/50 hover:bg-blue-50/50'}>
                                <td className={`p-2.5 border-b border-r border-slate-200 font-semibold text-slate-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                    <div className="pl-3 border-l-2 border-slate-400">{concept.label}</div>
                                </td>
                                <td className="p-2 border-b border-r border-slate-200 text-center">
                                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">FÍSICA (TIEMPOS)</span>
                                </td>
                                <td className="p-2 border-b border-r border-slate-200 text-[11px] text-slate-500 italic">
                                    {concept.comment}
                                </td>
                                {vessels.map(v => (
                                    <td key={`${concept.key}-${v.vessel_id}`} className="p-1 border-b border-r border-slate-200">
                                        <input 
                                            type="number" 
                                            step="any"
                                            className="w-full text-center p-1.5 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800 bg-transparent hover:bg-white transition-colors"
                                            value={getBaseValue(v.vessel_id, concept.key) === 0 ? '' : getBaseValue(v.vessel_id, concept.key)}
                                            placeholder=""
                                            onChange={(e) => handleBaseChange(v.vessel_id, concept.key, e.target.value)}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
