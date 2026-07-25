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

interface StaticPortCostRow {
    port_id: string;
    vessel_id: string;
    operation_type: 'CARGA' | 'DESCARGA';
    cost: number;
}

interface DynamicConcept {
    concept: string;
    costMin: number;
    costMax: number;
    costAvg: number;
}

// Las 4 Naves Oficiales de la Flota PETRAL con sus parámetros de tonelaje y eslora
const PETRAL_FLEET = [
    { vesselId: 'B/T MOQUEGUA', vesselLabel: 'B/T MOQUEGUA', loa: 134.16, grt: 8259, dwt: 14298, accentColor: 'border-t-blue-600 border-blue-300' },
    { vesselId: 'B/T TABLONES', vesselLabel: 'B/T TABLONES', loa: 134.16, grt: 8259, dwt: 14298, accentColor: 'border-t-teal-600 border-teal-300' },
    { vesselId: 'CONCON TRADER', vesselLabel: 'CONCON TRADER', loa: 134.16, grt: 8259, dwt: 14298, accentColor: 'border-t-indigo-600 border-indigo-300' },
    { vesselId: 'HUEMUL', vesselLabel: 'HUEMUL', loa: 134.16, grt: 8259, dwt: 14298, accentColor: 'border-t-amber-600 border-amber-300' }
];

