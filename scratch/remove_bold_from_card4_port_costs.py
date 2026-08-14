path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace Card 4 port renderer block to remove all bold font styling
old_card4_render = """                                                return (
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

new_card4_render = """                                                return (
                                                    <React.Fragment key={idx}>
                                                        {baseAgencyCost >= 1 && (
                                                            <tr className={`border-b border-emerald-100/60 ${theme.bg}`}>
                                                                <td className={`py-0.5 pl-1.5 font-sans text-[10.5px] font-normal ${theme.text}`}>
                                                                    (-) Port Costs {item.label}
                                                                </td>
                                                                <td className={`text-right py-0.5 pr-1 font-mono text-[10.5px] font-normal ${theme.text}`}>
                                                                    -{fmtCur(baseAgencyCost)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {lmCost >= 1 && (
                                                            <tr className={`border-b border-emerald-100/60 ${theme.bg}`}>
                                                                <td className={`py-0.5 pl-1.5 font-sans text-[10.5px] font-normal ${theme.text}`}>
                                                                    (-) Loading Master ({item.port_id})
                                                                </td>
                                                                <td className={`text-right py-0.5 pr-1 font-mono text-[10.5px] font-normal ${theme.text}`}>
                                                                    -{fmtCur(lmCost)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {mValPort >= 1 && (
                                                            <tr className={`border-b border-emerald-100/60 ${theme.bg}`}>
                                                                <td className={`py-0.5 pl-1.5 font-sans text-[10.5px] font-normal ${theme.text}`}>
                                                                    (-) Muellaje ({item.port_id})
                                                                </td>
                                                                <td className={`text-right py-0.5 pr-1 font-mono text-[10.5px] font-normal ${theme.text}`}>
                                                                    -{fmtCur(mValPort)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );"""

code = code.replace(old_card4_render, new_card4_render)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("REMOVED ALL BOLD FROM CARD 4 PORT COSTS SUCCESSFULLY!")
