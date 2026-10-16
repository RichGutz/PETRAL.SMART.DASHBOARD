import React, { useState, useMemo } from 'react';
import { 
    Calendar, Anchor, Fuel, ShieldCheck, ChevronDown, ChevronUp, 
    FileText, Eye, Trash2, Sparkles, Layers, CheckSquare, Square,
    ExternalLink, Download, BookOpen
} from 'lucide-react';
import { getVesselFuelConfig } from '../../../services/bunkerBootstrappingService';
import type { BunkeringEventRecord, InvoiceRecord } from '../../../services/bunkerBootstrappingService';

interface BunkerEventsHistoryTableProps {
    events: BunkeringEventRecord[];
    onOpenPdfViewer: (invoiceId: string, invoiceNumber: string, filename?: string) => void;
    onDeleteEvent: (eventId: string) => void;
    selectedEventIds?: Set<string>;
    onToggleSelectEvent?: (eventId: string) => void;
}

export const BunkerEventsHistoryTable: React.FC<BunkerEventsHistoryTableProps> = ({
    events,
    onOpenPdfViewer,
    onDeleteEvent,
    selectedEventIds = new Set(),
    onToggleSelectEvent
}) => {
    // 1. Orden cronológico: De la más reciente (arriba) a la menos reciente (abajo).
    // El "Asiento de Apertura" (Génesis inicial) se ubica abajo del todo como base contable.
    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => {
            if (a.is_bootstrap && !b.is_bootstrap) return 1;
            if (!a.is_bootstrap && b.is_bootstrap) return -1;
            return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
        });
    }, [events]);

    // Todos los acordeones expandidos por defecto para visibilidad total inmediata
    const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        events.forEach(ev => { initial[ev.id] = true; });
        return initial;
    });

    const toggleAccordion = (eventId: string) => {
        setExpandedEvents(prev => ({ ...prev, [eventId]: !prev[eventId] }));
    };

    if (events.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-2xs">
                <Fuel size={44} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">No se registran eventos de tanqueo</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Inicia registrando el Asiento de Apertura (Saldo Inicial ROB y Precio) para establecer la condición génesis del buque o registra un nuevo tanqueo con sus facturas asociadas.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            {sortedEvents.map((ev) => {
                const isExpanded = expandedEvents[ev.id] !== false;
                const isSelected = selectedEventIds.has(ev.id);
                const invoicesList = ev.invoices || [];
                const invoicesCount = invoicesList.length;

                // Perfil de combustibles según el Maestro de Flota (Solo IFO vs Dual IFO + MDO)
                const fuelConfig = getVesselFuelConfig(ev.vessel_id);
                const supportsMdo = fuelConfig.supportsMdo;

                // Importe total consolidado de las facturas de esta tanqueada
                const totalTanqueadaUsd = invoicesList.reduce((acc, inv) => acc + (Number(inv.total_amount_usd) || 0), 0) 
                    || (Number(ev.purchased_ifo_total_usd || 0) + Number(ev.purchased_mdo_total_usd || 0));

                const bafFactor = ev.spcc_baf_factor !== undefined ? Number(ev.spcc_baf_factor) : 0.9669;
                const bafVar = ev.spcc_baf_variation !== undefined ? Number(ev.spcc_baf_variation) : -0.1380;

                // Identificador / Código de Tanqueada o Asiento de Apertura
                const tanqueadaCode = ev.is_bootstrap 
                    ? `ASIENTO-0 • GÉNESIS`
                    : (ev.voyage_number 
                        ? `TNK-${ev.event_date.replace(/-/g, '')}-${ev.voyage_number}` 
                        : `TNK-${ev.event_date.replace(/-/g, '')}-${ev.vessel_id}`);

                // 1. ASIENTO DE APERTURA: Renderizado en una SOLA LÍNEA HORIZONTAL PURA (Sin acordeón, sin duplicidad de buque)
                if (ev.is_bootstrap) {
                    return (
                        <div 
                            key={ev.id}
                            className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-800/60 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-2xs"
                        >
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5 font-sans uppercase tracking-wider text-[11px] bg-amber-200/80 dark:bg-amber-900/50 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                                    <BookOpen size={13} className="text-amber-700 dark:text-amber-400 shrink-0" />
                                    Asiento de Apertura
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 font-sans text-xs">
                                    {ev.event_date} ({ev.port_id || 'CALLAO'})
                                </span>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="text-slate-800 dark:text-slate-100">
                                    <strong className="text-amber-800 dark:text-amber-300 font-sans">IFO 380:</strong> {Number(ev.rob_ifo_mt).toFixed(2)} TM @ ${Number(ev.price_prev_ifo_usd).toFixed(2)}
                                </span>
                                {supportsMdo && (
                                    <>
                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                        <span className="text-slate-800 dark:text-slate-100">
                                            <strong className="text-cyan-800 dark:text-cyan-300 font-sans">MDO:</strong> {Number(ev.rob_mdo_mt).toFixed(2)} TM @ ${Number(ev.price_prev_mdo_usd).toFixed(2)}
                                        </span>
                                    </>
                                )}
                                {ev.notes && (
                                    <>
                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                        <span className="text-slate-500 dark:text-slate-400 italic font-sans text-[11px]">{ev.notes}</span>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold font-sans text-[11px] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                                    ✓ Base Auditada
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('¿Seguro que deseas eliminar este asiento de apertura?')) {
                                            onDeleteEvent(ev.id);
                                        }
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Eliminar asiento de apertura"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                }

                return (
                    <div 
                        key={ev.id}
                        className="border rounded-2xl shadow-2xs overflow-hidden transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    >
                        {/* 1. ENCABEZADO DEL ACORDEÓN */}
                        <div 
                            className="p-4 border-b flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-colors bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100/70"
                            onClick={() => toggleAccordion(ev.id)}
                        >
                            <div className="flex items-center gap-3">
                                {onToggleSelectEvent && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleSelectEvent(ev.id);
                                        }}
                                        className="text-slate-400 hover:text-[#0284c7] transition-colors"
                                    >
                                        {isSelected ? (
                                            <CheckSquare size={16} className="text-[#0284c7]" />
                                        ) : (
                                            <Square size={16} />
                                        )}
                                    </button>
                                )}

                                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-blue-100 dark:bg-blue-900/40 text-[#0284c7] dark:text-[#38bdf8]">
                                    <Anchor size={16} />
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded border text-[#0284c7] dark:text-[#38bdf8] bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900">
                                            {tanqueadaCode}
                                        </span>
                                        <span className="text-[11px] text-slate-500 font-bold">
                                            • {ev.event_date} ({ev.port_id})
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                            {invoicesCount} {invoicesCount === 1 ? 'FACTURA' : 'FACTURAS'}
                                        </span>
                                        {!supportsMdo && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-300">
                                                SOLO IFO
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* CAMPOS PARA STOCK ROB Y PRECIOS */}
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px] font-mono">
                                        {/* IFO */}
                                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
                                            <span className="font-bold">ROB IFO:</span> 
                                            {Number(ev.rob_ifo_mt).toFixed(2)} TM @ ${Number(ev.price_prev_ifo_usd).toFixed(2)} 
                                            <span className="text-amber-600 font-bold ml-1">➔ Pond: ${Number(ev.weighted_avg_ifo_usd).toFixed(2)}/TM</span>
                                        </div>

                                        {/* MDO */}
                                        {supportsMdo && (
                                            <div className="flex items-center gap-1 bg-cyan-50 dark:bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-900 text-cyan-900 dark:text-cyan-200">
                                                <span className="font-bold">ROB MDO:</span> 
                                                {Number(ev.rob_mdo_mt).toFixed(2)} TM @ ${Number(ev.price_prev_mdo_usd).toFixed(2)} 
                                                <span className="text-cyan-600 font-bold ml-1">➔ Pond: ${Number(ev.weighted_avg_mdo_usd).toFixed(2)}/TM</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200 font-bold">
                                            <span>BAF Factor:</span> {bafFactor.toFixed(4)} 
                                            <span className={bafVar <= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                ({bafVar > 0 ? '+' : ''}{bafVar.toFixed(4)} USD/pmt)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TOTAL CONSOLIDADO A LA DERECHA & TOGGLE */}
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                                        Importe Tanqueada
                                    </span>
                                    <span className="text-sm font-mono font-black text-[#0284c7] dark:text-[#38bdf8]">
                                        USD {totalTanqueadaUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('¿Seguro que deseas eliminar esta operación de tanqueo y sus facturas asociadas?')) {
                                            onDeleteEvent(ev.id);
                                        }
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Eliminar registro"
                                >
                                    <Trash2 size={14} />
                                </button>

                                <div className="text-slate-400">
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </div>
                        </div>

                        {/* 2. CONTENIDO EXPANDIBLE */}
                        {isExpanded && (
                            <div className="overflow-x-auto w-full">
                                    {invoicesList.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-slate-400 font-mono">
                                            No se encontraron facturas tributarias registradas en este evento.
                                        </div>
                                    ) : (
                                    <table className="w-full text-left border-collapse text-xs font-mono">
                                        <thead>
                                            <tr className="bg-slate-100/60 dark:bg-slate-950 text-[10px] uppercase text-slate-500 tracking-wider border-b border-slate-200 dark:border-slate-800">
                                                <th className="py-2.5 px-3 w-8"></th>
                                                <th className="py-2.5 px-3">CERTIFICADO / FACTURA</th>
                                                <th className="py-2.5 px-3">PROVEEDOR / RUC</th>
                                                <th className="py-2.5 px-3">COMBUSTIBLE</th>
                                                <th className="py-2.5 px-3 text-right">CANTIDAD (TM)</th>
                                                <th className="py-2.5 px-3 text-right">PRECIO COMPRA ($/TM)</th>
                                                <th className="py-2.5 px-3 text-right">TOTAL FACTURA ($ USD)</th>
                                                <th className="py-2.5 px-3 text-right">ROB PREV (TM)</th>
                                                <th className="py-2.5 px-3 text-right">PRECIO PREV ($/TM)</th>
                                                <th className="py-2.5 px-3">FECHA EMISIÓN</th>
                                                <th className="py-2.5 px-3 text-center">ACCIÓN</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {invoicesList.map((inv) => {
                                                const robPrev = inv.fuel_type === 'IFO' ? Number(ev.rob_ifo_mt) : Number(ev.rob_mdo_mt);
                                                const pricePrev = inv.fuel_type === 'IFO' ? Number(ev.price_prev_ifo_usd) : Number(ev.price_prev_mdo_usd);

                                                return (
                                                    <tr 
                                                        key={inv.id}
                                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                                    >
                                                        <td className="py-2.5 px-3">
                                                            <Square size={13} className="text-slate-300" />
                                                        </td>

                                                        {/* Factura / Certificado Mono */}
                                                        <td className="py-2.5 px-3">
                                                            <div className="font-bold text-[#0284c7] dark:text-[#38bdf8] flex items-center gap-1.5">
                                                                <FileText size={12} className="text-slate-400" />
                                                                <span>{inv.invoice_number}</span>
                                                            </div>
                                                        </td>

                                                        {/* Proveedor */}
                                                        <td className="py-2.5 px-3">
                                                            <div className="font-bold text-slate-800 dark:text-slate-200">
                                                                {inv.supplier}
                                                            </div>
                                                            {inv.supplier_ruc && (
                                                                <div className="text-[10px] text-slate-400">
                                                                    RUC: {inv.supplier_ruc}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Combustible Homologado */}
                                                        <td className="py-2.5 px-3">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                inv.fuel_type === 'IFO'
                                                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                                    : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                                                            }`}>
                                                                <Fuel size={10} /> {inv.fuel_type}
                                                            </span>
                                                        </td>

                                                        {/* Cantidad TM */}
                                                        <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-100">
                                                            {Number(inv.quantity_mt).toFixed(4)} TM
                                                        </td>

                                                        {/* Precio Unitario */}
                                                        <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                                                            ${Number(inv.unit_price_usd).toFixed(2)}
                                                        </td>

                                                        {/* Total Factura */}
                                                        <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                                                            ${Number(inv.total_amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>

                                                        {/* Stock ROB Previo */}
                                                        <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                                                            {robPrev.toFixed(2)} TM
                                                        </td>

                                                        {/* Precio Previo */}
                                                        <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                                                            ${pricePrev.toFixed(2)}
                                                        </td>

                                                        {/* Fecha Emisión */}
                                                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                                            {inv.issue_date}
                                                        </td>

                                                        {/* Botón Acción [VISOR] - Estándar Idéntico a Inandes ERP */}
                                                        <td className="py-2.5 px-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => onOpenPdfViewer(inv.id, inv.invoice_number, inv.pdf_filename)}
                                                                className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11px] font-black px-3.5 py-1 rounded-md uppercase tracking-wider cursor-pointer shadow-2xs hover:shadow transition-all"
                                                                title="Visualizar documento PDF original en visor de alta resolución"
                                                            >
                                                                VISOR
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
