import React, { useState, useEffect, useRef } from 'react';
import { 
    Printer, 
    ZoomIn, 
    ZoomOut, 
    RotateCcw,
    ChevronLeft, 
    ChevronRight, 
    Building2, 
    Award, 
    CheckCircle2, 
    Cpu, 
    Layers, 
    ShieldCheck, 
    Ship, 
    ExternalLink,
    GitFork,
    FileText,
    BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MofRole_V2 } from '../../data/mofManualData_V2';
import { MofValidationCard_V2 } from './MofValidationCard_V2';
import logoPetral from '../../assets/Logo.Petral.png';

interface MofRoleBookReaderProps {
    role: MofRole_V2;
    onPrevRole: () => void;
    onNextRole: () => void;
    hasPrev: boolean;
    hasNext: boolean;
    currentIndex: number;
    totalCount: number;
    onNavigateToOrganigram: () => void;
    onNavigateToDocs: () => void;
}

export const MofRoleBookReader_V2: React.FC<MofRoleBookReaderProps> = ({
    role,
    onPrevRole,
    onNextRole,
    hasPrev,
    hasNext,
    currentIndex,
    totalCount,
    onNavigateToOrganigram,
    onNavigateToDocs
}) => {
    const navigate = useNavigate();
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

    // Paletas temáticas de papel de libro editorial
    const themeStyles = {
        white: {
            container: 'bg-slate-100 text-slate-800',
            toolbar: 'bg-white/95 border-slate-200 text-slate-700',
            sheet: 'bg-white border-slate-200 shadow-xl text-slate-800',
            badge: 'bg-blue-50 text-blue-700 border-blue-200',
            summaryBox: 'bg-slate-50 border-slate-200 text-slate-700',
            calloutBox: 'bg-amber-500/10 border-amber-600/40 text-slate-900',
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
            calloutBox: 'bg-[#edd8b6] border-[#bd8d4c] text-[#3d2711]',
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
            calloutBox: 'bg-teal-950/40 border-teal-600/50 text-slate-100',
            tableHeader: 'bg-slate-800 text-slate-100 border-slate-700',
            tableCell: 'border-slate-700 text-slate-300',
            divider: 'border-slate-700',
            footerText: 'text-slate-500'
        }
    };

    const currentTheme = themeStyles[paperTheme];

    return (
        <div className={`w-full flex flex-col transition-colors duration-200 ${currentTheme.container}`}>
            
            {/* ── BARRA SUPERIOR DE LECTURA E IMPRESIÓN EDITORIAL (DR. COST STYLE) ── */}
            <div className={`sticky top-0 z-20 border-b backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors no-print ${currentTheme.toolbar}`}>
                
                {/* Indicador de Puesto Activo */}
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider truncate">
                        Puesto {currentIndex + 1} de {totalCount}: {role.personName} ({role.shortTitle})
                    </span>
                </div>

                {/* Controles de Lectura & Navegación */}
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

                    {/* Botón Ver Organigrama */}
                    <button
                        onClick={onNavigateToOrganigram}
                        title="Ver Organigrama Corporativo Oficial"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                        <GitFork size={13} />
                        <span className="hidden sm:inline">Organigrama</span>
                    </button>

                    {/* Botón Docs as Code */}
                    <button
                        onClick={onNavigateToDocs}
                        title="Ver Manual de Sistema Docs as Code"
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                        <BookOpen size={13} />
                        <span className="hidden sm:inline">Docs as Code</span>
                    </button>

                    {/* Botón Imprimir A4 */}
                    <button
                        onClick={handlePrint}
                        title="Imprimir perfil en hoja A4 o guardar como PDF"
                        className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                        <Printer size={13} />
                        <span>Imprimir A4</span>
                    </button>
                </div>
            </div>

            {/* ── HOJA A4 PRINCIPAL DEL PERFIL MOF (SOPORTA CTRL + SCROLL ZOOM) ── */}
            <div 
                ref={readerContainerRef}
                title="Tip: Usa Ctrl + Scroll del mouse para acercar o alejar el manual MOF"
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
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border inline-block ${currentTheme.badge}`}>
                                        {role.code}
                                    </span>
                                    <span className="text-[10px] font-bold opacity-60 uppercase font-sans">
                                        {role.department}
                                    </span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black font-serif tracking-tight mt-1 leading-tight">
                                    {role.personName} — {role.title}
                                </h1>
                            </div>
                        </div>

                        <div className="text-right text-[10px] font-mono opacity-60 hidden sm:block">
                            <div className="font-bold">NAVIERA PETRAL S.A.</div>
                            <div>MANUAL MOF OFICIAL</div>
                            <div>{new Date().toLocaleDateString('es-PE')}</div>
                        </div>
                    </div>

                    {/* Ficha de Dependencia Jerárquica y Activo Asignado */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-xs font-sans">
                        <div className={`p-3.5 rounded-xl border ${currentTheme.summaryBox}`}>
                            <span className="text-[10px] font-bold uppercase opacity-60 block mb-0.5">
                                🏢 Jefe Inmediato Superior:
                            </span>
                            <strong className="block text-sm">{role.immediateBoss}</strong>
                        </div>
                        <div className={`p-3.5 rounded-xl border ${currentTheme.summaryBox}`}>
                            <span className="text-[10px] font-bold uppercase opacity-60 block mb-0.5">
                                👥 Personal / Relaciones a Cargo:
                            </span>
                            <strong className="block text-xs leading-relaxed">{role.subordinates}</strong>
                        </div>
                        {role.assignedAsset && (
                            <div className={`sm:col-span-2 p-3.5 rounded-xl border flex items-center gap-2.5 ${currentTheme.calloutBox}`}>
                                <Ship size={18} className="shrink-0 text-blue-600 dark:text-blue-400" />
                                <div className="text-xs">
                                    <span className="text-[10px] font-bold uppercase opacity-75 block">Activo Marítimo o Cartera Asignada:</span>
                                    <strong>{role.assignedAsset}</strong>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sección 1: Misión & Propósito Principal del Cargo */}
                    <div className="space-y-3 mb-8 avoid-page-break">
                        <h3 className="text-sm sm:text-base font-bold font-sans tracking-tight border-b pb-1.5 flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-600" />
                            <span>1. Misión &amp; Propósito Principal del Cargo</span>
                        </h3>
                        <p className={`p-4 rounded-xl border text-xs sm:text-sm font-sans leading-relaxed text-justify ${currentTheme.summaryBox}`}>
                            {role.mainPurpose}
                        </p>
                    </div>

                    {/* Marco Normativo y Cumplimiento Regulatorio */}
                    {role.regulatoryFramework && role.regulatoryFramework.length > 0 && (
                        <div className="space-y-3 mb-8 avoid-page-break">
                            <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>Marco Normativo &amp; Cumplimiento Regulatorio Aplicable</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
                                {role.regulatoryFramework.map((reg, rIdx) => (
                                    <div key={rIdx} className={`p-2.5 rounded-lg border flex items-center gap-2 ${currentTheme.summaryBox}`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                        <span className="opacity-90 leading-tight">{reg}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sección 2: Matriz de Responsabilidades y Entregables Vinculados al ERP */}
                    <div className="space-y-3 mb-8">
                        <h3 className="text-sm sm:text-base font-bold font-sans tracking-tight border-b pb-1.5 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>2. Funciones, Actividades y Entregables Vinculados al ERP</span>
                        </h3>

                        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 font-sans">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className={currentTheme.tableHeader}>
                                        <th className="p-2.5 font-bold border-b border-slate-200 dark:border-slate-700 w-10 text-center">N°</th>
                                        <th className="p-2.5 font-bold border-b border-slate-200 dark:border-slate-700">Actividad / Responsabilidad</th>
                                        <th className="p-2.5 font-bold border-b border-slate-200 dark:border-slate-700">Módulo ERP</th>
                                        <th className="p-2.5 font-bold border-b border-slate-200 dark:border-slate-700">Frecuencia</th>
                                        <th className="p-2.5 font-bold border-b border-slate-200 dark:border-slate-700">Entregable Oficial</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {role.coreResponsibilities.map((resp, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                            <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400 text-center">
                                                {resp.num}
                                            </td>
                                            <td className="p-2.5 font-bold">
                                                {resp.activity}
                                            </td>
                                            <td className="p-2.5">
                                                <button
                                                    onClick={() => navigate(resp.erpRoute)}
                                                    className="px-2 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer no-print"
                                                    title={`Ir a ${resp.erpModule}`}
                                                >
                                                    <span>{resp.erpModule}</span>
                                                    <ExternalLink size={10} />
                                                </button>
                                                <span className="hidden print:inline text-[10px] font-mono">
                                                    {resp.erpModule} ({resp.erpRoute})
                                                </span>
                                            </td>
                                            <td className="p-2.5">
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                                    {resp.frequency}
                                                </span>
                                            </td>
                                            <td className="p-2.5 text-[11px] leading-relaxed opacity-90">
                                                {resp.deliverable}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sección 3: Políticas de Acceso y Permisos en el ERP */}
                    <div className="space-y-3 mb-8 avoid-page-break">
                        <h3 className="text-sm sm:text-base font-bold font-sans tracking-tight border-b pb-1.5 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-indigo-600" />
                            <span>3. Políticas de Acceso y Permisos en el ERP PETRAL</span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans text-xs">
                            {role.systemPermissions.map((perm, idx) => (
                                <div key={idx} className={`p-3.5 rounded-xl border space-y-1.5 ${currentTheme.summaryBox}`}>
                                    <div className="flex items-center justify-between gap-2">
                                        <strong className="block text-xs">{perm.moduleName}</strong>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                            perm.accessLevel.includes('Editor') 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' 
                                                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                                        }`}>
                                            {perm.accessLevel}
                                        </span>
                                    </div>
                                    <p className="text-[11px] opacity-80 leading-relaxed">
                                        {perm.keyActions}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sección 4: KPIs y Sección 5: Competencias */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700 mb-8">
                        
                        {/* KPIs */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-blue-600" />
                                <span>4. Indicadores Clave de Desempeño (KPIs)</span>
                            </h3>
                            <div className="space-y-2 font-sans text-xs">
                                {role.kpiIndicators.map((kpi, idx) => (
                                    <div key={idx} className={`p-3 rounded-xl border ${currentTheme.summaryBox}`}>
                                        <div className="flex items-center justify-between mb-1 gap-2">
                                            <span className="font-bold">{kpi.metric}</span>
                                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                                {kpi.target}
                                            </span>
                                        </div>
                                        <span className="text-[10px] opacity-60">
                                            Fuente ERP: <strong>{kpi.erpSource}</strong>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Competencias */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-amber-600" />
                                <span>5. Competencias Profesionales Exigidas</span>
                            </h3>
                            <div className="flex flex-wrap gap-2 font-sans text-xs">
                                {role.competencies.map((comp, idx) => (
                                    <span 
                                        key={idx}
                                        className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 ${currentTheme.summaryBox}`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                        <span>{comp}</span>
                                    </span>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Cédula de Validación Técnica y Homologación del Cargo */}
                    <MofValidationCard_V2 
                        roleId={role.id}
                        roleCode={role.code}
                        personName={role.personName}
                        themeMode={paperTheme}
                    />

                    {/* Navegación Inferior entre Puestos */}
                    <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-sans text-xs no-print">
                        <button
                            onClick={onPrevRole}
                            disabled={!hasPrev}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                                hasPrev 
                                    ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200' 
                                    : 'opacity-40 cursor-not-allowed border-transparent'
                            }`}
                        >
                            <ChevronLeft size={16} />
                            <span>Puesto Anterior</span>
                        </button>

                        <span className="font-mono text-[11px] opacity-60">
                            {currentIndex + 1} de {totalCount} Puestos Homologados
                        </span>

                        <button
                            onClick={onNextRole}
                            disabled={!hasNext}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                                hasNext 
                                    ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200' 
                                    : 'opacity-40 cursor-not-allowed border-transparent'
                            }`}
                        >
                            <span>Siguiente Puesto</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Pie de Página Editorial A4 */}
                    <div className={`mt-8 pt-4 border-t text-center text-[10px] font-mono ${currentTheme.footerText} ${currentTheme.divider}`}>
                        MANUAL DE ORGANIZACIÓN Y FUNCIONES (MOF) • NAVIERA PETRAL S.A. • COPIA CONTROLADA Y AUDITADA
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
                    .avoid-page-break, blockquote, [class*="summaryBox"] {
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
