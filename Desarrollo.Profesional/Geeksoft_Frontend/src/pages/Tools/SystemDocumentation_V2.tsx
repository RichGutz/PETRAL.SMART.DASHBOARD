import React, { useState, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { Download, Search, ChevronRight, Layers, Anchor, Compass, Database, Zap, Scale, ShoppingCart, BarChart3, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import logoPetral from '../../assets/Logo.Petral.png';
import logoGeeksoft from '../../assets/Logo.Geeksoft.png';

interface DocChapter {
    id: string;
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
        {
            id: 'c1',
            chapterNum: 1,
            title: 'Visión General & Arquitectura',
            subtitle: 'Estructura modular en 5 niveles para la inteligencia comercial naviera',
            icon: <Layers size={18} />,
            badge: 'Capítulo 1',
            keywords: ['vision', 'arquitectura', '5 niveles', 'objetivo', 'fastapi', 'react', 'supabase'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">1.1 Objetivo de la Plataforma</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            <strong>PETRAL SHIPPING.SOFT V2.5</strong> es una solución tecnológica integral concebida para la gestión naviera de buques tanque (ej. <em>B/T Moquegua</em>, <em>B/T Tablones</em>, <em>Concon Trader</em>, <em>Huemul</em>). Permite simular, cotizar, ejecutar y auditar el margen de operación neto ($P\&L$) de cada viaje de transporte marítimo de hidrocarburos y carga líquida o a granel.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">1.2 Estructura Modular en 5 Niveles</h4>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-mono text-xs">
                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200 flex flex-col justify-between">
                                <span className="font-bold text-blue-900">Nivel 1</span>
                                <span className="text-[10px] text-blue-700 mt-1 font-sans">Datos Maestros Básicos (Flota, Puertos, Rutas)</span>
                            </div>
                            <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-200 flex flex-col justify-between">
                                <span className="font-bold text-indigo-900">Nivel 2</span>
                                <span className="text-[10px] text-indigo-700 mt-1 font-sans">Motor BAF Polinómico &amp; Tarifación P×Q</span>
                            </div>
                            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200 flex flex-col justify-between">
                                <span className="font-bold text-amber-900">Nivel 3</span>
                                <span className="text-[10px] text-amber-700 mt-1 font-sans">Cotizador Multirutas Spot en Tiempo Real</span>
                            </div>
                            <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200 flex flex-col justify-between">
                                <span className="font-bold text-emerald-900">Nivel 4</span>
                                <span className="text-[10px] text-emerald-700 mt-1 font-sans">Matriz Financiera &amp; Voyage Ledger P&amp;L</span>
                            </div>
                            <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-200 flex flex-col justify-between">
                                <span className="font-bold text-purple-900">Nivel 5</span>
                                <span className="text-[10px] text-purple-700 mt-1 font-sans">Suite Auditoría &amp; Resumen de Bandas</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'c2',
            chapterNum: 2,
            title: 'Maestro de Flota & Embarcaciones',
            subtitle: 'Parámetros constructivos, capacidades DWT y matriz de consumos',
            icon: <Anchor size={18} />,
            badge: 'Capítulo 2',
            keywords: ['flota', 'buques', 'dwt', 'grt', 'loa', 'moquegua', 'tablones', 'huemul', 'concon'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">2.1 Especificaciones Técnicas Registradas</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            El Maestro de Flota administra los parámetros físicos y operativos de las naves propias y fletadas. Cada buque tanque registra sus curvas de velocidad y consumo de combustible para calcular automáticamente la autonomía y los costos de navegación.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1 font-sans">🚢 Capacidades &amp; Calados:</span>
                                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                    <li>DWT (Deadweight Tonnage): Tonelaje de peso muerto.</li>
                                    <li>Draft Summer / Tropical: Calado máximo permitido en metros.</li>
                                    <li>Capacidad Cúbica al 98% (m³ / Barriaje).</li>
                                </ul>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1 font-sans">⛽ Consumos de Búnker (MT/día):</span>
                                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                    <li>Navegación Laden / Ballast (IFO 380 VLSFO &amp; MDO).</li>
                                    <li>Puerto Operando Carga/Descarga (Calderas / Auxiliares).</li>
                                    <li>Puerto Inactivo / Espera (Idle Status).</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'c3',
            chapterNum: 3,
            title: 'Maestro de Puertos & Tarifación P×Q',
            subtitle: 'Directorio tarifario, agencias y ecuaciones de permanencia',
            icon: <Compass size={18} />,
            badge: 'Capítulo 3',
            keywords: ['puertos', 'callao', 'matarani', 'ilo', 'marcona', 'mejillones', 'apm', 'tisur', 'spcc'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">3.1 Estructura del Maestro Portuario</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            Administra las tarifas base por puerto, terminal y operador marítimo. Modela rubros fijos y variables:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Practicaje &amp; Amarradores</span>
                                <span className="text-[11px] text-slate-500">Tarifas por maniobra de atraque/desatraque según TRB.</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Remolcaje Portuario</span>
                                <span className="text-[11px] text-slate-500">Uso de remolcadores en entrada y salida (IN / OUT).</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Derechos de Muelle &amp; Uso</span>
                                <span className="text-[11px] text-slate-500">Cobro por hora o por tonelada métrica movilizada.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'c4',
            chapterNum: 4,
            title: 'Maestro de Distancias & Rutas',
            subtitle: 'Matriz de navegación náutica en millas y tiempo de mar',
            icon: <Database size={18} />,
            badge: 'Capítulo 4',
            keywords: ['distancias', 'rutas', 'millas', 'navegacion', 'lastre', 'cargado'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">4.1 Matriz Distancial Náutica</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Almacena las distancias oficiales en Millas Náuticas ($NM$) entre los puertos de originación y destino en la Costa Oeste de Sudamérica (Perú y Chile), permitiendo calcular los días exactos de navegación en lastre ($T_{ballast}$) y cargado ($T_{laden}$).
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'c5',
            chapterNum: 5,
            title: 'Maestro de Clientes & Contratos COA',
            subtitle: 'Términos comerciales, cláusulas de flete y acuerdos marco',
            icon: <ShoppingCart size={18} />,
            badge: 'Capítulo 5',
            keywords: ['clientes', 'coa', 'spcc', 'nexa', 'votorantim', 'contratos'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">5.1 Gestión de Clientes &amp; Contratos de Fletamento</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            Registra las condiciones pactadas con clientes estratégicos como **Southern Perú (SPCC)** y **Nexa Resources**:
                        </p>
                        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                            <li>Flete Base pactado ($USD/MT$).</li>
                            <li>Tasa de Carga / Descarga acordada ($MT/día$).</li>
                            <li>Cláusulas de Overtime y Pass-Through refacturables al 100%.</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'c6',
            chapterNum: 6,
            title: 'Maestro de Búnker & Indexación BAF',
            subtitle: 'Fórmulas polinómicas y homologación MDO/MGO',
            icon: <Zap size={18} />,
            badge: 'Capítulo 6',
            keywords: ['bunker', 'baf', 'mdo', 'mgo', 'vlsfo', 'ifo380', 'polinomico', 'homologacion'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">6.1 Combustibles Marítimos &amp; Homologación MDO</h4>
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4 flex items-start gap-3">
                            <Info size={18} className="text-amber-700 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-900 leading-relaxed">
                                <strong>Regla de Homologación PETRAL:</strong> En todo el software PETRAL, las siglas <strong>MGO</strong> (Marine Gas Oil / Diesel Marino) que figuran en facturas o cotizaciones equivalen y se registran unificadamente bajo el estándar <strong>MDO</strong>.
                            </p>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            El motor de Búnker calcula el gasto dinámico de combustible indexado al precio de mercado de IFO 380 / VLSFO y Diesel MDO, aplicando la fórmula BAF polinómica acordada en cada contrato COA.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'c7',
            chapterNum: 7,
            title: 'Multicotizador Spot & Algoritmo P×Q',
            subtitle: 'Simulación de viajes en tiempo real y optimización de flete',
            icon: <BarChart3 size={18} />,
            badge: 'Capítulo 7',
            keywords: ['spot', 'multicotizador', 'router', 'simulacion', 'flete', 'pxq'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">7.1 Motor de Cotización Comercial</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Evalúa múltiples combinaciones de rutas, buques y volúmenes de carga. Computa el costo total del viaje ($Total\ Voyage\ Cost$), calculando el flete mínimo requerido ($TCE\ Target$) para garantizar el margen de utilidad esperado por la naviera.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'c8',
            chapterNum: 8,
            title: 'Voyage Ledger & Estado de Resultados P&L',
            subtitle: 'Consolidación financiera por viaje y análisis de margen',
            icon: <Scale size={18} />,
            badge: 'Capítulo 8',
            keywords: ['voyage ledger', 'pnl', 'margen', 'estado de resultados', 'utilidad'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">8.1 Matriz Financiera por Viaje</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Consolida los ingresos brutos por flete y deduce ordenadamente: Gastos Portuarios (Port Costs), Combustible Navegando/Puerto (Bunker Cost), Comisiones de Agencia, y Gastos Operativos de la Nave, entregando el **Net Voyage Revenue (NVR)** y el resultado final en USD.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'c9',
            chapterNum: 9,
            title: 'Auditoría QC & Regla 6 Overtime (+25%)',
            subtitle: 'Metodología de auditoría P×Q y recargos por zarpe dominical/feriado',
            icon: <CheckCircle2 size={18} />,
            badge: 'Capítulo 9',
            keywords: ['qc', 'regla 6', 'overtime', 'recargos', 'casino', 'practicaje', 'remolcaje', 'sandra'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">9.1 Regla 6 de Auditoría QC (Overtime & Recargos)</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            En las evaluaciones pesimistas (Escenario MAX), el motor aplica recargos de Overtime (+25% a +50%) mediante cálculo trazable $P \times Q$ ítem a ítem sobre los rubros elegibles:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Ítems Sujetos a Overtime (+25%):</span>
                                <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                                    <li>Practicaje OUT (Zarpe Nocturno/Dominical)</li>
                                    <li>Remolcaje OUT (Zarpe Nocturno)</li>
                                    <li>Lanchas OUT (Atención fuera de horario)</li>
                                    <li>Coordinador / Agente de Naves (Turnos extra)</li>
                                </ul>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Verificación Trazable P×Q:</span>
                                <p className="text-slate-600 text-[11px] leading-relaxed">
                                    No se aplican multiplicadores flat globales sobre la proforma. Cada ítem calcula su precio base $P_{base} \times 1.25$ individualmente, garantizando auditoría 100% auditable por la Experta Sandra.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'c10',
            chapterNum: 10,
            title: 'Resumen de Bandas Tarifarias & Actas PDF',
            subtitle: 'Encuadre MIN (Hábil) vs MAX (OT) vs FIJO DB para toda la flota',
            icon: <Scale size={18} />,
            badge: 'Capítulo 10',
            keywords: ['bandas', 'min', 'max', 'fijo db', 'acta pdf', 'sandra', 'experta', 'firmas', 'no hay'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">10.1 Matriz Comparativa de Bandas Tarifarias</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            El tab <strong>📊 Bandas Tarifarias</strong> en el módulo de Costos Portuarios consolida en una sola mirada el encuadre de costos para todos los buques de la flota y puertos activos:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono mb-4">
                            <div className="bg-green-50 text-green-900 p-3 rounded-lg border border-green-200">
                                <span className="font-bold block mb-1 font-sans">✅ EN BANDA</span>
                                <span className="text-[10px] font-sans">El costo FIJO registrado en DB se encuentra dentro del rango de tolerancia [MIN, MAX].</span>
                            </div>
                            <div className="bg-red-50 text-red-900 p-3 rounded-lg border border-red-200">
                                <span className="font-bold block mb-1 font-sans">❌ SOBRE MAX</span>
                                <span className="text-[10px] font-sans">El FIJO en DB supera el escenario pesimista de Overtime (requiere revisión de tarifa).</span>
                            </div>
                            <div className="bg-slate-100 text-slate-700 p-3 rounded-lg border border-slate-300">
                                <span className="font-bold block mb-1 font-sans">NO HAY</span>
                                <span className="text-[10px] font-sans">Indica la ausencia de tarifa estática en DB para esa combinación sin usar fallbacks.</span>
                            </div>
                        </div>

                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">10.2 Formato de Actas Oficiales de Auditoría A4</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Tanto las auditorías de puerto como la Matriz de Bandas exportan documentos impresos membretados en formato **Acta Oficial**, incluyendo las firmas en dos columnas (Auditoría PETRAL y V°B° Experta Sandra) y un cuadro de observaciones flex que aprovecha toda la altura disponible del papel A4.
                        </p>
                    </div>
                </div>
            )
        }
    ];

    // Filtrado de capítulos por buscador
    const filteredChapters = useMemo(() => {
        if (!searchQuery.trim()) return chapters;
        const q = searchQuery.toLowerCase().trim();
        return chapters.filter(c => 
            c.title.toLowerCase().includes(q) ||
            c.subtitle.toLowerCase().includes(q) ||
            c.badge.toLowerCase().includes(q) ||
            c.keywords.some(k => k.toLowerCase().includes(q))
        );
    }, [searchQuery, chapters]);

    const currentChapter = chapters.find(c => c.id === activeChapterId) || chapters[0];

    const handlePrintSection = () => {
        window.print();
    };

    return (
        <MasterTemplate
            title="Documentación del Sistema"
            subtitle="Manual Oficial de Usuario & Arquitectura Técnica — PETRAL SHIPPING.SOFT V2.5"
            activeTab="system-documentation"
        >
            <div className="space-y-6 max-w-full mx-auto pb-12 print:p-0 print:m-0">

                {/* ── CABECERA EJECUTIVA CON LOGOS CORPORATIVOS & BUSCADOR ── */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:shadow-none print:border-b-2 print:border-slate-800">
                    <div className="flex items-center gap-4">
                        <img src={logoPetral} alt="Naviera Petral" className="h-10 object-contain" />
                        <div className="h-8 border-l border-slate-200 hidden md:block"></div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">MANUAL DE ARQUITECTURA &amp; USUARIO</h2>
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
                                placeholder="Buscar (ej. Overtime, APM, MDO, BAF)..."
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* NAVEGACIÓN LATERAL DE CAPÍTULOS */}
                    <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2 print:hidden">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
                            <span>Tabla de Contenidos</span>
                            <span>{filteredChapters.length} de {chapters.length} Capítulos</span>
                        </div>

                        {filteredChapters.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 italic">No se encontraron capítulos para "{searchQuery}"</div>
                        ) : (
                            <nav className="flex flex-col gap-1 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                                {filteredChapters.map(ch => {
                                    const isActive = ch.id === activeChapterId;
                                    return (
                                        <button
                                            key={ch.id}
                                            onClick={() => setActiveChapterId(ch.id)}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                                isActive 
                                                    ? 'bg-blue-600 text-white shadow-sm' 
                                                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className={isActive ? 'text-white' : 'text-slate-400'}>{ch.icon}</span>
                                                <span>{ch.chapterNum}. {ch.title}</span>
                                            </div>
                                            <ChevronRight size={14} className={isActive ? 'text-white' : 'text-slate-300'} />
                                        </button>
                                    );
                                })}
                            </nav>
                        )}
                    </div>

                    {/* VISTA DEL CAPÍTULO EDITORIAL */}
                    <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6 print:w-full print:p-0 print:border-none">

                        {/* ENCABEZADO DEL CAPÍTULO */}
                        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-200 uppercase">
                                    {currentChapter.badge}
                                </span>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2">{currentChapter.title}</h3>
                                <p className="text-xs text-slate-500 font-medium">{currentChapter.subtitle}</p>
                            </div>
                        </div>

                        {/* CONTENIDO TÉCNICO DEL CAPÍTULO */}
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
        </MasterTemplate>
    );
};
