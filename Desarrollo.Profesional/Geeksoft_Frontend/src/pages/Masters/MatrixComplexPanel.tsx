import React, { useState, useEffect } from "react";
import { Anchor, Waves, Zap, Briefcase, Save } from "lucide-react";
import { ForecastService } from "../../services/api";

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface PortTariffs {
    pilotage_integral: number;
    pilotage_surcharge_25: number;
    linesmen: number;
    towage: number;
    port_toll: number;
    lighthouse_national: number;
    lighthouse_foreign: number;
    dockage_per_meter_hour: number;
    launch_authorities: number;
    launch_standby_hr: number;
    sanitary_inspection: number;
    clearance: number;
    coordinator_board: number;
    agency_fee: number;
    transport: number;
    comms: number;
}

// ─── Valores extraídos de los Exceles de PORT.COSTS.PAOLA ────────────────────
const TARIFFS_BY_PORT: Record<string, PortTariffs> = {
    ILO: {
        pilotage_integral: 5550, pilotage_surcharge_25: 1387.5,
        linesmen: 357.30, towage: 0, port_toll: 70,
        lighthouse_national: 0.03, lighthouse_foreign: 0.12,
        dockage_per_meter_hour: 0.65, launch_authorities: 155,
        launch_standby_hr: 0, sanitary_inspection: 670,
        clearance: 200, coordinator_board: 225,
        agency_fee: 1100, transport: 200, comms: 200,
    },
    MATARANI: {
        pilotage_integral: 5550, pilotage_surcharge_25: 1387.5,
        linesmen: 357.30, towage: 0, port_toll: 75,
        lighthouse_national: 0.03, lighthouse_foreign: 0.12,
        dockage_per_meter_hour: 0.65, launch_authorities: 155,
        launch_standby_hr: 0, sanitary_inspection: 670,
        clearance: 200, coordinator_board: 225,
        agency_fee: 1100, transport: 200, comms: 200,
    },
    MARCONA: {
        pilotage_integral: 0, pilotage_surcharge_25: 0,
        linesmen: 4450, towage: 18000, port_toll: 75,
        lighthouse_national: 0.03, lighthouse_foreign: 0.12,
        dockage_per_meter_hour: 0, launch_authorities: 200,
        launch_standby_hr: 40, sanitary_inspection: 670,
        clearance: 200, coordinator_board: 225,
        agency_fee: 1400, transport: 200, comms: 250,
    },
};

const DEFAULT_TARIFFS: PortTariffs = {
    pilotage_integral: 0, pilotage_surcharge_25: 0, linesmen: 0, towage: 0, port_toll: 0,
    lighthouse_national: 0.03, lighthouse_foreign: 0.12, dockage_per_meter_hour: 0.65,
    launch_authorities: 0, launch_standby_hr: 0, sanitary_inspection: 0,
    clearance: 0, coordinator_board: 0, agency_fee: 0, transport: 0, comms: 0,
};

// ─── Banderas y nombre del país ───────────────────────────────────────────────
const COUNTRY_META: Record<string, { flag: string; label: string; color: string }> = {
    PE: { flag: "🇵🇪", label: "Perú", color: "#dc2626" },
    EC: { flag: "🇪🇨", label: "Ecuador", color: "#ca8a04" },
    CL: { flag: "🇨🇱", label: "Chile", color: "#2563eb" },
};

// ─── Guía explicativa unificada con campos de input ───────────────────────────
interface FormulaItem {
    concept: string;
    field: keyof PortTariffs;
    tooltip?: string;
    formula: string;
    explanation: string;
    unit: string;
}

interface FormulaSection {
    section: string;
    color: string;
    icon: React.ReactNode;
    items: FormulaItem[];
}

