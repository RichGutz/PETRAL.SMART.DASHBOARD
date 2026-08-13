# 1. Update spot_engine.py
path_engine = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend\spot_engine.py'
with open(path_engine, 'r', encoding='utf-8') as f:
    engine_code = f.read()

target_engine_old = """        res["agency_costs_origin_details"] = tr.get("agency_costs_origin_details")
        res["agency_costs_destination_details"] = tr.get("agency_costs_destination_details"); [res.setdefault(k, v) for k, v in tr.items()]
        processed_tramos.append(res)"""

target_engine_new = """        res["agency_costs_origin_details"] = tr.get("agency_costs_origin_details")
        res["agency_costs_destination_details"] = tr.get("agency_costs_destination_details")
        [res.setdefault(k, v) for k, v in tr.items()]

        orig_det = tr.get("agency_costs_origin_details") or {}
        dest_det = tr.get("agency_costs_destination_details") or {}
        orig_bk = orig_det.get("breakdown") if isinstance(orig_det, dict) else {}
        dest_bk = dest_det.get("breakdown") if isinstance(dest_det, dict) else {}

        m_orig = float(tr.get("muellaje_cost_origin") or (orig_bk.get("muellaje") if isinstance(orig_bk, dict) else 0) or 0)
        m_dest = float(tr.get("muellaje_cost_dest") or (dest_bk.get("muellaje") if isinstance(dest_bk, dict) else 0) or 0)
        res["muellaje_cost_origin"] = m_orig
        res["muellaje_cost_dest"] = m_dest

        processed_tramos.append(res)"""

engine_code = engine_code.replace(target_engine_old, target_engine_new)

tot_muellaje_old = """    # Refacturación de Muellaje acumulada
    tot_refacturacion_muellaje = 0.0
    for tr_m in tramos:
        if tr_m.get("refacturar_muellaje", True):
            tot_refacturacion_muellaje += float(tr_m.get("muellaje_cost_dest", 0) or tr_m.get("muellaje_cost_origin", 0) or tr_m.get("muellaje_cost", 0))"""

tot_muellaje_new = """    # Refacturación de Muellaje acumulada
    tot_refacturacion_muellaje = 0.0
    for tr_m in processed_tramos:
        if tr_m.get("refacturar_muellaje", True):
            tot_refacturacion_muellaje += float(tr_m.get("muellaje_cost_dest", 0)) + float(tr_m.get("muellaje_cost_origin", 0))"""

engine_code = engine_code.replace(tot_muellaje_old, tot_muellaje_new)

with open(path_engine, 'w', encoding='utf-8') as f:
    f.write(engine_code)
print("UPDATED SPOT_ENGINE.PY MUELLAJE EXTRACTION SUCCESSFULLY!")

# 2. Update MultiCotizadorExcel.tsx
path_frontend = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'
with open(path_frontend, 'r', encoding='utf-8') as f:
    frontend_code = f.read()

leg0_old = """                            {/* Sub-celda 1: Cifra Muellaje (Izquierda - Blanco/Vacío hasta calcular) */}
                            <td className="border-r border-slate-200 text-right pr-1.5 font-mono font-bold text-xs bg-slate-50/70">
                                {puertosConfig[0].action !== 'NONE' ? (
                                    result?.tramos?.[0]?.muellaje_cost_origin ? (
                                        <span className={refacturarMuellajeMap[0] !== false ? 'text-blue-900' : 'text-slate-400 line-through'}>
                                            {fmtCur(result.tramos[0].muellaje_cost_origin)}
                                        </span>
                                    ) : (
                                        <span></span>
                                    )
                                ) : (
                                    <span className="text-slate-350 select-none pr-1">—</span>
                                )}
                            </td>"""

leg0_new = """                            {/* Sub-celda 1: Cifra Muellaje (Izquierda - Blanco/Vacío hasta calcular) */}
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
                            </td>"""

frontend_code = frontend_code.replace(leg0_old, leg0_new)

legN_old = """                                      {/* Sub-celda 1: Cifra Muellaje (Izquierda - Blanco/Vacío hasta calcular) */}
                                      <td className="border-r border-slate-200 text-right pr-1.5 font-mono font-bold text-xs bg-slate-50/50">
                                          {puertosConfig[idx + 1].action !== 'NONE' ? (
                                              trResult?.muellaje_cost_dest ? (
                                                  <span className={refacturarMuellajeMap[idx + 1] !== false ? 'text-blue-900' : 'text-slate-400 line-through'}>
                                                      {fmtCur(trResult.muellaje_cost_dest)}
                                                  </span>
                                              ) : (
                                                  <span></span>
                                              )
                                          ) : (
                                              <span className="text-slate-350 select-none pr-1">—</span>
                                          )}
                                      </td>"""

legN_new = """                                      {/* Sub-celda 1: Cifra Muellaje (Izquierda - Blanco/Vacío hasta calcular) */}
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
                                      </td>"""

frontend_code = frontend_code.replace(legN_old, legN_new)

with open(path_frontend, 'w', encoding='utf-8') as f:
    f.write(frontend_code)

print("UPDATED MULTICOTIZADOREXCEL.TSX MUELLAJE EXTRACTION SUCCESSFULLY!")
