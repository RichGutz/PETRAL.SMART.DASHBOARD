import React, { useState, useEffect } from 'react';
import { X, Sparkles, Anchor, Fuel, ShieldCheck, Save, AlertCircle, BookOpen } from 'lucide-react';
import { BunkerBootstrappingService, getVesselFuelConfig } from '../../../services/bunkerBootstrappingService';
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

    // Actualizar cuando cambie initialVesselId
    useEffect(() => {
        setVesselId(initialVesselId);
    }, [initialVesselId]);

    const fuelConfig = getVesselFuelConfig(vesselId);
    const supportsMdo = fuelConfig.supportsMdo;

    if (!isOpen) return null;

    // BAF de Referencia Inicial (Base Contrato SPCC: $967.26 IFO / $1528.26 MDO)
    const baseDenom = (967.26 * 38.40) + (supportsMdo ? (1528.26 * 9.50) : 0);
    const currNumer = (pricePrevIfoUsd * 38.40) + (supportsMdo ? (pricePrevMdoUsd * 9.50) : 0);
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
                rob_mdo_mt: supportsMdo ? Number(robMdoMt) : 0,
                price_prev_mdo_usd: supportsMdo ? Number(pricePrevMdoUsd) : 0,
                notes,
                created_by: 'admin@petral.com'
            };

            await BunkerBootstrappingService.bootstrapVessel(payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error registrando bootstrap:', err);
            setErrorMsg(err.message || 'Error al guardar saldo inicial');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                Asiento de Apertura • Saldo Inicial Génesis ({fuelConfig.vessel_name})
                            </h3>
                            <p className="text-xs text-slate-500">
                                {supportsMdo 
                                    ? 'Establece el inventario físico en tanques (ROB₀ IFO/MDO) y precio base contable de corte (P₀)'
                                    : 'Establece el inventario físico en tanques (ROB₀ IFO) y precio base contable de corte (P₀) • Buque Solo IFO'}
                            </p>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
                    {errorMsg && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                            <AlertCircle size={16} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Buque a Inicializar</label>
                            <select
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-white"
                                value={vesselId}
                                onChange={(e) => setVesselId(e.target.value)}
                            >
                                <option value="MOQUEGUA">BT MOQUEGUA</option>
                                <option value="TABLONES">BT TABLONES</option>
                                <option value="HUEMUL">BT HUEMUL</option>
                                <option value="CONCON_TRADER">CONCON TRADER</option>
                                <option value="BOW_CONDOR">BOW CONDOR</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fecha de Corte Génesis</label>
                            <input
                                type="date"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-white"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex flex-col gap-2">
                        <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Fuel size={14} className="text-amber-600" />
                            Condición Inicial IFO 380 (VLSFO)
                        </span>
                        <div className="grid grid-cols-2 gap-3 font-mono">
                            <div>
                                <label className="text-[10px] font-bold text-amber-900/70 uppercase block mb-1">ROB Inicial (TM)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-white border border-amber-300 rounded-lg p-2 font-black text-slate-800"
                                    value={robIfoMt}
                                    onChange={(e) => setRobIfoMt(parseFloat(e.target.value) || 0)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-amber-900/70 uppercase block mb-1">Precio Base ($ USD/TM)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-white border border-amber-300 rounded-lg p-2 font-black text-slate-800"
                                    value={pricePrevIfoUsd}
                                    onChange={(e) => setPricePrevIfoUsd(parseFloat(e.target.value) || 0)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* MDO: Solo para buques que consumen MDO en el Maestro de Flota */}
                    {supportsMdo && (
                        <div className="p-3.5 rounded-xl bg-cyan-50/60 border border-cyan-200/80 flex flex-col gap-2">
                            <span className="text-[11px] font-black text-cyan-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Fuel size={14} className="text-cyan-600" />
                                Condición Inicial MDO (Marine Diesel / MGO Homologado)
                            </span>
                            <div className="grid grid-cols-2 gap-3 font-mono">
                                <div>
                                    <label className="text-[10px] font-bold text-cyan-900/70 uppercase block mb-1">ROB Inicial (TM)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-white border border-cyan-300 rounded-lg p-2 font-black text-slate-800"
                                        value={robMdoMt}
                                        onChange={(e) => setRobMdoMt(parseFloat(e.target.value) || 0)}
                                        required={supportsMdo}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-cyan-900/70 uppercase block mb-1">Precio Base ($ USD/TM)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-white border border-cyan-300 rounded-lg p-2 font-black text-slate-800"
                                        value={pricePrevMdoUsd}
                                        onChange={(e) => setPricePrevMdoUsd(parseFloat(e.target.value) || 0)}
                                        required={supportsMdo}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-600 font-bold">BAF Inicial Resultante:</span>
                        <span className="font-black text-[#0284c7]">
                            Factor: {totalBaf.toFixed(4)} | Tarifa: ${newBaf.toFixed(4)} USD/pmt
                        </span>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                            <Save size={14} />
                            <span>{loading ? 'Guardando...' : 'Establecer Saldo Génesis'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
