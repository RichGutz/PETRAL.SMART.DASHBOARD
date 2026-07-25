import React, { useState } from 'react';
import { Download, ZoomIn, ZoomOut, RotateCcw, Layers, ShoppingCart, BarChart2, BookOpen, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface FlowchartTab {
    id: string;
    label: string;
    icon: React.ReactNode;
    svgFile: string;
    pdfFile: string;
    description: string;
    badge?: string;
    color: string;
}

const TABS: FlowchartTab[] = [
    {
        id: 'arquitectura',
        label: 'Arquitectura General',
        icon: <Layers size={15} />,
        svgFile: '/FLUJOGRAMA_ARQUITECTURA_GENERAL_PETRAL_V1.svg',
        pdfFile: '/FLUJOGRAMA_ARQUITECTURA_GENERAL_PETRAL_V1.pdf',
        description: '5 niveles: Maestros → Spot Engine → Motores P×Q → Ledger → Forecast → Auditoría',
        badge: 'Nivel 1→5',
        color: 'blue',
    },
    {
        id: 'multicotizador',
        label: 'Multicotizador',
        icon: <ShoppingCart size={15} />,
        svgFile: '/FLOWCHART_MULTICOTIZADOR.svg',
        pdfFile: '/FLOWCHART_MULTICOTIZADOR.pdf',
        description: 'Inputs → Validación Maestros → Spot Engine → Costos Portuarios → P&L → Exportar a Matriz',
        badge: '7 Pasos',
        color: 'amber',
    },
    {
        id: 'voyage-ledger',
        label: 'Voyage Ledger',
        icon: <BookOpen size={15} />,
        svgFile: '/FLOWCHART_VOYAGE_LEDGER.svg',
        pdfFile: '/FLOWCHART_VOYAGE_LEDGER.pdf',
        description: 'Configuración del viaje → Cálculo automático P&L → Desglose por ítem → Sensibilidad → Exportar',
        badge: 'P&L Viaje',
        color: 'teal',
    },
    {
        id: 'matriz-financiera',
        label: 'Matriz Financiera',
        icon: <BarChart2 size={15} />,
        svgFile: '/FLOWCHART_MATRIZ_FINANCIERA.svg',
        pdfFile: '/FLOWCHART_MATRIZ_FINANCIERA.pdf',
        description: 'Viajes exportados → Grilla Mensual Multi-Cliente → Vistas Gráfico / Ledger → Excel / Auditoría',
        badge: 'Forecast',
        color: 'orange',
    },
    {
        id: 'auditoria-dual',
        label: 'Auditoría Dual P×Q',
        icon: <Search size={15} />,
        svgFile: '/FLOWCHART_AUDITORIA_DUAL.svg',
        pdfFile: '/FLOWCHART_AUDITORIA_DUAL.pdf',
        description: 'PDFs Armador & Agente → Split-View → Comparación Δ Bunkers & Puertos → Acta PDF exportable',
        badge: 'Δ Factura',
        color: 'slate',
    },
];

const COLOR_MAP: Record<string, { active: string; badge: string; icon: string }> = {
    blue:   { active: 'bg-white text-blue-700 border-blue-200 shadow-sm',   badge: 'bg-blue-50 text-blue-600 border-blue-200',   icon: 'bg-blue-50 border-blue-200 text-blue-600' },
    amber:  { active: 'bg-white text-amber-700 border-amber-200 shadow-sm', badge: 'bg-amber-50 text-amber-600 border-amber-200', icon: 'bg-amber-50 border-amber-200 text-amber-600' },
    teal:   { active: 'bg-white text-teal-700 border-teal-200 shadow-sm',   badge: 'bg-teal-50 text-teal-600 border-teal-200',   icon: 'bg-teal-50 border-teal-200 text-teal-600' },
    orange: { active: 'bg-white text-orange-700 border-orange-200 shadow-sm', badge: 'bg-orange-50 text-orange-600 border-orange-200', icon: 'bg-orange-50 border-orange-200 text-orange-600' },
    slate:  { active: 'bg-white text-slate-700 border-slate-300 shadow-sm', badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'bg-slate-100 border-slate-200 text-slate-600' },
};

export const SystemFlowchartViewer_V2: React.FC = () => {
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [activeTab, setActiveTab] = useState<string>('arquitectura');

    const currentTab = TABS.find(t => t.id === activeTab) ?? TABS[0];
    const colors = COLOR_MAP[currentTab.color];

    const handleZoomIn    = () => setZoomLevel(prev => Math.min(prev + 20, 250));
    const handleZoomOut   = () => setZoomLevel(prev => Math.max(prev - 20, 40));
    const handleResetZoom = () => setZoomLevel(100);

    const handleDownloadPdf = () => {
        const link = document.createElement('a');
        link.href = currentTab.pdfFile;
        link.download = currentTab.pdfFile.replace('/', '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <section className="flex flex-col gap-4 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 flex-1 h-full min-h-screen">

            {/* ── TAB BAR ── */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        const c = COLOR_MAP[tab.color];
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setZoomLevel(100); }}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs whitespace-nowrap transition-all border ${
                                    isActive ? c.active : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                {tab.badge && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                        isActive ? c.badge : 'bg-slate-100 text-slate-400 border-slate-200'
                                    }`}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Header Ribbon */}
                <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 border rounded-lg ${colors.icon}`}>
                            {currentTab.icon}
                        </div>
                        <div>
                            <h2 className="text-sm font-black tracking-tight text-slate-800 flex items-center gap-2 uppercase">
                                {currentTab.label}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}>
                                    {currentTab.badge}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-xl">{currentTab.description}</p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <Button variant="ghost" size="sm" onClick={handleZoomOut}
                                className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer" title="Reducir Zoom">
                                <ZoomOut size={14} />
                            </Button>
                            <span className="text-xs font-mono font-bold text-slate-700 px-2 min-w-[50px] text-center select-none">
                                {zoomLevel}%
                            </span>
                            <Button variant="ghost" size="sm" onClick={handleZoomIn}
                                className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer" title="Aumentar Zoom">
                                <ZoomIn size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleResetZoom}
                                className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer" title="Resetear Zoom">
                                <RotateCcw size={14} />
                            </Button>
                        </div>
                        <Button onClick={handleDownloadPdf}
                            className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 px-4 shadow-sm transition-all cursor-pointer">
                            <Download size={14} />
                            <span>Descargar PDF</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── FLOWCHART VIEWER ── */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl shadow-inner p-6 overflow-x-auto overflow-y-auto max-h-[85vh] flex flex-col items-center justify-start">
                <div
                    className="transition-all duration-200 ease-out flex flex-col items-center min-w-[1600px]"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                >
                    <img
                        key={currentTab.svgFile}
                        src={currentTab.svgFile}
                        alt={`Flowchart: ${currentTab.label}`}
                        className="w-[1600px] h-auto shadow-lg rounded-xl bg-white p-8 border border-slate-200"
                    />
                </div>
            </div>
        </section>
    );
};
