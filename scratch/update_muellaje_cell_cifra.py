path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Leg 0 Replacement
leg0_old = """                            <td className="text-center p-0 bg-slate-50/70">
                                <input
                                    type="checkbox"
                                    checked={refacturarMuellajeMap[0] ?? true}
                                    onChange={(e) => setRefacturarMuellajeMap(prev => ({ ...prev, 0: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                    title="Refacturar Muellaje al cliente"
                                />
                            </td>"""

leg0_new = """                            <td className="text-center px-1.5 py-0 bg-slate-50/70">
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

content = content.replace(leg0_old, leg0_new)

# Leg 1..N Replacement
legN_old = """                                      {/* Checkbox Muellaje (Refacturable al cliente) */}
                                      <td className="text-center p-0 bg-slate-50/50">
                                          <input
                                              type="checkbox"
                                              checked={refacturarMuellajeMap[idx + 1] ?? true}
                                              onChange={(e) => setRefacturarMuellajeMap(prev => ({ ...prev, [idx + 1]: e.target.checked }))}
                                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                              title="Refacturar Muellaje al cliente"
                                          />
                                     </td>"""

legN_new = """                                      {/* Checkbox y Cifra de Muellaje (Refacturable al cliente) */}
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

content = content.replace(legN_old, legN_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("UPDATED MUELLAJE CELLS WITH CIFRA SUCCESSFULLY!")
