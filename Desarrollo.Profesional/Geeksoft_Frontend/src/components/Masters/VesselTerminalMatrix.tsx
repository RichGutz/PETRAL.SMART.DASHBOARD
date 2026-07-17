import React, { useState, useEffect } from 'react';
import { ForecastService } from '../../services/api';
import { Save, RefreshCw } from 'lucide-react';

interface VesselTerminalMatrixProps {
    portId: string;
    terminalId: string;
}

const CONCEPT_GROUPS = [
    {
        title: 'Estadía y Rendimiento',
        concepts: [
            { key: 'ritmo_carga', label: 'Ritmo de Carga (MT/hr)', isInput: true },
            { key: 'ritmo_descarga', label: 'Ritmo de Descarga (MT/hr)', isInput: true },
            { key: 'amarre_hrs', label: 'Tiempo Amarre (Hrs)', isInput: true },
            { key: 'desamarre_hrs', label: 'Tiempo Desamarre (Hrs)', isInput: true }
        ]
    },
    {
        title: 'A) Shifting Expenses',
        concepts: [
            { key: 'maniobras', label: 'Pilotage', isInput: true },
            { key: 'remolcadores', label: 'Remolcaje', isInput: true }
        ]
    },
    {
        title: 'B) General Port Expenses',
        concepts: [
            { key: 'lighthouse_nac', label: 'Lighthouse Dues (Aplica si el buque viene de PUERTO NACIONAL)', isInput: false, calcText: 'Automático (GRT)' },
            { key: 'lighthouse_ext', label: 'Lighthouse Dues (Aplica si el buque viene de PUERTO EXTRANJERO)', isInput: false, calcText: 'Automático (GRT)' },
            { key: 'dockage', label: 'Dockage /Muellaje ( $1.50*LOA*Hr)', isInput: false, calcText: 'Automático (Fórmula)' },
            { key: 'lanchas', label: 'Launch Hire.', isInput: true },
            { key: 'turnos_coordinador', label: 'Coordinator on board', isInput: true },
            { key: 'clearance_qty', label: 'Clearance ( In/Out )', isInput: true },
            { key: 'sanitary_qty', label: 'Sanitary Inspection (Reception/Dispatch)', isInput: true }
        ]
    },
    {
        title: 'C) Agency Expenses',
        concepts: [
            { key: 'agency_qty', label: 'Agency Fee', isInput: true },
            { key: 'transport_qty', label: 'Transportation (Autoridades,coordinador y personal operativo)', isInput: true },
            { key: 'comms_qty', label: 'Comunication', isInput: true }
        ]
    }
];

export const VesselTerminalMatrix: React.FC<VesselTerminalMatrixProps> = ({ portId, terminalId }) => {
    const [vessels, setVessels] = useState<any[]>([]);
    const [matrixData, setMatrixData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch data
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
            setMatrixData(filteredOps);
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

    const getValue = (vesselId: string, conceptKey: string) => {
        const row = matrixData.find(m => m.vessel_id === vesselId);
        if (row && row[conceptKey] !== undefined) {
            return row[conceptKey];
        }
        return 0;
    };

    const handleCellChange = (vesselId: string, conceptKey: string, value: string) => {
        const numVal = parseFloat(value) || 0;
        setMatrixData(prev => {
            const existingIdx = prev.findIndex(m => m.vessel_id === vesselId);
            if (existingIdx >= 0) {
                const newData = [...prev];
                newData[existingIdx] = { ...newData[existingIdx], [conceptKey]: numVal };
                return newData;
            } else {
                // Crear nueva fila
                const newRow = {
                    port_id: portId,
                    terminal_id: terminalId,
                    vessel_id: vesselId,
                    ritmo_carga: 0,
                    ritmo_descarga: 0,
                    amarre_hrs: 0,
                    desamarre_hrs: 0,
                    maniobras: 2,
                    remolcadores: 4,
                    lanchas: 4,
                    turnos_coordinador: 2,
                    clearance_qty: 1,
                    sanitary_qty: 1,
                    agency_qty: 1,
                    transport_qty: 1,
                    comms_qty: 1,
                    [conceptKey]: numVal
                };
                return [...prev, newRow];
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
                maniobras: Number(m.maniobras) || 0,
                remolcadores: Number(m.remolcadores) || 0,
                lanchas: Number(m.lanchas) || 0,
                turnos_coordinador: Number(m.turnos_coordinador) || 0,
                clearance_qty: Number(m.clearance_qty) || 0,
                sanitary_qty: Number(m.sanitary_qty) || 0,
                agency_qty: Number(m.agency_qty) || 0,
                transport_qty: Number(m.transport_qty) || 0,
                comms_qty: Number(m.comms_qty) || 0
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

    if (loading) {
        return <div className="p-4 text-center text-slate-500 animate-pulse">Cargando matriz...</div>;
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm mt-4 overflow-hidden">
            <div className="bg-slate-800 p-3 flex justify-between items-center text-white">
                <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                    <RefreshCw size={14} className="text-blue-300" />
                    Parámetros Operativos del Terminal
                </h3>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                >
                    <Save size={14} />
                    {isSaving ? "Guardando..." : "Guardar Matriz"}
                </button>
            </div>
            
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-3 font-bold text-slate-600 uppercase w-48 sticky left-0 bg-slate-50 border-r border-slate-200 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                Concepto Operativo
                            </th>
                            {vessels.map(v => (
                                <th key={v.vessel_id} className="p-3 font-bold text-slate-800 text-center min-w-[100px] border-r border-slate-200">
                                    {v.vessel_name || v.vessel_id}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {CONCEPT_GROUPS.map((group) => (
                            <React.Fragment key={group.title}>
                                <tr className="bg-slate-200/80 border-b border-slate-300">
                                    <td colSpan={vessels.length + 1} className="px-3 py-2 font-black text-slate-800 text-xs uppercase tracking-wider sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        {group.title}
                                    </td>
                                </tr>
                                {group.concepts.map((concept: any, idx) => (
                                    <tr key={concept.key} className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50/50' : 'bg-slate-50/50 hover:bg-blue-50/50'}>
                                        <td className={`p-2.5 border-b border-r border-slate-200 font-semibold text-slate-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                            <div className="pl-3 border-l-2 border-slate-300">{concept.label}</div>
                                        </td>
                                        {vessels.map(v => (
                                            <td key={`${concept.key}-${v.vessel_id}`} className="p-1 border-b border-r border-slate-200">
                                                {concept.isInput ? (
                                                    <input 
                                                        type="number" 
                                                        step="any"
                                                        className="w-full text-center p-1.5 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800 bg-transparent hover:bg-white transition-colors"
                                                        value={getValue(v.vessel_id, concept.key) === 0 ? '' : getValue(v.vessel_id, concept.key)}
                                                        placeholder="0"
                                                        onChange={(e) => handleCellChange(v.vessel_id, concept.key, e.target.value)}
                                                    />
                                                ) : (
                                                    <div className="w-full text-center p-1.5 text-[10px] font-bold text-slate-400 bg-slate-100 rounded uppercase tracking-tighter">
                                                        {concept.calcText}
                                                    </div>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
