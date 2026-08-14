path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Subtle Refacturación Muellaje under Flete Bruto in Card 4
old_refact_block = """                                            {/* 1.b Refacturación de Muellaje */}
                                            {refacturacionMuellajeUsd > 0 && (
                                                <tr className="border-b border-emerald-100/60 bg-emerald-100/30">
                                                    <td className="py-0.5 pl-1 text-emerald-900 font-sans text-[10.5px] font-bold">
                                                        (+) Refacturación Muellaje (USD)
                                                    </td>
                                                    <td className="text-right py-0.5 pr-1 font-bold text-emerald-800">
                                                        +{fmtCur(refacturacionMuellajeUsd)}
                                                    </td>
                                                </tr>
                                            )}"""

new_refact_block = """                                            {/* 1.b Refacturación de Muellaje (Formato sutil secundario debajo de Flete Bruto) */}
                                            {refacturacionMuellajeUsd > 0 && (
                                                <tr className="border-b border-emerald-100/40 bg-slate-50/50">
                                                    <td className="py-0.5 pl-2 text-slate-500 font-sans text-[9.5px] font-normal italic">
                                                        (+) Refacturación Muellaje (al cliente)
                                                    </td>
                                                    <td className="text-right py-0.5 pr-1 font-mono text-[9.5px] text-slate-500 font-medium">
                                                        +{fmtCur(refacturacionMuellajeUsd)}
                                                    </td>
                                                </tr>
                                            )}"""

code = code.replace(old_refact_block, new_refact_block)

# 2. Hide Zero Port Costs in Card 3
old_card3_map = """                                                    {portItems.map((item, idx) => {
                                                        const isChile = CHILEAN_PORTS.includes((item.port_id || '').toUpperCase());
                                                        const lmCost = (isChile && item.cost >= 2500) ? 2500 : 0;
                                                        const trForPort = result?.tramos?.[idx === 0 ? 0 : idx - 1];
                                                        const mValPort = (item.role === 'POL' || idx === 0)
                                                            ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0)
                                                            : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx]?.muellaje_cost || 0);
                                                        const baseAgencyCost = Math.max(0, item.cost - lmCost - mValPort);

                                                        return (
                                                            <React.Fragment key={idx}>
                                                                <tr className="border-b border-slate-100">
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
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}"""

new_card3_map = """                                                    {portItems.map((item, idx) => {
                                                        const isChile = CHILEAN_PORTS.includes((item.port_id || '').toUpperCase());
                                                        const lmCost = (isChile && item.cost >= 2500) ? 2500 : 0;
                                                        const trForPort = result?.tramos?.[idx === 0 ? 0 : idx - 1];
                                                        const mValPort = (item.role === 'POL' || idx === 0)
                                                            ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0)
                                                            : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx]?.muellaje_cost || 0);
                                                        const baseAgencyCost = Math.max(0, item.cost - lmCost - mValPort);

                                                        if (baseAgencyCost === 0 && lmCost === 0 && mValPort === 0) return null;

                                                        return (
                                                            <React.Fragment key={idx}>
                                                                {baseAgencyCost > 0 && (
                                                                    <tr className="border-b border-slate-100">
                                                                        <td className="py-1 pl-1.5 text-slate-650 font-bold">Port Costs {item.label}</td>
                                                                        <td className="text-right py-1 pr-1.5 font-bold">
                                                                            {fmtCur(baseAgencyCost)}
                                                                        </td>
                                                                    </tr>
                                                                )}
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
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}"""

code = code.replace(old_card3_map, new_card3_map)

# 3. Hide Zero Port Costs in Card 4
old_card4_map = """                                            {/* 5. Port Costs dinámicos */}
                                            {portItems.map((item, idx) => {
                                                const isChile = CHILEAN_PORTS.includes((item.port_id || '').toUpperCase());
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
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}"""

new_card4_map = """                                            {/* 5. Port Costs dinámicos */}
                                            {portItems.map((item, idx) => {
                                                const isChile = CHILEAN_PORTS.includes((item.port_id || '').toUpperCase());
                                                const lmCost = (isChile && item.cost >= 2500) ? 2500 : 0;
                                                const trForPort = result?.tramos?.[idx === 0 ? 0 : idx - 1];
                                                const mValPort = (item.role === 'POL' || idx === 0)
                                                    ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0)
                                                    : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx]?.muellaje_cost || 0);
                                                const baseAgencyCost = Math.max(0, item.cost - lmCost - mValPort);

                                                if (baseAgencyCost === 0 && lmCost === 0 && mValPort === 0) return null;

                                                return (
                                                    <React.Fragment key={idx}>
                                                        {baseAgencyCost > 0 && (
                                                            <tr className="border-b border-emerald-100/60">
                                                                <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                                    (-) Port Costs {item.label}
                                                                </td>
                                                                <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                                    -{fmtCur(baseAgencyCost)}
                                                                </td>
                                                            </tr>
                                                        )}
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
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}"""

code = code.replace(old_card4_map, new_card4_map)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("ZERO COST FILTER AND SUBTLE REFACTURACION APPLIED SUCCESSFULLY!")
