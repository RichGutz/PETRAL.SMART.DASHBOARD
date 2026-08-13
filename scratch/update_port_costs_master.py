path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\pages\Masters\PortCostsMaster_V2.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update initial state defaults
content = content.replace(
    "CARGA: { MAIN: 0, loading_master: 0, other: 0 }",
    "CARGA: { MAIN: 0, loading_master: 0, muellaje: 0, other: 0 }"
)
content = content.replace(
    "DESCARGA: { MAIN: 0, loading_master: 0, other: 0 }",
    "DESCARGA: { MAIN: 0, loading_master: 0, muellaje: 0, other: 0 }"
)

# 2. Update subOps array in handleSaveGlobal
content = content.replace(
    "const subOps = ['MAIN', 'loading_master', 'other'];",
    "const subOps = ['MAIN', 'loading_master', 'muellaje', 'other'];"
)

# 3. Update export rows
export_old = """                const cMain = data.CARGA?.MAIN || 0;
                const cLm = data.CARGA?.loading_master || 0;
                const cOther = data.CARGA?.other || 0;
                const cTotal = cMain + cLm + cOther;

                rows.push({
                    country: portCountry,
                    port_id: portId,
                    port_name: portName,
                    client_name: 'PETRAL',
                    vessel_id: vesselId,
                    vessel_name: vesselName,
                    operation: 'Carga',
                    main_cost: cMain,
                    lm_cost: cLm,
                    other_cost: cOther,
                    total_cost: cTotal
                });

                // Fila Operación DESCARGA
                const dMain = data.DESCARGA?.MAIN || 0;
                const dLm = data.DESCARGA?.loading_master || 0;
                const dOther = data.DESCARGA?.other || 0;
                const dTotal = dMain + dLm + dOther;

                rows.push({
                    country: portCountry,
                    port_id: portId,
                    port_name: portName,
                    client_name: 'PETRAL',
                    vessel_id: vesselId,
                    vessel_name: vesselName,
                    operation: 'Descarga',
                    main_cost: dMain,
                    lm_cost: dLm,
                    other_cost: dOther,
                    total_cost: dTotal
                });"""

export_new = """                const cMain = data.CARGA?.MAIN || 0;
                const cLm = data.CARGA?.loading_master || 0;
                const cMuellaje = data.CARGA?.muellaje || 0;
                const cOther = data.CARGA?.other || 0;
                const cTotal = cMain + cLm + cMuellaje + cOther;

                rows.push({
                    country: portCountry,
                    port_id: portId,
                    port_name: portName,
                    client_name: 'PETRAL',
                    vessel_id: vesselId,
                    vessel_name: vesselName,
                    operation: 'Carga',
                    main_cost: cMain,
                    lm_cost: cLm,
                    muellaje_cost: cMuellaje,
                    other_cost: cOther,
                    total_cost: cTotal
                });

                // Fila Operación DESCARGA
                const dMain = data.DESCARGA?.MAIN || 0;
                const dLm = data.DESCARGA?.loading_master || 0;
                const dMuellaje = data.DESCARGA?.muellaje || 0;
                const dOther = data.DESCARGA?.other || 0;
                const dTotal = dMain + dLm + dMuellaje + dOther;

                rows.push({
                    country: portCountry,
                    port_id: portId,
                    port_name: portName,
                    client_name: 'PETRAL',
                    vessel_id: vesselId,
                    vessel_name: vesselName,
                    operation: 'Descarga',
                    main_cost: dMain,
                    lm_cost: dLm,
                    muellaje_cost: dMuellaje,
                    other_cost: dOther,
                    total_cost: dTotal
                });"""

content = content.replace(export_old, export_new)

