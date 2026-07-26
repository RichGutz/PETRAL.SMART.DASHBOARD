import React, { useState, useMemo } from 'react';
import { Download, Search, ChevronRight, Anchor, Compass, Database, Building2, FileText, MapPin, Receipt, Coins, Scale, Zap, Layers } from 'lucide-react';
import logoPetral from '../../assets/Logo.Petral.png';

interface DocChapter {
    id: string;
    categoryGroup: string;
    chapterNum: number;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    badge: string;
    keywords: string[];
    content: React.ReactNode;
}

export const SystemDocumentation_V2: React.FC = () => {
    const [activeChapterId, setActiveChapterId] = useState<string>('c1');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const chapters: DocChapter[] = [
        // ── 1. MAESTROS FÍSICOS ──
        {
            id: 'c1',
            categoryGroup: 'MAESTROS FÍSICOS',
            chapterNum: 1,
            title: 'Maestro de Flota',
            subtitle: 'Especificaciones de naves, DWT, LOA, GRT, calados y matriz de consumos',
            icon: <Anchor size={16} />,
            badge: 'Maestro Físico',
            keywords: ['flota', 'buques', 'dwt', 'grt', 'loa', 'moquegua', 'tablones', 'huemul', 'concon', 'consumos'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">1.1 Registro Físico de Embarcaciones</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            El <strong>Maestro de Flota</strong> administra los parámetros constructivos y las matrices operativas de consumo para las naves propias y fletadas de Naviera Petral (<em>B/T Moquegua</em>, <em>B/T Tablones</em>, <em>Concon Trader</em>, <em>Huemul</em>).
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1 font-sans">🚢 Dimensiones &amp; Capacidades:</span>
                                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                    <li>LOA (Length Overall): Eslora total en metros.</li>
                                    <li>GRT (Gross Register Tonnage): Arqueo bruto en TRB.</li>
                                    <li>DWT (Deadweight Tonnage): Tonelaje de peso muerto.</li>
                                    <li>Draft Summer / Tropical: Calado máximo operativo.</li>
                                </ul>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1 font-sans">⛽ Matriz de Consumos de Búnker (MT/día):</span>
                                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                    <li>Navegación Laden / Ballast (IFO 380 VLSFO &amp; MDO).</li>
                                    <li>Operaciones de Carga / Descarga en Muelle.</li>
                                    <li>Espera / Fondeo (Idle Status).</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'c2',
            categoryGroup: 'MAESTROS FÍSICOS',
            chapterNum: 2,
            title: 'Maestro de Puertos y Terminales',
            subtitle: 'Directorio de puertos de Perú y Chile, terminales y límites de atracadero',
            icon: <Compass size={16} />,
            badge: 'Maestro Físico',
            keywords: ['puertos', 'terminales', 'callao', 'matarani', 'ilo', 'marcona', 'mejillones', 'apm', 'tisur', 'spcc'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">2.1 Directorio Portuario Nacional e Internacional</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            Centraliza los puertos operados por Naviera Petral en la Costa Oeste de Sudamérica (Perú y Chile), detallando los terminales asignados, ritmos de carga/descarga (MT/hora) y límites máximos de calado y LOA.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Callao (APM Terminals)</span>
                                <span className="text-[11px] text-slate-500">Ritmo Carga: 500 MT/h | Descarga: 350 MT/h.</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Matarani (Tisur S.A.)</span>
                                <span className="text-[11px] text-slate-500">Ritmo Carga: 500 MT/h | Descarga: 350 MT/h.</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Ilo (SPCC / Enapu)</span>
                                <span className="text-[11px] text-slate-500">Terminal Minero / Enapu para ácido y combustibles.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'c3',
            categoryGroup: 'MAESTROS FÍSICOS',
            chapterNum: 3,
            title: 'Maestro de Distancias',
            subtitle: 'Matriz distancial en millas náuticas (NM) entre origen y destino',
            icon: <Database size={16} />,
            badge: 'Maestro Físico',
            keywords: ['distancias', 'rutas', 'millas', 'nm', 'navegacion', 'lastre', 'cargado'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">3.1 Distancias Marítimas Oficiales</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Registra las distancias precisas en Millas Náuticas (NM) entre los puertos de originación y destino en la Costa Oeste de Sudamérica (Perú y Chile), permitiendo calcular los días exactos de navegación en lastre (T_ballast) y cargado (T_laden).
                        </p>
                    </div>
                </div>
            )
        },

        // ── 2. MAESTROS COMERCIALES ──
        {
            id: 'c4',
            categoryGroup: 'MAESTROS COMERCIALES',
            chapterNum: 4,
            title: 'Maestro de Clientes',
            subtitle: 'Directorio de clientes comerciales, RUC, contactos y condiciones de crédito',
            icon: <Building2 size={16} />,
            badge: 'Maestro Comercial',
            keywords: ['clientes', 'spcc', 'nexa', 'votorantim', 'southern', 'credito'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">4.1 Registro de Clientes Corporativos</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Almacena los datos corporativos de clientes como <strong>Southern Perú Copper Corporation (SPCC)</strong>, <strong>Nexa Resources</strong>, y <strong>Votorantim</strong>, gestionando sus acuerdos marco de crédito y comisiones comerciales.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'c5',
            categoryGroup: 'MAESTROS COMERCIALES',
            chapterNum: 5,
            title: 'Maestro de Contratos',
            subtitle: 'Contratos Marco COA, cláusulas de flete, laytime y démorage',
            icon: <FileText size={16} />,
            badge: 'Maestro Comercial',
            keywords: ['contratos', 'coa', 'laytime', 'demorage', 'flete', 'clausulas'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">5.1 Contratos COA (Contract of Affreightment)</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Define los términos de fletamento a largo plazo: Flete Base (USD/MT), horas de plancha permitidas (Laytime), penalidad por sobrestada (Demurrage) y cláusulas de indexación BAF.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'c6',
            categoryGroup: 'MAESTROS COMERCIALES',
            chapterNum: 6,
            title: 'Maestro de Rutas',
            subtitle: 'Rutas comerciales físicas activas vinculadas a clientes COA',
            icon: <MapPin size={16} />,
            badge: 'Maestro Comercial',
            keywords: ['rutas', 'spot-routes', 'routes_clients', 'spcc', 'nexa'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">6.1 Rutas Comerciales Frecuentes</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Asocia las parejas Origen-Destino asignadas a cada cliente en la base de datos `routes_clients` (ej. <em>SPCC Ilo - Callao</em>, <em>Nexa Cajamarquilla</em>).
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'c7',
            categoryGroup: 'MAESTROS COMERCIALES',
            chapterNum: 7,
            title: 'Maestro de Cotizaciones',
            subtitle: 'Histórico de cotizaciones comerciales Spot y prospectos de flete',
            icon: <Receipt size={16} />,
            badge: 'Maestro Comercial',
            keywords: ['cotizaciones', 'prospectos', 'quotes', 'routes_quotes', 'spot'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">7.1 Histórico de Cotizaciones Spot</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Registra todas las proformas comerciales emitidas a prospectos en `routes_quotes`, permitiendo dar seguimiento a la tasa de conversión comercial.
                        </p>
                    </div>
                </div>
            )
        },

        // ── 3. MAESTROS DE COSTOS ──
        {
            id: 'c8',
            categoryGroup: 'MAESTROS DE COSTOS',
            chapterNum: 8,
            title: 'Maestro de Tarifas Portuarias',
            subtitle: 'Tarifario desagregado por concepto, proveedor y terminal',
            icon: <Coins size={16} />,
            badge: 'Maestro de Costos',
            keywords: ['tarifas', 'practicaje', 'remolcaje', 'lanchas', 'muellaje', 'agencia'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">8.1 Catálogo Oficial de Tarifas Portuarias</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Establece el costo base unitario por ítem (Practicaje, Remolcaje, Lanchas, Muellaje, Amarre/Desamarre, Agente Marítimo), especificando si es regla fija, proporcional al TRB o fórmula P×Q.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'c9',
            categoryGroup: 'MAESTROS DE COSTOS',
            chapterNum: 9,
            title: 'Maestro de Gastos Portuarios',
            subtitle: 'Encuadre MIN (Hábil) vs MAX (OT) vs FIJO DB y metodología QC Regla 6 Overtime (+25%)',
            icon: <Scale size={16} />,
            badge: 'Maestro de Costos',
            keywords: ['gastos portuarios', 'bandas', 'regla 6', 'overtime', 'min', 'max', 'fijo db', 'sandra', 'no hay'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">9.1 Matriz de Bandas Tarifarias Toda la Flota</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            Consolida en el tab <strong>📊 Bandas Tarifarias</strong> la evaluación dinámica de todas las naves contra el costo fijo registrado en la tabla `port_cost_static`:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono mb-4">
                            <div className="bg-green-50 text-green-900 p-3 rounded-lg border border-green-200">
                                <span className="font-bold block mb-1 font-sans">✅ EN BANDA</span>
                                <span className="text-[10px] font-sans">FIJO DB dentro del rango de tolerancia [MIN, MAX].</span>
                            </div>
                            <div className="bg-red-50 text-red-900 p-3 rounded-lg border border-red-200">
                                <span className="font-bold block mb-1 font-sans">❌ SOBRE MAX</span>
                                <span className="text-[10px] font-sans">FIJO DB supera el recargo de Overtime pesimista (+25%).</span>
                            </div>
                            <div className="bg-slate-100 text-slate-700 p-3 rounded-lg border border-slate-300">
                                <span className="font-bold block mb-1 font-sans">NO HAY</span>
                                <span className="text-[10px] font-sans">Sin registro previo en DB para ese buque/puerto (sin fallbacks).</span>
                            </div>
                        </div>

                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">9.2 Regla 6 de Auditoría QC (Overtime +25% trazable P×Q)</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            En escenarios de zarpe pesimista (nocturno/dominical/feriado), el recargo de Overtime (+25%) se aplica individualmente P_base × 1.25 sobre practicaje OUT, remolques OUT, lanchas y agencia, sin usar multiplicadores flat globales.
                        </p>
                    </div>
                </div>
            )
        },

        // ── 4. MERCADO & ORIGINACIÓN ──
        {
            id: 'c10',
            categoryGroup: 'MERCADO & ORIGINACIÓN',
            chapterNum: 10,
            title: 'Maestro de Búnker',
            subtitle: 'Precios de IFO 380 / VLSFO, Diesel MDO y regla de homologación MGO=MDO',
            icon: <Zap size={16} />,
            badge: 'Mercado & Originación',
            keywords: ['bunker', 'mdo', 'mgo', 'ifo380', 'vlsfo', 'homologacion', 'precios'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">10.1 Precios de Combustible &amp; Homologación MDO</h4>
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4 flex items-start gap-3">
                            <Zap size={18} className="text-amber-700 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-900 leading-relaxed">
                                <strong>Regla de Homologación PETRAL:</strong> En todo el software PETRAL, las siglas <strong>MGO</strong> (Marine Gas Oil / Diesel Marino) que figuran en facturas o cotizaciones equivalen y se registran unificadamente bajo el estándar <strong>MDO</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'c11',
            categoryGroup: 'MERCADO & ORIGINACIÓN',
            chapterNum: 11,
            title: 'Maestro de Originación',
            subtitle: 'Fuentes de suministro, destinos de consumo, volúmenes MT y empresas (Sources & Sinks)',
            icon: <Layers size={16} />,
            badge: 'Mercado & Originación',
            keywords: ['originacion', 'sources', 'sinks', 'capacidad', 'empresas', 'productos'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">11.1 Matriz de Originación Carga y Oferta</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Modela la oferta y demanda de carga (Sources &amp; Sinks) en cada puerto por empresa y producto (ej. Ácido Sulfúrico, Diésel, Biodiésel), registrando las capacidades anuales en TM.
                        </p>
                    </div>
                </div>
            )
        }
    ];

    // Agrupación de capítulos por categoría exacta de Datos Maestros
    const categories = ['MAESTROS FÍSICOS', 'MAESTROS COMERCIALES', 'MAESTROS DE COSTOS', 'MERCADO & ORIGINACIÓN'];

    // Filtrado de capítulos por buscador
    const filteredChapters = useMemo(() => {
        if (!searchQuery.trim()) return chapters;
        const q = searchQuery.toLowerCase().trim();
        return chapters.filter(c => 
            c.title.toLowerCase().includes(q) ||
            c.subtitle.toLowerCase().includes(q) ||
            c.categoryGroup.toLowerCase().includes(q) ||
            c.keywords.some(k => k.toLowerCase().includes(q))
        );
    }, [searchQuery, chapters]);

    const currentChapter = chapters.find(c => c.id === activeChapterId) || chapters[0];

    const handlePrintSection = () => {
        window.print();
    };

    return (
        <div className="p-6 space-y-6 max-w-full mx-auto pb-12 print:p-0 print:m-0">

            {/* ── CABECERA EJECUTIVA CON LOGOS CORPORATIVOS & BUSCADOR ── */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:shadow-none print:border-b-2 print:border-slate-800">
                <div className="flex items-center gap-4">
                    <img src={logoPetral} alt="Naviera Petral" className="h-10 object-contain" />
                    <div className="h-8 border-l border-slate-200 hidden md:block"></div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">MANUAL DE DATOS MAESTROS &amp; SISTEMA</h2>
                        <span className="text-xs text-slate-500 font-bold tracking-wider uppercase block">PETRAL SHIPPING.SOFT V2.5 PRO • RELEASE 2026</span>
                    </div>
                </div>

                {/* Buscador inteligente */}
                <div className="flex items-center gap-3 w-full md:w-auto print:hidden">
                    <div className="relative flex-1 md:w-64">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar maestro (ej. Flota, Gastos, Búnker)..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <button 
                        onClick={handlePrintSection}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                        title="Descargar o Imprimir Documento Membretado"
                    >
                        <Download size={15} /> Descargar PDF
                    </button>
                </div>

                <div className="hidden print:block text-right text-[10px] font-mono text-slate-500">
                    <div>Naviera Petral S.A.</div>
                    <div>Fecha: {new Date().toLocaleDateString('es-PE')}</div>
                </div>
            </div>

            {/* ── CONTENEDOR PRINCIPAL ESTILO LIBRO EDITORIAL ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">

                {/* NAVEGACIÓN LATERAL POR CATEGORÍAS EXACTAS DE DATOS MAESTROS */}
                <div className="lg:col-span-4 w-full min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4 print:hidden">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">
                        DATOS MAESTROS ({filteredChapters.length} de 11)
                    </div>

                    {filteredChapters.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 italic">No se encontraron maestros para "{searchQuery}"</div>
                    ) : (
                        <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin">
                            {categories.map(cat => {
                                const catChapters = filteredChapters.filter(c => c.categoryGroup === cat);
                                if (catChapters.length === 0) return null;

                                const catIcon = cat.includes('FÍSICOS') ? '🏗️'
                                              : cat.includes('COMERCIALES') ? '💼'
                                              : cat.includes('COSTOS') ? '💰'
                                              : '⛽';

                                return (
                                    <div key={cat} className="space-y-1">
                                        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1.5">
                                            <span>{catIcon}</span>
                                            <span>{cat}</span>
                                        </div>
                                        <div className="pl-2 flex flex-col gap-1 border-l-2 border-slate-100 ml-1.5">
                                            {catChapters.map(ch => {
                                                const isActive = ch.id === activeChapterId;
                                                return (
                                                    <button
                                                        key={ch.id}
                                                        onClick={() => setActiveChapterId(ch.id)}
                                                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                                            isActive 
                                                                ? 'bg-blue-600 text-white shadow-sm' 
                                                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 truncate min-w-0">
                                                            <span className={isActive ? 'text-white' : 'text-slate-400'}>{ch.icon}</span>
                                                            <span className="truncate">{ch.chapterNum}. {ch.title}</span>
                                                        </div>
                                                        <ChevronRight size={14} className={isActive ? 'text-white' : 'text-slate-300'} />
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

                {/* VISTA DEL MAESTRO SELECCIONADO */}
                <div className="lg:col-span-8 w-full min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6 print:w-full print:p-0 print:border-none">

                    {/* ENCABEZADO DEL MAESTRO */}
                    <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-200 uppercase">
                                {currentChapter.categoryGroup} • {currentChapter.badge}
                            </span>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2">{currentChapter.title}</h3>
                            <p className="text-xs text-slate-500 font-medium">{currentChapter.subtitle}</p>
                        </div>
                    </div>

                    {/* CONTENIDO TÉCNICO DEL MAESTRO */}
                    <div className="min-h-[300px]">
                        {currentChapter.content}
                    </div>

                    {/* PIE DE PÁGINA EDITORIAL OFICIAL */}
                    <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <div>SHIPPING.SOFT v2.5 • NAVIERA PETRAL S.A.</div>
                        <div>Confidencial • Copia Registrada</div>
                        <div>{new Date().toLocaleDateString('es-PE')}</div>
                    </div>

                </div>
            </div>

        </div>
    );
};
