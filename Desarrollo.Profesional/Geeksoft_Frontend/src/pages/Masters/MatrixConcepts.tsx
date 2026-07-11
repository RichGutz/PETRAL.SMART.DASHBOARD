import React from "react";
import { Zap, Waves, Briefcase } from "lucide-react";

export interface FormulaItem {
    concept: string;
    field: string;
    tooltip?: string;
    formula: string;
    explanation: string;
    unit: string;
}

export interface FormulaSection {
    section: string;
    color: string;
    icon: React.ReactNode;
    items: FormulaItem[];
}

export const FORMULA_GUIDE_PE: FormulaSection[] = [
    {
        section: "A) Maniobras (Shifting)", color: "#f59e0b", icon: <Zap size={14} />, items: [
            { concept: "Practicaje + Remolcadores + Lancha (Integral)", field: "pilotage", tooltip: "×2 (entrada + salida)", formula: "Tarifa × 2", explanation: "Se cobra por maniobra (entrada y salida del buque). Si el puerto usa servicio integral, este valor cubre práctico, remolcadores y lancha de piloto en un solo cobro.", unit: "USD / maniobra" },
            { concept: "Recargo Integral 25% (condiciones climáticas)", field: "shifting_surcharges", formula: "Tarifa Fija", explanation: "Recargo aplicado por condiciones climáticas adversas o maniobras en horarios extraordinarios.", unit: "USD" },
            { concept: "Remolcadores / Towage (no integral)", field: "towage_1st", tooltip: "×2 (entrada + salida)", formula: "Tarifa × 2", explanation: "Cuando el puerto NO ofrece servicio integral, el remolque se cotiza de forma separada por cada maniobra de atraque o desatraque.", unit: "USD / maniobra" },
            { concept: "Amarradores / Linesmen", field: "linesmen", formula: "Tarifa × 1 (o ×2)", explanation: "Servicio de amarre y desamarre de cabos en el muelle. Puede cobrarse por servicio completo o por maniobra, según el terminal.", unit: "USD / servicio" },
            { concept: "Port Toll / Cargo de Acceso", field: "port_toll", tooltip: "×2 (entrada + salida)", formula: "Tarifa × 2", explanation: "Derecho de acceso a las instalaciones del terminal o del muelle. Se cobra por cada maniobra (entrada y salida).", unit: "USD / maniobra" },
        ],
    },
    {
        section: "B) Gastos Generales de Puerto", color: "#0ea5e9", icon: <Waves size={14} />, items: [
            { concept: "Faro Nacional (Lighthouse Dues)", field: "lighthouse_national", tooltip: "Tarifa × GRT del buque", formula: "Tarifa × GRT", explanation: "Tarifa regulada por APN/DIRECTEMAR/DIGMER cuando el buque procede de puerto nacional.", unit: "USD / GRT" },
            { concept: "Faro Extranjero (Lighthouse Dues)", field: "lighthouse_foreign", tooltip: "Tarifa × GRT del buque", formula: "Tarifa × GRT", explanation: "Tarifa mayor cuando el buque procede de un puerto extranjero.", unit: "USD / GRT" },
            { concept: "Muellaje / Dockage", field: "dockage", tooltip: "Tarifa × LOA × Horas", formula: "Tarifa × LOA × Hr", explanation: "Cobro por el tiempo que el buque ocupa la posición de atraque.", unit: "USD / m·hr" },
            { concept: "Lancha de Autoridades", field: "launch_authorities", formula: "Tarifa fija", explanation: "Lancha para el transporte de autoridades portuarias hacia y desde el buque.", unit: "USD / llamada" },
            { concept: "Lancha Stand-By / Espera", field: "launch_standby", tooltip: "Tarifa × Horas", formula: "Tarifa × Horas", explanation: "Lancha en espera continua durante toda la estadía.", unit: "USD / hora" },
            { concept: "Inspección Sanitaria", field: "sanitary_inspection", formula: "Tarifa fija", explanation: "Cobro por inspección sanitaria al arribar y despachar.", unit: "USD fijo" },
            { concept: "Clearance In / Out", field: "clearance", formula: "Tarifa fija", explanation: "Gestión de despacho aduanero y migratorio de entrada y salida.", unit: "USD fijo" },
            { concept: "Coordinador a Bordo", field: "coordinator_board", tooltip: "×2 (entrada + salida)", formula: "Tarifa × 2", explanation: "Coordinación a bordo. Cobro por visita (entrada + salida).", unit: "USD / visita" },
        ],
    },
    {
        section: "C) Gastos de Agencia", color: "#8b5cf6", icon: <Briefcase size={14} />, items: [
            { concept: "Honorarios de Agencia", field: "agency_fee", formula: "Fija por escala", explanation: "Comisión de agencia marítima.", unit: "USD / escala" },
            { concept: "Movilidad", field: "transport_agency", formula: "Tarifa fija", explanation: "Transporte de personal de agencia.", unit: "USD fijo" },
            { concept: "Comunicaciones", field: "comms_agency", formula: "Tarifa fija", explanation: "Gastos de comunicación.", unit: "USD fijo" },
        ],
    },
];

