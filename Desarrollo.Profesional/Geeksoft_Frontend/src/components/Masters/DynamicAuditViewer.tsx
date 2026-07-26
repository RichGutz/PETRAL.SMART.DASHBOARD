import React, { useState, useMemo, useEffect } from 'react';
import { Anchor, ArrowRightLeft, Printer } from 'lucide-react';
import logoPetral from '../../assets/Logo.Petral.png';
import logoGeeksoft from '../../assets/Logo.Geeksoft.png';
import { ForecastService } from '../../services/api';

interface CallaoAuditViewerProps {
    initialRoute?: string;
    initialVesselId?: string;
    initialCargoTons?: number;
    initialLoadRate?: number;
    initialDischargeRate?: number;
}

// Función Evaluadora Universal de Auditoría por Puerto (Exportada a nivel de módulo)
export const computePortItems = (portCode: string, vesselObj: any, portHrs: number, isNational: boolean, tugsIn: number, tugsOut: number, isCasino: boolean) => {
    const loa = vesselObj.loa;
    const grt = vesselObj.grt;
    const stayDays = Math.max(1, Math.ceil(portHrs / 24.0));
    const dockageRateP = 1.50;
    const towageRateP = 800.00;
    const launchRateP = 85.00;
    const agencyFeeP = 1000.00;

    if (portCode === "MARCONA") {
        const extraStandby = portHrs > 48.0 ? 3000.00 : 0.0;
        const lighthouseRate = isNational ? 0.03 : 0.12;
        const totalLighthouse = Math.round(lighthouseRate * grt * 100) / 100;
        const standbyBase = Math.min(1800.00, portHrs * 40.0);

        return [
            { id: 1, category: "A_SHIFTING", concept: "Servicio Integral Atraque (Convenio SPCC)", supplier: "PSA Marine S.A.", sourceTag: "Acuerdo Marco SPCC 2025-2027", formula: "Tarifa Convenio Cerrado Southern", cost: 30508.48, rule: "SPCC" },
            { id: 2, category: "A_SHIFTING", concept: "Port Toll & Terminal Access Fee", supplier: "Trans Total", sourceTag: "P:Tarifario | Q:Maniobras", formula: "P: $75.00/acc. x Q: 2 Maniobras", cost: 150.00, rule: "Tarifa Agencia" },
            { id: 3, category: "B_GENERAL_PORT", concept: "Derechos de Faro y Balisas", supplier: "DHN / Autoridad Portuaria", sourceTag: "P:Tarifario | Q:GRT & País", formula: `P: $${lighthouseRate.toFixed(2)}/GRT x Q: ${grt.toLocaleString()} GRT (${isNational ? 'Nacional' : 'Extranjero'})`, cost: totalLighthouse, rule: "Regla Origen" },
            { id: 4, category: "B_GENERAL_PORT", concept: "Coordinador a Bordo", supplier: "Trans Total", sourceTag: "P:Tarifario | Q:Días", formula: "P: $225.00/día x Q: 2 Días", cost: 450.00, rule: "Agencia" },
            { id: 5, category: "B_GENERAL_PORT", concept: "Inspección Sanitaria (Sanidad APN)", supplier: "Sanidad Marítima", sourceTag: "P:Tarifario Flat", formula: "P: $670.00 Flat Sanidad Marcona", cost: 670.00, rule: "Sanidad" },
            { id: 6, category: "B_GENERAL_PORT", concept: "Lancha Autoridades & Clearance", supplier: "Trans Total", sourceTag: "P:Tarifario Flat", formula: "P: $200 Clearance + $200 Lancha", cost: 400.00, rule: "Agencia" },
            { id: 7, category: "B_GENERAL_PORT", concept: "Lancha Stand-By Operativa", supplier: "PSA Marine S.A.", sourceTag: "P:Tarifario Standby", formula: `Covered in Flat (${Math.min(48.0, portHrs).toFixed(1)}h)` + (extraStandby > 0 ? ` + $${extraStandby.toFixed(2)} (>48h)` : ''), cost: standbyBase + extraStandby, rule: "Standby" },
            { id: 8, category: "C_AGENCY", concept: "Honorarios Agenciamiento Marítimo", supplier: "Trans Total Agencia", sourceTag: "P:Tarifario Agencia", formula: "P: $1,400.00 Base Agency Fee", cost: 1400.00, rule: "Acuerdo Agencia" },
            { id: 9, category: "C_AGENCY", concept: "Movilidad & Transporte Local", supplier: "Trans Total Agencia", sourceTag: "P:Tarifario Gastos", formula: "P: $200.00 Flat Movilidad", cost: 200.00, rule: "Gastos Agencia" },
            { id: 10, category: "C_AGENCY", concept: "Comunicaciones & Puerto", supplier: "Trans Total Agencia", sourceTag: "P:Tarifario Gastos", formula: "P: $250.00 Flat Comunicaciones", cost: 250.00, rule: "Gastos Agencia" }
        ];
    } else if (portCode === "MATARANI") {
        const basePSA = 3368.00;
        const psaOT = isCasino ? basePSA * 0.25 : 0.0;
        const totalPSA = (basePSA * 2) + psaOT;
        // OT Matarani: Lanchas+Coordinador +25% en zarpe nocturno
        const launchesOtMat = isCasino ? 960.00 * 1.25 : 960.00;
        const lighthouseRate = isNational ? 0.03 : 0.12;
        const totalLighthouse = Math.round(lighthouseRate * grt * 100) / 100;
        const totalDockage = Math.round(0.65 * loa * portHrs * 100) / 100;

        return [
            { id: 1, category: "A_SHIFTING", concept: "Servicio Integral PSA (Addenda 39.31%)", supplier: "PSA Marine S.A.", sourceTag: `Addenda Tisur ${isCasino ? '(🌙 Casino +25%)' : ''}`, formula: `P: $3,368.00/mnvr x Q: 2 ${isCasino ? '+ $842.00 OT' : ''}`, cost: totalPSA, rule: isCasino ? "Addenda + Casino" : "Addenda PSA" },
            { id: 2, category: "A_SHIFTING", concept: "Cargo Acceso Tisur", supplier: "Tisur S.A.", sourceTag: "P:Tisur", formula: "P: $70.00/acc. x Q: 4 Accesos", cost: 280.00, rule: "Tisur" },
            { id: 3, category: "A_SHIFTING", concept: "Linesmen (Amarre y Desamarre)", supplier: "Trans Total", sourceTag: "P:Tisur", formula: "P: $357.30 Flat Amarre", cost: 357.30, rule: "Tisur" },
            { id: 4, category: "A_SHIFTING", concept: "Terminal Fee / Port Toll", supplier: "Trans Total", sourceTag: "P:Tisur", formula: "P: $75.00/mnvr x Q: 2 Maniobras", cost: 150.00, rule: "Tisur" },
            { id: 5, category: "B_GENERAL_PORT", concept: "Derechos de Faro y Balisas", supplier: "Autoridad Portuaria", sourceTag: "P:Tarifario | Q:GRT & País", formula: `P: $${lighthouseRate.toFixed(2)}/GRT x Q: ${grt.toLocaleString()} GRT (${isNational ? 'Nacional' : 'Extranjero'})`, cost: totalLighthouse, rule: "Regla Origen" },
            { id: 6, category: "B_GENERAL_PORT", concept: "Muellaje TISUR Matarani", supplier: "TISUR Matarani", sourceTag: "P:Tisur | Q:LOA & Horas", formula: `P: $0.65/m/h x Q_LOA: ${loa.toFixed(2)}m x Q_hrs: ${portHrs.toFixed(1)}h`, cost: totalDockage, rule: "Pass-Through" },
            { id: 7, category: "B_GENERAL_PORT", concept: "Inspección Sanitaria Marítima", supplier: "Sanidad Arequipa", sourceTag: "P:Sanidad Flat", formula: "P: $670.00 Flat Sanidad Matarani", cost: 670.00, rule: "Sanidad" },
            { id: 8, category: "B_GENERAL_PORT", concept: "Lanchas Autoridades & Clearance", supplier: "Trans Total Matarani", sourceTag: `P:Tarifario ${isCasino ? '(🌙 OT +25%)' : ''}`, formula: `$${launchesOtMat.toFixed(2)} (Lancha+Clearance+Coord.)`, cost: launchesOtMat, rule: isCasino ? "Agencia + Casino" : "Agencia" },
            { id: 9, category: "C_AGENCY", concept: "Honorarios Agenciamiento", supplier: "Trans Total Matarani", sourceTag: "P:Tarifario Agencia", formula: "P: $1,100.00 Base Agency Fee", cost: 1100.00, rule: "Acuerdo Agencia" },
            { id: 10, category: "C_AGENCY", concept: "Movilidad & Transporte", supplier: "Trans Total Matarani", sourceTag: "P:Tarifario Gastos", formula: "P: $200.00 Flat Movilidad", cost: 200.00, rule: "Gastos Agencia" },
            { id: 11, category: "C_AGENCY", concept: "Comunicaciones Agencia", supplier: "Trans Total Matarani", sourceTag: "P:Tarifario Gastos", formula: "P: $250.00 Flat Comunicaciones", cost: 250.00, rule: "Gastos Agencia" }
        ];
    } else if (portCode === "ILO") {
        const linesmenTotal = 680.00;
        const dockageSpcc = Math.round((300.00 + (0.05 * grt * stayDays)) * 100) / 100;
        const psaTowage = Math.max(3600.00, 0.16 * grt * 2);
        const psaPos = 1400.00;
        const petransoTowage = Math.round((0.18 * grt * 2 * 0.90) * 100) / 100;
        const petransoPos = 1260.00;
        const otTugs = isCasino ? 1643.31 : 0.0;
        // OT Ilo: Practicaje OUT +25%, Lanchas zarpe +25%
        const pilotageOutIlo = isCasino ? 1500.00 * 1.25 : 1500.00;
        const launchesOtIlo = isCasino ? 2600.00 * 1.25 : 2600.00;
        const lighthouseRate = isNational ? 0.03 : 0.12;
        const totalLighthouse = Math.round(lighthouseRate * grt * 100) / 100;

        return [
            { id: 1, category: "A_SHIFTING", concept: "Practicaje IN (Atraque)", supplier: "Port Operations", sourceTag: "P:SPCC", formula: "P: $1,500.00 x 1 maniobra", cost: 1500.00, rule: "Port Operations" },
            { id: 2, category: "A_SHIFTING", concept: "Practicaje OUT (Zarpe)", supplier: "Port Operations", sourceTag: `P:SPCC ${isCasino ? '(🌙 OT +25%)' : ''}`, formula: `P: $${pilotageOutIlo.toFixed(2)} x 1 maniobra`, cost: pilotageOutIlo, rule: isCasino ? "Port Operations + Casino" : "Port Operations" },
            { id: 3, category: "A_SHIFTING", concept: "Remolcaje Base PSA Marine", supplier: "PSA Marine", sourceTag: `P:Tarifario ${isCasino ? '(🌙 OT +25%)' : ''}`, formula: `PSA Mínimo: $${psaTowage.toFixed(2)}`, cost: psaTowage, rule: "Remolques" },
            { id: 4, category: "A_SHIFTING", concept: "Remolcaje Base Petranso (-10%)", supplier: "Petranso", sourceTag: "P:Tarifario", formula: `Petranso (-10%): $${petransoTowage.toFixed(2)}`, cost: petransoTowage, rule: "Remolques" },
            { id: 5, category: "A_SHIFTING", concept: "Overtime Remolques (PSA + Petranso)", supplier: "PSA / Petranso", sourceTag: "Overtime", formula: isCasino ? "25% Recargo Overtime ($1,643.31)" : "$0.00 Ordinario", cost: otTugs, rule: "Overtime" },
            { id: 6, category: "A_SHIFTING", concept: "Posicionamiento Remolques & Linesmen", supplier: "PSA / Petranso / Agencia", sourceTag: "P:Tarifario", formula: "$1,400 PSA + $1,260 Petranso + $680 Linesmen + $150 Toll", cost: psaPos + petransoPos + linesmenTotal + 150.00, rule: "Posicionamiento" },
            { id: 7, category: "A_SHIFTING", concept: "Muellaje SPCC Ilo (Dockage)", supplier: "Southern Perú SPCC", sourceTag: "P:SPCC", formula: `P: $300 Amarre + ($0.05 x ${grt.toLocaleString()} GRT x ${stayDays}d)`, cost: dockageSpcc, rule: "Pass-Through" },
            { id: 8, category: "B_GENERAL_PORT", concept: "Derechos de Faro y Balisas", supplier: "Autoridad Portuaria", sourceTag: "P:Tarifario", formula: `P: $${lighthouseRate.toFixed(2)}/GRT x Q: ${grt.toLocaleString()} GRT (${isNational ? 'Nacional' : 'Extranjero'})`, cost: totalLighthouse, rule: "Regla Origen" },
            { id: 9, category: "B_GENERAL_PORT", concept: "Lanchas de Servicio Operativas", supplier: "Trans Total Ilo", sourceTag: `P:Tarifario ${isCasino ? '(🌙 OT +25%)' : ''}`, formula: `$${launchesOtIlo.toFixed(2)} (Amarre+Autoridades+Coord.+Posic.)`, cost: launchesOtIlo, rule: isCasino ? "Lanchas Ilo + Casino" : "Lanchas Ilo" },
            { id: 10, category: "B_GENERAL_PORT", concept: "Inspección Sanitaria, Clearance & Coordinador", supplier: "Sanidad / APN", sourceTag: "P:Sanidad", formula: "$520 Sanidad + $200 Clearance + $400 Coordinador", cost: 1120.00, rule: "Sanidad" },
            { id: 11, category: "C_AGENCY", concept: "Honorarios Agenciamiento", supplier: "Trans Total Ilo", sourceTag: "P:Tarifario Agencia", formula: "P: $900.00 Base Agency Fee", cost: 900.00, rule: "Acuerdo Agencia" },
            { id: 12, category: "C_AGENCY", concept: "Movilidad & Transporte", supplier: "Trans Total Ilo", sourceTag: "P:Tarifario Gastos", formula: "P: $200.00 Flat Movilidad", cost: 200.00, rule: "Gastos Agencia" },
            { id: 13, category: "C_AGENCY", concept: "Comunicaciones Agencia", supplier: "Trans Total Ilo", sourceTag: "P:Tarifario Gastos", formula: "P: $200.00 Flat Comunicaciones", cost: 200.00, rule: "Gastos Agencia" }
        ];
    } else if (portCode === "MEJILLONES" || portCode === "PUERTO ANGAMOS" || portCode === "BARQUITO" || portCode === "ARICA" || portCode === "IQUIQUE" || portCode === "ANTOFAGASTA") {
        // Evaluación Tarifaria Oficial Puertos Chilenos (Directemar + SAAM/Ultratug + Agunsa)
        const pilotageChile = Math.max(850.00, 0.06 * grt);
        // OT Chile: Practicaje OUT +25%, Remolcaje OUT +25%, Amarre/Desamarre +25% (Directemar Tabla B)
        const pilotageOutChile = isCasino ? pilotageChile * 1.25 : pilotageChile;
        const towageChile = Math.max(1200.00, 0.14 * grt);
        const towageOutChile = isCasino ? towageChile * 1.25 : towageChile;
        const linesChile = isCasino ? 450.00 * 1.25 : 450.00;
        const dockageChile = Math.round(1.80 * loa * portHrs * 100) / 100;
        const lighthouseRate = isNational ? 0.03 : 0.12;
        const totalLighthouse = Math.round(lighthouseRate * grt * 100) / 100;
        const agencyChile = 1200.00;

        return [
            { id: 1, category: "A_SHIFTING", concept: "Practicaje Directemar IN (Atraque)", supplier: "Prácticos de Puerto Chile", sourceTag: "Tarifa Directemar", formula: `P: $${pilotageChile.toFixed(2)} x 1 maniobra`, cost: pilotageChile, rule: "Tarifa Directemar" },
            { id: 2, category: "A_SHIFTING", concept: "Practicaje Directemar OUT (Zarpe)", supplier: "Prácticos de Puerto Chile", sourceTag: `Tarifa Directemar ${isCasino ? '(🌙 OT +25%)' : ''}`, formula: `P: $${pilotageOutChile.toFixed(2)} x 1 maniobra`, cost: pilotageOutChile, rule: isCasino ? "Directemar + Casino" : "Tarifa Directemar" },
            { id: 3, category: "A_SHIFTING", concept: "Remolcaje IN (SAAM / Ultratug)", supplier: "SAAM Towage / Ultratug", sourceTag: "Tarifa SAAM", formula: `P: $${towageChile.toFixed(2)} x Q: ${tugsIn} remolques`, cost: towageChile * tugsIn, rule: "Tarifa Remolques CL" },
            { id: 4, category: "A_SHIFTING", concept: "Remolcaje OUT (SAAM / Ultratug)", supplier: "SAAM Towage / Ultratug", sourceTag: `Tarifa SAAM ${isCasino ? '(🌙 OT +25%)' : ''}`, formula: `P: $${towageOutChile.toFixed(2)} x Q: ${tugsOut} remolques`, cost: towageOutChile * tugsOut, rule: isCasino ? "SAAM + Casino" : "Tarifa Remolques CL" },
            { id: 5, category: "A_SHIFTING", concept: "Amarre / Desamarre de Líneas", supplier: "Agencia Marítima Chile", sourceTag: `Tarifario Terminal ${isCasino ? '(🌙 OT +25%)' : ''}`, formula: `P: $${linesChile.toFixed(2)} Flat Líneas`, cost: linesChile, rule: isCasino ? "Líneas Terminal + Casino" : "Líneas Terminal" },
            { id: 6, category: "B_GENERAL_PORT", concept: "Derechos de Faro y Balisas Chile", supplier: "Directemar Armada de Chile", sourceTag: "Directemar CL", formula: `P: $${lighthouseRate.toFixed(2)}/GRT x Q: ${grt.toLocaleString()} GRT`, cost: totalLighthouse, rule: "Directemar CL" },
            { id: 7, category: "B_GENERAL_PORT", concept: "Muellaje Terminal Puerto CL", supplier: "Terminal Portuario CL", sourceTag: "Tarifario Terminal", formula: `P: $1.80/m/h x Q_LOA: ${loa.toFixed(2)}m x Q_hrs: ${portHrs.toFixed(1)}h`, cost: dockageChile, rule: "Tarifa Terminal CL" },
            { id: 8, category: "B_GENERAL_PORT", concept: "Lanchas & Autoridades Reception", supplier: "Agencia Marítima Chile", sourceTag: "Gastos Puerto CL", formula: "P: $350.00 Flat Lancha", cost: 350.00, rule: "Agencia CL" },
            { id: 9, category: "C_AGENCY", concept: "Honorarios Agenciamiento Marítimo CL", supplier: "Agencia Marítima CL", sourceTag: "Agencia CL", formula: `P: $${agencyChile.toFixed(2)} Base Agency Fee`, cost: agencyChile, rule: "Agencia CL" },
            { id: 10, category: "C_AGENCY", concept: "Movilidad & Transporte Local", supplier: "Agencia Marítima CL", sourceTag: "Gastos Agencia", formula: "P: $200.00 Flat Movilidad", cost: 200.00, rule: "Gastos Agencia" },
            { id: 11, category: "C_AGENCY", concept: "Comunicaciones & Puerto", supplier: "Agencia Marítima CL", sourceTag: "Gastos Agencia", formula: "P: $250.00 Flat Comunicaciones", cost: 250.00, rule: "Gastos Agencia" }
        ];
    } else {
        // CALLAO (APM Terminals)
        const basePilotage = Math.max(750.00, 0.055 * grt);
        const pilotageOut = isCasino ? basePilotage * 1.25 : basePilotage;
        const towageOutRate = isCasino ? towageRateP * 1.25 : towageRateP;
        // OT Callao: Lanchas OUT +25%, Coordinador +25% (turno nocturno)
        const launchOtCallao = isCasino ? launchRateP * 4 * 1.25 : launchRateP * 4;
        const coordOtCallao = isCasino ? 450.00 * 1.25 : 450.00;
        const lighthouseRate = isNational ? 0.03 : 0.12;
        const totalLighthouse = Math.round(lighthouseRate * grt * 100) / 100;
        const totalDockage = Math.round(dockageRateP * loa * portHrs * 100) / 100;

        return [
            { id: 1, category: "A_SHIFTING", concept: "Practicaje IN (Atraque)", supplier: "Trans Total", sourceTag: "P:Tarifario", formula: `P: $${basePilotage.toFixed(2)} x 1 maniobra`, cost: basePilotage, rule: "Tarifa Trans Total" },
            { id: 2, category: "A_SHIFTING", concept: "Practicaje OUT (Zarpe)", supplier: "Trans Total", sourceTag: `P:Tarifario ${isCasino ? '(🌙 Casino +25%)' : ''}`, formula: `P: $${pilotageOut.toFixed(2)} x 1 maniobra`, cost: pilotageOut, rule: isCasino ? "Tarifa Trans Total + Casino" : "Tarifa Trans Total" },
            { id: 3, category: "A_SHIFTING", concept: "Remolcaje IN (Petranso)", supplier: "Petranso", sourceTag: "P:Tarifario", formula: `P: $800.00/rem x Q: ${tugsIn} remolques`, cost: towageRateP * tugsIn, rule: "Tarifa Petranso" },
            { id: 4, category: "A_SHIFTING", concept: "Remolcaje OUT (Petranso)", supplier: "Petranso", sourceTag: `P:Tarifario ${isCasino ? '(🌙 Casino +25%)' : ''}`, formula: `P: $${towageOutRate.toFixed(2)}/rem x Q: ${tugsOut} remolques`, cost: towageOutRate * tugsOut, rule: isCasino ? "Tarifa Petranso + Casino" : "Tarifa Petranso" },
            { id: 5, category: "A_SHIFTING", concept: "Cargo Acceso Atraque IN", supplier: "APM Terminals", sourceTag: "P:Tarifario", formula: "P: $70.00 x 2 accesos", cost: 140.00, rule: "Tarifa APM" },
            { id: 6, category: "A_SHIFTING", concept: "Cargo Acceso Zarpe OUT", supplier: "APM Terminals", sourceTag: "P:Tarifario", formula: "P: $70.00 x 2 accesos", cost: 140.00, rule: "Tarifa APM" },
            { id: 7, category: "B_GENERAL_PORT", concept: "Derechos de Faro y Balisas", supplier: "Autoridad Portuaria", sourceTag: "P:Tarifario", formula: `P: $${lighthouseRate.toFixed(2)}/GRT x Q: ${grt.toLocaleString()} GRT (${isNational ? 'Nacional' : 'Extranjero'})`, cost: totalLighthouse, rule: "Regla Origen" },
            { id: 8, category: "B_GENERAL_PORT", concept: "Muellaje APM Terminals", supplier: "APM Terminals", sourceTag: "P:Tarifario", formula: `P: $${dockageRateP.toFixed(2)}/m/h x Q_LOA: ${loa.toFixed(2)}m x Q_hrs: ${portHrs.toFixed(1)}h`, cost: totalDockage, rule: "Tarifa APM" },
            { id: 9, category: "B_GENERAL_PORT", concept: "Lanchas Operativas OUT", supplier: "Trans Total", sourceTag: `P:Tarifario ${isCasino ? '(🌙 Casino +25%)' : ''}`, formula: `P: $${launchRateP.toFixed(2)}/h x Q: 4h${isCasino ? ' x 1.25 OT' : ''}`, cost: launchOtCallao, rule: isCasino ? "Agencia + Casino" : "Agencia" },
            { id: 10, category: "B_GENERAL_PORT", concept: "Coordinador a Bordo", supplier: "Trans Total", sourceTag: `P:Tarifario ${isCasino ? '(🌙 Casino +25%)' : ''}`, formula: `P: $225.00/turno x Q: 2${isCasino ? ' x 1.25 OT' : ''}`, cost: coordOtCallao, rule: isCasino ? "Agencia + Casino" : "Agencia" },
            { id: 11, category: "B_GENERAL_PORT", concept: "Clearance (Entrada / Salida)", supplier: "Autoridades Portuarias", sourceTag: "P:Tarifario Flat", formula: "P: $200.00 Flat In/Out", cost: 200.00, rule: "Fijo" },
            { id: 12, category: "B_GENERAL_PORT", concept: "Inspección Sanitaria Marítima", supplier: "Sanidad Marítima", sourceTag: "P:Tarifario Sanidad", formula: "P: $520.00 Flat Sanidad Callao", cost: 520.00, rule: "Sanidad" },
            { id: 13, category: "C_AGENCY", concept: "Honorarios Agenciamiento", supplier: "Trans Total Agencia", sourceTag: "P:Tarifario Agencia", formula: `P: $${agencyFeeP.toFixed(2)} Base Agency Fee`, cost: agencyFeeP, rule: "Acuerdo Agencia" },
            { id: 14, category: "C_AGENCY", concept: "Movilidad & Transporte Local", supplier: "Trans Total Agencia", sourceTag: "P:Tarifario Gastos", formula: "P: $200.00 Flat Movilidad", cost: 200.00, rule: "Gastos Agencia" },
            { id: 15, category: "C_AGENCY", concept: "Comunicaciones Agencia", supplier: "Trans Total Agencia", sourceTag: "P:Tarifario Gastos", formula: "P: $200.00 Flat Comunicaciones", cost: 200.00, rule: "Gastos Agencia" }
        ];
    }
};

