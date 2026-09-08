import React, { useState, useMemo } from 'react';
import { 
    FileText, Download, Search, ChevronRight, ChevronDown, 
    Award, CheckCircle2, Cpu, Layers, ShieldCheck, Briefcase, 
    Anchor, DollarSign, ArrowRight, BookOpen, Clock, Building2, ExternalLink,
    Ship, Fuel, FileSpreadsheet, UserCheck, GitFork
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoPetral from '../../assets/Logo.Petral.png';

export interface MofRole {
    id: string;
    code: string;
    personName: string;
    title: string;
    shortTitle: string;
    department: string;
    assignedAsset?: string;
    immediateBoss: string;
    subordinates: string;
    mainPurpose: string;
    coreResponsibilities: {
        num: string;
        activity: string;
        erpModule: string;
        erpRoute: string;
        frequency: 'Diaria' | 'Por Viaje Real' | 'Mensual' | 'Anual' | 'A Demanda';
        deliverable: string;
    }[];
    systemPermissions: {
        moduleName: string;
        accessLevel: 'Control Total (Editor)' | 'Consulta & Auditoría (Visor)';
        keyActions: string;
    }[];
    kpiIndicators: {
        metric: string;
        target: string;
        erpSource: string;
    }[];
    competencies: string[];
}

export const MOF_ROLES: MofRole[] = [
    {
        id: 'mof-fernando',
        code: 'MOF-DIR-01',
        personName: 'Fernando',
        title: 'Gerente General (GG) / Dirección General',
        shortTitle: 'Gerente General',
        department: 'Dirección General & Estrategia Naviera',
        assignedAsset: 'Flota Consolidada Petral',
        immediateBoss: 'Directorio Naviera Petral S.A.',
        subordinates: 'Iosef (Comercial), Maria Elena (Op. Moquegua), Jorge (Op. Tablones), Sandra (Liquidaciones)',
        mainPurpose: 'Liderar la estrategia naviera, aprobar presupuestos anuales (PB 2027), supervisar el Time Charter Equivalent (TCE) y auditar el margen bruto consolidado de la flota.',
        coreResponsibilities: [
            {
                num: '1.1',
                activity: 'Aprobación y Cierre de Presupuestos Anuales de la Flota',
                erpModule: 'Maestro de Presupuestos',
                erpRoute: '/budgets',
                frequency: 'Anual',
                deliverable: 'Acta de Presupuesto Base PB 2027 sellada en base de datos.'
            },
            {
                num: '1.2',
                activity: 'Monitoreo de Rentabilidad y Margen Bruto Consolidado',
                erpModule: 'Matriz Financiera Consolidada',
                erpRoute: '/dashboard',
                frequency: 'Mensual',
                deliverable: 'Estado de Resultados P&L de la Flota por Cliente y Buque.'
            },
            {
                num: '1.3',
                activity: 'Evaluación de Acuerdos Marco y Fletamento de Naves',
                erpModule: 'Maestro de Contratos',
                erpRoute: '/contracts',
                frequency: 'A Demanda',
                deliverable: 'Aprobación de Addendas y Contratos COA de Transporte (SPCC, NEXA).'
            },
            {
                num: '1.4',
                activity: 'Auditoría Forense de Seguridad y Bóveda de Dispositivos',
                erpModule: 'Device Vault & Seguridad',
                erpRoute: '/device-vault',
                frequency: 'Mensual',
                deliverable: 'Revisión de autorizaciones de acceso y bitácora de auditoría.'
            }
        ],
        systemPermissions: [
            { moduleName: 'Matriz Financiera & Forecast', accessLevel: 'Consulta & Auditoría (Visor)', keyActions: 'Inspección de ingresos netos, costos de búnker y margen acumulado.' },
            { moduleName: 'Maestro de Presupuestos', accessLevel: 'Control Total (Editor)', keyActions: 'Bloqueo, versionado y sellado oficial del Presupuesto Base PB 2027.' },
            { moduleName: 'Libro de Auditoría Forense', accessLevel: 'Consulta & Auditoría (Visor)', keyActions: 'Trazabilidad de modificaciones de tarifas y accesos.' }
        ],
        kpiIndicators: [
            { metric: 'Margen Bruto de Flota', target: '> 18.5% sobre flete neto', erpSource: 'Matriz Financiera Consolidada' },
            { metric: 'TCE Promedio Ponderado Diario', target: '> $12,500 USD/día', erpSource: 'Matriz Financiera / Proyecciones' },
            { metric: 'Cumplimiento Presupuestal Consolidado', target: '95% - 105% vs Presupuesto Base', erpSource: 'Maestro de Presupuestos' }
        ],
        competencies: ['Liderazgo Estratégico Naviero', 'Gestión Financiera de Buques', 'Negociación Marítima Internacional', 'Gobierno Corporativo']
    },
    {
        id: 'mof-iosef',
        code: 'MOF-COM-01',
        personName: 'Iosef',
        title: 'Gerente Comercial (G Comercial) & Fletamentos',
        shortTitle: 'Gerente Comercial',
        department: 'Gerencia Comercial & Chartering',
        assignedAsset: 'Contratos & Fletamentos Spot / COA',
        immediateBoss: 'Fernando (Gerente General)',
        subordinates: 'Gestión comercial directa de clientes y brokers marítimos',
        mainPurpose: 'Estructurar y asegurar los contratos de fletamento marítimo (COA / Spot), optimizar el Net Revenue, fijar tarifas con Motor BAF y modelar el forecast comercial mensual.',
        coreResponsibilities: [
            {
                num: '2.1',
                activity: 'Modelado y Construcción de Escenarios de Forecast Comercial',
                erpModule: 'Matriz Financiera & Forecast',
                erpRoute: '/dashboard',
                frequency: 'Mensual',
                deliverable: 'Escenario Comercial Oficial guardado (ej. Escenario Base H2 2026).'
            },
            {
                num: '2.2',
                activity: 'Cotización Rápida Spot Multipiernas con Motor BAF',
                erpModule: 'Multicotizador Spot',
                erpRoute: '/multicotizador',
                frequency: 'Diaria',
                deliverable: 'Cotización Oficial Foxit-Ready en PDF emitida a clientes.'
            },
            {
                num: '2.3',
                activity: 'Parametrización de Contratos y Cláusulas de Búnker BAF',
                erpModule: 'Precios de Búnker & Fórmulas BAF',
                erpRoute: '/bunker-prices',
                frequency: 'Mensual',
                deliverable: 'Matriz de Escalación de Combustible actualizada con precios Platt/Refinería.'
            },
            {
                num: '2.4',
                activity: 'Gestión y Mantenimiento del Catálogo de Clientes',
                erpModule: 'Maestro de Clientes & Contratos',
                erpRoute: '/clients',
                frequency: 'A Demanda',
                deliverable: 'Fichas de clientes (SPCC, NEXA, Shougang, etc.) y términos de flete.'
            }
        ],
        systemPermissions: [
            { moduleName: 'Multicotizador Spot & Multipiernas', accessLevel: 'Control Total (Editor)', keyActions: 'Creación, cálculo, guardado y exportación de cotizaciones spot.' },
            { moduleName: 'Matriz Financiera & Escenarios', accessLevel: 'Control Total (Editor)', keyActions: 'Modificación de tarifas en caliente, guardado de proyecciones y exportación Excel/PDF.' },
            { moduleName: 'Maestro de Contratos & Clientes', accessLevel: 'Control Total (Editor)', keyActions: 'Alta y edición de contratos COA y tarifas base por ruta.' }
        ],
        kpiIndicators: [
            { metric: 'Net Revenue Comercial Mensual', target: '> $1,800,000 USD/mes', erpSource: 'Matriz Financiera' },
            { metric: 'Tarifa Media por TM Transportada', target: '> $14.50 USD/TM', erpSource: 'Multicotizador / Contratos' },
            { metric: 'Tasa de Éxito de Cotizaciones Spot', target: '> 40% convertidas a viajes', erpSource: 'Maestro de Cotizaciones' }
        ],
        competencies: ['Chartering & Negociación Marítima', 'Modelación Financiera de Fletes', 'Derecho Marítimo (Charters Parties)', 'Gestión de Clientes Corporativos']
    },
    {
        id: 'mof-maria-elena',
        code: 'MOF-OPS-01',
        personName: 'Maria Elena',
        title: 'Operadora de Buque — M/N MOQUEGUA',
        shortTitle: 'Operadora M/N MOQUEGUA',
        department: 'Operaciones Marítimas',
        assignedAsset: '🚢 M/N MOQUEGUA (DWT 28,000 MT / Draft 9.8m)',
        immediateBoss: 'Fernando (Gerente General)',
        subordinates: 'Coordinación con Capitán, Agencias Portuarias y Proveedores de Búnker',
        mainPurpose: 'Asegurar la operación náutica, portuaria y de carga eficiente del buque M/N MOQUEGUA, minimizando demoras, supervisando consumos de combustible y auditando costos de puerto.',
        coreResponsibilities: [
            {
                num: '3.1',
                activity: 'Monitoreo Diario de Navegación y Consumo (Noon Reports)',
                erpModule: 'Maestro de Buques & Specs',
                erpRoute: '/vessels',
                frequency: 'Diaria',
                deliverable: 'Bitácora Diaria de Posición, Velocidad y Consumo IFO/MDO del MOQUEGUA.'
            },
            {
                num: '3.2',
                activity: 'Coordinación Portuaria de Atraque y Operaciones de Muelle',
                erpModule: 'Catálogo de Puertos & Terminales',
                erpRoute: '/ports',
                frequency: 'Por Viaje Real',
                deliverable: 'Statement of Facts (SOF) y Reporte de Laytime Carga/Descarga.'
            },
            {
                num: '3.3',
                activity: 'Validación de Proformas y Costos Portuarios (PDA)',
                erpModule: 'Maestro de Costos Portuarios',
                erpRoute: '/port-costs',
                frequency: 'Por Viaje Real',
                deliverable: 'Proforma Portuaria (PDA) autorizada para remolque, practicaje y muellaje.'
            },
            {
                num: '3.4',
                activity: 'Supervisión de Suministro de Combustible (Bunkering)',
                erpModule: 'Precios & Inventario de Búnker',
                erpRoute: '/bunker-prices',
                frequency: 'A Demanda',
                deliverable: 'Bunker Delivery Note (BDN) y control de densidades abordo.'
            }
        ],
        systemPermissions: [
            { moduleName: 'Maestro de Buques (Specs MOQUEGUA)', accessLevel: 'Control Total (Editor)', keyActions: 'Edición de consumos nominales, calados, velocidades y capacidades.' },
            { moduleName: 'Maestro de Costos Portuarios', accessLevel: 'Control Total (Editor)', keyActions: 'Carga de tarifas portuarias de puertos de escala del MOQUEGUA.' },
            { moduleName: 'Catálogo de Puertos & Rutas', accessLevel: 'Consulta & Auditoría (Visor)', keyActions: 'Consulta de distancias náuticas, calados máximos y restricciones.' }
        ],
        kpiIndicators: [
            { metric: 'Tasa de Ocupación Efectiva MOQUEGUA', target: '> 92% días en mar/operación', erpSource: 'Bitácora de Buques' },
            { metric: 'Desviación de Consumo IFO 380', target: '< 1.5% vs curva teórica', erpSource: 'Control de Búnker' },
            { metric: 'Eficiencia en Muelle (Turnaround)', target: '< 48 horas promedio por escala', erpSource: 'Maestro de Puertos' }
        ],
        competencies: ['Operaciones Náuticas & Estiba', 'Laytime & Demurrage Management', 'Coordinación Portuaria', 'Control de Bunkering']
    },
    {
        id: 'mof-jorge',
        code: 'MOF-OPS-02',
        personName: 'Jorge',
        title: 'Operador de Buque — M/N TABLONES',
        shortTitle: 'Operador M/N TABLONES',
        department: 'Operaciones Marítimas',
        assignedAsset: '🚢 M/N TABLONES (DWT 25,000 MT / Draft 9.2m)',
        immediateBoss: 'Fernando (Gerente General)',
        subordinates: 'Coordinación con Capitán, Agencias Portuarias y Proveedores de Búnker',
        mainPurpose: 'Asegurar la operación náutica, portuaria y de carga eficiente del buque M/N TABLONES, coordinando rotaciones de cabotaje e internacional y controlando costos operativos.',
        coreResponsibilities: [
            {
                num: '4.1',
                activity: 'Monitoreo Diario de Travesía y Rendimiento del TABLONES',
                erpModule: 'Maestro de Buques & Specs',
                erpRoute: '/vessels',
                frequency: 'Diaria',
                deliverable: 'Reporte Operativo Diario (Daily Noon Report) del TABLONES.'
            },
            {
                num: '4.2',
                activity: 'Gestión de Escalas Portuarias y Agenciamiento Marítimo',
                erpModule: 'Catálogo de Puertos & Terminales',
                erpRoute: '/ports',
                frequency: 'Por Viaje Real',
                deliverable: 'Nombramiento de Agentes Portuarios y Seguimiento de Operaciones.'
            },
            {
                num: '4.3',
                activity: 'Control de Costos Portuarios y Tarifas de Terminal',
                erpModule: 'Maestro de Costos Portuarios',
                erpRoute: '/port-costs',
                frequency: 'Por Viaje Real',
                deliverable: 'Auditoría de Gastos de Practicaje, Remolcadores y Amarre en Terminales.'
            },
            {
                num: '4.4',
                activity: 'Recepción y Control de Búnker (MDO / IFO)',
                erpModule: 'Precios & Inventario de Búnker',
                erpRoute: '/bunker-prices',
                frequency: 'A Demanda',
                deliverable: 'BDN de búnker firmado y verificación de consumos en puerto.'
            }
        ],
        systemPermissions: [
            { moduleName: 'Maestro de Buques (Specs TABLONES)', accessLevel: 'Control Total (Editor)', keyActions: 'Edición de parámetros náuticos, velocidad ECO vs Full y capacidades.' },
            { moduleName: 'Maestro de Costos Portuarios', accessLevel: 'Control Total (Editor)', keyActions: 'Mantenimiento de tarifas portuarias de puertos de escala.' },
            { moduleName: 'Rutas Náuticas & Distancias', accessLevel: 'Consulta & Auditoría (Visor)', keyActions: 'Verificación de distancias en millas náuticas y tiempos de mar.' }
        ],
        kpiIndicators: [
            { metric: 'Tasa de Ocupación Efectiva TABLONES', target: '> 90% días operativos', erpSource: 'Bitácora de Buques' },
            { metric: 'Eficiencia de Combustible M/N TABLONES', target: '< 0.042 TM/Milla Náutica', erpSource: 'Control de Búnker' },
            { metric: 'Cero Demoras por Gestión Operativa', target: '0 horas imputables a coordinación', erpSource: 'Maestro de Puertos' }
        ],
        competencies: ['Navegación & Operaciones de Flota', 'Agenciamiento Portuario', 'Control de Combustibles Marinos', 'Resolución de Contingencias Náuticas']
    },
    {
        id: 'mof-sandra',
        code: 'MOF-FIN-01',
        personName: 'Sandra',
        title: 'Responsable de Liquidaciones & Control Financiero de Viajes Reales',
        shortTitle: 'Liquidaciones Viajes Reales',
        department: 'Liquidaciones Post-Fixture & Finanzas',
        assignedAsset: 'Liquidaciones de Viajes Reales (Flota Completa)',
        immediateBoss: 'Fernando (Gerente General)',
        subordinates: 'Conciliación con Contabilidad, Clientes y Proveedores Portuarios',
        mainPurpose: 'Ejecutar el cierre financiero y liquidación de cada viaje marítimo real, auditando fletes facturados, facturas de búnker, cuentas de desembolso final de puertos (FDA) y demoras.',
        coreResponsibilities: [
            {
                num: '5.1',
                activity: 'Liquidación Contable y Financiera Post-Viaje Real',
                erpModule: 'Maestro de Liquidaciones de Viajes',
                erpRoute: '/liquidations',
                frequency: 'Por Viaje Real',
                deliverable: 'Acta de Liquidación Final de Viaje (Voyage Settlement Sheet).'
            },
            {
                num: '5.2',
                activity: 'Conciliación de Costos Portuarios Reales (FDA vs PDA)',
                erpModule: 'Maestro de Costos Portuarios',
                erpRoute: '/port-costs',
                frequency: 'Por Viaje Real',
                deliverable: 'Auditoría y Aprobación de Facturas Finales de Agencias Portuarias.'
            },
            {
                num: '5.3',
                activity: 'Cálculo Pericial de Cuentas de Demora y Despacho',
                erpModule: 'Multicotizador & Liquidaciones',
                erpRoute: '/multicotizador',
                frequency: 'Por Viaje Real',
                deliverable: 'Laytime & Demurrage Calculation Sheet para facturación a clientes.'
            },
            {
                num: '5.4',
                activity: 'Conciliación de Forecast Proyectado vs Margen Real',
                erpModule: 'Matriz Financiera & Proyecciones',
                erpRoute: '/dashboard',
                frequency: 'Mensual',
                deliverable: 'Informe Mensual de Desviaciones Forecast vs Real para Gerencia General.'
            }
        ],
        systemPermissions: [
            { moduleName: 'Maestro de Liquidaciones de Viajes', accessLevel: 'Control Total (Editor)', keyActions: 'Creación, edición, cierre y emisión de liquidaciones post-viaje.' },
            { moduleName: 'Matriz Financiera (Modo Conciliación)', accessLevel: 'Control Total (Editor)', keyActions: 'Auditoría de ingresos netos reales y costos incurridos.' },
            { moduleName: 'Ledger de Auditoría Forense', accessLevel: 'Consulta & Auditoría (Visor)', keyActions: 'Verificación de trazabilidad inmutable de transacciones.' }
        ],
        kpiIndicators: [
            { metric: 'Desviación Margen Real vs Proyectado', target: '< 3.0% de variación', erpSource: 'Liquidaciones vs Forecast' },
            { metric: 'Tiempo de Liquidación Post-Zarpe', target: '< 5 días laborables', erpSource: 'Maestro de Liquidaciones' },
            { metric: 'Conciliación de Facturas Portuarias FDA', target: '100% de facturas auditadas', erpSource: 'Maestro de Costos Portuarios' }
        ],
        competencies: ['Liquidaciones Marítimas Post-Fixture', 'Auditoría de Costos Portuarios & Búnker', 'Cálculo Pericial de Demurrage', 'Conciliación Financiera Naviera']
    }
];

export const MofManual_V2: React.FC = () => {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<MofRole>(MOF_ROLES[0]);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const filteredRoles = useMemo(() => {
        if (!searchTerm.trim()) return MOF_ROLES;
        const lower = searchTerm.toLowerCase();
        return MOF_ROLES.filter(r => 
            r.personName.toLowerCase().includes(lower) ||
            r.title.toLowerCase().includes(lower) ||
            r.code.toLowerCase().includes(lower) ||
            r.department.toLowerCase().includes(lower)
        );
    }, [searchTerm]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Header Corporativo */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <img src={logoPetral} alt="Petral Logo" className="h-10 w-auto object-contain rounded-lg" />
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                Estándar Operativo Canónico
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                                📋 Manual de Organización y Funciones (MOF)
                            </h1>
                            <p className="text-slate-400 text-sm sm:text-base max-w-3xl mt-1">
                                Perfiles de puesto, matrices de responsabilidades, permisos de acceso y flujos del ERP para los 5 integrantes de <span className="text-white font-semibold">Naviera Petral S.A.</span>
                            </p>
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            onClick={() => navigate('/company-organigram')}
                            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
                        >
                            <GitFork className="w-4 h-4" />
                            Ver Organigrama Oficial
                        </button>
                        <button
                            onClick={() => navigate('/docs')}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4 text-slate-400" />
                            Docs as Code
                        </button>
                    </div>
                </div>
            </div>

            {/* Layout Principal: Menú Lateral de Puestos + Contenido del MOF */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Panel Izquierdo: Lista de los 5 Integrantes */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                        
                        {/* Buscador de Puestos */}
                        <div className="relative mb-4">
                            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nombre o cargo..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>

                        {/* Lista de Roles */}
                        <div className="space-y-2">
                            {filteredRoles.map((role) => {
                                const isSelected = selectedRole.id === role.id;
                                return (
                                    <div
                                        key={role.id}
                                        onClick={() => setSelectedRole(role)}
                                        className={`
                                            p-3.5 rounded-2xl border transition-all cursor-pointer text-left
                                            ${isSelected 
                                                ? 'bg-gradient-to-r from-blue-950/80 to-indigo-950/60 border-blue-500 shadow-lg shadow-blue-500/10' 
                                                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'}
                                        `}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold tracking-wider text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                                                {role.code}
                                            </span>
                                            {role.assignedAsset && (
                                                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                                    <Ship className="w-3 h-3" />
                                                    {role.assignedAsset.split(' ')[1] || 'Flota'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-black text-white flex items-center gap-1.5 mt-1">
                                            {role.personName}
                                            <span className="text-xs font-normal text-slate-400">({role.shortTitle})</span>
                                        </p>
                                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                            {role.department}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer informativo */}
                        <div className="mt-5 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 text-center">
                            Naviera Petral S.A. • Estructura Oficial de 5 Integrantes
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Detalle Completo del MOF para el Puesto Seleccionado */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
                        
                        {/* Cabecera del Puesto */}
                        <div className="border-b border-slate-800 pb-6">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-black tracking-widest uppercase">
                                    {selectedRole.code}
                                </span>
                                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                    {selectedRole.department}
                                </span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                                {selectedRole.personName} — {selectedRole.title}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/60 text-xs">
                                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                                    <span className="text-slate-400 font-bold block mb-0.5">🏢 Jefe Inmediato Superior:</span>
                                    <strong className="text-slate-200">{selectedRole.immediateBoss}</strong>
                                </div>
                                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                                    <span className="text-slate-400 font-bold block mb-0.5">👥 Personal / Relaciones a Cargo:</span>
                                    <strong className="text-slate-200">{selectedRole.subordinates}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Misión y Propósito Principal */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Award className="w-4 h-4 text-amber-400" />
                                1. Misión & Propósito Principal del Cargo
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                                {selectedRole.mainPurpose}
                            </p>
                        </div>

                        {/* Matriz de Responsabilidades y Entregables ERP */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                2. Funciones, Actividades y Entregables Vinculados al ERP
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60">
                                            <th className="p-3 rounded-l-xl w-12">N°</th>
                                            <th className="p-3">Actividad / Responsabilidad</th>
                                            <th className="p-3">Módulo ERP</th>
                                            <th className="p-3">Frecuencia</th>
                                            <th className="p-3 rounded-r-xl">Entregable Oficial</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {selectedRole.coreResponsibilities.map((resp, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/40 transition">
                                                <td className="p-3 font-mono font-bold text-blue-400">{resp.num}</td>
                                                <td className="p-3 font-semibold text-white">{resp.activity}</td>
                                                <td className="p-3">
                                                    <button
                                                        onClick={() => navigate(resp.erpRoute)}
                                                        className="px-2 py-1 bg-slate-800 hover:bg-blue-600/30 hover:text-blue-200 text-slate-300 rounded-md border border-slate-700/60 text-[10px] font-semibold transition flex items-center gap-1"
                                                    >
                                                        {resp.erpModule}
                                                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                                    </button>
                                                </td>
                                                <td className="p-3 text-slate-400 font-medium">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                                                        {resp.frequency}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-300 text-[11px] leading-relaxed">
                                                    {resp.deliverable}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Permisos de Sistema y Niveles de Acceso */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-400" />
                                3. Políticas de Acceso y Permisos en el ERP PETRAL
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {selectedRole.systemPermissions.map((perm, idx) => (
                                    <div key={idx} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-white">{perm.moduleName}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                perm.accessLevel.includes('Editor') 
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                            }`}>
                                                {perm.accessLevel}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 leading-relaxed">
                                            {perm.keyActions}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* KPIs y Competencias Clave */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                            
                            {/* KPIs */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-blue-400" />
                                    4. Indicadores Clave de Desempeño (KPIs)
                                </h3>
                                <div className="space-y-2">
                                    {selectedRole.kpiIndicators.map((kpi, idx) => (
                                        <div key={idx} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-white">{kpi.metric}</span>
                                                <span className="font-mono font-bold text-emerald-400">{kpi.target}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400">
                                                Fuente ERP: <strong className="text-slate-300">{kpi.erpSource}</strong>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Competencias */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                                    5. Competencias Profesionales Exigidas
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedRole.competencies.map((comp, idx) => (
                                        <span 
                                            key={idx}
                                            className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-semibold flex items-center gap-1.5"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                            {comp}
                                        </span>
                                    ))}
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

            </div>

        </div>
    );
};

export default MofManual_V2;
