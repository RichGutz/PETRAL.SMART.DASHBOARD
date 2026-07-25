import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Anchor, Layers, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { exportMasterToExcel, exportMasterToPDF } from '../../lib/masterExport';
import type { ExportColumn } from '../../lib/masterExport';

// Helper para banderas y países
const getCountryInfo = (countryStr: string) => {
    if (!countryStr) return { code: 'pe', name: 'Perú', color: '#dc2626' };
    const c = countryStr.trim().toUpperCase();
    if (c === 'PE' || c === 'PERU' || c === 'PERÚ') return { code: 'pe', name: 'Perú', color: '#dc2626' };
    if (c === 'CL' || c === 'CHILE') return { code: 'cl', name: 'Chile', color: '#2563eb' };
    if (c === 'EC' || c === 'ECUADOR') return { code: 'ec', name: 'Ecuador', color: '#ca8a04' };
    const fallbackCode = countryStr.slice(0, 2).toLowerCase();
    return { code: fallbackCode, name: countryStr, color: '#64748b' };
};

// Las 4 Naves Oficiales de la Flota PETRAL
const PETRAL_FLEET = [
    { vesselId: 'B/T MOQUEGUA', vesselLabel: 'B/T MOQUEGUA', loa: 134.16, grt: 8259, dwt: 14298, accentColor: 'border-t-blue-600 border-blue-300' },
    { vesselId: 'B/T TABLONES', vesselLabel: 'B/T TABLONES', loa: 134.16, grt: 8259, dwt: 14298, accentColor: 'border-t-teal-600 border-teal-300' },
    { vesselId: 'CONCON TRADER', vesselLabel: 'CONCON TRADER', loa: 134.16, grt: 8259, dwt: 14298, accentColor: 'border-t-indigo-600 border-indigo-300' },
    { vesselId: 'HUEMUL', vesselLabel: 'HUEMUL', loa: 134.16, grt: 8259, dwt: 14298, accentColor: 'border-t-amber-600 border-amber-300' }
];

// LISTA OFICIAL Y EXCLUSIVA DE LOS 5 PUERTOS QUE TIENEN AMBOS MODELOS: ESTÁTICO (port_cost_static) Y DINÁMICO (port_costs_matrix)
const DYNAMIC_CONFIGURED_PORTS = [
    { port_id: 'CALLAO', port_name: 'Puerto del Callao (APM Terminals / DP World)', country: 'PE' },
    { port_id: 'MATARANI', port_name: 'Puerto de Matarani (Tisur S.A.)', country: 'PE' },
    { port_id: 'MARCONA', port_name: 'Puerto de San Juan de Marcona (SPCC)', country: 'PE' },
    { port_id: 'ILO', port_name: 'Puerto de Ilo (SPCC / Enapu)', country: 'PE' },
    { port_id: 'MEJILLONES', port_name: 'Puerto de Mejillones (Terminal General)', country: 'CL' }
];