export const DynamicAuditViewer: React.FC<CallaoAuditViewerProps> = ({
    initialRoute = "NEXA_CALLAO_MATARANI",
    initialVesselId = "MOQUEGUA",
    initialCargoTons = 13500,
    initialLoadRate = 500,
    initialDischargeRate = 350
}) => {

    // Inputs Compartidos del Viaje (Buque & Carga)
    const [selectedRoute, setSelectedRoute] = useState<string>(initialRoute);

    const [selectedVesselId, setSelectedVesselId] = useState<string>(initialVesselId);
    const [cargoTons, setCargoTons] = useState<number>(initialCargoTons);

    // ==========================================
    // ESCALA 1: PUERTO DE CARGA (CALLAO APM)
    // ==========================================
    const [loadRate, setLoadRate] = useState<number>(initialLoadRate); // MT/h
    const [_entryDateLoad, _setEntryDateLoad] = useState<string>("2026-07-25T08:00");
    const [exitDateLoad, _setExitDateLoad] = useState<string>("2026-07-26T23:30");
    const [portHoursLoad, setPortHoursLoad] = useState<number>(39.5);
    const [isNationalLoad, _setIsNationalLoad] = useState<boolean>(true);
    const [tugboatsInLoad, _setTugboatsInLoad] = useState<number>(2);
    const [tugboatsOutLoad, _setTugboatsOutLoad] = useState<number>(2);

    // ==========================================
    // ESCALA 2: PUERTO DE DESCARGA (MATARANI TISUR - MOCK)
    // ==========================================
    const [dischargeRate, setDischargeRate] = useState<number>(initialDischargeRate); // MT/h

    const [_entryDateDischarge, _setEntryDateDischarge] = useState<string>("2026-07-28T10:00");
    const [exitDateDischarge, _setExitDateDischarge] = useState<string>("2026-07-29T21:30");

    const [portHoursDischarge, setPortHoursDischarge] = useState<number>(35.5);
    const [isNationalDischarge, _setIsNationalDischarge] = useState<boolean>(true);
    const [tugboatsInDischarge, _setTugboatsInDischarge] = useState<number>(2);
    const [tugboatsOutDischarge, _setTugboatsOutDischarge] = useState<number>(2);

    // Mapeo de Rutas Comercial

    const routesMap: Record<string, string> = {
        "NEXA_CALLAO_MATARANI": "[NEXA] CALLAO ➔ MATARANI",
        "NEXA_CALLAO_ILO": "[NEXA] CALLAO ➔ ILO",
        "NEXA_MATARANI_CALLAO": "[NEXA] MATARANI ➔ CALLAO",
        "SPCC_MARCONA_ILO": "[SPCC] MARCONA ➔ ILO",
        "SPCC_ILO_CALLAO": "[SPCC] ILO ➔ CALLAO",
        "SPCC_MATARANI_ILO": "[SPCC] MATARANI ➔ ILO",
        "SPCC_ILO_MATARANI": "[SPCC] ILO ➔ MATARANI"
    };

    // Maestro de Buques
    const defaultVessels: Record<string, any> = {
        "MOQUEGUA": { vessel_name: "BT MOQUEGUA", loa: 134.16, grt: 8259, dwt: 14298 },
        "TABLONES": { vessel_name: "BT TABLONES", loa: 134.16, grt: 8259, dwt: 14298 },
        "HUEMUL": { vessel_name: "BT HUEMUL", loa: 134.16, grt: 8259, dwt: 14298 },
        "CONCON_TRADER": { vessel_name: "CONCON TRADER", loa: 134.16, grt: 8259, dwt: 14298 }
    };

    const vessel = defaultVessels[selectedVesselId] || defaultVessels["MOQUEGUA"];

    // Handlers Carga
    const handleCargoOrRateLoadChange = (tons: number, rate: number) => {
        setCargoTons(tons);
        setLoadRate(rate);
        if (rate > 0 && tons > 0) {
            setPortHoursLoad(Math.round((tons / rate) * 10) / 10);
        }
    };

    // Handlers Descarga
    const handleCargoOrRateDischargeChange = (tons: number, rate: number) => {
        setCargoTons(tons);
        setDischargeRate(rate);
        if (rate > 0 && tons > 0) {
            setPortHoursDischarge(Math.round((tons / rate) * 10) / 10);
        }
    };




    // Regla Casino Nocturno Carga
    const isCasinoNightLoad = useMemo(() => {
        if (!exitDateLoad) return false;
        const d = new Date(exitDateLoad);
        const hour = d.getHours();
        return (hour >= 23 || hour < 6 || d.getDay() === 0);
    }, [exitDateLoad]);

    // Regla Casino Nocturno Descarga
    const isCasinoNightDischarge = useMemo(() => {
        if (!exitDateDischarge) return false;
        const d = new Date(exitDateDischarge);
        const hour = d.getHours();
        return (hour >= 23 || hour < 6 || d.getDay() === 0);
    }, [exitDateDischarge]);

    // Mapeo dinámico de Rutas y Puertos
    const routePortMapping: Record<string, { loadPort: string; loadName: string; dischargePort: string; dischargeName: string }> = {
        "NEXA_CALLAO_MATARANI": { loadPort: "CALLAO", loadName: "CALLAO (APM Terminals)", dischargePort: "MATARANI", dischargeName: "MATARANI (Tisur S.A.)" },
        "NEXA_CALLAO_ILO": { loadPort: "CALLAO", loadName: "CALLAO (APM Terminals)", dischargePort: "ILO", dischargeName: "ILO (SPCC / Enapu)" },
        "NEXA_MATARANI_CALLAO": { loadPort: "MATARANI", loadName: "MATARANI (Tisur S.A.)", dischargePort: "CALLAO", dischargeName: "CALLAO (APM Terminals)" },
        "SPCC_MARCONA_ILO": { loadPort: "MARCONA", loadName: "MARCONA (San Juan SPCC)", dischargePort: "ILO", dischargeName: "ILO (SPCC / Enapu)" },
        "SPCC_ILO_CALLAO": { loadPort: "ILO", loadName: "ILO (SPCC / Enapu)", dischargePort: "CALLAO", dischargeName: "CALLAO (APM Terminals)" },
        "SPCC_MATARANI_ILO": { loadPort: "MATARANI", loadName: "MATARANI (Tisur S.A.)", dischargePort: "ILO", dischargeName: "ILO (SPCC / Enapu)" },
        "SPCC_ILO_MATARANI": { loadPort: "ILO", loadName: "ILO (SPCC / Enapu)", dischargePort: "MATARANI", dischargeName: "MATARANI (Tisur S.A.)" }
    };

    const activeRouteInfo = routePortMapping[selectedRoute] || routePortMapping["NEXA_CALLAO_MATARANI"];

    // Operaciones dinámicas de Terminal
    const [vesselTerminalOps, setVesselTerminalOps] = useState<any[]>([]);

    useEffect(() => {
        ForecastService.getVesselTerminalOperations().then(res => {
            if (res && Array.isArray(res)) {
                setVesselTerminalOps(res);
            }
        }).catch(err => console.error("Error cargando operaciones de terminal:", err));
    }, []);

    // Carga de Parámetros Dinámicos Carga
    const opLoad = useMemo(() => {
        const portCode = activeRouteInfo.loadPort;
        const vesselId = selectedVesselId;
        const matches = vesselTerminalOps.filter(op => op.port_id === portCode);
        return matches.find(op => op.vessel_id === vesselId) || matches.find(op => op.vessel_id === 'MOQUEGUA') || matches[0];
    }, [vesselTerminalOps, activeRouteInfo.loadPort, selectedVesselId]);

    const activeLoadRate = Number(opLoad?.ritmo_carga) > 0 ? Number(opLoad?.ritmo_carga) : loadRate;
    const mooringLoad = parseFloat(opLoad?.amarre_hrs ?? opLoad?.mooring_time_hrs ?? opLoad?.parameters?.amarre_hrs ?? opLoad?.parameters?.mooring_time_hrs ?? 1.5);
    const timeToCountLoad = parseFloat(opLoad?.time_to_count_carga_hrs ?? opLoad?.time_to_count_carga ?? opLoad?.parameters?.time_to_count_carga_hrs ?? opLoad?.parameters?.time_to_count_carga ?? 1.0);
    const unmooringLoad = parseFloat(opLoad?.desamarre_hrs ?? opLoad?.unmooring_time_hrs ?? opLoad?.parameters?.desamarre_hrs ?? opLoad?.parameters?.unmooring_time_hrs ?? 1.5);
    const extraLoad = parseFloat(opLoad?.maneuver_carga_hrs ?? opLoad?.parameters?.maneuver_carga_hrs ?? opLoad?.parameters?.extra_maneuver_carga ?? 0.0);
    const tugsInLoad = Number(opLoad?.tugboats_in) || Number(opLoad?.tugboats_count) || Number(opLoad?.parameters?.tugs_in) || 2;
    const tugsOutLoad = Number(opLoad?.tugboats_out) || Number(opLoad?.tugboats_count) || Number(opLoad?.parameters?.tugs_out) || 2;

    const qFijoLoad = mooringLoad + timeToCountLoad + unmooringLoad + extraLoad;

    // Carga de Parámetros Dinámicos Descarga
    const opDischarge = useMemo(() => {
        const portCode = activeRouteInfo.dischargePort;
        const vesselId = selectedVesselId;
        const matches = vesselTerminalOps.filter(op => op.port_id === portCode);
        return matches.find(op => op.vessel_id === vesselId) || matches.find(op => op.vessel_id === 'MOQUEGUA') || matches[0];
    }, [vesselTerminalOps, activeRouteInfo.dischargePort, selectedVesselId]);

    const activeDischargeRate = Number(opDischarge?.ritmo_descarga) > 0 ? Number(opDischarge?.ritmo_descarga) : dischargeRate;
    const mooringDischarge = parseFloat(opDischarge?.amarre_hrs ?? opDischarge?.mooring_time_hrs ?? opDischarge?.parameters?.amarre_hrs ?? opDischarge?.parameters?.mooring_time_hrs ?? 1.5);
    const timeToCountDischarge = parseFloat(opDischarge?.time_to_count_descarga_hrs ?? opDischarge?.time_to_count_descarga ?? opDischarge?.parameters?.time_to_count_descarga_hrs ?? opDischarge?.parameters?.time_to_count_descarga ?? 1.0);
    const unmooringDischarge = parseFloat(opDischarge?.desamarre_hrs ?? opDischarge?.unmooring_time_hrs ?? opDischarge?.parameters?.desamarre_hrs ?? opDischarge?.parameters?.unmooring_time_hrs ?? 1.5);
    const extraDischarge = parseFloat(opDischarge?.maneuver_descarga_hrs ?? opDischarge?.parameters?.maneuver_descarga_hrs ?? opDischarge?.parameters?.extra_maneuver_descarga ?? 0.0);
    const tugsInDischarge = Number(opDischarge?.tugboats_in) || Number(opDischarge?.tugboats_count) || Number(opDischarge?.parameters?.tugs_in) || 2;
    const tugsOutDischarge = Number(opDischarge?.tugboats_out) || Number(opDischarge?.tugboats_count) || Number(opDischarge?.parameters?.tugs_out) || 2;

    const qFijoDischarge = mooringDischarge + timeToCountDischarge + unmooringDischarge + extraDischarge;

    // Auditoría Carga (Dape dinámicamente según activeRouteInfo.loadPort)
    const auditLoad = useMemo(() => {
        const items = computePortItems(activeRouteInfo.loadPort, vessel, portHoursLoad, isNationalLoad, tugboatsInLoad, tugboatsOutLoad, isCasinoNightLoad);
        return { items, total: items.reduce((sum, i) => sum + i.cost, 0) };
    }, [activeRouteInfo.loadPort, vessel, portHoursLoad, isNationalLoad, tugboatsInLoad, tugboatsOutLoad, isCasinoNightLoad]);

    // Auditoría Descarga (Dape dinámicamente según activeRouteInfo.dischargePort)
    const auditDischarge = useMemo(() => {
        const items = computePortItems(activeRouteInfo.dischargePort, vessel, portHoursDischarge, isNationalDischarge, tugboatsInDischarge, tugboatsOutDischarge, isCasinoNightDischarge);
        return { items, total: items.reduce((sum, i) => sum + i.cost, 0) };
    }, [activeRouteInfo.dischargePort, vessel, portHoursDischarge, isNationalDischarge, tugboatsInDischarge, tugboatsOutDischarge, isCasinoNightDischarge]);


    // Helper Generador de HTML para cada uno de los 4 PDFs
    const generatePdfHtml = (type: 'LOAD' | 'DISCHARGE', level: 'MIN' | 'MAX') => {

        const isLoad = type === 'LOAD';
        const isMin = level === 'MIN';

        const portCode = isLoad ? activeRouteInfo.loadPort : activeRouteInfo.dischargePort;
        const portName = isLoad ? activeRouteInfo.loadName : activeRouteInfo.dischargeName;
        const rate = isLoad ? loadRate : dischargeRate;
        const qOp = cargoTons / rate;
        const qFijo = isLoad ? qFijoLoad : qFijoDischarge;
        const totalHours = qOp + qFijo;
        const tugsIn = isLoad ? tugsInLoad : tugsInDischarge;
        const tugsOut = isLoad ? tugsOutLoad : tugsOutDischarge;
        const isNational = isLoad ? isNationalLoad : isNationalDischarge;

        // CLAVE: MIN siempre isCasino=false, MAX siempre isCasino=true
        const scenarioItems = computePortItems(portCode, vessel, totalHours, isNational, tugsIn, tugsOut, !isMin);
        const scenarioTotal = scenarioItems.reduce((sum, i) => sum + i.cost, 0);
        const finalTotal = scenarioTotal;

        const titleBadge = isMin
            ? '[NIVEL BAJO - HORARIO ORDINARIO]'
            : '[NIVEL ALTO - HORARIO RECARGO]';

        const scheduleTimeline = isMin
            ? `Atraque: Lunes 07:00 hrs ➔ Desatraque: ${isLoad ? 'Martes 14:00 hrs' : 'Miércoles 01:36 hrs'} (${totalHours.toFixed(1)} Horas en Muelle)\n  • RÉGIMEN HORARIO:      100% Horario Ordinario de Oficina (Office Hours sin recargos)`
            : `Atraque: Domingo 07:00 hrs (Dominical) ➔ Desatraque: ${isLoad ? 'Lunes (Feriado) 14:00 hrs' : 'Lunes (Feriado) 01:36 hrs'} (${totalHours.toFixed(1)} Horas en Muelle)\n  • RÉGIMEN HORARIO:      100% Recargo Nocturno / Dominical / Feriado (+25% a +50% Overtime & Regla Casino)`;

        const renderCategoryBlock = (catKey: string, catTitle: string) => {
            const catItems = scenarioItems.filter(i => i.category === catKey);
            const catSubtotal = catItems.reduce((sum, i) => sum + i.cost, 0);
            const itemsRows = catItems.map((item) => {
                const isPassThrough = item.rule?.includes('Pass-Through') || item.rule === 'SPCC' || item.concept?.toLowerCase().includes('muellaje') || item.concept?.toLowerCase().includes('standby');
                const rowStyle = isPassThrough ? 'background-color: #fef08a; font-weight: bold;' : '';
                return `
                <tr style="${rowStyle}">
                    <td style="border: 1px solid #000000; padding: 3px 5px; font-weight: bold;">${item.id}. ${item.concept} ${isPassThrough ? '[🟨]' : ''}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px;">${item.supplier}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px; font-size: 6.5pt; color: #334155;">${item.sourceTag}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px; font-family: 'Courier New', monospace;">${item.formula}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px; text-align: center;">${isMin ? 'Ordinario' : 'Overtime'}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px; text-align: right; font-weight: bold; font-family: 'Courier New', monospace;">$${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            `}).join('');

            return `
                <tr style="background-color: #e2e8f0; font-weight: bold;">
                    <td colspan="6" style="border: 1px solid #000000; padding: 4px 6px; font-size: 7.5pt; text-transform: uppercase;">
                        ${catTitle}
                    </td>
                </tr>
                ${itemsRows}
                <tr style="background-color: #f8fafc; font-weight: bold; font-size: 7pt;">
                    <td colspan="5" style="text-align: right; border: 1px solid #000000; padding: 3px 6px;">SUBTOTAL ${catTitle}:</td>
                    <td style="text-align: right; border: 1px solid #000000; padding: 3px 5px; font-family: 'Courier New', monospace;">$${catSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</td>
                </tr>
            `;
        };

        const rowsHtml = `
            ${renderCategoryBlock("A_SHIFTING", "A) SHIFTING EXPENSES")}
            ${renderCategoryBlock("B_GENERAL_PORT", "B) GENERAL PORT EXPENSES")}
            ${renderCategoryBlock("C_AGENCY", "C) AGENCY EXPENSES")}
        `;

        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Acta Auditoría Puerto de ${isLoad ? 'Carga' : 'Descarga'} ${titleBadge}</title>
            <style>
                @page { size: A4 portrait; margin: 0; }
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    html, body { margin: 0; padding: 0; }
                    .page-break { page-break-before: always; break-before: page; }
                }
                body { font-family: 'Courier New', Courier, monospace; color: #000000; background-color: #ffffff; font-size: 6.2pt; line-height: 1.15; margin: 0; padding: 12mm 15mm 8mm 15mm; box-sizing: border-box; }

                table { width: 100%; border-collapse: collapse; }
                .header-table { border-bottom: 2px solid #000000; margin-bottom: 5px; }
                .title-header { text-align: center; font-weight: bold; font-size: 8pt; }
                .box-container { border: 1.5px solid #000000; padding: 4px; margin-bottom: 4px; background-color: #ffffff; }
                .box-title { font-weight: bold; font-size: 7pt; margin-bottom: 2px; }
                .audit-table { border: 1.5px solid #000000; margin-top: 3px; margin-bottom: 4px; font-size: 6.2pt; }
                .audit-table th { background-color: #f2f2f2; border: 1px solid #000000; padding: 2px 4px; text-align: left; font-weight: bold; text-transform: uppercase; }
                .audit-table td { border: 1px solid #000000; padding: 2px 4px; }
                .total-row { background-color: #f2f2f2; font-weight: bold; font-size: 7.5pt; border-top: 1.5px solid #000000; }
                .signatures { margin-top: 8px; border-top: 1.5px solid #000000; padding-top: 5px; }
            </style>
        </head>
        <body>
            <table class="header-table">
                <tr>
                    <td style="width: 25%; text-align: left; vertical-align: middle;">
                        <img src="${logoPetral}" style="height: 24px; width: auto;" alt="PETRAL LOGO" />
                    </td>
                    <td style="width: 50%;" class="title-header">
                        PETRAL SMART DASHBOARD • MOTOR COSTOS PORTUARIOS P×Q<br/>
                        <span style="font-size: 7pt; font-weight: bold; color: ${isMin ? '#047857' : '#b45309'};">ACTA AUDITORÍA PUERTO DE ${isLoad ? 'CARGA' : 'DESCARGA'} ${titleBadge}</span>
                    </td>
                    <td style="width: 25%; text-align: right; vertical-align: middle;">
                        <img src="${logoGeeksoft}" style="height: 32px; width: auto;" alt="GEEKSOFT LOGO" />
                    </td>
                </tr>
            </table>

            <div class="box-container">
                <div class="box-title">📋 [INPUTS P×Q — PUERTO DE ${isLoad ? 'CARGA' : 'DESCARGA'} (${portName})]:</div>
                <pre style="font-family: 'Courier New', Courier, monospace; font-size: 6.2pt; margin: 0; white-space: pre-wrap; line-height: 1.2;">
  • RUTA COMERCIAL:         ${routesMap[selectedRoute] || selectedRoute}
  • BUQUE (Q_buque):        ${vessel.vessel_name} | LOA: ${vessel.loa}m | GRT: ${vessel.grt.toLocaleString()} TRB
  • PUERTO / TERMINAL:      ${portName} | Ritmo: ${rate} MT/h | Remolques: 2 IN / 2 OUT
  • OPERACIÓN & CARGA Q:    Volumen ${isLoad ? 'Carga' : 'Descarga'}: ${cargoTons.toLocaleString()} MT | Permanencia Total: ${totalHours.toFixed(1)} Horas [${qOp.toFixed(1)}h Op + 4.0h Fijo]
  • CRONOGRAMA SIMULADO:   ${scheduleTimeline}
                </pre>
            </div>

            <div style="font-weight: bold; font-size: 7pt; margin-top: 3px;">
                📊 [DESGLOSE LIQUIDACIÓN PUERTO DE ${isLoad ? 'CARGA' : 'DESCARGA'} — ${portName}]:
            </div>
            <table class="audit-table">
                <thead>
                    <tr>
                        <th style="width: 22%;">ÍTEM / RUBRO OFICIAL</th>
                        <th style="width: 14%;">PROVEEDOR</th>
                        <th style="width: 18%;">TRAZABILIDAD ORIGEN</th>
                        <th style="width: 30%;">ECUACIÓN EVALUADA REAL (P x Q)</th>
                        <th style="width: 6%; text-align: center;">REGLA</th>
                        <th style="width: 10%; text-align: right;">SUBTOTAL USD</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                    <tr class="total-row">
                        <td colspan="5" style="text-align: right; border: 1px solid #000000; padding-right: 8px;">TOTAL PUERTO DE ${isLoad ? 'CARGA' : 'DESCARGA'} (${titleBadge}):</td>
                        <td style="text-align: right; border: 1px solid #000000;">$${finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</td>
                    </tr>
                </tbody>
            </table>

            <!-- BLOQUE DE COMPARATIVA DE EXTREMOS Y MATRIZ ESTÁTICA -->
            <div class="box-container" style="background-color: #fafafa; margin-top: 3px;">
                <div class="box-title">📈 [ENCUADRE DE BANDAS TARIFARIAS, MATRIZ ESTÁTICA & EXPERTA SANDRA]:</div>
                <pre style="font-family: 'Courier New', Courier, monospace; font-size: 6.2pt; margin: 0; white-space: pre-wrap; line-height: 1.2;">
  • ESCENARIO OPTIMISTA (MÍNIMO - HÁBIL):    $${isMin ? finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : computePortItems(portCode, vessel, totalHours, isNational, tugsIn, tugsOut, false).reduce((s,i)=>s+i.cost,0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD (100% Horario de Oficina sin Overtime)
  • LIQUIDACIÓN EXPERTA SANDRA (EXCEL):      [VER ARCHIVO EXCEL / PROFORMA OFICIAL ADJUNTA]
  • MATRIZ COSTO FIJO ESTÁTICO (SUPABASE DB): [CONSULTAR DB port_cost_static sub_op=MAIN]
  • ESCENARIO PESIMISTA (MÁXIMO - OVERTIME):  $${!isMin ? finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : computePortItems(portCode, vessel, totalHours, isNational, tugsIn, tugsOut, true).reduce((s,i)=>s+i.cost,0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD (Con Recargo Overtime/Casino)
                </pre>
            </div>

            <div class="signatures" style="margin-top: 6px; border-top: 1.5px solid #000000; padding-top: 4px;">
                <table style="width: 100%; border: none; font-size: 6.5pt; margin-bottom: 4px;">
                    <tr>
                        <td style="width: 50%; vertical-align: top; padding-right: 10px;">
                            <div style="font-weight: bold; margin-bottom: 2px;">AUDITORÍA NAVIERA PETRAL S.A. (${isLoad ? 'CARGA' : 'DESCARGA'}):</div>
                            <div style="border-bottom: 1px dashed #000000; height: 28px; margin-bottom: 2px;"></div>
                            <span style="font-size: 6pt; color: #475569;">Firma Responsable Auditoría Engine</span>
                        </td>
                        <td style="width: 50%; vertical-align: top; padding-left: 10px;">
                            <div style="font-weight: bold; margin-bottom: 2px;">V°B° EXPERTA SANDRA:</div>
                            <div style="border-bottom: 1px dashed #000000; height: 28px; margin-bottom: 2px;"></div>
                            <span style="font-size: 6pt; color: #475569;">Firma y Nombre — Experta Sandra</span>
                        </td>
                    </tr>
                </table>
                <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 2px;">OBSERVACIONES &amp; FEEDBACK EXPERTA SANDRA:</div>
                <div style="border: 1.5px solid #000000; height: 50px; background-color: #fafafa; width: 100%;"></div>
            </div>
        </body>
        </html>
        `;
    };

    const htmlDocLoadMin = useMemo(() => generatePdfHtml('LOAD', 'MIN'), [auditLoad, selectedRoute, vessel, cargoTons, loadRate]);
    const htmlDocLoadMax = useMemo(() => generatePdfHtml('LOAD', 'MAX'), [auditLoad, selectedRoute, vessel, cargoTons, loadRate]);
    const htmlDocDischargeMin = useMemo(() => generatePdfHtml('DISCHARGE', 'MIN'), [auditDischarge, selectedRoute, vessel, cargoTons, dischargeRate]);
    const htmlDocDischargeMax = useMemo(() => generatePdfHtml('DISCHARGE', 'MAX'), [auditDischarge, selectedRoute, vessel, cargoTons, dischargeRate]);

    const handlePrintDossierLoad = () => {
        const combinedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dossier Auditoría Carga - PETRAL</title>
            <style>
                @page { size: A4 portrait; margin: 0; }
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    html, body { margin: 0; padding: 0; }
                    .page-break { page-break-before: always; break-before: page; }
                }
            </style>
        </head>
        <body style="margin:0; padding:0;">
            <div>${htmlDocLoadMin}</div>
            <div class="page-break"></div>
            <div>${htmlDocLoadMax}</div>
        </body>
        </html>
        `;
        const printWin = window.open('', '_blank');
        if (printWin) {
            printWin.document.write(combinedHtml);
            printWin.document.close();
            printWin.focus();
            setTimeout(() => printWin.print(), 400);
        }
    };

    const handlePrintDossierDischarge = () => {
        const combinedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dossier Auditoría Descarga - PETRAL</title>
            <style>
                @page { size: A4 portrait; margin: 0; }
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    html, body { margin: 0; padding: 0; }
                    .page-break { page-break-before: always; break-before: page; }
                }
            </style>
        </head>
        <body style="margin:0; padding:0;">
            <div>${htmlDocDischargeMin}</div>
            <div class="page-break"></div>
            <div>${htmlDocDischargeMax}</div>
        </body>
        </html>
        `;
        const printWin = window.open('', '_blank');
        if (printWin) {
            printWin.document.write(combinedHtml);
            printWin.document.close();
            printWin.focus();
            setTimeout(() => printWin.print(), 400);
        }
    };

    return (


        <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 h-full overflow-hidden">
            
            {/* PANEL PRINCIPAL DE CONTROLES DIVISION EN 2 COLUMNAS PARALELAS LADO A LADO */}
            <div className="flex flex-col gap-3 bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-lg shadow-sm shrink-0">
                
                {/* CABECERA GENERAL VOYAGE & SELECCIÓN DE BUQUE / RUTA */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Ruta */}
                        <div className="flex items-center gap-1.5">
                            <label className="font-extrabold text-slate-700">Ruta Comercial:</label>
                            <select
                                value={selectedRoute}
                                onChange={(e) => setSelectedRoute(e.target.value)}
                                className="h-8 px-2 bg-white border border-slate-300 text-teal-700 font-bold rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                            >
                                <option value="NEXA_CALLAO_MATARANI">[NEXA] Callao ➔ Matarani</option>
                                <option value="NEXA_CALLAO_ILO">[NEXA] Callao ➔ Ilo</option>
                                <option value="NEXA_MATARANI_CALLAO">[NEXA] Matarani ➔ Callao</option>
                                <option value="SPCC_MARCONA_ILO">[SPCC] Marcona ➔ Ilo</option>
                                <option value="SPCC_ILO_CALLAO">[SPCC] Ilo ➔ Callao</option>
                                <option value="SPCC_MATARANI_ILO">[SPCC] Matarani ➔ Ilo</option>
                                <option value="SPCC_ILO_MATARANI">[SPCC] Ilo ➔ Matarani</option>
                            </select>
                        </div>

                        {/* Buque */}
                        <div className="flex items-center gap-1.5">
                            <label className="font-extrabold text-slate-700">Buque (Q_nave):</label>
                            <select
                                value={selectedVesselId}
                                onChange={(e) => setSelectedVesselId(e.target.value)}
                                className="h-8 px-2 bg-white border border-slate-300 text-purple-700 font-bold rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                            >
                                <option value="MOQUEGUA">BT MOQUEGUA</option>
                                <option value="TABLONES">BT TABLONES</option>
                                <option value="HUEMUL">BT HUEMUL</option>
                                <option value="CONCON_TRADER">CONCON TRADER</option>
                            </select>
                        </div>

                        {/* Carga MT */}
                        <div className="flex items-center gap-1.5">
                            <label className="font-extrabold text-slate-700">Volumen Carga (Q_mt):</label>
                            <input
                                type="number"
                                value={cargoTons}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    handleCargoOrRateLoadChange(val, loadRate);
                                    handleCargoOrRateDischargeChange(val, dischargeRate);
                                }}
                                className="h-8 w-24 px-2 bg-white border border-slate-300 text-slate-800 rounded font-mono font-bold text-center shadow-sm"
                            />
                        </div>
                    </div>

                    {/* RESUMEN TOTAL VOYAGE ASIGNABLE A MATRIZ */}
                    <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-400 px-3.5 py-1.5 rounded-lg shadow-sm">
                        <ArrowRightLeft size={16} className="text-emerald-700 shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-extrabold text-emerald-950 uppercase tracking-wide">
                                💰 TOTAL VOYAGE PROFORMA P×Q MATRIZ
                            </span>
                            <span className="text-[10px] text-emerald-800 font-semibold font-mono">
                                (Carga: ${((auditLoad.total + auditLoad.total * 1.3) / 2).toLocaleString('en-US', { minimumFractionDigits: 2 })} + Descarga: ${((auditDischarge.total + auditDischarge.total * 1.3) / 2).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                            </span>
                        </div>
                        <span className="text-sm font-black text-emerald-900 font-mono ml-1">
                            ${(((auditLoad.total + auditLoad.total * 1.3) / 2) + ((auditDischarge.total + auditDischarge.total * 1.3) / 2)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                        </span>
                    </div>

                </div>

                {/* CONTROLES DIVISION EN 2 COLUMNAS PARALELAS LADO A LADO - GRILLA UNIFORME DE 6 VARIABLES Q */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                    
                    {/* BLOQUE IZQUIERDO: VARIABLES Q PUERTO DE CARGA (MAESTRO DE PUERTOS) */}
                    <div className="bg-white p-3 rounded-lg border border-teal-200 shadow-sm space-y-2">
                        <div className="flex justify-between items-center border-b border-teal-100 pb-1.5">
                            <span className="text-xs font-extrabold text-teal-800 flex items-center gap-1 uppercase">
                                <Anchor size={13} /> 📦 Q PUERTO CARGA — {activeRouteInfo.loadName}
                            </span>
                            <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
                                Maestro Puertos & Terminales
                            </span>
                        </div>

                        {/* Grilla uniforme de 6 variables Q de Carga */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px] text-slate-700 font-mono">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                                <span className="text-[9px] text-slate-500 block uppercase font-sans font-bold">1. Ritmo Carga</span>
                                <span className="font-bold text-teal-700">{activeLoadRate} MT/h</span>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                                <span className="text-[9px] text-slate-500 block uppercase font-sans font-bold">2. Q_op Carga</span>
                                <span className="font-bold text-teal-800">{(cargoTons / activeLoadRate).toFixed(1)} hrs</span>
                            </div>
                            <div className="bg-amber-50/80 p-1.5 rounded border border-amber-300">
                                <span className="text-[9px] text-amber-800 block uppercase font-sans font-bold">3. Q_fijo Carga ({qFijoLoad.toFixed(1)} h)</span>
                                <span className="font-semibold text-[9px] text-amber-900 leading-tight block">
                                    Atraque: {mooringLoad}h | Prep: {timeToCountLoad}h | Zarpe: {unmooringLoad}h{extraLoad > 0 ? ` | Extra: ${extraLoad}h` : ''}
                                </span>
                            </div>
                            <div className="bg-emerald-50 p-1.5 rounded border border-emerald-300">
                                <span className="text-[9px] text-emerald-700 block uppercase font-sans font-bold">4. Perm. Total</span>
                                <span className="font-bold text-emerald-900">{((cargoTons / activeLoadRate) + qFijoLoad).toFixed(1)} hrs</span>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                                <span className="text-[9px] text-slate-500 block uppercase font-sans font-bold">5. Remolcedores</span>
                                <span className="font-bold text-slate-800">{tugsInLoad} IN / {tugsOutLoad} OUT</span>
                            </div>
                            <div className="bg-purple-50 p-1.5 rounded border border-purple-200">
                                <span className="text-[9px] text-purple-700 block uppercase font-sans font-bold">6. Buque (LOA/GRT)</span>
                                <span className="font-bold text-purple-900">{vessel.loa}m / {vessel.grt}</span>
                            </div>
                        </div>
                    </div>

                    {/* BLOQUE DERECHO: VARIABLES Q PUERTO DE DESCARGA (MAESTRO DE PUERTOS) */}
                    <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm space-y-2">
                        <div className="flex justify-between items-center border-b border-blue-100 pb-1.5">
                            <span className="text-xs font-extrabold text-blue-800 flex items-center gap-1 uppercase">
                                <Anchor size={13} /> 🏗️ Q PUERTO DESCARGA — {activeRouteInfo.dischargeName}
                            </span>
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                Maestro Puertos & Terminales
                            </span>
                        </div>

                        {/* Grilla uniforme de 6 variables Q de Descarga */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px] text-slate-700 font-mono">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                                <span className="text-[9px] text-slate-500 block uppercase font-sans font-bold">1. Ritmo Descarga</span>
                                <span className="font-bold text-blue-700">{activeDischargeRate} MT/h</span>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                                <span className="text-[9px] text-slate-500 block uppercase font-sans font-bold">2. Q_op Descarga</span>
                                <span className="font-bold text-blue-800">{(cargoTons / activeDischargeRate).toFixed(1)} hrs</span>
                            </div>
                            <div className="bg-amber-50/80 p-1.5 rounded border border-amber-300">
                                <span className="text-[9px] text-amber-800 block uppercase font-sans font-bold">3. Q_fijo Descarga ({qFijoDischarge.toFixed(1)} h)</span>
                                <span className="font-semibold text-[9px] text-amber-900 leading-tight block">
                                    Atraque: {mooringDischarge}h | Insp: {timeToCountDischarge}h | Zarpe: {unmooringDischarge}h{extraDischarge > 0 ? ` | Extra: ${extraDischarge}h` : ''}
                                </span>
                            </div>
                            <div className="bg-emerald-50 p-1.5 rounded border border-emerald-300">
                                <span className="text-[9px] text-emerald-700 block uppercase font-sans font-bold">4. Perm. Total</span>
                                <span className="font-bold text-emerald-900">{((cargoTons / activeDischargeRate) + qFijoDischarge).toFixed(1)} hrs</span>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                                <span className="text-[9px] text-slate-500 block uppercase font-sans font-bold">5. Remolcedores</span>
                                <span className="font-bold text-slate-800">{tugsInDischarge} IN / {tugsOutDischarge} OUT</span>
                            </div>
                            <div className="bg-purple-50 p-1.5 rounded border border-purple-200">
                                <span className="text-[9px] text-purple-700 block uppercase font-sans font-bold">6. Buque (LOA/GRT)</span>
                                <span className="font-bold text-purple-900">{vessel.loa}m / {vessel.grt}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* SECCIÓN INFERIOR: VISOR DUAL DE 4 PDFs EN 2 COLUMNAS PARALELAS LADO A LADO */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[600px] overflow-auto">
                
                {/* COLUMNA 1 (IZQUIERDA): PUERTO DE CARGA — 2 PDFs (MÍNIMO VS MÁXIMO) */}
                <div className="flex flex-col gap-4">
                    <div className="bg-teal-900 text-white px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                            <span>📦 COLUMNA 1: PUERTO DE CARGA — {activeRouteInfo.loadName}</span>
                            <button
                                onClick={handlePrintDossierLoad}
                                className="h-6 px-2.5 bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold uppercase rounded flex items-center gap-1 cursor-pointer transition-colors border border-teal-400"
                                title="Imprimir los 2 PDFs de Carga (Mínimo + Máximo) en un solo documento"
                            >
                                <Printer size={11} /> Imprimir Dossier Carga
                            </button>
                        </div>
                        <span className="font-mono font-extrabold text-teal-200">
                            Promedio Carga: ${((auditLoad.total + auditLoad.total * 1.3) / 2).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                        </span>
                    </div>

                    {/* PDF 1: CARGA MÍNIMA */}
                    <div className="flex flex-col bg-white rounded-lg border border-slate-300 overflow-hidden shadow-sm h-[380px]">
                        <div className="bg-teal-700 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                            <span>📄 PDF 1: CARGA MÍNIMA [NIVEL BAJO - HORARIO ORDINARIO]</span>
                            <span className="font-mono font-extrabold text-teal-100">
                                ${auditLoad.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                            </span>
                        </div>
                        <iframe
                            title="Visor PDF Auditoria Carga Minima"
                            srcDoc={htmlDocLoadMin}
                            className="w-full flex-1 border-none bg-white"
                        />
                    </div>

                    {/* PDF 2: CARGA MÁXIMA */}
                    <div className="flex flex-col bg-white rounded-lg border border-amber-400 overflow-hidden shadow-sm h-[380px]">
                        <div className="bg-amber-700 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                            <span>📄 PDF 2: CARGA MÁXIMA [NIVEL ALTO - HORARIO RECARGO]</span>
                            <span className="font-mono font-extrabold text-amber-100">
                                ${(auditLoad.total * 1.3).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                            </span>
                        </div>
                        <iframe
                            title="Visor PDF Auditoria Carga Maxima"
                            srcDoc={htmlDocLoadMax}
                            className="w-full flex-1 border-none bg-white"
                        />
                    </div>
                </div>

                {/* COLUMNA 2 (DERECHA): PUERTO DE DESCARGA — 2 PDFs (MÍNIMO VS MÁXIMO) */}
                <div className="flex flex-col gap-4">
                    <div className="bg-blue-900 text-white px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                            <span>🏗️ COLUMNA 2: PUERTO DE DESCARGA — {activeRouteInfo.dischargeName}</span>
                            <button
                                onClick={handlePrintDossierDischarge}
                                className="h-6 px-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase rounded flex items-center gap-1 cursor-pointer transition-colors border border-blue-400"
                                title="Imprimir los 2 PDFs de Descarga (Mínimo + Máximo) en un solo documento"
                            >
                                <Printer size={11} /> Imprimir Dossier Descarga
                            </button>
                        </div>
                        <span className="font-mono font-extrabold text-blue-200">
                            Promedio Descarga: ${((auditDischarge.total + auditDischarge.total * 1.3) / 2).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                        </span>
                    </div>

                    {/* PDF 3: DESCARGA MÍNIMA */}
                    <div className="flex flex-col bg-white rounded-lg border border-slate-300 overflow-hidden shadow-sm h-[380px]">
                        <div className="bg-blue-700 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                            <span>📄 PDF 3: DESCARGA MÍNIMA [NIVEL BAJO - HORARIO ORDINARIO]</span>
                            <span className="font-mono font-extrabold text-blue-100">
                                ${auditDischarge.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                            </span>
                        </div>
                        <iframe
                            title="Visor PDF Auditoria Descarga Minima"
                            srcDoc={htmlDocDischargeMin}
                            className="w-full flex-1 border-none bg-white"
                        />
                    </div>

                    {/* PDF 4: DESCARGA MÁXIMA */}
                    <div className="flex flex-col bg-white rounded-lg border border-rose-400 overflow-hidden shadow-sm h-[380px]">
                        <div className="bg-rose-800 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                            <span>📄 PDF 4: DESCARGA MÁXIMA [NIVEL ALTO - HORARIO RECARGO]</span>
                            <span className="font-mono font-extrabold text-rose-100">
                                ${(auditDischarge.total * 1.3).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                            </span>
                        </div>
                        <iframe
                            title="Visor PDF Auditoria Descarga Maxima"
                            srcDoc={htmlDocDischargeMax}
                            className="w-full flex-1 border-none bg-white"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};