const FORMULA_GUIDE: FormulaSection[] = [
    {
        section: "A) Maniobras (Shifting)",
        color: "#f59e0b",
        icon: <Zap size={14} />,
        items: [
            {
                concept: "Practicaje + Remolcadores + Lancha (Integral)",
                field: "pilotage_integral",
                tooltip: "×2 (entrada + salida)",
                formula: "Tarifa × 2",
                explanation: "Se cobra por maniobra (entrada y salida del buque). Si el puerto usa servicio integral, este valor cubre práctico, remolcadores y lancha de piloto en un solo cobro.",
                unit: "USD / maniobra",
            },
            {
                concept: "Recargo Integral 25% (condiciones climáticas)",
                field: "pilotage_surcharge_25",
                formula: "Tarifa Fija",
                explanation: "Recargo aplicado por condiciones climáticas adversas o maniobras en horarios extraordinarios.",
                unit: "USD",
            },
            {
                concept: "Remolcadores / Towage (no integral)",
                field: "towage",
                tooltip: "×2 (entrada + salida)",
                formula: "Tarifa × 2",
                explanation: "Cuando el puerto NO ofrece servicio integral, el remolque se cotiza de forma separada por cada maniobra de atraque o desatraque.",
                unit: "USD / maniobra",
            },
            {
                concept: "Amarradores / Linesmen",
                field: "linesmen",
                formula: "Tarifa × 1 (o ×2)",
                explanation: "Servicio de amarre y desamarre de cabos en el muelle. Puede cobrarse por servicio completo o por maniobra, según el terminal.",
                unit: "USD / servicio",
            },
            {
                concept: "Port Toll / Cargo de Acceso",
                field: "port_toll",
                tooltip: "×2 (entrada + salida)",
                formula: "Tarifa × 2",
                explanation: "Derecho de acceso a las instalaciones del terminal o del muelle. Se cobra por cada maniobra (entrada y salida).",
                unit: "USD / maniobra",
            },
        ],
    },
    {
        section: "B) Gastos Generales de Puerto",
        color: "#0ea5e9",
        icon: <Waves size={14} />,
        items: [
            {
                concept: "Faro Nacional (Lighthouse Dues)",
                field: "lighthouse_national",
                tooltip: "Tarifa × GRT del buque",
                formula: "Tarifa × GRT del Buque",
                explanation: "Tarifa regulada por la APN (Perú), DIRECTEMAR (Chile) o DIGMER (Ecuador). Se aplica cuando el buque procede de un puerto del mismo país. Universal: $0.03 USD/GRT en Perú.",
                unit: "USD / GRT",
            },
            {
                concept: "Faro Extranjero (Lighthouse Dues)",
                field: "lighthouse_foreign",
                tooltip: "Tarifa × GRT del buque",
                formula: "Tarifa × GRT del Buque",
                explanation: "Misma regulación de faro, pero tarifa mayor cuando el buque procede de un puerto de otro país. Universal: $0.12 USD/GRT en Perú.",
                unit: "USD / GRT",
            },
            {
                concept: "Muellaje / Dockage",
                field: "dockage_per_meter_hour",
                tooltip: "Tarifa × LOA × Horas en Puerto",
                formula: "Tarifa × LOA (metros) × Horas en Puerto",
                explanation: "Cobro por el tiempo que el buque ocupa el berth (posición de atraque). La fórmula multiplica la tarifa por metro de eslora por cada hora de estadía. Confirmado en Ilo y Matarani: $0.65 USD/m·hr.",
                unit: "USD / m · hr",
            },
            {
                concept: "Lancha de Autoridades",
                field: "launch_authorities",
                formula: "Tarifa fija (por llamada)",
                explanation: "Lancha para el transporte de autoridades portuarias (Capitanía, Aduanas, Sanidad) hacia y desde el buque. Generalmente se cobra como tarifa plana fija.",
                unit: "USD / llamada",
            },
            {
                concept: "Lancha Stand-By / Espera",
                field: "launch_standby_hr",
                tooltip: "Tarifa × Horas en Puerto",
                formula: "Tarifa × Horas en Puerto",
                explanation: "Servicio de lancha en espera continua durante toda la estadía del buque. Se cobra por hora. Aplicable en Marcona y puertos sin muelle fijo de autoridades.",
                unit: "USD / hora",
            },
            {
                concept: "Inspección Sanitaria",
                field: "sanitary_inspection",
                formula: "Tarifa fija",
                explanation: "Cobro por la inspección de DIGESA o autoridad sanitaria al arribar y despachar el buque. Tarifa fija por escala.",
                unit: "USD fijo",
            },
            {
                concept: "Clearance In / Out",
                field: "clearance",
                formula: "Tarifa fija",
                explanation: "Gestión de despacho aduanero y migratorio de entrada y salida. Cobro fijo por escala independiente del tonelaje.",
                unit: "USD fijo",
            },
            {
                concept: "Coordinador a Bordo",
                field: "coordinator_board",
                tooltip: "×2 (entrada + salida)",
                formula: "Tarifa × 2",
                explanation: "Personal de coordinación operativa a bordo del buque durante las maniobras de entrada y salida. Cobro por visita (entrada + salida).",
                unit: "USD / visita",
            },
        ],
    },
    {
        section: "C) Gastos de Agencia",
        color: "#8b5cf6",
        icon: <Briefcase size={14} />,
        items: [
            {
                concept: "Honorarios de Agencia",
                field: "agency_fee",
                formula: "Tarifa fija por escala",
                explanation: "Comisión de la agencia marítima local por gestionar toda la operación portuaria: trámites, coordinación con autoridades, provisiones y despacho.",
                unit: "USD / escala",
            },
            {
                concept: "Movilidad",
                field: "transport",
                formula: "Tarifa fija",
                explanation: "Gastos de transporte del personal de agencia (autoridades, coordinadores, operadores) durante la estadía del buque en el terminal.",
                unit: "USD fijo",
            },
            {
                concept: "Comunicaciones",
                field: "comms",
                formula: "Tarifa fija",
                explanation: "Gastos de comunicación del agente con el buque, la naviera y las autoridades durante la escala.",
                unit: "USD fijo",
            },
        ],
    },
];

