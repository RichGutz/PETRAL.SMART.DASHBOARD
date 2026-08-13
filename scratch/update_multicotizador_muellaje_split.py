path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Colgroup to 2 columns for Muellaje
col_old = """                        <col style={{ width: '6.5%' }} /> {/* Flete Calculado */}
                        <col style={{ width: '7%' }} />   {/* Costo Bunker */}
                        <col style={{ width: '7%' }} />   {/* Bodega (T) */}"""

col_new = """                        <col style={{ width: '6%' }} />   {/* Flete Calculado */}
                        <col style={{ width: '6.5%' }} /> {/* Costo Bunker */}
                        <col style={{ width: '5.5%' }} /> {/* Muellaje Cifra */}
                        <col style={{ width: '3%' }} />   {/* Muellaje Checkbox */}"""

content = content.replace(col_old, col_new)

# 2. Update Header TH to colSpan={2}
th_old = '<th className="text-center p-0 font-bold" title="Refacturar Muellaje al Cliente">Muellaje</th>'
th_new = '<th colSpan={2} className="text-center p-0 font-bold border-r border-slate-300" title="Muellaje (Cifra y Refacturación)">MUELLAJE</th>'

content = content.replace(th_old, th_new)

# 3. Update Fila 0 (Origen) cell to 2 TD cells (Cifra + Checkbox)
leg0_cell_old = """                            <td className="text-center px-1.5 py-0 bg-slate-50/70">
                                <div className="flex items-center justify-center gap-1.5 font-mono text-xs">
                                    <input
                                        type="checkbox"
                                        checked={refacturarMuellajeMap[0] ?? true}
                                        onChange={(e) => setRefacturarMuellajeMap(prev => ({ ...prev, 0: e.target.checked }))}
                                        className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                                        title="Refacturar Muellaje al cliente"
                                    />
                                    <span className={`font-mono font-bold text-[11px] ${refacturarMuellajeMap[0] !== false ? 'text-blue-900' : 'text-slate-400 line-through'}`}>
                                        {result?.tramos?.[0]?.muellaje_cost_origin ? fmtCur(result.tramos[0].muellaje_cost_origin) : (puertosConfig[0].action !== 'NONE' ? '$0' : '—')}
                                    </span>
                                </div>
                            </td>"""

leg0_cell_new = """                            {/* Sub-celda 1: Cifra Muellaje (Solo si hay CARGA/DESCARGA) */}
                            <td className="border-r border-slate-200 text-right pr-1.5 font-mono font-bold text-xs bg-slate-50/70">
                                {puertosConfig[0].action !== 'NONE' ? (
                                    <span className={refacturarMuellajeMap[0] !== false ? 'text-blue-900' : 'text-slate-400 line-through'}>
                                        {result?.tramos?.[0]?.muellaje_cost_origin ? fmtCur(result.tramos[0].muellaje_cost_origin) : '$0'}
                                    </span>
                                ) : (
                                    <span className="text-slate-350 select-none pr-1">—</span>
                                )}
                            </td>
                            {/* Sub-celda 2: Checkbox Refacturar */}
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

content = content.replace(leg0_cell_old, leg0_cell_new)

# 4. Update Fila 1..N (Destino) cell to 2 TD cells (Cifra + Checkbox)
legN_cell_old = """                                      {/* Checkbox y Cifra de Muellaje (Refacturable al cliente) */}
                                      <td className="text-center px-1.5 py-0 bg-slate-50/50">
                                          <div className="flex items-center justify-center gap-1.5 font-mono text-xs">
                                              <input
                                                  type="checkbox"
                                                  checked={refacturarMuellajeMap[idx + 1] ?? true}
                                                  onChange={(e) => setRefacturarMuellajeMap(prev => ({ ...prev, [idx + 1]: e.target.checked }))}
                                                  className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                                                  title="Refacturar Muellaje al cliente"
                                              />
                                              <span className={`font-mono font-bold text-[11px] ${refacturarMuellajeMap[idx + 1] !== false ? 'text-blue-900' : 'text-slate-400 line-through'}`}>
                                                  {trResult?.muellaje_cost_dest ? fmtCur(trResult.muellaje_cost_dest) : (puertosConfig[idx + 1].action !== 'NONE' ? '$0' : '—')}
                                              </span>
                                          </div>
                                     </td>"""

legN_cell_new = """                                      {/* Sub-celda 1: Cifra Muellaje (Solo si hay CARGA/DESCARGA) */}
                                      <td className="border-r border-slate-200 text-right pr-1.5 font-mono font-bold text-xs bg-slate-50/50">
                                          {puertosConfig[idx + 1].action !== 'NONE' ? (
                                              <span className={refacturarMuellajeMap[idx + 1] !== false ? 'text-blue-900' : 'text-slate-400 line-through'}>
                                                  {trResult?.muellaje_cost_dest ? fmtCur(trResult.muellaje_cost_dest) : '$0'}
                                              </span>
                                          ) : (
                                              <span className="text-slate-350 select-none pr-1">—</span>
                                          )}
                                      </td>
                                      {/* Sub-celda 2: Checkbox Refacturar */}
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

content = content.replace(legN_cell_old, legN_cell_new)

# 5. Add Muellaje sub-cost breakdown in PORT COSTS card
port_costs_card_old = """                                                        {lmCost > 0 && (
                                                            <tr className="border-b border-slate-100 bg-amber-50/60">
                                                                <td className="py-0.5 pl-3.5 text-amber-900 font-bold text-[10px]">↳ Loading Master (Chile)</td>
                                                                <td className="text-right py-0.5 pr-1.5 font-bold text-amber-900 text-[10px]">
                                                                    {fmtCur(lmCost)}
                                                                </td>
                                                            </tr>
                                                        )}"""

port_costs_card_new = """                                                        {lmCost > 0 && (
                                                            <tr className="border-b border-slate-100 bg-amber-50/60">
                                                                <td className="py-0.5 pl-3.5 text-amber-900 font-bold text-[10px]">↳ Loading Master (Chile)</td>
                                                                <td className="text-right py-0.5 pr-1.5 font-bold text-amber-900 text-[10px]">
                                                                    {fmtCur(lmCost)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {item.muellaje > 0 && (
                                                            <tr className="border-b border-slate-100 bg-blue-50/60">
                                                                <td className="py-0.5 pl-3.5 text-blue-900 font-bold text-[10px]">↳ Muellaje ({item.port_id})</td>
                                                                <td className="text-right py-0.5 pr-1.5 font-bold text-blue-900 text-[10px]">
                                                                    {fmtCur(item.muellaje)}
                                                                </td>
                                                            </tr>
                                                        )}"""

content = content.replace(port_costs_card_old, port_costs_card_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("MULTICOTIZADOR SPLIT MUELLAJE CELLS UPDATED SUCCESSFULLY!")
