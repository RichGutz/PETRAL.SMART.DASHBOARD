import React, { useState, useEffect } from 'react';
import { 
    X, Upload, Plus, Trash2, Eye, ShieldCheck, Fuel, 
    Anchor, Calendar, Save, AlertCircle, FileText, CheckCircle2, RotateCcw
} from 'lucide-react';
import { BunkerBootstrappingService } from '../../../services/bunkerBootstrappingService';
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
    // Encabezado del Tanqueo
    const [vesselId, setVesselId] = useState(activeVessel === 'TODOS' ? 'MOQUEGUA' : activeVessel);
    const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
    const [portId, setPortId] = useState('CALLAO');
    const [voyageNumber, setVoyageNumber] = useState('');
    const [notes, setNotes] = useState('');

    // Stock Previo ROB (Precargado desde el último evento o valores por defecto)
    const [robIfoMt, setRobIfoMt] = useState<number>(120.40);
    const [pricePrevIfoUsd, setPricePrevIfoUsd] = useState<number>(967.26);
    const [robMdoMt, setRobMdoMt] = useState<number>(90.30);
    const [pricePrevMdoUsd, setPricePrevMdoUsd] = useState<number>(1528.26);

    // Facturas añadidas al evento
    const [invoices, setInvoices] = useState<InvoiceItemPayload[]>([]);

    // Factura en edición / prellenado actual
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

    // Estado del visor de PDF a la izquierda
    const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState<string>('Factura en Revisión');

    // UI Feedback
    const [isParsing, setIsParsing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Precargar precios previos al abrir o cambiar buque
    useEffect(() => {
        if (latestEvent) {
            setPricePrevIfoUsd(Number(latestEvent.weighted_avg_ifo_usd) || 967.26);
            setPricePrevMdoUsd(Number(latestEvent.weighted_avg_mdo_usd) || 1528.26);
        }
    }, [latestEvent, activeVessel]);

    if (!isOpen) return null;

    // Handler para subida y parseo de PDF
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setErrorMsg(null);

        // Crear Blob URL local para el visor inmediato
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

    // Añadir factura actual a la lista del tanqueo
    const handleAddCurrentInvoice = () => {
        if (!currentInvNum || currentQty <= 0 || currentPrice <= 0) {
            setErrorMsg('Por favor ingresa un número de factura, cantidad mayor a 0 y precio unitario válido.');
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

        // Limpiar formulario de factura
        setCurrentInvNum('');
        setCurrentQty(0);
        setCurrentPrice(0);
        setCurrentTotal(0);
        setCurrentBase64('');
        setErrorMsg(null);
    };

    const handleRemoveInvoice = (index: number) => {
        const updated = invoices.filter((_, idx) => idx !== index);
        setInvoices(updated);
    };

    // Matemática en Vivo:
    const ifoInvoices = invoices.filter(inv => inv.fuel_type === 'IFO');
    const mdoInvoices = invoices.filter(inv => inv.fuel_type === 'MDO');

    const totalPurchasedIfoMt = ifoInvoices.reduce((acc, inv) => acc + inv.quantity_mt, 0);
    const totalPurchasedIfoUsd = ifoInvoices.reduce((acc, inv) => acc + inv.total_amount_usd, 0);

    const totalPurchasedMdoMt = mdoInvoices.reduce((acc, inv) => acc + inv.quantity_mt, 0);
    const totalPurchasedMdoUsd = mdoInvoices.reduce((acc, inv) => acc + inv.total_amount_usd, 0);

    // Ponderado IFO
    const totalIfoMt = robIfoMt + totalPurchasedIfoMt;
    const costPrevIfo = robIfoMt * pricePrevIfoUsd;
    const totalCostIfo = costPrevIfo + totalPurchasedIfoUsd;
    const weightedAvgIfo = totalIfoMt > 0 ? (totalCostIfo / totalIfoMt) : pricePrevIfoUsd;

    // Ponderado MDO
    const totalMdoMt = robMdoMt + totalPurchasedMdoMt;
    const costPrevMdo = robMdoMt * pricePrevMdoUsd;
    const totalCostMdo = costPrevMdo + totalPurchasedMdoUsd;
    const weightedAvgMdo = totalMdoMt > 0 ? (totalCostMdo / totalMdoMt) : pricePrevMdoUsd;

    // BAF Contractual SPCC (Consumo Rotación BT MOQUEGUA: 38.40 TM IFO + 9.50 TM MDO)
    const denomBaf = (pricePrevIfoUsd * 38.40) + (pricePrevMdoUsd * 9.50);
    const numerBaf = (weightedAvgIfo * 38.40) + (weightedAvgMdo * 9.50);
    const rawBafFactor = denomBaf > 0 ? (numerBaf / denomBaf) : 1.0;
    const totalBaf = Math.ceil(rawBafFactor * 10000) / 10000;
    const newBaf = totalBaf * 4.17;
    const bafVar = newBaf - 4.17;

    // Guardar Evento Completo
    const handleSaveBunkering = async () => {
        if (invoices.length === 0) {
            setErrorMsg('Debes adjuntar al menos 1 factura de compra para registrar un nuevo tanqueo.');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            const payload: BunkeringEventPayload = {
                vessel_id: vesselId,
                event_date: eventDate,
                port_id: portId,
                voyage_number: voyageNumber || undefined,
                rob_ifo_mt: Number(robIfoMt),
                price_prev_ifo_usd: Number(pricePrevIfoUsd),
                rob_mdo_mt: Number(robMdoMt),
                price_prev_mdo_usd: Number(pricePrevMdoUsd),
                notes: notes || undefined,
                created_by: 'admin@petral.com',
                invoices: invoices
            };

            await BunkerBootstrappingService.recordBunkeringEvent(payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || 'Error guardando el tanqueo');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-[96vw] h-[92vh] flex flex-col overflow-hidden text-white">
                
                {/* Header Superior */}
                <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Fuel size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                                Asistente de Tanqueo & Ponderación Multifactura
                            </h3>
                            <p className="text-xs text-slate-400 font-mono">
                                Validación Forense Split-Screen: PDF Original + Formulario + Ponderado Determinístico
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

                {/* Panel Central Dividido (Split-Screen 50% / 50%) */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    
                    {/* PANEL IZQUIERDO: VISOR NATIVO DE PDF (50%) */}
                    <div className="w-full lg:w-1/2 bg-slate-950 border-r border-slate-800 flex flex-col h-full overflow-hidden">
                        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                                <FileText size={14} className="text-blue-400" />
                                {previewTitle}
                            </span>
                            {previewPdfBlobUrl && (
                                <a
                                    href={previewPdfBlobUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] font-mono text-blue-400 hover:text-blue-300 underline"
                                >
                                    Abrir en ventana completa
                                </a>
                            )}
                        </div>

                        <div className="flex-1 bg-slate-950 p-2 flex items-center justify-center relative">
                            {previewPdfBlobUrl ? (
                                <iframe
                                    src={previewPdfBlobUrl}
                                    className="w-full h-full border-0 rounded-lg shadow-inner bg-slate-900"
                                    title="Visor Factura PDF"
                                />
                            ) : (
                                <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-2xl max-w-sm">
                                    <FileText size={48} className="mx-auto text-slate-700 mb-3" />
                                    <p className="text-sm font-bold text-slate-400">Ningún PDF seleccionado</p>
                                    <p className="text-xs text-slate-600 mt-1">
                                        Arrastra o sube una factura al lado derecho para visualizarla aquí al instante.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PANEL DERECHO: FORMULARIO INTERACTIVO & MATEMÁTICA (50%) */}
                    <div className="w-full lg:w-1/2 flex flex-col h-full overflow-y-auto p-5 space-y-4">
                        
                        {errorMsg && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 shrink-0">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* SECCIÓN 1: CABECERA DEL EVENTO */}
                        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                            <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                                <Anchor size={14} className="text-blue-400" /> 1. Datos Operativos de la Recalada
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Buque</label>
                                    <select
                                        value={vesselId}
                                        onChange={(e) => setVesselId(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:border-blue-500 focus:outline-none font-mono"
                                    >
                                        <option value="MOQUEGUA">BT MOQUEGUA</option>
                                        <option value="TABLONES">BT TABLONES</option>
                                        <option value="HUEMUL">BT HUEMUL</option>
                                        <option value="CONCON_TRADER">CONCON TRADER</option>
                                        <option value="BOW_CONDOR">BOW CONDOR</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Fecha Tanqueo</label>
                                    <input
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:border-blue-500 focus:outline-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Puerto</label>
                                    <input
                                        type="text"
                                        value={portId}
                                        onChange={(e) => setPortId(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:border-blue-500 focus:outline-none font-mono uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">N° Viaje / Ref</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Viaje 785"
                                        value={voyageNumber}
                                        onChange={(e) => setVoyageNumber(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: STOCK REMANENTE ROB (PREVIO AL TANQUEO) */}
                        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                                    <Fuel size={14} className="text-amber-400" /> 2. Stock Remanente a Bordo (ROB) Antes del Tanqueo
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">Precios base P(N-1) precargados</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* IFO ROB */}
                                <div className="p-2.5 bg-slate-900/80 border border-amber-500/20 rounded-lg">
                                    <span className="text-[11px] font-bold text-amber-400 block mb-1">ROB IFO 380 (VLSFO)</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[9px] text-slate-400 uppercase font-mono">Cantidad (TM)</label>
                                            <input
                                                type="number"
                                                step="0.0001"
                                                value={robIfoMt}
                                                onChange={(e) => setRobIfoMt(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] text-slate-400 uppercase font-mono">Precio Base ($/TM)</label>
                                            <input
                                                type="number"
                                                step="0.0001"
                                                value={pricePrevIfoUsd}
                                                onChange={(e) => setPricePrevIfoUsd(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* MDO ROB */}
                                <div className="p-2.5 bg-slate-900/80 border border-cyan-500/20 rounded-lg">
                                    <span className="text-[11px] font-bold text-cyan-400 block mb-1">ROB MDO (MGO Homologado)</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[9px] text-slate-400 uppercase font-mono">Cantidad (TM)</label>
                                            <input
                                                type="number"
                                                step="0.0001"
                                                value={robMdoMt}
                                                onChange={(e) => setRobMdoMt(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] text-slate-400 uppercase font-mono">Precio Base ($/TM)</label>
                                            <input
                                                type="number"
                                                step="0.0001"
                                                value={pricePrevMdoUsd}
                                                onChange={(e) => setPricePrevMdoUsd(parseFloat(e.target.value) || 0)}
                                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 3: SUBIDA Y PARSEO DE FACTURAS (MULTICAJA) */}
                        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                            <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                                <Upload size={14} className="text-emerald-400" /> 3. Facturas de Compra de este Tanqueo (1 Tanqueo = N Facturas)
                            </span>

                            {/* Uploader Drag & Drop */}
                            <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-3 flex items-center justify-center gap-3 cursor-pointer bg-slate-900/40 hover:bg-slate-900 transition-all">
                                <Upload size={20} className={isParsing ? "text-blue-400 animate-spin" : "text-slate-400"} />
                                <div className="text-left">
                                    <p className="text-xs font-bold text-white">
                                        {isParsing ? "Analizando Factura con pdfplumber..." : "Cargar Factura PDF (Oil Trading, Fuel Logistics, etc.)"}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-mono">
                                        Detección automática de RUC, Nave, Combustible, TM y Precios
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </label>

                            {/* Campos editables de la factura cargada */}
                            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg space-y-2">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div>
                                        <label className="block text-[9px] text-slate-400 uppercase font-mono">N° Factura</label>
                                        <input
                                            type="text"
                                            placeholder="F001-3123"
                                            value={currentInvNum}
                                            onChange={(e) => setCurrentInvNum(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white font-mono uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] text-slate-400 uppercase font-mono">Combustible</label>
                                        <select
                                            value={currentFuel}
                                            onChange={(e) => setCurrentFuel(e.target.value as 'IFO' | 'MDO')}
                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white font-mono"
                                        >
                                            <option value="IFO">IFO 380 (VLSFO)</option>
                                            <option value="MDO">MDO (MGO Homologado)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] text-slate-400 uppercase font-mono">Cantidad (TM)</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={currentQty}
                                            onChange={(e) => {
                                                const q = parseFloat(e.target.value) || 0;
                                                setCurrentQty(q);
                                                setCurrentTotal(roundTo2(q * currentPrice));
                                            }}
                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] text-slate-400 uppercase font-mono">Precio ($/TM)</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={currentPrice}
                                            onChange={(e) => {
                                                const p = parseFloat(e.target.value) || 0;
                                                setCurrentPrice(p);
                                                setCurrentTotal(roundTo2(currentQty * p));
                                            }}
                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <div className="text-[11px] font-mono text-slate-400">
                                        Total Factura: <span className="text-white font-bold">${currentTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddCurrentInvoice}
                                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                    >
                                        <Plus size={14} />
                                        <span>Añadir al Tanqueo</span>
                                    </button>
                                </div>
                            </div>

                            {/* Lista de Facturas Añadidas */}
                            {invoices.length > 0 && (
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                                        Facturas Consolidadas ({invoices.length}):
                                    </span>
                                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/80">
                                        {invoices.map((inv, idx) => (
                                            <div key={idx} className="p-2.5 flex items-center justify-between text-xs font-mono">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                        inv.fuel_type === 'IFO' 
                                                            ? 'bg-amber-500/20 text-amber-300' 
                                                            : 'bg-cyan-500/20 text-cyan-300'
                                                    }`}>
                                                        {inv.fuel_type}
                                                    </span>
                                                    <span className="font-bold text-white">{inv.invoice_number}</span>
                                                    <span className="text-slate-400">• {inv.quantity_mt} TM @ ${inv.unit_price_usd}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-slate-200">
                                                        ${inv.total_amount_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveInvoice(idx)}
                                                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                                        title="Quitar factura"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECCIÓN 4: RESULTADO DETERMINÍSTICO EN VIVO */}
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                            <span className="text-xs font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                                <ShieldCheck size={16} /> 4. Resultados Matemáticos del Ponderado & Factor BAF
                            </span>

                            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                                    <span className="text-[10px] text-amber-400 block font-bold">NUEVO PONDERADO IFO</span>
                                    <div className="text-lg font-black text-white mt-1">
                                        ${weightedAvgIfo.toFixed(4)} <span className="text-xs text-slate-400">USD/TM</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1">
                                        Total: {totalIfoMt.toFixed(2)} TM (${totalCostIfo.toFixed(2)})
                                    </div>
                                </div>

                                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                                    <span className="text-[10px] text-cyan-400 block font-bold">NUEVO PONDERADO MDO</span>
                                    <div className="text-lg font-black text-white mt-1">
                                        ${weightedAvgMdo.toFixed(4)} <span className="text-xs text-slate-400">USD/TM</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1">
                                        Total: {totalMdoMt.toFixed(2)} TM (${totalCostMdo.toFixed(2)})
                                    </div>
                                </div>
                            </div>

                            <div className="p-2.5 bg-purple-950/20 border border-purple-800/30 rounded-lg flex items-center justify-between text-xs font-mono">
                                <span className="text-purple-300">Factor BAF Contrato SPCC:</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-bold">{totalBaf.toFixed(4)}</span>
                                    <span className={bafVar <= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                        ({bafVar > 0 ? '+' : ''}{bafVar.toFixed(4)} USD/pmt)
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Inferior */}
                <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
                    <div className="text-xs text-slate-400 font-mono">
                        {invoices.length} facturas asociadas a este tanqueo
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveBunkering}
                            disabled={isSubmitting || invoices.length === 0}
                            className="px-6 py-2 rounded-lg text-xs font-black bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Save size={16} />
                            <span>{isSubmitting ? 'Guardando Tanqueo...' : 'Confirmar Tanqueo y Recalcular'}</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

function roundTo2(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}