export const FORMULA_GUIDE_CL: FormulaSection[] = [
    {
        section: "A) Maniobras (Shifting)", color: "#f59e0b", icon: <Zap size={14} />, items: [
            { concept: "Practicaje (Pilotage)", field: "pilotage", tooltip: "Maniobra", formula: "Tarifa Fija", explanation: "Tarifa fija según Autoridad Marítima por la asistencia del Práctico.", unit: "USD / maniobra" },
            { concept: "Remolcadores (Towage)", field: "towage_1st", tooltip: "x4 maniobras", formula: "Tarifa × 4", explanation: "Servicio de remolque por maniobra (ej. mooring/unmooring). Usualmente operado por Ultratug o PSA.", unit: "USD / maniobra" },
            { concept: "Pilot Insurance", field: "pilot_insurance", tooltip: "amarre/desamarre/anchorage", formula: "Tarifa Fija", explanation: "Seguro obligatorio para el Práctico en maniobras de amarre/desamarre/fondeo.", unit: "USD fijo" },
            { concept: "Amarradores (Linesmen)", field: "linesmen", formula: "Tarifa Fija", explanation: "Tarifa fija por amarradores en tierra.", unit: "USD / servicio" },
        ],
    },
    {
        section: "B) Gastos Generales de Puerto", color: "#0ea5e9", icon: <Waves size={14} />, items: [
            { concept: "Faro (Light Dues)", field: "lighthouse_dues", tooltip: "Tarifa × GRT", formula: "Tarifa × GRT", explanation: "Tarifa anual de faros en Chile (aprox. $1.60/GRT), que se prorratea o cobra a la nave si no lo tiene vigente.", unit: "USD / GRT" },
            { concept: "Muellaje (Dockage)", field: "dockage", tooltip: "Tarifa × LOA × Hr", formula: "Tarifa × LOA × Hr", explanation: "Cobro del terminal por uso de frente de atraque en base a la eslora (LOA) y horas de ocupación.", unit: "USD / m·hr" },
            { concept: "Lancha Anchorage", field: "launch_anchorage", formula: "Tarifa / Hr", explanation: "Lancha requerida en zona de fondeo (por hora).", unit: "USD / hora" },
            { concept: "Uso de Muelle de Lancha", field: "launch_pier_usage", formula: "Tarifa Fija", explanation: "Cobro del terminal por el uso de muelle exclusivo de lanchas.", unit: "USD fijo" },
            { concept: "Lancha Recepción/Amarre", field: "launch_mooring", formula: "Tarifa Fija", explanation: "Servicio de lancha para amarre/desamarre o recepción de la nave.", unit: "USD / servicio" },
            { concept: "Lancha Clearance (In/Out)", field: "launch_clearance", formula: "Tarifa Fija", explanation: "Lanchas utilizadas por autoridades en entrada y salida (Inward/Outward clearances).", unit: "USD / servicio" },
            { concept: "Transporte de Práctico", field: "pilot_transport", formula: "Tarifa Fija", explanation: "Transporte terrestre del Práctico desde/hacia el terminal.", unit: "USD fijo" },
            { concept: "Transporte de Autoridades", field: "authorities_transport", formula: "Tarifa Fija", explanation: "Transporte terrestre para autoridades entrantes y salientes.", unit: "USD fijo" },
            { concept: "Cargos Autoridades (Clearance)", field: "authorities_charges", formula: "Tarifa Fija", explanation: "Cargos oficiales por despacho (Authorities clearance fee).", unit: "USD fijo" },
            { concept: "ISPS Fee", field: "isps_fee", formula: "Tarifa Fija", explanation: "Cargo de seguridad portuaria internacional (ISPS) del terminal.", unit: "USD fijo" },
            { concept: "Migraciones", field: "immigration_authorities", formula: "Tarifa Fija", explanation: "Tarifa de Policía de Investigaciones (PDI) de Chile.", unit: "USD fijo" },
            { concept: "Sanidad Marítima", field: "sanitary_inspection", formula: "Tarifa Fija", explanation: "Inspección de sanidad y salud a bordo.", unit: "USD fijo" },
            { concept: "Loading Master", field: "loading_master", formula: "Tarifa Fija", explanation: "Honorarios del supervisor de carga (Loading Master) por el tiempo de estadía.", unit: "USD fijo" },
        ],
    },
    {
        section: "C) Gastos de Agencia", color: "#8b5cf6", icon: <Briefcase size={14} />, items: [
            { concept: "Honorarios de Agencia", field: "agency_fee", formula: "Tarifa Fija", explanation: "Fee fijo por agenciamiento marítimo en puerto chileno.", unit: "USD / escala" },
        ],
    },
];

export const getFormulaGuide = (countryCode: string): FormulaSection[] => {
    const code = countryCode.trim().toUpperCase();
    if (code === 'CL' || code === 'CHILE') {
        return FORMULA_GUIDE_CL;
    }
    // Default to PE (Ecuador will use PE for now until we have specific EC definitions)
    return FORMULA_GUIDE_PE;
};