# 4. Update exportColumns
export_cols_old = """    const exportColumns: ExportColumn[] = [
        { header: 'País', key: 'country', type: 'string' },
        { header: 'ID Puerto', key: 'port_id', type: 'string' },
        { header: 'Puerto', key: 'port_name', type: 'string' },
        { header: 'ID Buque', key: 'vessel_id', type: 'string' },
        { header: 'Buque', key: 'vessel_name', type: 'string' },
        { header: 'Operación', key: 'operation', type: 'string' },
        { header: 'Costo Agencia (USD)', key: 'main_cost', type: 'currency' },
        { header: 'Loading Master (USD)', key: 'lm_cost', type: 'currency' },
        { header: 'Otros Costos (USD)', key: 'other_cost', type: 'currency' },
        { header: 'Costo Total (USD)', key: 'total_cost', type: 'currency' }
    ];"""

export_cols_new = """    const exportColumns: ExportColumn[] = [
        { header: 'País', key: 'country', type: 'string' },
        { header: 'ID Puerto', key: 'port_id', type: 'string' },
        { header: 'Puerto', key: 'port_name', type: 'string' },
        { header: 'ID Buque', key: 'vessel_id', type: 'string' },
        { header: 'Buque', key: 'vessel_name', type: 'string' },
        { header: 'Operación', key: 'operation', type: 'string' },
        { header: 'Costo Agencia (USD)', key: 'main_cost', type: 'currency' },
        { header: 'Loading Master (USD)', key: 'lm_cost', type: 'currency' },
        { header: 'Muellaje (USD)', key: 'muellaje_cost', type: 'currency' },
        { header: 'Otros Costos (USD)', key: 'other_cost', type: 'currency' },
        { header: 'Costo Total (USD)', key: 'total_cost', type: 'currency' }
    ];"""

content = content.replace(export_cols_old, export_cols_new)

# 5. Update Carga JSX card block
carga_old = """                                                        {/* Operación CARGA */}
                                                        <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                            <div className="text-[11px] font-black text-blue-700 uppercase tracking-wider flex items-center justify-between">
                                                                <span>Carga</span>
                                                                <span className="text-[10px] text-slate-400 font-bold">
                                                                    Total: ${( (vData.CARGA?.MAIN || 0) + (vData.CARGA?.loading_master || 0) + (vData.CARGA?.other || 0) ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Agencia</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-CARGA-MAIN` ? (vData.CARGA?.MAIN ?? '') : formatCostValue(vData.CARGA?.MAIN)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-CARGA-MAIN`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'CARGA', 'MAIN', e.target.value)}
                                                                        className="w-full text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Load Master</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-CARGA-lm` ? (vData.CARGA?.loading_master ?? '') : formatCostValue(vData.CARGA?.loading_master)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-CARGA-lm`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'CARGA', 'loading_master', e.target.value)}
                                                                        className="w-full text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Otros</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-CARGA-other` ? (vData.CARGA?.other ?? '') : formatCostValue(vData.CARGA?.other)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-CARGA-other`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'CARGA', 'other', e.target.value)}
                                                                        className="w-full text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>"""

carga_new = """                                                        {/* Operación CARGA */}
                                                        <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                            <div className="text-[11px] font-black text-blue-700 uppercase tracking-wider flex items-center justify-between">
                                                                <span>Carga</span>
                                                                <span className="text-[10px] text-slate-400 font-bold">
                                                                    Total: ${( (vData.CARGA?.MAIN || 0) + (vData.CARGA?.loading_master || 0) + (vData.CARGA?.muellaje || 0) + (vData.CARGA?.other || 0) ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-1.5">
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Agencia</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-CARGA-MAIN` ? (vData.CARGA?.MAIN ?? '') : formatCostValue(vData.CARGA?.MAIN)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-CARGA-MAIN`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'CARGA', 'MAIN', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Load Master</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-CARGA-lm` ? (vData.CARGA?.loading_master ?? '') : formatCostValue(vData.CARGA?.loading_master)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-CARGA-lm`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'CARGA', 'loading_master', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-blue-800 uppercase">Muellaje</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-CARGA-muellaje` ? (vData.CARGA?.muellaje ?? '') : formatCostValue(vData.CARGA?.muellaje)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-CARGA-muellaje`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'CARGA', 'muellaje', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-blue-50/50 border border-blue-200 rounded focus:border-blue-500 focus:outline-none text-blue-900 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Otros</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-CARGA-other` ? (vData.CARGA?.other ?? '') : formatCostValue(vData.CARGA?.other)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-CARGA-other`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'CARGA', 'other', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>"""

