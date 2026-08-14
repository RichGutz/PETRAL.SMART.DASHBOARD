path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update Flete cell rendering to show live Q x F product
old_flete_td = """                                    {/* Ingreso de Flete del Tramo */}
                                    <td className="border-r border-slate-200 text-right pr-2 text-slate-500 bg-slate-50/50 font-bold select-none">
                                        {trResult ? fmtCur(trResult.net_income || 0) : '$0'}
                                    </td>"""

new_flete_td = """                                    {/* Ingreso de Flete del Tramo (Reactivo en Vivo Q × F) */}
                                    <td className="border-r border-slate-200 text-right pr-2 text-slate-700 bg-slate-50/50 font-mono font-bold select-none">
                                        {(() => {
                                            const calcIncome = puertosConfig[idx + 1]?.action === 'DESCARGAR'
                                                ? (Number(puertosConfig[idx + 1]?.quantity || 0) * Number(puertosConfig[idx + 1]?.freight_rate || 0))
                                                : 0;
                                            const finalIncome = trResult?.net_income ? trResult.net_income : calcIncome;
                                            return finalIncome > 0 ? fmtCur(finalIncome) : '$0';
                                        })()}
                                    </td>"""

code = code.replace(old_flete_td, new_flete_td)

# 2. Add Refacturación Muellaje row to Card 4 immediately under Freight Revenue
old_revenue_row = """                                            {/* 1. Ingresos por Flete */}
                                            <tr className="border-b border-emerald-100/60 bg-emerald-50/30">
                                                <td className="py-0.5 pl-1 text-slate-700 font-sans text-[10.5px] font-bold">
                                                    Revenue ({fmtThousandSep(totalLadenTons)} MT × {fmtCur(avgFreightRate)}/MT)
                                                </td>
                                                <td className="text-right py-0.5 pr-1 text-emerald-950 font-bold text-[10.5px]">
                                                    {fmtCur(totalFreightRevenue)}
                                                </td>
                                            </tr>"""

new_revenue_row = """                                            {/* 1. Ingresos por Flete */}
                                            <tr className="border-b border-emerald-100/60 bg-emerald-50/30">
                                                <td className="py-0.5 pl-1 text-slate-700 font-sans text-[10.5px] font-bold">
                                                    Revenue ({fmtThousandSep(totalLadenTons)} MT × {fmtCur(avgFreightRate)}/MT)
                                                </td>
                                                <td className="text-right py-0.5 pr-1 text-emerald-950 font-bold text-[10.5px]">
                                                    {fmtCur(totalFreightRevenue)}
                                                </td>
                                            </tr>
                                            {/* 1.1 Refacturación Muellaje (al cliente) si la casilla RF está marcada [x] */}
                                            {(() => {
                                                const sumRefacturedMuellaje = puertosConfig.reduce((sum, p, idx) => {
                                                    if (refacturarMuellajeMap[idx] !== false) {
                                                        const trForPort = result?.tramos?.[idx === 0 ? 0 : idx - 1];
                                                        const mVal = (p.action === 'CARGAR' || idx === 0)
                                                            ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0)
                                                            : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx]?.muellaje_cost || 0);
                                                        return sum + (mVal || 0);
                                                    }
                                                    return sum;
                                                }, 0);

                                                if (sumRefacturedMuellaje < 1) return null;

                                                return (
                                                    <tr className="border-b border-emerald-100/60 bg-blue-50/40">
                                                        <td className="py-0.5 pl-2 text-[10.5px] text-blue-950 font-sans italic font-medium">
                                                            (+) Refacturación Muellaje (al cliente)
                                                        </td>
                                                        <td className="text-right py-0.5 pr-1 text-[10.5px] text-blue-950 font-mono italic font-bold">
                                                            +${fmtCur(sumRefacturedMuellaje)}
                                                        </td>
                                                    </tr>
                                                );
                                            })()}"""

code = code.replace(old_revenue_row, new_revenue_row)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("FLETE AND RF MUELLAJE RENDERING UPDATED SUCCESSFULLY!")
