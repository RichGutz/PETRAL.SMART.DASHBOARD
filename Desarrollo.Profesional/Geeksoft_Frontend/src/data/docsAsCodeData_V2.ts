/**
 * docsAsCodeData_V2.ts
 * ============================================================================
 * CORPUS CANÓNICO DE DOCUMENTACIÓN TÉCNICA Y OPERATIVA (DOCS-AS-CODE V2.5)
 * NAVIERA PETRAL S.A. • SHIPPING.SOFT ENTERPRISE
 * ============================================================================
 * Estructura de datos 100% desacoplada para los 19 módulos del sistema:
 * - 11 Módulos de Datos Maestros (Físicos, Comerciales, Costos y Búnker)
 * - 8 Módulos de Herramientas Analíticas, Motores Financieros y Ciberseguridad
 */

export interface DocSection {
    number: string;
    title: string;
    prose: string[];
    bulletPoints?: { label: string; text: string }[];
    formulaBox?: {
        title: string;
        formula: string;
        explanation: string;
        variables?: { sym: string; desc: string }[];
    };
    tableData?: {
        headers: string[];
        rows: string[][];
        caption?: string;
    };
}

export interface DocChapter_V2 {
    id: string;
    sectionType: 'MAESTROS' | 'HERRAMIENTAS';
    categoryGroup: string;
    chapterNum: number;
    title: string;
    subtitle: string;
    iconName: string;
    badge: string;
    keywords: string[];
    executiveSummary: string;
    sections: DocSection[];
}

