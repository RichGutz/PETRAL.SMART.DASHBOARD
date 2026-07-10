import React, { useState } from "react";
import { Anchor, Waves, Zap, Briefcase, Info } from "lucide-react";

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

const TariffRow: React.FC<{
    label: string; unit: string; value: number;
    onChange: (v: number) => void; tooltip?: string;
}> = ({ label, unit, value, onChange, tooltip }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 group">
        <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs text-slate-600 font-medium truncate">{label}</span>
            {tooltip && (
                <span title={tooltip} className="text-slate-300 cursor-help text-xs select-none">ⓘ</span>
            )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24 text-right">{unit}</span>
            <input
                type="number" value={value} step="0.01"
                onChange={e => onChange(parseFloat(e.target.value) || 0)}
                className="w-28 border border-slate-200 rounded-md px-2 py-1 text-right text-xs font-mono text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
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

interface MatrixComplexPanelProps {
    ports: any[];
    activePortId: string;
    setActivePortId: (id: string) => void;
}

export const MatrixComplexPanel: React.FC<MatrixComplexPanelProps> = ({ ports, activePortId, setActivePortId }) => {
    const [tariffs, setTariffs] = useState<Record<string, PortTariffs>>(() => {
        const init: Record<string, PortTariffs> = {};
        ports.forEach(p => {
            const key = (p.port_id || "").toUpperCase();
            init[p.port_id] = TARIFFS_BY_PORT[key] ? { ...TARIFFS_BY_PORT[key] } : { ...DEFAULT_TARIFFS };
        });
        return init;
    });

    const currentPortId = activePortId || (ports[0]?.port_id ?? "");
    const current: PortTariffs = tariffs[currentPortId] ?? { ...DEFAULT_TARIFFS };
    const update = (field: keyof PortTariffs, value: number) =>
        setTariffs(prev => ({ ...prev, [currentPortId]: { ...(prev[currentPortId] ?? DEFAULT_TARIFFS), [field]: value } }));

    // Vista previa (B/T Moquegua: LOA=134.16, GRT=8259, Carga=13500 MT, Ritmo=500 MT/hr)
    const portHours = (13500 / 500) + 3 + 2;
    const calcFaro = current.lighthouse_national * 8259;
    const calcMuellaje = current.dockage_per_meter_hour * 134.16 * portHours;
    const calcShifting = current.pilotage_integral > 0
        ? (current.pilotage_integral * 2) + current.linesmen + (current.port_toll * 2)
        : (current.towage * 2) + (current.linesmen * 2) + (current.port_toll * 2);
    const calcAgencia = current.agency_fee + current.transport + current.comms;
    const calcLaunchOtros = (current.launch_standby_hr > 0 ? current.launch_standby_hr * portHours : current.launch_authorities)
        + current.sanitary_inspection + current.clearance + (current.coordinator_board * 2);
    const totalEstimado = calcFaro + calcMuellaje + calcShifting + calcAgencia + calcLaunchOtros;

    return (
        <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Tabs de Puertos */}
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

            {/* Cuerpo en dos columnas */}
            <div className="flex gap-6 p-5 overflow-auto">
                {/* Columna izquierda: Formularios */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-blue-700">Coeficientes de Tarifas Portuarias — {currentPortId}</p>
                            <p className="text-xs text-blue-600 mt-0.5">
                                Valores precargados desde Exceles de costos SPCC (Paola). Las tarifas de Faro (APN) son universales
                                para todos los puertos peruanos. El motor los multiplicará por LOA, GRT y Horas de Puerto al cotizar.
                            </p>
                        </div>
                    </div>

                    <Section icon={<Zap size={14} />} title="A) Maniobras y Shifting" color="#f59e0b">
                        <TariffRow label="Practicaje + Remolcadores + Lancha (Integral por maniobra)" unit="USD / maniobra" value={current.pilotage_integral} onChange={v => update("pilotage_integral", v)} tooltip="Se multiplica ×2 (entrada + salida)" />
                        <TariffRow label="Recargo Integral 25% (condiciones climáticas)" unit="USD" value={current.pilotage_surcharge_25} onChange={v => update("pilotage_surcharge_25", v)} />
                        <TariffRow label="Remolcadores / Towage (si NO es servicio integral)" unit="USD / maniobra" value={current.towage} onChange={v => update("towage", v)} tooltip="Se multiplica ×2 (entrada + salida)" />
                        <TariffRow label="Amarradores / Linesmen (amarre y desamarre)" unit="USD / servicio" value={current.linesmen} onChange={v => update("linesmen", v)} />
                        <TariffRow label="Port Toll / Terminal Fee / Cargo de Acceso" unit="USD / maniobra" value={current.port_toll} onChange={v => update("port_toll", v)} tooltip="Se multiplica ×2 (entrada + salida)" />
                    </Section>

                    <Section icon={<Waves size={14} />} title="B) Gastos Generales de Puerto" color="#0ea5e9">
                        <TariffRow label="Faro Nacional — Lighthouse Dues (Puerto Peruano)" unit="USD / GRT" value={current.lighthouse_national} onChange={v => update("lighthouse_national", v)} tooltip="APN: Tarifa × GRT del buque" />
                        <TariffRow label="Faro Extranjero — Lighthouse Dues (Puerto Externo)" unit="USD / GRT" value={current.lighthouse_foreign} onChange={v => update("lighthouse_foreign", v)} tooltip="APN: Tarifa × GRT del buque" />
                        <TariffRow label="Muellaje / Dockage (por metro de eslora por hora)" unit="USD / m · hr" value={current.dockage_per_meter_hour} onChange={v => update("dockage_per_meter_hour", v)} tooltip="Fórmula: Tarifa × LOA (m) × Horas en Puerto" />
                        <TariffRow label="Lancha de Autoridades (fija por llamada)" unit="USD / llamada" value={current.launch_authorities} onChange={v => update("launch_authorities", v)} />
                        <TariffRow label="Lancha Stand-By / Espera (por hora de estadía)" unit="USD / hora" value={current.launch_standby_hr} onChange={v => update("launch_standby_hr", v)} tooltip="Fórmula: Tarifa × Horas en Puerto" />
                        <TariffRow label="Inspección Sanitaria (Recepción / Despacho)" unit="USD fijo" value={current.sanitary_inspection} onChange={v => update("sanitary_inspection", v)} />
                        <TariffRow label="Clearance In / Out" unit="USD fijo" value={current.clearance} onChange={v => update("clearance", v)} />
                        <TariffRow label="Coordinador a Bordo (por visita)" unit="USD / visita" value={current.coordinator_board} onChange={v => update("coordinator_board", v)} tooltip="Se multiplica ×2 (entrada + salida)" />
                    </Section>

                    <Section icon={<Briefcase size={14} />} title="C) Gastos de Agencia" color="#8b5cf6">
                        <TariffRow label="Honorarios de Agencia Marítima" unit="USD fijo" value={current.agency_fee} onChange={v => update("agency_fee", v)} />
                        <TariffRow label="Movilidad (Autoridades, Coordinador, Personal)" unit="USD fijo" value={current.transport} onChange={v => update("transport", v)} />
                        <TariffRow label="Comunicaciones" unit="USD fijo" value={current.comms} onChange={v => update("comms", v)} />
                    </Section>
                </div>

                {/* Columna derecha: Vista previa del cálculo */}
                <div className="w-72 shrink-0 flex flex-col gap-4">
                    <div className="rounded-xl border border-slate-200 overflow-hidden sticky top-0">
                        <div className="bg-slate-700 px-4 py-3">
                            <p className="text-white font-black text-xs uppercase tracking-wider">Vista Previa del Cálculo</p>
                            <p className="text-slate-400 text-[10px] mt-0.5">
                                B/T Moquegua · LOA: 134.16 m · GRT: 8,259 · 13,500 MT · 500 MT/hr
                            </p>
                        </div>
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Horas en Puerto estimadas</span>
                                <span className="text-xs font-mono font-bold text-slate-700">{portHours.toFixed(1)} hrs</span>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-white flex flex-col gap-0.5">
                            {[
                                { label: "A) Maniobras (Shifting)", value: calcShifting, color: "#f59e0b" },
                                { label: "B.1) Derecho de Faro", value: calcFaro, color: "#0ea5e9" },
                                { label: "B.2) Muellaje", value: calcMuellaje, color: "#0ea5e9" },
                                { label: "B.3) Lanchas + Inspecciones", value: calcLaunchOtros - current.sanitary_inspection - current.clearance - current.coordinator_board * 2, color: "#0ea5e9" },
                                { label: "B.4) Sanitaria + Clearance + Coord.", value: current.sanitary_inspection + current.clearance + current.coordinator_board * 2, color: "#0ea5e9" },
                                { label: "C) Agencia", value: calcAgencia, color: "#8b5cf6" },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: item.color }} />
                                        {item.label}
                                    </span>
                                    <span className="text-xs font-mono text-slate-700 ml-2 shrink-0">
                                        ${item.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-700 px-4 py-3 flex justify-between items-center">
                            <span className="text-white text-xs font-black uppercase tracking-wider">TOTAL ESTIMADO</span>
                            <span className="text-green-400 font-mono font-black text-sm">
                                ${totalEstimado.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="bg-amber-50 border-t border-amber-100 px-4 py-2.5">
                            <p className="text-amber-700 text-[10px] font-semibold text-center">
                                ⚠️ Vista previa con parámetros de ejemplo · Aún no conectado al backend
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
