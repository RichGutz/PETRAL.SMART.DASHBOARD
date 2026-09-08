import React, { useState } from 'react';
import { 
    Users, Building2, ChevronRight, ShieldCheck, Briefcase, 
    Anchor, DollarSign, Cpu, FileText, Download, Search, 
    Layers, Award, CheckCircle2, ArrowRight, X, ExternalLink,
    ZoomIn, ZoomOut, RotateCcw, LayoutGrid, GitFork, UserCheck,
    Compass, Ship, Fuel, FileSpreadsheet, Eye, BookOpen
} from 'lucide-react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { useNavigate } from 'react-router-dom';
import logoPetral from '../../assets/Logo.Petral.png';

export interface CompanyMember {
    id: string;
    name: string;
    title: string;
    shortTitle: string;
    area: 'DIRECCION' | 'COMERCIAL' | 'OPERACIONES' | 'FINANZAS_LIQUIDACIONES';
    areaLabel: string;
    assignedAsset?: string;
    reportsTo: string;
    badgeStyle: string;
    borderCardStyle: string;
    bgCardStyle: string;
    avatarBg: string;
    icon: string;
    objective: string;
    erpTools: { name: string; route: string; role: 'Editor' | 'Visor'; description: string }[];
    responsibilities: string[];
    kpis: string[];
    deliverables: string[];
}

