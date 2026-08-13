import os

# -----------------------------------------------------------------------------
# 1. Update spot_engine.py for single-port refacturacion_muellaje accumulation
# -----------------------------------------------------------------------------
engine_path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend\spot_engine.py'
with open(engine_path, 'r', encoding='utf-8') as f:
    engine_code = f.read()

tot_muellaje_old = """    # Refacturación de Muellaje acumulada
    tot_refacturacion_muellaje = 0.0
    for tr_m in processed_tramos:
        if tr_m.get("refacturar_muellaje", True):
            tot_refacturacion_muellaje += float(tr_m.get("muellaje_cost_dest", 0)) + float(tr_m.get("muellaje_cost_origin", 0))"""

tot_muellaje_new = """    # Refacturación de Muellaje acumulada (1 sola vez por recalada de puerto)
    tot_refacturacion_muellaje = 0.0
    for idx_m, tr_m in enumerate(processed_tramos):
        # Puerto Origen (solo en la recalada 0)
        if idx_m == 0:
            if tr_m.get("refacturar_muellaje", True) and tr_m.get("origin_action", "NONE") != "NONE":
                tot_refacturacion_muellaje += float(tr_m.get("muellaje_cost_origin", 0))
        # Puerto Destino (en cada tramo idx_m)
        if tr_m.get("refacturar_muellaje", True) and tr_m.get("destination_action", "NONE") != "NONE":
            tot_refacturacion_muellaje += float(tr_m.get("muellaje_cost_dest", 0))"""

engine_code = engine_code.replace(tot_muellaje_old, tot_muellaje_new)

with open(engine_path, 'w', encoding='utf-8') as f:
    f.write(engine_code)
print("1. SPOT_ENGINE.PY UPDATED (SINGLE ACCUMULATION PER PORT CALL)!")

# -----------------------------------------------------------------------------
# 2. Update MultiCotizadorExcel.tsx (Clean 2-level header, uniform cells & PORT COSTS)
# -----------------------------------------------------------------------------
frontend_path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'
with open(frontend_path, 'r', encoding='utf-8') as f:
    frontend_code = f.read()

# Update Colgroup
col_old = """                        <col style={{ width: '6%' }} />   {/* Flete Calculado */}
                        <col style={{ width: '6%' }} />   {/* Costo Bunker */}
                        <col style={{ width: '4.5%' }} /> {/* Muellaje Cifra */}
                        <col style={{ width: '3%' }} />   {/* Muellaje Checkbox */}"""

col_new = """                        <col style={{ width: '5.5%' }} /> {/* Flete Calculado */}
                        <col style={{ width: '5.5%' }} /> {/* Costo Bunker */}
                        <col style={{ width: '4.5%' }} /> {/* Muellaje Cifra */}
                        <col style={{ width: '3.0%' }} /> {/* Muellaje Checkbox */}"""

frontend_code = frontend_code.replace(col_old, col_new)

# Update Header Nivel 1 & Sub-headers Nivel 2
header_old = '<th colSpan={2} className="text-center p-0 font-bold border-r border-slate-300" title="Muellaje (Cifra y Refacturación)">MUELLAJE</th>'
header_new = '<th colSpan={2} className="border-r border-slate-300 text-center p-0 font-bold bg-slate-100 text-slate-700" title="Muellaje (Cifra y Refacturación)">MUELLAJE</th>'

frontend_code = frontend_code.replace(header_old, header_new)

# Update Leg 0 (Origen) Cells
leg0_old = """                            {/* Sub-celda 1: Cifra Muellaje (Izquierda - Blanco/Vacío hasta calcular) */}
                            <td className="border-r border-slate-200 text-right pr-1.5 font-mono font-bold text-xs bg-slate-50/70">
                                {(() => {
                                    if (puertosConfig[0].action === 'NONE') return <span className="text-slate-350 select-none pr-1">—</span>;
                                    const mVal = result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || 0;
                                    if (!mVal) return <span></span>;
                                    return (
                                        <span className={refacturarMuellajeMap[0] !== false ? 'text-blue-900' : 'text-slate-400 line-through'}>
                                            {fmtCur(mVal)}
                                        </span>
                                    );
                                })()}
                            </td>
                            {/* Sub-celda 2: Checkbox Refacturar (Derecha) */}
                            <td className="text-center p-0 bg-slate-50/70">
                                {puertosConfig[0].action !== 'NONE' ? (
                                    <input
                                        type="checkbox"
                                        checked={refacturarMuellajeMap[0] ?? true}
                                        onChange={(e) => setRefacturarMuellajeMap(prev => ({ ...prev, 0: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                        title="Refacturar Muellaje al cliente"
                                    />
                                ) : (
                                    <span className="text-slate-350 select-none">—</span>
                                )}
                            </td>"""

