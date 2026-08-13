path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Colgroup to 18 columns total with proper widths
col_old = """                        <col style={{ width: '6%' }} />   {/* Flete Calculado */}
                        <col style={{ width: '6.5%' }} /> {/* Costo Bunker */}
                        <col style={{ width: '5.5%' }} /> {/* Muellaje Cifra */}
                        <col style={{ width: '3%' }} />   {/* Muellaje Checkbox */}"""

col_new = """                        <col style={{ width: '6%' }} />   {/* Flete Calculado */}
                        <col style={{ width: '6%' }} />   {/* Costo Bunker */}
                        <col style={{ width: '4.5%' }} /> {/* Muellaje Cifra */}
                        <col style={{ width: '3%' }} />   {/* Muellaje Checkbox */}"""

content = content.replace(col_old, col_new)

# 2. Leg 0 (Origen) Muellaje 2 Sub-cells
leg0_old = """                            {/* Sub-celda 1: Cifra Muellaje (Solo si hay CARGA/DESCARGA) */}
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

leg0_new = """                            {/* Sub-celda 1: Cifra Muellaje (Izquierda - Blanco/Vacío hasta calcular) */}
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

content = content.replace(leg0_old, leg0_new)

# 3. Leg 1..N (Destino) Muellaje 2 Sub-cells
legN_old = """                                      {/* Sub-celda 1: Cifra Muellaje (Solo si hay CARGA/DESCARGA) */}
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

legN_new = """                                      {/* Sub-celda 1: Cifra Muellaje (Izquierda - Blanco/Vacío hasta calcular) */}
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

content = content.replace(legN_old, legN_new)

# 4. Fix Total Rows to have 2 cells for Muellaje
tot1_old = """                            <td className="border-r border-blue-200 text-right pr-2 font-mono text-blue-900">
                                {result ? fmtCur(result.consolidated.total_bunker_costs || 0) : '$0'}
                            </td>
                            <td className="text-right pr-2 text-slate-400">—</td>
                        </tr>"""

tot1_new = """                            <td className="border-r border-blue-200 text-right pr-2 font-mono text-blue-900">
                                {result ? fmtCur(result.consolidated.total_bunker_costs || 0) : '$0'}
                            </td>
                            <td className="border-r border-blue-200 text-right pr-2 text-slate-400">—</td>
                            <td className="text-right pr-2 text-slate-400">—</td>
                        </tr>"""

content = content.replace(tot1_old, tot1_new)

tot2_old = """                                        <td className="border-r border-amber-300 text-right pr-2 font-mono">{fmtCur(sumBunkerCosts)}</td>
                                        <td className="text-right pr-2 text-slate-400">—</td>
                                    </tr>"""

tot2_new = """                                        <td className="border-r border-amber-300 text-right pr-2 font-mono">{fmtCur(sumBunkerCosts)}</td>
                                        <td className="border-r border-amber-300 text-right pr-2 text-slate-400">—</td>
                                        <td className="text-right pr-2 text-slate-400">—</td>
                                    </tr>"""

content = content.replace(tot2_old, tot2_new)

tot3_old = """                                        <td className="border-r border-slate-300 text-right pr-2 font-mono">
                                            {Math.abs(diffBunkerCosts) > 0.5 ? `${diffBunkerCosts > 0 ? '+' : ''}${fmtCur(diffBunkerCosts)}` : '$0'}
                                        </td>
                                        <td className="text-right pr-2 text-slate-400">—</td>
                                    </tr>"""

tot3_new = """                                        <td className="border-r border-slate-300 text-right pr-2 font-mono">
                                            {Math.abs(diffBunkerCosts) > 0.5 ? `${diffBunkerCosts > 0 ? '+' : ''}${fmtCur(diffBunkerCosts)}` : '$0'}
                                        </td>
                                        <td className="border-r border-slate-300 text-right pr-2 text-slate-400">—</td>
                                        <td className="text-right pr-2 text-slate-400">—</td>
                                    </tr>"""

content = content.replace(tot3_old, tot3_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("FIXED MUELLAJE SPLIT TOTALS AND CELL ALIGNMENT SUCCESSFULLY!")
