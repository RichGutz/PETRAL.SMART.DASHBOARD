path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

target_idx = -1
for i in range(3340, len(lines)):
    if "↳ Loading Master (Chile)" in lines[i]:
        target_idx = i
        break

if target_idx != -1:
    # Find ending </tr> for lmCost
    for j in range(target_idx, target_idx + 10):
        if "</tr>" in lines[j]:
            end_idx = j
            break
            
    muellaje_snippet = [
        '                                                                 {(() => {\n',
        '                                                                     const trForPort = result?.tramos?.[idx === 0 ? 0 : idx - 1];\n',
        '                                                                     const mValPort = (item.role === \'POL\' || idx === 0)\n',
        '                                                                         ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || 0)\n',
        '                                                                         : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || 0);\n',
        '                                                                     if (!mValPort) return null;\n',
        '                                                                     return (\n',
        '                                                                         <tr className="border-b border-slate-100 bg-blue-50/60">\n',
        '                                                                             <td className="py-0.5 pl-3.5 text-blue-900 font-bold text-[10px]">↳ Muellaje ({item.port_id})</td>\n',
        '                                                                             <td className="text-right py-0.5 pr-1.5 font-bold text-blue-900 text-[10px]">\n',
        '                                                                                 {fmtCur(mValPort)}\n',
        '                                                                             </td>\n',
        '                                                                         </tr>\n',
        '                                                                     );\n',
        '                                                                 })()}\n'
    ]
    
    lines[end_idx + 1 : end_idx + 1] = muellaje_snippet

    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
        
    print("SUCCESSFULLY INSERTED MUELLAJE SUB-ITEM IN PORT COSTS CARD!")
else:
    print("ERROR: Loading Master line not found!")
