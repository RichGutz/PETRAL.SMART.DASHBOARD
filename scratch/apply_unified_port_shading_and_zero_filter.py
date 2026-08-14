path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add PORT_THEMES at module level
old_chilean_ports = "const CHILEAN_PORTS = ['MEJILLONES', 'BARQUITO', 'PATILLOS', 'ARICA', 'SAN ANTONIO', 'VALPARAISO', 'QUINTERO'];"
new_chilean_ports = """const CHILEAN_PORTS = ['MEJILLONES', 'BARQUITO', 'PATILLOS', 'ARICA', 'SAN ANTONIO', 'VALPARAISO', 'QUINTERO'];

const PORT_THEMES = [
    { bg: 'bg-emerald-50/60', text: 'text-emerald-950', border: 'border-l-2 border-l-emerald-500' },
    { bg: 'bg-blue-50/60', text: 'text-blue-950', border: 'border-l-2 border-l-blue-500' },
    { bg: 'bg-indigo-50/60', text: 'text-indigo-950', border: 'border-l-2 border-l-indigo-500' },
    { bg: 'bg-amber-50/60', text: 'text-amber-950', border: 'border-l-2 border-l-amber-500' },
    { bg: 'bg-violet-50/60', text: 'text-violet-950', border: 'border-l-2 border-l-violet-500' },
];"""

code = code.replace(old_chilean_ports, new_chilean_ports)

# Update Card 3 (Port Costs Card)
old_card3_body = """                                                    {portItems.map((item, idx) => {
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

new_card3_body = """                                                    {portItems.map((item, idx) => {
                                                        const isChile = CHILEAN_PORTS.includes((item.port_id || '').toUpperCase());
                                                        const lmCost = (isChile && item.cost >= 2500) ? 2500 : 0;
                                                        const trForPort = result?.tramos?.[idx === 0 ? 0 : idx - 1];
                                                        const mValPort = (item.role === 'POL' || idx === 0)
                                                            ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0)
                                                            : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx]?.muellaje_cost || 0);
                                                        const baseAgencyCost = Math.max(0, item.cost - lmCost - mValPort);

                                                        if (baseAgencyCost === 0 && lmCost === 0 && mValPort === 0) return null;

                                                        const theme = PORT_THEMES[idx % PORT_THEMES.length];

                                                        return (
                                                            <React.Fragment key={idx}>
                                                                {baseAgencyCost > 0 && (
                                                                    <tr className={`border-b border-slate-200/80 ${theme.bg} ${theme.border}`}>
                                                                        <td className={`py-1 pl-2 font-bold ${theme.text}`}>Port Costs {item.label}</td>
                                                                        <td className={`text-right py-1 pr-1.5 font-bold ${theme.text}`}>
                                                                            {fmtCur(baseAgencyCost)}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                {lmCost > 0 && (
                                                                    <tr className={`border-b border-slate-200/80 ${theme.bg} ${theme.border}`}>
                                                                        <td className={`py-1 pl-2 font-bold ${theme.text}`}>Loading Master ({item.port_id})</td>
                                                                        <td className={`text-right py-1 pr-1.5 font-bold ${theme.text}`}>
                                                                            {fmtCur(lmCost)}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                {mValPort > 0 && (
                                                                    <tr className={`border-b border-slate-200/80 ${theme.bg} ${theme.border}`}>
                                                                        <td className={`py-1 pl-2 font-bold ${theme.text}`}>Muellaje ({item.port_id})</td>
                                                                        <td className={`text-right py-1 pr-1.5 font-bold ${theme.text}`}>
                                                                            {fmtCur(mValPort)}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}"""

code = code.replace(old_card3_body, new_card3_body)

# Update Card 4 (Financial Voyage Result Card)
old_card4_body = """                                            {/* 5. Port Costs dinámicos */}
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

new_card4_body = """                                            {/* 5. Port Costs dinámicos */}
                                            {portItems.map((item, idx) => {
                                                const isChile = CHILEAN_PORTS.includes((item.port_id || '').toUpperCase());
                                                const lmCost = (isChile && item.cost >= 2500) ? 2500 : 0;
                                                const trForPort = result?.tramos?.[idx === 0 ? 0 : idx - 1];
                                                const mValPort = (item.role === 'POL' || idx === 0)
                                                    ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0)
                                                    : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx]?.muellaje_cost || 0);
                                                const baseAgencyCost = Math.max(0, item.cost - lmCost - mValPort);

                                                if (baseAgencyCost === 0 && lmCost === 0 && mValPort === 0) return null;

                                                const theme = PORT_THEMES[idx % PORT_THEMES.length];

                                                return (
                                                    <React.Fragment key={idx}>
                                                        {baseAgencyCost > 0 && (
                                                            <tr className={`border-b border-emerald-100/60 ${theme.bg}`}>
                                                                <td className="py-0.5 pl-1.5 text-slate-700 font-sans text-[10.5px] font-medium">
                                                                    (-) Port Costs {item.label}
                                                                </td>
                                                                <td className="text-right py-0.5 pr-1 text-slate-800 font-bold">
                                                                    -{fmtCur(baseAgencyCost)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {lmCost > 0 && (
                                                            <tr className={`border-b border-emerald-100/60 ${theme.bg}`}>
                                                                <td className="py-0.5 pl-1.5 text-amber-950 font-sans text-[10.5px] font-bold">
                                                                    (-) Loading Master ({item.port_id})
                                                                </td>
                                                                <td className="text-right py-0.5 pr-1 font-bold text-amber-950 text-[10.5px]">
                                                                    -{fmtCur(lmCost)}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {mValPort > 0 && (
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
                                                );
                                            })}"""

code = code.replace(old_card4_body, new_card4_body)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("UNIFIED PORT SHADING AND STRICT ZERO FILTER APPLIED SUCCESSFULLY!")
