import re

frontend_path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(frontend_path, 'r', encoding='utf-8') as f:
    code = f.read()

# -----------------------------------------------------------------------------
# 1. FIX TRAMOS LOOP IN MULTICOTIZADOREXCEL.TSX (2 SUB-CELLS FOR EVERY LEG)
# -----------------------------------------------------------------------------

# Search for Leg 1..N muellaje cell in tramos.map
old_legN_pattern = r'\{\/\* Checkbox Muellaje \(Refacturable al cliente\) \*\/\}\s*<td className="text-center p-0 bg-slate-50/50">\s*<input[\s\S]*?/>\s*</td>'

new_legN_code = """{/* Sub-celda 1: Cifra Muellaje (Izquierda - Monto $) */}
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

if re.search(old_legN_pattern, code):
    code = re.sub(old_legN_pattern, new_legN_code, code)
    print("Found and replaced Leg N muellaje cell pattern!")
else:
    print("WARNING: Leg N pattern not found by regex, checking literal replace...")

# Also fix Port Costs card rendering
old_port_card = """                                                                 {lmCost > 0 && (
                                                                     <tr className="border-b border-slate-100 bg-amber-50/60">
                                                                         <td className="py-0.5 pl-3.5 text-amber-900 font-bold text-[10px]">↳ Loading Master (Chile)</td>
                                                                         <td className="text-right py-0.5 pr-1.5 font-bold text-amber-900 text-[10px]">
                                                                             {fmtCur(lmCost)}
                                                                         </td>
                                                                     </tr>
                                                                 )}"""

new_port_card = """                                                                 {lmCost > 0 && (
                                                                     <tr className="border-b border-slate-100 bg-amber-50/60">
                                                                         <td className="py-0.5 pl-3.5 text-amber-900 font-bold text-[10px]">↳ Loading Master (Chile)</td>
                                                                         <td className="text-right py-0.5 pr-1.5 font-bold text-amber-900 text-[10px]">
                                                                             {fmtCur(lmCost)}
                                                                         </td>
                                                                     </tr>
                                                                 )}
                                                                 {(() => {
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

code = code.replace(old_port_card, new_port_card)

with open(frontend_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("MULTICOTIZADOREXCEL.TSX EDITED SUCCESSFULLY!")
