import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, ArrowRight, Trash2, Calendar, Ship } from 'lucide-react';
import type { VoyageLiquidationRecord } from '../../types/voyageLiquidator';
import { voyageLiquidatorService } from '../../services/voyageLiquidatorService';

interface VoyageLiquidatorHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadVoyage: (record: VoyageLiquidationRecord) => void;
    currentVesselId: string;
}

export const VoyageLiquidatorHistoryModal: React.FC<VoyageLiquidatorHistoryModalProps> = ({
    isOpen,
    onClose,
    onLoadVoyage,
    currentVesselId
}) => {
    const [liquidations, setLiquidations] = useState<VoyageLiquidationRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        if (!isOpen) return;
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const data = await voyageLiquidatorService.getLiquidations();
                setLiquidations(data || []);
            } catch (err) {
                console.error("Error al cargar historial de liquidaciones:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [isOpen]);

    if (!isOpen) return null;

    const filtered = liquidations.filter(liq => {
        const term = searchTerm.toLowerCase();
        return (
            (liq.voyage_code || '').toLowerCase().includes(term) ||
            (liq.vessel_name || '').toLowerCase().includes(term) ||
            (liq.client_name || '').toLowerCase().includes(term) ||
            (liq.pol_port || '').toLowerCase().includes(term) ||
            (liq.pod_port || '').toLowerCase().includes(term)
        );
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center gap-2.5">
                        <Ship size={18} className="text-[#0284c7]" />
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            HISTORIAL DE VIAJES LIQUIDADOS (VOYAGE LIQUIDATIONS)
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Toolbar de Búsqueda */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
                    <div className="relative flex-1 max-w-md">
                        <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por código, nave, cliente, puerto..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                        {filtered.length} viaje(s) encontrado(s)
                    </div>
                </div>

                {/* Lista de Liquidaciones */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 size={24} className="animate-spin text-blue-600 mb-2" />
                            <p className="text-xs">Cargando registros de liquidaciones...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-xs text-slate-400 font-mono">
                            No se encontraron liquidaciones de viaje con el criterio especificado.
                        </div>
                    ) : (
                        filtered.map((item) => {
                            const netProfit = Number(item.net_profit_usd) || 0;
                            const isPositive = netProfit >= 0;

                            return (
                                <div
                                    key={item.id || item.voyage_code}
                                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 hover:border-blue-400 transition-all flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                                            {item.voyage_code}
                                        </span>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white font-sans text-xs flex items-center gap-1.5">
                                                <span>{item.vessel_name}</span>
                                                <span className="text-slate-400 font-normal">•</span>
                                                <span className="text-slate-600 dark:text-slate-300 font-normal">{item.client_name}</span>
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-sans">
                                                {item.pol_port} ➔ {item.pod_port} • {item.voyage_date}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400 font-sans">CARGA</div>
                                            <div className="font-bold text-slate-700 dark:text-slate-300">
                                                {Number(item.cargo_quantity_mt).toLocaleString('en-US', { minimumFractionDigits: 0 })} TM
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400 font-sans">FLETE BRUTO</div>
                                            <div className="font-bold text-slate-900 dark:text-white">
                                                ${Number(item.gross_revenue_usd).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400 font-sans">TCE REAL</div>
                                            <div className="font-bold text-amber-600 dark:text-amber-400">
                                                ${Number(item.tce_usd_day).toLocaleString('en-US', { minimumFractionDigits: 0 })}/d
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400 font-sans">UTILIDAD NETA</div>
                                            <div className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {isPositive ? '+' : ''}${netProfit.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                onLoadVoyage(item);
                                                onClose();
                                            }}
                                            className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 rounded-lg text-xs font-bold font-sans flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                            <span>Cargar</span>
                                            <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
