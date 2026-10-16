import React, { useState } from 'react';
import { X, Sparkles, Anchor, Fuel, ShieldCheck, Save, AlertCircle } from 'lucide-react';
import { BunkerBootstrappingService } from '../../../services/bunkerBootstrappingService';
import type { BootstrapPayload } from '../../../services/bunkerBootstrappingService';

interface BunkerBootstrapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialVesselId?: string;
}

export const BunkerBootstrapModal: React.FC<BunkerBootstrapModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    initialVesselId = 'MOQUEGUA',
}) => {
    const [vesselId, setVesselId] = useState(initialVesselId);
    const [eventDate, setEventDate] = useState('2026-10-01');
    const [portId, setPortId] = useState('CALLAO');
    const [voyageNumber, setVoyageNumber] = useState('SALDO-INICIAL');
    const [robIfoMt, setRobIfoMt] = useState<number>(120.40);
    const [pricePrevIfoUsd, setPricePrevIfoUsd] = useState<number>(967.26);
    const [robMdoMt, setRobMdoMt] = useState<number>(90.30);
    const [pricePrevMdoUsd, setPricePrevMdoUsd] = useState<number>(1528.26);
    const [notes, setNotes] = useState('Saldo inicial histórico de tanques (Bootstrapping)');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    // BAF de Referencia Inicial (Base Contrato SPCC: $967.26 IFO / $1528.26 MDO)
    const baseDenom = (967.26 * 38.40) + (1528.26 * 9.50);
    const currNumer = (pricePrevIfoUsd * 38.40) + (pricePrevMdoUsd * 9.50);
    const totalBaf = baseDenom > 0 ? (Math.ceil((currNumer / baseDenom) * 10000) / 10000) : 1.0;
    const newBaf = totalBaf * 4.17;
    const bafVar = newBaf - 4.17;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        try {
            const payload: BootstrapPayload = {
                vessel_id: vesselId,
                event_date: eventDate,
                port_id: portId,
                voyage_number: voyageNumber,
                rob_ifo_mt: Number(robIfoMt),
                price_prev_ifo_usd: Number(pricePrevIfoUsd),
                rob_mdo_mt: Number(robMdoMt),
                price_prev_mdo_usd: Number(pricePrevMdoUsd),
                notes,
                created_by: 'admin@petral.com'
            };

            await BunkerBootstrappingService.bootstrapVessel(payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || 'Error al guardar el saldo inicial');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden text-white">
                {/* Header */}
                <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                                Saldo Inicial de Búnker (Bootstrapping)
                            </h3>
                            <p className="text-xs text-slate-400 font-mono">
                                Hito génesis de combustible remanente (ROB) y costo base de partida
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {errorMsg && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Fila 1: Buque, Fecha, Puerto */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Anchor size={12} className="text-blue-400" /> Buque de la Flota
                            </label>
                            <select
                                value={vesselId}
                                onChange={(e) => setVesselId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 font-mono"
                            >
                                <option value="MOQUEGUA">BT MOQUEGUA</option>
                                <option value="TABLONES">BT TABLONES</option>
                                <option value="HUEMUL">BT HUEMUL</option>
                                <option value="CONCON_TRADER">CONCON TRADER</option>
                                <option value="BOW_CONDOR">BOW CONDOR</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Fecha de Corte Inicial
                            </label>
                            <input
                                type="date"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 font-mono"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Puerto de Referencia
                            </label>
                            <input
                                type="text"
                                value={portId}
                                onChange={(e) => setPortId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
                                required
                            />
                        </div>
                    </div>

                    {/* Fila 2: IFO 380 VLSFO */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                                <Fuel size={14} /> Combustible IFO 380 (VLSFO)
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">85% Pond. SPCC</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                                    Stock Remanente Inicial (ROB en TM)
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={robIfoMt}
                                    onChange={(e) => setRobIfoMt(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white font-mono focus:border-amber-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                                    Precio Base Inicial (USD / TM)
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={pricePrevIfoUsd}
                                    onChange={(e) => setPricePrevIfoUsd(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white font-mono focus:border-amber-500 focus:outline-none"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fila 3: MDO (MGO Homologado) */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-cyan-400 flex items-center gap-1.5">
                                <Fuel size={14} /> Combustible MDO (Diesel Marino / MGO)
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">15% Pond. SPCC</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                                    Stock Remanente Inicial (ROB en TM)
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={robMdoMt}
                                    onChange={(e) => setRobMdoMt(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white font-mono focus:border-cyan-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                                    Precio Base Inicial (USD / TM)
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={pricePrevMdoUsd}
                                    onChange={(e) => setPricePrevMdoUsd(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white font-mono focus:border-cyan-500 focus:outline-none"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cálculo Previo BAF */}
                    <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl flex items-center justify-between text-xs font-mono">
                        <span className="text-purple-300 flex items-center gap-1.5">
                            <ShieldCheck size={16} /> BAF Resultante Estimado:
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-white font-bold">{totalBaf.toFixed(4)} factor</span>
                            <span className={bafVar <= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                {bafVar > 0 ? '+' : ''}{bafVar.toFixed(4)} USD/pmt
                            </span>
                        </div>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Notas de Auditoría
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Save size={16} />
                            <span>{loading ? 'Guardando Saldo Inicial...' : 'Confirmar Saldo Inicial (Bootstrapping)'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
