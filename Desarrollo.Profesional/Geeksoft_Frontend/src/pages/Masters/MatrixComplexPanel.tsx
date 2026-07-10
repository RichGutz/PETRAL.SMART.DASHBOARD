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

// ─── Guía explicativa de cómo se usa cada concepto en el cálculo ─────────────
const FORMULA_GUIDE = [
    {
        section: "A) Maniobras (Shifting)",
        color: "#f59e0b",
        items: [
            {
                concept: "Practicaje + Remolcadores + Lancha (Integral)",
                formula: "Tarifa × 2",
                explanation: "Se cobra por maniobra (entrada y salida del buque). Si el puerto usa servicio integral, este valor cubre práctico, remolcadores y lancha de piloto en un solo cobro.",
                unit: "USD / maniobra",
            },
            {
                concept: "Remolcadores / Towage (no integral)",
                formula: "Tarifa × 2",
                explanation: "Cuando el puerto NO ofrece servicio integral, el remolque se cotiza de forma separada por cada maniobra de atraque o desatraque.",
                unit: "USD / maniobra",
            },
            {
                concept: "Amarradores / Linesmen",
                formula: "Tarifa × 1 (o ×2)",
                explanation: "Servicio de amarre y desamarre de cabos en el muelle. Puede cobrarse por servicio completo o por maniobra, según el terminal.",
                unit: "USD / servicio",
            },
            {
                concept: "Port Toll / Cargo de Acceso",
                formula: "Tarifa × 2",
                explanation: "Derecho de acceso a las instalaciones del terminal o del muelle. Se cobra por cada maniobra (entrada y salida).",
                unit: "USD / maniobra",
            },
        ],
    },
    {
        section: "B) Gastos Generales de Puerto",
        color: "#0ea5e9",
        items: [
            {
                concept: "Faro Nacional (Lighthouse Dues)",
                formula: "Tarifa × GRT del Buque",
                explanation: "Tarifa regulada por la APN (Perú), DIRECTEMAR (Chile) o DIGMER (Ecuador). Se aplica cuando el buque procede de un puerto del mismo país. Universal: $0.03 USD/GRT en Perú.",
                unit: "USD / GRT",
            },
            {
                concept: "Faro Extranjero (Lighthouse Dues)",
                formula: "Tarifa × GRT del Buque",
                explanation: "Misma regulación de faro, pero tarifa mayor cuando el buque procede de un puerto de otro país. Universal: $0.12 USD/GRT en Perú.",
                unit: "USD / GRT",
            },
            {
                concept: "Muellaje / Dockage",
                formula: "Tarifa × LOA (metros) × Horas en Puerto",
                explanation: "Cobro por el tiempo que el buque ocupa el berth (posición de atraque). La fórmula multiplica la tarifa por metro de eslora por cada hora de estadía. Confirmado en Ilo y Matarani: $0.65 USD/m·hr.",
                unit: "USD / m · hr",
            },
            {
                concept: "Lancha de Autoridades",
                formula: "Tarifa fija (por llamada)",
                explanation: "Lancha para el transporte de autoridades portuarias (Capitanía, Aduanas, Sanidad) hacia y desde el buque. Generalmente se cobra como tarifa plana fija.",
                unit: "USD / llamada",
            },
            {
                concept: "Lancha Stand-By / Espera",
                formula: "Tarifa × Horas en Puerto",
                explanation: "Servicio de lancha en espera continua durante toda la estadía del buque. Se cobra por hora. Aplicable en Marcona y puertos sin muelle fijo de autoridades.",
                unit: "USD / hora",
            },
            {
                concept: "Inspección Sanitaria",
                formula: "Tarifa fija",
                explanation: "Cobro por la inspección de DIGESA o autoridad sanitaria al arribar y despachar el buque. Tarifa fija por escala.",
                unit: "USD fijo",
            },
            {
                concept: "Clearance In / Out",
                formula: "Tarifa fija",
                explanation: "Gestión de despacho aduanero y migratorio de entrada y salida. Cobro fijo por escala independiente del tonelaje.",
                unit: "USD fijo",
            },
            {
                concept: "Coordinador a Bordo",
                formula: "Tarifa × 2",
                explanation: "Personal de coordinación operativa a bordo del buque durante las maniobras de entrada y salida. Cobro por visita (entrada + salida).",
                unit: "USD / visita",
            },
        ],
    },
    {
        section: "C) Gastos de Agencia",
        color: "#8b5cf6",
        items: [
            {
                concept: "Honorarios de Agencia",
                formula: "Tarifa fija por escala",
                explanation: "Comisión de la agencia marítima local por gestionar toda la operación portuaria: trámites, coordinación con autoridades, provisiones y despacho.",
                unit: "USD / escala",
            },
            {
                concept: "Movilidad",
                formula: "Tarifa fija",
                explanation: "Gastos de transporte del personal de agencia (autoridades, coordinadores, operadores) durante la estadía del buque en el terminal.",
                unit: "USD fijo",
            },
            {
                concept: "Comunicaciones",
                formula: "Tarifa fija",
                explanation: "Gastos de comunicación del agente con el buque, la naviera y las autoridades durante la escala.",
                unit: "USD fijo",
            },
        ],
    },
];

