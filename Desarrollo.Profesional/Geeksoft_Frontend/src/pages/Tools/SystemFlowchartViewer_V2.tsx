import React, { useState } from 'react';
import { Download, ZoomIn, ZoomOut, RotateCcw, Layers } from 'lucide-react';
import { Button } from '../../components/ui/button';

export const SystemFlowchartViewer_V2: React.FC = () => {
    const [zoomLevel, setZoomLevel] = useState<number>(100);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 20, 250));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 20, 40));
    const handleResetZoom = () => setZoomLevel(100);

    const handleDownloadPdf = () => {
        const link = document.createElement('a');
        link.href = '/FLUJOGRAMA_ARQUITECTURA_GENERAL_PETRAL_V1.pdf';
        link.download = 'FLUJOGRAMA_ARQUITECTURA_GENERAL_PETRAL_V1.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <section className="flex flex-col gap-4 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 flex-1 h-full min-h-screen">
            {/* Header Control Ribbon */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
                        <Layers size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black tracking-tight text-slate-800 flex items-center gap-2 uppercase">
                            FLOWCHART GENERAL DEL SISTEMA PETRAL
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full tracking-wider">Alta Resolución</span>
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Diagrama de flujo de arquitectura general (Scroll Vertical • Lectura Nivel 1 a Nivel 5)
                        </p>
                    </div>
                </div>

                {/* Controls & Download */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleZoomOut}
                            className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
                            title="Reducir Zoom"
                        >
                            <ZoomOut size={14} />
                        </Button>
                        <span className="text-xs font-mono font-bold text-slate-700 px-2 min-w-[50px] text-center select-none">
                            {zoomLevel}%
                        </span>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleZoomIn}
                            className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
                            title="Aumentar Zoom"
                        >
                            <ZoomIn size={14} />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleResetZoom}
                            className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
                            title="Resetear Zoom a 100%"
                        >
                            <RotateCcw size={14} />
                        </Button>
                    </div>

                    <Button 
                        onClick={handleDownloadPdf}
                        className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 px-4 shadow-sm transition-all cursor-pointer"
                    >
                        <Download size={14} />
                        <span>Descargar PDF Vectorial</span>
                    </Button>
                </div>
            </div>

            {/* Main Flowchart View Container - Renderizado a Tamaño Nativo Gigante sin Reducción */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl shadow-inner p-6 overflow-x-auto overflow-y-auto max-h-[85vh] flex flex-col items-center justify-start">
                <div 
                    className="transition-all duration-200 ease-out flex flex-col items-center min-w-[1600px]"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                >
                    <img 
                        src="/FLUJOGRAMA_ARQUITECTURA_GENERAL_PETRAL_V1.svg" 
                        alt="Flujograma General del Sistema PETRAL"
                        className="w-[1600px] h-auto shadow-lg rounded-xl bg-white p-8 border border-slate-200"
                    />
                </div>
            </div>
        </section>
    );
};
