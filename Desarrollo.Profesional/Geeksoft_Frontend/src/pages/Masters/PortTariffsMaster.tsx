import React, { useEffect, useState } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { Save, Anchor, Edit2, X } from 'lucide-react';
import { getFormulaGuide } from './MatrixConcepts';

// Helper
const getCountryInfo = (countryStr: string) => {
    if (!countryStr) return { code: 'pe', name: '-', color: '#64748b' };
    const c = countryStr.trim().toUpperCase();
    if (c === 'PE' || c === 'PERU' || c === 'PERÚ') return { code: 'pe', name: 'Perú', color: '#dc2626' };
    if (c === 'CL' || c === 'CHILE') return { code: 'cl', name: 'Chile', color: '#2563eb' };
    if (c === 'EC' || c === 'ECUADOR') return { code: 'ec', name: 'Ecuador', color: '#ca8a04' };
    return { code: countryStr.slice(0, 2).toLowerCase(), name: countryStr, color: '#64748b' };
};

// Helper
interface PortCostRule {
    rule_id?: string;
    localId: string;
    port_id: string;
    terminal: string;
    operation_type: string;
    vessel_id: string;
    concept_id: string;
    cost: number;
    rate_usd: number;
    multiplier_source: string;
    min_limit: number | null;
    max_limit: number | null;
    calculation_formula_template: string | null;
    origin_country: string | null;
    supplier_id: string | null;
    sub_item_name: string | null;
    allow_pass_through: boolean;
    is_optional: boolean;
    isDeleted?: boolean;
}

