import React, { useState, useMemo } from 'react';
import { 
    Search, 
    ChevronRight, 
    ChevronDown, 
    Anchor, 
    Compass, 
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
import logoPetral from '../../assets/Logo.Petral.png';
import { DOCS_AS_CODE_CHAPTERS } from '../../data/docsAsCodeData_V2';
import type { DocChapter_V2 } from '../../data/docsAsCodeData_V2';
import { DocsAsCodeBookReader_V2 } from '../../components/DocsAsCode/DocsAsCodeBookReader_V2';
import { DocsAsCodeSyncModal_V2 } from '../../components/DocsAsCode/DocsAsCodeSyncModal_V2';

export const SystemDocumentation_V2: React.FC = () => {
    const [activeChapterId, setActiveChapterId] = useState<string>('c1');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Estados de colapso de las dos burbujas principales
    const [isMaestrosOpen, setIsMaestrosOpen] = useState<boolean>(true);
    const [isHerramientasOpen, setIsHerramientasOpen] = useState<boolean>(true);

    // Estado del Modal de Sincronización As-Built
    const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
    const [lastSyncedDate, setLastSyncedDate] = useState<string>(() => {
        return localStorage.getItem('petral_docs_last_synced') || '14/10/2026, 09:00:00';
    });

    // Mapeo dinámico de iconos
    const renderIcon = (iconName: string) => {
        const props = { size: 15, className: "shrink-0" };
        switch (iconName) {
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

    // Filtro reactivo por búsqueda
    const filteredChapters = useMemo(() => {
        if (!searchQuery.trim()) return DOCS_AS_CODE_CHAPTERS;
        const q = searchQuery.toLowerCase().trim();
        return DOCS_AS_CODE_CHAPTERS.filter(ch => 
            ch.title.toLowerCase().includes(q) ||
            ch.subtitle.toLowerCase().includes(q) ||
            ch.executiveSummary.toLowerCase().includes(q) ||
            ch.keywords.some(k => k.toLowerCase().includes(q))
        );
    }, [searchQuery]);

    // Categorías únicas para Maestros
    const categoriesMaestros = useMemo(() => {
        return Array.from(new Set(
            DOCS_AS_CODE_CHAPTERS
                .filter(c => c.sectionType === 'MAESTROS')
                .map(c => c.categoryGroup)
        ));
    }, []);

    // Índice activo y navegación entre capítulos
    const activeIndex = DOCS_AS_CODE_CHAPTERS.findIndex(c => c.id === activeChapterId);
    const currentChapter: DocChapter_V2 = DOCS_AS_CODE_CHAPTERS[activeIndex] || DOCS_AS_CODE_CHAPTERS[0];

    const handlePrevChapter = () => {
        if (activeIndex > 0) {
            setActiveChapterId(DOCS_AS_CODE_CHAPTERS[activeIndex - 1].id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleNextChapter = () => {
        if (activeIndex < DOCS_AS_CODE_CHAPTERS.length - 1) {
            setActiveChapterId(DOCS_AS_CODE_CHAPTERS[activeIndex + 1].id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300 print:block print:gap-0 print:p-0 print:m-0 print:w-full">
            
            {/* ── ENCABEZADO PRINCIPAL DE LA VISTA ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <img src={logoPetral} alt="Naviera Petral" className="h-10 w-auto object-contain" />
                    <div className="h-8 border-l border-slate-200 hidden md:block"></div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">MANUAL INTEGRAL DEL SISTEMA</h2>
                        <span className="text-xs text-slate-500 font-bold tracking-wider uppercase block">
                            PETRAL SHIPPING.SOFT V2.5 PRO • 19 MÓDULOS DE FLOTA &amp; OPERACIONES
                        </span>
                    </div>
                </div>

                {/* Buscador Contextual */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar fórmulas, puertos o módulos..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* ── CONTENEDOR PRINCIPAL: SIDEBAR 320px + VISOR DE LIBRO EDITORIAL ── */}
            <div className="flex flex-col lg:flex-row gap-6 items-start w-full min-w-0 print:block print:w-full print:p-0 print:m-0">

                {/* NAVEGACIÓN LATERAL: 2 BURBUJAS COLAPSABLES (320px CONGELADOS EXACTOS) */}
                <aside className="w-full lg:w-[320px] lg:min-w-[320px] lg:max-w-[320px] shrink-0 space-y-4 print:hidden">

                    {/* ── BURBUJA 1: DATOS MAESTROS (11 MÓDULOS) ── */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all w-full">
                        <button
                            onClick={() => setIsMaestrosOpen(!isMaestrosOpen)}
                            className="w-full bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200 text-left hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm shrink-0">🗂️</span>
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">DATOS MAESTROS</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">11 Módulos</span>
                                {isMaestrosOpen ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                            </div>
                        </button>

                        {isMaestrosOpen && (
                            <div className="p-3 space-y-3 max-h-[460px] overflow-y-auto scrollbar-thin w-full">
                                {categoriesMaestros.map(cat => {
                                    const catChapters = filteredChapters.filter(c => c.sectionType === 'MAESTROS' && c.categoryGroup === cat);
                                    if (catChapters.length === 0) return null;

                                    const catIcon = cat.includes('FÍSICOS') ? '🏗️'
                                                  : cat.includes('COMERCIALES') ? '💼'
                                                  : cat.includes('COSTOS') ? '💰'
                                                  : cat.includes('BÚNKER') ? '⛽'
                                                  : '📦';

                                    return (
                                        <div key={cat} className="space-y-1 w-full">
                                            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1.5">
                                                <span>{catIcon}</span>
                                                <span className="truncate">{cat}</span>
                                            </div>
                                            <div className="pl-2 flex flex-col gap-0.5 border-l-2 border-slate-100 ml-1.5 w-full">
                                                {catChapters.map(ch => {
                                                    const isActive = ch.id === activeChapterId;
                                                    return (
                                                        <button
                                                            key={ch.id}
                                                            onClick={() => setActiveChapterId(ch.id)}
                                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                                                isActive 
                                                                    ? 'bg-blue-600 text-white shadow-sm' 
                                                                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2 truncate min-w-0">
                                                                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                                                                    {renderIcon(ch.iconName)}
                                                                </span>
                                                                <span className="truncate">{ch.chapterNum}. {ch.title}</span>
                                                            </div>
                                                            <ChevronRight size={14} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── BURBUJA 2: HERRAMIENTAS & MOTORES (8 MÓDULOS) ── */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all w-full">
                        <button
                            onClick={() => setIsHerramientasOpen(!isHerramientasOpen)}
                            className="w-full bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200 text-left hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm shrink-0">🛠️</span>
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">HERRAMIENTAS &amp; MOTORES</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">8 Módulos</span>
                                {isHerramientasOpen ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                            </div>
                        </button>

                        {isHerramientasOpen && (
                            <div className="p-3 space-y-1 max-h-[380px] overflow-y-auto scrollbar-thin w-full">
                                {filteredChapters.filter(c => c.sectionType === 'HERRAMIENTAS').map(ch => {
                                    const isActive = ch.id === activeChapterId;
                                    return (
                                        <button
                                            key={ch.id}
                                            onClick={() => setActiveChapterId(ch.id)}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                                isActive 
                                                    ? 'bg-blue-600 text-white shadow-sm' 
                                                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 truncate min-w-0">
                                                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                                                    {renderIcon(ch.iconName)}
                                                </span>
                                                <span className="truncate">{ch.chapterNum}. {ch.title}</span>
                                            </div>
                                            <ChevronRight size={14} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </aside>

                {/* ── ÁREA PRINCIPAL: VISOR DE LIBRO EDITORIAL CON REGLAS DE IMPRESIÓN A4 ── */}
                <div className="flex-1 min-w-0 w-full print:block print:w-full print:p-0 print:m-0">
                    <DocsAsCodeBookReader_V2
                        chapter={currentChapter}
                        onPrevChapter={handlePrevChapter}
                        onNextChapter={handleNextChapter}
                        hasPrev={activeIndex > 0}
                        hasNext={activeIndex < DOCS_AS_CODE_CHAPTERS.length - 1}
                        currentIndex={activeIndex}
                        totalCount={DOCS_AS_CODE_CHAPTERS.length}
                        onOpenSyncModal={() => setShowSyncModal(true)}
                    />
                </div>

            </div>

            {/* Modal de Sincronización As-Built Desacoplado */}
            <DocsAsCodeSyncModal_V2
                isOpen={showSyncModal}
                onClose={() => setShowSyncModal(false)}
                lastSyncedDate={lastSyncedDate}
                onSyncSuccess={(newDate) => setLastSyncedDate(newDate)}
            />

        </div>
    );
};
