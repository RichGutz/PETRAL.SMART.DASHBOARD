import React from 'react';
import { Ship, Plus, FolderOpen, Save, RefreshCw } from 'lucide-react';
import { VESSEL_FUEL_CONFIG } from '../../services/bunkerBootstrappingService';

interface VoyageLiquidatorHeaderProps {
    selectedVessel: string;
    onSelectVessel: (vesselId: string) => void;
    voyageCode: string;
    onVoyageCodeChange: (code: string) => void;
    clientName: string;
    onClientNameChange: (client: string) => void;
    voyageDate: string;
    onVoyageDateChange: (date: string) => void;
    onNewLiquidation: () => void;
    onOpenHistory: () => void;
    onSaveLiquidation: () => void;
    saving?: boolean;
}

const CLIENTS = [
    { id: 'SPCC', label: 'SPCC (Southern Copper)' },
    { id: 'NEXA', label: 'NEXA RESOURCES' },
    { id: 'TRAFIGURA', label: 'TRAFIGURA PERU' },
    { id: 'GLENCORE', label: 'GLENCORE' },
    { id: 'CERRO_VERDE', label: 'CERRO VERDE' },
    { id: 'MARCOBRE', label: 'MARCOBRE' },
    { id: 'OTRO', label: 'OTRO CLIENTE' }
];

export const VoyageLiquidatorHeader: React.FC<VoyageLiquidatorHeaderProps> = ({
    selectedVessel,
    onSelectVessel,
    voyageCode,
    onVoyageCodeChange,
    clientName,
    onClientNameChange,
    voyageDate,
    onVoyageDateChange,
    onNewLiquidation,
    onOpenHistory,
    onSaveLiquidation,
    saving = false
}) => {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            {/* Fila 1: Título y Pills de Nave */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-[#0284c7]">
                        <Ship size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            VOYAGE LIQUIDATOR • LIQUIDACIÓN REAL EX-POST
                        </h2>
                        <p className="text-[11px] text-slate-500 font-medium">
                            Captura fáctica con datos duros de bitácora y costeo oficial de búnker en tiempo real
                        </p>
                    </div>
                </div>

                {/* Pills de Selección de Nave */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    {Object.values(VESSEL_FUEL_CONFIG).map((v) => {
                        const isSelected = selectedVessel === v.vessel_id;
                        return (
                            <button
                                key={v.vessel_id}
                                type="button"
                                onClick={() => onSelectVessel(v.vessel_id)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-blue-600 text-white shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                {v.short_label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Fila 2: Inputs del Viaje (Código, Cliente, Fecha) + Botonera de Acción */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Código del Viaje */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Viaje N°:</span>
                        <input
                            type="text"
                            value={voyageCode}
                            onChange={(e) => onVoyageCodeChange(e.target.value)}
                            placeholder="Ej. V.763"
                            className="w-28 px-2.5 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 uppercase"
                        />
                    </div>

                    {/* Selector de Cliente */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cliente:</span>
                        <select
                            value={clientName}
                            onChange={(e) => onClientNameChange(e.target.value)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            {CLIENTS.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fecha de Inicio */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha:</span>
                        <input
                            type="date"
                            value={voyageDate}
                            onChange={(e) => onVoyageDateChange(e.target.value)}
                            className="px-2.5 py-1 text-xs font-mono text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onNewLiquidation}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Limpiar grilla para nueva liquidación"
                    >
                        <Plus size={13} />
                        <span>Nuevo Viaje</span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenHistory}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Ver liquidaciones guardadas en base de datos"
                    >
                        <FolderOpen size={13} />
                        <span>Historial Auditado</span>
                    </button>

                    <button
                        type="button"
                        onClick={onSaveLiquidation}
                        disabled={saving}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                        title="Guardar liquidación en voyage_liquidations"
                    >
                        {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                        <span>Guardar Liquidación</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