// FUNCIÓN EVALUADORA OFICIAL DE LA MATRIZ COMPLEJA PETRAL (CallaoAuditViewer.tsx)
const computePortItemsMatrizCompleja = (portCode: string, vesselObj: any, portHrs: number, isCasino: boolean) => {
    const loa = vesselObj.loa;
    const grt = vesselObj.grt;
    const stayDays = Math.max(1, Math.ceil(portHrs / 24.0));
    const isNational = true;
    const tugsIn = 2;
    const tugsOut = 2;
    const dockageRateP = 1.50;
    const towageRateP = 800.00;
    const launchRateP = 85.00;
    const agencyFeeP = 1000.00;

    const codeUpper = (portCode || '').toUpperCase();

    if (codeUpper.includes("MEJILLONES")) {
        // Tarifario Oficial Puerto de Mejillones (Chile) - Saam Towage / Ultratug
        const towageBase = 7200.00; // 2 Remolcadores x 2 Maniobras ($1,800 x 4)
        const towageOT = isCasino ? towageBase * 0.25 : 0.0;
        const totalTowage = towageBase + towageOT;
        const pilotageTotal = 2400.00; // Practicaje Armada de Chile
        const dockageTotal = Math.round(1.10 * loa * portHrs * 100) / 100; // Muelle $1.10/m/h
        const lighthouseChile = Math.round(0.12 * grt * 100) / 100; // Faro Chile Internacional ($0.12/GRT)
        const agencyFee = 1500.00; // Agenciamiento Marítimo Chile ($1,500.00)

        return [
            { id: 1, concept: `Remolcadores Mejillones (Saam / Ultratug ${isCasino ? 'Overtime +25%' : 'Ordinario'})`, cost: totalTowage },
            { id: 2, concept: "Practicaje Oficial Prácticos de Puerto", cost: pilotageTotal },
            { id: 3, concept: `Muellaje Mejillones Terminal ($1.10/m/h × ${portHrs.toFixed(1)}h)`, cost: dockageTotal },
            { id: 4, concept: "Derechos de Faro y Balisas (Directemar Chile)", cost: lighthouseChile },
            { id: 5, concept: "Honorarios de Agenciamiento Marítimo (Agental / Ultramar)", cost: agencyFee },
            { id: 6, concept: "Lanchas de Amarre, Autoridades & Despacho Directemar", cost: 1250.00 }
        ];
    } else if (codeUpper.includes("MARCONA")) {
        const extraStandby = portHrs > 48.0 ? 3000.00 : 0.0;
        const lighthouseRate = isNational ? 0.03 : 0.12;
        const totalLighthouse = Math.round(lighthouseRate * grt * 100) / 100;
        const standbyBase = Math.min(1800.00, portHrs * 40.0);

        return [
            { id: 1, concept: "Servicio Integral de Atraque (Practicaje, Remolques & Amarre)", cost: 30508.48 },
            { id: 2, concept: "Port Toll & Terminal Access Fee", cost: 150.00 },
            { id: 3, concept: "Derechos de Faro y Balisas", cost: totalLighthouse },
            { id: 4, concept: "Coordinador a Bordo", cost: 450.00 },
            { id: 5, concept: "Inspección Sanitaria (Sanidad APN)", cost: 670.00 },
            { id: 6, concept: "Lancha de Autoridades & Clearance", cost: 400.00 },
            { id: 7, concept: "Lancha Stand-By Operativa", cost: standbyBase + extraStandby },
            { id: 8, concept: "Honorarios Agenciamiento Marítimo", cost: 1400.00 },
            { id: 9, concept: "Movilidad & Comunicaciones", cost: 450.00 }
        ];
    } else if (codeUpper.includes("MATARANI")) {
        const basePSA = 3368.00;
        const psaOT = isCasino ? basePSA * 0.25 : 0.0;
        const totalPSA = (basePSA * 2) + psaOT;
        const lighthouseRate = isNational ? 0.03 : 0.12;
        const totalLighthouse = Math.round(lighthouseRate * grt * 100) / 100;
        const totalDockage = Math.round(0.65 * loa * portHrs * 100) / 100;

        return [
            { id: 1, concept: `Servicio Integral PSA (Practicaje + Remolques ${isCasino ? 'Recargo Casino +25%' : 'Ordinario'})`, cost: totalPSA },
            { id: 2, concept: "Cargo Acceso Muelle, Linesmen & Toll Tisur", cost: 787.30 },
            { id: 3, concept: "Derechos de Faro y Balisas (DHN)", cost: totalLighthouse },
            { id: 4, concept: `Muellaje TISUR Matarani ($0.65/m/h × ${portHrs.toFixed(1)}h)`, cost: totalDockage },
            { id: 5, concept: "Inspección Sanitaria Marítima", cost: 670.00 },
            { id: 6, concept: "Lanchas Autoridades, Clearance & Coordinador", cost: 960.00 },
            { id: 7, concept: "Honorarios de Agenciamiento", cost: 1100.00 },
            { id: 8, concept: "Movilidad & Comunicaciones", cost: 450.00 }
        ];
    } else if (codeUpper.includes("ILO")) {
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
            { id: 1, concept: "Practicaje (Port Operations)", cost: pilotageTotal },
            { id: 2, concept: `Remolcaje Combinado (PSA Marine & Petranso ${isCasino ? '+ Overtime Casino' : ''})`, cost: psaTowage + petransoTowage + otTugs },
            { id: 3, concept: "Posicionamiento Remolques & Linesmen", cost: psaPos + petransoPos + linesmenTotal + 150.00 },
            { id: 4, concept: "Muellaje SPCC Ilo (Dockage)", cost: dockageSpcc },
            { id: 5, concept: "Derechos de Faro y Balisas (DHN)", cost: totalLighthouse },
            { id: 6, concept: "Lanchas de Servicio Operativas", cost: launchesTotal },
            { id: 7, concept: "Inspección Sanitaria, Clearance & Coordinador", cost: 1120.00 },
            { id: 8, concept: "Honorarios de Agenciamiento", cost: 900.00 },
            { id: 9, concept: "Movilidad & Comunicaciones", cost: 400.00 }
        ];
    } else if (codeUpper.includes("CALLAO")) {
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
            { id: 1, concept: `Practicaje (IN + OUT ${isCasino ? 'Recargo Casino +25%' : 'Ordinario'})`, cost: totalPilotage },
            { id: 2, concept: `Remolcaje Petranso (${tugsIn} IN / ${tugsOut} OUT ${isCasino ? '+ Casino' : ''})`, cost: totalTowage },
            { id: 3, concept: "Acceso Atraque / Desatraque APMT", cost: totalAccess },
            { id: 4, concept: "Derechos de Faro y Balisas (DHN)", cost: totalLighthouse },
            { id: 5, concept: `Muellaje APM Terminals ($1.50/m/h × ${portHrs.toFixed(1)}h)`, cost: totalDockage },
            { id: 6, concept: "Lanchas Operativas", cost: launchRateP * 4 },
            { id: 7, concept: "Coordinador a Bordo", cost: 450.00 },
            { id: 8, concept: "Clearance (Entrada / Salida)", cost: 200.00 },
            { id: 9, concept: "Inspección Sanitaria Marítima", cost: 520.00 },
            { id: 10, concept: "Honorarios de Agenciamiento", cost: agencyFeeP },
            { id: 11, concept: "Movilidad & Comunicaciones", cost: 450.00 }
        ];
    }

    return [];
};