// ─── Sub-componentes ──────────────────────────────────────────────────────────
const TariffRow: React.FC<{
    label: string; unit: string; value: number;
    onChange: (v: number) => void; tooltip?: string;
}> = ({ label, unit, value, onChange, tooltip }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs text-slate-600 font-medium truncate">{label}</span>
            {tooltip && <span title={tooltip} className="text-slate-300 cursor-help text-xs select-none shrink-0">ⓘ</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20 text-right">{unit}</span>
            <input
                type="number" value={value} step="0.01"
                onChange={e => onChange(parseFloat(e.target.value) || 0)}
                className="w-28 border border-slate-200 rounded-md px-2 py-1 text-right text-xs font-mono text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
        </div>
    </div>
);

const Section: React.FC<{ icon: React.ReactNode; title: string; color: string; children: React.ReactNode }> = ({
    icon, title, color, children,
}) => (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: color + "40" }}>
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: color + "15" }}>
            <span style={{ color }}>{icon}</span>
            <span className="text-xs font-black uppercase tracking-wider" style={{ color }}>{title}</span>
        </div>
        <div className="px-4 py-1 bg-white">{children}</div>
    </div>
);

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
        <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

            {/* ── Tabs de Puertos ── */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 scrollbar-none">
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
            <div className="flex items-center justify-between px-5 py-2 border-b border-slate-100 bg-white">
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
                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-xs font-black rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <Save size={12} />}
                        Guardar {currentPortId}
                    </button>
                </div>
            </div>

            {/* ── Cuerpo 1/3 inputs / 2/3 explicación ── */}
            <div className="flex gap-0 overflow-auto divide-x divide-slate-100">

                {/* Columna izquierda (1/3): Formulario de coeficientes */}
                <div className="w-1/3 flex flex-col gap-4 p-5 overflow-auto">

                    <Section icon={<Zap size={14} />} title="A) Maniobras y Shifting" color="#f59e0b">
                        <TariffRow label="Practicaje + Remolcadores + Lancha (Integral por maniobra)" unit="USD / maniobra" value={current.pilotage_integral} onChange={v => update("pilotage_integral", v)} tooltip="×2 (entrada + salida)" />
                        <TariffRow label="Recargo Integral 25% (condiciones climáticas)" unit="USD" value={current.pilotage_surcharge_25} onChange={v => update("pilotage_surcharge_25", v)} />
                        <TariffRow label="Remolcadores / Towage (si NO es servicio integral)" unit="USD / maniobra" value={current.towage} onChange={v => update("towage", v)} tooltip="×2 (entrada + salida)" />
                        <TariffRow label="Amarradores / Linesmen (amarre y desamarre)" unit="USD / servicio" value={current.linesmen} onChange={v => update("linesmen", v)} />
                        <TariffRow label="Port Toll / Terminal Fee / Cargo de Acceso" unit="USD / maniobra" value={current.port_toll} onChange={v => update("port_toll", v)} tooltip="×2 (entrada + salida)" />
                    </Section>

                    <Section icon={<Waves size={14} />} title="B) Gastos Generales de Puerto" color="#0ea5e9">
                        <TariffRow label="Faro Nacional — Lighthouse Dues (Puerto mismo país)" unit="USD / GRT" value={current.lighthouse_national} onChange={v => update("lighthouse_national", v)} tooltip="Tarifa × GRT del buque" />
                        <TariffRow label="Faro Extranjero — Lighthouse Dues (Puerto distinto país)" unit="USD / GRT" value={current.lighthouse_foreign} onChange={v => update("lighthouse_foreign", v)} tooltip="Tarifa × GRT del buque" />
                        <TariffRow label="Muellaje / Dockage (por metro de eslora por hora)" unit="USD / m · hr" value={current.dockage_per_meter_hour} onChange={v => update("dockage_per_meter_hour", v)} tooltip="Tarifa × LOA × Horas en Puerto" />
                        <TariffRow label="Lancha de Autoridades (fija por llamada)" unit="USD / llamada" value={current.launch_authorities} onChange={v => update("launch_authorities", v)} />
                        <TariffRow label="Lancha Stand-By / Espera (por hora de estadía)" unit="USD / hora" value={current.launch_standby_hr} onChange={v => update("launch_standby_hr", v)} tooltip="Tarifa × Horas en Puerto" />
                        <TariffRow label="Inspección Sanitaria (Recepción / Despacho)" unit="USD fijo" value={current.sanitary_inspection} onChange={v => update("sanitary_inspection", v)} />
                        <TariffRow label="Clearance In / Out" unit="USD fijo" value={current.clearance} onChange={v => update("clearance", v)} />
                        <TariffRow label="Coordinador a Bordo (por visita)" unit="USD / visita" value={current.coordinator_board} onChange={v => update("coordinator_board", v)} tooltip="×2 (entrada + salida)" />
                    </Section>

                    <Section icon={<Briefcase size={14} />} title="C) Gastos de Agencia" color="#8b5cf6">
                        <TariffRow label="Honorarios de Agencia Marítima" unit="USD fijo" value={current.agency_fee} onChange={v => update("agency_fee", v)} />
                        <TariffRow label="Movilidad (Autoridades, Coordinador, Personal)" unit="USD fijo" value={current.transport} onChange={v => update("transport", v)} />
                        <TariffRow label="Comunicaciones" unit="USD fijo" value={current.comms} onChange={v => update("comms", v)} />
                    </Section>
                </div>

                {/* Columna derecha (2/3): Guía de cómo se usa cada concepto en el cálculo */}
                <div className="w-2/3 flex flex-col p-5 overflow-auto bg-slate-50 gap-5">

                    {FORMULA_GUIDE.map(section => (
                        <div key={section.section}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: section.color }} />
                                <span className="text-xs font-black uppercase tracking-wider" style={{ color: section.color }}>
                                    {section.section}
                                </span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {section.items.map(item => (
                                    <div key={item.concept} className="bg-white rounded-lg border border-slate-200 px-4 py-3">
                                        <div className="flex items-start justify-between gap-3 mb-1">
                                            <span className="text-xs font-bold text-slate-700">{item.concept}</span>
                                            <span className="text-[10px] font-mono font-black text-white px-2 py-0.5 rounded shrink-0"
                                                style={{ backgroundColor: section.color }}>
                                                {item.formula}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">{item.explanation}</p>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Unidad: {item.unit}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};
