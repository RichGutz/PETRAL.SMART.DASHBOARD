import React, { useState, useEffect, useRef } from 'react';
import { 
    Printer, 
    ZoomIn, 
    ZoomOut, 
    RotateCcw,
    ChevronLeft, 
    ChevronRight, 
    Sparkles, 
    Compass, 
    Anchor, 
    Database, 
    Building2, 
    FileText, 
    MapPin, 
    Receipt, 
    Coins, 
    Scale, 
    Zap, 
    Layers, 
    ShoppingCart, 
    BarChart3, 
    LineChart, 
    Map, 
    FileCode, 
    ShieldCheck, 
    BookOpen
} from 'lucide-react';
import type { DocChapter_V2 } from '../../data/docsAsCodeData_V2';
import { DocsValidationCard_V2 } from './DocsValidationCard_V2';
import logoPetral from '../../assets/Logo.Petral.png';

interface DocsAsCodeBookReaderProps {
    chapter: DocChapter_V2;
    onPrevChapter: () => void;
    onNextChapter: () => void;
    hasPrev: boolean;
    hasNext: boolean;
    currentIndex: number;
    totalCount: number;
    onOpenSyncModal: () => void;
}

export const DocsAsCodeBookReader_V2: React.FC<DocsAsCodeBookReaderProps> = ({
    chapter,
    onPrevChapter,
    onNextChapter,
    hasPrev,
    hasNext,
    currentIndex,
    totalCount,
    onOpenSyncModal
}) => {
    const [fontSize, setFontSize] = useState<number>(15);
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [paperTheme, setPaperTheme] = useState<'white' | 'sepia' | 'dark'>('white');
    const readerContainerRef = useRef<HTMLDivElement>(null);

    // Zoom interactivo con Ctrl + Scroll del mouse (intercepta preventDefault sin pasividad)
    useEffect(() => {
        const el = readerContainerRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    setZoomLevel(prev => Math.min(prev + 10, 200));
                } else {
                    setZoomLevel(prev => Math.max(prev - 10, 60));
                }
            }
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            el.removeEventListener('wheel', handleWheel);
        };
    }, []);

    const handlePrint = () => {
        window.print();
    };

    // Paletas temáticas de papel de libro
    const themeStyles = {
        white: {
            container: 'bg-slate-100 text-slate-800',
            toolbar: 'bg-white/95 border-slate-200 text-slate-700',
            sheet: 'bg-white border-slate-200 shadow-xl text-slate-800',
            badge: 'bg-blue-50 text-blue-700 border-blue-200',
            summaryBox: 'bg-slate-50 border-slate-200 text-slate-700',
            formulaBox: 'bg-amber-500/10 border-amber-600/40 text-slate-900',
            formulaCode: 'bg-slate-900 text-amber-300',
            tableHeader: 'bg-slate-100 text-slate-800 border-slate-200',
            tableCell: 'border-slate-200 text-slate-700',
            divider: 'border-slate-200',
            footerText: 'text-slate-400'
        },
        sepia: {
            container: 'bg-[#f4ecd8] text-[#433422]',
            toolbar: 'bg-[#fbf0d9]/95 border-[#decbb0] text-[#433422]',
            sheet: 'bg-[#fbf0d9] border-[#decbb0] shadow-xl text-[#433422]',
            badge: 'bg-[#edd9bc] text-[#5c3e1e] border-[#deb889]',
            summaryBox: 'bg-[#f5e4c8] border-[#decbb0] text-[#4a3622]',
            formulaBox: 'bg-[#edd8b6] border-[#bd8d4c] text-[#3d2711]',
            formulaCode: 'bg-[#3b2b1b] text-[#fadc96]',
            tableHeader: 'bg-[#ecd7b9] text-[#433422] border-[#decbb0]',
            tableCell: 'border-[#decbb0] text-[#523d26]',
            divider: 'border-[#decbb0]',
            footerText: 'text-[#856c4d]'
        },
        dark: {
            container: 'bg-[#0b1120] text-slate-200',
            toolbar: 'bg-[#1e293b]/95 border-slate-700 text-slate-200',
            sheet: 'bg-[#1e293b] border-slate-700 shadow-2xl text-slate-200',
            badge: 'bg-teal-950/60 text-teal-300 border-teal-800',
            summaryBox: 'bg-slate-800/80 border-slate-700 text-slate-300',
            formulaBox: 'bg-teal-950/40 border-teal-600/50 text-slate-100',
            formulaCode: 'bg-slate-950 text-teal-300',
            tableHeader: 'bg-slate-800 text-slate-100 border-slate-700',
            tableCell: 'border-slate-700 text-slate-300',
            divider: 'border-slate-700',
            footerText: 'text-slate-500'
        }
    };

    const currentTheme = themeStyles[paperTheme];

    // Helper para renderizar iconos según nombre
    const renderIcon = (name: string) => {
        const props = { size: 18, className: "shrink-0" };
        switch (name) {
            case 'Anchor': return <Anchor {...props} />;
            case 'Compass': return <Compass {...props} />;
            case 'Database': return <Database {...props} />;
            case 'Building2': return <Building2 {...props} />;
            case 'FileText': return <FileText {...props} />;
            case 'MapPin': return <MapPin {...props} />;
            case 'Receipt': return <Receipt {...props} />;
            case 'Coins': return <Coins {...props} />;
            case 'Scale': return <Scale {...props} />;
            case 'Zap': return <Zap {...props} />;
            case 'Layers': return <Layers {...props} />;
            case 'ShoppingCart': return <ShoppingCart {...props} />;
            case 'BarChart3': return <BarChart3 {...props} />;
            case 'LineChart': return <LineChart {...props} />;
            case 'Map': return <Map {...props} />;
            case 'FileCode': return <FileCode {...props} />;
            case 'ShieldCheck': return <ShieldCheck {...props} />;
            default: return <BookOpen {...props} />;
        }
    };

    return (
        <div className={`w-full flex flex-col transition-colors duration-200 ${currentTheme.container}`}>
            
            {/* ── BARRA SUPERIOR DE LECTURA E IMPRESIÓN EDITORIAL (DR. COST STYLE) ── */}
            <div className={`sticky top-0 z-20 border-b backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors no-print ${currentTheme.toolbar}`}>
                
                {/* Indicador de Capítulo Activo */}
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider truncate">
                        Cap. {chapter.chapterNum} de {totalCount}: {chapter.title}
                    </span>
                </div>

                {/* Controles de Lectura */}
                <div className="flex items-center gap-2.5 shrink-0">
                    
                    {/* Zoom de Hoja A4 */}
                    <div className="flex items-center rounded-lg p-0.5 border border-slate-300 dark:border-slate-700 bg-black/5 dark:bg-white/5">
                        <button
                            onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))}
                            title="Reducir escala (Ctrl + Scroll Abajo)"
                            className="p-1 hover:text-blue-600 rounded cursor-pointer transition-colors"
                        >
                            <ZoomOut size={13} />
                        </button>
                        <span className="text-[11px] font-mono font-bold px-1 min-w-[38px] text-center select-none">
                            {zoomLevel}%
                        </span>
                        <button
                            onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))}
                            title="Aumentar escala (Ctrl + Scroll Arriba)"
                            className="p-1 hover:text-blue-600 rounded cursor-pointer transition-colors"
                        >
                            <ZoomIn size={13} />
                        </button>
                        <button
                            onClick={() => setZoomLevel(100)}
                            title="Restablecer escala al 100%"
                            className="p-1 hover:text-blue-600 rounded cursor-pointer transition-colors"
                        >
                            <RotateCcw size={11} />
                        </button>
                    </div>

                    {/* Tamaño de Letra */}
                    <div className="hidden sm:flex items-center rounded-lg p-0.5 border border-slate-300 dark:border-slate-700 bg-black/5 dark:bg-white/5">
                        <button
                            onClick={() => setFontSize(Math.max(13, fontSize - 1))}
                            title="Reducir tamaño de letra"
                            className="p-1 hover:text-blue-600 rounded cursor-pointer transition-colors"
                        >
                            <ZoomOut size={13} />
                        </button>
                        <span className="text-[11px] font-mono font-bold px-1.5 min-w-[34px] text-center">
                            {fontSize}px
                        </span>
                        <button
                            onClick={() => setFontSize(Math.min(22, fontSize + 1))}
                            title="Aumentar tamaño de letra"
                            className="p-1 hover:text-blue-600 rounded cursor-pointer transition-colors"
                        >
                            <ZoomIn size={13} />
                        </button>
                    </div>

                    {/* Selector de Papel */}
                    <div className="flex items-center rounded-lg p-0.5 border border-slate-300 dark:border-slate-700 bg-black/5 dark:bg-white/5 text-xs font-semibold">
                        <button
                            onClick={() => setPaperTheme('white')}
                            className={`px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                                paperTheme === 'white' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'opacity-70 hover:opacity-100'
                            }`}
                        >
                            Blanco
                        </button>
                        <button
                            onClick={() => setPaperTheme('sepia')}
                            className={`px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                                paperTheme === 'sepia' ? 'bg-[#fbf0d9] text-[#433422] shadow-xs font-bold' : 'opacity-70 hover:opacity-100'
                            }`}
                        >
                            Sepia
                        </button>
                        <button
                            onClick={() => setPaperTheme('dark')}
                            className={`px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                                paperTheme === 'dark' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'opacity-70 hover:opacity-100'
                            }`}
                        >
                            Noche
                        </button>
                    </div>

                    {/* Botón Sincronizador As-Built */}
                    <button
                        onClick={onOpenSyncModal}
                        title="Actualizar y Sincronizar Docs as Code"
                        className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                        <Sparkles size={13} />
                        <span className="hidden sm:inline">As-Built</span>
                    </button>

                    {/* Botón Imprimir A4 */}
                    <button
                        onClick={handlePrint}
                        title="Imprimir en hoja A4 o guardar como PDF"
                        className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                        <Printer size={13} />
                        <span>Imprimir A4</span>
                    </button>
                </div>
            </div>

            {/* ── HOJA A4 PRINCIPAL DE LECTURA EDITORIAL (SOPORTA CTRL + SCROLL ZOOM) ── */}
            <div 
                ref={readerContainerRef}
                title="Tip: Usa Ctrl + Scroll del mouse para acercar o alejar el manual"
                className="w-full flex justify-center py-6 px-3 sm:px-6 print:p-0 print:m-0 print:block overflow-x-auto select-none"
            >
                <main 
                    className={`a4-sheet w-full max-w-[880px] min-h-[1050px] rounded-xl p-6 sm:p-12 md:p-14 border transition-all duration-200 relative ${currentTheme.sheet} print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-full print:w-full print:rounded-none`}
                    style={{ 
                        fontSize: `${fontSize}px`,
                        transform: `scale(${zoomLevel / 100})`,
                        transformOrigin: 'top center'
                    }}
                >
                    {/* Membrete Oficial A4 */}
                    <div className="border-b-2 border-slate-300 dark:border-slate-700 pb-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <img src={logoPetral} alt="Naviera Petral" className="h-10 w-auto object-contain" />
                            <div>
                                <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border inline-block ${currentTheme.badge}`}>
                                    {chapter.categoryGroup} • {chapter.badge}
                                </span>
                                <h1 className="text-xl sm:text-2xl font-black font-serif tracking-tight mt-1 leading-tight">
                                    {chapter.title}
                                </h1>
                                <p className="text-xs opacity-70 font-sans mt-0.5">{chapter.subtitle}</p>
                            </div>
                        </div>

                        <div className="text-right text-[10px] font-mono opacity-60 hidden sm:block">
                            <div className="font-bold">PETRAL SHIPPING.SOFT V2.5 PRO</div>
                            <div>MANUAL TÉCNICO AS-BUILT</div>
                            <div>{new Date().toLocaleDateString('es-PE')}</div>
                        </div>
                    </div>

                    {/* Resumen Ejecutivo del Módulo */}
                    <div className={`p-4 rounded-xl border mb-8 text-xs font-sans leading-relaxed flex items-start gap-3 ${currentTheme.summaryBox}`}>
                        <div className="p-2 rounded-lg bg-black/5 dark:bg-white/10 shrink-0">
                            {renderIcon(chapter.iconName)}
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider block opacity-70 mb-0.5">
                                Propósito y Alcance Operativo:
                            </span>
                            <p>{chapter.executiveSummary}</p>
                        </div>
                    </div>

                    {/* Secciones Técnicas Detalladas */}
                    <div className="space-y-8 font-serif leading-relaxed text-justify">
                        {chapter.sections.map((sec) => (
                            <section key={sec.number} className="space-y-3.5">
                                
                                {/* Título de la Subsección */}
                                <h3 className="text-base sm:text-lg font-bold font-sans tracking-tight border-b pb-1.5 flex items-center gap-2">
                                    <span className="text-blue-600 dark:text-blue-400 font-mono font-black">{sec.number}</span>
                                    <span>{sec.title}</span>
                                </h3>

                                {/* Párrafos de Prosa Técnica */}
                                {sec.prose.map((pText, pIdx) => (
                                    <p key={pIdx} className="text-xs sm:text-sm leading-relaxed opacity-90 font-sans">
                                        {pText}
                                    </p>
                                ))}

                                {/* Viñetas de Parámetros */}
                                {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3 font-sans text-xs">
                                        {sec.bulletPoints.map((bItem, bIdx) => (
                                            <div key={bIdx} className={`p-3 rounded-lg border ${currentTheme.summaryBox}`}>
                                                <strong className="block mb-0.5 text-blue-700 dark:text-blue-300 font-bold">
                                                    • {bItem.label}:
                                                </strong>
                                                <span className="opacity-80 leading-normal">{bItem.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Caja de Fórmulas Matemáticas y Reglas de Negocio */}
                                {sec.formulaBox && (
                                    <div className={`p-4 sm:p-5 rounded-xl border my-4 font-sans avoid-page-break ${currentTheme.formulaBox}`}>
                                        <div className="text-[10px] font-black tracking-wider uppercase opacity-80 mb-1 flex items-center gap-1.5">
                                            <span>📐</span>
                                            <span>{sec.formulaBox.title}</span>
                                        </div>
                                        <div className={`p-3 rounded-lg font-mono text-xs sm:text-sm font-bold my-2 overflow-x-auto ${currentTheme.formulaCode}`}>
                                            {sec.formulaBox.formula}
                                        </div>
                                        <p className="text-xs opacity-90 leading-relaxed mb-3">
                                            {sec.formulaBox.explanation}
                                        </p>
                                        {sec.formulaBox.variables && (
                                            <div className="border-t border-black/10 dark:border-white/10 pt-2.5 space-y-1 text-[11px] font-mono">
                                                <span className="text-[10px] font-bold block uppercase opacity-75">Variables de la Ecuación:</span>
                                                {sec.formulaBox.variables.map((v, vIdx) => (
                                                    <div key={vIdx} className="flex flex-col sm:flex-row sm:gap-2">
                                                        <strong className="text-amber-700 dark:text-amber-400 font-bold shrink-0">• {v.sym}:</strong>
                                                        <span className="opacity-80">{v.desc}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tablas de Parámetros */}
                                {sec.tableData && (
                                    <div className="my-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 font-sans avoid-page-break">
                                        {sec.tableData.caption && (
                                            <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                {sec.tableData.caption}
                                            </div>
                                        )}
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className={currentTheme.tableHeader}>
                                                    {sec.tableData.headers.map((h, hIdx) => (
                                                        <th key={hIdx} className="p-2.5 font-bold border-b border-slate-200 dark:border-slate-700">
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sec.tableData.rows.map((row, rIdx) => (
                                                    <tr key={rIdx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                        {row.map((cell, cIdx) => (
                                                            <td key={cIdx} className={`p-2.5 ${currentTheme.tableCell}`}>
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                            </section>
                        ))}
                    </div>

                    {/* Cédula de Validación Técnica y Certificación */}
                    <DocsValidationCard_V2 
                        chapterId={chapter.id}
                        chapterBadge={chapter.badge}
                        chapterTitle={chapter.title}
                        themeMode={paperTheme}
                    />

                    {/* Navegación Inferior entre Capítulos */}
                    <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-sans text-xs no-print">
                        <button
                            onClick={onPrevChapter}
                            disabled={!hasPrev}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                                hasPrev 
                                    ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200' 
                                    : 'opacity-40 cursor-not-allowed border-transparent'
                            }`}
                        >
                            <ChevronLeft size={16} />
                            <span>Capítulo Anterior</span>
                        </button>

                        <span className="font-mono text-[11px] opacity-60">
                            {currentIndex + 1} de {totalCount} Capítulos
                        </span>

                        <button
                            onClick={onNextChapter}
                            disabled={!hasNext}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                                hasNext 
                                    ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200' 
                                    : 'opacity-40 cursor-not-allowed border-transparent'
                            }`}
                        >
                            <span>Siguiente Capítulo</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Pie de Página Editorial A4 */}
                    <div className={`mt-8 pt-4 border-t text-center text-[10px] font-mono ${currentTheme.footerText} ${currentTheme.divider}`}>
                        SHIPPING.SOFT v2.5 • NAVIERA PETRAL S.A. • CONVENIO MARÍTIMO OFICIAL • COPIA REGISTRADA
                    </div>
                </main>
            </div>

            {/* Inyección de Reglas CSS @media print Estilo Dr. Cost */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 12mm 15mm 12mm 15mm;
                    }
                    html, body, #root, #root > div, #root > div > div, main {
                        height: auto !important;
                        min-height: 0 !important;
                        max-height: none !important;
                        overflow: visible !important;
                        position: static !important;
                        display: block !important;
                        width: 100% !important;
                        background: #ffffff !important;
                        color: #0f172a !important;
                    }
                    header, nav, aside, footer, .no-print, button, input {
                        display: none !important;
                    }
                    .a4-sheet {
                        max-width: 100% !important;
                        width: 100% !important;
                        min-height: auto !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: #ffffff !important;
                        color: #0f172a !important;
                        display: block !important;
                        position: static !important;
                    }
                    .a4-sheet * {
                        color: #0f172a !important;
                        text-shadow: none !important;
                    }
                    .avoid-page-break, blockquote, .formula-box {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    table {
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    thead {
                        display: table-header-group !important;
                    }
                    h1, h2, h3, h4, h5 {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
            `}</style>

        </div>
    );
};
