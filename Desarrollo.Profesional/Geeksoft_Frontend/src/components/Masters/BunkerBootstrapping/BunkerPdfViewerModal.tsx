import React, { useState, useEffect, useRef } from 'react';
import { 
    X, ExternalLink, Download, FileText, ZoomIn, ZoomOut, 
    ChevronLeft, ChevronRight, RotateCcw, AlertTriangle, Loader2 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configuración del worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.25);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pdfDoc, setPdfDoc] = useState<any>(null);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const renderTaskRef = useRef<any>(null);

    useEffect(() => {
        if (!isOpen || !pdfUrl) return;

        let isMounted = true;
        setLoading(true);
        setError(null);
        setPageNumber(1);
        setScale(1.25);

        const loadPdf = async () => {
            try {
                const res = await fetch(pdfUrl);
                if (!res.ok) {
                    throw new Error(`Error ${res.status}: ${res.statusText}`);
                }
                const data = await res.arrayBuffer();

                const loadingTask = pdfjsLib.getDocument({ data });
                const doc = await loadingTask.promise;
                if (!isMounted) return;

                setPdfDoc(doc);
                setNumPages(doc.numPages);
                setLoading(false);
            } catch (err: any) {
                console.error("Error cargando PDF con PDF.js:", err);
                if (isMounted) {
                    setError(err.message || 'No se pudo cargar el documento PDF');
                    setLoading(false);
                }
            }
        };

        loadPdf();

        return () => {
            isMounted = false;
        };
    }, [isOpen, pdfUrl]);

    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        let cancelled = false;

        const renderPage = async () => {
            try {
                if (renderTaskRef.current) {
                    renderTaskRef.current.cancel();
                }

                const page = await pdfDoc.getPage(pageNumber);
                if (cancelled) return;

                const canvas = canvasRef.current;
                if (!canvas) return;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const viewport = page.getViewport({ scale });
                const outputScale = window.devicePixelRatio || 1;

                canvas.width = Math.floor(viewport.width * outputScale);
                canvas.height = Math.floor(viewport.height * outputScale);
                canvas.style.width = Math.floor(viewport.width) + "px";
                canvas.style.height = Math.floor(viewport.height) + "px";

                ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };

                const renderTask = page.render(renderContext);
                renderTaskRef.current = renderTask;
                await renderTask.promise;
            } catch (err: any) {
                if (err.name !== 'RenderingCancelledException') {
                    console.error("Error renderizando página:", err);
                }
            }
        };

        renderPage();

        return () => {
            cancelled = true;
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
        };
    }, [pdfDoc, pageNumber, scale]);

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

    const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3.0));
    const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
    const handleResetZoom = () => setScale(1.25);

    const handlePrevPage = () => setPageNumber(p => Math.max(p - 1, 1));
    const handleNextPage = () => setPageNumber(p => Math.min(p + 1, numPages));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col h-[92vh] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-[#0284c7] dark:text-[#38bdf8] flex items-center justify-center shrink-0">
                            <FileText size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <span>{title}</span>
                                <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-[#0284c7] dark:text-[#38bdf8] px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900 font-mono">
                                    PDF.js Canvas
                                </span>
                            </h3>
                            <p className="text-[11px] text-slate-500 font-mono truncate max-w-md">
                                {filename}
                            </p>
                        </div>
                    </div>

                    {/* Toolbar de Controles */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Paginación */}
                        {numPages > 1 && (
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono">
                                <button
                                    type="button"
                                    onClick={handlePrevPage}
                                    disabled={pageNumber <= 1}
                                    className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    title="Página anterior"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="text-slate-700 dark:text-slate-200 px-1 font-bold">
                                    {pageNumber} / {numPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleNextPage}
                                    disabled={pageNumber >= numPages}
                                    className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    title="Página siguiente"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        )}

                        {/* Zoom */}
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono">
                            <button
                                type="button"
                                onClick={handleZoomOut}
                                className="p-1 text-slate-600 dark:text-slate-300 hover:text-[#0284c7] cursor-pointer"
                                title="Reducir zoom"
                            >
                                <ZoomOut size={14} />
                            </button>
                            <span className="text-slate-700 dark:text-slate-200 px-1 font-bold min-w-[45px] text-center">
                                {Math.round(scale * 100)}%
                            </span>
                            <button
                                type="button"
                                onClick={handleZoomIn}
                                className="p-1 text-slate-600 dark:text-slate-300 hover:text-[#0284c7] cursor-pointer"
                                title="Aumentar zoom"
                            >
                                <ZoomIn size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={handleResetZoom}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer ml-1"
                                title="Restablecer zoom"
                            >
                                <RotateCcw size={12} />
                            </button>
                        </div>

                        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

                        {/* Nueva Pestaña */}
                        <button
                            type="button"
                            onClick={handleOpenTab}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                            title="Abrir en pestaña independiente"
                        >
                            <ExternalLink size={13} />
                            <span className="hidden sm:inline">Pestaña</span>
                        </button>

                        {/* Descargar */}
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                            title="Descargar archivo PDF"
                        >
                            <Download size={13} />
                            <span className="hidden sm:inline">Descargar</span>
                        </button>

                        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

                        {/* Cerrar */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Cerrar visor"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* PDF Canvas Viewport Container */}
                <div className="flex-1 bg-slate-800/90 dark:bg-slate-950 w-full h-full overflow-auto flex items-start justify-center p-6 relative">
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300">
                            <Loader2 size={32} className="animate-spin text-[#0284c7]" />
                            <span className="text-xs font-mono font-medium">Cargando documento tributario original...</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-rose-400 max-w-md text-center p-6">
                            <AlertTriangle size={36} className="text-rose-500" />
                            <h4 className="text-sm font-bold text-white uppercase">Error al visualizar PDF</h4>
                            <p className="text-xs font-mono text-slate-300">{error}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="px-4 py-2 bg-[#0284c7] text-white rounded-lg text-xs font-bold shadow-md hover:bg-[#0369a1]"
                                >
                                    Descargar Archivo Directo
                                </button>
                                <button
                                    type="button"
                                    onClick={handleOpenTab}
                                    className="px-4 py-2 bg-slate-700 text-white rounded-lg text-xs font-bold shadow-md hover:bg-slate-600"
                                >
                                    Abrir en Pestaña
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={`${loading || error ? 'hidden' : 'block'} shadow-2xl rounded-sm overflow-hidden bg-white my-auto`}>
                        <canvas ref={canvasRef} className="block" />
                    </div>
                </div>
            </div>
        </div>
    );
};
