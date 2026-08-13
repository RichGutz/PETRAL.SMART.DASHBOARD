path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Look for line with "Checkbox Muellaje (Refacturable al cliente)" after line 3000
target_idx = -1
for i in range(3000, len(lines)):
    if "Checkbox Muellaje (Refacturable al cliente)" in lines[i]:
        target_idx = i
        break

if target_idx != -1:
    print(f"Found target at line {target_idx + 1}")
    
    # Replace lines[target_idx : target_idx + 10]
    # Check where </td> ends
    end_idx = target_idx
    for j in range(target_idx, target_idx + 15):
        if "</td>" in lines[j]:
            end_idx = j
            break
            
    replacement = [
        '                                      {/* Sub-celda 1: Cifra Muellaje (Izquierda - Monto $) */}\n',
        '                                      <td className="border-r border-slate-200 text-right pr-2 font-mono font-bold text-[11px] bg-slate-50/40">\n',
        '                                          {(() => {\n',
        '                                              if (puertosConfig[idx + 1].action === \'NONE\') return <span className="text-slate-350 select-none pr-1">—</span>;\n',
        '                                              const mVal = trResult?.muellaje_cost_dest || trResult?.agency_costs_destination_details?.breakdown?.muellaje || 0;\n',
        '                                              if (!mVal) return <span></span>;\n',
        '                                              return (\n',
        '                                                  <span className={refacturarMuellajeMap[idx + 1] !== false ? \'text-blue-900\' : \'text-slate-400 line-through\'}>\n',
        '                                                      {fmtCur(mVal)}\n',
        '                                                  </span>\n',
        '                                              );\n',
        '                                          })()}\n',
        '                                      </td>\n',
        '                                      {/* Sub-celda 2: Checkbox Refacturar (Derecha - Centrado) */}\n',
        '                                      <td className="border-r border-slate-300 text-center p-0 bg-slate-50/40">\n',
        '                                          {puertosConfig[idx + 1].action !== \'NONE\' ? (\n',
        '                                              <input\n',
        '                                                  type="checkbox"\n',
        '                                                  checked={refacturarMuellajeMap[idx + 1] ?? true}\n',
        '                                                  onChange={(e) => setRefacturarMuellajeMap(prev => ({ ...prev, [idx + 1]: e.target.checked }))}\n',
        '                                                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"\n',
        '                                                  title="Refacturar Muellaje al cliente"\n',
        '                                              />\n',
        '                                          ) : (\n',
        '                                              <span className="text-slate-350 select-none">—</span>\n',
        '                                          )}\n',
        '                                      </td>\n'
    ]
    
    lines[target_idx : end_idx + 1] = replacement

    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
        
    print("SUCCESSFULLY REPLACED LINES OVER 3000!")
else:
    print("ERROR: Target line not found!")
