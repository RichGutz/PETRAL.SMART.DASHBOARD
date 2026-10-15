import React, { useState, useEffect, useRef } from 'react';
import { 
    Maximize, 
    Minimize, 
    BookOpen, 
    GitGraph, 
    Building2, 
    FileText, 
    Presentation,
    RotateCcw,
    ZoomIn,
    ZoomOut,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoPetral from '../../assets/Logo.Petral.png';

export const SotaPetralOne_V2: React.FC = () => {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [zoomLevel, setZoomLevel] = useState<number>(100);

    const sendIframeAction = (action: string) => {
        iframeRef.current?.contentWindow?.postMessage({ action }, '*');
    };

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                if (containerRef.current?.requestFullscreen) {
                    await containerRef.current.requestFullscreen();
                }
                sendIframeAction('ENTER_FULLSCREEN');
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                }
                sendIframeAction('EXIT_FULLSCREEN');
            }
        } catch (err) {
            console.warn('Fullscreen request failed or was blocked:', err);
        }
    };

    // Navegación con teclado: F11, Enter (siguiente slide), Flechas, y bloqueo de Ctrl+P / Ctrl+S
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Bloqueo estricto de atajos de impresión y guardado
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            if (e.key === 'F11') {
                e.preventDefault();
                toggleFullscreen();
            } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') {
                e.preventDefault();
                sendIframeAction('NEXT_SLIDE');
            } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp') {
                e.preventDefault();
                sendIframeAction('PREV_SLIDE');
            }
        };

        const handleFullscreenChange = () => {
            const isFull = !!document.fullscreenElement;
            setIsFullscreen(isFull);
            sendIframeAction(isFull ? 'ENTER_FULLSCREEN' : 'EXIT_FULLSCREEN');
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

    return (
        <div 
            ref={containerRef}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-full h-full flex flex-col min-h-0 select-none transition-all duration-300 ${
                isFullscreen 
                    ? 'fixed inset-0 z-[99999] bg-slate-950 p-0 m-0 w-screen h-screen overflow-hidden' 
                    : 'relative'
            }`}
        >
            {/* ── ENCABEZADO DE HERRAMIENTA SOTA PETRAL ONE (SE OCULTA EN FULLSCREEN PARA CONVERTIR CADA SLIDE EN 100% MONITOR) ── */}
            {!isFullscreen && (
                <div className="shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 sm:p-4 mb-3 flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <img src={logoPetral} alt="Naviera Petral" className="h-9 w-auto object-contain" />
                        <div className="h-8 border-l border-slate-200 hidden md:block"></div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-black tracking-tight uppercase flex items-center gap-2 text-slate-900">
                                    <Presentation size={20} className="text-blue-500" />
                                    SOTA PETRAL ONE
                                </h1>
                                <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                    Trilogía ONE, TWO &amp; THREE
                                </span>
                            </div>
                            <p className="text-xs font-medium mt-0.5 text-slate-500">
                                Presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono font-bold text-[10px]">F11</kbd> para pantalla completa • Pulsa <kbd className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-[10px]">Enter</kbd> para avanzar de diapositiva
                            </p>
                        </div>
                    </div>

                    {/* Accesos rápidos entre módulos documentales */}
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

                    {/* Acciones principales: Salto de Slide, Zoom y Fullscreen (Sin imprimir ni guardar) */}
                    <div className="flex items-center gap-2">
                        {/* Controles de Slide */}
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            <button
                                onClick={() => sendIframeAction('PREV_SLIDE')}
                                className="p-1 hover:text-blue-600 rounded cursor-pointer transition-colors"
                                title="Diapositiva Anterior (Flecha Izquierda / Backspace)"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            <button
                                onClick={() => sendIframeAction('NEXT_SLIDE')}
                                className="px-2 py-0.5 text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                                title="Siguiente Diapositiva (Enter)"
                            >
                                <span>Avanzar</span>
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        {/* Controles de Zoom */}
                        <div className="flex items-center gap-1 p-0.5 rounded-lg border bg-slate-100 border-slate-200 text-slate-700">
                            <button 
                                onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
                                title="Reducir Zoom (Ctrl + Scroll Abajo)"
                                className="p-1 hover:text-blue-600 rounded cursor-pointer transition-colors"
                            >
                                <ZoomOut size={13} />
                            </button>
                            <span className="text-[11px] font-mono font-bold px-1 min-w-[38px] text-center select-none">
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

                        {/* Botón Pantalla Completa */}
                        <button
                            onClick={toggleFullscreen}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                            title="Alternar Pantalla Completa (F11)"
                        >
                            <Maximize size={14} />
                            <span>Pantalla Completa (F11)</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── BOTÓN FLOTANTE EN FULLSCREEN PARA SALIR DE PANTALLA COMPLETA ── */}
            {isFullscreen && (
                <div className="fixed top-4 right-4 z-[999999] flex items-center gap-2">
                    <button
                        onClick={toggleFullscreen}
                        className="px-3 py-1.5 bg-slate-900/80 hover:bg-red-600 text-white rounded-full text-xs font-bold border border-white/20 backdrop-blur-md shadow-2xl flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Salir de Pantalla Completa (Esc o F11)"
                    >
                        <Minimize size={13} />
                        <span>Salir F11</span>
                    </button>
                </div>
            )}

            {/* ── CONTENEDOR DEL IFRAME DE LA PRESENTACIÓN ── */}
            <div className={`flex-1 min-h-0 w-full overflow-hidden relative transition-all duration-300 ${
                isFullscreen 
                    ? 'border-0 bg-slate-950 h-screen w-screen rounded-none' 
                    : 'border border-slate-200 rounded-xl bg-slate-100 shadow-lg h-[calc(100vh-175px)]'
            }`}>
                <iframe
                    ref={iframeRef}
                    src="/sota_petral_one.html"
                    title="SOTA PETRAL ONE — Presentación Ejecutiva"
                    onLoad={() => {
                        if (isFullscreen) {
                            sendIframeAction('ENTER_FULLSCREEN');
                        }
                    }}
                    className={`w-full h-full border-0 block ${isFullscreen ? 'bg-[#090d16]' : 'bg-white'} origin-top`}
                    style={{
                        transform: (!isFullscreen && zoomLevel !== 100) ? `scale(${zoomLevel / 100})` : undefined,
                        transformOrigin: 'top center',
                        width: (!isFullscreen && zoomLevel !== 100) ? `${100 / (zoomLevel / 100)}%` : '100%',
                        height: (!isFullscreen && zoomLevel !== 100) ? `${100 / (zoomLevel / 100)}%` : '100%'
                    }}
                />
            </div>
        </div>
    );
};
