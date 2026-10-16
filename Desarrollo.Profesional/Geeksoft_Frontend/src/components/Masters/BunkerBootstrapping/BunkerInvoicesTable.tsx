import React from 'react';
import { FileText, Eye, Download, ShieldCheck, Fuel, Calendar, Anchor } from 'lucide-react';
import { BunkerBootstrappingService } from '../../../services/bunkerBootstrappingService';
import type { InvoiceRecord } from '../../../services/bunkerBootstrappingService';

interface BunkerInvoicesTableProps {
    invoices: InvoiceRecord[];
    onOpenPdfViewer: (invoiceId: string, invoiceNumber: string, filename?: string) => void;
}

export const BunkerInvoicesTable: React.FC<BunkerInvoicesTableProps> = ({
    invoices,
    onOpenPdfViewer
}) => {
    if (invoices.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <FileText size={48} className="mx-auto text-slate-700 mb-3" />
                <h4 className="text-base font-bold text-white">Repositorio de Facturas Vacío</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Las facturas subidas en cada operación de tanqueo se archivarán aquí automáticamente con enlace directo a su documento PDF original.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col w-full">
            <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText size={16} className="text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                        Repositorio Digital de Facturas de Búnker SUNAT (Sustento Documental)
                    </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                    {invoices.length} facturas archivadas
                </span>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                        <tr className="bg-slate-950 text-[10px] uppercase text-slate-400 tracking-wider border-b border-slate-800">
                            <th className="py-3 px-4">Factura N°</th>
                            <th className="py-3 px-4">Emisor / RUC</th>
                            <th className="py-3 px-4">Fecha Emisión</th>
                            <th className="py-3 px-4">Nave</th>
                            <th className="py-3 px-4">Combustible</th>
                            <th className="py-3 px-4 text-right">Cantidad (TM)</th>
                            <th className="py-3 px-4 text-right">Precio ($/TM)</th>
                            <th className="py-3 px-4 text-right">Total Factura (USD)</th>
                            <th className="py-3 px-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="font-bold text-white flex items-center gap-1.5">
                                        <FileText size={13} className="text-blue-400" />
                                        {inv.invoice_number}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                        {inv.voyage_number || 'Tanqueo Oficial'}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="text-slate-200 font-bold">{inv.supplier}</div>
                                    <div className="text-[10px] text-slate-400">RUC: {inv.supplier_ruc || 'N/A'}</div>
                                </td>
                                <td className="py-3 px-4 text-slate-300">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} className="text-slate-400" />
                                        {inv.issue_date}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                        <Anchor size={10} /> {inv.vessel_id}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                        inv.fuel_type === 'IFO'
                                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                            : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                                    }`}>
                                        <Fuel size={10} /> {inv.fuel_type}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-white">
                                    {Number(inv.quantity_mt).toFixed(4)} TM
                                </td>
                                <td className="py-3 px-4 text-right text-slate-300">
                                    ${Number(inv.unit_price_usd).toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-emerald-400">
                                    ${Number(inv.total_amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => onOpenPdfViewer(inv.id, inv.invoice_number, inv.pdf_filename)}
                                            className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                            title="Ver documento PDF en visor integrado"
                                        >
                                            <Eye size={12} />
                                            <span>Ver Factura</span>
                                        </button>
                                        <a
                                            href={BunkerBootstrappingService.getInvoicePdfUrl(inv.id)}
                                            download={inv.pdf_filename || `factura_${inv.invoice_number}.pdf`}
                                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                                            title="Descargar archivo original"
                                        >
                                            <Download size={13} />
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
