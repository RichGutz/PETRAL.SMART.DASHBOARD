path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Update Card 3 (Port Costs)
old_card3_rows = """                                                                <tr className="border-b border-slate-100">
                                                                    <td className="py-1 pl-1.5 text-slate-650 font-bold">{item.label}</td>
                                                                    <td className="text-right py-1 pr-1.5 font-bold">
                                                                        {result || item.cost > 0 ? fmtCur(baseAgencyCost) : '$0'}
                                                                    </td>
                                                                </tr>
                                                                {lmCost > 0 && (
                                                                    <tr className="border-b border-slate-100 bg-amber-50/60">
                                                                        <td className="py-0.5 pl-3.5 text-amber-900 font-bold text-[10px]">↳ Loading Master (Chile)</td>
                                                                        <td className="text-right py-0.5 pr-1.5 font-bold text-amber-900 text-[10px]">
                                                                            {fmtCur(lmCost)}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                {mValPort > 0 && (
                                                                    <tr className="border-b border-slate-100 bg-blue-50/60">
                                                                        <td className="py-0.5 pl-3.5 text-blue-900 font-bold text-[10px]">↳ Muellaje ({item.port_id})</td>
                                                                        <td className="text-right py-0.5 pr-1.5 font-bold text-blue-900 text-[10px]">
                                                                            {fmtCur(mValPort)}
                                                                        </td>
                                                                    </tr>
                                                                )}"""

new_card3_rows = """                                                                <tr className="border-b border-slate-100">
                                                                    <td className="py-1 pl-1.5 text-slate-650 font-bold">Port Costs {item.label}</td>
                                                                    <td className="text-right py-1 pr-1.5 font-bold">
                                                                        {result || item.cost > 0 ? fmtCur(baseAgencyCost) : '$0'}
                                                                    </td>
                                                                </tr>
                                                                {lmCost > 0 && (
                                                                    <tr className="border-b border-slate-100 bg-amber-50/60">
                                                                        <td className="py-1 pl-1.5 text-amber-900 font-bold">Loading Master ({item.port_id})</td>
                                                                        <td className="text-right py-1 pr-1.5 font-bold text-amber-900">
                                                                            {fmtCur(lmCost)}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                {mValPort > 0 && (
                                                                    <tr className="border-b border-slate-100 bg-blue-50/60">
                                                                        <td className="py-1 pl-1.5 text-blue-900 font-bold">Muellaje ({item.port_id})</td>
                                                                        <td className="text-right py-1 pr-1.5 font-bold text-blue-900">
                                                                            {fmtCur(mValPort)}
                                                                        </td>
                                                                    </tr>
                                                                )}"""

code = code.replace(old_card3_rows, new_card3_rows)

# Update Card 4 (Financial Voyage Result)
old_card4_rows = """                                                        <tr className="border-b border-emerald-100/60">
                                                            <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                                (-) Port Costs {item.label}
                                                            </td>
                                                            <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                                -{fmtCur(baseAgencyCost)}
                                                            </td>
                                                        </tr>
                                                        {lmCost > 0 && (
                                                            <tr className="border-b border-emerald-100/60 bg-amber-50/50">
                                                                <td className="py-0.5 pl-3 text-amber-900 font-sans text-[10px] font-bold">
                                                                    ↳ Loading Master (Chile)
                                                                </td>
                                                                <td className="text-right py-0.5 pr-1 font-bold text-amber-900 text-[10px]">
                                                                    -{fmtCur(lmCost)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {mValPort > 0 && (
                                                            <tr className="border-b border-emerald-100/60 bg-blue-50/50">
                                                                <td className="py-0.5 pl-3 text-blue-900 font-sans text-[10px] font-bold">
                                                                    ↳ Muellaje ({item.port_id})
                                                                </td>
                                                                <td className="text-right py-0.5 pr-1 font-bold text-blue-900 text-[10px]">
                                                                    -{fmtCur(mValPort)}
                                                                </td>
                                                            </tr>
                                                        )}"""

new_card4_rows = """                                                        <tr className="border-b border-emerald-100/60">
                                                            <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                                (-) Port Costs {item.label}
                                                            </td>
                                                            <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                                -{fmtCur(baseAgencyCost)}
                                                            </td>
                                                        </tr>
                                                        {lmCost > 0 && (
                                                            <tr className="border-b border-emerald-100/60 bg-amber-50/50">
                                                                <td className="py-0.5 pl-1 text-amber-900 font-sans text-[10.5px] font-bold">
                                                                    (-) Loading Master ({item.port_id})
                                                                </td>
                                                                <td className="text-right py-0.5 pr-1 font-bold text-amber-900 text-[10.5px]">
                                                                    -{fmtCur(lmCost)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {mValPort > 0 && (
                                                            <tr className="border-b border-emerald-100/60 bg-blue-50/50">
                                                                <td className="py-0.5 pl-1 text-blue-900 font-sans text-[10.5px] font-bold">
                                                                    (-) Muellaje ({item.port_id})
                                                                </td>
                                                                <td className="text-right py-0.5 pr-1 font-bold text-blue-900 text-[10.5px]">
                                                                    -{fmtCur(mValPort)}
                                                                </td>
                                                            </tr>
                                                        )}"""

code = code.replace(old_card4_rows, new_card4_rows)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("INDEPENDENT SISTER PORT LINE ITEMS UPDATED SUCCESSFULLY!")