// ─── Componente Principal ─────────────────────────────────────────────────────
interface MatrixComplexPanelProps {
    ports: any[];
    activePortId: string;
    setActivePortId: (id: string) => void;
}

export const MatrixComplexPanel: React.FC<MatrixComplexPanelProps> = ({ ports, activePortId, setActivePortId }) => {
    const [tariffs, setTariffs] = useState<Record<string, PortTariffs>>(() => {
        // Precarga con valores de Excel como fallback inicial mientras carga la API
        const init: Record<string, PortTariffs> = {};
        ports.forEach(p => {
            const key = (p.port_id || "").toUpperCase();
            init[p.port_id] = TARIFFS_BY_PORT[key] ? { ...TARIFFS_BY_PORT[key] } : { ...DEFAULT_TARIFFS };
        });
        return init;
    });
    const [apiLoaded, setApiLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    // Cargar coeficientes reales desde port_costs_matrix
    useEffect(() => {
        ForecastService.getPortCostsMatrix(undefined, 'DEFAULT')
            .then((rows: any[]) => {
                if (!rows || rows.length === 0) return;
                const merged: Record<string, PortTariffs> = {};
                ports.forEach(p => {
                    const key = (p.port_id || "").toUpperCase();
                    merged[p.port_id] = TARIFFS_BY_PORT[key] ? { ...TARIFFS_BY_PORT[key] } : { ...DEFAULT_TARIFFS };
                });
                // Sobreescribir con valores reales de la DB
                rows.forEach((row: any) => {
                    const pid = row.port_id;
                    if (!merged[pid]) merged[pid] = { ...DEFAULT_TARIFFS };
                    const fieldMap: Record<string, keyof PortTariffs> = {
                        pilotage: 'pilotage_integral',
                        shifting_surcharges: 'pilotage_surcharge_25',
                        towage_1st: 'towage',
                        linesmen: 'linesmen',
                        port_toll: 'port_toll',
                        lighthouse_national: 'lighthouse_national',
                        lighthouse_foreign: 'lighthouse_foreign',
                        dockage: 'dockage_per_meter_hour',
                        launch_authorities: 'launch_authorities',
                        launch_standby: 'launch_standby_hr',
                        sanitary_inspection: 'sanitary_inspection',
                        clearance: 'clearance',
                        coordinator_board: 'coordinator_board',
                        agency_fee: 'agency_fee',
                        transport_agency: 'transport',
                        comms_agency: 'comms',
                    };
                    const field = fieldMap[row.concept_id];
                    if (field) {
                        (merged[pid] as any)[field] = row.rate_usd ?? row.cost ?? 0;
                    }
                });
                setTariffs(merged);
                setApiLoaded(true);
            })
            .catch(() => setApiLoaded(false));
    }, [ports]);

    const handleSave = async () => {
        setSaving(true);
        setSaveMsg(null);
        try {
            const currentPortId2 = activePortId || (ports[0]?.port_id ?? '');
            const t = tariffs[currentPortId2] ?? DEFAULT_TARIFFS;
            const opType = ports.find(p => p.port_id === currentPortId2);
            const operation = opType?.default_operation || 'CARGA';
            const fieldToConceptMap: Array<[keyof PortTariffs, string, number]> = [
                ['pilotage_integral', 'pilotage', t.pilotage_integral / 2],
                ['pilotage_surcharge_25', 'shifting_surcharges', t.pilotage_surcharge_25],
                ['towage', 'towage_1st', t.towage / 2],
                ['linesmen', 'linesmen', t.linesmen],
                ['port_toll', 'port_toll', t.port_toll / 2],
                ['lighthouse_national', 'lighthouse_national', t.lighthouse_national],
                ['lighthouse_foreign', 'lighthouse_foreign', t.lighthouse_foreign],
                ['dockage_per_meter_hour', 'dockage', t.dockage_per_meter_hour],
                ['launch_authorities', 'launch_authorities', t.launch_authorities],
                ['launch_standby_hr', 'launch_standby', t.launch_standby_hr],
                ['sanitary_inspection', 'sanitary_inspection', t.sanitary_inspection],
                ['clearance', 'clearance', t.clearance],
                ['coordinator_board', 'coordinator_board', t.coordinator_board / 2],
                ['agency_fee', 'agency_fee', t.agency_fee],
                ['transport', 'transport_agency', t.transport],
                ['comms', 'comms_agency', t.comms],
            ];
            const payload = fieldToConceptMap.map(([, concept_id, rate]) => ({
                client_id: 'DEFAULT',
                port_id: currentPortId2,
                terminal: 'GENERAL',
                operation_type: operation,
                vessel_id: 'DEFAULT',
                concept_id,
                cost: 0,
                rate_usd: rate,
                multiplier_source: 'FIXED',
            }));
            await ForecastService.savePortCostsMatrix(payload);
            setSaveMsg('Guardado exitosamente ✓');
            setTimeout(() => setSaveMsg(null), 3000);
        } catch {
            setSaveMsg('Error al guardar ✗');
        } finally {
            setSaving(false);
        }
    };

    const currentPortId = activePortId || (ports[0]?.port_id ?? "");
    const currentPort = ports.find(p => p.port_id === currentPortId);
    const countryCode = (currentPort?.country || "").toUpperCase();
    const countryMeta = COUNTRY_META[countryCode] ?? { flag: "🌐", label: countryCode || "Desconocido", color: "#64748b" };

    const current: PortTariffs = tariffs[currentPortId] ?? { ...DEFAULT_TARIFFS };
    const update = (field: keyof PortTariffs, value: number) =>
        setTariffs(prev => ({ ...prev, [currentPortId]: { ...(prev[currentPortId] ?? DEFAULT_TARIFFS), [field]: value } }));

    return (
        <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">

            {/* ── Tabs de Puertos ── */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 scrollbar-none shrink-0">
                {ports.map(p => (
                    <button key={p.port_id} onClick={() => setActivePortId(p.port_id)}
                        className={`px-6 py-3 font-black text-xs uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                            currentPortId === p.port_id
                                ? "border-blue-600 text-blue-600 bg-white"
                                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                    >
                        <Anchor size={14} />
                        {p.port_name || p.port_id}
                    </button>
                ))}
            </div>

            {/* ── Barra de País + Guardar ── */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{countryMeta.flag}</span>
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: countryMeta.color }}>
                        {countryMeta.label}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                        — Regulación portuaria aplicable a {currentPort?.port_name || currentPortId}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${apiLoaded ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {apiLoaded ? '● DB' : '● Local'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {saveMsg && (
                        <span className={`text-xs font-bold ${saveMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>
                            {saveMsg}
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-xs font-black rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {saving ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <Save size={12} />}
                        Guardar {currentPortId}
                    </button>
                </div>
            </div>

            {/* ── Cuerpo: Inputs y Guía Alineados Horizontalmente ── */}
            <div className="flex flex-col gap-6 p-5 overflow-auto bg-slate-50/50 flex-1">
                {FORMULA_GUIDE.map(section => (
                    <div key={section.section} className="flex flex-col rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                        {/* Cabecera de Sección */}
                        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-200" style={{ backgroundColor: section.color + "15" }}>
                            <span style={{ color: section.color }}>{section.icon}</span>
                            <span className="text-xs font-black uppercase tracking-wider" style={{ color: section.color }}>
                                {section.section}
                            </span>
                        </div>
                        
                        {/* Filas */}
                        <div className="flex flex-col divide-y divide-slate-100">
                            {section.items.map(item => (
                                <div key={item.concept} className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 hover:bg-slate-50 transition-colors">
                                    {/* Columna Input (Izquierda) */}
                                    <div className="lg:w-2/5 p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-4">
                                            <span className="text-xs text-slate-700 font-bold">{item.concept}</span>
                                            {item.tooltip && <span title={item.tooltip} className="text-slate-300 cursor-help text-xs select-none shrink-0">ⓘ</span>}
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                    {item.unit}
                                                </span>
                                            </div>
                                            <input
                                                type="number" value={current[item.field] || 0} step="0.01"
                                                onChange={e => update(item.field, parseFloat(e.target.value) || 0)}
                                                className="w-28 border border-slate-200 rounded-md px-2 py-1.5 text-right text-xs font-mono text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Columna Explicación (Derecha) */}
                                    <div className="lg:w-3/5 p-4 flex flex-col justify-center gap-1.5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-mono font-black text-white px-2 py-0.5 rounded shrink-0 shadow-sm"
                                                style={{ backgroundColor: section.color }}>
                                                {item.formula}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">{item.explanation}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};
