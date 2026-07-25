import React, { useState } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { Download, FileText, ChevronRight, Layers, Anchor, Compass, Database, Zap, Scale, ShoppingCart, BarChart3 } from 'lucide-react';

interface DocChapter {
    id: string;
    chapterNum: number;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    badge: string;
    content: React.ReactNode;
}

export const SystemDocumentation_V2: React.FC = () => {
    const [activeChapterId, setActiveChapterId] = useState<string>('c1');

    const chapters: DocChapter[] = [
        {
            id: 'c1',
            chapterNum: 1,
            title: 'Visión General & Arquitectura',
            subtitle: 'Estructura modular en 5 niveles para la inteligencia comercial naviera',
            icon: <Layers size={18} />,
            badge: 'Capítulo 1',
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
                                <span className="text-[10px] text-purple-700 mt-1 font-sans">Suite Auditoría &amp; Flowcharts Flujo</span>
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
            title: 'Maestro de Puertos & Gastos Portuarios',
            subtitle: 'Administración de tarifas fijas estáticas y reglas dinámicas P×Q',
            icon: <Compass size={18} />,
            badge: 'Capítulo 3',
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">3.1 Gestión de Gastos Estáticos y Dinámicos</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            Soporta las escalas portuarias en el litoral peruano e internacional (Callao, Matarani, Ilo, San Juan de Marcona, Mejillones, Quintero, Guayaquil):
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <span className="font-bold text-slate-900 block mb-1">🏷️ Costos Estáticos Fijos ($/op):</span>
                                <p className="text-slate-600">Presupuesto plano asignado por escala para agenciamiento y gastos generales.</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <span className="font-bold text-blue-900 block mb-1">🧮 Matriz de Gastos Dinámicos (P×Q):</span>
                                <p className="text-slate-600">Cálculo desglosado por Practicaje, Remolque, Uso de Muelle, Amarre y Lanchas.</p>
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
            subtitle: 'Matriz de distancias en millas náuticas (NM) y cálculo de tiempos de viaje',
            icon: <Database size={18} />,
            badge: 'Capítulo 4',
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">4.1 Matriz de Distancias Marítimas</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            Determina la distancia precisa en millas náuticas (NM) y calcula los días de navegación según la velocidad en nudos:
                        </p>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                            Días de Navegación = Distancia (NM) ÷ (Velocidad Kts × 24)
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'c5',
            chapterNum: 5,
            title: 'Maestro de Clientes & Contratos COA',
            subtitle: 'Laytime, comisiones, demurrage y bandas de flete por toneladas',
            icon: <FileText size={18} />,
            badge: 'Capítulo 5',
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">5.1 Contratos de Afletamiento (COA)</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            Administra los acuerdos comerciales pactados con los clientes (ej. Southern Perú, Aceros Arequipa, Repsol, Primax):
                        </p>
                        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1 font-mono">
                            <li>Laytime y Rates de Carga/Descarga (MT/día).</li>
                            <li>Comisiones de Dirección y Brokerage (%).</li>
                            <li>Tasas de Demurrage ($/día).</li>
                            <li>Tarifas por Tramo de Tonelaje (Tiers en $/MT).</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'c6',
            chapterNum: 6,
            title: 'Maestro de Búnker & Motor BAF',
            subtitle: 'Indexación polinómica por variación de combustibles (38.40 IFO / 9.50 MDO)',
            icon: <Zap size={18} />,
            badge: 'Capítulo 6',
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">6.1 Ecuación Polinómica BAF (B/T Moquegua)</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            Indexa la tarifa de flete de forma paramétrica sumando o restando el delta de combustible:
                        </p>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 space-y-1">
                            <div>Factor fa = Costo_N ÷ Costo_N-1</div>
                            <div>Nuevo BAF = BAF_Inicial × fa</div>
                            <div className="font-bold text-emerald-700">Δ BAF Net = Nuevo BAF - BAF_Inicial</div>
                            <div className="font-bold text-blue-900">Tarifa Final Tramo = Tarifa Base Tramo + Δ BAF Net</div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'c7',
            chapterNum: 7,
            title: 'Maestro de Originación',
            subtitle: 'Mapeo de fuentes de producción y puntos de destino',
            icon: <Compass size={18} />,
            badge: 'Capítulo 7',
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">7.1 Puntos Logísticos (Sources &amp; Sinks)</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Mapea los orígenes de refinería/almacenamiento y los destinos receptores de carga en el Pacífico Sur.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'c8',
            chapterNum: 8,
            title: 'Multicotizador Multirutas Spot',
            subtitle: 'Motor de cotización comercial multirutas en tiempo real',
            icon: <ShoppingCart size={18} />,
            badge: 'Capítulo 8',
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">8.1 Simulación Comercial Spot</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Permite simular múltiples alternativas de flete para maximizar el TCE ($/día) y el resultado neto del viaje.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'c9',
            chapterNum: 9,
            title: 'Matriz Financiera & Voyage Ledger P&L',
            subtitle: 'Consolidación del estado de pérdidas y ganancias de la flota',
            icon: <BarChart3 size={18} />,
            badge: 'Capítulo 9',
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">9.1 Estado de Resultados por Viaje (P&amp;L)</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            Consolida los ingresos por flete deduciendo comisiones, búnker consumido y gastos portuarios:
                        </p>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                            Resultado Neto = Ingreso Flete - (Comisiones + Costo Búnker + Gastos Portuarios)
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'c10',
            chapterNum: 10,
            title: 'Auditoría Static vs Dynamic Port Cost',
            subtitle: 'Comparativa de costos fijados estáticos vs promedio dinámico por puerto',
            icon: <Scale size={18} />,
            badge: 'Capítulo 10',
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">10.1 Control de Varianza Portuaria</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            Monitorea la desviación entre presupuestos estáticos y liquidaciones reales con semáforos de alerta:
                        </p>
                        <div className="flex items-center gap-3 text-xs font-mono">
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded border border-emerald-200">🟢 Alineado (&lt;5%)</span>
                            <span className="bg-amber-50 text-amber-800 px-2 py-1 rounded border border-amber-200">🟡 Variación (5%-15%)</span>
                            <span className="bg-red-50 text-red-800 px-2 py-1 rounded border border-red-200">🔴 Crítico (&gt;15%)</span>
                        </div>
                    </div>
                </div>
            )
        }
    ];

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

                {/* ── CABECERA EXECUTIVA CON LOGOS CORPORATIVOS (MEMBRETE LIBRO DE TEXTO) ── */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:shadow-none print:border-b-2 print:border-slate-800">
                    <div className="flex items-center gap-4">
                        <img src="/Logo.Petral.png" alt="Naviera Petral" className="h-10 object-contain" />
                        <div className="h-8 border-l border-slate-200 hidden md:block"></div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">MANUAL DE ARQUITECTURA &amp; USUARIO</h2>
                            <span className="text-xs text-slate-500 font-bold tracking-wider uppercase block">PETRAL SHIPPING.SOFT V2.5 PRO • RELEASE 2026</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 print:hidden">
                        <button 
                            onClick={handlePrintSection}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                            title="Descargar o Imprimir Documento Membretado"
                        >
                            <Download size={15} /> Descargar PDF Membretado
                        </button>
                    </div>

                    <div className="hidden print:block text-right text-[10px] font-mono text-slate-500">
                        <div>Naviera Petral S.A.</div>
                        <div>Fecha: 25 de Julio de 2026</div>
                    </div>
                </div>

                {/* ── CONTENEDOR PRINCIPAL ESTILO LIBRO EDITORIAL ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* NAVEGACIÓN LATERAL DE CAPÍTULOS (TABS ESTILO LIBRO) */}
                    <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2 print:hidden">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
                            <span>Tabla de Contenidos</span>
                            <span>10 Capítulos</span>
                        </div>

                        <nav className="flex flex-col gap-1">
                            {chapters.map(ch => {
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
                    </div>

                    {/* VISTA DEL CAPÍTULO EN PANTALLA ESTILO PAGINA EDITORIAL */}
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
                            <div>25.07.2026</div>
                        </div>

                    </div>
                </div>

            </div>
        </MasterTemplate>
    );
};
