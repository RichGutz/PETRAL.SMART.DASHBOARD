import React, { useState } from 'react';
import { 
    Users, Building2, ChevronRight, ShieldCheck, Briefcase, 
    Anchor, DollarSign, Cpu, FileText, Download, Search, 
    Layers, Award, CheckCircle2, ArrowRight, X, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoPetral from '../../assets/Logo.Petral.png';

interface JobPosition {
    id: string;
    title: string;
    area: 'DIRECCION' | 'COMERCIAL' | 'OPERACIONES' | 'COSTOS' | 'TI_SEGURIDAD';
    level: 1 | 2 | 3 | 4;
    reportsTo: string;
    color: string;
    icon: string;
    objective: string;
    erpTools: { name: string; route: string; role: 'Editor' | 'Visor' }[];
    responsibilities: string[];
    kpis: string[];
    supervisedRoles: string[];
}

const POSITIONS: JobPosition[] = [
    {
        id: 'pos-ceo',
        title: 'Gerente General / Dirección Ejecutiva',
        area: 'DIRECCION',
        level: 1,
        reportsTo: 'Directorio Naviera Petral',
        color: 'from-slate-800 to-slate-900 text-white border-slate-700',
        icon: '👑',
        objective: 'Liderar la estrategia global, aprobar presupuestos anuales y monitorear la rentabilidad financiera de la flota propia y fletada.',
        erpTools: [
            { name: 'Matriz Financiera Consolidada', route: '/dashboard', role: 'Visor' },
            { name: 'Análisis Gráfico de Rentabilidad', route: '/graphic-analysis', role: 'Visor' },
            { name: 'Spaghetti Map de Flujos Comerciales', route: '/spaghetti-map', role: 'Visor' },
            { name: 'Maestro de Presupuestos', route: '/budgets', role: 'Editor' }
        ],
        responsibilities: [
            'Aprobación de cierres anuales de presupuesto (Maestro de Presupuestos y Forecast).',
            'Supervisión del Time Charter Equivalent (TCE) global y Margen Bruto de la flota.',
            'Decisiones de compra, fletamento por tiempo (Time Charter) o drydock de embarcaciones.',
            'Evaluación de contratos marco COA a largo plazo (SPCC, NEXA, Shougang).'
        ],
        kpis: [
            'Margen Bruto Anual de la Flota (USD y %)',
            'TCE Promedio Ponderado Flota (USD/día)',
            'Tasa de Ocupación Efectiva de Naves (% días activos vs disponibles)'
        ],
        supervisedRoles: ['Gerente Comercial', 'Superintendente de Operaciones']
    },
    {
        id: 'pos-com-mgr',
        title: 'Gerente Comercial & Fletamentos (Chartering)',
        area: 'COMERCIAL',
        level: 2,
        reportsTo: 'Gerente General',
        color: 'from-indigo-600 to-indigo-800 text-white border-indigo-500',
        icon: '💼',
        objective: 'Maximizar los ingresos por fletes marítimos, negociar contratos de transporte (COA) y estructurar las proyecciones financieras mensuales.',
        erpTools: [
            { name: 'Matriz Financiera', route: '/dashboard', role: 'Editor' },
            { name: 'Multicotizador Spot', route: '/multicotizador', role: 'Editor' },
            { name: 'Maestro de Contratos & Cierres', route: '/contracts', role: 'Editor' },
            { name: 'Maestro de Clientes', route: '/clients', role: 'Editor' },
            { name: 'Maestro de Matrices', route: '/financial-projections', role: 'Editor' }
        ],
        responsibilities: [
            'Negociación de tarifas base ($/MT) y cláusulas de indexación de combustible (Fórmula BAF).',
            'Configuración y guardado de escenarios de forecast mensual en la Matriz Financiera.',
            'Aprobación de cotizaciones spot multipiernas y condiciones de demora/despacho.',
            'Asignación óptima de rutas a naves propias (Moquegua, Tablones) vs fletes spot.'
        ],
        kpis: [
            'Net Revenue Consolidado mensual',
            'Margen de Contribución por Cliente (SPCC, NEXA, etc.)',
            'Precisión del Forecast vs Liquidación Real'
        ],
        supervisedRoles: ['Operador Comercial / Cotizador Spot']
    },
    {
        id: 'pos-com-op',
        title: 'Operador Comercial / Cotizador Spot',
        area: 'COMERCIAL',
        level: 3,
        reportsTo: 'Gerente Comercial & Fletamentos',
        color: 'from-blue-600 to-blue-700 text-white border-blue-500',
        icon: '⛴️',
        objective: 'Modelar y cotizar viajes spot marítimos en tiempo récord con precisión matemática de costos portuarios y consumo de búnker.',
        erpTools: [
            { name: 'Multicotizador Spot', route: '/multicotizador', role: 'Editor' },
            { name: 'Maestro de Cotizaciones', route: '/quotes', role: 'Editor' },
            { name: 'Maestro de Distancias Náuticas', route: '/routes', role: 'Visor' },
            { name: 'Precios de Búnker', route: '/bunker-prices', role: 'Visor' }
        ],
        responsibilities: [
            'Ingreso y cálculo de tramos (puertos de carga/descarga, tonelajes MT, fletes acordados).',
            'Modelado de escenarios con compuerta de demora (Modo O Promedio vs Días manuales).',
            'Exportación de viajes calculados directamente hacia la Matriz Financiera.',
            'Generación de Actas de Cotización Ejecutiva en PDF membretado.'
        ],
        kpis: [
            'Tiempo de respuesta en cotizaciones spot (< 15 minutos)',
            'P&L por Viaje proyectado con margen positivo',
            'Convergencia 100% entre cotización y liquidación operativa'
        ],
        supervisedRoles: []
    },
    {
        id: 'pos-ops-mgr',
        title: 'Superintendente de Operaciones Marítimas',
        area: 'OPERACIONES',
        level: 2,
        reportsTo: 'Gerente General',
        color: 'from-emerald-600 to-emerald-800 text-white border-emerald-500',
        icon: '🚢',
        objective: 'Garantizar la operatividad física, navegación segura y cumplimiento de itinerarios de la flota con control estricto de consumos.',
        erpTools: [
            { name: 'Maestro de Flota', route: '/vessels', role: 'Editor' },
            { name: 'Maestro de Puertos & Terminales', route: '/ports', role: 'Editor' },
            { name: 'Maestro de Distancias', route: '/routes', role: 'Editor' },
            { name: 'Maestro de Búnker', route: '/bunker-prices', role: 'Editor' },
            { name: 'Spaghetti Map Operativo', route: '/spaghetti-map', role: 'Visor' }
        ],
        responsibilities: [
            'Administración de fichas técnicas de buques (DWT, LOA, calados tropical/summer).',
            'Mantenimiento de tablas de consumos de búnker (Navegación Laden/Ballast, Operación Muelle, Fondeo).',
            'Coordinación con capitanes y armadores para optimización de velocidades de navegación.',
            'Control de tiempos de estadía y operaciones fijas (4h amarre/desamarre y conexiones).'
        ],
        kpis: [
            'Días fuera de servicio / Off-hire no planificados (Meta: 0 días)',
            'Desvío de consumo de combustible vs tabla matriz (< 2%)',
            'Puntualidad en ventanas de atraque (ETA / ETB)'
        ],
        supervisedRoles: ['Analista de Búnker & Rendimiento']
    },
    {
        id: 'pos-port-mgr',
        title: 'Jefe de Costos Portuarios & Agenciamiento',
        area: 'COSTOS',
        level: 3,
        reportsTo: 'Gerente Comercial / Operaciones',
        color: 'from-amber-600 to-amber-700 text-white border-amber-500',
        icon: '⚓',
        objective: 'Tarificar, auditar y controlar con precisión milimétrica todos los gastos de agenciamiento portuario bajo la fórmula PxQ y bandas arancelarias.',
        erpTools: [
            { name: 'Maestro de Tarifas Portuarias', route: '/port-tariffs', role: 'Editor' },
            { name: 'Maestro de Gastos Portuarios', route: '/port-costs', role: 'Editor' },
            { name: 'Maestro de Demoras (Demurrage)', route: '/demurrage', role: 'Editor' },
            { name: 'Motor PxQ & Visor de Auditoría', route: '/audit-final', role: 'Editor' },
            { name: 'Liquidador de Gastos Portuarios', route: '/liquidations-pdf-audit', role: 'Editor' }
        ],
        responsibilities: [
            'Mantenimiento de tarifas arancelarias oficiales (APM Callao, DPW, TISUR Matarani, SPCC Ilo, TPM Mejillones).',
            'Configuración de fórmulas PxQ (Practicaje por TRB, Remolques por eslora, Muellaje por metro/hora).',
            'Aplicación pericial de la Regla 6 OT (+25% sobretiempo en ventanas nocturnas/feriados).',
            'Auditoría cruzada de facturas finales de agentes navieros vs proformas estimadas.'
        ],
        kpis: [
            'Desvío de Costos Portuarios Proforma vs Factura Final (< 3%)',
            'Detección y recupero de sobrecostos o cobros no contractuales',
            'Tiempo de liquidación final de gastos portuarios (< 7 días pos-zarpe)'
        ],
        supervisedRoles: ['Liquidador de Gastos Portuarios']
    },
    {
        id: 'pos-bunker-an',
        title: 'Analista de Búnker & Rendimiento Energético',
        area: 'OPERACIONES',
        level: 4,
        reportsTo: 'Superintendente de Operaciones Marítimas',
        color: 'from-rose-600 to-rose-700 text-white border-rose-500',
        icon: '⛽',
        objective: 'Monitorear cotizaciones de combustibles marinos (VLSFO / MDO), compras estratégicas y homologación MDO/MGO.',
        erpTools: [
            { name: 'Maestro de Precios de Búnker', route: '/bunker-prices', role: 'Editor' },
            { name: 'Maestro Originación / Sinks', route: '/sources-sinks', role: 'Editor' },
            { name: 'Motor BAF de Indexación', route: '/system-flowchart', role: 'Visor' }
        ],
        responsibilities: [
            'Actualización diaria de cotizaciones de búnker en puertos base (Callao, Balboa, Valparaíso).',
            'Aplicación de la regla de homologación MGO = MDO en todas las facturas y compras.',
            'Cálculo de deltas del factor BAF según polinomio contractual (38.40 IFO / 9.50 MDO).',
            'Control de inventario de combustible a bordo (ROB - Remaining On Board).'
        ],
        kpis: [
            'Ahorro en compra de búnker vs precio medio de mercado',
            'Convergencia 100% de conciliación ROB pos-viaje',
            'Actualización en tiempo real de tarifas de combustible en el sistema'
        ],
        supervisedRoles: []
    },
    {
        id: 'pos-sec-admin',
        title: 'Oficial de Seguridad & Administrador del Sistema TI',
        area: 'TI_SEGURIDAD',
        level: 2,
        reportsTo: 'Gerencia General',
        color: 'from-slate-700 to-slate-900 text-white border-slate-600',
        icon: '🔒',
        objective: 'Asegurar la integridad, alta disponibilidad (100% Online) y blindaje Zero-Trust por hardware de toda la infraestructura ERP.',
        erpTools: [
            { name: 'Device Vault (Bóveda de Equipos)', route: '/device-vault', role: 'Editor' },
            { name: 'Gestión de Usuarios & Permisos', route: '/users', role: 'Editor' },
            { name: 'Libro de Auditoría Forense (Logs)', route: '/audit-ledger', role: 'Editor' },
            { name: 'Sincronizador Docs-as-Code', route: '/system-documentation', role: 'Editor' }
        ],
        responsibilities: [
            'Autorización y revocación de estaciones de trabajo en el Device Vault bajo firma de hardware.',
            'Administración de roles (Admin, Editor, Visor) y asignación granular de módulos en PostgreSQL.',
            'Monitoreo del VPS en producción (https://forecast.geeksoft.tech) y certificados SSL.',
            'Auditoría transaccional de eventos en vivo y respaldo inalterable de bitácoras.'
        ],
        kpis: [
            'Uptime de la plataforma en Producción (Meta: 99.9%)',
            'Cero accesos no autorizados desde hardware no registrado',
            'Tiempo de atención de solicitudes de desbloqueo de equipos (< 5 minutos)'
        ],
        supervisedRoles: []
    }
];

export const CompanyOrganigram_V2: React.FC = () => {
    const navigate = useNavigate();
    const [selectedPosition, setSelectedPosition] = useState<JobPosition | null>(null);
    const [filterArea, setFilterArea] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState<string>('');

    const filteredPositions = POSITIONS.filter(p => {
        const matchesArea = filterArea === 'ALL' || p.area === filterArea;
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              p.objective.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              p.erpTools.some(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesArea && matchesSearch;
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 space-y-6 w-full max-w-full mx-auto pb-12 print:p-0 print:m-0 font-sans">
            
            {/* ── HEADER PRINCIPAL CORPORATIVO ── */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 w-full print:border-b-2 print:border-slate-800">
                <div className="flex items-center gap-4">
                    <img src={logoPetral} alt="Naviera Petral" className="h-10 object-contain" />
                    <div className="h-8 border-l border-slate-200 hidden md:block"></div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">ORGANIGRAMA EMPRESARIAL &amp; ROLES DEL ERP</h2>
                        <span className="text-xs text-slate-500 font-bold tracking-wider uppercase block">ESTRUCTURA ORGANIZACIONAL BASADA EN LOS PROCESOS DEL SISTEMA DELFOS</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 print:hidden">
                    <div className="relative w-64">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar puesto, módulo o KPI..."
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <button 
                        onClick={handlePrint}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                    >
                        <Download size={14} /> Imprimir Organigrama
                    </button>
                </div>
            </div>

            {/* ── FILTROS POR ÁREA ── */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
                {[
                    { id: 'ALL', label: 'Toda la Empresa', icon: <Building2 size={14} /> },
                    { id: 'DIRECCION', label: 'Dirección General', icon: <Award size={14} /> },
                    { id: 'COMERCIAL', label: 'Área Comercial & Fletamentos', icon: <Briefcase size={14} /> },
                    { id: 'OPERACIONES', label: 'Operaciones & Flota', icon: <Anchor size={14} /> },
                    { id: 'COSTOS', label: 'Costos Portuarios & Liquidación', icon: <DollarSign size={14} /> },
                    { id: 'TI_SEGURIDAD', label: 'Seguridad & TI', icon: <ShieldCheck size={14} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilterArea(tab.id)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border ${
                            filterArea === tab.id 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── VISTA JERÁRQUICA DEL ORGANIGRAMA ── */}
            <div className="space-y-6">
                
                {/* NIVEL 1: ALTA DIRECCIÓN */}
                {(filterArea === 'ALL' || filterArea === 'DIRECCION') && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                                NIVEL 1 • ALTA DIRECCIÓN &amp; ESTRATEGIA
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPositions.filter(p => p.level === 1).map(pos => (
                                <PositionCard key={pos.id} position={pos} onSelect={() => setSelectedPosition(pos)} />
                            ))}
                        </div>
                    </div>
                )}

                {/* NIVEL 2: GERENCIAS DE LÍNEA */}
                {(filterArea === 'ALL' || ['COMERCIAL', 'OPERACIONES', 'TI_SEGURIDAD'].includes(filterArea)) && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                                NIVEL 2 • GERENCIAS EJECUTIVAS &amp; JEFATURAS ESTRATÉGICAS
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPositions.filter(p => p.level === 2).map(pos => (
                                <PositionCard key={pos.id} position={pos} onSelect={() => setSelectedPosition(pos)} />
                            ))}
                        </div>
                    </div>
                )}

                {/* NIVEL 3 & 4: OPERACIONES & ANÁLISIS */}
                {(filterArea === 'ALL' || ['COMERCIAL', 'COSTOS', 'OPERACIONES'].includes(filterArea)) && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                                NIVEL 3 &amp; 4 • OPERACIÓN COMERCIAL, COSTOS &amp; ANÁLISIS TÉCNICO
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPositions.filter(p => p.level >= 3).map(pos => (
                                <PositionCard key={pos.id} position={pos} onSelect={() => setSelectedPosition(pos)} />
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* ── MODAL DETALLE DE PUESTO (DRAWER / OVERLAY) ── */}
            {selectedPosition && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-[700px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        
                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{selectedPosition.icon}</span>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{selectedPosition.title}</h3>
                                    <p className="text-[11px] text-slate-500 font-medium">Reporta a: {selectedPosition.reportsTo}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedPosition(null)}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Contenido Modal */}
                        <div className="p-6 space-y-5 overflow-y-auto">
                            
                            {/* Objetivo */}
                            <div>
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                    <Award size={14} className="text-blue-600" /> Misión y Objetivo del Puesto
                                </h4>
                                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                                    {selectedPosition.objective}
                                </p>
                            </div>

                            {/* Módulos del ERP Asignados */}
                            <div>
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                    <Cpu size={14} className="text-indigo-600" /> Módulos y Herramientas del ERP a su Cargo
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {selectedPosition.erpTools.map((tool, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                                            <span className="text-xs font-bold text-slate-800 truncate">{tool.name}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                                                tool.role === 'Editor' 
                                                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                                {tool.role}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Responsabilidades */}
                            <div>
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                    <CheckCircle2 size={14} className="text-emerald-600" /> Responsabilidades Principales en el Flujo
                                </h4>
                                <ul className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    {selectedPosition.responsibilities.map((resp, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">•</span>
                                            <span>{resp}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* KPIs */}
                            <div>
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                    <Layers size={14} className="text-amber-600" /> Indicadores Clave de Gestión (KPIs)
                                </h4>
                                <div className="space-y-1.5">
                                    {selectedPosition.kpis.map((kpi, idx) => (
                                        <div key={idx} className="p-2 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs font-medium text-amber-900 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                                            <span>{kpi}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <button
                                onClick={() => {
                                    setSelectedPosition(null);
                                    navigate('/mof-manual');
                                }}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                            >
                                <span>Ver en Manual MOF</span>
                                <ExternalLink size={13} />
                            </button>
                            <button
                                onClick={() => setSelectedPosition(null)}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                                Entendido
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

// Tarjeta Individual de Puesto
const PositionCard: React.FC<{ position: JobPosition; onSelect: () => void }> = ({ position, onSelect }) => (
    <div 
        onClick={onSelect}
        className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer p-4 flex flex-col justify-between gap-3 group"
    >
        <div>
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xl p-1.5 bg-slate-50 rounded-lg border border-slate-200 group-hover:scale-110 transition-transform">
                        {position.icon}
                    </span>
                    <div>
                        <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase group-hover:text-blue-600 transition-colors">
                            {position.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium block">
                            {position.reportsTo}
                        </span>
                    </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase shrink-0">
                    Nivel {position.level}
                </span>
            </div>

            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {position.objective}
            </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1">
                <Cpu size={12} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-600">
                    {position.erpTools.length} Módulos ERP
                </span>
            </div>
            <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Ficha Técnica <ChevronRight size={13} />
            </span>
        </div>
    </div>
);