export const PortTariffsMaster: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    // Masters
    const [ports, setPorts] = useState<any[]>([]);
    const [terminals, setTerminals] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    // Selection State
    const [activePortId, setActivePortId] = useState('');
    const [activeTerminalId, setActiveTerminalId] = useState('GENERAL');

    // Rules State
    const [rules, setRules] = useState<PortCostRule[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<PortCostRule | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [portsData, terminalsData, suppliersData, matrixData] = await Promise.all([
                ForecastService.getPorts(),
                ForecastService.getTerminals(),
                ForecastService.getSuppliers(),
                ForecastService.getPortCostsMatrix()
            ]);

            setPorts(portsData || []);
            setTerminals(terminalsData || []);
            setSuppliers(suppliersData || []);

            const mappedRules: PortCostRule[] = (matrixData || []).map((row: any) => ({
                localId: Math.random().toString(36).substring(7),
                rule_id: row.rule_id,
                port_id: row.port_id,
                terminal: row.terminal || 'GENERAL',
                operation_type: row.operation_type || 'CARGA',
                vessel_id: row.vessel_id || 'DEFAULT',
                concept_id: row.concept_id,
                cost: row.cost || 0,
                rate_usd: row.rate_usd || 0,
                multiplier_source: row.multiplier_source || 'FIXED',
                min_limit: row.min_limit,
                max_limit: row.max_limit,
                calculation_formula_template: row.calculation_formula_template,
                origin_country: row.origin_country,
                supplier_id: row.supplier_id,
                sub_item_name: row.sub_item_name || '',
                allow_pass_through: row.allow_pass_through || false,
                is_optional: row.is_optional || false
            }));
            
            setRules(mappedRules);
            
            if (portsData?.length > 0) {
                // Ordenar países EC, PE, CL
                const cOrder: Record<string, number> = { 'EC': 1, 'PE': 2, 'CL': 3 };
                const uCountries = Array.from(new Set(portsData.map((p: any) => (p.country || "PE").toUpperCase())))
                    .sort((a: any, b: any) => (cOrder[a] || 99) - (cOrder[b] || 99));
                
                if (uCountries.length > 0) {
                    const firstPort = portsData.find((p: any) => (p.country || "PE").toUpperCase() === uCountries[0]);
                    if (firstPort) {
                        setActivePortId(firstPort.port_id);
                    }
                } else {
                    setActivePortId(portsData[0].port_id);
                }
            }
            
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    const currentPort = ports.find(p => p.port_id === activePortId);
    const activeCountry = (currentPort?.country || "PE").toUpperCase();
    
    const countryOrder: Record<string, number> = { 'EC': 1, 'PE': 2, 'CL': 3 };
    const uniqueCountries = Array.from(new Set(ports.map(p => (p.country || "PE").toUpperCase())))
        .sort((a: any, b: any) => (countryOrder[a] || 99) - (countryOrder[b] || 99));

    // Sort ports from North to South (by lat)
    const portsForCountry = ports
        .filter(p => (p.country || "PE").toUpperCase() === activeCountry)
        .sort((a, b) => {
            const latA = a.lat !== undefined && a.lat !== null ? parseFloat(a.lat) : 0;
            const latB = b.lat !== undefined && b.lat !== null ? parseFloat(b.lat) : 0;
            return latB - latA;
        });

    const formulaGuide = getFormulaGuide(activeCountry);
    const flatConcepts = formulaGuide.flatMap(s => s.items);

    const availableTerminals = terminals.filter(t => t.port_id === activePortId);
    
    const handleCountryClick = (countryCode: string) => {
        const firstPort = ports.find(p => (p.country || "PE").toUpperCase() === countryCode);
        if (firstPort) {
            setActivePortId(firstPort.port_id);
        }
    };
    
    useEffect(() => {
        if (availableTerminals.length > 0) {
            if (!availableTerminals.find(t => t.terminal_id === activeTerminalId)) {
                setActiveTerminalId(availableTerminals[0].terminal_id);
            }
        } else {
            setActiveTerminalId('GENERAL');
        }
    }, [activePortId, availableTerminals, activeTerminalId]);

    const activeTerminalRules = rules.filter(r => 
        r.port_id === activePortId && 
        (r.terminal === activeTerminalId || r.terminal === 'GENERAL' || activeTerminalId === 'GENERAL') && 
        !r.isDeleted &&
        (Boolean(r.sub_item_name) || Number(r.rate_usd) > 0)
    );

    // --- MODAL LOGIC ---
    const handleOpenEditModal = (rule: PortCostRule) => {
        setEditingRule({ ...rule });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRule(null);
    };

    const handleSaveModal = () => {
        if (!editingRule) return;

        if (editingRule.localId.startsWith('new_')) {
            setRules(prev => [...prev, editingRule]);
        } else {
            setRules(prev => prev.map(r => r.localId === editingRule.localId ? editingRule : r));
        }
        handleCloseModal();
    };

    const handleUpdateEditingRule = (field: keyof PortCostRule, value: any) => {
        if (editingRule) {
            setEditingRule({ ...editingRule, [field]: value });
        }
    };

    // --- SAVE LOGIC ---
    const handleSaveAll = async () => {
        setSaving(true);
        setSaveMsg(null);
        try {
            const deletedRules = rules.filter(r => r.isDeleted && r.rule_id);
            for (const r of deletedRules) {
                await ForecastService.deletePortCostRule(r.rule_id!);
            }

            const payloadToSave = rules.filter(r => !r.isDeleted).map(r => ({
                rule_id: r.rule_id,
                port_id: r.port_id,
                terminal: r.terminal,
                operation_type: r.operation_type,
                vessel_id: r.vessel_id,
                concept_id: r.concept_id,
                cost: r.cost,
                rate_usd: r.rate_usd,
                multiplier_source: r.multiplier_source,
                min_limit: r.min_limit,
                max_limit: r.max_limit,
                calculation_formula_template: r.calculation_formula_template,
                origin_country: r.origin_country,
                supplier_id: r.supplier_id || null,
                sub_item_name: r.sub_item_name,
                allow_pass_through: r.allow_pass_through,
                is_optional: r.is_optional
            }));
            
            await ForecastService.savePortCostsMatrix(payloadToSave);
            setSaveMsg("Tarifas guardadas correctamente");
            await fetchData();
            
        } catch (error) {
            console.error(error);
            setSaveMsg("Error al guardar");
        }
        setSaving(false);
        setTimeout(() => setSaveMsg(null), 3000);
    };

    // Helpers UI
    const getConceptName = (conceptId: string) => {
        const item = flatConcepts.find(c => c.field === conceptId);
        return item ? item.concept : conceptId;
    };

    const getSupplierName = (supplierId: string | null) => {
        if (!supplierId) return <span className="text-slate-400 italic">No asignado</span>;
        const sup = suppliers.find(s => s.supplier_id === supplierId);
        return sup ? sup.supplier_name : supplierId;
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando Maestro de Tarifas...</div>;

    return (
        <MasterTemplate
            title="Maestro de Tarifas Portuarias"
            subtitle="Configuración Dinámica de Motor de Reglas Portuarias"
        >
            <div className="flex flex-col h-full bg-slate-50 rounded-xl overflow-hidden shadow-sm border border-slate-200 relative">
                
                {/* 1. NAVEGACIÓN (PAÍS -> PUERTO -> TERMINAL) */}
                <div className="bg-white border-b border-slate-200 flex flex-col z-10 relative">
                    <div className="flex overflow-x-auto border-b border-slate-200 bg-white scrollbar-none shrink-0 items-center">
                        {uniqueCountries.map(countryCode => {
                            const meta = getCountryInfo(countryCode);
                            const isActive = activeCountry === countryCode;
                            return (
                                <button
                                    key={countryCode}
                                    onClick={() => handleCountryClick(countryCode)}
                                    className={`px-6 py-3 font-black text-xs uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                                        isActive ? "bg-slate-50 border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                    }`}
                                >
                                    <img src={`https://flagcdn.com/16x12/${meta.code}.png`} alt={meta.name} className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-200" />
                                    {meta.name}
                                </button>
                            );
                        })}
                        
                        <div className="ml-auto flex items-center pr-4">
                            {saveMsg && (
                                <span className="mr-4 text-green-600 text-sm font-medium">{saveMsg}</span>
                            )}
                            <button 
                                onClick={handleSaveAll}
                                disabled={saving}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md font-medium transition-colors text-sm shadow-sm"
                            >
                                <Save size={16} />
                                {saving ? 'Guardando...' : 'Guardar Todo'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 scrollbar-none">
                        {portsForCountry.map((p: any) => (
                            <button
                                key={p.port_id}
                                onClick={() => setActivePortId(p.port_id)}
                                className={`px-6 py-2.5 font-black text-[11px] uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                                    activePortId === p.port_id ? 'border-slate-800 text-slate-800 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                }`}
                            >
                                <Anchor size={12} />
                                {p.name || p.port_name || p.port_id}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex overflow-x-auto px-6 py-2.5 gap-2 bg-slate-50 items-center border-b border-slate-200 shadow-sm">
                        <span className="text-xs font-bold text-slate-400 uppercase mr-2 tracking-wider">TERMINALES:</span>
                        {availableTerminals.length === 0 ? (
                            <button
                                onClick={() => setActiveTerminalId('GENERAL')}
                                className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-full transition-colors border ${
                                    activeTerminalId === 'GENERAL'
                                        ? 'bg-slate-800 text-white border-slate-800'
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                GENERAL
                            </button>
                        ) : (
                            availableTerminals.map((t: any) => (
                                <button
                                    key={t.terminal_id}
                                    onClick={() => setActiveTerminalId(t.terminal_id)}
                                    className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-full transition-colors border whitespace-nowrap ${
                                        activeTerminalId === t.terminal_id
                                            ? 'bg-slate-800 text-white border-slate-800'
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    {t.terminal_name}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* MAIN CONTENT (FULL WIDTH) */}
                <div className="flex-1 bg-slate-50/50 p-6 overflow-y-auto z-0">
                    <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div>
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                ⚓ Matriz Oficial de Tarifas Portuarias — {activePortId} ({activeTerminalId})
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">Conceptos oficiales y reglas matemáticas registradas para el terminal</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                                Total Ítems: {activeTerminalRules.length}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-black border-b border-slate-700">
                                    <th className="p-3.5 w-1/4">Ítem / Servicio ({activePortId})</th>
                                    <th className="p-3.5 w-1/6">Proveedor / Agencia</th>
                                    <th className="p-3.5 text-right w-36">Tarifa Base (USD)</th>
                                    <th className="p-3.5 w-2/5">Fórmula / Regla de Cálculo al Lado</th>
                                    <th className="p-3.5 text-center w-24">Propiedades</th>
                                    <th className="p-3.5 text-center w-16">Editar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeTerminalRules.length === 0 ? (
                                    <tr className="bg-white">
                                        <td colSpan={6} className="text-center py-16 text-slate-400 font-medium text-xs italic">
                                            ⚓ Sin tarifas ni reglas registradas para {activePortId} ({activeTerminalId})
                                        </td>
                                    </tr>
                                ) : (
                                    (() => {
                                        const getCategoryForConcept = (conceptId: string): string => {
                                            const cid = (conceptId || '').toLowerCase();
                                            if ([
                                                'pilotage_in', 'pilotage_out', 'towage_in', 'towage_out', 'access_berth', 
                                                'pilot_tug_integral', 'overtime_psa_25', 'overtime_psa_50', 'access_berth_tisur', 
                                                'linesmen', 'terminal_fee', 'maniobras', 'remolcadores',
                                                'integral_spcc', 'pilotage_marcona', 'linesmen_marcona', 'towage_marcona',
                                                'pilotage_ilo', 'linesmen_ilo', 'dockage_spcc', 'towage_psa_ilo', 'towage_pos_psa',
                                                'towage_petranso_ilo', 'towage_pos_petranso', 'overtime_towage_psa', 'overtime_towage_petranso'
                                            ].includes(cid)) {
                                                return 'shifting';
                                            }
                                            if ([
                                                'lighthouse_dues', 'dockage_apm', 'dockage_tisur', 'launch_hire', 'launch_authorities', 
                                                'coordinator', 'clearance', 'sanitary', 'sanitary_matarani', 'sanitary_marcona', 'launch_standby',
                                                'coordinator_ilo', 'sanitary_ilo', 'launch_authorities_ilo', 'launch_coordinator', 'launch_mooring_ilo', 'launch_pos_ilo',
                                                'lanchas', 'turnos_coordinador', 'sanitary_qty'
                                            ].includes(cid)) {
                                                return 'general_port';
                                            }
                                            if ([
                                                'agency_fee', 'transportation', 'comunication', 'agency_qty', 'transport_qty', 'comms_qty',
                                                'agency_fee_ilo', 'comunication_ilo'
                                            ].includes(cid)) {
                                                return 'agency';
                                            }
                                            return 'general_port';
                                        };

                                        const sections = [
                                            { key: 'shifting', label: 'A) SHIFTING EXPENSES', bg: 'bg-blue-900 text-blue-50 border-blue-800' },
                                            { key: 'general_port', label: 'B) GENERAL PORT EXPENSES', bg: 'bg-emerald-900 text-emerald-50 border-emerald-800' },
                                            { key: 'agency', label: 'C) AGENCY EXPENSES', bg: 'bg-purple-900 text-purple-50 border-purple-800' }
                                        ];

                                        return sections.map(sec => {
                                            const secRules = activeTerminalRules.filter(r => getCategoryForConcept(r.concept_id) === sec.key);

                                            if (secRules.length === 0) return null;

                                            return (
                                                <React.Fragment key={sec.key}>
                                                    {/* Sub-Cabecera de Sección (Idéntica al Excel) */}
                                                    <tr className={`${sec.bg} border-y font-black text-xs uppercase tracking-wider`}>
                                                        <td colSpan={6} className="px-4 py-2 font-black text-xs">
                                                            {sec.label}
                                                        </td>
                                                    </tr>

                                                    {secRules.map((rule, idx) => (
                                                        <tr key={rule.localId} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50 transition-colors' : 'bg-slate-50/50 hover:bg-slate-100/50 transition-colors'}>
                                                            <td className="p-3.5 font-bold text-slate-800 text-xs">
                                                                <div className="text-slate-900 font-bold text-sm">{rule.sub_item_name || getConceptName(rule.concept_id)}</div>
                                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{rule.concept_id}</div>
                                                            </td>
                                                            <td className="p-3.5 text-slate-700 text-xs font-semibold">
                                                                {getSupplierName(rule.supplier_id)}
                                                            </td>
                                                            <td className="p-3.5 text-right font-mono font-black text-indigo-700 text-base">
                                                                ${Number(rule.rate_usd || 0).toFixed(2)}
                                                            </td>
                                                            <td className="p-3.5 text-xs font-semibold text-slate-700 bg-white rounded-lg border border-slate-200">
                                                                {rule.calculation_formula_template ? (
                                                                    <span className="text-indigo-700 font-mono text-xs font-bold">{rule.calculation_formula_template}</span>
                                                                ) : (
                                                                    <span className="text-slate-500 font-mono text-xs">{rule.multiplier_source}</span>
                                                                )}
                                                            </td>
                                                            <td className="p-3.5 text-center">
                                                                <div className="flex justify-center gap-2">
                                                                    {rule.allow_pass_through && (
                                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md border border-amber-200" title="Pass Through (Cobrado al cliente)">PT</span>
                                                                    )}
                                                                    {rule.is_optional && (
                                                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md border border-purple-200" title="Opcional">OPC</span>
                                                                    )}
                                                                    {!rule.allow_pass_through && !rule.is_optional && (
                                                                        <span className="text-slate-300">-</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-3.5 text-center">
                                                                <button onClick={() => handleOpenEditModal(rule)} className="text-slate-400 hover:text-indigo-600 transition-colors p-1" title="Editar Regla">
                                                                    <Edit2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        });
                                    })()
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- MODAL OVERLAY --- */}
                {isModalOpen && editingRule && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                            
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg">
                                        {editingRule.localId.startsWith('new_') ? 'Agregar Nuevo Sub-Costo' : 'Editar Sub-Costo'}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Terminal: {editingRule.terminal} ({editingRule.port_id})</p>
                                </div>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            {/* Modal Body */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white">
                                
                                {/* Concept Select */}
                                <div className="flex flex-col md:col-span-2">
                                    <label className="text-xs font-bold text-slate-600 mb-1.5">Servicio / Concepto <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800"
                                        value={editingRule.concept_id}
                                        onChange={e => handleUpdateEditingRule('concept_id', e.target.value)}
                                    >
                                        {flatConcepts.map(c => (
                                            <option key={c.field} value={c.field}>{c.concept}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sub-Item Name */}
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-slate-600 mb-1.5">Nombre Interno / Sub-Ítem</label>
                                    <input 
                                        type="text"
                                        placeholder="Ej: Stand By / Navegación"
                                        className="w-full bg-white border border-slate-200 text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={editingRule.sub_item_name || ''}
                                        onChange={e => handleUpdateEditingRule('sub_item_name', e.target.value)}
                                    />
                                </div>

                                {/* Supplier */}
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-slate-600 mb-1.5">Proveedor Específico</label>
                                    <select
                                        className="w-full bg-white border border-slate-200 text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={editingRule.supplier_id || ''}
                                        onChange={e => handleUpdateEditingRule('supplier_id', e.target.value)}
                                    >
                                        <option value="">-- Cualquiera / Sin Asignar --</option>
                                        {suppliers.map(s => (
                                            <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Multiplier Source */}
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-indigo-600 mb-1.5">Fórmula de Cálculo <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full bg-indigo-50/50 border border-indigo-200 text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-indigo-900"
                                        value={editingRule.multiplier_source}
                                        onChange={e => handleUpdateEditingRule('multiplier_source', e.target.value)}
                                    >
                                        <option value="FIXED">Tarifa Fija (Flat)</option>
                                        <option value="PER_GRT">Por GRT (Tonelaje)</option>
                                        <option value="PER_HOUR">Por Hora de Operación</option>
                                        <option value="PER_LOA_HOUR">Por Eslora × Hora</option>
                                        <option value="AGENCY_MANUAL">Ingreso Manual (Desconocido)</option>
                                        <option value="PER_MANEUVER">Por Maniobra</option>
                                        <option value="PER_TUG">Por Remolcador</option>
                                    </select>
                                </div>

                                {/* Base Rate */}
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-indigo-600 mb-1.5">Tarifa (USD) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                                        <input 
                                            type="number" step="0.01"
                                            className="w-full bg-white border border-indigo-200 text-sm rounded-xl pl-8 p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-black text-slate-800"
                                            value={editingRule.rate_usd || ''}
                                            onChange={e => handleUpdateEditingRule('rate_usd', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="md:col-span-2 flex flex-col sm:flex-row gap-6 pt-4 border-t border-slate-100 mt-2">
                                    <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 transition-colors flex-1">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                                            checked={editingRule.allow_pass_through}
                                            onChange={e => handleUpdateEditingRule('allow_pass_through', e.target.checked)}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                                                Pass-Through
                                            </span>
                                            <span className="text-[10px] text-slate-500">Costo trasladado directamente al cliente final.</span>
                                        </div>
                                    </label>
                                    
                                    <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 transition-colors flex-1">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 text-amber-500 border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                                            checked={editingRule.is_optional}
                                            onChange={e => handleUpdateEditingRule('is_optional', e.target.checked)}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 group-hover:text-amber-600 transition-colors">
                                                Servicio Opcional
                                            </span>
                                            <span className="text-[10px] text-slate-500">Solo se cobra si la nave lo requiere (Ej: Lancha extra).</span>
                                        </div>
                                    </label>
                                </div>

                            </div>

                            {/* Modal Footer */}
                            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                <button 
                                    onClick={handleCloseModal} 
                                    className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSaveModal} 
                                    className="px-6 py-2.5 bg-slate-800 hover:bg-black text-white rounded-xl text-sm font-bold transition-colors shadow-md"
                                >
                                    Aceptar y Aplicar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MasterTemplate>
    );
};