content = content.replace(carga_old, carga_new)

# 6. Update Descarga JSX card block
descarga_old = """                                                        {/* Operación DESCARGA */}
                                                        <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                            <div className="text-[11px] font-black text-emerald-700 uppercase tracking-wider flex items-center justify-between">
                                                                <span>Descarga</span>
                                                                <span className="text-[10px] text-slate-400 font-bold">
                                                                    Total: ${( (vData.DESCARGA?.MAIN || 0) + (vData.DESCARGA?.loading_master || 0) + (vData.DESCARGA?.other || 0) ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Agencia</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-DESCARGA-MAIN` ? (vData.DESCARGA?.MAIN ?? '') : formatCostValue(vData.DESCARGA?.MAIN)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-DESCARGA-MAIN`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'DESCARGA', 'MAIN', e.target.value)}
                                                                        className="w-full text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Load Master</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-DESCARGA-lm` ? (vData.DESCARGA?.loading_master ?? '') : formatCostValue(vData.DESCARGA?.loading_master)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-DESCARGA-lm`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'DESCARGA', 'loading_master', e.target.value)}
                                                                        className="w-full text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Otros</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-DESCARGA-other` ? (vData.DESCARGA?.other ?? '') : formatCostValue(vData.DESCARGA?.other)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-DESCARGA-other`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'DESCARGA', 'other', e.target.value)}
                                                                        className="w-full text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>"""

descarga_new = """                                                        {/* Operación DESCARGA */}
                                                        <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                            <div className="text-[11px] font-black text-emerald-700 uppercase tracking-wider flex items-center justify-between">
                                                                <span>Descarga</span>
                                                                <span className="text-[10px] text-slate-400 font-bold">
                                                                    Total: ${( (vData.DESCARGA?.MAIN || 0) + (vData.DESCARGA?.loading_master || 0) + (vData.DESCARGA?.muellaje || 0) + (vData.DESCARGA?.other || 0) ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-1.5">
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Agencia</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-DESCARGA-MAIN` ? (vData.DESCARGA?.MAIN ?? '') : formatCostValue(vData.DESCARGA?.MAIN)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-DESCARGA-MAIN`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'DESCARGA', 'MAIN', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Load Master</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-DESCARGA-lm` ? (vData.DESCARGA?.loading_master ?? '') : formatCostValue(vData.DESCARGA?.loading_master)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-DESCARGA-lm`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'DESCARGA', 'loading_master', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-emerald-800 uppercase">Muellaje</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-DESCARGA-muellaje` ? (vData.DESCARGA?.muellaje ?? '') : formatCostValue(vData.DESCARGA?.muellaje)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-DESCARGA-muellaje`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'DESCARGA', 'muellaje', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-emerald-50/50 border border-emerald-200 rounded focus:border-emerald-500 focus:outline-none text-emerald-900 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Otros</label>
                                                                    <input 
                                                                        type="text"
                                                                        value={focusedInput === `${effectiveActivePortId}-${v.vessel_id}-DESCARGA-other` ? (vData.DESCARGA?.other ?? '') : formatCostValue(vData.DESCARGA?.other)}
                                                                        onFocus={() => setFocusedInput(`${effectiveActivePortId}-${v.vessel_id}-DESCARGA-other`)}
                                                                        onBlur={() => setFocusedInput(null)}
                                                                        onChange={(e) => handleCostChange(effectiveActivePortId, v.vessel_id, 'DESCARGA', 'other', e.target.value)}
                                                                        className="w-full text-xs font-bold px-1.5 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none text-slate-800 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>"""

content = content.replace(descarga_old, descarga_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("PORT COSTS MASTER V2 UPDATED WITH MUELLAJE SUCCESSFULLY!")