export const COMPANY_MEMBERS: CompanyMember[] = [
    {
        id: 'fernando-gg',
        name: 'Fernando',
        title: 'Gerente General (GG)',
        shortTitle: 'Gerente General',
        area: 'DIRECCION',
        areaLabel: 'Dirección General & Estrategia',
        assignedAsset: 'Flota Consolidada Petral',
        reportsTo: 'Directorio Naviera Petral S.A.',
        badgeStyle: 'bg-amber-100 text-amber-800 border-amber-300',
        borderCardStyle: 'border-amber-300/80 hover:border-amber-500 shadow-amber-500/10',
        bgCardStyle: 'bg-gradient-to-b from-amber-50/80 via-white to-white',
        avatarBg: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white',
        icon: '👑',
        objective: 'Liderar la estrategia naviera, aprobar presupuestos anuales (PB 2027), supervisar el Time Charter Equivalent (TCE) y auditar el margen bruto consolidado de la flota.',
        erpTools: [
            { name: 'Matriz Financiera Consolidada', route: '/dashboard', role: 'Visor', description: 'Visión P&L consolidado, ingresos netos, costos y margen por viaje.' },
            { name: 'Maestro de Presupuestos', route: '/budgets', role: 'Editor', description: 'Aprobación y sellado del Presupuesto Base PB 2027.' },
            { name: 'Análisis Gráfico de Rentabilidad', route: '/graphic-analysis', role: 'Visor', description: 'Curvas de rendimiento y comparativa histórica de fletes.' },
            { name: 'Spaghetti Map de Flujos', route: '/spaghetti-map', role: 'Visor', description: 'Densidad y conectividad de rutas en la costa del Pacífico.' },
            { name: 'Device Vault & Seguridad', route: '/device-vault', role: 'Visor', description: 'Auditoría de accesos autorizados y ledger forense.' }
        ],
        responsibilities: [
            'Aprobación final del Presupuesto Anual Base y control del Forecast mensual.',
            'Supervisión del Time Charter Equivalent (TCE) promedio diario de la flota.',
            'Decisiones estratégicas de fletamento, compras de búnker y acuerdos marco COA (SPCC, NEXA, Shougang).',
            'Evaluación del desempeño operativo y financiero de las naves Moquegua y Tablones.'
        ],
        kpis: [
            'Margen Bruto Anual de la Flota (USD y % sobre flete)',
            'TCE Promedio Ponderado Flota (> $12,500 USD/día)',
            'Cumplimiento Presupuestal Consolidado (PB vs Real)'
        ],
        deliverables: [
            'Presupuesto Base Aprobado PB 2027',
            'Informe Ejecutivo de P&L Mensual',
            'Acta de Acuerdos Marco Comerciales'
        ]
    },
    {
        id: 'iosef-comercial',
        name: 'Iosef',
        title: 'Gerente Comercial (G Comercial)',
        shortTitle: 'Gerente Comercial',
        area: 'COMERCIAL',
        areaLabel: 'Gerencia Comercial & Fletamentos',
        assignedAsset: 'Contratos & Fletamentos Spot / COA',
        reportsTo: 'Fernando (Gerente General)',
        badgeStyle: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        borderCardStyle: 'border-indigo-300/80 hover:border-indigo-500 shadow-indigo-500/10',
        bgCardStyle: 'bg-gradient-to-b from-indigo-50/80 via-white to-white',
        avatarBg: 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white',
        icon: '💼',
        objective: 'Maximizar los ingresos por fletes marítimos, cotizar viajes spot multipiernas con Motor BAF, negociar contratos COA y estructurar las proyecciones financieras comerciales.',
        erpTools: [
            { name: 'Multicotizador Spot & Multipiernas', route: '/multicotizador', role: 'Editor', description: 'Cotización con Motor BAF, demoras y distancias náuticas.' },
            { name: 'Matriz Financiera / Forecast', route: '/dashboard', role: 'Editor', description: 'Construcción y guardado de escenarios de forecast comercial.' },
            { name: 'Maestro de Contratos', route: '/contracts', role: 'Editor', description: 'Registro de contratos marco COA y tarifas pactadas con clientes.' },
            { name: 'Maestro de Clientes', route: '/clients', role: 'Editor', description: 'Gestión comercial de clientes clave (SPCC, NEXA, etc.).' },
            { name: 'Precios de Búnker & Fórmulas BAF', route: '/bunker-prices', role: 'Editor', description: 'Calibración de precios de mercado IFO/MDO y bandas de compensación.' }
        ],
        responsibilities: [
            'Negociación de tarifas base ($/TM) y cláusulas de indexación búnker (Fórmula BAF).',
            'Estructuración y guardado de escenarios mensuales en la Matriz Financiera.',
            'Emisión y firma de cotizaciones formales para viajes spot y multipiernas.',
            'Fijación de términos de demurrage/despacho (USD/día) y laytime permitido.'
        ],
        kpis: [
            'Net Revenue Comercial mensual ($ USD)',
            'Tarifa Promedio por TM Transportada ($/TM)',
            'Tasa de Conversión de Cotizaciones a Viajes Reales (%)'
        ],
        deliverables: [
            'Cotizaciones Formales Spot en PDF (Foxit Ready)',
            'Escenarios Oficiales de Forecast en Matriz Financiera',
            'Contratos COA y Addendas Comerciales'
        ]
    },
    {
        id: 'maria-elena-moquegua',
        name: 'Maria Elena',
        title: 'Operadora de Buque — M/N MOQUEGUA',
        shortTitle: 'Operadora M/N MOQUEGUA',
        area: 'OPERACIONES',
        areaLabel: 'Operaciones Marítimas',
        assignedAsset: '🚢 M/N MOQUEGUA (DWT 28,000 MT)',
        reportsTo: 'Fernando (Gerente General)',
        badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        borderCardStyle: 'border-emerald-300/80 hover:border-emerald-500 shadow-emerald-500/10',
        bgCardStyle: 'bg-gradient-to-b from-emerald-50/80 via-white to-white',
        avatarBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white',
        icon: '🚢',
        objective: 'Gestionar la operación náutica y portuaria integral del buque M/N MOQUEGUA, controlando itinerarios, consumos de búnker (IFO/MDO), tiempos de muelle y costos portuarios.',
        erpTools: [
            { name: 'Maestro de Buques (Specs MOQUEGUA)', route: '/vessels', role: 'Editor', description: 'Gestión de calados, DWT, capacidades y consumos del buque.' },
            { name: 'Maestro de Costos Portuarios', route: '/port-costs', role: 'Editor', description: 'Control de tarifas de atraque, remolque, practicaje y lanchas.' },
            { name: 'Catálogo de Puertos & Terminales', route: '/ports', role: 'Visor', description: 'Restricciones de calado, eslora y rendimientos de carga.' },
            { name: 'Monitoreo de Búnker MOQUEGUA', route: '/bunker-prices', role: 'Editor', description: 'Control de inventario IFO 380 y MDO abordo.' },
            { name: 'Rutas Náuticas & Distancias', route: '/routes', role: 'Visor', description: 'Tiempos de navegación y cálculo de velocidad óptima.' }
        ],
        responsibilities: [
            'Coordinación directa con Capitán del MOQUEGUA, armadores y agencias marítimas.',
            'Seguimiento diario de posición (Noon Reports), velocidad y estado de la mar.',
            'Monitoreo de consumos de combustible en mar (sea consumption) y puerto (port consumption).',
            'Supervisión de operaciones de carga/descarga y control estricto del laytime para evitar demoras.'
        ],
        kpis: [
            'Tasa de Ocupación Efectiva del MOQUEGUA (% Días en Navegación / Carga)',
            'Desviación de Consumo IFO 380 / MDO vs Curva Teórica (< 2%)',
            'Tiempo Promedio de Estadía en Puerto (Días Turnaround)'
        ],
        deliverables: [
            'Reportes Diarios de Posición y Consumo (Daily Noon Reports)',
            'Statement of Facts (SOF) y Tiempos de Carga/Descarga',
            'Proformas Portuarias (PDA) Auditadas del MOQUEGUA'
        ]
    },
    {
        id: 'jorge-tablones',
        name: 'Jorge',
        title: 'Operador de Buque — M/N TABLONES',
        shortTitle: 'Operador M/N TABLONES',
        area: 'OPERACIONES',
        areaLabel: 'Operaciones Marítimas',
        assignedAsset: '🚢 M/N TABLONES (DWT 25,000 MT)',
        reportsTo: 'Fernando (Gerente General)',
        badgeStyle: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        borderCardStyle: 'border-cyan-300/80 hover:border-cyan-500 shadow-cyan-500/10',
        bgCardStyle: 'bg-gradient-to-b from-cyan-50/80 via-white to-white',
        avatarBg: 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white',
        icon: '⚓',
        objective: 'Gestionar la operación náutica y portuaria integral del buque M/N TABLONES, coordinando rotaciones de cabotaje e internacional, control de consumos y agenciamiento.',
        erpTools: [
            { name: 'Maestro de Buques (Specs TABLONES)', route: '/vessels', role: 'Editor', description: 'Gestión de calados, DWT, rendimientos y consumos del buque.' },
            { name: 'Maestro de Costos Portuarios', route: '/port-costs', role: 'Editor', description: 'Control de costos fijos y variables en puertos de recalada.' },
            { name: 'Catálogo de Puertos & Terminales', route: '/ports', role: 'Visor', description: 'Parámetros técnicos de terminales peruanos y chilenos.' },
            { name: 'Monitoreo de Búnker TABLONES', route: '/bunker-prices', role: 'Editor', description: 'Seguimiento de consumos IFO 380 y MDO abordo.' },
            { name: 'Rutas Náuticas & Distancias', route: '/routes', role: 'Visor', description: 'Estimación de millas náuticas y días de mar.' }
        ],
        responsibilities: [
            'Coordinación operativa con el Capitán del TABLONES y terminales portuarios.',
            'Monitoreo del cumplimiento del itinerario y orden de escala en puertos (Callao, Matarani, Mejillones, etc.).',
            'Supervisión de recepciones de búnker (Bunker Delivery Notes - BDN).',
            'Verificación de actas de hechos (SOF) y tiempos de atraque/desatraque.'
        ],
        kpis: [
            'Tasa de Utilización Operativa del TABLONES (% Días en Operación)',
            'Eficiencia de Combustible (TM Búnker / Milla Náutica Navegada)',
            'Cero Horas de Demora Imputable a Operación de Nave'
        ],
        deliverables: [
            'Reportes Operativos de Travesía del TABLONES',
            'Planillas de Consumo y BDN de Combustible',
            'Liquidación Operativa de Estadía en Muelle'
        ]
    },
    {
        id: 'sandra-liquidaciones',
        name: 'Sandra',
        title: 'Responsable de Liquidaciones & Finanzas de Viajes Reales',
        shortTitle: 'Liquidaciones Viajes Reales',
        area: 'FINANZAS_LIQUIDACIONES',
        areaLabel: 'Liquidaciones & Control Financiero',
        assignedAsset: 'Liquidaciones Post-Fixture (Flota Completa)',
        reportsTo: 'Fernando (Gerente General)',
        badgeStyle: 'bg-rose-100 text-rose-800 border-rose-300',
        borderCardStyle: 'border-rose-300/80 hover:border-rose-500 shadow-rose-500/10',
        bgCardStyle: 'bg-gradient-to-b from-rose-50/80 via-white to-white',
        avatarBg: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white',
        icon: '📑',
        objective: 'Ejecutar el cierre financiero y liquidación de cada viaje marítimo real, conciliando fletes facturados, facturas de búnker, proformas portuarias finales (FDA) y demoras.',
        erpTools: [
            { name: 'Maestro de Liquidaciones de Viajes', route: '/liquidations', role: 'Editor', description: 'Cierre contable post-viaje de ingresos y costos reales.' },
            { name: 'Matriz Financiera (Conciliación Real)', route: '/dashboard', role: 'Editor', description: 'Contraste entre Forecast Proyectado vs Liquidación Real.' },
            { name: 'Maestro de Costos Portuarios (FDA Audit)', route: '/port-costs', role: 'Editor', description: 'Auditoría de facturas finales de agentes portuarios.' },
            { name: 'Ledger de Auditoría & Trazabilidad', route: '/audit-ledger', role: 'Visor', description: 'Registro inmutable de transacciones y cierres de viaje.' },
            { name: 'Maestro de Presupuestos (Control Real)', route: '/budgets', role: 'Visor', description: 'Comparativa de desviación real vs Presupuesto Base.' }
        ],
        responsibilities: [
            'Recepción, auditoría y conciliación de facturas de búnker y agencias portuarias (FDA vs PDA).',
            'Cálculo formal de cuentas de demora y pronto despacho (Laytime & Demurrage Calculations).',
            'Emisión de la Liquidación Final de Viaje (Voyage Financial Statement) con rentabilidad real.',
            'Conciliación de fletes netos cobrados a clientes y reporte de desvíos a Gerencia.'
        ],
        kpis: [
            'Desviación Margen Real vs Forecast Proyectado por Viaje (< 3.0%)',
            'Tiempo Promedio de Cierre y Liquidación Post-Zarpe (< 5 días laborables)',
            '100% de Conciliación de Gastos Portuarios y Facturas de Búnker'
        ],
        deliverables: [
            'Acta de Liquidación Final de Viaje (Voyage Settlement PDF)',
            'Cálculo Pericial de Demurrage / Despacho por Cliente',
            'Informe de Conciliación Forecast vs Real Mensual'
        ]
    }
];