leg0_new = """                            {/* Sub-celda 1: Cifra Muellaje (Izquierda - Monto $) */}
                            <td className="border-r border-slate-200 text-right pr-2 font-mono font-bold text-[11px] bg-slate-50/40">
                                {(() => {
                                    if (puertosConfig[0].action === 'NONE') return <span className="text-slate-350 select-none pr-1">—</span>;
                                    const mVal = result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || 0;
                                    if (!mVal) return <span></span>;
                                    return (
                                        <span className={refacturarMuellajeMap[0] !== false ? 'text-blue-900' : 'text-slate-400 line-through'}>
                                            {fmtCur(mVal)}
                                        </span>
                                    );
                                })()}
                            </td>
                            {/* Sub-celda 2: Checkbox Refacturar (Derecha - Centrado) */}
                            <td className="border-r border-slate-300 text-center p-0 bg-slate-50/40">
                                {puertosConfig[0].action !== 'NONE' ? (
                                    <input
                                        type="checkbox"
                                        checked={refacturarMuellajeMap[0] ?? true}
                                        onChange={(e) => setRefacturarMuellajeMap(prev => ({ ...prev, 0: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                        title="Refacturar Muellaje al cliente"
                                    />
                                ) : (
                                    <span className="text-slate-350 select-none">—</span>
                                )}
                            </td>"""

frontend_code = frontend_code.replace(leg0_old, leg0_new)

# Update Leg 1..N (Destino) Cells
legN_old = """                                      {/* Sub-celda 1: Cifra Muellaje (Izquierda - Blanco/Vacío hasta calcular) */}
                                      <td className="border-r border-slate-200 text-right pr-1.5 font-mono font-bold text-xs bg-slate-50/50">
                                          {(() => {
                                              if (puertosConfig[idx + 1].action === 'NONE') return <span className="text-slate-350 select-none pr-1">—</span>;
                                              const mVal = trResult?.muellaje_cost_dest || trResult?.agency_costs_destination_details?.breakdown?.muellaje || 0;
                                              if (!mVal) return <span></span>;
                                              return (
                                                  <span className={refacturarMuellajeMap[idx + 1] !== false ? 'text-blue-900' : 'text-slate-400 line-through'}>
                                                      {fmtCur(mVal)}
                                                  </span>
                                              );
                                          })()}
                                      </td>
                                      {/* Sub-celda 2: Checkbox Refacturar (Derecha) */}
                                      <td className="text-center p-0 bg-slate-50/50">
                                          {puertosConfig[idx + 1].action !== 'NONE' ? (
                                              <input
                                                  type="checkbox"
                                                  checked={refacturarMuellajeMap[idx + 1] ?? true}
                                                  onChange={(e) => setRefacturarMuellajeMap(prev => ({ ...prev, [idx + 1]: e.target.checked }))}
                                                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                                  title="Refacturar Muellaje al cliente"
                                              />
                                          ) : (
                                              <span className="text-slate-350 select-none">—</span>
                                          )}
                                      </td>"""

legN_new = """                                      {/* Sub-celda 1: Cifra Muellaje (Izquierda - Monto $) */}
                                      <td className="border-r border-slate-200 text-right pr-2 font-mono font-bold text-[11px] bg-slate-50/40">
                                          {(() => {
                                              if (puertosConfig[idx + 1].action === 'NONE') return <span className="text-slate-350 select-none pr-1">—</span>;
                                              const mVal = trResult?.muellaje_cost_dest || trResult?.agency_costs_destination_details?.breakdown?.muellaje || 0;
                                              if (!mVal) return <span></span>;
                                              return (
                                                  <span className={refacturarMuellajeMap[idx + 1] !== false ? 'text-blue-900' : 'text-slate-400 line-through'}>
                                                      {fmtCur(mVal)}
                                                  </span>
                                              );
                                          })()}
                                      </td>
                                      {/* Sub-celda 2: Checkbox Refacturar (Derecha - Centrado) */}
                                      <td className="border-r border-slate-300 text-center p-0 bg-slate-50/40">
                                          {puertosConfig[idx + 1].action !== 'NONE' ? (
                                              <input
                                                  type="checkbox"
                                                  checked={refacturarMuellajeMap[idx + 1] ?? true}
                                                  onChange={(e) => setRefacturarMuellajeMap(prev => ({ ...prev, [idx + 1]: e.target.checked }))}
                                                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                                  title="Refacturar Muellaje al cliente"
                                              />
                                          ) : (
                                              <span className="text-slate-350 select-none">—</span>
                                          )}
                                      </td>"""

frontend_code = frontend_code.replace(legN_old, legN_new)

