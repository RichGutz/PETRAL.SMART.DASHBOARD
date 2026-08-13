path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Update Card 3 (Port Costs)
old_card3_block = """                                                    {portItems.map((item, idx) => {
                                                        const isChile = chileanPorts.includes((item.port_id || '').toUpperCase());
                                                        let baseCost = item.cost;
                                                        let lmCost = 0;
                                                        if (isChile && item.cost >= 2500) {
                                                            baseCost = item.cost - 2500;
                                                            lmCost = 2500;
                                                        }
                                                        return (
                                                            <React.Fragment key={idx}>
                                                                <tr className="border-b border-slate-100">
                                                                    <td className="py-1 pl-1.5 text-slate-650 font-bold">{item.label}</td>
                                                                    <td className="text-right py-1 pr-1.5 font-bold">
                                                                        {result || item.cost > 0 ? fmtCur(baseCost) : '$0'}
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
                                                                {(() => {
                                                                    const trForPort = result?.tramos?.[idx === 0 ? 0 : idx - 1];
                                                                    const mValPort = (item.role === 'POL' || idx === 0)
                                                                        ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0)
                                                                        : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx]?.muellaje_cost || 0);
                                                                    if (!mValPort) return null;
                                                                    return (
                                                                        <tr className="border-b border-slate-100 bg-blue-50/60">
                                                                            <td className="py-0.5 pl-3.5 text-blue-900 font-bold text-[10px]">↳ Muellaje ({item.port_id})</td>
                                                                            <td className="text-right py-0.5 pr-1.5 font-bold text-blue-900 text-[10px]">
                                                                                {fmtCur(mValPort)}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })()}
                                                            </React.Fragment>
                                                        );
                                                    })}"""

new_card3_block = """                                                    {portItems.map((item, idx) => {
                                                        const isChile = chileanPorts.includes((item.port_id || '').toUpperCase());
                                                        const lmCost = (isChile && item.cost >= 2500) ? 2500 : 0;
                                                        const trForPort = result?.tramos?.[idx === 0 ? 0 : idx - 1];
                                                        const mValPort = (item.role === 'POL' || idx === 0)
                                                            ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0)
                                                            : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx]?.muellaje_cost || 0);
                                                        const baseAgencyCost = Math.max(0, item.cost - lmCost - mValPort);

                                                        return (
                                                            <React.Fragment key={idx}>
                                                                <tr className="border-b border-slate-100">
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
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}"""

code = code.replace(old_card3_block, new_card3_block)

# Update Card 4 (Financial Voyage Result)
old_card4_block = """                                            {/* 5. Port Costs dinámicos */}
                                            {portItems.map((item, idx) => {
                                                const trForPort = result?.tramos?.[idx === 0 ? 0 : idx - 1];
                                                const mValPort = (item.role === 'POL' || idx === 0)
                                                    ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0)
                                                    : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx]?.muellaje_cost || 0);

                                                return (
                                                    <React.Fragment key={idx}>
                                                        <tr className="border-b border-emerald-100/60">
                                                            <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                                (-) Port Costs {item.label}
                                                            </td>
                                                            <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                                -{fmtCur(item.cost)}
                                                            </td>
                                                        </tr>
                                                        {mValPort > 0 && (
                                                            <tr className="border-b border-emerald-100/60 bg-blue-50/50">
                                                                <td className="py-0.5 pl-3 text-blue-900 font-sans text-[10px] font-bold">
                                                                    ↳ Muellaje ({item.port_id})
                                                                </td>
                                                                <td className="text-right py-0.5 pr-1 font-bold text-blue-900 text-[10px]">
                                                                    -{fmtCur(mValPort)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}"""

new_card4_block = """                                            {/* 5. Port Costs dinámicos */}
                                            {portItems.map((item, idx) => {
                                                const isChile = chileanPorts.includes((item.port_id || '').toUpperCase());
                                                const lmCost = (isChile && item.cost >= 2500) ? 2500 : 0;
                                                const trForPort = result?.tramos?.[idx === 0 ? 0 : idx - 1];
                                                const mValPort = (item.role === 'POL' || idx === 0)
                                                    ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0)
                                                    : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx]?.muellaje_cost || 0);
                                                const baseAgencyCost = Math.max(0, item.cost - lmCost - mValPort);

                                                return (
                                                    <React.Fragment key={idx}>
                                                        <tr className="border-b border-emerald-100/60">
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
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}"""

code = code.replace(old_card4_block, new_card4_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("PURE AGENCY PORT COSTS BREAKDOWN UPDATED SUCCESSFULLY!")
