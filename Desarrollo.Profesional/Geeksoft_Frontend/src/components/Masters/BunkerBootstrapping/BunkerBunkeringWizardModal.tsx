import React, { useState, useEffect } from 'react';
import { 
    X, Upload, Plus, Trash2, Eye, ShieldCheck, Fuel, 
    Anchor, Calendar, Save, AlertCircle, FileText, CheckCircle2, RotateCcw, Sparkles
} from 'lucide-react';
import { BunkerBootstrappingService, getVesselFuelConfig } from '../../../services/bunkerBootstrappingService';
import type { 
    BunkeringEventRecord, 
    InvoiceItemPayload, 
    BunkeringEventPayload,
    ParsedPdfResult
} from '../../../services/bunkerBootstrappingService';

interface BunkerBunkeringWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    activeVessel: string;
    latestEvent?: BunkeringEventRecord;
}

export const BunkerBunkeringWizardModal: React.FC<BunkerBunkeringWizardModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    activeVessel,
    latestEvent
}) => {
    // 1. Campo para juntar facturas de la misma tanqueada (Encabezado de la Tanqueada)
    const [vesselId, setVesselId] = useState(activeVessel || 'MOQUEGUA');
    const fuelConfig = getVesselFuelConfig(vesselId);
    const supportsMdo = fuelConfig.supportsMdo;

    const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
    const [portId, setPortId] = useState('CALLAO');
    const [voyageNumber, setVoyageNumber] = useState('V-2026-OCT');
    const [tanqueadaCode, setTanqueadaCode] = useState('');
    const [notes, setNotes] = useState('');

    // 2. Campos para stock ROB y precio
    const [robIfoMt, setRobIfoMt] = useState<number>(120.40);
    const [pricePrevIfoUsd, setPricePrevIfoUsd] = useState<number>(967.26);
    const [robMdoMt, setRobMdoMt] = useState<number>(90.30);
    const [pricePrevMdoUsd, setPricePrevMdoUsd] = useState<number>(1528.26);

    // 3. Líneas que son los datos de las facturas agrupadas en esta tanqueada
    const [invoices, setInvoices] = useState<InvoiceItemPayload[]>([]);

    // Formulario de la factura actual que se está agregando
    const [currentInvNum, setCurrentInvNum] = useState('');
    const [currentSupplier, setCurrentSupplier] = useState('OIL TRADING S.A.C.');
    const [currentSupplierRuc, setCurrentSupplierRuc] = useState('20507656367');
    const [currentDate, setCurrentDate] = useState(eventDate);
    const [currentFuel, setCurrentFuel] = useState<'IFO' | 'MDO'>('IFO');
    const [currentQty, setCurrentQty] = useState<number>(0);
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [currentTotal, setCurrentTotal] = useState<number>(0);
    const [currentFilename, setCurrentFilename] = useState<string>('');
    const [currentBase64, setCurrentBase64] = useState<string>('');

    // Visor de PDF (Split-Screen)
    const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState<string>('Factura en Revisión');

    // UI Feedback
    const [isParsing, setIsParsing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Auto-generar código de tanqueada y precargar ROBs del último evento
    useEffect(() => {
        const vId = activeVessel || 'MOQUEGUA';
        setVesselId(vId);
        setTanqueadaCode(`TNK-${eventDate.replace(/-/g, '')}-${vId}`);

        if (latestEvent) {
            setPricePrevIfoUsd(Number(latestEvent.weighted_avg_ifo_usd) || 967.26);
            setPricePrevMdoUsd(Number(latestEvent.weighted_avg_mdo_usd) || 1528.26);
        }
    }, [latestEvent, activeVessel, eventDate]);

    if (!isOpen) return null;

    // Subida y auto-parseo de factura PDF
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setErrorMsg(null);

        const blobUrl = URL.createObjectURL(file);
        setPreviewPdfBlobUrl(blobUrl);
        setPreviewTitle(`Factura: ${file.name}`);

        try {
            const parsed: ParsedPdfResult = await BunkerBootstrappingService.parsePdf(file);
            setCurrentInvNum(parsed.invoice_number || '');
            setCurrentSupplier(parsed.supplier || 'OIL TRADING S.A.C.');
            setCurrentSupplierRuc(parsed.supplier_ruc || '');
            setCurrentDate(parsed.issue_date || eventDate);
            setCurrentFuel(parsed.fuel_type || 'IFO');
            setCurrentQty(parsed.quantity_mt || 0);
            setCurrentPrice(parsed.unit_price_usd || 0);
            setCurrentTotal(parsed.total_amount_usd || (parsed.quantity_mt * parsed.unit_price_usd));
            setCurrentFilename(file.name);
            setCurrentBase64(parsed.temp_base64 || '');
            if (parsed.vessel_id) {
                setVesselId(parsed.vessel_id);
            }
        } catch (err: any) {
            console.error('Error parseando PDF:', err);
            setErrorMsg(`Aviso: No se pudo auto-extraer todos los datos del PDF (${err.message}). Por favor completa los campos manualmente.`);
            setCurrentFilename(file.name);
        } finally {
            setIsParsing(false);
        }
    };

    // Agregar la línea de factura a la tanqueada
    const handleAddCurrentInvoice = () => {
        if (!currentInvNum || currentQty <= 0 || currentPrice <= 0) {
            setErrorMsg('Por favor ingresa un número de factura válido, cantidad mayor a 0 y precio unitario.');
            return;
        }

        const newInv: InvoiceItemPayload = {
            invoice_number: currentInvNum.trim().toUpperCase(),
            supplier: currentSupplier.trim().toUpperCase(),
            supplier_ruc: currentSupplierRuc.trim(),
            issue_date: currentDate,
            vessel_id: vesselId,
            fuel_type: currentFuel,
            quantity_mt: Number(currentQty),
            unit_price_usd: Number(currentPrice),
            total_amount_usd: Number(currentTotal || (currentQty * currentPrice)),
            pdf_filename: currentFilename,
            pdf_raw_base64: currentBase64
        };

        setInvoices([...invoices, newInv]);

        // Limpiar para la siguiente factura
        setCurrentInvNum('');
        setCurrentQty(0);
        setCurrentPrice(0);
        setCurrentTotal(0);
        setCurrentBase64('');
        setCurrentFilename('');
        setErrorMsg(null);
    };

    const handleRemoveInvoice = (index: number) => {
        setInvoices(invoices.filter((_, idx) => idx !== index));
    };

    // Cálculo matemático en vivo de la ponderación de la tanqueada
    const ifoInvoices = invoices.filter(i => i.fuel_type === 'IFO');
    const mdoInvoices = invoices.filter(i => i.fuel_type === 'MDO');

    const ifoPurchasedMt = ifoInvoices.reduce((acc, i) => acc + Number(i.quantity_mt), 0);
    const ifoPurchasedTotal = ifoInvoices.reduce((acc, i) => acc + Number(i.total_amount_usd), 0);
    const ifoTotalMt = robIfoMt + ifoPurchasedMt;
    const ifoTotalCost = (robIfoMt * pricePrevIfoUsd) + ifoPurchasedTotal;
    const ifoWeightedAvg = ifoTotalMt > 0 ? (ifoTotalCost / ifoTotalMt) : pricePrevIfoUsd;

    const mdoPurchasedMt = mdoInvoices.reduce((acc, i) => acc + Number(i.quantity_mt), 0);
    const mdoPurchasedTotal = mdoInvoices.reduce((acc, i) => acc + Number(i.total_amount_usd), 0);
    const mdoTotalMt = robMdoMt + mdoPurchasedMt;
    const mdoTotalCost = (robMdoMt * pricePrevMdoUsd) + mdoPurchasedTotal;
    const mdoWeightedAvg = mdoTotalMt > 0 ? (mdoTotalCost / mdoTotalMt) : pricePrevMdoUsd;

    // BAF SPCC Fórmula (Adaptada si la nave solo consume IFO)
    const baseDenom = supportsMdo
        ? ((pricePrevIfoUsd * 38.40) + (pricePrevMdoUsd * 9.50))
        : (pricePrevIfoUsd * 38.40);
    const currNumer = supportsMdo
        ? ((ifoWeightedAvg * 38.40) + (mdoWeightedAvg * 9.50))
        : (ifoWeightedAvg * 38.40);
    const rawBaf = baseDenom > 0 ? (currNumer / baseDenom) : 1.0;
    const bafFactor = Math.ceil(rawBaf * 10000) / 10000;
    const newBaf = bafFactor * 4.17;
    const bafVariation = newBaf - 4.17;

    // Guardar la tanqueada completa con todas sus facturas agrupadas
    const handleSaveBunkeringEvent = async () => {
        if (invoices.length === 0) {
            setErrorMsg('Debes añadir al menos una línea de factura a esta tanqueada antes de guardar.');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            const payload: BunkeringEventPayload = {
                vessel_id: vesselId,
                event_date: eventDate,
                port_id: portId,
                voyage_number: voyageNumber || tanqueadaCode,
                rob_ifo_mt: Number(robIfoMt),
                price_prev_ifo_usd: Number(pricePrevIfoUsd),
                rob_mdo_mt: supportsMdo ? Number(robMdoMt) : 0,
                price_prev_mdo_usd: supportsMdo ? Number(pricePrevMdoUsd) : 0,
                notes: notes ? `${notes} [${tanqueadaCode}]` : `Tanqueada ${tanqueadaCode}`,
                created_by: 'operaciones@petral.com',
                invoices: invoices
            };

            await BunkerBootstrappingService.recordBunkeringEvent(payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error guardando tanqueada:', err);
            setErrorMsg(`Error guardando operación: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
                
                {/* 1. Header del Modal */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#0284c7] dark:text-[#38bdf8] flex items-center justify-center font-bold">
                            <Fuel size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                Registrar Nueva Tanqueada & Multifactura
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Agrupa múltiples facturas a una misma operación de abastecimiento con cálculo de precio ponderado (ROB)
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

                {/* 2. Cuerpo del Modal */}
                <div className="p-6 overflow-y-auto flex flex-col gap-6 text-xs">
                    
                    {errorMsg && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0 text-rose-600" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* SECCIÓN A: CAMPO PARA JUNTAR FACTURAS DE LA MISMA TANQUEADA */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <Anchor size={14} className="text-[#0284c7]" />
                                1. Datos Generales de la Tanqueada (Agrupador de Facturas)
                            </span>
                            <span className="font-mono text-[10px] font-bold text-[#0284c7] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {tanqueadaCode}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Código Tanqueada</label>
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono font-bold text-slate-800 dark:text-white"
                                    value={tanqueadaCode}
                                    onChange={(e) => setTanqueadaCode(e.target.value)}
                                    placeholder="TNK-20261006-CALLAO"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Buque (Fijo)</label>
                                <div className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                                    <Anchor size={14} className="text-[#0284c7] shrink-0" />
                                    <span>{fuelConfig.vessel_name}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fecha Tanqueo</label>
                                <input
                                    type="date"
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-white"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Puerto</label>
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-white"
                                    value={portId}
                                    onChange={(e) => setPortId(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">N° Viaje</label>
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-slate-800 dark:text-white"
                                    value={voyageNumber}
                                    onChange={(e) => setVoyageNumber(e.target.value)}
                                    placeholder="V-2026-OCT"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN B: SALDO ROB EN TANQUES Y PRECIO CONTABLE PREVIO (ESTÁTICO) */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-amber-500" />
                                2. Saldo Físico en Tanques (ROB) & Precios Base Contables Anteriores
                            </span>
                            <span className="text-[10px] text-emerald-600 font-mono font-bold">
                                ✓ Precios Previos Inmutables (Corte Anterior)
                            </span>
                        </div>

                        <div className={`grid grid-cols-1 ${supportsMdo ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-3 font-mono`}>
                            {/* Saldo ROB IFO (Editable) */}
                            <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border-2 border-amber-300 dark:border-amber-700 shadow-2xs">
                                <label className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase block mb-1">
                                    Saldo Físico ROB IFO (TM)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-transparent font-black text-slate-900 dark:text-white text-base outline-none border-b border-amber-200 dark:border-amber-800 focus:border-amber-500 pb-0.5"
                                    value={robIfoMt || ''}
                                    onChange={(e) => setRobIfoMt(parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                />
                                <span className="text-[10px] text-slate-400 block mt-1 font-sans">
                                    Inventario remanente en tanques
                                </span>
                            </div>

                            {/* Precio Previo IFO (ESTÁTICO / BLOQUEADO) */}
                            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center justify-between">
                                    <span>Precio Previo IFO</span>
                                    <span className="text-[9px] bg-amber-200/70 text-amber-900 dark:bg-amber-900 dark:text-amber-200 px-1 py-0.2 rounded font-sans font-bold">ESTÁTICO</span>
                                </span>
                                <div className="font-black text-amber-800 dark:text-amber-300 text-base py-0.5">
                                    ${Number(pricePrevIfoUsd).toFixed(2)} <span className="text-xs font-normal text-slate-400">USD/TM</span>
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-1 font-sans">
                                    Heredado del corte contable
                                </span>
                            </div>

                            {supportsMdo && (
                                <>
                                    {/* Saldo ROB MDO (Editable) */}
                                    <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border-2 border-cyan-300 dark:border-cyan-700 shadow-2xs">
                                        <label className="text-[10px] font-black text-cyan-800 dark:text-cyan-300 uppercase block mb-1">
                                            Saldo Físico ROB MDO (TM)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full bg-transparent font-black text-slate-900 dark:text-white text-base outline-none border-b border-cyan-200 dark:border-cyan-800 focus:border-cyan-500 pb-0.5"
                                            value={robMdoMt || ''}
                                            onChange={(e) => setRobMdoMt(parseFloat(e.target.value) || 0)}
                                            placeholder="0.00"
                                        />
                                        <span className="text-[10px] text-slate-400 block mt-1 font-sans">
                                            Inventario remanente en tanques
                                        </span>
                                    </div>

                                    {/* Precio Previo MDO (ESTÁTICO / BLOQUEADO) */}
                                    <div className="p-3 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/50">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center justify-between">
                                            <span>Precio Previo MDO</span>
                                            <span className="text-[9px] bg-cyan-200/70 text-cyan-900 dark:bg-cyan-900 dark:text-cyan-200 px-1 py-0.2 rounded font-sans font-bold">ESTÁTICO</span>
                                        </span>
                                        <div className="font-black text-cyan-800 dark:text-cyan-300 text-base py-0.5">
                                            ${Number(pricePrevMdoUsd).toFixed(2)} <span className="text-xs font-normal text-slate-400">USD/TM</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 block mt-1 font-sans">
                                            Heredado del corte contable
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN C: LÍNEAS QUE SON LOS DATOS DE LAS FACTURAS */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <FileText size={14} className="text-[#0284c7]" />
                                3. Líneas de Factura Asociadas a esta Tanqueada ({invoices.length} agregadas)
                            </span>
                            
                            {/* Input para subir PDF de la factura */}
                            <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-[#0284c7] border border-blue-200 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
                                <Upload size={13} />
                                <span>{isParsing ? 'Extrayendo PDF...' : 'Subir Factura PDF (Auto-completar)'}</span>
                                <input 
                                    type="file" 
                                    accept="application/pdf" 
                                    className="hidden" 
                                    onChange={handleFileUpload}
                                    disabled={isParsing}
                                />
                            </label>
                        </div>

                        {/* Formulario para agregar una nueva línea de factura */}
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">N° Factura</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded p-1.5 font-mono font-bold text-slate-800 dark:text-white"
                                    value={currentInvNum}
                                    onChange={(e) => setCurrentInvNum(e.target.value)}
                                    placeholder="F001-3123"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Proveedor / RUC</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded p-1.5 font-bold text-slate-800 dark:text-white"
                                    value={currentSupplier}
                                    onChange={(e) => setCurrentSupplier(e.target.value)}
                                    placeholder="OIL TRADING S.A.C."
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Combustible</label>
                                <select
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded p-1.5 font-bold text-slate-800 dark:text-white"
                                    value={currentFuel}
                                    onChange={(e) => setCurrentFuel(e.target.value as any)}
                                >
                                    <option value="IFO">IFO 380 (VLSFO)</option>
                                    {supportsMdo && <option value="MDO">MDO (MGO)</option>}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cantidad (TM)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded p-1.5 font-mono font-bold text-slate-800 dark:text-white text-right"
                                    value={currentQty || ''}
                                    onChange={(e) => {
                                        const q = parseFloat(e.target.value) || 0;
                                        setCurrentQty(q);
                                        setCurrentTotal(q * currentPrice);
                                    }}
                                    placeholder="200.00"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Precio ($/TM)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded p-1.5 font-mono font-bold text-slate-800 dark:text-white text-right"
                                    value={currentPrice || ''}
                                    onChange={(e) => {
                                        const p = parseFloat(e.target.value) || 0;
                                        setCurrentPrice(p);
                                        setCurrentTotal(currentQty * p);
                                    }}
                                    placeholder="865.00"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={handleAddCurrentInvoice}
                                    className="w-full bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold py-1.5 px-2 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                >
                                    <Plus size={14} />
                                    <span>Agregar</span>
                                </button>
                            </div>
                        </div>

                        {/* Tabla de Facturas agregadas a esta tanqueada */}
                        {invoices.length > 0 && (
                            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                                <table className="w-full text-left border-collapse text-xs font-mono">
                                    <thead>
                                        <tr className="bg-slate-100 dark:bg-slate-950 text-[10px] uppercase text-slate-500 tracking-wider">
                                            <th className="p-2">Factura N°</th>
                                            <th className="p-2">Proveedor</th>
                                            <th className="p-2">Combustible</th>
                                            <th className="p-2 text-right">Cantidad (TM)</th>
                                            <th className="p-2 text-right">Precio ($/TM)</th>
                                            <th className="p-2 text-right">Total Factura (USD)</th>
                                            <th className="p-2 text-center">PDF</th>
                                            <th className="p-2 text-center">Quitar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {invoices.map((inv, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                <td className="p-2 font-bold text-[#0284c7]">{inv.invoice_number}</td>
                                                <td className="p-2">{inv.supplier}</td>
                                                <td className="p-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                        inv.fuel_type === 'IFO' ? 'bg-amber-100 text-amber-800' : 'bg-cyan-100 text-cyan-800'
                                                    }`}>
                                                        {inv.fuel_type}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-right font-bold">{Number(inv.quantity_mt).toFixed(4)} TM</td>
                                                <td className="p-2 text-right">${Number(inv.unit_price_usd).toFixed(2)}</td>
                                                <td className="p-2 text-right font-black text-slate-900 dark:text-white">
                                                    ${Number(inv.total_amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {inv.pdf_raw_base64 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                try {
                                                                    const byteCharacters = atob(inv.pdf_raw_base64 || '');
                                                                    const byteNumbers = new Array(byteCharacters.length);
                                                                    for (let i = 0; i < byteCharacters.length; i++) {
                                                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                                                    }
                                                                    const byteArray = new Uint8Array(byteNumbers);
                                                                    const blob = new Blob([byteArray], { type: 'application/pdf' });
                                                                    const blobUrl = URL.createObjectURL(blob);
                                                                    window.open(blobUrl, '_blank');
                                                                } catch {
                                                                    alert('No se pudo previsualizar el PDF');
                                                                }
                                                            }}
                                                            className="text-xs font-bold text-[#0284c7] hover:text-[#0369a1] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                                                            title="Previsualizar documento PDF subido"
                                                        >
                                                            <Eye size={13} />
                                                            <span className="truncate max-w-[120px]">{inv.pdf_filename || 'Ver PDF'}</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-400 text-[11px]">Sin archivo</span>
                                                    )}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveInvoice(idx)}
                                                        className="text-rose-500 hover:text-rose-700 p-1"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN D: RESULTADOS DETERMINÍSTICOS EN VIVO */}
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-wrap items-center justify-between gap-4 font-mono">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300 block">
                                Ponderado Resultante IFO 380:
                            </span>
                            <span className="text-base font-black text-amber-700 dark:text-amber-400">
                                ${ifoWeightedAvg.toFixed(4)} USD/TM
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                                Total: {ifoTotalMt.toFixed(2)} TM (ROB: {robIfoMt.toFixed(2)} + Compra: {ifoPurchasedMt.toFixed(2)})
                            </span>
                        </div>

                        {supportsMdo && (
                            <div>
                                <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300 block">
                                    Ponderado Resultante MDO:
                                </span>
                                <span className="text-base font-black text-cyan-700 dark:text-cyan-400">
                                    ${mdoWeightedAvg.toFixed(4)} USD/TM
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                    Total: {mdoTotalMt.toFixed(2)} TM (ROB: {robMdoMt.toFixed(2)} + Compra: {mdoPurchasedMt.toFixed(2)})
                                </span>
                            </div>
                        )}

                        <div>
                            <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300 block">
                                Factor BAF SPCC:
                            </span>
                            <span className="text-base font-black text-purple-700 dark:text-purple-400">
                                {bafFactor.toFixed(4)}
                            </span>
                            <span className={`text-[10px] font-bold block ${bafVariation <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                Var: {bafVariation > 0 ? '+' : ''}{bafVariation.toFixed(4)} USD/pmt
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Footer del Modal */}
                <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={handleSaveBunkeringEvent}
                        disabled={isSubmitting || invoices.length === 0}
                        className="px-5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                        <Save size={14} />
                        <span>{isSubmitting ? 'Guardando Tanqueada...' : 'Guardar Tanqueada con sus Facturas'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