export const StaticVsDynamicPortCost: React.FC = () => {
    const [ports, setPorts] = useState<any[]>([]);
    const [terminals, setTerminals] = useState<any[]>([]);
    const [staticCostsData, setStaticCostsData] = useState<StaticPortCostRow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Enrutamiento de Tabs
    const [activeCountry, setActiveCountry] = useState<string>('PE');
    const [activePortId, setActivePortId] = useState<string>('');
    const [activeTerminalId, setActiveTerminalId] = useState<string>('GENERAL');

    // Desglose de rubros expandidos en Cards
    const [expandedCardKey, setExpandedCardKey] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [portsData, terminalsData, staticData] = await Promise.all([
                ForecastService.getPorts(),
                ForecastService.getTerminals(),
                ForecastService.getPortCostsStatic()
            ]);

            const sortedPorts = (portsData || []).sort((a: any, b: any) => {
                const latA = parseFloat(a.lat) || 0;
                const latB = parseFloat(b.lat) || 0;
                return latB - latA;
            });

            setPorts(sortedPorts);
            setTerminals(terminalsData || []);
            setStaticCostsData(staticData || []);

            if (sortedPorts.length > 0) {
                const firstCountry = (sortedPorts[0].country || 'PE').toUpperCase();
                setActiveCountry(firstCountry);
                const firstPort = sortedPorts.find((p: any) => (p.country || 'PE').toUpperCase() === firstCountry);
                if (firstPort) {
                    setActivePortId(firstPort.port_id);
                }
            }
        } catch (err) {
            console.error("Error al cargar datos comparativos de costos portuarios:", err);
        } finally {
            setLoading(false);
        }
    };

    // Países únicos
    const uniqueCountries = useMemo(() => {
        const set = new Set(ports.map(p => (p.country || "PE").toUpperCase()));
        return Array.from(set);
    }, [ports]);

    // Puertos del país activo
    const portsForCountry = useMemo(() => {
        return ports.filter(p => (p.country || "PE").toUpperCase() === activeCountry);
    }, [ports, activeCountry]);

    // Terminales del puerto activo
    const terminalsForPort = useMemo(() => {
        return terminals.filter(t => t.port_id === activePortId);
    }, [terminals, activePortId]);

    // Puerto actual seleccionado
    const currentPort = useMemo(() => {
        return ports.find(p => p.port_id === activePortId) || ports[0];
    }, [ports, activePortId]);

    const handleCountryClick = (countryCode: string) => {
        setActiveCountry(countryCode);
        const firstPort = ports.find(p => (p.country || "PE").toUpperCase() === countryCode);
        if (firstPort) {
            setActivePortId(firstPort.port_id);
            setActiveTerminalId('GENERAL');
        }
    };

    const handlePortClick = (portId: string) => {
        setActivePortId(portId);
        setActiveTerminalId('GENERAL');
    };

    // Mapa de costos estáticos de Supabase (port_cost_static)
    const staticMap = useMemo(() => {
        const map = new Map<string, number>();
        staticCostsData.forEach(row => {
            const pId = (row.port_id || '').toUpperCase();
            const vId = (row.vessel_id || '').toUpperCase();
            const op = (row.operation_type || 'CARGA').toUpperCase();
            const key = `${pId}_${vId}_${op}`;
            map.set(key, Number(row.cost || 0));
        });
        return map;
    }, [staticCostsData]);

    // ⚙️ MOTOR P×Q PROMEDIADO OFICIAL DE PETRAL (Motor.PxQ.Promediado.md) ⚙️
    // Resuelve la incertidumbre del horario mediante 2 escenarios (Mínimo Ordinario vs Máximo Recargo/Casino)
    const calculatePxQAveragedCost = (portId: string, vesselSpec: typeof PETRAL_FLEET[0], operation: 'CARGA' | 'DESCARGA') => {
        const pUpper = portId.toUpperCase();
        
        // Grilla Uniforme de Variables Q
        const volumeMT = 13500;
        const qRate = operation === 'CARGA' ? 500 : 350;
        const qOpHours = Math.round((volumeMT / qRate) * 10) / 10;
        const qFixedHours = 4.0;
        const qTotalHours = qOpHours + qFixedHours;

        let concepts: DynamicConcept[] = [];

        if (pUpper.includes('CALLAO')) {
            const dockageBase = 1.50 * vesselSpec.loa * qTotalHours;
            const towageMin = 3200.00;
            const towageMax = 3200.00 * 1.25;
            const pilotageMin = Math.max(750, 0.32 * vesselSpec.grt);
            const pilotageMax = pilotageMin * 1.25;
            const lighthouse = 0.03 * vesselSpec.grt;
            const agencyFee = 1000.00;
            const launchMooringMin = 650.00;
            const launchMooringMax = 650.00 * 1.20;

            concepts = [
                { concept: `Uso de Muelle APMT ($1.50/m/h × ${qTotalHours}h)`, costMin: dockageBase, costMax: dockageBase, costAvg: dockageBase },
                { concept: `Remolcadores PSA Marine (2 IN / 2 OUT @ $800)`, costMin: towageMin, costMax: towageMax, costAvg: (towageMin + towageMax) / 2 },
                { concept: `Practicaje de Puerto (Pilots)`, costMin: pilotageMin, costMax: pilotageMax, costAvg: (pilotageMin + pilotageMax) / 2 },
                { concept: `Derechos de Faro y Balisas (DHN)`, costMin: lighthouse, costMax: lighthouse, costAvg: lighthouse },
                { concept: `Honorarios Agenciamiento Marítimo (Trans Total)`, costMin: agencyFee, costMax: agencyFee, costAvg: agencyFee },
                { concept: `Lanchas de Practicaje & Amarre/Desamarre`, costMin: launchMooringMin, costMax: launchMooringMax, costAvg: (launchMooringMin + launchMooringMax) / 2 }
            ];
        }
        else if (pUpper.includes('MATARANI')) {
            const dockageBase = 0.65 * vesselSpec.loa * qTotalHours;
            const psaMin = 6736.00;
            const psaMax = 6736.00 * 1.25;
            const lighthouse = 0.03 * vesselSpec.grt;
            const agencyFee = 1000.00;
            const portToll = 450.00;

            concepts = [
                { concept: `Servicio Integral PSA (Practicaje + Remolques Tisur)`, costMin: psaMin, costMax: psaMax, costAvg: (psaMin + psaMax) / 2 },
                { concept: `Uso de Muelle Tisur ($0.65/m/h × ${qTotalHours}h)`, costMin: dockageBase, costMax: dockageBase, costAvg: dockageBase },
                { concept: `Derechos de Faro y Balisas (DHN)`, costMin: lighthouse, costMax: lighthouse, costAvg: lighthouse },
                { concept: `Honorarios Agenciamiento Marítimo`, costMin: agencyFee, costMax: agencyFee, costAvg: agencyFee },
                { concept: `Port Toll & Acceso Terminal`, costMin: portToll, costMax: portToll, costAvg: portToll }
            ];
        }
        else if (pUpper.includes('MARCONA')) {
            const psaFlat = 30508.48;
            const lighthouse = 0.03 * vesselSpec.grt;
            const agencyFee = 1400.00;
            const sanitationLaunch = 1070.00;

            concepts = [
                { concept: `Servicio Integral Atraque (PSA Convenio SPCC)`, costMin: psaFlat, costMax: psaFlat, costAvg: psaFlat },
                { concept: `Derechos de Faro y Balisas (DHN)`, costMin: lighthouse, costMax: lighthouse, costAvg: lighthouse },
                { concept: `Honorarios Agenciamiento Marítimo (Trans Total)`, costMin: agencyFee, costMax: agencyFee, costAvg: agencyFee },
                { concept: `Inspección Sanitaria & Lancha Standby`, costMin: sanitationLaunch, costMax: sanitationLaunch, costAvg: sanitationLaunch }
            ];
        }
        else if (pUpper.includes('ILO')) {
            const dockageBase = 0.85 * vesselSpec.loa * qTotalHours;
            const towageMin = 4200.00;
            const towageMax = 4200.00 * 1.25;
            const lighthouse = 0.03 * vesselSpec.grt;
            const agencyFee = 1000.00;

            concepts = [
                { concept: `Remolcadores & Maniobras de Puerto`, costMin: towageMin, costMax: towageMax, costAvg: (towageMin + towageMax) / 2 },
                { concept: `Uso de Muelle (Port Dues Enapu/SPCC × ${qTotalHours}h)`, costMin: dockageBase, costMax: dockageBase, costAvg: dockageBase },
                { concept: `Derechos de Faro y Balisas (DHN)`, costMin: lighthouse, costMax: lighthouse, costAvg: lighthouse },
                { concept: `Honorarios Agenciamiento Marítimo`, costMin: agencyFee, costMax: agencyFee, costAvg: agencyFee }
            ];
        }
        else {
            const dockageBase = 1.10 * vesselSpec.loa * qTotalHours;
            const towageMin = 4500.00;
            const towageMax = 4500.00 * 1.20;
            const pilotageMin = 2800.00;
            const pilotageMax = 2800.00 * 1.20;
            const agencyFee = 1200.00;

            concepts = [
                { concept: `Uso de Muelle & Terminal Dues`, costMin: dockageBase, costMax: dockageBase, costAvg: dockageBase },
                { concept: `Remolcadores de Puerto`, costMin: towageMin, costMax: towageMax, costAvg: (towageMin + towageMax) / 2 },
                { concept: `Practicaje & Pilotaje`, costMin: pilotageMin, costMax: pilotageMax, costAvg: (pilotageMin + pilotageMax) / 2 },
                { concept: `Agenciamiento & Manejo Documental`, costMin: agencyFee, costMax: agencyFee, costAvg: agencyFee }
            ];
        }

        const totalMin = concepts.reduce((s, c) => s + c.costMin, 0);
        const totalMax = concepts.reduce((s, c) => s + c.costMax, 0);
        const totalAvg = (totalMin + totalMax) / 2;

        return {
            totalMin,
            totalMax,
            totalAvg,
            qTotalHours,
            concepts
        };
    };

    // GENERACIÓN EXACTA DE LOS 8 CARDS POR TERMINAL (4 BUQUES × 2 OPERACIONES: CARGA Y DESCARGA)
    const eightCards = useMemo(() => {
        if (!activePortId) return [];

        const cards: any[] = [];
        const operations: ('CARGA' | 'DESCARGA')[] = ['CARGA', 'DESCARGA'];

        PETRAL_FLEET.forEach(vessel => {
            operations.forEach(op => {
                const keyStatic = `${activePortId.toUpperCase()}_${vessel.vesselId.toUpperCase()}_${op}`;
                
                // Costo Estático de Supabase
                let staticCost = staticMap.get(keyStatic) || 0;
                
                if (staticCost === 0) {
                    const fallbackMoquegua = staticMap.get(`${activePortId.toUpperCase()}_B/T MOQUEGUA_${op}`);
                    if (fallbackMoquegua && fallbackMoquegua > 0) {
                        staticCost = vessel.vesselId.includes('TABLONES') ? fallbackMoquegua * 0.90 : fallbackMoquegua;
                    } else {
                        if (activePortId.toUpperCase().includes('CALLAO')) staticCost = op === 'CARGA' ? 28500 : 29800;
                        else if (activePortId.toUpperCase().includes('MATARANI')) staticCost = op === 'CARGA' ? 22400 : 23500;
                        else if (activePortId.toUpperCase().includes('ILO')) staticCost = op === 'CARGA' ? 18200 : 19100;
                        else if (activePortId.toUpperCase().includes('MARCONA')) staticCost = 33200;
                        else staticCost = 21000;

                        if (vessel.vesselId.includes('TABLONES')) staticCost *= 0.88;
                    }
                }

                // Costo Dinámico Promediado P×Q
                const pxqResult = calculatePxQAveragedCost(activePortId, vessel, op);
                const dynamicCost = pxqResult.totalAvg;
                const varianceUsd = dynamicCost - staticCost;
                const variancePct = staticCost > 0 ? (varianceUsd / staticCost) * 100 : 0;

                let status: 'ALIGNED' | 'MODERATE' | 'CRITICAL' = 'ALIGNED';
                if (Math.abs(variancePct) > 15) status = 'CRITICAL';
                else if (Math.abs(variancePct) >= 5) status = 'MODERATE';

                cards.push({
                    key: keyStatic,
                    vesselLabel: vessel.vesselLabel,
                    accentColor: vessel.accentColor,
                    operation: op,
                    staticCost,
                    dynamicCost,
                    varianceUsd,
                    variancePct,
                    status,
                    totalMin: pxqResult.totalMin,
                    totalMax: pxqResult.totalMax,
                    qTotalHours: pxqResult.qTotalHours,
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
            { header: 'Costo Estático ($)', key: 'staticCost', type: 'currency', render: (v) => Number(v).toFixed(2) },
            { header: 'Costo Dinámico P×Q Promedio ($)', key: 'dynamicCost', type: 'currency', render: (v) => Number(v).toFixed(2) },
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
            { header: 'Estático ($)', key: 'staticCost', type: 'currency', render: (v) => `$${Number(v).toFixed(2)}` },
            { header: 'Dinámico P×Q Promedio ($)', key: 'dynamicCost', type: 'currency', render: (v) => `$${Number(v).toFixed(2)}` },
            { header: 'Varianza (%)', key: 'variancePct', type: 'percent', render: (v) => `${Number(v).toFixed(2)}%` }
        ];
        exportMasterToPDF(`Static_vs_Dynamic_Port_Cost_${activePortId}`, exportCols, eightCards);
    };

    return (
        <MasterTemplate
            title="Static vs Dynamic Port Cost"
            subtitle="Auditoría Comparativa entre Modelo Estático Presupuestado vs Motor P×Q Promediado por Puerto y Terminal (8 Cards por Flota)"
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
                            <span className="p-2.5 bg-blue-100 text-blue-800 rounded-lg text-lg">⚙️</span>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                    Auditoría de Gastos Portuarios: Estático vs Motor P×Q Promediado (8 Cards)
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    Comparativa entre tarifa plana del contrato vs Promedio P×Q Dual (4 Buques Flota PETRAL × 2 Operaciones: Carga y Descarga).
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

                        {/* NIVEL 2: TABS DE PUERTOS PARA EL PAÍS SELECCIONADO */}
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
                                        <span>{p.port_name || p.name || p.port_id}</span>
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
                                        
                                        {/* LADO IZQUIERDO: COSTO ESTÁTICO BASE */}
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
                                                Tarifa Plana Fija
                                            </span>
                                        </div>

                                        {/* LADO DERECHO: COSTO DINÁMICO P×Q PROMEDIADO */}
                                        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-300 flex flex-col justify-between">
                                            <div>
                                                <span className="text-xs font-black text-blue-800 uppercase tracking-wider block mb-1.5">
                                                    Costo Dinámico P×Q Promedio
                                                </span>
                                                <span className="text-2xl font-black font-mono text-blue-950 block tracking-tight">
                                                    ${card.dynamicCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-blue-700 font-mono font-bold mt-2 pt-1 border-t border-blue-200 flex justify-between">
                                                <span>Min: ${card.totalMin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                <span>Max: ${card.totalMax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
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
                                                Ver Rubros P×Q Promediados ({card.concepts.length})
                                            </span>
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>

                                        {/* Tabla desplegada con el desglose del Motor P×Q Promediado */}
                                        {isExpanded && (
                                            <div className="bg-white p-4 rounded-xl border border-slate-300 text-xs font-mono space-y-2.5 mt-2 shadow-sm">
                                                <div className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1.5 font-sans">
                                                    <span>Conceptos Matriz P×Q ({card.qTotalHours}h)</span>
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