export const CompanyOrganigram_V2: React.FC = () => {
    const navigate = useNavigate();
    const [selectedMember, setSelectedMember] = useState<CompanyMember | null>(null);
    const [selectedArea, setSelectedArea] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [viewMode, setViewMode] = useState<'TREE' | 'GRID'>('TREE');

    const fernando = COMPANY_MEMBERS.find(m => m.id === 'fernando-gg')!;
    const iosef = COMPANY_MEMBERS.find(m => m.id === 'iosef-comercial')!;
    const mariaElena = COMPANY_MEMBERS.find(m => m.id === 'maria-elena-moquegua')!;
    const jorge = COMPANY_MEMBERS.find(m => m.id === 'jorge-tablones')!;
    const sandra = COMPANY_MEMBERS.find(m => m.id === 'sandra-liquidaciones')!;

    const filteredMembers = COMPANY_MEMBERS.filter(member => {
        const matchesArea = selectedArea === 'ALL' || member.area === selectedArea;
        const matchesSearch = searchTerm === '' || 
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.areaLabel.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesArea && matchesSearch;
    });

    const renderMemberCard = (member: CompanyMember, isRoot = false) => {
        const isDimmed = selectedArea !== 'ALL' && member.area !== selectedArea;

        return (
            <div 
                onClick={() => setSelectedMember(member)}
                className={`
                    relative group cursor-pointer text-left transition-all duration-300
                    w-72 sm:w-80 rounded-2xl p-5 border shadow-md hover:shadow-2xl
                    ${member.bgCardStyle} ${member.borderCardStyle}
                    ${isDimmed ? 'opacity-35 scale-95' : 'opacity-100 hover:scale-105 hover:-translate-y-1'}
                    ${isRoot ? 'ring-2 ring-amber-400 shadow-xl' : ''}
                `}
            >
                {/* Header Card */}
                <div className="flex items-start gap-3.5 mb-3">
                    <div className={`w-13 h-13 rounded-2xl ${member.avatarBg} flex items-center justify-center font-black text-xl shadow-md shrink-0`}>
                        {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                            <span className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                                {member.name}
                                <span className="text-sm">{member.icon}</span>
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${member.badgeStyle}`}>
                                {member.area === 'FINANZAS_LIQUIDACIONES' ? 'FINANZAS' : member.area}
                            </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 truncate mt-0.5">
                            {member.title}
                        </p>
                        {member.assignedAsset && (
                            <p className="text-[11px] font-semibold text-emerald-700 truncate flex items-center gap-1 mt-0.5">
                                <Ship className="w-3 h-3 shrink-0" />
                                {member.assignedAsset}
                            </p>
                        )}
                    </div>
                </div>

                {/* Objetivo Resumen */}
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-3.5">
                    {member.objective}
                </p>

                {/* Herramientas Principales */}
                <div className="space-y-1.5 mb-3.5 pt-2.5 border-t border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Herramientas ERP Clave</span>
                        <span className="text-slate-400 font-normal">{member.erpTools.length} activas</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {member.erpTools.slice(0, 3).map((tool, idx) => (
                            <span 
                                key={idx}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1 truncate max-w-[200px]"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                                <span className="truncate">{tool.name}</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-blue-700 group-hover:text-blue-800">
                    <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        Ver Ficha Completa
                    </span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-full bg-slate-50/50 text-slate-900 p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Header Corporativo Luminoso */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <img src={logoPetral} alt="Petral Logo" className="h-10 w-auto object-contain rounded-lg shadow-sm" />
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                                <GitFork className="w-3.5 h-3.5 text-blue-600" />
                                Estructura Organizacional Oficial
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                🏢 Organigrama de la Empresa
                            </h1>
                            <p className="text-slate-600 text-sm sm:text-base max-w-3xl mt-1">
                                Representación estructural jerárquica del equipo de <span className="text-slate-900 font-bold">Naviera Petral S.A.</span> con vinculación directa a los flujos, herramientas ERP y responsabilidades operativas.
                            </p>
                        </div>
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            onClick={() => navigate('/mof-manual')}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            Ver Manual MOF Oficial
                        </button>
                        <button
                            onClick={() => navigate('/docs')}
                            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-sm"
                        >
                            <BookOpen className="w-4 h-4 text-slate-500" />
                            Docs as Code
                        </button>
                    </div>
                </div>

                {/* Métricas Resumen del Equipo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200">
                    <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm">
                            1
                        </div>
                        <div>
                            <p className="text-[11px] text-amber-800 font-bold">Gerencia General</p>
                            <p className="text-sm font-extrabold text-slate-900">Fernando (GG)</p>
                        </div>
                    </div>

                    <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
                            1
                        </div>
                        <div>
                            <p className="text-[11px] text-indigo-800 font-bold">Gerencia Comercial</p>
                            <p className="text-sm font-extrabold text-slate-900">Iosef (G Comercial)</p>
                        </div>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-sm">
                            2
                        </div>
                        <div>
                            <p className="text-[11px] text-emerald-800 font-bold">Operadores de Buque</p>
                            <p className="text-sm font-extrabold text-slate-900">Maria Elena & Jorge</p>
                        </div>
                    </div>

                    <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shadow-sm">
                            1
                        </div>
                        <div>
                            <p className="text-[11px] text-rose-800 font-bold">Liquidaciones & Finanzas</p>
                            <p className="text-sm font-extrabold text-slate-900">Sandra (Post-Fixture)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra de Herramientas y Filtros */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
                
                {/* Filtros por Área */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        onClick={() => setSelectedArea('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            selectedArea === 'ALL' 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                    >
                        Toda la Empresa (5)
                    </button>
                    <button
                        onClick={() => setSelectedArea('DIRECCION')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            selectedArea === 'DIRECCION' 
                                ? 'bg-amber-500 text-white shadow-sm' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                    >
                        👑 Fernando (GG)
                    </button>
                    <button
                        onClick={() => setSelectedArea('COMERCIAL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            selectedArea === 'COMERCIAL' 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                    >
                        💼 Iosef (Comercial)
                    </button>
                    <button
                        onClick={() => setSelectedArea('OPERACIONES')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            selectedArea === 'OPERACIONES' 
                                ? 'bg-emerald-600 text-white shadow-sm' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                    >
                        🚢 Operaciones (Maria Elena & Jorge)
                    </button>
                    <button
                        onClick={() => setSelectedArea('FINANZAS_LIQUIDACIONES')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            selectedArea === 'FINANZAS_LIQUIDACIONES' 
                                ? 'bg-rose-600 text-white shadow-sm' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                    >
                        📑 Sandra (Liquidaciones)
                    </button>
                </div>

                {/* Controles de Vista & Zoom */}
                <div className="flex items-center gap-2 justify-end">
                    {/* Switch Modo de Vista */}
                    <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
                        <button
                            onClick={() => setViewMode('TREE')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                                viewMode === 'TREE' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Vista Org Chart Árbol"
                        >
                            <GitFork className="w-3.5 h-3.5" />
                            Árbol Org Chart
                        </button>
                        <button
                            onClick={() => setViewMode('GRID')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                                viewMode === 'GRID' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Vista Tarjetas"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            Tarjetas
                        </button>
                    </div>

                    {/* Controles de Zoom para Vista de Árbol */}
                    {viewMode === 'TREE' && (
                        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
                            <button
                                onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.1))}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition"
                                title="Reducir Zoom"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-[11px] font-mono font-bold text-slate-700 px-1.5">
                                {Math.round(zoomLevel * 100)}%
                            </span>
                            <button
                                onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition"
                                title="Aumentar Zoom"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setZoomLevel(1)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition"
                                title="Restablecer Zoom"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* CONTENEDOR PRINCIPAL DEL ORG CHART LUMINOSO */}
            {viewMode === 'TREE' ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm overflow-x-auto min-h-[620px] flex justify-center items-start">
                    <div 
                        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                        className="transition-transform duration-200 ease-out py-4"
                    >
                        <Tree
                            lineWidth="3px"
                            lineColor="#2563eb"
                            lineBorderRadius="14px"
                            label={
                                <div className="inline-block mx-auto mb-4">
                                    {renderMemberCard(fernando, true)}
                                </div>
                            }
                        >
                            {/* Rama 1: Iosef - Gerente Comercial */}
                            <TreeNode
                                label={
                                    <div className="inline-block px-3 py-2">
                                        {renderMemberCard(iosef)}
                                    </div>
                                }
                            />

                            {/* Rama 2: Maria Elena - Operadora Moquegua */}
                            <TreeNode
                                label={
                                    <div className="inline-block px-3 py-2">
                                        {renderMemberCard(mariaElena)}
                                    </div>
                                }
                            />

                            {/* Rama 3: Jorge - Operador Tablones */}
                            <TreeNode
                                label={
                                    <div className="inline-block px-3 py-2">
                                        {renderMemberCard(jorge)}
                                    </div>
                                }
                            />

                            {/* Rama 4: Sandra - Liquidaciones de Viajes Reales */}
                            <TreeNode
                                label={
                                    <div className="inline-block px-3 py-2">
                                        {renderMemberCard(sandra)}
                                    </div>
                                }
                            />
                        </Tree>
                    </div>
                </div>
            ) : (
                /* VISTA EN GRID DE TARJETAS */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map(member => (
                        <div key={member.id} className="flex justify-center">
                            {renderMemberCard(member, member.id === 'fernando-gg')}
                        </div>
                    ))}
                </div>
            )}

            {/* TABLA EJECUTIVA DE RESPONSABILIDADES Y MATRIZ RACI */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-blue-600" />
                            Matriz Ejecutiva de Asignación por Módulo ERP
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600">
                            Mapeo de los 5 integrantes de Naviera Petral frente a las pantallas y flujos operativos del ERP.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider bg-slate-50">
                                <th className="p-3.5 rounded-l-xl">Integrante</th>
                                <th className="p-3.5">Cargo / Función</th>
                                <th className="p-3.5">Área & Buque</th>
                                <th className="p-3.5">Herramientas ERP Principales</th>
                                <th className="p-3.5">Frecuencia Principal</th>
                                <th className="p-3.5 text-right rounded-r-xl">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {COMPANY_MEMBERS.map(member => (
                                <tr 
                                    key={member.id}
                                    className="hover:bg-blue-50/50 transition group cursor-pointer"
                                    onClick={() => setSelectedMember(member)}
                                >
                                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-lg ${member.avatarBg} flex items-center justify-center font-bold text-xs shadow-xs`}>
                                            {member.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-extrabold">{member.name}</p>
                                            <p className="text-[10px] text-slate-500 font-normal">{member.areaLabel}</p>
                                        </div>
                                    </td>
                                    <td className="p-3.5 text-slate-700 font-semibold">
                                        {member.title}
                                    </td>
                                    <td className="p-3.5">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${member.badgeStyle}`}>
                                            {member.assignedAsset || member.area}
                                        </span>
                                    </td>
                                    <td className="p-3.5">
                                        <div className="flex flex-wrap gap-1 max-w-md">
                                            {member.erpTools.map((tool, idx) => (
                                                <span 
                                                    key={idx}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(tool.route);
                                                    }}
                                                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 text-[10px] font-medium border border-slate-200 transition flex items-center gap-1"
                                                >
                                                    {tool.name}
                                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3.5 text-slate-600 font-semibold">
                                        {member.id === 'fernando-gg' ? 'Mensual / Anual' : member.id === 'iosef-comercial' ? 'Diaria / Spot' : member.id === 'sandra-liquidaciones' ? 'Por Viaje Real' : 'Diaria (Noon Reports)'}
                                    </td>
                                    <td className="p-3.5 text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMember(member);
                                            }}
                                            className="px-3 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition border border-blue-200"
                                        >
                                            Ficha
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DETALLADO DE FICHA TÉCNICA DEL INTEGRANTE */}
            {selectedMember && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900">
                        
                        {/* Header Modal */}
                        <div className={`p-6 border-b border-slate-200 ${selectedMember.bgCardStyle} relative`}>
                            <button
                                onClick={() => setSelectedMember(null)}
                                className="absolute top-5 right-5 p-2 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 transition shadow-xs"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-start gap-4 pr-10">
                                <div className={`w-16 h-16 rounded-2xl ${selectedMember.avatarBg} flex items-center justify-center font-black text-2xl shadow-md shrink-0`}>
                                    {selectedMember.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-2xl font-black text-slate-900">{selectedMember.name}</h3>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${selectedMember.badgeStyle}`}>
                                            {selectedMember.area === 'FINANZAS_LIQUIDACIONES' ? 'FINANZAS' : selectedMember.area}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 mt-0.5">
                                        {selectedMember.title}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                        <span>🏢 Reporta a: <strong className="text-slate-800">{selectedMember.reportsTo}</strong></span>
                                        {selectedMember.assignedAsset && (
                                            <span className="text-emerald-700 font-bold">• {selectedMember.assignedAsset}</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Body Modal */}
                        <div className="p-6 space-y-6">
                            
                            {/* Objetivo del Puesto */}
                            <div className="space-y-1.5">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Award className="w-4 h-4 text-amber-600" />
                                    Misión y Objetivo Principal
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                                    {selectedMember.objective}
                                </p>
                            </div>

                            {/* Herramientas ERP Asignadas */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-blue-600" />
                                    Herramientas ERP Asignadas & Accesos
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {selectedMember.erpTools.map((tool, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => {
                                                setSelectedMember(null);
                                                navigate(tool.route);
                                            }}
                                            className="p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl transition cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition">
                                                    {tool.name}
                                                </span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                                    tool.role === 'Editor' 
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                    {tool.role}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 line-clamp-2">
                                                {tool.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Responsabilidades */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    Responsabilidades Clave
                                </h4>
                                <ul className="space-y-1.5">
                                    {selectedMember.responsibilities.map((resp, idx) => (
                                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
                                            <span>{resp}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* KPIs y Entregables */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Award className="w-4 h-4 text-amber-600" />
                                        KPIs Auditables
                                    </h4>
                                    <ul className="space-y-1">
                                        {selectedMember.kpis.map((kpi, idx) => (
                                            <li key={idx} className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                                📊 {kpi}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                                        Entregables Oficiales
                                    </h4>
                                    <ul className="space-y-1">
                                        {selectedMember.deliverables.map((deliv, idx) => (
                                            <li key={idx} className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                                📄 {deliv}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Footer Modal */}
                        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                            <button
                                onClick={() => setSelectedMember(null)}
                                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-xs"
                            >
                                Cerrar Ficha
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedMember(null);
                                    navigate('/mof-manual');
                                }}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                Ver en Manual MOF Detallado
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default CompanyOrganigram_V2;
