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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <FileText size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                {title}
                            </h3>
                            <p className="text-[11px] text-slate-400 font-mono">
                                Archivo: {filename} • Visor de Documento Tributario Original
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleOpenTab}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Abrir en ventana independiente (ideal para doble monitor)"
                        >
                            <ExternalLink size={14} />
                            <span>Nueva Pestaña</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleDownload}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            title="Descargar copia del PDF original"
                        >
                            <Download size={14} />
                            <span>Descargar</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* PDF Viewer Frame */}
                <div className="flex-1 w-full bg-slate-950 p-1 relative">
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full border-0 rounded-b-xl"
                        title={title}
                    />
                </div>
            </div>
        </div>
    );
};