export const DOCS_AS_CODE_CHAPTERS: DocChapter_V2[] = [
    // ─────────────────────────────────────────────────────────────────────────
    // ── GRUPO 1: DATOS MAESTROS FÍSICOS (01 - 03) ──
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'c1',
        sectionType: 'MAESTROS',
        categoryGroup: 'MAESTROS FÍSICOS',
        chapterNum: 1,
        title: 'Maestro de Flota',
        subtitle: 'Especificaciones de naves, DWT, LOA, GRT, calados y matriz de consumos',
        iconName: 'Anchor',
        badge: 'Maestro Físico',
        keywords: ['flota', 'buques', 'dwt', 'grt', 'loa', 'moquegua', 'tablones', 'huemul', 'concon', 'consumos', 'vlsfo', 'mdo'],
        executiveSummary: 'Administra el registro estructural, capacidades cúbicas, dimensiones náuticas y las matrices paramétricas de consumo de combustible para las naves propias y fletadas que componen la flota de Naviera Petral S.A.',
        sections: [
            {
                number: '1.1',
                title: 'Registro Técnico de Embarcaciones y Capacidades',
                prose: [
                    'El Maestro de Flota constituye la base física de toda la arquitectura analítica de PETRAL ONE. Modela con exactitud micrométrica las cuatro embarcaciones principales que operan el cabotaje y transporte regional de graneles líquidos (ácido sulfúrico) y carga general en la costa oeste de Sudamérica.',
                    'Cada buque posee una ficha técnica inmutable donde se asientan las dimensiones críticas requeridas por las autoridades marítimas (DICAPI, DIRECTEMAR) y los terminales portuarios privados para validar la factibilidad de atraque y maniobra segura.'
                ],
                bulletPoints: [
                    { label: 'LOA (Length Overall)', text: 'Eslora total de la embarcación en metros. Determina la compatibilidad física con el amarradero y el cálculo de derechos de muellaje por metro/hora.' },
                    { label: 'GRT / TRB (Gross Register Tonnage)', text: 'Arqueo bruto que mide el volumen cerrado total. Base tarifaria oficial de practicaje, remolcaje portuario, faros y boyas.' },
                    { label: 'DWT (Deadweight Tonnage)', text: 'Tonelaje de peso muerto máximo que el buque puede transportar de manera segura, sumando carga útil, combustible, agua dulce y pertrechos.' },
                    { label: 'DWCC (Deadweight Cargo Capacity)', text: 'Capacidad neta de carga en bodega que el buque puede transportar efectivamente descontando búnker, agua y consumibles. Es la métrica canónica para contratos comerciales y asignación de viajes.' },
                    { label: 'Draft (Calado de Verano / Tropical)', text: 'Profundidad máxima sumergida en metros. Crucial para prevenir varaduras y verificar el calado máximo permitido del muelle de atraque en bajamar.' }
                ],
                tableData: {
                    caption: 'Tabla 1.1 — Flota de Naves Homologadas en PETRAL SHIPPING.SOFT (Maestro de Flota)',
                    headers: ['Embarcación', 'Tipo / Casco', 'LOA (m)', 'GRT (TRB)', 'DWT (MT)', 'Calado Máx (m)', 'Capacidad Bodega / DWCC (MT)'],
                    rows: [
                        ['B/T Moquegua', 'Tanquero Quimiquero (IMO II)', '134.00', '8,259', '14,298', '8.81', '13,500 MT'],
                        ['B/T Tablones', 'Tanquero Quimiquero (IMO II)', '158.80', '11,365', '16,533', '10.20', '14,500 MT'],
                        ['Concon Trader', 'Multi-Purpose / Granelero', '146.00', '11,773', '19,823', '9.72', '19,000 MT'],
                        ['Huemul', 'Tanquero Quimiquero Regional', '161.00', '13,666', '22,062', '9.95', '21,000 MT'],
                        ['Bow Condor', 'Tanquero Quimiquero (Fletado / Spot)', '133.00', '9,232', '16,121', '9.24', '15,000 MT']
                    ]
                }
            },
            {
                number: '1.2',
                title: 'Matriz Paramétrica de Consumos de Búnker',
                prose: [
                    'Para cada nave, el sistema modela una matriz tridimensional de consumos de combustible expresada en toneladas métricas por día (MT/día). El motor distingue con rigor matemático el estado cinético de la nave y el tipo de hidrocarburo requerido.',
                    'Conforme a las normativas ambientales IMO 2020 y directrices de cabotaje, las naves emplean VLSFO (Very Low Sulphur Fuel Oil 0.5%S) o IFO 380 en tránsito marítimo, y Diesel Marino MDO para generadores auxiliares, calderetas de vapor y maniobras de atraque.'
                ],
                formulaBox: {
                    title: 'ECUACIÓN CANÓNICA DE GASTO DE BÚNKER EN CICLO REDONDO',
                    formula: 'Bunker_Total = (Days_Sea × Cons_Sea × Price_Fuel) + (Days_Port × Cons_Port × Price_MDO)',
                    explanation: 'Determina el costo directo total de combustible del viaje desglosando la fase de mar (Sea Leg) y la fase de permanencia en puerto (Port Idle & Working).',
                    variables: [
                        { sym: 'Days_Sea', desc: 'Días fraccionarios de navegación en mar abierto (Laden Leg + Ballast Leg).' },
                        { sym: 'Cons_Sea', desc: 'Consumo diario del motor propulsor principal (MT/día de VLSFO/IFO).' },
                        { sym: 'Days_Port', desc: 'Días de permanencia en muelle (carga, descarga y esperas).' },
                        { sym: 'Cons_Port', desc: 'Consumo diario de motores auxiliares y caldereta en muelle (MT/día MDO).' },
                        { sym: 'Price_Fuel / Price_MDO', desc: 'Costo unitario por tonelada métrica en el puerto de búnkering (USD/MT).' }
                    ]
                }
            }
        ]
    },
    {
        id: 'c2',
        sectionType: 'MAESTROS',
        categoryGroup: 'MAESTROS FÍSICOS',
        chapterNum: 2,
        title: 'Maestro de Puertos y Terminales',
        subtitle: 'Directorio portuario, tiempos de permanencia Q y matriz de conceptos P×Q (Callao & Puertos PE/CL)',
        iconName: 'Compass',
        badge: 'Maestro Físico',
        keywords: ['puertos', 'terminales', 'callao', 'matarani', 'ilo', 'marcona', 'mejillones', 'apm', 'tisur', 'spcc', 'q', 'ritmo', 'permanencia', 'practicaje', 'remolcaje', 'muellaje', 'p*q'],
        executiveSummary: 'Centraliza el catálogo georreferenciado de puertos marítimos, terminales especializados, ritmos de transferencia neta y la matriz de conceptos P×Q para la liquidación pericial de costos portuarios.',
        sections: [
            {
                number: '2.1',
                title: 'Parámetros Físicos Q de Permanencia en Terminal (Fórmula P×Q)',
                prose: [
                    'El cálculo exacto del tiempo de ocupación de muelle es la variable física determinante para la liquidación de muellaje, practicaje y sobrestadías. El Maestro de Puertos descompone la permanencia total (Q_total) en dos componentes indisociables: el tiempo de bombeo neto y los suplementos operativos fijos.',
                    'La permanencia de transferencia depende de la tasa neta del terminal (MT/h) y del tonelaje contratado en el manifiesto. Los suplementos operativos representan el tiempo muerto normado para maniobras náuticas de seguridad.'
                ],
                formulaBox: {
                    title: 'FÓRMULA CANÓNICA DE PERMANENCIA OPERATIVA EN PUERTO (Q_TOTAL)',
                    formula: 'Q_total = Q_operación + Q_fijo = (MT_Carga / Ritmo_Transferencia) + 4.0 horas',
                    explanation: 'El estándar de auditoría de Naviera Petral establece que a todo tiempo neto de bombeo se le adicionan exactamente 4.0 horas fijas inmutables por escala.',
                    variables: [
                        { sym: 'MT_Carga', desc: 'Volumen total manifestado en toneladas métricas.' },
                        { sym: 'Ritmo_Transferencia', desc: 'Velocidad de bombeo/embarque certificada por el terminal (MT/hora).' },
                        { sym: '4.0 horas Fijas', desc: '2.0h amarre/desamarre de cabos + 2.0h conexionado de mangueras, purga e inspección de calados.' }
                    ]
                }
            },
            {
                number: '2.2',
                title: 'Catálogo de Terminales Clave y Ritmos de Bombeo',
                prose: [
                    'Los terminales registrados en el sistema presentan configuraciones operativas especializadas para ácido sulfúrico concentrado y graneles mineros:',
                    'Callao (APM Terminals / Multiboyas Pampilla): Opera con ritmos de 500 MT/h para carga y 350 MT/h para descarga. Dispone de facilidades de practicaje de alta demanda y remolcaje obligatorio de 2 remolcadores por maniobra.',
                    'Matarani (Tisur S.A. Muelle F): Terminal de alta productividad para exportación de concentrados y recepción de ácido minero, con ritmo promedio de 500 MT/h y línea de tubería dedicada.',
                    'Ilo (SPCC Terminal Minero / ENAPU): Punto de originación principal del ácido producido en la fundición de Southern Peru, operando con estándares estrictos de seguridad industrial.'
                ],
                tableData: {
                    caption: 'Tabla 2.1 — Parámetros Operativos por Terminal Marítimo',
                    headers: ['Puerto / Terminal', 'País', 'Tipo de Instalación', 'Ritmo Carga (MT/h)', 'Ritmo Descarga (MT/h)', 'Calado Máx (m)', 'Remolcadores Obligatorios'],
                    rows: [
                        ['Callao (APM Terminals)', 'Perú', 'Muelle Marginal', '500', '350', '10.50', '2 IN / 2 OUT'],
                        ['Callao (Multiboyas)', 'Perú', 'Amarradero Multiboyas', '450', '300', '12.00', '2 IN / 2 OUT'],
                        ['Matarani (Tisur Muelle F)', 'Perú', 'Muelle Minero Especializado', '500', '350', '11.80', '2 IN / 2 OUT'],
                        ['Ilo (Terminal SPCC)', 'Perú', 'Muelle Privado Industrial', '600', '400', '10.20', '2 IN / 2 OUT'],
                        ['Mejillones (Puerto Angamos)', 'Chile', 'Terminal Químico Minero', '550', '400', '12.50', '2 IN / 2 OUT']
                    ]
                }
            }
        ]
    },
    {
        id: 'c3',
        sectionType: 'MAESTROS',
        categoryGroup: 'MAESTROS FÍSICOS',
        chapterNum: 3,
        title: 'Maestro de Distancias',
        subtitle: 'Matriz distancial en millas náuticas (NM), factores meteorológicos (Weather Factors Ballast y Laden) y tiempos de tránsito',
        iconName: 'Database',
        badge: 'Maestro Físico',
        keywords: ['distancias', 'rutas', 'millas', 'nm', 'navegacion', 'lastre', 'cargado', 'velocidad', 'tiempo mar', 'weather factor', 'ballast', 'laden'],
        executiveSummary: 'Registra la matriz de distancias náuticas oficiales en millas marinas (NM) entre los puertos del Pacífico Sur y modela la fricción ambiental mediante factores climáticos desacoplados (Weather Factor Ballast y Weather Factor Laden) para proyectar con exactitud micrométrica los días de mar y el consumo de búnker.',
        sections: [
            {
                number: '3.1',
                title: 'Matriz Distancial Canónica y Fricción Meteorológica',
                prose: [
                    'El Maestro de Distancias garantiza la verdad única en el cálculo de los días de mar entre el equipo comercial y el área de operaciones. Cada trayecto entre dos puertos está auditado conforme a derroteros oficiales de navegación hidrográfica (DHN Perú y SHOA Chile).',
                    'En navegación real, la distancia efectiva siempre supera a la geodésica debido a corrientes marinas (corriente de Humboldt), oleaje de fondo y viento. Para capturar este fenómeno determinista, el sistema aplica factores climáticos diferenciados según el buque navegue cargado (LADEN) o en lastre (BALLAST).'
                ],
                bulletPoints: [
                    { label: 'Distancia Náutica Oficial (NM)', text: 'Millas náuticas directas de derrotero hidrográfico entre cartas náuticas oficiales (1 NM = 1,852 metros).' },
                    { label: 'Weather Factor Laden (W.F Laden)', text: 'Factor de contingencia meteorológica (típicamente 3.0% a 5.0%) aplicado en tramos con carga a bordo. Modela la mayor resistencia hidrodinámica por inercia y calado máximo de verano/tropical.' },
                    { label: 'Weather Factor Ballast (W.F Ballast)', text: 'Factor de contingencia meteorológica (típicamente 3.0% a 4.0%) aplicado en tramos en lastre (sin carga). Modela el abatimiento por viento lateral sobre el francobordo elevado de la nave vacía.' },
                    { label: 'Velocidad de Servicio (Knots)', text: 'Velocidad contractual del buque en nudos (millas náuticas por hora) según la curva de consumo optimizado del propulsor.' }
                ],
                formulaBox: {
                    title: 'FÓRMULA CANÓNICA DE TIEMPO DE MAR CON FACTOR CLIMÁTICO (DÍAS)',
                    formula: 'Días_Mar = [ Distancia_NM × (1 + Weather_Factor) ] / (Velocidad_Nudos × 24.0 horas)',
                    explanation: 'Aplica el Weather Factor correspondiente al estado operativo del tramo: Weather_Factor_Laden si la carga a bordo > 0 MT, o Weather_Factor_Ballast si la nave viaja en lastre (0 MT). La distancia resultante simula el recorrido hidrodinámico real del buque.',
                    variables: [
                        { sym: 'Distancia_NM', desc: 'Distancia oficial de derrotero entre origen y destino en Millas Náuticas.' },
                        { sym: 'Weather_Factor', desc: 'Factor meteorológico decimal: W.F Laden (ej. 0.03 para 3%) o W.F Ballast (ej. 0.03).' },
                        { sym: 'Velocidad_Nudos', desc: 'Velocidad de avance en nudos (Knots = NM/hora). Ej: 11.0 kn.' },
                        { sym: '24.0 horas', desc: 'Constante canónica de horas continuas por día de navegación.' }
                    ]
                }
            },
            {
                number: '3.2',
                title: 'Matriz de Navegación Pacífico Sur y Factores Climáticos',
                prose: [
                    'En la arquitectura de PETRAL ONE, cada par origen-destino indexa en la base de datos (public.distances) tanto la distancia pura como los dos factores de fricción climática desacoplados.',
                    'Al construir la cotización en el Multicotizador, el acumulador de bodega determina automáticamente qué factor se asigna tramo a tramo, erradicando desvíos presupuestarios entre el pronóstico comercial y la liquidación real del viaje.'
                ],
                tableData: {
                    caption: 'Tabla 3.1 — Matriz de Distancias y Factores Climáticos en el Eje Pacífico Sur',
                    headers: ['Origen', 'Destino', 'Distancia (NM)', 'W.F Laden (%)', 'W.F Ballast (%)', 'Tiempo Laden (11.0 kn)', 'Tiempo Ballast (11.0 kn)'],
                    rows: [
                        ['Ilo (SPCC)', 'Callao (APM)', '420 NM', '3.0%', '3.0%', '1.64 días', '1.64 días'],
                        ['Ilo (SPCC)', 'Matarani (Tisur)', '72 NM', '3.0%', '3.0%', '0.28 días', '0.28 días'],
                        ['Callao (APM)', 'Matarani (Tisur)', '475 NM', '3.0%', '3.0%', '1.85 días', '1.85 días'],
                        ['Ilo (SPCC)', 'Mejillones (Chile)', '295 NM', '3.0%', '3.0%', '1.15 días', '1.15 días'],
                        ['Callao (APM)', 'Mejillones (Chile)', '715 NM', '3.0%', '3.0%', '2.79 días', '2.79 días']
                    ]
                }
            }
        ]
    },

    // ─────────────────────────────────────────────────────────────────────────
    // ── GRUPO 2: DATOS MAESTROS COMERCIALES & CONTRATOS (04 - 07) ──
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'c4',
        sectionType: 'MAESTROS',
        categoryGroup: 'MAESTROS COMERCIALES',
        chapterNum: 4,
        title: 'Maestro de Clientes',
        subtitle: 'Directorio de clientes comerciales, RUC, contactos y condiciones de crédito',
        iconName: 'Building2',
        badge: 'Maestro Comercial',
        keywords: ['clientes', 'fletadores', 'spcc', 'nexa', 'shougang', 'yura', 'ruc', 'credito', 'condiciones'],
        executiveSummary: 'Centraliza el padrón de clientes fletadores corporativos, términos comerciales, límites de línea de crédito y trazabilidad de contactos operativos para la emisión de fletes.',
        sections: [
            {
                number: '4.1',
                title: 'Padrón Corporativo y Clientes Estratégicos',
                prose: [
                    'Naviera Petral mantiene relaciones contractuales de largo plazo con los conglomerados mineros e industriales más relevantes de la región. El Maestro de Clientes administra la identidad tributaria, domicilios legales y cuentas corrientes autorizadas para depósitos de fletes.',
                    'Entre los fletadores estratégicos registrados destacan: Southern Peru Copper Corporation (SPCC - Productor y fletador mayoritario en Ilo), Nexa Resources Perú S.A. (Refinería de Cajamarquilla / Callao), Shougang Hierro Perú (San Nicolás) y Consorcio Cementero Yura S.A.'
                ]
            }
        ]
    },
    {
        id: 'c5',
        sectionType: 'MAESTROS',
        categoryGroup: 'MAESTROS COMERCIALES',
        chapterNum: 5,
        title: 'Maestro de Cierres',
        subtitle: 'Gestión de Cierres Comerciales (COA y Contratos en Firme), estados Borrador/Aprobado, cláusulas de flete, laytime y démorage',
        iconName: 'FileText',
        badge: 'Maestro Comercial',
        keywords: ['cierres', 'contratos', 'coa', 'borrador', 'aprobado', 'flete', 'laytime', 'demurrage', 'despatch', 'fiost', 'volumen anual', 'spcc', 'nexa'],
        executiveSummary: 'Centraliza el repositorio oficial de Cierres Comerciales y Contratos de Fletamento (COA y acuerdos en firme) generados en el Multicotizador. Controla el ciclo de vida del negocio (Borrador ➔ Enviado ➔ Aprobado ➔ Vigente), pactando los volúmenes anuales comprometidos, fletes base acordados por ruta, ventanas de embarque (laycan), condiciones FIOST y tarifas de sobreestadía (démorage).',
        sections: [
            {
                number: '5.1',
                title: 'Arquitectura del Cierre Comercial y Ciclo de Vida del Negocio',
                prose: [
                    'El Maestro de Cierres constituye el repositorio contractual definitivo de PETRAL ONE. Todo acuerdo comercial originado en el Multicotizador entra al Maestro de Cierres en estado BORRADOR (Draft). Mediante el flujo de control de gobernanza, el cierre es revisado por la Gerencia Comercial y la Dirección General para su validación formal y transición a estado APROBADO / VIGENTE.',
                    'Cada cierre formaliza el compromiso de transporte para contratos de volumen anual (ej. 180,000 MT/año para SPCC o NEXA) o asignaciones de cabotaje específico. El registro asienta de forma inmutable el flete base pactado por tonelada métrica bajo términos FIOST (Free In and Out Stowed and Trimmed), liberando al armador de los costos de manipulación en tierra y estableciendo el presupuesto base inviolable del viaje.'
                ],
                bulletPoints: [
                    { label: 'Estado BORRADOR (Draft)', text: 'Cierre comercial generado preliminarmente desde el Multicotizador. Permite edición y ajustes finos por el analista antes de elevarse a aprobación gerencial.' },
                    { label: 'Estado APROBADO / VIGENTE', text: 'Cierre comercial ratificado por Dirección General. Bloquea las condiciones tarifarias y sirve como base obligatoria para el cálculo del Voyage Ledger.' },
                    { label: 'Condición FIOST', text: 'Free In and Out Stowed and Trimmed: estipula que los costos y riesgos de carga, estiba y descarga en muelle corren por cuenta exclusiva del fletador.' },
                    { label: 'Compromiso de Volumen (COA)', text: 'Tonelaje anual o mensual garantizado en el contrato marco, distribuido en ventanas operativas periódicas (laycan).' }
                ]
            },
            {
                number: '5.2',
                title: 'Liquidación Canónica de Demurrage, Despatch y Tiempos de Plancha (Laytime)',
                prose: [
                    'El Cierre Comercial estipula las horas de permanencia permitidas en muelle (Laytime) para operaciones de bombeo y conexionado de ácido sulfúrico. Todo exceso generado por demoras atribuibles al cliente activa la liquidación pericial de Demurrage conforme a la tarifa diaria convenida.'
                ],
                formulaBox: {
                    title: 'FÓRMULA CANÓNICA DE LIQUIDACIÓN DE DEMURRAGE / DESPATCH',
                    formula: 'Demurrage_Total = Max(0, Tiempo_Real_Puerto - Laytime_Permitido) × Tarifa_Demurrage_Día',
                    explanation: 'Si el buque permanece en muelle o fondeadero por causas atribuibles al fletador más allá del tiempo pactado (Laytime), se activa la penalidad diaria en USD a favor del armador.',
                    variables: [
                        { sym: 'Tiempo_Real_Puerto', desc: 'Días y horas exactas desde la entrega de la Carta de Alistamiento (NOR) válida hasta el zarpe.' },
                        { sym: 'Laytime_Permitido', desc: 'Tiempo de plancha contractual asignado para carga/descarga.' },
                        { sym: 'Tarifa_Demurrage_Día', desc: 'Penalidad fija contractual pactada (ej. 8,500 USD/día pro-rata).' }
                    ]
                },
                tableData: {
                    caption: 'Tabla 5.1 — Atributos Clave y Estados del Maestro de Cierres (ContractsMaster)',
                    headers: ['Campo / Parámetro', 'Tipo de Dato', 'Valores / Opciones', 'Rol en la Gobernanza del Sistema'],
                    rows: [
                        ['ID Cierre / Contrato', 'Alfanumérico', 'COA-SPCC-2026, COA-NEXA-2026...', 'Identificador unívoco del acuerdo comercial en firme.'],
                        ['Cliente Fletador', 'Catálogo FK', 'SPCC, NEXA, SHOUGANG, YURA...', 'Vincula el cierre con el padrón maestro de clientes.'],
                        ['Estado del Cierre', 'Enumerado', 'BORRADOR, ENVIADO, APROBADO, CERRADO', 'Control de avance: solo contratos Aprobados fijan presupuesto base.'],
                        ['Flete Base Acordado', 'Moneda (USD/MT)', 'Tarifa fija contractual por tramo', 'Determina el ingreso por flete en la Matriz Financiera.'],
                        ['Laytime & Démorage', 'Horas / USD/día', 'Horas permitidas + Tarifa diaria', 'Regla legal para el cálculo y cobro de sobreestadías.']
                    ]
                }
            }
        ]
    },
    {
        id: 'c6',
        sectionType: 'MAESTROS',
        categoryGroup: 'MAESTROS COMERCIALES',
        chapterNum: 6,
        title: 'Maestro de Rutas y Servicios Físicos',
        subtitle: 'Rutas comerciales físicas activas vinculadas a clientes COA',
        iconName: 'MapPin',
        badge: 'Maestro Comercial',
        keywords: ['rutas', 'circuitos', 'redondas', 'poligonales', 'ilo callao', 'matarani mejillones', 'cabotaje'],
        executiveSummary: 'Define las rotaciones náuticas estándar y circuitos comerciales recurrentes, mapeando los corredores de navegación y puntos de atraque autorizados.',
        sections: [
            {
                number: '6.1',
                title: 'Tipología de Rotaciones Náuticas',
                prose: [
                    'El software soporta dos topologías de servicio:',
                    '1. Rutas Redondas Simples: La nave carga en origen (ej. Ilo), navega cargada (Laden) hasta el puerto de descarga (ej. Callao), descarga y retorna en lastre (Ballast) al puerto de origen.',
                    '2. Circuitos Triangulares / Poligonales: Diseñados para optimizar el flete evitando retornos vacíos, enlazando por ejemplo Ilo (Carga) -> Callao (Descarga) -> Reposicionamiento Matarani (Carga) -> Mejillones (Descarga) -> Retorno Ilo.'
                ]
            }
        ]
    },
    {
        id: 'c7',
        sectionType: 'MAESTROS',
        categoryGroup: 'MAESTROS COMERCIALES',
        chapterNum: 7,
        title: 'Maestro de Cotizaciones Comerciales Spot',
        subtitle: 'Histórico de cotizaciones comerciales Spot y prospectos de flete',
        iconName: 'Receipt',
        badge: 'Maestro Comercial',
        keywords: ['cotizaciones', 'spot', 'prospectos', 'flete mt', 'lump sum', 'margen comercial'],
        executiveSummary: 'Registra las propuestas económicas Spot emitidas para viajes individuales fuera de contrato COA, evaluando fletes por tonelada métrica vs. flete alzado (Lump Sum).',
        sections: [
            {
                number: '7.1',
                title: 'Estructuración de Cotizaciones Spot y Breakeven',
                prose: [
                    'Toda cotización Spot evalúa el costo marginal del viaje contra la tarifa de mercado. El motor calcula automáticamente el costo piso de operación (Búnker + Gastos de Escala + Costos de Capital) y sugiere la tarifa comercial que asegura el margen de utilidad esperado por la gerencia.'
                ]
            }
        ]
    },

    // ─────────────────────────────────────────────────────────────────────────
    // ── GRUPO 3: DATOS MAESTROS DE COSTOS, BÚNKER & LOGÍSTICA (08 - 11) ──
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'c8',
        sectionType: 'MAESTROS',
        categoryGroup: 'MAESTROS DE COSTOS',
        chapterNum: 8,
        title: 'Maestro de Tarifas Portuarias',
        subtitle: 'Tarifario desagregado por concepto, proveedor y terminal',
        iconName: 'Coins',
        badge: 'Maestro de Costos',
        keywords: ['tarifas', 'practicaje', 'remolcaje', 'lanchas', 'amarradores', 'muellaje', 'apn', 'dicapi', 'sanidad', 'overtime'],
        executiveSummary: 'Desagrega las tarifas oficiales publicadas por autoridades portuarias, agencias marítimas y operadores de terminales en cada puerto del Pacífico.',
        sections: [
            {
                number: '8.1',
                title: 'Estructura Analítica de Rubros Portuarios',
                prose: [
                    'Una escala marítima involucra múltiples servicios regulados y privados que se liquidan de forma independiente:',
                    'Practicaje: Maniobra náutica obligatoria conducida por un Práctico oficial. Se tarifica por tramos de Arqueo Bruto (TRB) y recargos por maniobra nocturna.',
                    'Remolcaje: Asistencia con remolcadores azimutales (mínimo 2 unidades en entrada y 2 en salida). Tarifado según potencia (BHP) y TRB de la nave.',
                    'Lanchas de Servicio: Transporte de prácticos, autoridades y cuadrillas de inspección sanitaria.',
                    'Muellaje a la Nave: Derecho de ocupación de frente de atraque, liquidado por metro de eslora (LOA) por hora de permanencia.',
                    'Derechos de Autoridad: Tasas oficiales de la Autoridad Portuaria Nacional (APN), Dirección General de Capitanías (DICAPI) y Sanidad Marítima Internacional.'
                ]
            }
        ]
    },
    {
        id: 'c9',
        sectionType: 'MAESTROS',
        categoryGroup: 'MAESTROS DE COSTOS',
        chapterNum: 9,
        title: 'Maestro de Gastos Portuarios (Los 3 Tabs Operativos)',
        subtitle: 'Modelo Estático, Modelo Matriz Compleja y Tablero de Bandas Tarifarias (Toda la Flota)',
        iconName: 'Scale',
        badge: 'Maestro de Costos',
        keywords: ['gastos portuarios', '3 tabs', 'modelo estatico', 'modelo dinamico', 'bandas tarifarias', 'p*q', 'benchmarking'],
        executiveSummary: 'Articula la triple arquitectura de costeo portuario de Naviera Petral: Tab 1 (Modelo Estático Simplificado), Tab 2 (Modelo Dinámico P×Q Pericial) y Tab 3 (Tablero de Bandas Tarifarias comparativo de toda la flota).',
        sections: [
            {
                number: '9.1',
                title: 'Arquitectura Tripartita de Control de Escalas Portuarias',
                prose: [
                    'Para resolver el dilema entre rapidez comercial y exactitud pericial contable, PETRAL ONE dispone de tres pestañas operativas:',
                    'Tab 1 — Modelo Estático Simplificado: Asigna un costo fijo promedio por escala en cada puerto (ej. 15,000 USD en Callao), ideal para proyecciones comerciales preliminares en menos de 5 segundos.',
                    'Tab 2 — Modelo Dinámico P×Q Pericial: Desagrega los más de 12 conceptos de la escala aplicando la fórmula exacta P (tarifa unitaria) × Q (TRB, LOA, horas permanencia o TM de carga). Utilizado para validar facturas reales de agencias.',
                    'Tab 3 — Tablero de Bandas Tarifarias: Matriz comparativa que proyecta el costo total de escala de todas las naves de la flota (Moquegua, Tablones, Concon Trader, Huemul) en todos los terminales marítimos, permitiendo auditorías cruzadas instantáneas.'
                ],
                tableData: {
                    caption: 'Tabla 9.1 — Comparativa de los 3 Modelos de Gastos Portuarios',
                    headers: ['Dimensión', 'Tab 1: Modelo Estático', 'Tab 2: Modelo P×Q Pericial', 'Tab 3: Bandas Tarifarias'],
                    rows: [
                        ['Propósito', 'Cotización rápida preliminar', 'Liquidación exacta y auditoría de facturas', 'Benchmarking y control de flota'],
                        ['Nivel de Detalle', 'Cifra única agregada por puerto', 'Desglose rubro por rubro (12+ conceptos)', 'Matriz Naves × Puertos'],
                        ['Precisión', '± 10% margen de variación', '± 0.5% exactitud pericial contable', 'Comparativa global de costos'],
                        ['Tiempo de Cálculo', 'Inmediato (< 1 segundo)', 'Parametrizado por nave y tonelaje', 'Visualización multidimensional']
                    ]
                }
            }
        ]
    },
    {
        id: 'c10',
        sectionType: 'MAESTROS',
        categoryGroup: 'BÚNKER',
        chapterNum: 10,
        title: 'Maestro de Búnker',
        subtitle: 'Precios de IFO 380 / VLSFO, Diesel MDO y regla de homologación MGO=MDO',
        iconName: 'Zap',
        badge: 'Combustibles Marítimos',
        keywords: ['bunker', 'combustibles', 'vlsfo', 'ifo 380', 'mdo', 'mgo', 'homologacion mgo=mdo', 'precios spot', 'bunkering'],
        executiveSummary: 'Gestiona los precios spot de combustibles marinos en los puertos de aprovisionamiento y aplica la regla inmutable de homologación canónica MGO ≡ MDO en todo el software.',
        sections: [
            {
                number: '10.1',
                title: 'Regla Canónica Inmutable: Homologación MGO ≡ MDO',
                prose: [
                    'En la industria marítima internacional, las denominaciones MGO (Marine Gas Oil) y MDO (Marine Diesel Oil) suelen figurar indistintamente en facturas de suplidores y cotizaciones de agencias.',
                    'Por regla inmutable de arquitectura definida en el sistema PETRAL ONE, todo registro, cotización o factura donde figure la sigla MGO se procesa, almacena y homologa estrictamente bajo el estándar canónico MDO.',
                    'Esta homologación unificada previene la fragmentación de partidas contables y asegura que los algoritmos de consumo de motores auxiliares operen con un único precio de referencia homogéneo.'
                ],
                formulaBox: {
                    title: 'DIRECTIVA CANÓNICA DE HOMOLOGACIÓN EN TODO EL SISTEMA',
                    formula: 'Homologación: Si Documento.FuelType == "MGO" ⟹ Registrar como "MDO"',
                    explanation: 'Toda partida de combustible diesel marino se consolida bajo la cuenta y parámetro MDO en el motor analítico.',
                    variables: [
                        { sym: 'VLSFO', desc: 'Combustible bajo en azufre (0.5% S máx) para motores principales.' },
                        { sym: 'MDO', desc: 'Diesel marino estándar para generadores auxiliares, maniobras y calderas.' }
                    ]
                }
            }
        ]
    },
    {
        id: 'c11',
        sectionType: 'MAESTROS',
        categoryGroup: 'LOGÍSTICA',
        chapterNum: 11,
        title: 'Maestro de Originación (Fuentes y Sumideros)',
        subtitle: 'Fuentes de suministro, destinos de consumo, volúmenes MT y empresas (Sources & Sinks)',
        iconName: 'Layers',
        badge: 'Logística',
        keywords: ['originacion', 'sources', 'sinks', 'fuentes', 'sumideros', 'balance masa', 'cadena suministro', 'acido sulfurico'],
        executiveSummary: 'Mapea la topología de la cadena de suministro de ácido sulfúrico y graneles mineros en el Perú, contrastando fuentes de producción (Sources) con sumideros de consumo (Sinks).',
        sections: [
            {
                number: '11.1',
                title: 'Balance de Masa Nacional: Fuentes y Sumideros',
                prose: [
                    'El balance logístico nacional de ácido sulfúrico en el Perú se articula en torno a dos grandes fuentes de producción metalúrgica primaria:',
                    'Sources (Orígenes): Fundición de Ilo (Southern Peru - capacidad de más de 800,000 MT/año) y Complejo Cajamarquilla (Nexa Resources - capacidad de 480,000 MT/año). Adicionalmente, el déficit de producción se cubre con importaciones marítimas desde Chile o Asia.',
                    'Sinks (Destinos): Minas de lixiviación de cobre en el sur peruano (Marcobre en San Juan de Marcona, Cerro Verde en Matarani, Toquepala/Cuajone en Moquegua/Tacna), además de destinos de exportación regional en el norte de Chile (Mejillones y Antofagasta).'
                ]
            }
        ]
    },

    // ─────────────────────────────────────────────────────────────────────────
    // ── GRUPO 4: HERRAMIENTAS ANALÍTICAS & MOTORES (12 - 19) ──
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'c12',
        sectionType: 'HERRAMIENTAS',
        categoryGroup: 'MOTORES SPOT',
        chapterNum: 12,
        title: 'Multicotizador Multirutas',
        subtitle: 'Simulación comercial Spot en tiempo real, cálculo TCE y guía de botones UI',
        iconName: 'ShoppingCart',
        badge: 'Motor Comercial',
        keywords: ['multicotizador', 'spot', 'tce', 'flete breakeven', 'simulacion', 'itinerario', 'tiempo charter equivalent'],
        executiveSummary: 'Motor de cálculo económico y simulación de viajes en tiempo real. Determina el Flete de Equilibrio (Breakeven) y el Time Charter Equivalent (TCE USD/día) para cualquier combinación de nave, ruta y tonelaje.',
        sections: [
            {
                number: '12.1',
                title: 'Algoritmo del Multicotizador y Fórmulas Financieras',
                prose: [
                    'El Multicotizador procesa de forma integrada el itinerario completo de un viaje potencial. Calcula la duración del ciclo náutico (Días Mar + Días Puerto Carga + Días Puerto Descarga), el costo de combustible en mar y puerto, y los gastos de escala portuaria.',
                    'Permite responder en segundos a las solicitudes de flete de clientes fletadores con certeza matemática absoluta sobre el margen de utilidad esperado.'
                ],
                formulaBox: {
                    title: 'FÓRMULAS MAESTRAS DEL MULTICOTIZADOR (BREAKEVEN & TCE)',
                    formula: 'TCE (USD/día) = [Ingreso_Flete - (Costo_Búnker + Gastos_Portuarios + Comisiones)] / Duración_Total_Días',
                    explanation: 'El Time Charter Equivalent (TCE) es el KPI rey de la industria naviera mundial. Expresa el rendimiento neto diario del buque deduciendo todos los costos variables directos del viaje.',
                    variables: [
                        { sym: 'Ingreso_Flete', desc: 'Flete unitario por MT × Toneladas manifestadas, o flete Lump Sum total.' },
                        { sym: 'Costo_Búnker', desc: 'Consumo total de VLSFO/IFO en mar + consumo MDO en puerto.' },
                        { sym: 'Gastos_Portuarios', desc: 'Suma de costos de escala en puerto de carga y puerto de descarga.' },
                        { sym: 'Comisiones', desc: 'Comisión de agencia de corretaje marítimo (Broker Commission % del flete).' },
                        { sym: 'Duración_Total_Días', desc: 'Suma de días mar navegación + días permanencia muelle.' }
                    ]
                }
            }
        ]
    },
    {
        id: 'c13',
        sectionType: 'HERRAMIENTAS',
        categoryGroup: 'FINANZAS',
        chapterNum: 13,
        title: 'Matriz Financiera (Voyage Ledger P&L)',
        subtitle: 'Consolidación financiera por viaje NVR, cierre de estado de resultados y guía de botones UI',
        iconName: 'BarChart3',
        badge: 'Contabilidad de Viaje',
        keywords: ['matriz financiera', 'voyage ledger', 'p&l', 'nvr', 'estado resultados', 'margen operativo', 'cierre viaje'],
        executiveSummary: 'Libro mayor de fletamento marítimo (Voyage Ledger). Agrupa y consolida los ingresos y costos reales devengados por cada Número de Viaje Redondo (NVR), generando el Estado de Ganancias y Pérdidas del viaje.',
        sections: [
            {
                number: '13.1',
                title: 'Mecánica de Consolidación por Número de Viaje (NVR)',
                prose: [
                    'En la gestión naviera profesional, cada rotación se identifica mediante un código NVR único (ej. NVR-MOQ-2026-01). La Matriz Financiera actúa como el repositorio contable donde se liquidan los ingresos facturados contra las planillas de costos reales incurridos.',
                    'Distingue con rigor contable el Margen de Contribución del Viaje (Ingresos menos Costos de Viaje) y el Margen Operativo Neto (deduciendo la depreciación del buque y los gastos indirectos de administración corporativa).'
                ]
            }
        ]
    },
    {
        id: 'c14',
        sectionType: 'HERRAMIENTAS',
        categoryGroup: 'ANALÍTICA',
        chapterNum: 14,
        title: 'Análisis Gráfico de Indicadores Navieros',
        subtitle: 'Visualización estadística de indicadores navieros y guía de botones UI',
        iconName: 'LineChart',
        badge: 'Analítica',
        keywords: ['graficos', 'kpis', 'estadisticas', 'tendencias', 'tce historico', 'consumo por milla'],
        executiveSummary: 'Tablero de visualización avanzada con gráficos interactivos que monitorean la dispersión del TCE, la estructura porcentual de costos y la eficiencia de combustible de la flota en el tiempo.',
        sections: [
            {
                number: '14.1',
                title: 'Monitoreo Gráfico de Rendimiento Operativo',
                prose: [
                    'Transforma las matrices numéricas en visualizaciones gerenciales claras:',
                    'Gráficos de Cascada (Waterfall): Muestran cómo el ingreso bruto de flete se va desglosando en búnker, agenciamiento, muellaje, practicaje y tripulación hasta llegar al EBITDA del buque.',
                    'Gráficos de Dispersión y Tendencia: Permiten auditar la evolución del consumo específico de combustible por milla náutica navegada (MT/NM), identificando posibles desgastes en el casco o necesidad de carena.'
                ]
            }
        ]
    },
    {
        id: 'c15',
        sectionType: 'HERRAMIENTAS',
        categoryGroup: 'CARTOGRAFÍA',
        chapterNum: 15,
        title: 'Spaghetti Map',
        subtitle: 'Trazado cartográfico de rutas marítimas y guía de botones UI',
        iconName: 'Map',
        badge: 'Cartografía',
        keywords: ['spaghetti map', 'cartografia', 'rutas', 'trazado', 'pacifico', 'densidad', 'lastre cargado'],
        executiveSummary: 'Visualizador cartográfico vectorial que renderiza las derrotas náuticas sobre el litoral del Pacífico Sur, diferenciando cromáticamente las piernas cargadas de las piernas de retorno en lastre.',
        sections: [
            {
                number: '15.1',
                title: 'Visualización de Corredores de Navegación',
                prose: [
                    'El Spaghetti Map proporciona al equipo de control de flota una visión integral de la ocupación espacial de los buques. Permite detectar redundancias en rutas de lastre y planificar oportunidades de triangulación comercial para maximizar el factor de carga de las bodegas.'
                ]
            }
        ]
    },
    {
        id: 'c16',
        sectionType: 'HERRAMIENTAS',
        categoryGroup: 'AUDITORÍA',
        chapterNum: 16,
        title: 'Auditoría Final & Actas P×Q',
        subtitle: 'Generador de Actas de Auditoría P×Q, firmas PETRAL / Sandra y guía de botones UI',
        iconName: 'Scale',
        badge: 'Auditoría Pericial',
        keywords: ['auditoria final', 'actas', 'p*q', 'firmas', 'certificacion', 'sandra', 'petral', 'informe pericial'],
        executiveSummary: 'Módulo pericial de verificación de costos portuarios reales contra proformas de agentes. Genera actas de auditoría oficiales con certificación cruzada entre Naviera Petral y el auditor portuario externo.',
        sections: [
            {
                number: '16.1',
                title: 'Protocolo de Emisión de Actas de Auditoría Pericial',
                prose: [
                    'Cada escala liquidada se somete al cotejo pericial entre la cotización proforma enviada por la agencia marítima y la factura final sustentada con documentos de respaldo (partes de práctico, boletas de remolcador y recibos de muelle).',
                    'El sistema genera un Acta de Auditoría Pericial formal que documenta las discrepancias detectadas, valida la aplicación estricta de las fórmulas P×Q y estampa las firmas digitales de certificación técnica de Naviera Petral y de la auditoría experta.'
                ]
            }
        ]
    },
    {
        id: 'c17',
        sectionType: 'HERRAMIENTAS',
        categoryGroup: 'ARQUITECTURA',
        chapterNum: 17,
        title: 'Flowchart del Sistema',
        subtitle: 'Diagramas de arquitectura, flujogramas de procesos e interacciones Nivel 1 a 5 y guía de botones UI',
        iconName: 'FileCode',
        badge: 'Arquitectura',
        keywords: ['flowchart', 'flujogramas', 'graphviz', 'dot', 'svg', 'procesos', 'arquitectura software'],
        executiveSummary: 'Hub interactivo de diagramas de arquitectura y flujogramas de procesos modelados en Graphviz DOT, renderizados en SVG y exportables a PDF de alta resolución sin degradación.',
        sections: [
            {
                number: '17.1',
                title: 'Jerarquía de Flujogramas Operativos y Técnicos',
                prose: [
                    'Modela los cinco niveles de proceso de la organización:',
                    'Nivel 1: Macro-proceso de fletamento marítimo comercial (desde la solicitud de cotización hasta la cobranza del flete).',
                    'Nivel 2: Circuito de despacho de buque y control de operaciones en muelle.',
                    'Nivel 3: Algoritmo de liquidación pericial de gastos portuarios P×Q.',
                    'Nivel 4: Cierre contable de viaje en el Voyage Ledger y estado de resultados.',
                    'Nivel 5: Arquitectura técnica de microservicios, seguridad Zero-Trust y bases de datos relacionales.'
                ]
            }
        ]
    },
    {
        id: 'c18',
        sectionType: 'HERRAMIENTAS',
        categoryGroup: 'DOCUMENTACIÓN',
        chapterNum: 18,
        title: 'Documentación del Sistema (Docs as Code)',
        subtitle: 'Manual interactivo de usuario, arquitectura técnica, buscador inteligente y guía de botones UI',
        iconName: 'BookOpenIcon',
        badge: 'Docs-as-Code',
        keywords: ['docs as code', 'manual', 'sincronizacion', 'as-built', 'loc', 'auditoria codigo', 'living architecture'],
        executiveSummary: 'Filosofía de Arquitectura Viva (Living Architecture) donde la documentación técnica se sincroniza de forma determinista con el código fuente del frontend y backend mediante auditorías de LOCs y control criptográfico.',
        sections: [
            {
                number: '18.1',
                title: 'Filosofía Living Architecture y Sincronización As-Built',
                prose: [
                    'En el desarrollo de PETRAL ONE se abandonó el modelo de manuales estáticos en procesador de texto que quedan obsoletos al primer sprint. La documentación vive dentro del propio código fuente (Docs as Code).',
                    'Al activar el botón de Actualizar Docs as Code mediante la clave de autorización oficial (061121), el sistema ejecuta una auditoría en caliente de las líneas de código (LOC) de toda la solución, actualiza las especificaciones as-built y recompila los activos del manual interactivo.'
                ]
            }
        ]
    },
    {
        id: 'c19',
        sectionType: 'HERRAMIENTAS',
        categoryGroup: 'CIBERSEGURIDAD',
        chapterNum: 19,
        title: 'Device Vault & Seguridad Zero-Trust 2FA',
        subtitle: 'Arquitectura Zero-Trust, huella digital de hardware (GPU, CPU, Monitor), auto-registro PENDING y autorización',
        iconName: 'ShieldCheck',
        badge: 'Ciberseguridad',
        keywords: ['device vault', 'seguridad', '2fa', 'zero-trust', 'huella digital', 'hardware', 'canvas', 'gpu', 'otp', 'resend'],
        executiveSummary: 'Bóveda de control de dispositivos basada en el principio Zero-Trust. Protege la información naviera mediante huella digital de hardware (GPU Canvas, CPU Cores, User-Agent) y autenticación de doble factor (2FA) por correo electrónico corporativo.',
        sections: [
            {
                number: '19.1',
                title: 'Arquitectura Zero-Trust y Huella Digital de Hardware',
                prose: [
                    'En el transporte marítimo y la comercialización de ácido sulfúrico, los datos de fletes, clientes y volúmenes son información crítica de alto valor comercial. PETRAL ONE implementa un blindaje perimetral donde conocer el usuario y la contraseña no basta para acceder al sistema.',
                    'Al iniciar sesión desde un nuevo equipo, el sistema captura una huella digital criptográfica inmutable (Canvas GPU Fingerprint, núcleos de CPU y perfil de navegador). Si el dispositivo no ha sido expresamente homologado y autorizado por el Administrador en la tabla user_authorized_devices, el acceso es bloqueado de inmediato con estado PENDING.'
                ],
                formulaBox: {
                    title: 'PROTOCOLO DE DOBLE FACTOR DE AUTENTICACIÓN (2FA)',
                    formula: 'Acceso = Credenciales_Válidas ∧ Dispositivo_Aprobado(Device_ID) ∧ Código_OTP_Válido',
                    explanation: 'El acceso requiere la conjunción estricta de las tres llaves de seguridad corporativas.',
                    variables: [
                        { sym: 'Device_ID', desc: 'Hash criptográfico SHA-256 generado a partir de las capacidades gráficas del hardware cliente.' },
                        { sym: 'Código_OTP', desc: 'Clave numérica de un solo uso despachada al correo corporativo con validez de 15 minutos.' },
                        { sym: 'Copia Visible (CC)', desc: 'Todo despacho de código 2FA notifica con copia de auditoría a la dirección rgutil@gmail.com.' }
                    ]
                }
            }
        ]
    }
];
