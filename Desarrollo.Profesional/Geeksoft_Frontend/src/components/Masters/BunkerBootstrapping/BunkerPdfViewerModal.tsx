import React from 'react';
import { X, ExternalLink, Download, FileText } from 'lucide-react';

interface BunkerPdfViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string | null;
    title: string;
    filename?: string;
}

export const BunkerPdfViewerModal: React.FC<BunkerPdfViewerModalProps> = ({
    isOpen,
    onClose,
    pdfUrl,
    title,
    filename = 'factura.pdf'
}) => {
    if (!isOpen || !pdfUrl) return null;

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleOpenTab = () => {
        window.open(pdfUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-[#0284c7] dark:text-[#38bdf8] flex items-center justify-center">
                            <FileText size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                {title}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-mono">
                                Archivo: {filename} • Visor Tributario Original
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleOpenTab}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                            title="Abrir en ventana independiente"
                        >
                            <ExternalLink size={14} />
                            <span>Nueva Pestaña</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleDownload}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                            <Download size={14} />
                            <span>Descargar</span>
                        </button>

                        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* PDF Viewer Container */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 w-full h-full relative">
                    <iframe
                        src={pdfUrl}
                        title={title}
                        className="w-full h-full border-none"
                    />
                </div>
            </div>
        </div>
    );
};
