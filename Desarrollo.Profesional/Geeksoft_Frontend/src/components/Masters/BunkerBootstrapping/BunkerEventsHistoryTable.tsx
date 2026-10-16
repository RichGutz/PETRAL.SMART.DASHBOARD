import React, { useState, useMemo } from 'react';
import { 
    Calendar, Anchor, Fuel, ShieldCheck, ChevronDown, ChevronUp, 
    FileText, Eye, Trash2, Sparkles, Layers, CheckSquare, Square,
    ExternalLink, Download, BookOpen, Edit2
} from 'lucide-react';
import { getVesselFuelConfig } from '../../../services/bunkerBootstrappingService';
import type { BunkeringEventRecord, InvoiceRecord } from '../../../services/bunkerBootstrappingService';

interface BunkerEventsHistoryTableProps {
    events: BunkeringEventRecord[];
    onOpenPdfViewer: (invoiceId: string, invoiceNumber: string, filename?: string) => void;
    onDeleteEvent: (eventId: string) => void;
    onEditEvent?: (event: BunkeringEventRecord) => void;
    selectedEventIds?: Set<string>;
    onToggleSelectEvent?: (eventId: string) => void;
}

export const BunkerEventsHistoryTable: React.FC<BunkerEventsHistoryTableProps> = ({
    events,
    onOpenPdfViewer,
    onDeleteEvent,
    onEditEvent,
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
                const bafBase = ev.spcc_initial_fuel_value !== undefined ? Number(ev.spcc_initial_fuel_value) : 4.1700;
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
                                {onEditEvent && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditEvent(ev);
                                        }}
                                        className="p-1 rounded text-slate-400 hover:text-[#0284c7] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                        title="Editar asiento de apertura"
                                    >
                                        <Edit2 size={13} />
                                    </button>
                                )}
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

                // Desglose de fórmulas matemáticas para IFO y MDO (ROB + Tanqueadas / Volumen Total)
                const ifoInvoices = invoicesList.filter(inv => inv.fuel_type === 'IFO');
                const ifoTerms: string[] = [];
                if (Number(ev.rob_ifo_mt) > 0 || Number(ev.price_prev_ifo_usd) > 0) {
                    ifoTerms.push(`ROB ${Number(ev.rob_ifo_mt).toFixed(2)} × $${Number(ev.price_prev_ifo_usd).toFixed(2)}`);
                }
                if (ifoInvoices.length > 0) {
                    ifoInvoices.forEach((inv, i) => {
                        const label = ifoInvoices.length > 1 ? `Tnk.${i + 1} ` : 'Tnk. ';
                        ifoTerms.push(`${label}${Number(inv.quantity_mt).toFixed(2)} × $${Number(inv.unit_price_usd).toFixed(2)}`);
                    });
                } else if (Number(ev.purchased_ifo_mt) > 0) {
                    const unitP = Number(ev.purchased_ifo_total_usd) / (Number(ev.purchased_ifo_mt) || 1);
                    ifoTerms.push(`Tnk. ${Number(ev.purchased_ifo_mt).toFixed(2)} × $${unitP.toFixed(2)}`);
                }
                const ifoFormulaStr = ifoTerms.length > 0 ? ifoTerms.join(' + ') : '0.00';
                const totalIfoMt = Number(ev.rob_ifo_mt) + (ifoInvoices.length > 0 
                    ? ifoInvoices.reduce((acc, inv) => acc + Number(inv.quantity_mt), 0) 
                    : Number(ev.purchased_ifo_mt));

                const mdoInvoices = invoicesList.filter(inv => inv.fuel_type === 'MDO');
                const mdoTerms: string[] = [];
                if (Number(ev.rob_mdo_mt) > 0 || Number(ev.price_prev_mdo_usd) > 0) {
                    mdoTerms.push(`ROB ${Number(ev.rob_mdo_mt).toFixed(2)} × $${Number(ev.price_prev_mdo_usd).toFixed(2)}`);
                }
                if (mdoInvoices.length > 0) {
                    mdoInvoices.forEach((inv, i) => {
                        const label = mdoInvoices.length > 1 ? `Tnk.${i + 1} ` : 'Tnk. ';
                        mdoTerms.push(`${label}${Number(inv.quantity_mt).toFixed(2)} × $${Number(inv.unit_price_usd).toFixed(2)}`);
                    });
                } else if (Number(ev.purchased_mdo_mt) > 0) {
                    const unitP = Number(ev.purchased_mdo_total_usd) / (Number(ev.purchased_mdo_mt) || 1);
                    mdoTerms.push(`Tnk. ${Number(ev.purchased_mdo_mt).toFixed(2)} × $${unitP.toFixed(2)}`);
                }
                const mdoFormulaStr = mdoTerms.length > 0 ? mdoTerms.join(' + ') : '0.00';
                const totalMdoMt = Number(ev.rob_mdo_mt) + (mdoInvoices.length > 0 
                    ? mdoInvoices.reduce((acc, inv) => acc + Number(inv.quantity_mt), 0) 
                    : Number(ev.purchased_mdo_mt));

                const ifoAvg = Number(ev.weighted_avg_ifo_usd) || 0;
                const mdoAvg = Number(ev.weighted_avg_mdo_usd) || 0;
                const ifoBase = Number(ev.price_prev_ifo_usd) || 967.26;
                const mdoBase = Number(ev.price_prev_mdo_usd) || 1528.26;

                const bafPolyStr = supportsMdo
                    ? `[ (${ifoAvg.toFixed(2)}×38.4 + ${mdoAvg.toFixed(2)}×9.5) / (${ifoBase.toFixed(2)}×38.4 + ${mdoBase.toFixed(2)}×9.5) ] × $${bafBase.toFixed(2)} - $${bafBase.toFixed(2)}`
                    : `[ (${ifoAvg.toFixed(2)}×38.4) / (${ifoBase.toFixed(2)}×38.4) ] × $${bafBase.toFixed(2)} - $${bafBase.toFixed(2)}`;

                return (
                    <div 
                        key={ev.id}
                        className="border rounded-2xl shadow-2xs overflow-hidden transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    >
                        {/* 1. ENCABEZADO DEL ACORDEÓN: UNA SOLA LÍNEA COMPACTA Y MINIMALISTA */}
                        <div 
                            className="px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 cursor-pointer transition-colors bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100/70 text-xs font-mono"
                            onClick={() => toggleAccordion(ev.id)}
                        >
                            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                                {onToggleSelectEvent && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleSelectEvent(ev.id);
                                        }}
                                        className="text-slate-400 hover:text-[#0284c7] transition-colors shrink-0"
                                    >
                                        {isSelected ? (
                                            <CheckSquare size={15} className="text-[#0284c7]" />
                                        ) : (
                                            <Square size={15} />
                                        )}
                                    </button>
                                )}

                                <span className="font-bold px-2 py-0.5 rounded border text-[#0284c7] dark:text-[#38bdf8] bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900 shrink-0 text-[11px]">
                                    {tanqueadaCode}
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 font-sans text-xs shrink-0">
                                    {ev.event_date} ({ev.port_id})
                                </span>

                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="text-slate-800 dark:text-slate-100">
                                    <strong className="text-amber-800 dark:text-amber-400 font-sans">IFO:</strong> [{ifoFormulaStr}] / {totalIfoMt.toFixed(2)} TM = <strong className="text-amber-900 dark:text-amber-200 font-bold">${Number(ev.weighted_avg_ifo_usd).toFixed(2)}/TM</strong>
                                </span>

                                {supportsMdo && (
                                    <>
                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                        <span className="text-slate-800 dark:text-slate-100">
                                            <strong className="text-cyan-800 dark:text-cyan-400 font-sans">MDO:</strong> [{mdoFormulaStr}] / {totalMdoMt.toFixed(2)} TM = <strong className="text-cyan-900 dark:text-cyan-200 font-bold">${Number(ev.weighted_avg_mdo_usd).toFixed(2)}/TM</strong>
                                        </span>
                                    </>
                                )}

                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="text-purple-900 dark:text-purple-300">
                                    <strong className="font-sans">BAF SPCC:</strong> {bafPolyStr} = <strong className={bafVar <= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>{bafVar > 0 ? '+' : ''}{bafVar.toFixed(4)} USD/pmt</strong>
                                </span>
                            </div>

                            {/* DERECHA: IMPORTE TANQUEADA EN UNA SOLA LÍNEA + ACCIONES */}
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-slate-600 dark:text-slate-300 font-sans text-xs">
                                    Importe: <strong className="font-mono font-black text-slate-900 dark:text-white">${totalTanqueadaUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</strong>
                                </span>

                                {onEditEvent && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditEvent(ev);
                                        }}
                                        className="p-1 rounded text-slate-400 hover:text-[#0284c7] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                        title="Editar tanqueada (ROB y datos del viaje)"
                                    >
                                        <Edit2 size={13} />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('¿Seguro que deseas eliminar esta operación de tanqueo y sus facturas asociadas?')) {
                                            onDeleteEvent(ev.id);
                                        }
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Eliminar registro"
                                >
                                    <Trash2 size={14} />
                                </button>

                                <div className="text-slate-400">
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
