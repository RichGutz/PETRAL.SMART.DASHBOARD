import React, { useState, useEffect, useRef } from 'react';
import { 
    Maximize, 
    Minimize, 
    ExternalLink, 
    Printer, 
    BookOpen, 
    GitGraph, 
    Building2, 
    FileText, 
    Presentation,
    RotateCcw,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoPetral from '../../assets/Logo.Petral.png';

export const SotaPetralOne_V2: React.FC = () => {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [zoomLevel, setZoomLevel] = useState<number>(100);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                if (containerRef.current?.requestFullscreen) {
                    await containerRef.current.requestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            }
        } catch (err) {
            console.warn('Fullscreen request failed or was blocked:', err);
        }
    };

    // Escucha de tecla F11 y cambios en estado de fullscreen
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F11') {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Soporte para Ctrl + Wheel zoom sobre el visor de la presentación
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    setZoomLevel(prev => Math.min(prev + 10, 200));
                } else {
                    setZoomLevel(prev => Math.max(prev - 10, 50));
                }
            }
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            el.removeEventListener('wheel', handleWheel);
        };
    }, []);

    const handlePrint = () => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.print();
        } else {
            window.open('/sota_petral_one.html', '_blank')?.print();
        }
    };

    const handleOpenNewTab = () => {
        window.open('/sota_petral_one.html', '_blank');
    };

    return (
        <div 
            ref={containerRef}
            className={`w-full h-full flex flex-col min-h-0 transition-all duration-300 ${
                isFullscreen 
                    ? 'fixed inset-0 z-[99999] bg-slate-950 p-2 sm:p-4' 
                    : 'relative'
            }`}
        >
            {/* ── ENCABEZADO DE HERRAMIENTA SOTA PETRAL ONE ── */}
            <div className={`shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 sm:p-4 mb-3 flex flex-col md:flex-row items-center justify-between gap-3 ${isFullscreen ? 'bg-slate-900 border-slate-800 text-white' : ''}`}>
                <div className="flex items-center gap-3">
                    <img src={logoPetral} alt="Naviera Petral" className="h-9 w-auto object-contain" />
                    <div className={`h-8 border-l hidden md:block ${isFullscreen ? 'border-slate-700' : 'border-slate-200'}`}></div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className={`text-base sm:text-lg font-black tracking-tight uppercase flex items-center gap-2 ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
                                <Presentation size={20} className="text-blue-500" />
                                SOTA PETRAL ONE
                            </h1>
                            <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                Trilogía ONE, TWO &amp; THREE
                            </span>
                        </div>
                        <p className={`text-xs font-medium mt-0.5 ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
                            Presentación Ejecutiva • Pulsa <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold text-[10px]">F11</kbd> para alternar pantalla completa
                        </p>
                    </div>
                </div>

                {/* Accesos rápidos entre módulos documentales (solo cuando no está en Fullscreen) */}
                {!isFullscreen && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            onClick={() => navigate('/system-documentation')}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-slate-200"
                            title="Ir al Manual Docs as Code"
                        >
                            <BookOpen size={13} className="text-slate-400" />
                            <span className="hidden lg:inline">Docs as Code</span>
                        </button>
                        <button
                            onClick={() => navigate('/system-flowchart')}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-slate-200"
                            title="Ir al Flujograma del Sistema"
                        >
                            <GitGraph size={13} className="text-slate-400" />
                            <span className="hidden lg:inline">Flujograma</span>
                        </button>
                        <button
                            onClick={() => navigate('/company-organigram')}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-slate-200"
                            title="Ir al Organigrama de la Empresa"
                        >
                            <Building2 size={13} className="text-slate-400" />
                            <span className="hidden lg:inline">Organigrama</span>
                        </button>
                        <button
                            onClick={() => navigate('/mof-manual')}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-slate-200"
                            title="Ir al Manual MOF de Puestos"
                        >
                            <FileText size={13} className="text-slate-400" />
                            <span className="hidden lg:inline">MOF</span>
                        </button>
                    </div>
                )}

                {/* Acciones principales: Zoom, Fullscreen, Nueva Pestaña, Imprimir */}
                <div className="flex items-center gap-2">
                    {/* Controles de Zoom */}
                    <div className={`flex items-center gap-1 p-0.5 rounded-lg border ${isFullscreen ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                        <button 
                            onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
                            title="Reducir Zoom (Ctrl + Scroll Abajo)"
                            className="p-1 hover:text-blue-600 rounded cursor-pointer transition-colors"
                        >
                            <ZoomOut size={13} />
                        </button>
                        <span className="text-[11px] font-mono font-bold px-1 min-w-[42px] text-center select-none">
                            {zoomLevel}%
                        </span>
                        <button 
                            onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))}
                            title="Aumentar Zoom (Ctrl + Scroll Arriba)"
                            className="p-1 hover:text-blue-600 rounded cursor-pointer transition-colors"
                        >
                            <ZoomIn size={13} />
                        </button>
                        <button 
                            onClick={() => setZoomLevel(100)}
                            title="Resetear Zoom"
                            className="p-1 hover:text-blue-600 rounded cursor-pointer transition-colors"
                        >
                            <RotateCcw size={12} />
                        </button>
                    </div>

                    <button
                        onClick={toggleFullscreen}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                            isFullscreen 
                                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        title="Alternar Pantalla Completa (F11)"
                    >
                        {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                        <span>{isFullscreen ? 'Salir F11' : 'Pantalla Completa (F11)'}</span>
                    </button>

                    <button
                        onClick={handleOpenNewTab}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${isFullscreen ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        title="Abrir presentación en nueva pestaña"
                    >
                        <ExternalLink size={15} />
                    </button>

                    <button
                        onClick={handlePrint}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${isFullscreen ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        title="Imprimir presentación o guardar como PDF"
                    >
                        <Printer size={15} />
                    </button>
                </div>
            </div>

            {/* ── CONTENEDOR DEL IFRAME DE LA PRESENTACIÓN ── */}
            <div className={`flex-1 min-h-0 w-full rounded-xl overflow-hidden shadow-lg border relative transition-all duration-300 ${
                isFullscreen 
                    ? 'border-slate-800 bg-slate-950 h-[calc(100vh-76px)]' 
                    : 'border-slate-200 bg-slate-100 h-[calc(100vh-175px)]'
            }`}>
                <iframe
                    ref={iframeRef}
                    src="/sota_petral_one.html"
                    title="SOTA PETRAL ONE — Presentación Ejecutiva"
                    className="w-full h-full border-0 block bg-white origin-top"
                    style={{
                        transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
                        transformOrigin: 'top center',
                        width: zoomLevel !== 100 ? `${100 / (zoomLevel / 100)}%` : '100%',
                        height: zoomLevel !== 100 ? `${100 / (zoomLevel / 100)}%` : '100%'
                    }}
                />
            </div>
        </div>
    );
};
