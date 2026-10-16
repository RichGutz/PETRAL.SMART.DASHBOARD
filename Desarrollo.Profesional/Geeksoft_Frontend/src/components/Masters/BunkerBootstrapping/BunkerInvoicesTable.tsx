import React from 'react';
import { FileText, Eye, Download, ShieldCheck, Fuel, Calendar, Anchor } from 'lucide-react';
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-2xs">
                <FileText size={44} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Repositorio de Facturas Vacío</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Las facturas subidas en cada operación de tanqueo se archivarán aquí automáticamente con enlace directo a su documento PDF original.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden flex flex-col w-full">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#0284c7]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Repositorio Digital de Facturas de Búnker SUNAT (Sustento Documental)
                    </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                    {invoices.length} facturas archivadas
                </span>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                        <tr className="bg-slate-100/70 dark:bg-slate-950 text-[10px] uppercase text-slate-500 tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <th className="py-3 px-4">FACTURA N°</th>
                            <th className="py-3 px-4">EMISOR / RUC</th>
                            <th className="py-3 px-4">FECHA EMISIÓN</th>
                            <th className="py-3 px-4">NAVE</th>
                            <th className="py-3 px-4">COMBUSTIBLE</th>
                            <th className="py-3 px-4 text-right">CANTIDAD (TM)</th>
                            <th className="py-3 px-4 text-right">PRECIO ($/TM)</th>
                            <th className="py-3 px-4 text-right">TOTAL FACTURA (USD)</th>
                            <th className="py-3 px-4 text-center">ACCIÓN</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="font-bold text-[#0284c7] dark:text-[#38bdf8] flex items-center gap-1.5">
                                        <FileText size={13} className="text-slate-400" />
                                        <span>{inv.invoice_number}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        {inv.voyage_number || 'Tanqueo Oficial'}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="text-slate-800 dark:text-slate-200 font-bold">{inv.supplier}</div>
                                    <div className="text-[10px] text-slate-400">RUC: {inv.supplier_ruc || 'N/A'}</div>
                                </td>
                                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} className="text-slate-400" />
                                        <span>{inv.issue_date}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        <Anchor size={10} /> {inv.vessel_id}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                        inv.fuel_type === 'IFO'
                                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                            : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                                    }`}>
                                        <Fuel size={10} /> {inv.fuel_type}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-100">
                                    {Number(inv.quantity_mt).toFixed(4)} TM
                                </td>
                                <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                                    ${Number(inv.unit_price_usd).toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                                    ${Number(inv.total_amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <button
                                        type="button"
                                        onClick={() => onOpenPdfViewer(inv.id, inv.invoice_number, inv.pdf_filename)}
                                        className="bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11px] font-black px-3.5 py-1 rounded-md uppercase tracking-wider cursor-pointer shadow-2xs hover:shadow transition-all"
                                    >
                                        VISOR
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
