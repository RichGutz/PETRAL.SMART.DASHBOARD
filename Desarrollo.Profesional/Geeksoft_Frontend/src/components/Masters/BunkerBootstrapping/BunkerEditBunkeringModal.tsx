import React, { useState, useEffect, useMemo } from 'react';
import { X, Anchor, Fuel, Save, AlertCircle, MapPin, Hash, FileText, Lock, ShieldCheck } from 'lucide-react';
import { BunkerBootstrappingService, getVesselFuelConfig } from '../../../services/bunkerBootstrappingService';
import type { BunkeringEventRecord } from '../../../services/bunkerBootstrappingService';

interface BunkerEditBunkeringModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    event: BunkeringEventRecord | null;
}

export const BunkerEditBunkeringModal: React.FC<BunkerEditBunkeringModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    event
}) => {
    if (!isOpen || !event) return null;

    const vesselId = event.vessel_id;
    const fuelConfig = getVesselFuelConfig(vesselId);
    const supportsMdo = fuelConfig.supportsMdo;

    // Campos editables (NO provienen de las facturas)
    const [eventDate, setEventDate] = useState(event.event_date);
    const [portId, setPortId] = useState(event.port_id || 'CALLAO');
    const [voyageNumber, setVoyageNumber] = useState(event.voyage_number || '');
    const [notes, setNotes] = useState(event.notes || '');
    const [robIfoMt, setRobIfoMt] = useState<number | ''>(Number(event.rob_ifo_mt) || 0);
    const [robMdoMt, setRobMdoMt] = useState<number | ''>(Number(event.rob_mdo_mt) || 0);

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (event) {
            setEventDate(event.event_date);
            setPortId(event.port_id || 'CALLAO');
            setVoyageNumber(event.voyage_number || '');
            setNotes(event.notes || '');
            setRobIfoMt(Number(event.rob_ifo_mt) || 0);
            setRobMdoMt(Number(event.rob_mdo_mt) || 0);
        }
    }, [event]);

    // Campos inmutables (heredados y de facturas)
    const pricePrevIfo = Number(event.price_prev_ifo_usd) || 0;
    const pricePrevMdo = Number(event.price_prev_mdo_usd) || 0;
    const purchasedIfoMt = Number(event.purchased_ifo_mt) || 0;
    const purchasedIfoTotalUsd = Number(event.purchased_ifo_total_usd) || 0;
    const purchasedMdoMt = Number(event.purchased_mdo_mt) || 0;
    const purchasedMdoTotalUsd = Number(event.purchased_mdo_total_usd) || 0;
    const invoicesList = event.invoices || [];

    // Recálculo dinámico en vivo
    const numRobIfo = Number(robIfoMt) || 0;
    const numRobMdo = Number(robMdoMt) || 0;

    const liveTotalIfoMt = numRobIfo + purchasedIfoMt;
    const liveCostIfo = (numRobIfo * pricePrevIfo) + purchasedIfoTotalUsd;
    const liveWeightedIfo = liveTotalIfoMt > 0 ? (liveCostIfo / liveTotalIfoMt) : pricePrevIfo;

    const liveTotalMdoMt = numRobMdo + purchasedMdoMt;
    const liveCostMdo = (numRobMdo * pricePrevMdo) + purchasedMdoTotalUsd;
    const liveWeightedMdo = supportsMdo && liveTotalMdoMt > 0 ? (liveCostMdo / liveTotalMdoMt) : pricePrevMdo;

    // BAF SPCC en tiempo real
    const bafCalc = useMemo(() => {
        const c10 = pricePrevIfo > 0 ? pricePrevIfo : 967.26;
        const c11 = pricePrevMdo > 0 ? pricePrevMdo : 1528.26;
        const denom = supportsMdo ? (c10 * 38.40 + c11 * 9.50) : (c10 * 38.40);
        const numer = supportsMdo ? (liveWeightedIfo * 38.40 + liveWeightedMdo * 9.50) : (liveWeightedIfo * 38.40);
        const rawFactor = denom > 0 ? numer / denom : 1.0;
        const factor = Math.ceil(rawFactor * 10000.0) / 10000.0;
        const initVal = 4.1700;
        const newBaf = Number((factor * initVal).toFixed(4));
        const variation = Number((newBaf - initVal).toFixed(4));
        return { factor, initVal, newBaf, variation };
    }, [liveWeightedIfo, liveWeightedMdo, pricePrevIfo, pricePrevMdo, supportsMdo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        try {
            await BunkerBootstrappingService.updateBunkeringEvent(event.id, {
                event_date: eventDate,
                port_id: portId.trim().toUpperCase() || 'CALLAO',
                voyage_number: voyageNumber.trim() || undefined,
                notes: notes.trim(),
                rob_ifo_mt: numRobIfo,
                rob_mdo_mt: supportsMdo ? numRobMdo : 0
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error actualizando tanqueada:', err);
            setErrorMsg(err.message || 'Error al actualizar evento de tanqueo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* 1. Header con Identidad Fija */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0284c7] dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center font-bold">
                            <Anchor size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                    Editar Tanqueada • {fuelConfig.vessel_name}
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#0284c7] dark:bg-blue-900/40 dark:text-blue-300">
                                    {event.voyage_number || `TNK-${event.event_date.replace(/-/g, '')}`}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Edita el saldo físico al arribo (ROB) y datos del viaje. Las facturas tributarias de compra permanecen auditadas e inmutables.
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

                    {/* SECCIÓN 1: DATOS OPERATIVOS DEL VIAJE */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                        <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <Anchor size={14} className="text-[#0284c7]" />
                            1. Parámetros Operativos del Tanqueo (Editables)
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                                    <Hash size={12} className="text-slate-400" />
                                    N° Viaje / Referencia
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-[#0284c7]"
                                    value={voyageNumber}
                                    onChange={(e) => setVoyageNumber(e.target.value)}
                                    placeholder="TNK-20261006-CALLAO"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fecha de Operación</label>
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
                                    Puerto de Tanqueo
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-white outline-none focus:border-[#0284c7]"
                                    value={portId}
                                    onChange={(e) => setPortId(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Notas de Auditoría</label>
                            <input
                                type="text"
                                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-700 dark:text-slate-200 outline-none focus:border-[#0284c7]"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Notas operativas del tanqueo..."
                            />
                        </div>
                    </div>

                    {/* SECCIÓN 2: SALDOS FÍSICOS AL ARRIBO (ROB - EDITABLE) VS PRECIOS BASE (ESTÁTICOS) */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                        <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <Fuel size={14} className="text-[#0284c7]" />
                            2. Saldo Físico al Arribo en Tanques (ROB de Medición)
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* IFO 380 */}
                            <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-slate-950 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-amber-800 dark:text-amber-300 text-xs">
                                        IFO 380
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        P. Base: ${pricePrevIfo.toFixed(2)}/TM (Estático)
                                    </span>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase block mb-1 font-bold">
                                        ROB al Arribo (TM)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full bg-amber-50/30 dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg p-2 font-mono font-black text-base text-slate-900 dark:text-white outline-none focus:border-amber-500"
                                        value={robIfoMt}
                                        onChange={(e) => setRobIfoMt(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="text-[10px] font-mono text-slate-500">
                                    Total IFO post-tanqueo: <strong>{liveTotalIfoMt.toFixed(2)} TM</strong> ➔ Nuevo Pond: <strong className="text-amber-800 dark:text-amber-300">${liveWeightedIfo.toFixed(2)}/TM</strong>
                                </div>
                            </div>

                            {/* MDO (si aplica) */}
                            {supportsMdo && (
                                <div className="p-3 rounded-lg border border-cyan-200 dark:border-cyan-900/40 bg-white dark:bg-slate-950 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-cyan-800 dark:text-cyan-300 text-xs">
                                            MDO
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400">
                                            P. Base: ${pricePrevMdo.toFixed(2)}/TM (Estático)
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase block mb-1 font-bold">
                                            ROB al Arribo (TM)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="w-full bg-cyan-50/30 dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 rounded-lg p-2 font-mono font-black text-base text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                                            value={robMdoMt}
                                            onChange={(e) => setRobMdoMt(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-500">
                                        Total MDO post-tanqueo: <strong>{liveTotalMdoMt.toFixed(2)} TM</strong> ➔ Nuevo Pond: <strong className="text-cyan-800 dark:text-cyan-300">${liveWeightedMdo.toFixed(2)}/TM</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN 3: FACTURAS ASOCIADAS (INMUTABLES) */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <Lock size={14} className="text-slate-400" />
                                3. Facturas de Compra Sustentatorias ({invoicesList.length}) • Inmutables
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded">
                                <ShieldCheck size={11} className="text-emerald-500" /> Auditado SUNAT
                            </span>
                        </div>

                        {invoicesList.length === 0 ? (
                            <div className="text-center py-3 text-slate-400 text-xs italic">
                                No hay facturas vinculadas a este registro.
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                                <table className="w-full text-left font-mono text-[11px]">
                                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase text-[9px] border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="py-1.5 px-2.5">Factura</th>
                                            <th className="py-1.5 px-2.5">Proveedor</th>
                                            <th className="py-1.5 px-2.5">Fuel</th>
                                            <th className="py-1.5 px-2.5 text-right">Cantidad TM</th>
                                            <th className="py-1.5 px-2.5 text-right">Precio $/TM</th>
                                            <th className="py-1.5 px-2.5 text-right">Total USD</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {invoicesList.map(inv => (
                                            <tr key={inv.id} className="text-slate-700 dark:text-slate-300">
                                                <td className="py-1.5 px-2.5 font-bold text-[#0284c7]">{inv.invoice_number}</td>
                                                <td className="py-1.5 px-2.5">{inv.supplier}</td>
                                                <td className="py-1.5 px-2.5">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                        inv.fuel_type === 'IFO' ? 'bg-amber-100 text-amber-800' : 'bg-cyan-100 text-cyan-800'
                                                    }`}>
                                                        {inv.fuel_type}
                                                    </span>
                                                </td>
                                                <td className="py-1.5 px-2.5 text-right font-bold">{Number(inv.quantity_mt).toFixed(2)}</td>
                                                <td className="py-1.5 px-2.5 text-right">${Number(inv.unit_price_usd).toFixed(2)}</td>
                                                <td className="py-1.5 px-2.5 text-right font-black text-slate-900 dark:text-white">
                                                    ${Number(inv.total_amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 4: IMPACTO BAF SPCC RESULTANTE */}
                    <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 flex items-center justify-between text-xs font-mono">
                        <div>
                            <span className="font-bold text-purple-950 dark:text-purple-200 font-sans block">
                                Impacto BAF SPCC Recalculado:
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                                ({bafCalc.factor.toFixed(4)} × ${bafCalc.initVal.toFixed(2)}) - ${bafCalc.initVal.toFixed(2)}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="font-black text-sm text-purple-900 dark:text-purple-200 block">
                                {bafCalc.factor.toFixed(4)}
                            </span>
                            <span className={`text-xs font-bold ${bafCalc.variation <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                Var: {bafCalc.variation > 0 ? '+' : ''}{bafCalc.variation.toFixed(4)} USD/pmt
                            </span>
                        </div>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
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
                            <span>{loading ? 'Recalculando y Guardando...' : 'Guardar Cambios'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
