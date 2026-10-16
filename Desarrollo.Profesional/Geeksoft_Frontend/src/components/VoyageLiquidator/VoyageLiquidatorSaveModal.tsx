import React, { useState } from 'react';
import { X, Check, Save, ShieldCheck } from 'lucide-react';
import type { VoyageLiquidationCalculatedSummary } from '../../types/voyageLiquidator';

interface VoyageLiquidatorSaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmSave: (operator: string, notes: string) => void;
    voyageCode: string;
    vesselName: string;
    clientName: string;
    voyageDate: string;
    summary: VoyageLiquidationCalculatedSummary;
    saving?: boolean;
}

export const VoyageLiquidatorSaveModal: React.FC<VoyageLiquidatorSaveModalProps> = ({
    isOpen,
    onClose,
    onConfirmSave,
    voyageCode,
    vesselName,
    clientName,
    voyageDate,
    summary,
    saving = false
}) => {
    const [operator, setOperator] = useState<string>('JN');
    const [notes, setNotes] = useState<string>('');

    if (!isOpen) return null;

    const isProfitPositive = summary.net_profit_usd >= 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-[#0284c7]" />
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            CONFIRMAR Y GUARDAR LIQUIDACIÓN REAL
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Resumen del Viaje */}
                    <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-sans">Viaje / Código:</span>
                            <span className="font-bold text-blue-600">{voyageCode}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-sans">Buque:</span>
                            <span className="font-bold text-slate-800 dark:text-white">{vesselName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-sans">Cliente:</span>
                            <span className="font-bold text-slate-800 dark:text-white">{clientName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-sans">Fecha Inicio:</span>
                            <span className="text-slate-700 dark:text-slate-300">{voyageDate}</span>
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">Facturación Flete:</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    ${summary.gross_freight_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">Total Costos Directos:</span>
                                <span className="font-bold text-rose-600">
                                    -${summary.total_direct_costs_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">TCE Real Diario:</span>
                                <span className="font-bold text-amber-600">
                                    ${summary.tce_actual_usd_day.toLocaleString('en-US', { minimumFractionDigits: 0 })} /día
                                </span>
                            </div>
                            <div className="flex justify-between text-sm pt-1 border-t border-slate-200 dark:border-slate-700">
                                <span className="font-bold text-slate-700 dark:text-slate-300 font-sans">Utilidad Neta Real:</span>
                                <span className={`font-bold ${isProfitPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isProfitPositive ? '+' : ''}${summary.net_profit_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Inputs de Operador y Glosa */}
                    <div className="space-y-3 text-xs">
                        <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Operador Responsable:
                            </label>
                            <select
                                value={operator}
                                onChange={(e) => setOperator(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="JN">JN (Jorge Neyra)</option>
                                <option value="MEC">MEC (María Elena Castro)</option>
                                <option value="ADMIN">ADMIN (Operaciones Central)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Notas de Bitácora / Auditoría (Opcional):
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder="Observaciones de muelle, tiempos de espera o incidencias..."
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirmSave(operator, notes)}
                        disabled={saving}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                        <Save size={13} />
                        <span>{saving ? 'Guardando...' : 'Confirmar y Guardar'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
