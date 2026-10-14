/**
 * mofManualData_V2.ts
 * ============================================================================
 * MANUAL DE ORGANIZACIÓN Y FUNCIONES (MOF) CANÓNICO — ESTÁNDAR NAVAL V2.5
 * NAVIERA PETRAL S.A. • DIRECCIÓN DE GESTIÓN HUMANA Y OPERACIONES
 * ============================================================================
 * Estructura de datos 100% desacoplada para los 6 perfiles corporativos clave:
 * 1. MOF-DIR-01: Fernando Harten (Gerente General / Dirección General)
 * 2. MOF-COM-01: Iosef Zavala (Gerente Comercial & Fletamentos)
 * 3. MOF-OPS-01: Maria Elena Castro (Operadora M/N MOQUEGUA)
 * 4. MOF-OPS-02: Jorge Neyra (Operador M/N TABLONES)
 * 5. MOF-FIN-01: Sandra Gálvez (Responsable de Liquidaciones Financieras)
 * 6. MOF-FIN-02: Patricia Rueda (Especialista en Costos Portuarios & FDA)
 */

export interface MofCoreResponsibility {
    num: string;
    activity: string;
    erpModule: string;
    erpRoute: string;
    frequency: 'Diaria' | 'Por Viaje Real' | 'Mensual' | 'Anual' | 'A Demanda';
    deliverable: string;
}

export interface MofSystemPermission {
    moduleName: string;
    accessLevel: 'Control Total (Editor)' | 'Consulta & Auditoría (Visor)';
    keyActions: string;
}

export interface MofKpiIndicator {
    metric: string;
    target: string;
    erpSource: string;
}

export interface MofRole_V2 {
    id: string;
    code: string;
    personName: string;
    title: string;
    shortTitle: string;
    department: string;
    assignedAsset: string;
    immediateBoss: string;
    subordinates: string;
    mainPurpose: string;
    regulatoryFramework: string[];
    coreResponsibilities: MofCoreResponsibility[];
    systemPermissions: MofSystemPermission[];
    kpiIndicators: MofKpiIndicator[];
    competencies: string[];
}