# Update PORT COSTS card muellaje rendering
port_cost_card_old = """                                                        {item.muellaje > 0 && (
                                                            <tr className="border-b border-slate-100 bg-blue-50/60">
                                                                <td className="py-0.5 pl-3.5 text-blue-900 font-bold text-[10px]">↳ Muellaje ({item.port_id})</td>
                                                                <td className="text-right py-0.5 pr-1.5 font-bold text-blue-900 text-[10px]">
                                                                    {fmtCur(item.muellaje)}
                                                                </td>
                                                            </tr>
                                                        )}"""

port_cost_card_new = """                                                        {(() => {
                                                            const trForPort = result?.tramos?.[idx];
                                                            const mValPort = idx === 0 
                                                                ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || 0)
                                                                : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || 0);
                                                            
                                                            if (!mValPort) return null;
                                                            return (
                                                                <tr className="border-b border-slate-100 bg-blue-50/60">
                                                                    <td className="py-0.5 pl-3.5 text-blue-900 font-bold text-[10px]">↳ Muellaje ({item.port_id})</td>
                                                                    <td className="text-right py-0.5 pr-1.5 font-bold text-blue-900 text-[10px]">
                                                                        {fmtCur(mValPort)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })()}"""

frontend_code = frontend_code.replace(port_cost_card_old, port_cost_card_new)

with open(frontend_path, 'w', encoding='utf-8') as f:
    f.write(frontend_code)

print("2. MULTICOTIZADOREXCEL.TSX UPDATED (UNIFORM CELLS & PORT COSTS SUB-ITEM)!")

# -----------------------------------------------------------------------------
# 3. Update run_triangular_qc_loop.py to add Test B (Mejillones Anti-Goal Check)
# -----------------------------------------------------------------------------
qc_path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador\scripts\run_triangular_qc_loop.py'
with open(qc_path, 'r', encoding='utf-8') as f:
    qc_code = f.read()

qc_append = """

# ==========================================================================
# [VERTICE D] PRUEBA ANTI-GOLES: ROTACION MULTI-TRAMO MEJILLONES ($33,333)
# ==========================================================================
print("\n[VERTICE D] Ejecutando Prueba Anti-Goles (Mejillones Multi-tramo)...")
mejillones_payload = {
    "client_id": "SPCC",
    "vessel_id": "TABLONES",
    "bunker_price_ifo": 967.26,
    "bunker_price_mdo": 1528.26,
    "port_cost_mode": "STATIC",
    "tramos": [
        {
            "origin_port_id": "ILO",
            "destination_port_id": "MEJILLONES",
            "type": "LADEN",
            "quantity": 13500,
            "freight_rate": 30.0,
            "origin_action": "CARGAR",
            "destination_action": "DESCARGAR",
            "refacturar_muellaje": True,
            "agency_costs_origin": 23000,
            "agency_costs_destination": 67833,
            "agency_costs_destination_details": {
                "total_cost": 67833,
                "breakdown": {"MAIN": 32000, "loading_master": 2500, "muellaje": 33333, "other": 0}
            }
        },
        {
            "origin_port_id": "MEJILLONES",
            "destination_port_id": "ILO",
            "type": "BALLAST",
            "origin_action": "DESCARGAR",
            "destination_action": "NONE",
            "refacturar_muellaje": True,
            "agency_costs_origin": 0.00001,
            "agency_costs_destination": 0,
            "agency_costs_origin_details": {
                "total_cost": 0.00001,
                "breakdown": {"MAIN": -35833, "loading_master": 2500, "muellaje": 33333, "other": 0}
            }
        }
    ]
}

resp_mej = requests.post(URL_API_LIVE, json=mejillones_payload)
assert resp_mej.status_code == 200, f"Error HTTP {resp_mej.status_code}"
data_mej = resp_mej.json()
refact_muellaje = data_mej.get("consolidated", {}).get("refacturacion_muellaje", 0)

print(f"   • Refacturación Muellaje Evaluada: ${refact_muellaje:,.2f}")
if refact_muellaje == 33333.0:
    print("   • Aserción Unicidad Muellaje: [OK] (Cero Duplicación)")
else:
    print(f"   • Aserción Unicidad Muellaje: [FAIL] Esperado $33,333, recibido ${refact_muellaje}")
    sys.exit(1)

print("\n==========================================================================")
print("   [OK] TODAS LAS ASERCIONES ANTI-GOLES PASARON SATISFACTORIAMENTE")
print("==========================================================================\n")
"""

if "[VERTICE D]" not in qc_code:
    qc_code += qc_append
    with open(qc_path, 'w', encoding='utf-8') as f:
        f.write(qc_code)
    print("3. RUN_TRIANGULAR_QC_LOOP.PY UPDATED WITH ANTI-GOAL CHECKPOINTS!")
