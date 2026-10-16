import React, { useState } from 'react';
import { 
    Calendar, Anchor, Fuel, ShieldCheck, ChevronDown, ChevronRight, 
    FileText, Eye, Trash2, Sparkles, Layers 
} from 'lucide-react';
import type { BunkeringEventRecord } from '../../../services/bunkerBootstrappingService';

interface BunkerEventsHistoryTableProps {
    events: BunkeringEventRecord[];
    onOpenPdfViewer: (invoiceId: string, invoiceNumber: string, filename?: string) => void;
    onDeleteEvent: (eventId: string) => void;
}

export const BunkerEventsHistoryTable: React.FC<BunkerEventsHistoryTableProps> = ({
    events,
    onOpenPdfViewer,
    onDeleteEvent
}) => {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (events.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <Fuel size={48} className="mx-auto text-slate-700 mb-3" />
                <h4 className="text-base font-bold text-white">No se registran eventos de tanqueo</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Inicia registrando el Saldo Inicial (Bootstrapping) para establecer la condición génesis del buque o registra un nuevo tanqueo.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col w-full">
            <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Layers size={16} className="text-blue-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                        Historial Cronológico de Tanqueos & Cadena de Precios Ponderados (P_N)
                    </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                    {events.length} operaciones registradas
                </span>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                        <tr className="bg-slate-950 text-[10px] uppercase text-slate-400 tracking-wider border-b border-slate-800">
                            <th className="py-3 px-3 w-8"></th>
                            <th className="py-3 px-3">Fecha / Nave</th>
                            <th className="py-3 px-3">Puerto / Viaje</th>
                            <th className="py-3 px-3">Tipo Evento</th>
                            <th className="py-3 px-3 text-right">Ponderado IFO ($/TM)</th>
                            <th className="py-3 px-3 text-right">Ponderado MDO ($/TM)</th>
                            <th className="py-3 px-3 text-center">BAF Factor</th>
                            <th className="py-3 px-3 text-right">Var. BAF (USD/pmt)</th>
                            <th className="py-3 px-3 text-center">Facturas</th>
                            <th className="py-3 px-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {events.map((ev) => {
                            const isExpanded = !!expandedRows[ev.id];
                            const invoicesCount = ev.invoices ? ev.invoices.length : 0;
                            const bafVar = ev.spcc_baf_variation !== undefined ? Number(ev.spcc_baf_variation) : -0.1380;
                            const bafFactor = ev.spcc_baf_factor !== undefined ? Number(ev.spcc_baf_factor) : 0.9669;

                            return (
                                <React.Fragment key={ev.id}>
                                    <tr className={`hover:bg-slate-800/40 transition-colors ${isExpanded ? 'bg-slate-800/30' : ''}`}>
                                        <td className="py-3 px-3">
                                            {invoicesCount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleRow(ev.id)}
                                                    className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                                                >
                                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </button>
                                            )}
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="font-bold text-white flex items-center gap-1.5">
                                                <Calendar size={13} className="text-slate-400" />
                                                {ev.event_date}
                                            </div>
                                            <div className="text-[11px] text-blue-400 font-bold">
                                                {ev.vessel_id}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-slate-300">
                                            <div>{ev.port_id}</div>
                                            <div className="text-[10px] text-slate-500">{ev.voyage_number || 'N/A'}</div>
                                        </td>
                                        <td className="py-3 px-3">
                                            {ev.is_bootstrap ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                                    <Sparkles size={11} /> BOOTSTRAP (Génesis)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                                    <Fuel size={11} /> TANQUEO COMPLETO
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                            <div className="text-sm font-bold text-amber-300">
                                                ${Number(ev.weighted_avg_ifo_usd).toFixed(4)}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                ROB: {Number(ev.rob_ifo_mt).toFixed(2)} TM
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                            <div className="text-sm font-bold text-cyan-300">
                                                ${Number(ev.weighted_avg_mdo_usd).toFixed(4)}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                ROB: {Number(ev.rob_mdo_mt).toFixed(2)} TM
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-center text-purple-300 font-bold">
                                            {bafFactor.toFixed(4)}
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                            <span className={`font-bold ${bafVar <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {bafVar > 0 ? '+' : ''}{bafVar.toFixed(4)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            {invoicesCount > 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleRow(ev.id)}
                                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                                                >
                                                    {invoicesCount} facturas {isExpanded ? '▲' : '▼'}
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-slate-600">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (window.confirm('¿Seguro que deseas eliminar este evento de tanqueo? El registro se moverá a la papelera comercial.')) {
                                                        onDeleteEvent(ev.id);
                                                    }
                                                }}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                                                title="Eliminar evento (Safe Delete a papelera)"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Sub-fila de Facturas Expandidas */}
                                    {isExpanded && ev.invoices && ev.invoices.length > 0 && (
                                        <tr className="bg-slate-950/70 border-b border-slate-800">
                                            <td colSpan={10} className="p-3 pl-12">
                                                <div className="space-y-1.5 max-w-4xl">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                                        Facturas Tributarias que sustentaron este evento:
                                                    </span>
                                                    <div className="grid grid-cols-1 gap-1.5">
                                                        {ev.invoices.map((inv) => (
                                                            <div 
                                                                key={inv.id}
                                                                className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono"
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                                        inv.fuel_type === 'IFO' 
                                                                            ? 'bg-amber-500/20 text-amber-300' 
                                                                            : 'bg-cyan-500/20 text-cyan-300'
                                                                    }`}>
                                                                        {inv.fuel_type}
                                                                    </span>
                                                                    <span className="font-bold text-white">{inv.invoice_number}</span>
                                                                    <span className="text-slate-400">{inv.supplier}</span>
                                                                    <span className="text-slate-500">• {inv.quantity_mt} TM @ ${inv.unit_price_usd} USD/TM</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-bold text-slate-200">
                                                                        ${Number(inv.total_amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                                                                    </span>
                                                                    {inv.has_pdf && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => onOpenPdfViewer(inv.id, inv.invoice_number, inv.pdf_filename)}
                                                                            className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                                                        >
                                                                            <Eye size={12} />
                                                                            <span>Ver Factura</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
