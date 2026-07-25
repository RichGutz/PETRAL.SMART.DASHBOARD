import React, { useState, useEffect } from 'react';
import { ForecastService } from '../../services/api';
import { Save, RefreshCw, FileText } from 'lucide-react';

interface VesselTerminalMatrixProps {
    portId: string;
    terminalId: string;
}


export const VesselTerminalMatrix: React.FC<VesselTerminalMatrixProps> = ({ portId, terminalId }) => {
    const [vessels, setVessels] = useState<any[]>([]);
    const [matrixData, setMatrixData] = useState<any[]>([]);
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);


    const handlePrintPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Por favor, permita las ventanas emergentes para descargar el PDF.');

        const getBadgeHtml = (calcType: string, allowPassThrough: boolean) => {
            if (allowPassThrough) return '<span style="background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700">PASS-THROUGH</span>';
            if (calcType === 'FIXED' || calcType === 'FLAT') return '<span style="background:#e2e8f0;color:#475569;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700">FIJO</span>';
            if (calcType === 'PER_GRT' || calcType === 'VARIABLE_TONS') return '<span style="background:#dbeafe;color:#1e40af;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700">GRT</span>';
            if (calcType === 'PER_LOA_HOUR' || calcType === 'VARIABLE_TIME') return '<span style="background:#f3e8ff;color:#6b21a8;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700">LOAxHR</span>';
            if (calcType === 'PER_HOUR' || calcType === 'PER_MANEUVER') return '<span style="background:#ffedd5;color:#9a3412;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700">TIEMPO</span>';
            return '<span style="background:#e2e8f0;color:#475569;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700">' + calcType + '</span>';
        };

        const now = new Date().toLocaleString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const baseConcepts = ['Ritmo de Carga (MT/hr)', 'Ritmo de Descarga (MT/hr)', 'Tiempo Amarre (Hrs)', 'Tiempo Desamarre (Hrs)', 'Nro de Remolcadores (Tugboats)'];
        let rowsHtml = '<tr><td colspan="4" style="background:#334155;color:white;font-weight:900;font-size:11px;text-transform:uppercase;padding:5px 10px">Estadia y Rendimiento (Base)</td></tr>';
        baseConcepts.forEach((label, i) => {
            const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
            rowsHtml += '<tr style="background:' + bg + '"><td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:600;color:#374151">' + label + '</td><td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;text-align:center"><span style="background:#dcfce7;color:#166534;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700">FISICA</span></td><td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#94a3b8;font-style:italic">Valor base de la operacion</td><td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;min-width:80px"></td></tr>';
        });

        const labelMap: Record<string, string> = { shifting: 'A) Shifting Expenses', general_port: 'B) General Port Expenses', agency: 'C) Agency Expenses' };
        sortedCategories.forEach(([category, catRules]) => {
            const label = labelMap[category.toLowerCase()] || category;
            rowsHtml += '<tr><td colspan="4" style="background:#334155;color:white;font-weight:900;font-size:11px;text-transform:uppercase;padding:5px 10px">' + label + '</td></tr>';
            (catRules as any[]).forEach((rule, i) => {
                const calcType = rule.multiplier_source || 'FIXED';
                const badge = getBadgeHtml(calcType, rule.allow_pass_through);
                const name = rule.sub_item_name || rule.port_cost_concepts?.concept_name || 'Item';
                const formula = rule.calculation_formula_template ? '<em style="color:#6366f1;font-size:9px">' + rule.calculation_formula_template + '</em><br/>' : '';
                const comment = rule.logic_comments || '';
                const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
                rowsHtml += '<tr style="background:' + bg + '"><td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:600;color:#374151">' + name + '</td><td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;text-align:center">' + badge + '</td><td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#4b5563">' + formula + comment + '</td><td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;min-width:80px"></td></tr>';
            });
        });

        const htmlContent = `<!DOCTYPE html><html><head><title>Matriz Tarifaria - ${portId} / ${terminalId}</title><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"><\/script><style>@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');body{font-family:'Outfit',sans-serif;}@media print{@page{size:A4 portrait;margin:12mm 10mm;}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.no-print{display:none!important;}}</style></head><body class="bg-white p-6"><div class="no-print mb-6 p-4 bg-slate-100 rounded-xl flex items-center justify-between border border-slate-200"><span class="text-xs font-bold text-slate-600">Vista previa - Matriz Tarifaria ${portId} / ${terminalId}</span><div class="flex gap-2"><button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg shadow">Imprimir / Guardar PDF</button><button onclick="window.close()" class="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg">Cerrar</button></div></div><div class="max-w-full mx-auto"><div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1e293b;padding-bottom:12px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:12px"><img src="/Logo.Petral.png" alt="Petral" style="height:36px;object-fit:contain" onerror="this.src='https://forecast.geeksoft.tech/Logo.Petral.png'"/><div style="border-left:1px solid #e2e8f0;padding-left:12px"><div style="font-size:9px;font-weight:900;color:#64748b;text-transform:uppercase">MAESTRO DE COSTOS PORTUARIOS</div><div style="font-size:15px;font-weight:900;color:#1e293b;text-transform:uppercase">Matriz Tarifaria - ${portId} / ${terminalId}</div></div></div><div style="text-align:right"><div style="font-size:9px;font-weight:700;color:#94a3b8">FECHA</div><div style="font-size:11px;font-weight:700;color:#475569">${now}</div></div></div><table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1"><thead><tr style="background:#1e293b"><th style="padding:8px 10px;font-size:10px;font-weight:900;text-transform:uppercase;color:white;text-align:left;border:1px solid #334155;width:30%">Concepto / Tarifa</th><th style="padding:8px 10px;font-size:10px;font-weight:900;text-transform:uppercase;color:white;text-align:center;border:1px solid #334155;width:12%">Logica</th><th style="padding:8px 10px;font-size:10px;font-weight:900;text-transform:uppercase;color:white;text-align:left;border:1px solid #334155;width:33%">Formula</th><th style="padding:8px 10px;font-size:10px;font-weight:900;text-transform:uppercase;color:white;text-align:left;border:1px solid #334155;width:25%">Comentarios — Sandra Galvez</th></tr></thead><tbody>${rowsHtml}</tbody></table><div style="margin-top:24px;display:flex;justify-content:space-between;border-top:1px solid #e2e8f0;padding-top:12px;font-size:9px;font-weight:700;color:#94a3b8"><span>© ${new Date().getFullYear()} NAVIERA PETRAL S.A.</span><span>Powered by Geeksoft</span></div></div></body></html>`;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };


    const fetchData = async () => {
        try {
            setLoading(true);
            const [vesselsRes, opsRes, rulesRes] = await Promise.all([
                ForecastService.getVessels(),
                ForecastService.getVesselTerminalOperations(),
                ForecastService.getPortCostsMatrix(portId)
            ]);
            
            const activeVessels = (vesselsRes || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
            setVessels(activeVessels);
            
            const filteredOps = (opsRes || []).filter((op: any) => op.port_id === portId && op.terminal_id === terminalId);
            setMatrixData(filteredOps.map((op: any) => ({
                ...op,
                parameters: op.parameters || {}
            })));

            const filteredRules = (rulesRes || []).filter((r: any) => r.terminal === terminalId);
            
            // Deduplicate rules by concept_id so we don't render CARGA/DESCARGA duplicates in the matrix
            const uniqueRulesMap = new Map();
            filteredRules.forEach((r: any) => {
                if (!uniqueRulesMap.has(r.concept_id)) {
                    uniqueRulesMap.set(r.concept_id, r);
                }
            });
            setRules(Array.from(uniqueRulesMap.values()));
        } catch (error) {
            console.error("Error fetching ops data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (portId && terminalId) {
            fetchData();
        }
    }, [portId, terminalId]);

    const getBaseValue = (vesselId: string, conceptKey: string) => {
        const row = matrixData.find(m => m.vessel_id === vesselId);
        if (row && row[conceptKey] !== undefined && row[conceptKey] !== null && row[conceptKey] !== 0 && row[conceptKey] !== '') {
            return row[conceptKey];
        }
        
        // Si el puerto/terminal tiene motor activo (Perú & Chile), retornamos las Q iniciales del motor
        const cleanPort = (portId || '').toUpperCase();
        const activePortsWithEngines = [
            'CALLAO', 'PE-CAL', 
            'MARCONA', 'SAN_JUAN', 'PE-MAR', 
            'MATARANI', 'PE-MAT', 
            'ILO', 'PE-ILO', 'SPCC_ILO',
            'MEJILLONES', 'INTERACID', 'TERQUIM', 'BARQUITO',
            'CL-MEJ', 'CL-INT', 'CL-TRQ', 'CL-BAR'
        ];
        const hasEngine = activePortsWithEngines.some(p => cleanPort.includes(p));


        if (hasEngine) {
            if (conceptKey === 'ritmo_carga' || conceptKey === 'ritmo_descarga') return 500;
            if (conceptKey === 'amarre_hrs') return 3;
            if (conceptKey === 'desamarre_hrs') return 2;
            if (conceptKey === 'tugboats_in' || conceptKey === 'tugboats_out') return 2;
            if (conceptKey === 'time_to_count_carga_hrs' || conceptKey === 'time_to_count_descarga_hrs') return 6;
            if (conceptKey === 'maneuver_carga_hrs' || conceptKey === 'maneuver_descarga_hrs') return 2;
        }

        // Para cualquier otro terminal sin motor ni data -> COMPLETAMENTE EN BLANCO
        return '';
    };


    const getParamValue = (vesselId: string, conceptId: string) => {
        const row = matrixData.find(m => m.vessel_id === vesselId);
        if (row && row.parameters && row.parameters[conceptId] !== undefined) {
            return row.parameters[conceptId];
        }
        return '';
    };

    const handleBaseChange = (vesselId: string, conceptKey: string, value: string) => {
        const numVal = parseFloat(value) || 0;
        updateMatrixRow(vesselId, { [conceptKey]: numVal });
    };

    const handleParamChange = (vesselId: string, conceptId: string, value: string) => {
        const numVal = value === '' ? '' : parseFloat(value);
        setMatrixData(prev => {
            const existingIdx = prev.findIndex(m => m.vessel_id === vesselId);
            if (existingIdx >= 0) {
                const newData = [...prev];
                const newParams = { ...(newData[existingIdx].parameters || {}) };
                if (numVal === '') {
                    delete newParams[conceptId];
                } else {
                    newParams[conceptId] = numVal;
                }
                newData[existingIdx] = { ...newData[existingIdx], parameters: newParams };
                return newData;
            } else {
                const newRow = createDefaultRow(vesselId);
                newRow.parameters[conceptId] = numVal === '' ? 0 : numVal;
                return [...prev, newRow];
            }
        });
    };

    const createDefaultRow = (vesselId: string) => ({
        port_id: portId,
        terminal_id: terminalId,
        vessel_id: vesselId,
        ritmo_carga: 500,
        ritmo_descarga: 500,
        amarre_hrs: 3.0,
        desamarre_hrs: 2.0,
        time_to_count_carga_hrs: 6.0,
        time_to_count_descarga_hrs: 6.0,
        maneuver_carga_hrs: 2.0,
        maneuver_descarga_hrs: 2.0,
        tugboats_in: 2,
        tugboats_out: 2,
        tugboats_count: 2,
        parameters: {} as Record<string, any>
    });

    const updateMatrixRow = (vesselId: string, updates: any) => {
        setMatrixData(prev => {
            const existingIdx = prev.findIndex(m => m.vessel_id === vesselId);
            if (existingIdx >= 0) {
                const newData = [...prev];
                newData[existingIdx] = { ...newData[existingIdx], ...updates };
                return newData;
            } else {
                return [...prev, { ...createDefaultRow(vesselId), ...updates }];
            }
        });
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const payload = matrixData.map(m => ({
                port_id: m.port_id,
                terminal_id: m.terminal_id,
                vessel_id: m.vessel_id,
                ritmo_carga: Number(m.ritmo_carga) || 0,
                ritmo_descarga: Number(m.ritmo_descarga) || 0,
                amarre_hrs: Number(m.amarre_hrs) || 0,
                desamarre_hrs: Number(m.desamarre_hrs) || 0,
                time_to_count_carga_hrs: Number(m.time_to_count_carga_hrs) || 0,
                time_to_count_descarga_hrs: Number(m.time_to_count_descarga_hrs) || 0,
                maneuver_carga_hrs: Number(m.maneuver_carga_hrs) || 0,
                maneuver_descarga_hrs: Number(m.maneuver_descarga_hrs) || 0,
                tugboats_in: Number(m.tugboats_in) || Number(m.tugboats_count) || 0,
                tugboats_out: Number(m.tugboats_out) || Number(m.tugboats_count) || 0,
                tugboats_count: Number(m.tugboats_in) || Number(m.tugboats_count) || 0,
                parameters: m.parameters || {}
            }));
            
            await ForecastService.saveVesselTerminalOperations(payload);
            alert("Matriz de operaciones guardada exitosamente");
        } catch (error) {
            console.error("Error saving ops matrix", error);
            alert("Error al guardar la matriz");
        } finally {
            setIsSaving(false);
        }
    };

    const baseConcepts = [
        { key: 'ritmo_carga', label: 'Ritmo de Carga (MT/hr)', comment: 'Velocidad neta de bombeo/transferencia de carga por hora' },
        { key: 'ritmo_descarga', label: 'Ritmo de Descarga (MT/hr)', comment: 'Velocidad neta de descarga de producto por hora' },
        { key: 'amarre_hrs', label: 'Tiempo Amarre / Atraque (Hrs)', comment: 'Maniobra desde canal a muelle, amarrado de espías' },
        { key: 'desamarre_hrs', label: 'Tiempo Desamarre / Zarpe (Hrs)', comment: 'Suelta de espías, maniobra de práctico y salida a mar' },
        { key: 'time_to_count_carga_hrs', label: 'Time to Count Carga (Hrs)', comment: 'Tiempo de preparación (mangueras/aduana) previo al Laytime' },
        { key: 'time_to_count_descarga_hrs', label: 'Time to Count Descarga (Hrs)', comment: 'Tiempo de inspección tanques/desglose previo al Laytime' },
        { key: 'maneuver_carga_hrs', label: 'Tiempo Maniobra Carga Extra (Hrs)', comment: 'Horas muertas adicionales por congestión/marejadas/noches' },
        { key: 'maneuver_descarga_hrs', label: 'Tiempo Maniobra Descarga Extra (Hrs)', comment: 'Horas muertas adicionales por congestión/marejadas/noches' },
        { key: 'tugboats_in', label: 'Remolcadores Ingreso (Tugboats IN)', comment: 'Nro remolcadores exigidos por Capitanía para atraque ingreso' },
        { key: 'tugboats_out', label: 'Remolcadores Salida (Tugboats OUT)', comment: 'Nro remolcadores exigidos por Capitanía para zarpe salida' }
    ];


    const groupedRules: Record<string, any[]> = {};
    rules.forEach(rule => {
        // Group by cost concept name or category if available
        const category = rule.port_cost_concepts?.category || 'General Port Expenses';
        if (!groupedRules[category]) groupedRules[category] = [];
        groupedRules[category].push(rule);
    });

    const CATEGORY_MAP: Record<string, { order: number, label: string }> = {
        'shifting': { order: 1, label: 'A) Shifting Expenses' },
        'general_port': { order: 2, label: 'B) General Port Expenses' },
        'agency': { order: 3, label: 'C) Agency Expenses' }
    };

    const sortedCategories = Object.entries(groupedRules).sort((a, b) => {
        const catA = a[0].toLowerCase();
        const catB = b[0].toLowerCase();
        const orderA = CATEGORY_MAP[catA]?.order || 99;
        const orderB = CATEGORY_MAP[catB]?.order || 99;
        return orderA - orderB;
    });

    // Determine calculation badge logic
    const renderCalculationBadge = (calcType: string, allowPassThrough: boolean) => {
        if (allowPassThrough) return <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[10px] font-bold">PASS-THROUGH</span>;
        switch (calcType) {
            case 'FLAT': return <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">AUTOMÁTICO (FIJO)</span>;
            case 'PER_GRT': return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">AUTOMÁTICO (GRT)</span>;
            case 'PER_LOA_HOUR': return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold">FÓRMULA (LOA*HR)</span>;
            case 'PER_HOUR': return <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-[10px] font-bold">FÓRMULA (HORAS)</span>;
            default: return null;
        }
    };

    if (loading) {
        return <div className="p-4 text-center text-slate-500 animate-pulse">Cargando matriz...</div>;
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm mt-4 overflow-hidden">
            <div className="bg-slate-800 p-3 flex justify-between items-center text-white">
                <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                    <RefreshCw size={14} className="text-blue-300" />
                    Matriz Dinámica: Parámetros y Conceptos Tarifarios
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrintPDF}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Imprimir tabla en PDF A4 vertical"
                    >
                        <FileText size={14} />
                        PDF A4
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                        <Save size={14} />
                        {isSaving ? "Guardando..." : "Guardar Matriz"}
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-3 font-bold text-slate-600 uppercase w-64 sticky left-0 bg-slate-50 border-r border-slate-200 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                Concepto Operativo / Tarifa
                            </th>
                            <th className="p-3 font-bold text-slate-600 uppercase w-32 border-r border-slate-200 text-center">
                                Lógica de Cálculo
                            </th>
                            <th className="p-3 font-bold text-slate-600 uppercase w-48 border-r border-slate-200">
                                Comentarios / Lógica
                            </th>
                            {vessels.map(v => (
                                <th key={v.vessel_id} className="p-3 font-bold text-slate-800 text-center min-w-[100px] border-r border-slate-200">
                                    {v.vessel_name || v.vessel_id}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* BASE CONCEPTS */}
                        <tr className="bg-slate-200/80 border-b border-slate-300">
                            <td colSpan={vessels.length + 2} className="px-3 py-2 font-black text-slate-800 text-xs uppercase tracking-wider sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                Estadía y Rendimiento (Base)
                            </td>
                        </tr>
                        {baseConcepts.map((concept, idx) => (
                            <tr key={concept.key} className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50/50' : 'bg-slate-50/50 hover:bg-blue-50/50'}>
                                <td className={`p-2.5 border-b border-r border-slate-200 font-semibold text-slate-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                    <div className="pl-3 border-l-2 border-slate-400">{concept.label}</div>
                                </td>
                                <td className="p-2 border-b border-r border-slate-200 text-center">
                                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">FÍSICA (TIEMPOS)</span>
                                </td>
                                <td className="p-2 border-b border-r border-slate-200 text-[11px] text-slate-500 italic">
                                    {concept.comment}
                                </td>
                                {vessels.map(v => (
                                    <td key={`${concept.key}-${v.vessel_id}`} className="p-1 border-b border-r border-slate-200">
                                        <input 
                                            type="number" 
                                            step="any"
                                            className="w-full text-center p-1.5 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800 bg-transparent hover:bg-white transition-colors"
                                            value={getBaseValue(v.vessel_id, concept.key) === 0 ? '' : getBaseValue(v.vessel_id, concept.key)}
                                            placeholder=""
                                            onChange={(e) => handleBaseChange(v.vessel_id, concept.key, e.target.value)}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}

                        {/* DYNAMIC RULE CONCEPTS BY CATEGORY */}
                        {sortedCategories.map(([category, catRules]) => {
                            const catLower = category.toLowerCase();
                            const displayLabel = CATEGORY_MAP[catLower]?.label || category;
                            return (
                                <React.Fragment key={category}>
                                    <tr className="bg-slate-200/80 border-b border-slate-300">
                                        <td colSpan={vessels.length + 3} className="px-3 py-2 font-black text-slate-800 text-xs uppercase tracking-wider sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                            {displayLabel}
                                        </td>
                                    </tr>
                                    {catRules.map((rule, idx) => {
                                    // Determine if it needs manual quantity
                                    const calcType = rule.calculation_formula_template || rule.multiplier_source || 'FLAT';
                                    const needsInput = rule.allow_pass_through || ['PER_MANEUVER', 'PER_UNIT', 'PER_HOUR', 'PER_CALL'].includes(calcType);
                                    
                                    return (
                                        <tr key={rule.concept_id} className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50/50' : 'bg-slate-50/50 hover:bg-blue-50/50'}>
                                            <td className={`p-2.5 border-b border-r border-slate-200 font-semibold text-slate-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                                <div className="pl-3 border-l-2 border-slate-300">{rule.sub_item_name || rule.port_cost_concepts?.concept_name || 'Item'}</div>
                                            </td>
                                            <td className="p-2 border-b border-r border-slate-200 text-center">
                                                {renderCalculationBadge(calcType, rule.allow_pass_through) || (
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">{calcType}</span>
                                                )}
                                            </td>
                                            <td className="p-2 border-b border-r border-slate-200 text-xs text-slate-600 whitespace-normal">
                                                {rule.logic_comments || <span className="text-slate-400 italic">Sin comentarios</span>}
                                            </td>
                                            {vessels.map(v => (
                                                <td key={`${rule.concept_id}-${v.vessel_id}`} className="p-1 border-b border-r border-slate-200">
                                                    {needsInput ? (
                                                        <input 
                                                            type="number" 
                                                            step="any"
                                                            className="w-full text-center p-1.5 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800 bg-transparent hover:bg-white transition-colors"
                                                            value={getParamValue(v.vessel_id, rule.concept_id)}
                                                            placeholder=""
                                                            onChange={(e) => handleParamChange(v.vessel_id, rule.concept_id, e.target.value)}
                                                        />

                                                    ) : (
                                                        <div className="w-full text-center p-1.5 text-transparent select-none">-</div>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
