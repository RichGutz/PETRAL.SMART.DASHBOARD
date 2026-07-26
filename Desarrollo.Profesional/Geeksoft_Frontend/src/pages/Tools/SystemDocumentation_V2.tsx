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
            subtitle: 'Directorio portuario, tiempos de permanencia Q y matriz de conceptos P×Q (Callao & Puertos PE/CL)',
            icon: <Compass size={16} />,
            badge: 'Maestro Físico',
            keywords: ['puertos', 'terminales', 'callao', 'matarani', 'ilo', 'marcona', 'mejillones', 'apm', 'tisur', 'spcc', 'q', 'ritmo', 'permanencia', 'practicaje', 'remolcaje', 'muellaje'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">2.1 Parámetros Q de Permanencia Operativa (Fórmula P×Q)</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            El <strong>Maestro de Puertos y Terminales</strong> registra las tasas de transferencia y los tiempos suplementarios que determinan la variable <strong>Q (Cantidad)</strong> del cálculo P×Q:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono mb-4">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1 font-sans">⏱️ Q_operación (Horas Muelle):</span>
                                <span className="text-[11px] text-slate-600 font-sans">
                                    Tiempo de transferencia neta: Q_op = Toneladas MT / Ritmo MT/h.
                                </span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1 font-sans">⚓ 4.0h Fijas Suplementarias:</span>
                                <span className="text-[11px] text-slate-600 font-sans">
                                    2h amarre/desamarre + 2h conexiado/desconexiado de mangueras e inspección.
                                </span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1 font-sans">🚜 Q_remolcaje Normado:</span>
                                <span className="text-[11px] text-slate-600 font-sans">
                                    Maniobra obligatoria de 2 Remolques IN + 2 Remolques OUT por escala.
                                </span>
                            </div>
                        </div>

                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">2.2 Matriz de Conceptos P×Q Evaluados en Puerto del Callao (APM / Multiboyas)</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            Para una proforma u operación en el Puerto del Callao, el motor evalúa en detalle los siguientes rubros oficiales:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-4">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Rubros Físicos &amp; Maniobras:</span>
                                <ul className="list-disc pl-4 text-slate-600 space-y-1">
                                    <li><strong>Practicaje Entrante/Saliente:</strong> Evaluado por TRB del buque (Q_TRB).</li>
                                    <li><strong>Remolcaje Portuario (IN/OUT):</strong> 2 remolques entrada + 2 salida según potencia (HP/TRB).</li>
                                    <li><strong>Lanchas de Practicante &amp; Autoridades:</strong> Servicios de transporte a fondeadero.</li>
                                    <li><strong>Amarre y Desamarre de Cabos:</strong> Cuadrilla de amarradores de puerto.</li>
                                </ul>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Uso de Infraestructura &amp; Regulaciones:</span>
                                <ul className="list-disc pl-4 text-slate-600 space-y-1">
                                    <li><strong>Uso de Amarradero / Muellaje Nave:</strong> Tarifado por LOA y horas permanencia Q_total.</li>
                                    <li><strong>Uso de Muelle a la Carga:</strong> Tarifa por tonelada métrica embarcada/desembarcada (Q_MT).</li>
                                    <li><strong>Derechos Regulatorios:</strong> APN (Autoridad Portuaria), DICAPI y Sanidad Marítima.</li>
                                    <li><strong>Overtime (+25%):</strong> Zarpes nocturnos/dominicales en practicaje y remolques OUT.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block mb-1">Callao (APM / Multiboyas)</span>
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
            keywords: ['clientes', 'spcc', 'nexa', 'southern', 'credito'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">4.1 Registro de Clientes Corporativos Activos</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Almacena los datos corporativos de los 2 clientes comerciales activos de Naviera Petral: <strong>Southern Perú Copper Corporation (SPCC)</strong> y <strong>Nexa Resources Peru S.A.A. (NEXA)</strong>, gestionando sus contratos marco COA de flete, condiciones de crédito y comisiones comerciales.
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
            title: 'Maestro de Gastos Portuarios (Los 3 Tabs Operativos)',
            subtitle: 'Modelo Estático, Modelo Matriz Compleja y Tablero de Bandas Tarifarias (Toda la Flota)',
            icon: <Scale size={16} />,
            badge: 'Maestro de Costos',
            keywords: ['gastos portuarios', 'bandas', 'regla 6', 'overtime', 'min', 'max', 'fijo db', 'sandra', 'no hay', 'modelo estatico', 'matriz compleja'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">9.1 Los 3 Tabs del Maestro de Gastos Portuarios</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            El <strong>Maestro de Gastos Portuarios</strong> estructura la evaluación de proformas mediante 3 pestañas especializadas de análisis y configuración:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-6">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mb-1">TAB 1</span>
                                    <h5 className="font-bold text-slate-900 text-sm">📄 Modelo Estático</h5>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                        Matriz de costos estáticos fijos ($USD) por puerto y buque, desagregada por rubros de faena:
                                    </p>
                                    <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-0.5 mt-2 font-mono">
                                        <li>Costo Principal (MAIN)</li>
                                        <li>Loading Master (LM)</li>
                                        <li>Otros Gastos / Tasas</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block mb-1">TAB 2</span>
                                    <h5 className="font-bold text-slate-900 text-sm">🧩 Matriz Compleja</h5>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                        Estructura tarifaria dinámica avanzada con reglas $P \times Q$ desagregadas por proveedor:
                                    </p>
                                    <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-0.5 mt-2 font-mono">
                                        <li>Practicaje Entrante/Saliente</li>
                                        <li>Remolcaje por TRB / HP</li>
                                        <li>Muellaje Nave / Carga</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1">TAB 3</span>
                                    <h5 className="font-bold text-slate-900 text-sm">📊 Bandas Tarifarias</h5>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                        Auditoría en tiempo real de toda la flota verificando tolerancia MIN (hábil) vs MAX (OT +25%):
                                    </p>
                                    <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-0.5 mt-2 font-mono">
                                        <li>✅ EN BANDA</li>
                                        <li>❌ SOBRE MAX</li>
                                        <li>NO HAY (sin datos)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">9.2 Regla 6 de Auditoría QC (Overtime +25% trazable P×Q)</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            En escenarios de zarpe pesimista (nocturno, dominical o feriado), la Regla 6 aplica el recargo de Overtime (+25%) directamente P_base × 1.25 sobre practicaje OUT, remolques OUT, lanchas y agencia marítima, permitiendo conciliar cada factura contra el tarifario oficial del puerto.
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
        // ── 2. BURBUJA HERRAMIENTAS & MOTORES (EXPLICACIÓN BOTÓN POR BOTÓN) ──
        // ─────────────────────────────────────────────────────────────────────────
        {
            id: 'h1',
            sectionType: 'HERRAMIENTAS',
            categoryGroup: 'HERRAMIENTAS & MOTORES',
            chapterNum: 12,
            title: 'Multicotizador Multirutas',
            subtitle: 'Simulación comercial Spot en tiempo real, cálculo TCE y guía de botones UI',
            icon: <ShoppingCart size={16} />,
            badge: 'Herramienta Comercial',
            keywords: ['multicotizador', 'spot', 'simulacion', 'itinerarios', 'flete', 'botones', 'ui'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">12.1 Flujo Operativo del Multicotizador Spot</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            El <strong>Multicotizador Multirutas</strong> permite simular alternativas de viaje combinando buques de la flota, puertos de origen y destino, toneladas de carga y velocidad operativa.
                        </p>

                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">12.2 Guía de Botones e Interfaz de Usuario (UI)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-blue-700 flex items-center gap-1.5">
                                    <span>⚡</span> Botón "Simular Itinerario / Calcular Flete"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Ejecuta el motor de viajes calculando días navegando (días en lastre más cargado), días en muelle (horas operativas más 4.0 horas fijas), consumo total de búnker (IFO/MDO) y costos portuarios para obtener el Flete de Equilibrio y el TCE Target (USD por día).
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-purple-700 flex items-center gap-1.5">
                                    <span>🎛️</span> Selector "Modo de Gastos Portuarios"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Permite alternar entre el <strong>Modelo Estático</strong> (costos estáticos fijos DB), <strong>Matriz Compleja P×Q</strong> (cálculo dinámico con Overtime) y <strong>Bandas Tarifarias</strong>.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                                    <span>💾</span> Botón "Guardar Cotización Spot"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Almacena la simulación activa en la base de datos `routes_quotes`, asignando un número de proforma comercial para seguimiento del área de fletamento.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>📄</span> Botón "Exportar PDF / Excel"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Genera el documento membretado oficial de cotización comercial con el desglose de flete por TM, demurrage y condiciones laytime para enviar al cliente.
                                </p>
                            </div>
                        </div>
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
            subtitle: 'Consolidación financiera por viaje NVR, cierre de estado de resultados y guía de botones UI',
            icon: <BarChart3 size={16} />,
            badge: 'Herramienta Financiera',
            keywords: ['matriz financiera', 'dashboard', 'pnl', 'ledger', 'nvr', 'utilidad', 'botones', 'ui'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">13.1 Libro Contable de Viaje (Voyage Ledger P&amp;L)</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            La <strong>Matriz Financiera</strong> consolida los ingresos brutos por flete y deduce ordenadamente todos los desembolsos de la nave para obtener la Utilidad Neta Real por viaje (NVR).
                        </p>

                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">13.2 Guía de Botones e Interfaz de Usuario (UI)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-blue-700 flex items-center gap-1.5">
                                    <span>➕</span> Botón "Nuevo Asiento de Viaje (NVR)"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Abre la ventana para crear un nuevo viaje operativo, asociando el buque, la ruta contratada, el volumen cargado en MT y la tarifa de flete pactada.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                                    <span>🔒</span> Botón "Cerrar Viaje / Conciliar Ledger"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Bloquea la edición del viaje y compara los costos estimados de búnker y agenciamiento frente a las facturas reales liquidadas para determinar la Utilidad Neta final.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-purple-700 flex items-center gap-1.5">
                                    <span>🔍</span> Botón "Ver Desglose de Gastos PxQ"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Despliega la auditoría detallada ítem por ítem del viaje: practicaje, remolcaje, consumo de combustible en lastre vs cargado, y comisiones comerciales.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>📊</span> Botón "Exportar Libro Financiero (Excel)"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Descarga el estado de resultados consolidado de la flota en formato Excel formateado para la gerencia financiera.
                                </p>
                            </div>
                        </div>
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
            subtitle: 'Visualización estadística de indicadores navieros y guía de botones UI',
            icon: <LineChart size={16} />,
            badge: 'Herramienta Analítica',
            keywords: ['analisis grafico', 'tendencias', 'indicadores', 'flete', 'botones', 'ui'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">14.1 Inteligencia Visual Naviera</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            Permite evaluar visualmente el comportamiento histórico de las tarifas portuarias, el rendimiento de consumo de combustibles por nave y la evolución del rendimiento diario TCE.
                        </p>

                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">14.2 Guía de Botones e Interfaz de Usuario (UI)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-blue-700 flex items-center gap-1.5">
                                    <span>📅</span> Selector "Horizonte Temporal"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Filtra la serie de datos para mostrar tendencias a nivel Mensual, Trimestral o Anual.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-purple-700 flex items-center gap-1.5">
                                    <span>📊</span> Selector de Métrica (TCE / Búnker / Tarifas)
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Cambia el indicador evaluado en las gráficas entre Rendimiento Diario (USD/día), Consumo MDO/IFO y Desembolsos Portuarios por Escala.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                                    <span>📈</span> Botón "Alternar Tipo de Gráfico"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Modifica la visualización entre diagramas de Barras Comparativas, Líneas de Tendencia Continua o Gráficos de Área Acumulada.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>📷</span> Botón "Exportar Gráfica (PNG / SVG)"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Descarga la imagen vectorial o de alta resolución para incluirla en los reportes de directorio.
                                </p>
                            </div>
                        </div>
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
            subtitle: 'Trazado cartográfico de rutas marítimas y guía de botones UI',
            icon: <Map size={16} />,
            badge: 'Herramienta Geográfica',
            keywords: ['spaghetti map', 'rutas', 'mapas', 'densidad', 'costa oeste', 'botones', 'ui'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">15.1 Mapeo Cartográfico de Navegación Náutica</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            Visualización en mapa geográfico interactivo de las líneas de navegación entre los puertos mineros e industriales de Perú y Chile.
                        </p>

                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">15.2 Guía de Botones e Interfaz de Usuario (UI)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-blue-700 flex items-center gap-1.5">
                                    <span>🏢</span> Botón "Filtro de Rutas por Cliente (SPCC / NEXA)"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Muestra u oculta los trazos de navegación asociados a las cargas exclusivas de SPCC o Nexa Resources.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-purple-700 flex items-center gap-1.5">
                                    <span>🗺️</span> Conmutador de Capas (Satélite vs Marítimo OSM)
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Alterna la representación cartográfica entre mapa satelital de alta resolución y capa hidrográfica náutica OpenStreetMap.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                                    <span>📏</span> Herramienta "Medir Distancia Náutica (NM)"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Permite hacer clic sobre el mapa para trazar waypoints náuticos y calcular la distancia total en Millas Náuticas.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>🎯</span> Botón "Recentrar Costa Oeste"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Restablece el enfoque y nivel de zoom para centrar el área de operaciones Callao-Matarani-Ilo-Mejillones.
                                </p>
                            </div>
                        </div>
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
            subtitle: 'Generador de Actas de Auditoría P×Q, firmas PETRAL / Sandra y guía de botones UI',
            icon: <Scale size={16} />,
            badge: 'Herramienta Auditoría',
            keywords: ['auditoria final', 'audit-final', 'sandra', 'experta', 'proformas', 'acta', 'pdf', 'botones', 'ui'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">16.1 Módulo de Actas y Liquidaciones de Auditoría</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            La **Auditoría Final** es la herramienta oficial para contrastar las proformas portuarias liquidadas contra los tarifarios normados de cada puerto, generando el acta membretada oficial firmada por PETRAL y la Experta Sandra.
                        </p>

                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">16.2 Guía de Botones e Interfaz de Usuario (UI)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-blue-700 flex items-center gap-1.5">
                                    <span>⚓</span> Selector "Seleccionar Buque &amp; Puerto"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Carga la liquidación oficial de la nave (ej. <em>B/T Moquegua en Callao</em>) trayendo todos los rubros de practicaje, remolcaje, lanchas y agenciamiento.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-red-700 flex items-center gap-1.5">
                                    <span>⚡</span> Interruptor "Regla 6 Overtime (+25%)"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Activa o desactiva la aplicación del recargo de Overtime en practicaje y remolques de salida para zarpes fuera de horario hábil.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                                    <span>📑</span> Botón "Generar Acta de Auditoría (A4 Flex)"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Construye el documento PDF A4 de 2 buques por hoja con firmas en 2 columnas (PETRAL vs V°B° Experta Sandra) y caja `.obs-box` flex-fill hasta el pie de página.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>✅</span> Botón "Aprobar Liquidación / Sellar V°B°"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Asigna el estado de "AUDITADO OK" a la proforma en la base de datos y congela los montos para el cierre contable del Voyage Ledger.
                                </p>
                            </div>
                        </div>
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
            subtitle: 'Diagramas de arquitectura, flujogramas de procesos e interacciones Nivel 1 a 5 y guía de botones UI',
            icon: <FileCode size={16} />,
            badge: 'Herramienta Visual',
            keywords: ['flowchart', 'flujograma', 'arquitectura', 'svg', 'pdf', 'botones', 'ui'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">17.1 Flujogramas Integrales de la Arquitectura</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            El <strong>Flowchart del Sistema</strong> contiene la representación gráfica vectorial de los 5 niveles de procesamiento (Maestros &rarr; Spot Engine &rarr; P×Q &rarr; Ledger &rarr; Auditoría).
                        </p>

                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">17.2 Guía de Botones e Interfaz de Usuario (UI)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-blue-700 flex items-center gap-1.5">
                                    <span>🔀</span> Selector "Nivel de Diagrama (Nivel 1 a 5)"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Navega entre las distintas capas: Nivel 1 (Ingreso Maestros), Nivel 2 (Spot), Nivel 3 (P×Q), Nivel 4 (Ledger) y Nivel 5 (Auditoría Final).
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-purple-700 flex items-center gap-1.5">
                                    <span>📥</span> Botón "Descargar Flowchart (SVG / PDF)"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Exporta el diagrama en formato vectorial SVG o PDF de alta calidad para anexos de manuales operacionales.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                                    <span>🔍</span> Botón "Zoom Interactivo / Pantalla Completa"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Amplía el lienzo del flujograma permitiendo realizar pan y zoom dinámico para revisar cada nodo del sistema.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>🔄</span> Botón "Restablecer Vista"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Vuelve a la escala original 100% del diagrama de flujo.
                                </p>
                            </div>
                        </div>
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
            subtitle: 'Manual interactivo de usuario, arquitectura técnica, buscador inteligente y guía de botones UI',
            icon: <BookOpenIcon size={16} />,
            badge: 'Herramienta Documental',
            keywords: ['documentacion', 'manual', 'ayuda', 'reglas', 'botones', 'ui', 'buscador'],
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">18.1 Portal Integrado de Documentación Docs-as-Code</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            Módulo interactivo que consolida la totalidad de maestros, herramientas y motores del sistema PETRAL SHIPPING.SOFT V2.5.
                        </p>

                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">18.2 Guía de Botones e Interfaz de Usuario (UI)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-blue-700 flex items-center gap-1.5">
                                    <span>🔍</span> Campo "Buscador Inteligente de Módulos"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Filtra en tiempo real los 18 capítulos por títulos, subtítulos, categorías o palabras clave (ej. <em>Flota, Callao, Regla 6, Búnker, SPCC</em>).
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-purple-700 flex items-center gap-1.5">
                                    <span>🗂️</span> Acordeón "DATOS MAESTROS" (Colapsable)
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Despliega o contrae verticalmente el bloque de los 11 maestros organizados en sus 4 categorías oficiales.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                                    <span>🛠️</span> Acordeón "HERRAMIENTAS &amp; MOTORES" (Colapsable)
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Despliega o contrae verticalmente la lista de los 7 módulos de herramientas operacionales del software.
                                </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>📥</span> Botón "Descargar PDF Membretado"
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                    Abre el cuadro de impresión para descargar el manual editorial oficial con logo membretado de Naviera Petral.
                                </p>
                            </div>
                        </div>
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
        <div className="p-6 space-y-6 w-full max-w-full mx-auto pb-12 print:p-0 print:m-0">

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
