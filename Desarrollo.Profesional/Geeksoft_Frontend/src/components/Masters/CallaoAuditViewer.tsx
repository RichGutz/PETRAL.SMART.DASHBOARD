import React, { useState, useMemo } from 'react';
import { Printer, Anchor, ArrowRightLeft } from 'lucide-react';
import logoPetral from '../../assets/Logo.Petral.png';
import logoGeeksoft from '../../assets/Logo.Geeksoft.png';

export const CallaoAuditViewer: React.FC = () => {


    // Inputs Compartidos del Viaje (Buque & Carga)
    const [selectedRoute, setSelectedRoute] = useState<string>("NEXA_CALLAO_MATARANI");

    const [selectedVesselId, setSelectedVesselId] = useState<string>("MOQUEGUA");
    const [cargoTons, setCargoTons] = useState<number>(13500);

    // ==========================================
    // ESCALA 1: PUERTO DE CARGA (CALLAO APM)
    // ==========================================
    const [loadRate, setLoadRate] = useState<number>(500); // MT/h
    const [entryDateLoad, setEntryDateLoad] = useState<string>("2026-07-25T08:00");
    const [exitDateLoad, setExitDateLoad] = useState<string>("2026-07-26T23:30");
    const [portHoursLoad, setPortHoursLoad] = useState<number>(39.5);
    const [isNationalLoad, setIsNationalLoad] = useState<boolean>(true);
    const [tugboatsInLoad, setTugboatsInLoad] = useState<number>(2);
    const [tugboatsOutLoad, setTugboatsOutLoad] = useState<number>(2);

    // ==========================================
    // ESCALA 2: PUERTO DE DESCARGA (MATARANI TISUR - MOCK)
    // ==========================================
    const [dischargeRate, setDischargeRate] = useState<number>(350); // MT/h
    const [entryDateDischarge, setEntryDateDischarge] = useState<string>("2026-07-28T10:00");
    const [exitDateDischarge, setExitDateDischarge] = useState<string>("2026-07-29T21:30");
    const [portHoursDischarge, setPortHoursDischarge] = useState<number>(35.5);
    const [isNationalDischarge, setIsNationalDischarge] = useState<boolean>(true);
    const [tugboatsInDischarge, setTugboatsInDischarge] = useState<number>(2);
    const [tugboatsOutDischarge, setTugboatsOutDischarge] = useState<number>(2);

    // Tarifas Fijas Contractuales (Maestro Tarifario)
    const dockageRateP = 1.50; // USD / LOA / Hour
    const towageRateP = 800.00; // USD / Tugboat
    const launchRateP = 85.00; // USD / Launch
    const agencyFeeP = 1000.00; // USD Flat

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

    const handleEntryLoadChange = (val: string) => {
        setEntryDateLoad(val);
        if (val && exitDateLoad) {
            const d1 = new Date(val).getTime();
            const d2 = new Date(exitDateLoad).getTime();
            if (d2 > d1) setPortHoursLoad(Math.round(((d2 - d1) / (1000 * 60 * 60)) * 10) / 10);
        }
    };

    const handleExitLoadChange = (val: string) => {
        setExitDateLoad(val);
        if (entryDateLoad && val) {
            const d1 = new Date(entryDateLoad).getTime();
            const d2 = new Date(val).getTime();
            if (d2 > d1) setPortHoursLoad(Math.round(((d2 - d1) / (1000 * 60 * 60)) * 10) / 10);
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

    const handleEntryDischargeChange = (val: string) => {
        setEntryDateDischarge(val);
        if (val && exitDateDischarge) {
            const d1 = new Date(val).getTime();
            const d2 = new Date(exitDateDischarge).getTime();
            if (d2 > d1) setPortHoursDischarge(Math.round(((d2 - d1) / (1000 * 60 * 60)) * 10) / 10);
        }
    };

    const handleExitDischargeChange = (val: string) => {
        setExitDateDischarge(val);
        if (entryDateDischarge && val) {
            const d1 = new Date(entryDateDischarge).getTime();
            const d2 = new Date(val).getTime();
            if (d2 > d1) setPortHoursDischarge(Math.round(((d2 - d1) / (1000 * 60 * 60)) * 10) / 10);
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

    // Función Evaluadora Universal de Auditoría por Puerto
    const computePortItems = (portCode: string, vesselObj: any, portHrs: number, isNational: boolean, tugsIn: number, tugsOut: number, isCasino: boolean) => {
        const loa = vesselObj.loa;
        const grt = vesselObj.grt;
        const stayDays = Math.max(1, Math.ceil(portHrs / 24.0));

        if (portCode === "MARCONA") {
            const extraStandby = portHrs > 48.0 ? 3000.00 : 0.0;
            const lighthouseRate = isNational ? 0.03 : 0.12;
            const totalLighthouse = Math.round(lighthouseRate * grt * 100) / 100;
            const standbyBase = Math.min(1800.00, portHrs * 40.0);

            return [
                { id: 1, category: "A_SHIFTING", concept: "Servicio Integral de Atraque (Practicaje, Remolques & Amarre)", supplier: "PSA Marine S.A.", sourceTag: "Acuerdo Marco SPCC 2025-2027", formula: "Tarifa Convenio Cerrado Southern", cost: 30508.48, rule: "SPCC Flat" },
                { id: 2, category: "A_SHIFTING", concept: "Port Toll & Terminal Access Fee", supplier: "Trans Total", sourceTag: "P:Tarifario | Q:Maniobras", formula: "P: $75.00/acc. x Q: 2 Maniobras", cost: 150.00, rule: "Tarifa Agencia" },
                { id: 3, category: "B_GENERAL_PORT", concept: "Derechos de Faro y Balisas", supplier: "DHN / Autoridad Portuaria", sourceTag: "P:Tarifario | Q:GRT & País", formula: `P: $${lighthouseRate.toFixed(2)}/GRT x Q: ${grt.toLocaleString()} GRT (${isNational ? 'Nacional' : 'Extranjero'})`, cost: totalLighthouse, rule: "Regla Origen" },
                { id: 4, category: "B_GENERAL_PORT", concept: "Coordinador a Bordo", supplier: "Trans Total", sourceTag: "P:Tarifario | Q:Días", formula: "P: $225.00/día x Q: 2 Días", cost: 450.00, rule: "Agencia" },
                { id: 5, category: "B_GENERAL_PORT", concept: "Inspección Sanitaria (Sanidad APN)", supplier: "Sanidad Marítima", sourceTag: "P:Tarifario Flat", formula: "P: $670.00 Flat Sanidad Marcona", cost: 670.00, rule: "Sanidad" },
                { id: 6, category: "B_GENERAL_PORT", concept: "Lancha de Autoridades & Clearance", supplier: "Trans Total", sourceTag: "P:Tarifario Flat", formula: "P: $200 Clearance + $200 Lancha", cost: 400.00, rule: "Agencia" },
                { id: 7, category: "B_GENERAL_PORT", concept: "Lancha Stand-By Operativa", supplier: "PSA Marine S.A.", sourceTag: "P:Tarifario Standby", formula: `Covered in Flat (${Math.min(48.0, portHrs).toFixed(1)}h)` + (extraStandby > 0 ? ` + $${extraStandby.toFixed(2)} (>48h)` : ''), cost: standbyBase + extraStandby, rule: extraStandby > 0 ? "Stand-By Recharged" : "Covered" },
                { id: 8, category: "C_AGENCY", concept: "Honorarios Agenciamiento Marítimo", supplier: "Trans Total Agencia", sourceTag: "P:Tarifario Agencia", formula: "P: $1,400.00 Base Agency Fee", cost: 1400.00, rule: "Acuerdo Agencia" },
                { id: 9, category: "C_AGENCY", concept: "Movilidad & Comunicaciones", supplier: "Trans Total Agencia", sourceTag: "P:Tarifario Gastos", formula: "P: Movilidad ($200) + Comunicaciones ($250)", cost: 450.00, rule: "Gastos Agencia" }
            ];
        } else if (portCode === "MATARANI") {
            const basePSA = 3368.00;
            const psaOT = isCasino ? basePSA * 0.25 : 0.0;
            const totalPSA = (basePSA * 2) + psaOT;
            const lighthouseRate = isNational ? 0.03 : 0.12;
            const totalLighthouse = Math.round(lighthouseRate * grt * 100) / 100;
            const totalDockage = Math.round(0.65 * loa * portHrs * 100) / 100;

            return [
                { id: 1, category: "A_SHIFTING", concept: "Servicio Integral PSA (Practicaje + Remolques Addenda 39.31%)", supplier: "PSA Marine S.A.", sourceTag: `Addenda Tisur ${isCasino ? '(🌙 Casino +25%)' : ''}`, formula: `P: $3,368.00/mnvr x Q: 2 ${isCasino ? '+ $842.00 OT' : ''}`, cost: totalPSA, rule: isCasino ? "Addenda + Casino" : "Addenda PSA" },
                { id: 2, category: "A_SHIFTING", concept: "Cargo Acceso Muelle, Linesmen & Toll", supplier: "Tisur S.A. / Trans Total", sourceTag: "P:Tisur | Q:Maniobras", formula: "P: $280 Acceso + $357.30 Amarre + $150 Toll", cost: 787.30, rule: "Tisur" },
                { id: 3, category: "B_GENERAL_PORT", concept: "Derechos de Faro y Balisas", supplier: "Autoridad Portuaria", sourceTag: "P:Tarifario | Q:GRT & País", formula: `P: $${lighthouseRate.toFixed(2)}/GRT x Q: ${grt.toLocaleString()} GRT (${isNational ? 'Nacional' : 'Extranjero'})`, cost: totalLighthouse, rule: "Regla Origen" },
                { id: 4, category: "B_GENERAL_PORT", concept: "Muellaje TISUR Matarani", supplier: "TISUR Matarani", sourceTag: "P:Tisur | Q:LOA & Horas", formula: `P: $0.65/m/h x Q_LOA: ${loa.toFixed(2)}m x Q_hrs: ${portHrs.toFixed(1)}h`, cost: totalDockage, rule: "Tisur" },
                { id: 5, category: "B_GENERAL_PORT", concept: "Inspección Sanitaria Marítima", supplier: "Sanidad Arequipa", sourceTag: "P:Sanidad Flat", formula: "P: $670.00 Flat Sanidad Matarani", cost: 670.00, rule: "Sanidad" },
                { id: 6, category: "B_GENERAL_PORT", concept: "Lanchas Autoridades, Clearance & Coordinador", supplier: "Trans Total Matarani", sourceTag: "P:Tarifario Gastos", formula: "$310 Lancha + $200 Clearance + $450 Coord.", cost: 960.00, rule: "Agencia" },
                { id: 7, category: "C_AGENCY", concept: "Honorarios de Agenciamiento", supplier: "Trans Total Matarani", sourceTag: "P:Tarifario Agencia", formula: "P: $1,100.00 Base Agency Fee", cost: 1100.00, rule: "Acuerdo Agencia" },
                { id: 8, category: "C_AGENCY", concept: "Movilidad & Comunicaciones", supplier: "Trans Total Matarani", sourceTag: "P:Tarifario Gastos", formula: "P: Movilidad ($200) + Comunicaciones ($250)", cost: 450.00, rule: "Gastos Agencia" }
            ];
        } else if (portCode === "ILO") {
            const pilotageTotal = 3000.00;
            const linesmenTotal = 680.00;
            const dockageSpcc = Math.round((300.00 + (0.05 * grt * stayDays)) * 100) / 100;
            const psaTowage = Math.max(3600.00, 0.16 * grt * 2);
            const psaPos = 1400.00;
            const petransoTowage = Math.round((0.18 * grt * 2 * 0.90) * 100) / 100;

            const petransoPos = 1260.00;
            const otTugs = isCasino ? 1643.31 : 0.0;
            const lighthouseRate = isNational ? 0.03 : 0.12;
            const totalLighthouse = Math.round(lighthouseRate * grt * 100) / 100;
            const launchesTotal = 2600.00;

            return [
                { id: 1, category: "A_SHIFTING", concept: "Practicaje (Port Operations)", supplier: "Port Operations", sourceTag: "P:SPCC | Q:Maniobras", formula: "P: $1,500.00/mnvr x Q: 2", cost: pilotageTotal, rule: "Port Operations" },
                { id: 2, category: "A_SHIFTING", concept: "Remolcaje Combinado (PSA Marine & Petranso)", supplier: "PSA Marine / Petranso", sourceTag: `P:Tarifario ${isCasino ? '(🌙 Overtime +25%)' : ''}`, formula: `PSA Mín: $${psaTowage.toFixed(2)} + Petranso (-10%): $${petransoTowage.toFixed(2)} ${isCasino ? '+ OT $1,643.31' : ''}`, cost: psaTowage + petransoTowage + otTugs, rule: isCasino ? "Remolques + Casino" : "Remolques Ilo" },
                { id: 3, category: "A_SHIFTING", concept: "Posicionamiento Remolques & Linesmen", supplier: "PSA / Petranso / Agencia", sourceTag: "P:Tarifario | Q:Maniobras", formula: "$1,400 PSA + $1,260 Petranso + $680 Linesmen + $150 Toll", cost: psaPos + petransoPos + linesmenTotal + 150.00, rule: "Posicionamiento" },
                { id: 4, category: "A_SHIFTING", concept: "Muellaje SPCC Ilo (Dockage)", supplier: "Southern Perú SPCC", sourceTag: "P:SPCC | Q:GRT & Días", formula: `P: $300 Amarre + ($0.05 x ${grt.toLocaleString()} GRT x ${stayDays}d)`, cost: dockageSpcc, rule: "SPCC" },
                { id: 5, category: "B_GENERAL_PORT", concept: "Derechos de Faro y Balisas", supplier: "Autoridad Portuaria", sourceTag: "P:Tarifario | Q:GRT & País", formula: `P: $${lighthouseRate.toFixed(2)}/GRT x Q: ${grt.toLocaleString()} GRT (${isNational ? 'Nacional' : 'Extranjero'})`, cost: totalLighthouse, rule: "Regla Origen" },
                { id: 6, category: "B_GENERAL_PORT", concept: "Lanchas de Servicio Operativas", supplier: "Trans Total Ilo", sourceTag: "P:Tarifario | Q:Lanchas", formula: "$1,500 Amarre + $360 Autoridades + $340 Coord. + $400 Posic.", cost: launchesTotal, rule: "Lanchas Ilo" },
                { id: 7, category: "B_GENERAL_PORT", concept: "Inspección Sanitaria, Clearance & Coordinador", supplier: "Sanidad Moquegua / Agencia", sourceTag: "P:Sanidad / APN", formula: "$520 Sanidad + $200 Clearance + $400 Coordinador", cost: 1120.00, rule: "Sanidad" },
                { id: 8, category: "C_AGENCY", concept: "Honorarios de Agenciamiento", supplier: "Trans Total Ilo", sourceTag: "P:Tarifario Agencia", formula: "P: $900.00 Base Agency Fee", cost: 900.00, rule: "Acuerdo Agencia" },
                { id: 9, category: "C_AGENCY", concept: "Movilidad & Comunicaciones", supplier: "Trans Total Ilo", sourceTag: "P:Tarifario Gastos", formula: "P: Movilidad ($200) + Comunicaciones ($200)", cost: 400.00, rule: "Gastos Agencia" }
            ];
        } else {
            // CALLAO (APM Terminals)
            const basePilotage = Math.max(750.00, 0.055 * grt);
            const pilotageOut = isCasino ? basePilotage * 1.25 : basePilotage;
            const totalPilotage = Math.round((basePilotage + pilotageOut) * 100) / 100;
            const towageOutRate = isCasino ? towageRateP * 1.25 : towageRateP;
            const totalTowage = (towageRateP * tugsIn) + (towageOutRate * tugsOut);
            const totalAccess = 70.00 * 2;
            const lighthouseRate = isNational ? 0.03 : 0.12;
            const totalLighthouse = Math.round(lighthouseRate * grt * 100) / 100;
            const totalDockage = Math.round(dockageRateP * loa * portHrs * 100) / 100;

            return [
                { id: 1, category: "A_SHIFTING", concept: "Practicaje (IN + OUT)", supplier: "Trans Total", sourceTag: `P:Tarifario | Q:GRT ${isCasino ? '(🌙 Casino +25%)' : ''}`, formula: `P: IN($${basePilotage.toFixed(2)}) + OUT($${pilotageOut.toFixed(2)}) x Q: 2`, cost: totalPilotage, rule: isCasino ? "Pass-Through + Casino" : "Pass-Through" },
                { id: 2, category: "A_SHIFTING", concept: "Remolcaje (Petranso)", supplier: "Petranso", sourceTag: `P:Tarifario | Q:Remolques ${isCasino ? '(🌙 Casino +25%)' : ''}`, formula: `P_IN: $${towageRateP.toFixed(2)} (${tugsIn}) + P_OUT: $${towageOutRate.toFixed(2)} (${tugsOut})`, cost: totalTowage, rule: isCasino ? "Pass-Through + Casino" : "Pass-Through" },
                { id: 3, category: "A_SHIFTING", concept: "Acceso Atraque / Desatraque", supplier: "APM Terminals", sourceTag: "P:Tarifario | Q:Maniobras", formula: "P: $70.00/acc. x Q: 2 Maniobras", cost: totalAccess, rule: "Tarifa APM" },
                { id: 4, category: "B_GENERAL_PORT", concept: "Derechos de Faro y Balisas", supplier: "Autoridad Portuaria", sourceTag: "P:Tarifario | Q:GRT & País", formula: `P: $${lighthouseRate.toFixed(2)}/GRT x Q: ${grt.toLocaleString()} GRT (${isNational ? 'Nacional' : 'Extranjero'})`, cost: totalLighthouse, rule: "Regla Origen" },
                { id: 5, category: "B_GENERAL_PORT", concept: "Muellaje APM Terminals", supplier: "APM Terminals", sourceTag: "P:Tarifario | Q:LOA & Horas", formula: `P: $${dockageRateP.toFixed(2)}/m/h x Q_LOA: ${loa.toFixed(2)}m x Q_hrs: ${portHrs.toFixed(1)}h`, cost: totalDockage, rule: "Tarifa APM" },
                { id: 6, category: "B_GENERAL_PORT", concept: "Lanchas Operativas", supplier: "Trans Total", sourceTag: "P:Tarifario | Q:Lanchas", formula: `P: $${launchRateP.toFixed(2)}/lancha x Q: 4 Lanchas`, cost: launchRateP * 4, rule: "Agencia" },
                { id: 7, category: "B_GENERAL_PORT", concept: "Coordinador a Bordo", supplier: "Trans Total", sourceTag: "P:Tarifario | Q:Turnos", formula: "P: $225.00/turno x Q: 2 Turnos", cost: 450.00, rule: "Agencia" },
                { id: 8, category: "B_GENERAL_PORT", concept: "Clearance (Entrada / Salida)", supplier: "Autoridades Portuarias", sourceTag: "P:Tarifario Flat", formula: "P: $200.00 Flat In/Out", cost: 200.00, rule: "Fijo" },
                { id: 9, category: "B_GENERAL_PORT", concept: "Inspección Sanitaria Marítima", supplier: "Sanidad Marítima", sourceTag: "P:Tarifario Sanidad", formula: "P: $520.00 Flat Sanidad Callao", cost: 520.00, rule: "Sanidad" },
                { id: 10, category: "C_AGENCY", concept: "Honorarios de Agenciamiento", supplier: "Trans Total Agencia", sourceTag: "P:Tarifario Agencia", formula: `P: $${agencyFeeP.toFixed(2)} Base Agency Fee`, cost: agencyFeeP, rule: "Acuerdo Agencia" },
                { id: 11, category: "C_AGENCY", concept: "Movilidad & Comunicaciones", supplier: "Trans Total Agencia", sourceTag: "P:Tarifario Gastos Agencia", formula: "P: Movilidad ($200) + Comunicaciones ($250)", cost: 450.00, rule: "Gastos Agencia" }
            ];
        }
    };

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


    const formatDateTime = (dtStr: string) => (!dtStr ? '-' : dtStr.replace('T', ' ') + ' hrs');

    // Generador de PDF Carga (Callao)
    const htmlDocLoad = useMemo(() => {
        const renderCategoryBlock = (catKey: string, catTitle: string) => {
            const catItems = auditLoad.items.filter(i => i.category === catKey);
            const catSubtotal = catItems.reduce((sum, i) => sum + i.cost, 0);
            const itemsRows = catItems.map((item) => `
                <tr>
                    <td style="border: 1px solid #000000; padding: 3px 5px; font-weight: bold;">${item.id}. ${item.concept}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px;">${item.supplier}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px; font-size: 6.5pt; color: #334155;">${item.sourceTag}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px; font-family: 'Courier New', monospace;">${item.formula}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px; text-align: center;">${item.rule}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px; text-align: right; font-weight: bold; font-family: 'Courier New', monospace;">$${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            `).join('');

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
            <title>Acta Auditoría Puerto de Carga (Callao) - PETRAL</title>
            <style>
                @page { size: A4 portrait; margin: 6mm; }
                body { font-family: 'Courier New', Courier, monospace; color: #000000; background-color: #ffffff; font-size: 7pt; line-height: 1.25; margin: 0; padding: 6px; }
                table { width: 100%; border-collapse: collapse; }
                .header-table { border-bottom: 2px solid #000000; margin-bottom: 6px; }
                .title-header { text-align: center; font-weight: bold; font-size: 9pt; }
                .box-container { border: 1.5px solid #000000; padding: 5px; margin-bottom: 6px; background-color: #ffffff; }
                .box-title { font-weight: bold; font-size: 7.5pt; margin-bottom: 3px; }
                .audit-table { border: 1.5px solid #000000; margin-top: 4px; margin-bottom: 6px; font-size: 6.8pt; }
                .audit-table th { background-color: #f2f2f2; border: 1px solid #000000; padding: 3px 5px; text-align: left; font-weight: bold; text-transform: uppercase; }
                .total-row { background-color: #f2f2f2; font-weight: bold; font-size: 8pt; border-top: 1.5px solid #000000; }
                .signatures { margin-top: 10px; border-top: 1.5px solid #000000; padding-top: 6px; }
            </style>
        </head>
        <body>
            <table class="header-table">
                <tr>
                    <td style="width: 25%; text-align: left; vertical-align: middle;">
                        <img src="${logoPetral}" style="height: 28px; width: auto;" alt="PETRAL LOGO" />
                    </td>
                    <td style="width: 50%;" class="title-header">
                        PETRAL SMART DASHBOARD • MOTOR COSTOS PORTUARIOS<br/>
                        <span style="font-size: 7.5pt; font-weight: normal;">ACTA OFICIAL DE AUDITORÍA — PUERTO DE CARGA (CALLAO APM)</span>
                    </td>
                    <td style="width: 25%; text-align: right; vertical-align: middle;">
                        <img src="${logoGeeksoft}" style="height: 38px; width: auto;" alt="GEEKSOFT LOGO" />
                    </td>
                </tr>
            </table>

            <div class="box-container">
                <div class="box-title">📋 [INPUTS ESCALA CARGA — CALLAO APM]:</div>
                <pre style="font-family: 'Courier New', Courier, monospace; font-size: 6.8pt; margin: 0; white-space: pre-wrap; line-height: 1.3;">
  • RUTA COMERCIAL:         ${routesMap[selectedRoute] || selectedRoute}
  • BUQUE (Q_buque):        ${vessel.vessel_name} | Eslora (LOA): ${vessel.loa}m | Arqueo (GRT): ${vessel.grt.toLocaleString()} TRB
  • TERMINAL CARGA:         APM Terminals Callao | Ritmo Operativo: ${loadRate} MT/h | Remolques: ${tugboatsInLoad + tugboatsOutLoad}
  • OPERACIÓN & CARGA Q:    Volumen Carga: ${cargoTons.toLocaleString()} MT | Permanencia Muelle: ${portHoursLoad.toFixed(1)} Horas
                            Atraque Carga: ${formatDateTime(entryDateLoad)} | Desatraque Carga: ${formatDateTime(exitDateLoad)} ${isCasinoNightLoad ? '(🌙 Zarpe Nocturno - Regla Casino)' : ''}
                </pre>
            </div>

            <div style="font-weight: bold; font-size: 7.5pt; margin-top: 4px;">
                📊 [DESGLOSE LIQUIDACIÓN PUERTO DE CARGA — CALLAO]:
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
                        <td colspan="5" style="text-align: right; border: 1px solid #000000; padding-right: 8px;">TOTAL PUERTO DE CARGA (CALLAO):</td>
                        <td style="text-align: right; border: 1px solid #000000;">$${auditLoad.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</td>
                    </tr>
                </tbody>
            </table>

            <div class="signatures">
                <table style="width: 100%; border: none; font-size: 7pt;">
                    <tr>
                        <td style="width: 50%; vertical-align: top; padding-right: 10px;">
                            <div style="font-weight: bold; margin-bottom: 2px;">AUDITORÍA PETRAL S.A. (CARGA):</div>
                            <div style="border-bottom: 1px dashed #000000; height: 14px; margin-bottom: 3px;"></div>
                            <span style="font-size: 6.5pt; color: #475569;">Firma Responsable Carga</span>
                        </td>
                        <td style="width: 50%; vertical-align: top; padding-left: 10px;">
                            <div style="font-weight: bold; margin-bottom: 2px;">OBSERVACIONES CARGA:</div>
                            <div style="border: 1px solid #000000; height: 32px; background-color: #fafafa; padding: 2px;"></div>
                        </td>
                    </tr>
                </table>
            </div>
        </body>
        </html>
        `;
    }, [auditLoad, selectedRoute, vessel, cargoTons, loadRate, entryDateLoad, exitDateLoad, portHoursLoad, isNationalLoad, tugboatsInLoad, tugboatsOutLoad, isCasinoNightLoad]);

    // Generador de PDF Descarga (Matarani / Tisur Mock)
    const htmlDocDischarge = useMemo(() => {
        const renderCategoryBlock = (catKey: string, catTitle: string) => {
            const catItems = auditDischarge.items.filter(i => i.category === catKey);
            const catSubtotal = catItems.reduce((sum, i) => sum + i.cost, 0);
            const itemsRows = catItems.map((item) => `
                <tr>
                    <td style="border: 1px solid #000000; padding: 3px 5px; font-weight: bold;">${item.id}. ${item.concept}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px;">${item.supplier}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px; font-size: 6.5pt; color: #334155;">${item.sourceTag}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px; font-family: 'Courier New', monospace;">${item.formula}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px; text-align: center;">${item.rule}</td>
                    <td style="border: 1px solid #000000; padding: 3px 5px; text-align: right; font-weight: bold; font-family: 'Courier New', monospace;">$${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            `).join('');

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
            <title>Acta Auditoría Puerto de Descarga (Matarani) - PETRAL</title>
            <style>
                @page { size: A4 portrait; margin: 6mm; }
                body { font-family: 'Courier New', Courier, monospace; color: #000000; background-color: #ffffff; font-size: 7pt; line-height: 1.25; margin: 0; padding: 6px; }
                table { width: 100%; border-collapse: collapse; }
                .header-table { border-bottom: 2px solid #000000; margin-bottom: 6px; }
                .title-header { text-align: center; font-weight: bold; font-size: 9pt; }
                .box-container { border: 1.5px solid #000000; padding: 5px; margin-bottom: 6px; background-color: #ffffff; }
                .box-title { font-weight: bold; font-size: 7.5pt; margin-bottom: 3px; }
                .audit-table { border: 1.5px solid #000000; margin-top: 4px; margin-bottom: 6px; font-size: 6.8pt; }
                .audit-table th { background-color: #f2f2f2; border: 1px solid #000000; padding: 3px 5px; text-align: left; font-weight: bold; text-transform: uppercase; }
                .total-row { background-color: #f2f2f2; font-weight: bold; font-size: 8pt; border-top: 1.5px solid #000000; }
                .signatures { margin-top: 10px; border-top: 1.5px solid #000000; padding-top: 6px; }
            </style>
        </head>
        <body>
            <table class="header-table">
                <tr>
                    <td style="width: 25%; text-align: left; vertical-align: middle;">
                        <img src="${logoPetral}" style="height: 28px; width: auto;" alt="PETRAL LOGO" />
                    </td>
                    <td style="width: 50%;" class="title-header">
                        PETRAL SMART DASHBOARD • MOTOR COSTOS PORTUARIOS<br/>
                        <span style="font-size: 7.5pt; font-weight: normal;">ACTA OFICIAL DE AUDITORÍA — PUERTO DE DESCARGA (MATARANI TISUR MOCK)</span>
                    </td>
                    <td style="width: 25%; text-align: right; vertical-align: middle;">
                        <img src="${logoGeeksoft}" style="height: 38px; width: auto;" alt="GEEKSOFT LOGO" />
                    </td>
                </tr>
            </table>

            <div class="box-container">
                <div class="box-title">📋 [INPUTS ESCALA DESCARGA — MATARANI TISUR]:</div>
                <pre style="font-family: 'Courier New', Courier, monospace; font-size: 6.8pt; margin: 0; white-space: pre-wrap; line-height: 1.3;">
  • RUTA COMERCIAL:         ${routesMap[selectedRoute] || selectedRoute}
  • BUQUE (Q_buque):        ${vessel.vessel_name} | Eslora (LOA): ${vessel.loa}m | Arqueo (GRT): ${vessel.grt.toLocaleString()} TRB
  • TERMINAL DESCARGA:      TISUR Matarani | Ritmo Operativo Descarga: ${dischargeRate} MT/h | Remolques: ${tugboatsInDischarge + tugboatsOutDischarge}
  • OPERACIÓN & CARGA Q:    Volumen Descarga: ${cargoTons.toLocaleString()} MT | Permanencia Muelle: ${portHoursDischarge.toFixed(1)} Horas
                            Atraque Descarga: ${formatDateTime(entryDateDischarge)} | Desatraque Descarga: ${formatDateTime(exitDateDischarge)} ${isCasinoNightDischarge ? '(🌙 Zarpe Nocturno - Regla Casino)' : ''}
                </pre>
            </div>

            <div style="font-weight: bold; font-size: 7.5pt; margin-top: 4px;">
                📊 [DESGLOSE LIQUIDACIÓN PUERTO DE DESCARGA — MATARANI (MOCK ESTRUCTURADO)]:
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
                        <td colspan="5" style="text-align: right; border: 1px solid #000000; padding-right: 8px;">TOTAL PUERTO DE DESCARGA (MATARANI):</td>
                        <td style="text-align: right; border: 1px solid #000000;">$${auditDischarge.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</td>
                    </tr>
                </tbody>
            </table>

            <div class="signatures">
                <table style="width: 100%; border: none; font-size: 7pt;">
                    <tr>
                        <td style="width: 50%; vertical-align: top; padding-right: 10px;">
                            <div style="font-weight: bold; margin-bottom: 2px;">AUDITORÍA PETRAL S.A. (DESCARGA):</div>
                            <div style="border-bottom: 1px dashed #000000; height: 14px; margin-bottom: 3px;"></div>
                            <span style="font-size: 6.5pt; color: #475569;">Firma Responsable Descarga</span>
                        </td>
                        <td style="width: 50%; vertical-align: top; padding-left: 10px;">
                            <div style="font-weight: bold; margin-bottom: 2px;">OBSERVACIONES DESCARGA:</div>
                            <div style="border: 1px solid #000000; height: 32px; background-color: #fafafa; padding: 2px;"></div>
                        </td>
                    </tr>
                </table>
            </div>
        </body>
        </html>
        `;
    }, [auditDischarge, selectedRoute, vessel, cargoTons, dischargeRate, entryDateDischarge, exitDateDischarge, portHoursDischarge, isNationalDischarge, tugboatsInDischarge, tugboatsOutDischarge, isCasinoNightDischarge]);

    const handlePrintPdfLoad = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlDocLoad);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 400);
        }
    };

    const handlePrintPdfDischarge = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlDocDischarge);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 400);
        }
    };

    const totalVoyageCost = auditLoad.total + auditDischarge.total;

    return (
        <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 h-full overflow-hidden">
            
            {/* PANEL PRINCIPAL DE CONTROLES (UNIFICADO EN 1 SOLA VENTANA) */}
            <div className="flex flex-col gap-2.5 bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-lg shadow-sm shrink-0">
                
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
                            <label className="font-extrabold text-slate-700">Carga (Q_mt):</label>
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

                    {/* RESUMEN DEL TOTAL ESCALA VOYAGE */}
                    <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg shadow-sm">
                        <ArrowRightLeft size={14} className="text-teal-600" />
                        <span className="text-xs font-bold text-teal-900">TOTAL ESCALA VOYAGE:</span>
                        <span className="text-sm font-extrabold text-teal-800 font-mono">
                            ${totalVoyageCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                        </span>
                    </div>
                </div>

                {/* FILA 1: CONTROLES ESCALA PUERTO CARGA */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-900 rounded font-extrabold text-[11px] flex items-center gap-1 uppercase">
                            <Anchor size={12} /> CARGA ({activeRouteInfo.loadPort}):
                        </span>


                        <div className="flex items-center gap-1">
                            <label className="font-semibold text-slate-600">Ritmo (MT/h):</label>
                            <input
                                type="number"
                                value={loadRate}
                                onChange={(e) => handleCargoOrRateLoadChange(cargoTons, parseFloat(e.target.value) || 1)}
                                className="h-7 w-16 px-1 bg-white border border-slate-300 text-teal-700 rounded font-mono font-bold text-center text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-1">
                            <label className="font-semibold text-slate-600">Atraque:</label>
                            <input
                                type="datetime-local"
                                value={entryDateLoad}
                                onChange={(e) => handleEntryLoadChange(e.target.value)}
                                className="h-7 px-1.5 bg-white border border-slate-300 text-slate-800 rounded font-mono text-[10px]"
                            />
                        </div>

                        <div className="flex items-center gap-1">
                            <label className="font-semibold text-slate-600">Desatraque:</label>
                            <input
                                type="datetime-local"
                                value={exitDateLoad}
                                onChange={(e) => handleExitLoadChange(e.target.value)}
                                className="h-7 px-1.5 bg-white border border-slate-300 text-slate-800 rounded font-mono text-[10px]"
                            />
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 bg-amber-50 border border-amber-300 text-amber-900 rounded font-mono font-bold text-[11px]">
                                ⏱️ {portHoursLoad.toFixed(1)} hrs
                            </span>
                            {isCasinoNightLoad && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-900 rounded font-extrabold text-[10px]">
                                    🌙 Casino (+25%)
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <label className="font-semibold text-slate-600">Remolques:</label>
                            <select
                                value={tugboatsInLoad}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setTugboatsInLoad(val);
                                    setTugboatsOutLoad(val);
                                }}
                                className="h-7 px-1.5 bg-white border border-slate-300 text-slate-800 rounded font-bold text-xs"
                            >
                                <option value="1">1 IN / 1 OUT</option>
                                <option value="2">2 IN / 2 OUT</option>
                                <option value="3">3 IN / 3 OUT</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setIsNationalLoad(!isNationalLoad)}
                            className={`h-7 px-2 rounded text-[11px] font-bold border ${isNationalLoad ? 'bg-teal-50 text-teal-700 border-teal-300' : 'bg-amber-50 text-amber-700 border-amber-300'}`}
                        >
                            {isNationalLoad ? '🇵🇪 Nac.' : '🌐 Ext.'}
                        </button>
                    </div>

                    {/* BOTÓN IMPRIMIR PDF CARGA */}
                    <button
                        onClick={handlePrintPdfLoad}
                        className="h-7 px-3 bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold uppercase tracking-wider rounded flex items-center gap-1 shadow-sm cursor-pointer shrink-0"
                    >
                        <Printer size={12} /> PDF Carga (Callao)
                    </button>
                </div>

                {/* FILA 2: CONTROLES ESCALA PUERTO DESCARGA */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-200">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-extrabold text-[11px] flex items-center gap-1 uppercase">
                            <Anchor size={12} /> DESCARGA ({activeRouteInfo.dischargePort}):
                        </span>


                        <div className="flex items-center gap-1">
                            <label className="font-semibold text-slate-600">Ritmo (MT/h):</label>
                            <input
                                type="number"
                                value={dischargeRate}
                                onChange={(e) => handleCargoOrRateDischargeChange(cargoTons, parseFloat(e.target.value) || 1)}
                                className="h-7 w-16 px-1 bg-white border border-slate-300 text-blue-700 rounded font-mono font-bold text-center text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-1">
                            <label className="font-semibold text-slate-600">Atraque:</label>
                            <input
                                type="datetime-local"
                                value={entryDateDischarge}
                                onChange={(e) => handleEntryDischargeChange(e.target.value)}
                                className="h-7 px-1.5 bg-white border border-slate-300 text-slate-800 rounded font-mono text-[10px]"
                            />
                        </div>

                        <div className="flex items-center gap-1">
                            <label className="font-semibold text-slate-600">Desatraque:</label>
                            <input
                                type="datetime-local"
                                value={exitDateDischarge}
                                onChange={(e) => handleExitDischargeChange(e.target.value)}
                                className="h-7 px-1.5 bg-white border border-slate-300 text-slate-800 rounded font-mono text-[10px]"
                            />
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 bg-amber-50 border border-amber-300 text-amber-900 rounded font-mono font-bold text-[11px]">
                                ⏱️ {portHoursDischarge.toFixed(1)} hrs
                            </span>
                            {isCasinoNightDischarge && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-900 rounded font-extrabold text-[10px]">
                                    🌙 Casino (+25%)
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <label className="font-semibold text-slate-600">Remolques:</label>
                            <select
                                value={tugboatsInDischarge}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setTugboatsInDischarge(val);
                                    setTugboatsOutDischarge(val);
                                }}
                                className="h-7 px-1.5 bg-white border border-slate-300 text-slate-800 rounded font-bold text-xs"
                            >
                                <option value="1">1 IN / 1 OUT</option>
                                <option value="2">2 IN / 2 OUT</option>
                                <option value="3">3 IN / 3 OUT</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setIsNationalDischarge(!isNationalDischarge)}
                            className={`h-7 px-2 rounded text-[11px] font-bold border ${isNationalDischarge ? 'bg-teal-50 text-teal-700 border-teal-300' : 'bg-amber-50 text-amber-700 border-amber-300'}`}
                        >
                            {isNationalDischarge ? '🇵🇪 Nac.' : '🌐 Ext.'}
                        </button>
                    </div>

                    {/* BOTÓN IMPRIMIR PDF DESCARGA */}
                    <button
                        onClick={handlePrintPdfDischarge}
                        className="h-7 px-3 bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold uppercase tracking-wider rounded flex items-center gap-1 shadow-sm cursor-pointer shrink-0"
                    >
                        <Printer size={12} /> PDF Descarga (Matarani)
                    </button>
                </div>
            </div>

            {/* SECCIÓN INFERIOR: VISOR DUAL LADO A LADO EN UNA SOLA VENTANA (SPLIT-VIEW) */}
            <div className="flex-1 grid grid-cols-2 gap-3 min-h-[480px] overflow-hidden">
                
                {/* VISOR 1 (IZQUIERDA): PUERTO CARGA (CALLAO APM) */}
                <div className="flex flex-col bg-slate-200 rounded-lg border border-slate-300 overflow-hidden shadow-inner h-full">
                    <div className="bg-teal-800 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                        <span>📄 ACTA AUDITORÍA PUERTO DE CARGA — CALLAO APM</span>
                        <span className="font-mono font-extrabold text-teal-200">
                            ${auditLoad.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                        </span>
                    </div>
                    <iframe
                        title="Visor PDF Auditoria Carga Callao"
                        srcDoc={htmlDocLoad}
                        className="w-full flex-1 border-none bg-white"
                    />
                </div>

                {/* VISOR 2 (DERECHA): PUERTO DESCARGA (MATARANI TISUR MOCK) */}
                <div className="flex flex-col bg-slate-200 rounded-lg border border-slate-300 overflow-hidden shadow-inner h-full">
                    <div className="bg-blue-800 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                        <span>📄 ACTA AUDITORÍA PUERTO DESCARGA — MATARANI TISUR (MOCK)</span>
                        <span className="font-mono font-extrabold text-blue-200">
                            ${auditDischarge.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                        </span>
                    </div>
                    <iframe
                        title="Visor PDF Auditoria Descarga Matarani"
                        srcDoc={htmlDocDischarge}
                        className="w-full flex-1 border-none bg-white"
                    />
                </div>

            </div>
        </div>
    );
};
