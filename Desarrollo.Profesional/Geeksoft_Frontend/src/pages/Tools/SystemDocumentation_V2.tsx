import React, { useState, useMemo } from 'react';
import { Download, Search, ChevronRight, ChevronDown, Anchor, Compass, Database, Building2, FileText, MapPin, Receipt, Coins, Scale, Zap, Layers, ShoppingCart, BarChart3, LineChart, Map, FileCode } from 'lucide-react';
import logoPetral from '../../assets/Logo.Petral.png';

interface DocChapter {
    id: string;
    sectionType: 'MAESTROS' | 'HERRAMIENTAS';
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

    // Estados de colapso de las dos burbujas principales
    const [isMaestrosOpen, setIsMaestrosOpen] = useState<boolean>(true);
    const [isHerramientasOpen, setIsHerramientasOpen] = useState<boolean>(true);

    const chapters: DocChapter[] = [
        // ─────────────────────────────────────────────────────────────────────────
        // ── 1. BURBUJA DATOS MAESTROS ──
        // ─────────────────────────────────────────────────────────────────────────
        {
            id: 'c1',
            sectionType: 'MAESTROS',
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
            sectionType: 'MAESTROS',
            categoryGroup: 'MAESTROS FÍSICOS',
            chapterNum: 2,
            title: 'Maestro de Puertos y Terminales',
            subtitle: 'Directorio de puertos de Perú y Chile, terminales y parámetro Q de permanencia (P×Q)',
            icon: <Compass size={16} />,
            badge: 'Maestro Físico',
            keywords: ['puertos', 'terminales', 'callao', 'matarani', 'ilo', 'marcona', 'mejillones', 'apm', 'tisur', 'spcc', 'q', 'ritmo', 'permanencia'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">2.1 Parámetros Q de Permanencia &amp; Operatividad P×Q</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            El <strong>Maestro de Puertos y Terminales</strong> registra los parámetros operacionales que determinan la variable <strong>Q (Cantidad)</strong> para el cálculo de costos P×Q en proformas y auditorías:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono mb-4">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1 font-sans">⏱️ Ritmo de Carga/Descarga:</span>
                                <span className="text-[11px] text-slate-600 font-sans">
                                    Determina las horas de operación: Q_op = Toneladas / Ritmo MT/h.
                                </span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1 font-sans">⚓ Horas Fijas de Maniobra:</span>
                                <span className="text-[11px] text-slate-600 font-sans">
                                    Adiciona 4.0 horas fijas por maniobra de atracadero a Q_total.
                                </span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1 font-sans">🚜 Remolcaje Normado:</span>
                                <span className="text-[11px] text-slate-600 font-sans">
                                    Determina la cantidad Q_remolques = 2 IN / 2 OUT obligatorios.
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Callao (APM Terminals)</span>
                                <span className="text-[11px] text-slate-500">Carga: 500 MT/h | Descarga: 350 MT/h.</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Matarani (Tisur S.A.)</span>
                                <span className="text-[11px] text-slate-500">Carga: 500 MT/h | Descarga: 350 MT/h.</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Ilo (SPCC / Enapu)</span>
                                <span className="text-[11px] text-slate-500">Terminal Minero / Enapu para ácido y búnker.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'c3',
            sectionType: 'MAESTROS',
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
        {
            id: 'c4',
            sectionType: 'MAESTROS',
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
            sectionType: 'MAESTROS',
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
            sectionType: 'MAESTROS',
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
            sectionType: 'MAESTROS',
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
        {
            id: 'c8',
            sectionType: 'MAESTROS',
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
            sectionType: 'MAESTROS',
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
        {
            id: 'c10',
            sectionType: 'MAESTROS',
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
            sectionType: 'MAESTROS',
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
        },

        // ─────────────────────────────────────────────────────────────────────────
        // ── 2. BURBUJA HERRAMIENTAS & MOTORES ──
        // ─────────────────────────────────────────────────────────────────────────
        {
            id: 'h1',
            sectionType: 'HERRAMIENTAS',
            categoryGroup: 'HERRAMIENTAS & MOTORES',
            chapterNum: 12,
            title: 'Multicotizador Multirutas',
            subtitle: 'Simulación comercial de itinerarios Spot en tiempo real y optimización de flete',
            icon: <ShoppingCart size={16} />,
            badge: 'Herramienta Comercial',
            keywords: ['multicotizador', 'spot', 'simulacion', 'itinerarios', 'flete'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">12.1 Cotizador Spot en Tiempo Real</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Simula opciones de viaje comparando combinaciones de buques, puertos y cantidades. Calcula automáticamente el flete objetivo TCE Target (USD/día).
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'h2',
            sectionType: 'HERRAMIENTAS',
            categoryGroup: 'HERRAMIENTAS & MOTORES',
            chapterNum: 13,
            title: 'Matriz Financiera (Voyage Ledger P&L)',
            subtitle: 'Consolidación financiera por viaje, NVR y estado de resultados neto',
            icon: <BarChart3 size={16} />,
            badge: 'Herramienta Financiera',
            keywords: ['matriz financiera', 'dashboard', 'pnl', 'ledger', 'nvr', 'utilidad'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">13.1 Estado de Resultados del Viaje (Voyage P&amp;L)</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Consolida los ingresos brutos por flete y deduce ordenadamente: Gastos Portuarios, Combustibles Navegando/Puerto, Comisiones y Gastos Operativos de la Nave.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'h3',
            sectionType: 'HERRAMIENTAS',
            categoryGroup: 'HERRAMIENTAS & MOTORES',
            chapterNum: 14,
            title: 'Análisis Gráfico',
            subtitle: 'Visualización estadística de indicadores navieros y tendencias de mercado',
            icon: <LineChart size={16} />,
            badge: 'Herramienta Analítica',
            keywords: ['analisis grafico', 'tendencias', 'indicadores', 'flete'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">14.1 Inteligencia Visual Naviera</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Gráficas de evolución tarifaria por puerto, comparativa de consumos por buque e historial de fletes pactados por cliente.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'h4',
            sectionType: 'HERRAMIENTAS',
            categoryGroup: 'HERRAMIENTAS & MOTORES',
            chapterNum: 15,
            title: 'Spaghetti Map',
            subtitle: 'Trazado cartográfico de rutas marítimas y densidades de tráfico',
            icon: <Map size={16} />,
            badge: 'Herramienta Geográfica',
            keywords: ['spaghetti map', 'rutas', 'mapas', 'densidad', 'costa oeste'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">15.1 Mapeo Cartográfico de Navegación</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Visualización de líneas de navegación náutica entre puertos mineros e industriales de la Costa Oeste de Sudamérica.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'h5',
            sectionType: 'HERRAMIENTAS',
            categoryGroup: 'HERRAMIENTAS & MOTORES',
            chapterNum: 16,
            title: 'Auditoría Final',
            subtitle: 'Suite de auditoría P×Q y validación de liquidaciones con la Experta Sandra',
            icon: <Scale size={16} />,
            badge: 'Herramienta Auditoría',
            keywords: ['auditoria final', 'audit-final', 'sandra', 'experta', 'proformas'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">16.1 Modulo de Auditoría Final P×Q</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Generación de Actas de Auditoría con recargos OT trazables e integración de firmas PETRAL / Sandra.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'h6',
            sectionType: 'HERRAMIENTAS',
            categoryGroup: 'HERRAMIENTAS & MOTORES',
            chapterNum: 17,
            title: 'Flowchart del Sistema',
            subtitle: 'Diagramas de arquitectura, flujogramas de procesos e interacciones',
            icon: <FileCode size={16} />,
            badge: 'Herramienta Visual',
            keywords: ['flowchart', 'flujograma', 'arquitectura', 'svg', 'pdf'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">17.1 Flujogramas Integrales de Ecosistema</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Visualización descargable en SVG/PDF de los 5 niveles del sistema (Maestros $\rightarrow$ Spot Engine $\rightarrow$ P×Q $\rightarrow$ Ledger $\rightarrow$ Auditoría).
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'h7',
            sectionType: 'HERRAMIENTAS',
            categoryGroup: 'HERRAMIENTAS & MOTORES',
            chapterNum: 18,
            title: 'Documentación del Sistema',
            subtitle: 'Manual interactivo de usuario, arquitectura técnica y reglas de negocio',
            icon: <BookOpenIcon size={16} />,
            badge: 'Herramienta Documental',
            keywords: ['documentacion', 'manual', 'ayuda', 'reglas'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">18.1 Portal Integrado de Documentación</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Módulo interactivo que consolida la totalidad de maestros, herramientas y motores del sistema PETRAL SHIPPING.SOFT V2.5.
                        </p>
                    </div>
                </div>
            )
        }
    ];

    const categoriesMaestros = ['MAESTROS FÍSICOS', 'MAESTROS COMERCIALES', 'MAESTROS DE COSTOS', 'MERCADO & ORIGINACIÓN'];

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
        <div className="p-6 space-y-6 w-full max-w-[1400px] mx-auto pb-12 print:p-0 print:m-0">

            {/* ── CABECERA EJECUTIVA CON LOGOS CORPORATIVOS & BUSCADOR ── */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 w-full print:shadow-none print:border-b-2 print:border-slate-800">
                <div className="flex items-center gap-4">
                    <img src={logoPetral} alt="Naviera Petral" className="h-10 object-contain" />
                    <div className="h-8 border-l border-slate-200 hidden md:block"></div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">MANUAL INTEGRAL DEL SISTEMA</h2>
                        <span className="text-xs text-slate-500 font-bold tracking-wider uppercase block">PETRAL SHIPPING.SOFT V2.5 PRO • DATOS MAESTROS &amp; HERRAMIENTAS</span>
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
                            placeholder="Buscar maestro o herramienta..."
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

            {/* ── CONTENEDOR PRINCIPAL ESTILO LIBRO EDITORIAL (LAYOUT CONGELADO A NIVEL PIXEL) ── */}
            <div className="flex flex-col lg:flex-row gap-6 items-start w-full min-w-0">

                {/* NAVEGACIÓN LATERAL: 2 BURBUJAS COLAPSABLES (320px CONGELADOS EXACTOS) */}
                <div className="w-full lg:w-[320px] lg:min-w-[320px] lg:max-w-[320px] shrink-0 space-y-4 print:hidden">

                    {/* ── BURBUJA 1: DATOS MAESTROS (COLAPSABLE) ── */}
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
                            <div className="p-3 space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin w-full">
                                {categoriesMaestros.map(cat => {
                                    const catChapters = filteredChapters.filter(c => c.sectionType === 'MAESTROS' && c.categoryGroup === cat);
                                    if (catChapters.length === 0) return null;

                                    const catIcon = cat.includes('FÍSICOS') ? '🏗️'
                                                  : cat.includes('COMERCIALES') ? '💼'
                                                  : cat.includes('COSTOS') ? '💰'
                                                  : '⛽';

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
                                                                <span className={isActive ? 'text-white' : 'text-slate-400'}>{ch.icon}</span>
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

                    {/* ── BURBUJA 2: HERRAMIENTAS & MOTORES (COLAPSABLE) ── */}
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
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">7 Módulos</span>
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
                                                <span className={isActive ? 'text-white' : 'text-slate-400'}>{ch.icon}</span>
                                                <span className="truncate">{ch.chapterNum}. {ch.title}</span>
                                            </div>
                                            <ChevronRight size={14} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>

                {/* VISTA DEL MÓDULO SELECCIONADO (100% ESPACIO RESTANTE SIEMPRE EN CUALQUIER MAESTRO) */}
                <div className="flex-1 min-w-0 w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6 print:w-full print:p-0 print:border-none">

                    {/* ENCABEZADO DEL MÓDULO */}
                    <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-200 uppercase">
                                {currentChapter.categoryGroup} • {currentChapter.badge}
                            </span>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2">{currentChapter.title}</h3>
                            <p className="text-xs text-slate-500 font-medium">{currentChapter.subtitle}</p>
                        </div>
                    </div>

                    {/* CONTENIDO TÉCNICO DEL MÓDULO */}
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

// Helper icon component
const BookOpenIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
);
