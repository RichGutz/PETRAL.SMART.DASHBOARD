import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { computePortItems } from '../../components/Masters/CallaoAuditViewer';
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

    // ⚙️ PROCESADOR DIRECTO: Importa y ejecuta el motor oficial `computePortItems` de sistemas.
    // REGLA: No inventa nada. Si el motor no tiene datos para ese puerto → hasDynamic: false.
    const calculateMatrizPromedio = (portId: string, vessel: typeof PETRAL_FLEET[0], operation: 'CARGA' | 'DESCARGA') => {
        const cargoTons = 13500;
        const rate = operation === 'CARGA' ? 500 : 350;
        const portHours = (cargoTons / rate) + 4.0; // P.ej. Callao Carga: 31.0h

        // Escenario Mínimo: horario diurno ordinario (isCasino = false)
        const itemsMin = computePortItems(portId.toUpperCase(), vessel, portHours, true, 2, 2, false) || [];
        const totalMin = itemsMin.reduce((sum: number, i: any) => sum + (i.cost || 0), 0);

        // Escenario Máximo: horario nocturno/casino (isCasino = true)
        const itemsMax = computePortItems(portId.toUpperCase(), vessel, portHours, true, 2, 2, true) || [];
        const totalMax = itemsMax.reduce((sum: number, i: any) => sum + (i.cost || 0), 0);

        // Promedio directo de lo que devuelve el motor — sin multiplicadores artificiales
        const totalAvg = (totalMin + totalMax) / 2;

        const concepts = itemsMin.map((item: any, idx: number) => {
            const minCost = item.cost || 0;
            const maxCost = itemsMax[idx]?.cost ?? minCost;
            return {
                concept: item.concept || `Concepto ${idx + 1}`,
                costMin: minCost,
                costMax: maxCost,
                costAvg: (minCost + maxCost) / 2
            };
        });

        return { totalMin, totalMax, totalAvg, portHours, concepts, hasDynamic: itemsMin.length > 0 };
    };

    // GENERACIÓN DE CARDS: Solo incluye combinaciones que tienen AMBOS ingredientes reales.
    // REGLA: staticCost === 0 → no hay dato en BD → card excluida. hasDynamic === false → motor no soporta ese puerto → card excluida.
    const validCards = useMemo(() => {
        if (!activePortId) return [];

        const cards: any[] = [];
        const operations: ('CARGA' | 'DESCARGA')[] = ['CARGA', 'DESCARGA'];

        PETRAL_FLEET.forEach(vessel => {
            operations.forEach(op => {
                const pUpper = activePortId.toUpperCase();
                const vUpper = vessel.vesselId.toUpperCase();
                const keyStaticExact = `${pUpper}_${vUpper}_${op}`;

                // ESTÁTICO: Solo lo que viene de Supabase. Si es 0 → no hay tarifa → se omite esta card.
                const staticCost = staticMap.get(keyStaticExact) || 0;
                if (staticCost === 0) return; // Sin dato en BD → excluir

                // DINÁMICO: Solo lo que devuelve el motor oficial sin modificaciones.
                const pxqResult = calculateMatrizPromedio(activePortId, vessel, op);
                if (!pxqResult.hasDynamic) return; // Motor no soporta este puerto → excluir

                const dynamicCost = pxqResult.totalAvg;
                const varianceUsd = dynamicCost - staticCost;
                const variancePct = (varianceUsd / staticCost) * 100;

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
        exportMasterToExcel(`Static_vs_Dynamic_Port_Cost_${activePortId}`, exportCols, validCards);
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
        exportMasterToPDF(`Static_vs_Dynamic_Port_Cost_${activePortId}`, exportCols, validCards);
    };

    return (
        <MasterTemplate
            title="Static vs Dynamic Port Cost"
            subtitle="Auditoría Comparativa entre Modelo Estático Presupuestado (Tabla port_cost_static de Supabase) vs Promedios Matriz P×Q (Consumiendo el Motor Oficial CallaoAuditViewer)"
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
                                    Comparativa directa jalando la función oficial de sistemas computePortItems de CallaoAuditViewer.
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

                    {/* ── PARRILLA DE CARDS: Solo las combinaciones con AMBOS modelos reales ── */}
                    {validCards.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3 bg-white rounded-xl border border-slate-200">
                            <span className="text-3xl">⚓</span>
                            <p className="text-sm font-bold text-slate-600">Sin comparativa disponible para este puerto.</p>
                            <p className="text-xs text-slate-400 text-center max-w-sm">No existen tarifas en <code className="bg-slate-100 px-1 rounded">port_cost_static</code> para los buques de la flota PETRAL en este puerto, o el motor P×Q no lo tiene configurado.</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
                        {validCards.map((card, idx) => {
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

                                        {/* LADO DERECHO: PROMEDIO MATRIZ COMPLEJA P×Q (DEL MOTOR DE SISTEMAS) */}
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
                                                Ver Rubros del Motor de Sistemas ({card.concepts.length})
                                            </span>
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>

                                        {/* Tabla desplegada con el desglose del Motor de Matriz Compleja */}
                                        {isExpanded && (
                                            <div className="bg-white p-4 rounded-xl border border-slate-300 text-xs font-mono space-y-2.5 mt-2 shadow-sm">
                                                <div className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1.5 font-sans">
                                                    <span>Conceptos Motor Sistemas ({card.portHours.toFixed(1)}h)</span>
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
