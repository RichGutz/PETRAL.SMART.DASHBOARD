import React, { useState, useMemo } from 'react';
import { 
    FileText, Download, Search, ChevronRight, ChevronDown, 
    Award, CheckCircle2, Cpu, Layers, ShieldCheck, Briefcase, 
    Anchor, DollarSign, ArrowRight, BookOpen, Clock, Building2, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoPetral from '../../assets/Logo.Petral.png';

interface MofRole {
    id: string;
    code: string;
    title: string;
    department: string;
    immediateBoss: string;
    subordinates: string;
    mainPurpose: string;
    coreResponsibilities: {
        num: string;
        activity: string;
        erpModule: string;
        frequency: 'Diaria' | 'Por Viaje' | 'Mensual' | 'Anual' | 'A Demanda';
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

const MOF_ROLES: MofRole[] = [
    {
        id: 'mof-1',
        code: 'MOF-DIR-01',
        title: 'Gerente General / Director Ejecutivo',
        department: 'Dirección General & Estrategia',
        immediateBoss: 'Directorio Naviera Petral S.A.',
        subordinates: 'Gerente Comercial, Superintendente de Operaciones, Oficial de Seguridad TI',
        mainPurpose: 'Liderar la estrategia de fletamentos, aprobar presupuestos corporativos y velar por el Time Charter Equivalent (TCE) y Margen Bruto de la flota.',
        coreResponsibilities: [
            {
                num: '1.1',
                activity: 'Aprobación y Cierre de Presupuestos Anuales de la Flota',
                erpModule: 'Maestro de Presupuestos (/budgets)',
                frequency: 'Anual',
                deliverable: 'Acta de Presupuesto Base PB 2027 sellada en base de datos.'
            },
            {
                num: '1.2',
                activity: 'Monitoreo de Rentabilidad y Margen Bruto Consolidado',
                erpModule: 'Matriz Financiera (/dashboard)',
                frequency: 'Mensual',
                deliverable: 'Estado de Resultados P&L de la Flota por Cliente y Buque.'
            },
            {
                num: '1.3',
                activity: 'Evaluación de Contratos Marco y Fletamento de Naves',
                erpModule: 'Maestro de Contratos (/contracts)',
                frequency: 'A Demanda',
                deliverable: 'Aprobación de Addendas y Contratos COA de Transporte.'
            }
        ],
        systemPermissions: [
            { moduleName: 'Matriz Financiera & Forecast', accessLevel: 'Consulta & Auditoría (Visor)', keyActions: 'Inspección de ingresos netos, costos de búnker y margen acumulado.' },
            { moduleName: 'Maestro de Presupuestos', accessLevel: 'Control Total (Editor)', keyActions: 'Bloqueo, versionado y liberación de presupuestos anuales.' },
            { moduleName: 'Libro de Auditoría Forense', accessLevel: 'Consulta & Auditoría (Visor)', keyActions: 'Trazabilidad de modificaciones de tarifas y usuarios.' }
        ],
        kpiIndicators: [
            { metric: 'Margen Bruto de Flota', target: '> 18.5% sobre flete neto', erpSource: 'Matriz Financiera Consolidada' },
            { metric: 'TCE Promedio Diario', target: '> $12,500 USD/día', erpSource: 'Voyage Ledger / Matriz Financiera' },
            { metric: 'Cumplimiento Presupuestal', target: '95% - 105% vs Presupuesto Base', erpSource: 'Maestro de Presupuestos' }
        ],
        competencies: ['Liderazgo Estratégico Naviero', 'Gestión Financiera de Buques', 'Negociación Marítima Internacional']
    },
    {
        id: 'mof-2',
        code: 'MOF-COM-01',
        title: 'Gerente Comercial & Fletamentos (Chartering Manager)',
        department: 'Gerencia Comercial',
        immediateBoss: 'Gerente General',
        subordinates: 'Operador Comercial / Cotizador Spot',
        mainPurpose: 'Estructurar y asegurar los contratos de fletamento marítimo (COA / Spot), optimizar el Net Revenue y definir políticas comerciales de flete.',
        coreResponsibilities: [
            {
                num: '2.1',
                activity: 'Modelado y Construcción de Escenarios de Proyección',
                erpModule: 'Matriz Financiera & Forecast (/dashboard)',
                frequency: 'Mensual',
                deliverable: 'Escenario Comercial Oficial (ej. Escenario Base H2 2026).'
            },
            {
                num: '2.2',
                activity: 'Parametrización de Contratos y Fórmulas BAF',
                erpModule: 'Maestro de Contratos & Cierres (/contracts)',
                frequency: 'Por Viaje',
                deliverable: 'Registro de Tarifas Flat, Flete por MT y Tiers BAF.'
            },
            {
                num: '2.3',
                activity: 'Validación de Rentabilidad en Cotizaciones Spot',
                erpModule: 'Multicotizador Spot (/multicotizador)',
                frequency: 'Diaria',
                deliverable: 'Aprobación de Cotización Multipiernas y Flete Mínimo.'
            }
        ],
        systemPermissions: [
            { moduleName: 'Matriz Financiera', accessLevel: 'Control Total (Editor)', keyActions: 'Edición en caliente de fletes, inyección de viajes y guardado en BD.' },
            { moduleName: 'Multicotizador Spot', accessLevel: 'Control Total (Editor)', keyActions: 'Creación de piernas, override de demoras y exportación a Matriz.' },
            { moduleName: 'Maestro de Clientes', accessLevel: 'Control Total (Editor)', keyActions: 'Alta de clientes mineros/industriales (SPCC, NEXA, Shougang).' }
        ],
        kpiIndicators: [
            { metric: 'Net Revenue Mensual', target: '> $1,800,000 USD/mes', erpSource: 'Matriz Financiera' },
            { metric: 'Margen de Flete Spot', target: '> $3.20 USD/MT de margen neto', erpSource: 'Multicotizador Spot' },
            { metric: 'Tasa de Cierre de Cotizaciones', target: '> 45% cotizaciones cerradas', erpSource: 'Maestro de Cotizaciones' }
        ],
        competencies: ['Chartering & Negociación de Fletes', 'Modelado Financiero Marítimo', 'Derecho Marítimo Comercial']
    },
    {
        id: 'mof-3',
        code: 'MOF-COM-02',
        title: 'Operador Comercial / Cotizador Spot',
        department: 'Gerencia Comercial',
        immediateBoss: 'Gerente Comercial & Fletamentos',
        subordinates: 'Ninguno',
        mainPurpose: 'Calcular con rapidez y precisión técnica las cotizaciones de viajes spot marítimos para clientes activos y nuevos prospectos.',
        coreResponsibilities: [
            {
                num: '3.1',
                activity: 'Simulación de Viajes Spot Multipuertos',
                erpModule: 'Multicotizador Spot (/multicotizador)',
                frequency: 'Diaria',
                deliverable: 'Ficha de Cotización con desglose de Flete, Búnker y Puertos.'
            },
            {
                num: '3.2',
                activity: 'Cálculo de Tiempos de Navegación y Permanencia',
                erpModule: 'Maestro de Distancias (/routes) y Puertos (/ports)',
                frequency: 'Por Viaje',
                deliverable: 'Estimación de días mar (d_mar) y días puerto (d_puerto).'
            },
            {
                num: '3.3',
                activity: 'Exportación de Cotizaciones Aprobadas hacia la Matriz',
                erpModule: 'Multicotizador (/multicotizador)',
                frequency: 'Por Viaje',
                deliverable: 'Inyección de viajes en la grilla mensual del Forecast.'
            }
        ],
        systemPermissions: [
            { moduleName: 'Multicotizador Spot', accessLevel: 'Control Total (Editor)', keyActions: 'Modificación de tramos, toneladas MT, selección de buque y modo demora.' },
            { moduleName: 'Maestro de Cotizaciones', accessLevel: 'Control Total (Editor)', keyActions: 'Guardado, duplicado y recuperación de cotizaciones históricas.' },
            { moduleName: 'Maestro de Puertos & Distancias', accessLevel: 'Consulta & Auditoría (Visor)', keyActions: 'Consulta de millas náuticas y ritmos de carga/descarga.' }
        ],
        kpiIndicators: [
            { metric: 'Tiempo de Emisión de Cotización', target: '< 15 minutos por solicitud', erpSource: 'Multicotizador Spot' },
            { metric: 'Convergencia de Costos', target: 'Delta < $0.01 vs Liquidación Real', erpSource: 'Loop QC MultiCotizador' },
            { metric: 'Volumen Cotizado Mensual', target: '> 150,000 MT/mes', erpSource: 'Maestro de Cotizaciones' }
        ],
        competencies: ['Navegación y Rutas del Pacífico Sur', 'Cálculo Matemático de Fletes', 'Manejo Ágil del ERP Delfos']
    },
    {
        id: 'mof-4',
        code: 'MOF-OPS-01',
        title: 'Superintendente de Operaciones Marítimas',
        department: 'Operaciones Marítimas & Flota',
        immediateBoss: 'Gerente General',
        subordinates: 'Capitanes de Flota, Analista de Búnker',
        mainPurpose: 'Asegurar la máxima disponibilidad operativa de los buques, supervisar el cumplimiento de itinerarios y controlar el consumo de búnker.',
        coreResponsibilities: [
            {
                num: '4.1',
                activity: 'Administración y Mantenimiento de la Flota',
                erpModule: 'Maestro de Flota (/vessels)',
                frequency: 'A Demanda',
                deliverable: 'Fichas técnicas actualizadas (DWT, LOA, Consumos MT/día).'
            },
            {
                num: '4.2',
                activity: 'Supervisión de Tiempos Operativos en Terminales',
                erpModule: 'Maestro de Puertos & Terminales (/ports)',
                frequency: 'Por Viaje',
                deliverable: 'Control de 4.0h fijas suplementarias (amarre y conexiado).'
            },
            {
                num: '4.3',
                activity: 'Trazabilidad de Tráfico Marítimo y Rutas',
                erpModule: 'Spaghetti Map (/spaghetti-map)',
                frequency: 'Diaria',
                deliverable: 'Seguimiento visual de trayectorias en el mapa GeoJSON.'
            }
        ],
        systemPermissions: [
            { moduleName: 'Maestro de Flota', accessLevel: 'Control Total (Editor)', keyActions: 'Edición de buques, matrices de consumo IFO/MDO y calados.' },
            { moduleName: 'Maestro de Puertos', accessLevel: 'Control Total (Editor)', keyActions: 'Actualización de ritmos de transferencia y tiempos de espera.' },
            { moduleName: 'Maestro de Distancias Náuticas', accessLevel: 'Control Total (Editor)', keyActions: 'Actualización de matriz de millas náuticas PE/CL.' }
        ],
        kpiIndicators: [
            { metric: 'Disponibilidad de Flota', target: '> 96% días operativos al año', erpSource: 'Maestro de Flota' },
            { metric: 'Eficiencia de Búnker Navegación', target: 'Consumo real vs Matriz < 2%', erpSource: 'Voyage Ledger' },
            { metric: 'Puntualidad en ETA Muelle', target: '> 92% arribos en ventana', erpSource: 'Spaghetti Map' }
        ],
        competencies: ['Gestión Técnica de Naves Tanqueras/Graneleras', 'Regulaciones Marítimas OMI/SOLAS', 'Logística Portuaria']
    },
    {
        id: 'mof-5',
        code: 'MOF-CST-01',
        title: 'Jefe de Costos Portuarios & Liquidaciones',
        department: 'Costos Portuarios & Control de Gestión',
        immediateBoss: 'Gerente Comercial / Gerente General',
        subordinates: 'Liquidador de Gastos Portuarios',
        mainPurpose: 'Tarificar, auditar y fiscalizar el 100% de los desembolsos portuarios bajo la fórmula PxQ y bandas arancelarias oficiales.',
        coreResponsibilities: [
            {
                num: '5.1',
                activity: 'Gestión de Tarifarios Portuarios Oficiales',
                erpModule: 'Maestro de Tarifas Portuarias (/port-tariffs)',
                frequency: 'A Demanda',
                deliverable: 'Tarifas validadas de Practicaje, Remolcaje y Muellaje.'
            },
            {
                num: '5.2',
                activity: 'Auditoría Pericial de Liquidaciones de Agencias',
                erpModule: 'Liquidador de Gastos Portuarios (/liquidations-pdf-audit)',
                frequency: 'Por Viaje',
                deliverable: 'Acta de Auditoría Forense PxQ vs Factura de Agencia.'
            },
            {
                num: '5.3',
                activity: 'Control y Cobro de Demoras (Demurrage)',
                erpModule: 'Maestro de Demoras (/demurrage)',
                frequency: 'Por Viaje',
                deliverable: 'Liquidación de Días de Demora y Rate diario acordado.'
            }
        ],
        systemPermissions: [
            { moduleName: 'Tarifas & Gastos Portuarios', accessLevel: 'Control Total (Editor)', keyActions: 'Configuración de fórmulas PxQ, amarre, lanchas y Regla 6 OT.' },
            { moduleName: 'Maestro de Demoras', accessLevel: 'Control Total (Editor)', keyActions: 'Registro de tasas diarias de demora y overrides de cliente.' },
            { moduleName: 'Motor de Auditoría Dual', accessLevel: 'Control Total (Editor)', keyActions: 'Comparación proforma estimada vs facturación final.' }
        ],
        kpiIndicators: [
            { metric: 'Desvío en Gastos Portuarios', target: 'Menor a 3.0% vs Proforma', erpSource: 'Liquidador de Gastos Portuarios' },
            { metric: 'Ahorro por Auditoría de Facturas', target: '> $25,000 USD/trimestre', erpSource: 'Auditoría Dual' },
            { metric: 'Efectividad en Cobro de Demoras', target: '100% demoras facturadas', erpSource: 'Maestro de Demoras' }
        ],
        competencies: ['Aranceles Portuarios (APM, DPW, TISUR, SPCC)', 'Auditoría Forense de Facturación', 'Contabilidad de Costos']
    },
    {
        id: 'mof-6',
        code: 'MOF-BNK-01',
        title: 'Analista de Búnker & Rendimiento Energético',
        department: 'Operaciones & Combustibles',
        immediateBoss: 'Superintendente de Operaciones Marítimas',
        subordinates: 'Ninguno',
        mainPurpose: 'Monitorear cotizaciones de combustibles marinos, registrar precios diarios y aplicar la homologación MDO/MGO y factor BAF.',
        coreResponsibilities: [
            {
                num: '6.1',
                activity: 'Actualización Diaria de Precios de Búnker',
                erpModule: 'Maestro de Precios de Búnker (/bunker-prices)',
                frequency: 'Diaria',
                deliverable: 'Tarifario diario de VLSFO e IFO/MDO por puerto de suministro.'
            },
            {
                num: '6.2',
                activity: 'Homologación de Facturación MGO ➔ MDO',
                erpModule: 'Búnker & Voyage Ledger (/bunker-prices)',
                frequency: 'Por Viaje',
                deliverable: 'Unificación de compras bajo el estándar corporativo MDO.'
            },
            {
                num: '6.3',
                activity: 'Cálculo de Factor BAF Contractual',
                erpModule: 'Flujograma / Motor BAF (/system-flowchart)',
                frequency: 'Mensual',
                deliverable: 'Cálculo de ajuste de flete por variación de combustible.'
            }
        ],
        systemPermissions: [
            { moduleName: 'Maestro de Búnker', accessLevel: 'Control Total (Editor)', keyActions: 'Ingreso de precios Spot por puerto (Callao, Balboa, Mejillones).' },
            { moduleName: 'Maestro Originación', accessLevel: 'Control Total (Editor)', keyActions: 'Configuración de fuentes de suministro y capacidades.' }
        ],
        kpiIndicators: [
            { metric: 'Actualización de Precios Búnker', target: '100% días hábiles actualizados', erpSource: 'Maestro de Búnker' },
            { metric: 'Alineación de Homologación MDO', target: 'Cero discrepancias en facturas MGO', erpSource: 'Maestro de Búnker' },
            { metric: 'Precisión del BAF', target: 'Delta = 0.00 vs contrato marco', erpSource: 'Motor BAF' }
        ],
        competencies: ['Mercado Spot de Combustibles Marinos', 'Química de Combustibles (VLSFO / MDO)', 'Análisis Estadístico']
    },
    {
        id: 'mof-7',
        code: 'MOF-SEC-01',
        title: 'Oficial de Seguridad TI & Administrador de Plataforma',
        department: 'Tecnología, Seguridad & Cumplimiento',
        immediateBoss: 'Gerente General',
        subordinates: 'Ninguno',
        mainPurpose: 'Blindar el acceso a la plataforma mediante Device Vault (Zero-Trust), administrar permisos y garantizar la disponibilidad 24/7.',
        coreResponsibilities: [
            {
                num: '7.1',
                activity: 'Control y Autorización de Estaciones de Trabajo',
                erpModule: 'Device Vault (/device-vault)',
                frequency: 'A Demanda',
                deliverable: 'Aprobación o Revocación de huellas de hardware (GPU/CPU).'
            },
            {
                num: '7.2',
                activity: 'Gestión de Cuentas de Usuario y Roles',
                erpModule: 'Gestión de Usuarios & Permisos (/users)',
                frequency: 'A Demanda',
                deliverable: 'Configuración de roles Admin, Editor o Visor en DB.'
            },
            {
                num: '7.3',
                activity: 'Auditoría de Seguridad y Trazabilidad Transaccional',
                erpModule: 'Libro de Auditoría (Audit Ledger) (/audit-ledger)',
                frequency: 'Diaria',
                deliverable: 'Bitácora inalterable de accesos y cambios en producción.'
            }
        ],
        systemPermissions: [
            { moduleName: 'Device Vault (Bóveda de Equipos)', accessLevel: 'Control Total (Editor)', keyActions: 'Autorizar, revocar y auditar estaciones de trabajo.' },
            { moduleName: 'Usuarios & Permisos', accessLevel: 'Control Total (Editor)', keyActions: 'Creación de usuarios, reseteo de claves y asignación de permisos.' },
            { moduleName: 'Libro de Auditoría', accessLevel: 'Control Total (Editor)', keyActions: 'Revisión forense de eventos de seguridad y sesiones activas.' }
        ],
        kpiIndicators: [
            { metric: 'Uptime del Sistema en VPS', target: '99.9% disponibilidad anual', erpSource: 'Servidor VPS Producción' },
            { metric: 'Tiempo de Aprobación de Equipos', target: '< 5 minutos desde solicitud', erpSource: 'Device Vault' },
            { metric: 'Incidentes de Seguridad', target: '0 brechas de acceso no autorizado', erpSource: 'Audit Ledger' }
        ],
        competencies: ['Ciberseguridad & Zero-Trust', 'Administración Linux / Nginx / PostgreSQL', 'Auditoría Forense Digital']
    }
];

export const MofManual_V2: React.FC = () => {
    const navigate = useNavigate();
    const [selectedRoleId, setSelectedRoleId] = useState<string>('mof-1');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        responsibilities: true,
        permissions: true,
        kpis: true,
        competencies: true
    });

    const toggleSection = (key: string) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredRoles = useMemo(() => {
        if (!searchTerm.trim()) return MOF_ROLES;
        const q = searchTerm.toLowerCase().trim();
        return MOF_ROLES.filter(r => 
            r.title.toLowerCase().includes(q) ||
            r.code.toLowerCase().includes(q) ||
            r.department.toLowerCase().includes(q) ||
            r.mainPurpose.toLowerCase().includes(q) ||
            r.coreResponsibilities.some(res => res.activity.toLowerCase().includes(q) || res.erpModule.toLowerCase().includes(q))
        );
    }, [searchTerm]);

    const currentRole = MOF_ROLES.find(r => r.id === selectedRoleId) || MOF_ROLES[0];

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 space-y-6 w-full max-w-full mx-auto pb-12 print:p-0 print:m-0 font-sans">
            
            {/* ── CABECERA PRINCIPAL CON LOGOS Y DESCARGA ── */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 w-full print:border-b-2 print:border-slate-800">
                <div className="flex items-center gap-4">
                    <img src={logoPetral} alt="Naviera Petral" className="h-10 object-contain" />
                    <div className="h-8 border-l border-slate-200 hidden md:block"></div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">MANUAL DE ORGANIZACIÓN Y FUNCIONES (MOF)</h2>
                        <span className="text-xs text-slate-500 font-bold tracking-wider uppercase block">DESCRIPCIÓN DE CARGOS Y RESPONSABILIDADES ASOCIADAS A LOS FLUJOS DEL ERP</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 print:hidden">
                    <div className="relative w-64">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar puesto, función o módulo..."
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <button 
                        onClick={handlePrint}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                    >
                        <Download size={14} /> Imprimir Ficha MOF
                    </button>
                </div>
            </div>

            {/* ── LAYOUT PRINCIPAL: SIDEBAR DE ROLES + FICHA DETALLADA ── */}
            <div className="flex flex-col lg:flex-row gap-6 items-start w-full min-w-0">
                
                {/* ── LISTA DE PUESTOS (IZQUIERDA - 320px) ── */}
                <div className="w-full lg:w-[320px] lg:min-w-[320px] lg:max-w-[320px] shrink-0 space-y-2 print:hidden">
                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Briefcase size={14} className="text-blue-600" /> Cargos Oficiales ({filteredRoles.length})
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">ERP v2.5</span>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 space-y-1 overflow-y-auto max-h-[750px]">
                        {filteredRoles.map(role => {
                            const isSelected = role.id === currentRole.id;
                            return (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRoleId(role.id)}
                                    className={`w-full text-left p-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col gap-1 border ${
                                        isSelected 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                            : 'bg-white text-slate-700 border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-extrabold ${
                                            isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {role.code}
                                        </span>
                                        <ChevronRight size={14} className={isSelected ? 'text-white' : 'text-slate-400'} />
                                    </div>
                                    <span className="truncate leading-tight text-xs">{role.title}</span>
                                    <span className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {role.department}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── FICHA TÉCNICA MOF DEL PUESTO (DERECHA - 100% ANCHO) ── */}
                <div className="flex-1 min-w-0 w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6 print:p-0 print:border-none">
                    
                    {/* ENCABEZADO DE FICHA MOF */}
                    <div className="border-b border-slate-200 pb-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200 uppercase">
                                    {currentRole.code}
                                </span>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                                    {currentRole.department}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                                Manual de Organización y Funciones • Naviera Petral S.A.
                            </span>
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{currentRole.title}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs font-medium text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div>
                                <span className="font-bold text-slate-800 block">👤 Superior Inmediato (Reporta a):</span>
                                <span className="text-slate-700">{currentRole.immediateBoss}</span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-800 block">👥 Personal a Cargo (Supervisa a):</span>
                                <span className="text-slate-700">{currentRole.subordinates}</span>
                            </div>
                        </div>
                    </div>

                    {/* 1. OBJETIVO / MISIÓN DEL CARGO */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <Award size={15} className="text-blue-600" /> 1. Misión y Objetivo Principal del Puesto
                        </h4>
                        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-slate-700 leading-relaxed font-medium">
                            {currentRole.mainPurpose}
                        </div>
                    </div>

                    {/* 2. RESPONSABILIDADES EN LOS FLUJOS DEL ERP */}
                    <div className="space-y-3">
                        <button
                            onClick={() => toggleSection('responsibilities')}
                            className="w-full flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide cursor-pointer py-1 select-none"
                        >
                            <span className="flex items-center gap-2">
                                <Cpu size={15} className="text-indigo-600" /> 2. Funciones &amp; Responsabilidades en los Flujos del Sistema ERP ({currentRole.coreResponsibilities.length})
                            </span>
                            {expandedSections.responsibilities ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
                        </button>

                        {expandedSections.responsibilities && (
                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-black uppercase text-slate-600">
                                            <th className="p-3 w-12 text-center">Ítem</th>
                                            <th className="p-3">Actividad / Función Operativa</th>
                                            <th className="p-3">Módulo / Ruta ERP</th>
                                            <th className="p-3 w-28 text-center">Frecuencia</th>
                                            <th className="p-3">Entregable / Resultado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {currentRole.coreResponsibilities.map((resp, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="p-3 font-mono font-bold text-center text-slate-500">{resp.num}</td>
                                                <td className="p-3 font-bold text-slate-800">{resp.activity}</td>
                                                <td className="p-3">
                                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-indigo-700 font-bold">
                                                        {resp.erpModule}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                        {resp.frequency}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-[11px] text-slate-600 font-medium">{resp.deliverable}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 3. MATRIZ DE PERMISOS EN EL SISTEMA */}
                    <div className="space-y-3">
                        <button
                            onClick={() => toggleSection('permissions')}
                            className="w-full flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide cursor-pointer py-1 select-none"
                        >
                            <span className="flex items-center gap-2">
                                <ShieldCheck size={15} className="text-emerald-600" /> 3. Mapeo de Accesos &amp; Niveles de Permiso en ERP
                            </span>
                            {expandedSections.permissions ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
                        </button>

                        {expandedSections.permissions && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {currentRole.systemPermissions.map((perm, idx) => (
                                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-xs font-black text-slate-800">{perm.moduleName}</span>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                                                perm.accessLevel.includes('Editor') 
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                            }`}>
                                                {perm.accessLevel}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-600">
                                            {perm.keyActions}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 4. INDICADORES CLAVE DE DESEMPEÑO (KPIS) */}
                    <div className="space-y-3">
                        <button
                            onClick={() => toggleSection('kpis')}
                            className="w-full flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wide cursor-pointer py-1 select-none"
                        >
                            <span className="flex items-center gap-2">
                                <Layers size={15} className="text-amber-600" /> 4. Indicadores Clave de Gestión (KPIs) Monitoreados en ERP
                            </span>
                            {expandedSections.kpis ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
                        </button>

                        {expandedSections.kpis && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {currentRole.kpiIndicators.map((kpi, idx) => (
                                    <div key={idx} className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl flex flex-col justify-between gap-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Métrica KPI</span>
                                            <span className="text-xs font-black text-slate-900 leading-tight block mt-0.5">{kpi.metric}</span>
                                        </div>
                                        <div className="pt-2 border-t border-amber-200/60 flex flex-col gap-0.5">
                                            <span className="text-[11px] font-black text-amber-900">Meta: {kpi.target}</span>
                                            <span className="text-[9.5px] text-slate-500 font-mono">Fuente: {kpi.erpSource}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 5. COMPETENCIAS TÉCNICAS */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide block">
                            5. Competencias Técnicas &amp; Perfil Requerido
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {currentRole.competencies.map((comp, idx) => (
                                <span key={idx} className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                                    <CheckCircle2 size={13} className="text-blue-600" /> {comp}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* PIE DE PÁGINA EDITORIAL OFICIAL */}
                    <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <div>MOF v2.5 • NAVIERA PETRAL S.A.</div>
                        <div>Documento Oficial de Organización &amp; Funciones</div>
                        <div>{new Date().toLocaleDateString('es-PE')}</div>
                    </div>

                </div>

            </div>

        </div>
    );
};
