path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace Card 4 port renderer block
old_card4_render = """                                                return (
                                                    <React.Fragment key={idx}>
                                                        {baseAgencyCost >= 1 && (
                                                            <tr className={`border-b border-emerald-100/60 ${theme.bg}`}>
                                                                <td className="py-0.5 pl-1.5 text-slate-700 font-sans text-[10.5px] font-medium">
                                                                    (-) Port Costs {item.label}
                                                                </td>
                                                                <td className="text-right py-0.5 pr-1 text-slate-800 font-bold">
                                                                    -{fmtCur(baseAgencyCost)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {lmCost >= 1 && (
                                                            <tr className={`border-b border-emerald-100/60 ${theme.bg}`}>
                                                                <td className="py-0.5 pl-1.5 text-amber-950 font-sans text-[10.5px] font-bold">
                                                                    (-) Loading Master ({item.port_id})
                                                                </td>
                                                                <td className="text-right py-0.5 pr-1 font-bold text-amber-950 text-[10.5px]">
                                                                    -{fmtCur(lmCost)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {mValPort >= 1 && (
                                                            <tr className={`border-b border-emerald-100/60 ${theme.bg}`}>
                                                                <td className="py-0.5 pl-1.5 text-blue-950 font-sans text-[10.5px] font-bold">
                                                                    (-) Muellaje ({item.port_id})
                                                                </td>
                                                                <td className="text-right py-0.5 pr-1 font-bold text-blue-950 text-[10.5px]">
                                                                    -{fmtCur(mValPort)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );"""

new_card4_render = """                                                return (
                                                    <React.Fragment key={idx}>
                                                        {baseAgencyCost >= 1 && (
                                                            <tr className={`border-b border-emerald-100/60 ${theme.bg}`}>
                                                                <td className={`py-0.5 pl-1.5 font-sans text-[10.5px] font-medium ${theme.text}`}>
                                                                    (-) Port Costs {item.label}
                                                                </td>
                                                                <td className={`text-right py-0.5 pr-1 font-bold text-[10.5px] ${theme.text}`}>
                                                                    -{fmtCur(baseAgencyCost)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {lmCost >= 1 && (
                                                            <tr className={`border-b border-emerald-100/60 ${theme.bg}`}>
                                                                <td className={`py-0.5 pl-1.5 font-sans text-[10.5px] font-bold ${theme.text}`}>
                                                                    (-) Loading Master ({item.port_id})
                                                                </td>
                                                                <td className={`text-right py-0.5 pr-1 font-bold text-[10.5px] ${theme.text}`}>
                                                                    -{fmtCur(lmCost)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {mValPort >= 1 && (
                                                            <tr className={`border-b border-emerald-100/60 ${theme.bg}`}>
                                                                <td className={`py-0.5 pl-1.5 font-sans text-[10.5px] font-bold ${theme.text}`}>
                                                                    (-) Muellaje ({item.port_id})
                                                                </td>
                                                                <td className={`text-right py-0.5 pr-1 font-bold text-[10.5px] ${theme.text}`}>
                                                                    -{fmtCur(mValPort)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );"""

code = code.replace(old_card4_render, new_card4_render)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("CARD 4 UNIFIED PORT TEXT AND BACKGROUND COLORS UPDATED SUCCESSFULLY!")