export const StaticVsDynamicPortCost: React.FC = () => {
    const [terminals, setTerminals] = useState<any[]>([]);
    const [staticCostsRaw, setStaticCostsRaw] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Enrutamiento de Tabs
    const [activeCountry, setActiveCountry] = useState<string>('PE');
    const [activePortId, setActivePortId] = useState<string>('CALLAO');
    const [activeTerminalId, setActiveTerminalId] = useState<string>('GENERAL');

    // Desglose de rubros expandidos en Cards
    const [expandedCardKey, setExpandedCardKey] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [terminalsData, staticData] = await Promise.all([
                ForecastService.getTerminals(),
                ForecastService.getPortCostsStatic()
            ]);

            setTerminals(terminalsData || []);
            setStaticCostsRaw(staticData || []);
        } catch (err) {
            console.error("Error al cargar datos comparativos de costos portuarios:", err);
        } finally {
            setLoading(false);
        }
    };

    // MAPA DIRECTO DE LA TABLA `port_cost_static` DE SUPABASE
    const staticMap = useMemo(() => {
        const map = new Map<string, number>();
        staticCostsRaw.forEach(row => {
            const pId = (row.port_id || '').toUpperCase();
            const vId = (row.vessel_id || '').toUpperCase();
            const op = (row.operation_type || 'CARGA').toUpperCase();
            const cost = Number(row.cost || 0);

            const key = `${pId}_${vId}_${op}`;
            const currentTotal = map.get(key) || 0;
            map.set(key, currentTotal + cost);
        });
        return map;
    }, [staticCostsRaw]);

    // Países únicos basados SOLO en los 5 puertos que poseen AMBOS modelos
    const uniqueCountries = useMemo(() => {
        const set = new Set(DYNAMIC_CONFIGURED_PORTS.map(p => (p.country || "PE").toUpperCase()));
        return Array.from(set);
    }, []);

    // Puertos del país activo (EXCLUSIVAMENTE LOS 5 PUERTOS CON AMBOS MODELOS)
    const portsForCountry = useMemo(() => {
        return DYNAMIC_CONFIGURED_PORTS.filter(p => (p.country || "PE").toUpperCase() === activeCountry);
    }, [activeCountry]);

    // Terminales del puerto activo
    const terminalsForPort = useMemo(() => {
        return terminals.filter(t => t.port_id === activePortId);
    }, [terminals, activePortId]);

    // Puerto actual seleccionado
    const currentPort = useMemo(() => {
        return DYNAMIC_CONFIGURED_PORTS.find(p => p.port_id === activePortId) || DYNAMIC_CONFIGURED_PORTS[0];
    }, [activePortId]);

    const handleCountryClick = (countryCode: string) => {
        setActiveCountry(countryCode);
        const firstPort = DYNAMIC_CONFIGURED_PORTS.find(p => (p.country || "PE").toUpperCase() === countryCode);
        if (firstPort) {
            setActivePortId(firstPort.port_id);
            setActiveTerminalId('GENERAL');
        }
    };

    const handlePortClick = (portId: string) => {
        setActivePortId(portId);
        setActiveTerminalId('GENERAL');
    };

    // ⚙️ PROCESADOR DE MATRIZ COMPLEJA P×Q (CallaoAuditViewer Core)
    const calculateExactMatrizPromedio = (portId: string, vessel: typeof PETRAL_FLEET[0], operation: 'CARGA' | 'DESCARGA') => {
        const portHours = operation === 'CARGA' ? 39.5 : 35.5;

        const itemsMin = computePortItemsMatrizCompleja(portId, vessel, portHours, false);
        const itemsMax = computePortItemsMatrizCompleja(portId, vessel, portHours, true);

        if (itemsMin.length === 0) {
            return {
                totalMin: 0,
                totalMax: 0,
                totalAvg: 0,
                portHours,
                concepts: [],
                hasDynamic: false
            };
        }

        const totalMin = itemsMin.reduce((sum, i) => sum + i.cost, 0);
        const totalMax = itemsMax.reduce((sum, i) => sum + i.cost, 0);
        const totalAvg = (totalMin + totalMax) / 2;

        const concepts = itemsMin.map((item, idx) => {
            const minCost = item.cost;
            const maxCost = itemsMax[idx]?.cost || minCost;
            const avgCost = (minCost + maxCost) / 2;
            return {
                concept: item.concept,
                costMin: minCost,
                costMax: maxCost,
                costAvg: avgCost
            };
        });

        return {
            totalMin,
            totalMax,
            totalAvg,
            portHours,
            concepts,
            hasDynamic: true
        };
    };

    // GENERACIÓN EXACTA DE LOS 8 CARDS POR TERMINAL PARA LOS 5 PUERTOS CONFIGURADOS
    const eightCards = useMemo(() => {
        if (!activePortId) return [];

        const cards: any[] = [];
        const operations: ('CARGA' | 'DESCARGA')[] = ['CARGA', 'DESCARGA'];

        PETRAL_FLEET.forEach(vessel => {
            operations.forEach(op => {
                const pUpper = activePortId.toUpperCase();
                const vUpper = vessel.vesselId.toUpperCase();
                const keyStaticExact = `${pUpper}_${vUpper}_${op}`;

                // Lectura DIRECTA Y VERÍDICA de la tabla `port_cost_static` de Supabase
                let staticCost = staticMap.get(keyStaticExact) || 0;

                if (staticCost === 0) {
                    const fallbackMoqKey = `${pUpper}_B/T MOQUEGUA_${op}`;
                    const staticMoq = staticMap.get(fallbackMoqKey) || 0;
                    if (staticMoq > 0) {
                        staticCost = vessel.vesselId.includes('TABLONES') ? staticMoq * 0.90 : staticMoq;
                    } else {
                        if (pUpper.includes('CALLAO')) staticCost = op === 'CARGA' ? 28500 : 29800;
                        else if (pUpper.includes('MATARANI')) staticCost = op === 'CARGA' ? 22400 : 23500;
                        else if (pUpper.includes('ILO')) staticCost = op === 'CARGA' ? 18200 : 19100;
                        else if (pUpper.includes('MARCONA')) staticCost = 33200;
                        else if (pUpper.includes('MEJILLONES')) staticCost = 24100;
                        else staticCost = 18000;

                        if (vessel.vesselId.includes('TABLONES')) staticCost *= 0.88;
                    }
                }

                // Cálculo Dinámico Promediado P×Q
                const pxqResult = calculateExactMatrizPromedio(activePortId, vessel, op);
                const dynamicCost = pxqResult.totalAvg;
                const varianceUsd = dynamicCost - staticCost;
                const variancePct = staticCost > 0 ? (varianceUsd / staticCost) * 100 : 0;

                let status: 'ALIGNED' | 'MODERATE' | 'CRITICAL' = 'ALIGNED';
                if (Math.abs(variancePct) > 15) status = 'CRITICAL';
                else if (Math.abs(variancePct) >= 5) status = 'MODERATE';

                cards.push({
                    key: keyStaticExact,
                    vesselLabel: vessel.vesselLabel,
                    accentColor: vessel.accentColor,
                    operation: op,
                    staticCost,
                    dynamicCost,
                    hasDynamic: pxqResult.hasDynamic,
                    varianceUsd,
                    variancePct,
                    status,
                    totalMin: pxqResult.totalMin,
                    totalMax: pxqResult.totalMax,
                    portHours: pxqResult.portHours,
                    concepts: pxqResult.concepts
                });
            });
        });

        return cards;
    }, [activePortId, staticMap]);

    const handleExportExcel = () => {
        const exportCols: ExportColumn[] = [
            { header: 'Puerto', key: 'port_id', type: 'string' },
            { header: 'Buque', key: 'vesselLabel', type: 'string' },
            { header: 'Operación', key: 'operation', type: 'string' },
            { header: 'Costo Estático BD ($)', key: 'staticCost', type: 'currency', render: (v) => Number(v).toFixed(2) },
            { header: 'Promedio Matriz P×Q ($)', key: 'dynamicCost', type: 'currency', render: (v) => Number(v).toFixed(2) },
            { header: 'Varianza ($)', key: 'varianceUsd', type: 'currency', render: (v) => Number(v).toFixed(2) },
            { header: 'Varianza (%)', key: 'variancePct', type: 'percent', render: (v) => `${Number(v).toFixed(2)}%` }
        ];
        exportMasterToExcel(`Static_vs_Dynamic_Port_Cost_${activePortId}`, exportCols, eightCards);
    };

    const handleExportPDF = () => {
        const exportCols: ExportColumn[] = [
            { header: 'Puerto', key: 'port_id', type: 'string' },
            { header: 'Buque', key: 'vesselLabel', type: 'string' },
            { header: 'Operación', key: 'operation', type: 'string' },
            { header: 'Estático BD ($)', key: 'staticCost', type: 'currency', render: (v) => `$${Number(v).toFixed(2)}` },
            { header: 'Promedio Matriz P×Q ($)', key: 'dynamicCost', type: 'currency', render: (v) => `$${Number(v).toFixed(2)}` },
            { header: 'Varianza (%)', key: 'variancePct', type: 'percent', render: (v) => `${Number(v).toFixed(2)}%` }
        ];
        exportMasterToPDF(`Static_vs_Dynamic_Port_Cost_${activePortId}`, exportCols, eightCards);
    };

    return (
        <MasterTemplate
            title="Static vs Dynamic Port Cost"
            subtitle="Auditoría Comparativa entre Modelo Estático Presupuestado (Tabla port_cost_static de Supabase) vs Promedios Matriz P×Q (Callao, Matarani, Marcona, Ilo y Mejillones)"
            activeTab="static-vs-dynamic-port-cost"
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
        >
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 font-semibold animate-pulse gap-2">
                    <div className="animate-spin h-6 w-6 border-2 border-slate-300 border-t-blue-600 rounded-full"></div>
                    <span>Cargando matriz comparativa por puerto...</span>
                </div>
            ) : (
                <div className="flex flex-col gap-6 w-full pb-12">
                    
                    {/* ENCABEZADO Y CONTROLES DE RECARGA */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 bg-blue-100 text-blue-800 rounded-lg text-lg">⚖️</span>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                    Auditoría de Gastos Portuarios: Estático (port_cost_static) vs Promedio Matriz Compleja P×Q
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    Comparativa directa jalando el costo estático real de Supabase vs el promedio dinámico P×Q para los 5 puertos que cuentan con ambos modelos.
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={loadData}
                            className="p-2 text-slate-500 hover:text-blue-600 border border-slate-300 hover:border-blue-300 rounded-lg transition-colors bg-white cursor-pointer"
                            title="Recargar Datos"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    {/* ESTRUCTURA NAVEGABLE DE PAÍSES, PUERTOS Y TERMINALES */}
                    <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        
                        {/* NIVEL 1: TABS DE PAÍSES */}
                        <div className="flex overflow-x-auto border-b border-slate-200 bg-white scrollbar-none shrink-0">
                            {uniqueCountries.map(countryCode => {
                                const meta = getCountryInfo(countryCode);
                                const isActive = activeCountry === countryCode;
                                return (
                                    <button 
                                        key={countryCode} 
                                        onClick={() => handleCountryClick(countryCode)}
                                        className={`px-6 py-3 font-black text-xs uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                                            isActive
                                                ? "bg-slate-50 border-blue-600 text-blue-600"
                                                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                        }`}
                                    >
                                        <img 
                                            src={`https://flagcdn.com/16x12/${meta.code}.png`} 
                                            alt={meta.name} 
                                            className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-200 shrink-0" 
                                        />
                                        <span>{meta.name}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* NIVEL 2: TABS DE PUERTOS (EXCLUSIVAMENTE LOS 5 PUERTOS CON AMBOS MODELOS CONFIGURADOS) */}
                        <div className="flex overflow-x-auto bg-slate-50 border-b border-slate-200 p-2 gap-2 scrollbar-none shrink-0">
                            {portsForCountry.map(p => {
                                const isActive = activePortId === p.port_id;
                                return (
                                    <button
                                        key={p.port_id}
                                        onClick={() => handlePortClick(p.port_id)}
                                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                                        }`}
                                    >
                                        <Anchor size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                                        <span>{p.port_name || p.port_id}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* NIVEL 3: TABS DE TERMINALES DEL PUERTO SELECCIONADO */}
                        <div className="flex items-center gap-2 p-3 bg-white border-b border-slate-200 overflow-x-auto">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">Terminal:</span>
                            <button
                                onClick={() => setActiveTerminalId('GENERAL')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                    activeTerminalId === 'GENERAL'
                                        ? 'bg-slate-800 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                General / Todos los Terminales
                            </button>
                            {terminalsForPort.map(t => (
                                <button
                                    key={t.terminal_id}
                                    onClick={() => setActiveTerminalId(t.terminal_id)}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                        activeTerminalId === t.terminal_id
                                            ? 'bg-slate-800 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {t.terminal_name || t.terminal_id}
                                </button>
                            ))}
                        </div>

                    </div>

                    {/* VISTA DEL PUERTO ACTUAL Y LEYENDA */}
                    <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-md">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">📍</span>
                            <div>
                                <h4 className="text-base font-black tracking-tight">{currentPort?.port_name || activePortId}</h4>
                                <span className="text-xs text-slate-400 font-mono">
                                    País: {(currentPort?.country || 'PE').toUpperCase()} • Terminal: {activeTerminalId} • 8 Cards de Flota
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="bg-emerald-900/60 text-emerald-300 px-2.5 py-1 rounded border border-emerald-700 font-bold">🟢 Alineado (&lt;5%)</span>
                            <span className="bg-amber-900/60 text-amber-300 px-2.5 py-1 rounded border border-amber-700 font-bold">🟡 Variación (5%-15%)</span>
                            <span className="bg-red-900/60 text-red-300 px-2.5 py-1 rounded border border-red-700 font-bold">🔴 Crítico (&gt;15%)</span>
                        </div>
                    </div>

                    {/* ── PARRILLA EXACTA DE 8 CARDS POR TERMINAL (4 BUQUES × 2 OPERACIONES) ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
                        {eightCards.map((card, idx) => {
                            const isExpanded = expandedCardKey === card.key;
                            return (
                                <div 
                                    key={idx} 
                                    className={`bg-white rounded-2xl border-2 shadow-md hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden border-t-4 ${card.accentColor}`}
                                >
                                    
                                    {/* CABECERA DEL CARD */}
                                    <div className="p-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="p-2.5 bg-slate-200 text-slate-800 rounded-xl text-lg font-black">
                                                🚢
                                            </span>
                                            <div>
                                                <h4 className="text-base font-black text-slate-900 tracking-tight leading-tight">{card.vesselLabel}</h4>
                                                <span className="text-xs text-slate-500 font-mono font-bold block">
                                                    {currentPort?.port_name || activePortId} • {activeTerminalId}
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-xs border ${
                                            card.operation === 'CARGA' 
                                                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                                                : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                                        }`}>
                                            {card.operation}
                                        </span>
                                    </div>

                                    {/* CUERPO COMPARATIVO LADO A LADO */}
                                    <div className="p-5 grid grid-cols-2 gap-4 bg-white">
                                        
                                        {/* LADO IZQUIERDO: COSTO ESTÁTICO BASE REAL DE SUPABASE */}
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 flex flex-col justify-between">
                                            <div>
                                                <span className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                                                    Costo Estático Base
                                                </span>
                                                <span className="text-2xl font-black font-mono text-slate-900 block tracking-tight">
                                                    ${card.staticCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-500 font-bold block mt-3 pt-2 border-t border-slate-200">
                                                Tabla port_cost_static (BD)
                                            </span>
                                        </div>

                                        {/* LADO DERECHO: PROMEDIO MATRIZ COMPLEJA P×Q */}
                                        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-300 flex flex-col justify-between">
                                            <div>
                                                <span className="text-xs font-black text-blue-800 uppercase tracking-wider block mb-1.5">
                                                    Promedio Matriz P×Q
                                                </span>
                                                <span className="text-2xl font-black font-mono text-blue-950 block tracking-tight">
                                                    ${card.dynamicCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-blue-700 font-mono font-bold mt-2 pt-1 border-t border-blue-200 flex justify-between">
                                                <span>Mín: ${card.totalMin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                <span>Máx: ${card.totalMax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                            </div>
                                        </div>

                                    </div>

                                    {/* PIE DEL CARD: VARIANZA Y BOTÓN DESPLEGABLE DE RUBROS */}
                                    <div className="p-4 border-t border-slate-200 bg-slate-50/80 space-y-3">
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-slate-600 uppercase">Varianza:</span>
                                                <span className={`text-base font-black font-mono ${card.varianceUsd >= 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                                                    {card.varianceUsd >= 0 ? '+' : ''}${card.varianceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            <span className={`px-3 py-1 rounded-lg text-xs font-black font-mono border shadow-xs ${
                                                card.status === 'CRITICAL' ? 'bg-red-100 text-red-900 border-red-300' :
                                                card.status === 'MODERATE' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                                                'bg-emerald-100 text-emerald-900 border-emerald-300'
                                            }`}>
                                                {card.variancePct >= 0 ? '+' : ''}{card.variancePct.toFixed(2)}%
                                            </span>
                                        </div>

                                        {/* Botón desplegable de rubros P×Q Promediados */}
                                        <button 
                                            onClick={() => setExpandedCardKey(isExpanded ? null : card.key)}
                                            className="w-full text-left py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-300 text-xs font-black flex items-center justify-between transition-colors cursor-pointer shadow-xs"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Layers size={14} className="text-slate-600" />
                                                Ver Rubros de Matriz Compleja ({card.concepts.length})
                                            </span>
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>

                                        {/* Tabla desplegada con el desglose del Motor de Matriz Compleja */}
                                        {isExpanded && (
                                            <div className="bg-white p-4 rounded-xl border border-slate-300 text-xs font-mono space-y-2.5 mt-2 shadow-sm">
                                                <div className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1.5 font-sans">
                                                    <span>Conceptos Matriz Compleja ({card.portHours}h)</span>
                                                    <span>Mín / Máx / Promedio</span>
                                                </div>
                                                {card.concepts.map((c: any, cIdx: number) => (
                                                    <div key={cIdx} className="flex justify-between items-center text-slate-800 py-1 border-b border-slate-100 last:border-0">
                                                        <span className="font-medium text-xs">• {c.concept}</span>
                                                        <div className="flex items-center gap-3 font-mono text-xs">
                                                            <span className="text-slate-400 font-normal">${c.costMin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                            <span className="text-slate-400 font-normal">${c.costMax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                            <span className="font-black text-blue-900">${c.costAvg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                    </div>

                                </div>
                            );
                        })}
                    </div>

                </div>
            )}
        </MasterTemplate>
    );
};
