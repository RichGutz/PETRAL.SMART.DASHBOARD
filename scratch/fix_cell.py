path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'getBodegaSaliente(idx + 1)' in line:
        new_lines.append('                                     {/* Checkbox Muellaje (Refacturable al cliente) */}\n')
        new_lines.append('                                     <td className="text-center p-0 bg-slate-50/50">\n')
        new_lines.append('                                         <input\n')
        new_lines.append('                                             type="checkbox"\n')
        new_lines.append('                                             checked={refacturarMuellajeMap[idx + 1] ?? true}\n')
        new_lines.append('                                             onChange={(e) => setRefacturarMuellajeMap(prev => ({ ...prev, [idx + 1]: e.target.checked }))}\n')
        new_lines.append('                                             className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"\n')
        new_lines.append('                                             title="Refacturar Muellaje al cliente"\n')
        new_lines.append('                                         />\n')
    else:
        new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("SUCCESSFULLY REPLACED BODEGA SALIENTE LINE")
