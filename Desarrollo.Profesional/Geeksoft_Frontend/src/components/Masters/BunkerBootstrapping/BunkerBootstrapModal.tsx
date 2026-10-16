import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, Anchor, Fuel, ShieldCheck, Save, AlertCircle, BookOpen, MapPin, Hash, FileText, DollarSign } from 'lucide-react';
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
    // 1. El buque es inmutable dentro de este modal (fijado por la pestaña activa)
    const vesselId = initialVesselId;
    const fuelConfig = getVesselFuelConfig(vesselId);
    const supportsMdo = fuelConfig.supportsMdo;

    // 2. Datos generales del asiento de apertura
    const [eventDate, setEventDate] = useState('2026-10-01');
    const [portId, setPortId] = useState('CALLAO');
    const [voyageNumber, setVoyageNumber] = useState('SALDO-INICIAL-OCT26');
    const [notes, setNotes] = useState('Saldo inicial auditado de corte en tanques (Génesis)');

    // 3. Condición inicial IFO 380
    const [robIfoMt, setRobIfoMt] = useState<number>(120.40);
    const [pricePrevIfoUsd, setPricePrevIfoUsd] = useState<number>(967.26);

    // 4. Condición inicial MDO (Marine Gas Oil / Diesel Marino)
    const [robMdoMt, setRobMdoMt] = useState<number>(90.30);
    const [pricePrevMdoUsd, setPricePrevMdoUsd] = useState<number>(1528.26);

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Valorizaciones en tiempo real
    const ifoValuation = useMemo(() => (robIfoMt * pricePrevIfoUsd), [robIfoMt, pricePrevIfoUsd]);
    const mdoValuation = useMemo(() => supportsMdo ? (robMdoMt * pricePrevMdoUsd) : 0, [robMdoMt, pricePrevMdoUsd, supportsMdo]);
    const totalInventoryValuation = useMemo(() => ifoValuation + mdoValuation, [ifoValuation, mdoValuation]);

    // BAF de Referencia Inicial (Base Contrato SPCC: $967.26 IFO / $1528.26 MDO)
    const baseDenom = (967.26 * 38.40) + (supportsMdo ? (1528.26 * 9.50) : 0);
    const currNumer = (pricePrevIfoUsd * 38.40) + (supportsMdo ? (pricePrevMdoUsd * 9.50) : 0);
    const totalBaf = baseDenom > 0 ? (Math.ceil((currNumer / baseDenom) * 10000) / 10000) : 1.0;
    const newBaf = totalBaf * 4.17;
    const bafVar = newBaf - 4.17;

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (robIfoMt <= 0 || pricePrevIfoUsd <= 0) {
            setErrorMsg('El ROB Inicial y el Precio Base de IFO deben ser mayores a cero.');
            return;
        }
        if (supportsMdo && (robMdoMt <= 0 || pricePrevMdoUsd <= 0)) {
            setErrorMsg('Para este buque dual-fuel, el ROB Inicial y Precio Base de MDO deben ser mayores a cero.');
            return;
        }

        setLoading(true);
        setErrorMsg(null);
        try {
            const payload: BootstrapPayload = {
                vessel_id: vesselId,
                event_date: eventDate,
                port_id: portId.trim().toUpperCase() || 'CALLAO',
                voyage_number: voyageNumber.trim() || 'SALDO-INICIAL',
                rob_ifo_mt: Number(robIfoMt),
                price_prev_ifo_usd: Number(pricePrevIfoUsd),
                rob_mdo_mt: supportsMdo ? Number(robMdoMt) : 0,
                price_prev_mdo_usd: supportsMdo ? Number(pricePrevMdoUsd) : 0,
                notes: notes.trim(),
                created_by: 'operaciones@petral.com'
            };

            await BunkerBootstrappingService.bootstrapVessel(payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error registrando bootstrap:', err);
            setErrorMsg(err.message || 'Error al guardar asiento de apertura');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* 1. Header con Identidad Fija del Buque */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center justify-center font-bold">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                    Asiento de Apertura • Saldo Inicial Génesis
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#0284c7] dark:bg-blue-900/40 dark:text-blue-300">
                                    {fuelConfig.vessel_name}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {supportsMdo 
                                    ? 'Establece la condición inicial auditada en tanques (ROB₀) y precios de corte (P₀) para IFO y MDO'
                                    : 'Establece la condición inicial auditada en tanques (ROB₀) y precio de corte (P₀) • Buque Monocombustible Solo IFO'}
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

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs overflow-y-auto">
                    {errorMsg && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0 text-rose-600" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* SECCIÓN 1: IDENTIDAD Y METADATOS DE CORTE */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                        <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <Anchor size={14} className="text-[#0284c7]" />
                            1. Parámetros del Asiento de Apertura (Acta de Corte)
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                                    <Hash size={12} className="text-slate-400" />
                                    N° Viaje / Referencia de Corte
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-[#0284c7]"
                                    value={voyageNumber}
                                    onChange={(e) => setVoyageNumber(e.target.value)}
                                    placeholder="SALDO-INICIAL-OCT26"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fecha de Corte Contable</label>
                                <input
                                    type="date"
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-white outline-none focus:border-[#0284c7]"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                                    <MapPin size={12} className="text-slate-400" />
                                    Puerto de Corte Auditado
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-white uppercase outline-none focus:border-[#0284c7]"
                                    value={portId}
                                    onChange={(e) => setPortId(e.target.value)}
                                    placeholder="CALLAO"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                                <FileText size={12} className="text-slate-400" />
                                Notas de Auditoría / Sustento del Asiento de Apertura
                            </label>
                            <input
                                type="text"
                                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white outline-none focus:border-[#0284c7]"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Saldo inicial auditado según acta de medición de tanques..."
                            />
                        </div>
                    </div>

                    {/* SECCIÓN 2: CONDICIÓN INICIAL IFO 380 */}
                    <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 flex flex-col gap-3 font-mono">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                <Fuel size={14} className="text-amber-600" />
                                2. Condición Inicial IFO 380 (Fuel Oil / VLSFO)
                            </span>
                            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
                                Valorizado: ${ifoValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-amber-300 dark:border-amber-800/80">
                                <label className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase block mb-1 font-sans">
                                    ROB Inicial en Tanques (TM)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-transparent font-black text-slate-900 dark:text-white text-sm outline-none"
                                    value={robIfoMt}
                                    onChange={(e) => setRobIfoMt(parseFloat(e.target.value) || 0)}
                                    required
                                />
                            </div>

                            <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-amber-300 dark:border-amber-800/80">
                                <label className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase block mb-1 font-sans">
                                    Precio Base de Corte ($ USD/TM)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-transparent font-black text-slate-900 dark:text-white text-sm outline-none"
                                    value={pricePrevIfoUsd}
                                    onChange={(e) => setPricePrevIfoUsd(parseFloat(e.target.value) || 0)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: CONDICIÓN INICIAL MDO (MGO) - SOLO SI EL BUQUE CONSUME MDO EN FICHA DE FLOTA */}
                    {supportsMdo && (
                        <div className="p-4 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-900/50 flex flex-col gap-3 font-mono">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-cyan-900 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                    <Fuel size={14} className="text-cyan-600" />
                                    3. Condición Inicial MDO (Marine Gas Oil / MGO Homologado)
                                </span>
                                <span className="text-[11px] font-bold text-cyan-800 dark:text-cyan-400">
                                    Valorizado: ${mdoValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-cyan-300 dark:border-cyan-800/80">
                                    <label className="text-[10px] font-bold text-cyan-900 dark:text-cyan-300 uppercase block mb-1 font-sans">
                                        ROB Inicial en Tanques (TM)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-transparent font-black text-slate-900 dark:text-white text-sm outline-none"
                                        value={robMdoMt}
                                        onChange={(e) => setRobMdoMt(parseFloat(e.target.value) || 0)}
                                        required={supportsMdo}
                                    />
                                </div>

                                <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-cyan-300 dark:border-cyan-800/80">
                                    <label className="text-[10px] font-bold text-cyan-900 dark:text-cyan-300 uppercase block mb-1 font-sans">
                                        Precio Base de Corte ($ USD/TM)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-transparent font-black text-slate-900 dark:text-white text-sm outline-none"
                                        value={pricePrevMdoUsd}
                                        onChange={(e) => setPricePrevMdoUsd(parseFloat(e.target.value) || 0)}
                                        required={supportsMdo}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN 4: RESUMEN EJECUTIVO DETERMINÍSTICO */}
                    <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block font-sans">
                                Total Inventario Inicial Valorizado:
                            </span>
                            <span className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1">
                                <DollarSign size={16} className="text-emerald-500" />
                                {totalInventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </span>
                        </div>

                        <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block font-sans">
                                Factor BAF Inicial SPCC:
                            </span>
                            <span className="text-base font-black text-purple-700 dark:text-purple-400">
                                {totalBaf.toFixed(4)}
                            </span>
                            <span className={`text-[10px] font-bold block ${bafVar <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                Var: {bafVar > 0 ? '+' : ''}{bafVar.toFixed(4)} USD/pmt
                            </span>
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Save size={14} />
                            <span>{loading ? 'Guardando Asiento...' : 'Guardar Asiento de Apertura'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