export const MOF_ROLES_V2: MofRole_V2[] = [
    {
        id: 'mof-fernando',
        code: 'MOF-DIR-01',
        personName: 'Fernando Harten',
        title: 'Gerente General (GG) / Dirección General',
        shortTitle: 'Gerente General',
        department: 'Dirección General & Estrategia Naviera',
        assignedAsset: 'Flota Consolidada Petral (B/T Moquegua, B/T Tablones, Concon Trader, Huemul)',
        immediateBoss: 'Directorio Naviera Petral S.A.',
        subordinates: 'Iosef Zavala (Gerente Comercial), Asesoría Legal Marítima y Auditoría Externa',
        mainPurpose: 'Liderar la estrategia naviera corporativa, aprobar presupuestos anuales (PB 2027), supervisar el Time Charter Equivalent (TCE) consolidado, validar la política de fletamentos marco y auditar el margen bruto de la flota de ácido sulfúrico y graneles.',
        regulatoryFramework: [
            'Ley General de Navegación y Comercio Marítimo (DICAPI)',
            'Código Internacional de Gestión de la Seguridad (Código ISM / SOLAS)',
            'Normas Internacionales de Información Financiera (NIIF / NIC 2)',
            'Gobernanza Corporativa y Cumplimiento Anticorrupción'
        ],
        coreResponsibilities: [
            {
                num: '1.1',
                activity: 'Aprobación y Cierre de Presupuestos Anuales de la Flota',
                erpModule: 'Maestro de Presupuestos',
                erpRoute: '/budgets',
                frequency: 'Anual',
                deliverable: 'Acta de Presupuesto Base PB 2027 sellada y bloqueada en base de datos.'
            },
            {
                num: '1.2',
                activity: 'Monitoreo de Rentabilidad y Margen Bruto Consolidado',
                erpModule: 'Matriz Financiera Consolidada',
                erpRoute: '/dashboard',
                frequency: 'Mensual',
                deliverable: 'Estado de Resultados P&L de la Flota por Cliente, Buque y Contrato.'
            },
            {
                num: '1.3',
                activity: 'Evaluación de Acuerdos Marco y Fletamento de Naves',
                erpModule: 'Maestro de Contratos',
                erpRoute: '/contracts',
                frequency: 'A Demanda',
                deliverable: 'Aprobación de Addendas y Contratos COA de Transporte (SPCC, NEXA, Shougang).'
            },
            {
                num: '1.4',
                activity: 'Auditoría Forense de Seguridad y Bóveda de Dispositivos',
                erpModule: 'Device Vault & Seguridad',
                erpRoute: '/device-vault',
                frequency: 'Mensual',
                deliverable: 'Revisión y revocación de autorizaciones de hardware y bitácora de auditoría.'
            }
        ],
        systemPermissions: [
            { 
                moduleName: 'Matriz Financiera & Forecast', 
                accessLevel: 'Consulta & Auditoría (Visor)', 
                keyActions: 'Inspección de ingresos netos, costos de búnker y margen acumulado por nave.' 
            },
            { 
                moduleName: 'Maestro de Presupuestos', 
                accessLevel: 'Control Total (Editor)', 
                keyActions: 'Bloqueo, versionado oficial y sellado del Presupuesto Base PB 2027.' 
            },
            { 
                moduleName: 'Libro de Auditoría Forense & Device Vault', 
                accessLevel: 'Control Total (Editor)', 
                keyActions: 'Aprobación final de terminales de acceso y trazabilidad inmutable.' 
            }
        ],
        kpiIndicators: [
            { metric: 'Margen Bruto Consolidado de Flota', target: '> 18.5% sobre flete neto', erpSource: 'Matriz Financiera Consolidada' },
            { metric: 'TCE Promedio Ponderado Diario', target: '> $12,500 USD/día', erpSource: 'Matriz Financiera / Proyecciones' },
            { metric: 'Cumplimiento Presupuestal Consolidado', target: '95% - 105% vs Presupuesto Base', erpSource: 'Maestro de Presupuestos' }
        ],
        competencies: [
            'Liderazgo Estratégico Naviero',
            'Gestión Financiera de Buques',
            'Negociación Marítima Internacional (Charter Parties)',
            'Gobierno Corporativo y Gestión de Riesgo Marítimo'
        ]
    },
    {
        id: 'mof-iosef',
        code: 'MOF-COM-01',
        personName: 'Iosef Zavala',
        title: 'Gerente Comercial (G Comercial) & Fletamentos',
        shortTitle: 'Gerente Comercial',
        department: 'Gerencia Comercial & Chartering',
        assignedAsset: 'Contratos Marco COA & Fletamentos Spot',
        immediateBoss: 'Fernando Harten (Gerente General)',
        subordinates: 'Subgrupo Operaciones (Maria Elena Castro, Jorge Neyra) y Subgrupo Liquidaciones & Costos (Sandra Gálvez, Patricia Rueda)',
        mainPurpose: 'Estructurar y asegurar los contratos de fletamento marítimo (COA / Spot), optimizar el Net Revenue por milla navegada, fijar tarifas con Motor BAF y modelar el forecast comercial mensual de toda la flota.',
        regulatoryFramework: [
            'Contratos Marítimos BIMCO (GENCON / ASBATANKVOY)',
            'Reglas de La Haya-Visby y Conhecimientos de Embarque (B/L)',
            'Normas de Cabotaje y Fletamento Fluvial y Marítimo',
            'Directrices de Escalación de Combustibles (Platts / Bunkerwire)'
        ],
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
                deliverable: 'Cotización Oficial Foxit-Ready en PDF emitida a clientes con cálculo TCE.'
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
            { 
                moduleName: 'Multicotizador Spot & Multipiernas', 
                accessLevel: 'Control Total (Editor)', 
                keyActions: 'Creación, cálculo, guardado y exportación de cotizaciones spot.' 
            },
            { 
                moduleName: 'Matriz Financiera & Escenarios', 
                accessLevel: 'Control Total (Editor)', 
                keyActions: 'Modificación de tarifas en caliente, guardado de proyecciones y exportación.' 
            },
            { 
                moduleName: 'Maestro de Contratos & Clientes', 
                accessLevel: 'Control Total (Editor)', 
                keyActions: 'Alta y edición de contratos COA y tarifas base por ruta comercial.' 
            }
        ],
        kpiIndicators: [
            { metric: 'Net Revenue Comercial Mensual', target: '> $1,800,000 USD/mes', erpSource: 'Matriz Financiera' },
            { metric: 'Tarifa Media por TM Transportada', target: '> $14.50 USD/TM', erpSource: 'Multicotizador / Contratos' },
            { metric: 'Tasa de Éxito de Cotizaciones Spot', target: '> 40% convertidas a viajes', erpSource: 'Maestro de Cotizaciones' }
        ],
        competencies: [
            'Chartering & Negociación Marítima Comercial',
            'Modelación Financiera de Fletes y BAF',
            'Derecho Marítimo (Charter Parties & Cláusulas Laytime)',
            'Gestión de Cuentas Mineras Corporativas'
        ]
    },
    {
        id: 'mof-maria-elena',
        code: 'MOF-OPS-01',
        personName: 'Maria Elena Castro',
        title: 'Operadora de Buque — M/N MOQUEGUA',
        shortTitle: 'Operadora M/N MOQUEGUA',
        department: 'Operaciones Marítimas',
        assignedAsset: '🚢 M/N MOQUEGUA (DWT 7,200 MT / Tanquero Quimiquero IMO II / Calado 7.20m)',
        immediateBoss: 'Iosef Zavala (Gerente Comercial)',
        subordinates: 'Coordinación náutica con Capitán, Agencias Portuarias, Terminales y Proveedores de Búnker',
        mainPurpose: 'Asegurar la operación náutica, portuaria y de bombeo eficiente del buque M/N MOQUEGUA, minimizando tiempos muertos (turnaround), supervisando consumos de combustible y auditando proformas portuarias PDA.',
        regulatoryFramework: [
            'Convenio MARPOL Anexo I y II (Prevención de Contaminación por Hidrocarburos y Químicos)',
            'Código Internacional para la Protección de Buques e Instalaciones (Código PBIP / ISPS)',
            'Reglamentos de Capitanías y Puertos del Perú (DICAPI)',
            'Manual de Operaciones de Carga y Descarga de Ácido Sulfúrico'
        ],
        coreResponsibilities: [
            {
                num: '3.1',
                activity: 'Monitoreo Diario de Navegación y Consumo (Noon Reports)',
                erpModule: 'Maestro de Buques & Specs',
                erpRoute: '/vessels',
                frequency: 'Diaria',
                deliverable: 'Bitácora Diaria de Posición, Velocidad y Consumo VLSFO/MDO del MOQUEGUA.'
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
                deliverable: 'Bunker Delivery Note (BDN) y control de densidades y sondas abordo.'
            }
        ],
        systemPermissions: [
            { 
                moduleName: 'Maestro de Buques (Specs MOQUEGUA)', 
                accessLevel: 'Control Total (Editor)', 
                keyActions: 'Edición de consumos nominales, calados, velocidades y capacidades.' 
            },
            { 
                moduleName: 'Maestro de Costos Portuarios', 
                accessLevel: 'Control Total (Editor)', 
                keyActions: 'Carga y validación de tarifas portuarias de puertos de escala del MOQUEGUA.' 
            },
            { 
                moduleName: 'Catálogo de Puertos & Rutas', 
                accessLevel: 'Consulta & Auditoría (Visor)', 
                keyActions: 'Consulta de distancias náuticas, calados máximos y restricciones.' 
            }
        ],
        kpiIndicators: [
            { metric: 'Tasa de Ocupación Efectiva MOQUEGUA', target: '> 92% días en mar/operación', erpSource: 'Bitácora de Buques' },
            { metric: 'Desviación de Consumo VLSFO / MDO', target: '< 1.5% vs curva teórica', erpSource: 'Control de Búnker' },
            { metric: 'Eficiencia en Muelle (Turnaround)', target: '< 48 horas promedio por escala', erpSource: 'Maestro de Puertos' }
        ],
        competencies: [
            'Operaciones Náuticas & Estiba de Quimiqueros',
            'Gestión de Laytime & Demurrage',
            'Agenciamiento y Coordinación Portuaria',
            'Supervisión y Control de Bunkering Marítimo'
        ]
    },
    {
        id: 'mof-jorge',
        code: 'MOF-OPS-02',
        personName: 'Jorge Neyra',
        title: 'Operador de Buque — M/N TABLONES',
        shortTitle: 'Operador M/N TABLONES',
        department: 'Operaciones Marítimas',
        assignedAsset: '🚢 M/N TABLONES (DWT 8,100 MT / Tanquero Quimiquero IMO II / Calado 7.60m)',
        immediateBoss: 'Iosef Zavala (Gerente Comercial)',
        subordinates: 'Coordinación náutica con Capitán, Agencias Portuarias, Terminales y Proveedores de Búnker',
        mainPurpose: 'Asegurar la operación náutica, portuaria y de carga eficiente del buque M/N TABLONES, coordinando rotaciones de cabotaje e internacional, controlando los consumos de búnker y auditando costos de escala.',
        regulatoryFramework: [
            'Convenio MARPOL Anexos I, II y VI (Control de Emisiones IMO 2020)',
            'Código PBIP / ISPS para Buques Tanqueros',
            'Normativas Portuarias de DIRECTEMAR (Chile) y DICAPI (Perú)',
            'Protocolo de Prevención de Derrames y Contingencias Ambientales'
        ],
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
                activity: 'Recepción y Control de Búnker (MDO / VLSFO)',
                erpModule: 'Precios & Inventario de Búnker',
                erpRoute: '/bunker-prices',
                frequency: 'A Demanda',
                deliverable: 'BDN de búnker firmado y verificación de consumos en puerto.'
            }
        ],
        systemPermissions: [
            { 
                moduleName: 'Maestro de Buques (Specs TABLONES)', 
                accessLevel: 'Control Total (Editor)', 
                keyActions: 'Edición de parámetros náuticos, velocidad ECO vs Full y capacidades.' 
            },
            { 
                moduleName: 'Maestro de Costos Portuarios', 
                accessLevel: 'Control Total (Editor)', 
                keyActions: 'Mantenimiento de tarifas portuarias de puertos de escala del TABLONES.' 
            },
            { 
                moduleName: 'Rutas Náuticas & Distancias', 
                accessLevel: 'Consulta & Auditoría (Visor)', 
                keyActions: 'Verificación de distancias en millas náuticas y tiempos de mar.' 
            }
        ],
        kpiIndicators: [
            { metric: 'Tasa de Ocupación Efectiva TABLONES', target: '> 90% días operativos', erpSource: 'Bitácora de Buques' },
            { metric: 'Eficiencia de Combustible M/N TABLONES', target: '< 0.042 TM/Milla Náutica', erpSource: 'Control de Búnker' },
            { metric: 'Cero Demoras por Gestión Operativa', target: '0 horas imputables a coordinación', erpSource: 'Maestro de Puertos' }
        ],
        competencies: [
            'Navegación & Operaciones de Flota Tanquera',
            'Agenciamiento y Coordinación Portuaria Binacional',
            'Control de Combustibles Marinos y Rendimiento',
            'Resolución de Contingencias Náuticas de Muelle'
        ]
    },
    {
        id: 'mof-sandra',
        code: 'MOF-FIN-01',
        personName: 'Sandra Gálvez',
        title: 'Responsable de Liquidaciones & Control Financiero de Viajes Reales',
        shortTitle: 'Liquidaciones Viajes Reales',
        department: 'Liquidaciones Post-Fixture & Finanzas',
        assignedAsset: 'Liquidaciones de Viajes Reales (Flota Completa)',
        immediateBoss: 'Iosef Zavala (Gerente Comercial)',
        subordinates: 'Trabajo conjunto con Patricia Rueda (Costos Portuarios), conciliación con Contabilidad y Clientes',
        mainPurpose: 'Ejecutar el cierre financiero y liquidación de cada viaje marítimo real (NVR), auditando fletes facturados, facturas de búnker, cuentas de desembolso final de puertos (FDA) y demoras (demurrage).',
        regulatoryFramework: [
            'Plan Contable General Empresarial (PCGE)',
            'Reglas de Liquidación de Estadías y Despacho (Charter Party Terms)',
            'Normas Tributarias para el Cabotaje Marítimo (SUNAT)',
            'Protocolo de Conciliación Bancaria y Comprobantes de Pago'
        ],
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
            { 
                moduleName: 'Maestro de Liquidaciones de Viajes', 
                accessLevel: 'Control Total (Editor)', 
                keyActions: 'Creación, edición, cierre y emisión de liquidaciones post-viaje.' 
            },
            { 
                moduleName: 'Matriz Financiera (Modo Conciliación)', 
                accessLevel: 'Control Total (Editor)', 
                keyActions: 'Auditoría de ingresos netos reales y costos incurridos.' 
            },
            { 
                moduleName: 'Ledger de Auditoría Forense', 
                accessLevel: 'Consulta & Auditoría (Visor)', 
                keyActions: 'Verificación de trazabilidad inmutable de transacciones.' 
            }
        ],
        kpiIndicators: [
            { metric: 'Desviación Margen Real vs Proyectado', target: '< 3.0% de variación', erpSource: 'Liquidaciones vs Forecast' },
            { metric: 'Tiempo de Liquidación Post-Zarpe', target: '< 5 días laborables', erpSource: 'Maestro de Liquidaciones' },
            { metric: 'Conciliación de Facturas Portuarias FDA', target: '100% de facturas auditadas', erpSource: 'Maestro de Costos Portuarios' }
        ],
        competencies: [
            'Liquidaciones Marítimas Post-Fixture',
            'Auditoría Forense de Costos Portuarios & Búnker',
            'Cálculo Pericial de Demurrage & Despatch',
            'Conciliación Financiera y Cierre Contable Naviero'
        ]
    },
    {
        id: 'mof-patricia',
        code: 'MOF-FIN-02',
        personName: 'Patricia Rueda',
        title: 'Especialista en Costos Portuarios & Liquidaciones',
        shortTitle: 'Costos Portuarios & FDA',
        department: 'Liquidaciones Post-Fixture & Costos Portuarios',
        assignedAsset: 'Costos Portuarios (PDA / FDA Flota)',
        immediateBoss: 'Iosef Zavala (Gerente Comercial)',
        subordinates: 'Trabajo conjunto con Sandra Gálvez (Liquidaciones) y Agencias Portuarias',
        mainPurpose: 'Gestionar y auditar la estructura integral de costos portuarios (proformas PDA y desembolsos finales FDA), controlando tarifas de agenciamiento, practicaje y muellaje en soporte directo a las liquidaciones de viajes reales.',
        regulatoryFramework: [
            'Tarifarios Oficiales de APM Terminals, DP World y TISUR',
            'Reglamento de Tarifas de la Autoridad Portuaria Nacional (APN)',
            'Disposiciones de Capitanía para Remolcaje y Practicaje',
            'Procedimientos de Auditoría Pericial de Cuentas de Escala'
        ],
        coreResponsibilities: [
            {
                num: '6.1',
                activity: 'Auditoría Exhaustiva de Cuentas de Desembolso Final (FDA vs PDA)',
                erpModule: 'Maestro de Costos Portuarios',
                erpRoute: '/port-costs',
                frequency: 'Por Viaje Real',
                deliverable: 'Cuadro de Conciliación Portuaria FDA vs PDA por buque y escala.'
            },
            {
                num: '6.2',
                activity: 'Parametrización y Actualización del Tarifario Portuario Oficial',
                erpModule: 'Catálogo de Puertos & Terminales',
                erpRoute: '/ports',
                frequency: 'Mensual / A Demanda',
                deliverable: 'Tarifario Oficial de Puertos Peruanos y Chilenos validado en ERP.'
            },
            {
                num: '6.3',
                activity: 'Conciliación de Costos Portuarios en Cierres de Viaje',
                erpModule: 'Maestro de Liquidaciones de Viajes',
                erpRoute: '/liquidations',
                frequency: 'Por Viaje Real',
                deliverable: 'Imputación de costos portuarios definitivos en la liquidación post-fixture.'
            },
            {
                num: '6.4',
                activity: 'Monitoreo de Variaciones Portuarias vs Presupuesto',
                erpModule: 'Matriz Financiera Consolidada',
                erpRoute: '/dashboard',
                frequency: 'Mensual',
                deliverable: 'Informe de Desviaciones de Costos Portuarios para Gerencia Comercial.'
            }
        ],
        systemPermissions: [
            { 
                moduleName: 'Maestro de Costos Portuarios', 
                accessLevel: 'Control Total (Editor)', 
                keyActions: 'Auditoría, validación y carga de tarifas portuarias reales PDA/FDA.' 
            },
            { 
                moduleName: 'Catálogo de Puertos & Terminales', 
                accessLevel: 'Control Total (Editor)', 
                keyActions: 'Mantenimiento de especificaciones y servicios portuarios por terminal.' 
            },
            { 
                moduleName: 'Maestro de Liquidaciones de Viajes', 
                accessLevel: 'Control Total (Editor)', 
                keyActions: 'Cierre y conciliación del rubro de puertos en el acta de liquidación.' 
            },
            { 
                moduleName: 'Matriz Financiera Consolidada', 
                accessLevel: 'Consulta & Auditoría (Visor)', 
                keyActions: 'Supervisión de costos portuarios reales vs proyectados.' 
            }
        ],
        kpiIndicators: [
            { metric: 'Auditoría de Facturas Portuarias FDA', target: '100% de facturas conciliadas', erpSource: 'Maestro de Costos Portuarios' },
            { metric: 'Desviación PDA vs FDA Real', target: '< 2.5% de variación por escala', erpSource: 'Costos Portuarios vs Liquidaciones' },
            { metric: 'Tiempo de Conciliación Portuaria', target: '< 72 horas post-zarpe', erpSource: 'Control de Liquidaciones' }
        ],
        competencies: [
            'Auditoría Pericial de Costos Portuarios (PDA/FDA)',
            'Tarifarios de Terminales y Agencias Marítimas',
            'Liquidación Financiera Naviera',
            'Control de Costos Operativos de Escala'
        ]
    }
];
