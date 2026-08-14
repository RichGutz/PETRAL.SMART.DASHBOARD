path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace Card 3 port cost renderer
old_card3_map = """                                                    {portItems.map((item, idx) => {
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

new_card3_map = """                                                    {portItems.map((item, idx) => {
                                                        const isChile = CHILEAN_PORTS.includes((item.port_id || '').toUpperCase());
                                                        const lmCost = (isChile && item.cost >= 2500) ? 2500 : 0;
                                                        const trForPort = result?.tramos?.[idx === 0 ? 0 : idx - 1];
                                                        const mValPort = (item.role === 'POL' || idx === 0)
                                                            ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0)
                                                            : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx]?.muellaje_cost || 0);
                                                        const baseAgencyCost = Math.max(0, item.cost - lmCost - mValPort);

                                                        // STRICT ZERO FILTER: Ocultar puerto completamente si todos sus rubros son <= 0
                                                        if (baseAgencyCost <= 0 && lmCost <= 0 && mValPort <= 0) return null;

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

code = code.replace(old_card3_map, new_card3_map)

# Replace Card 4 port cost renderer
old_card4_map = """                                            {/* 5. Port Costs dinámicos */}
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

new_card4_map = """                                            {/* 5. Port Costs dinámicos */}
                                            {portItems.map((item, idx) => {
                                                const isChile = CHILEAN_PORTS.includes((item.port_id || '').toUpperCase());
                                                const lmCost = (isChile && item.cost >= 2500) ? 2500 : 0;
                                                const trForPort = result?.tramos?.[idx === 0 ? 0 : idx - 1];
                                                const mValPort = (item.role === 'POL' || idx === 0)
                                                    ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0)
                                                    : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx]?.muellaje_cost || 0);
                                                const baseAgencyCost = Math.max(0, item.cost - lmCost - mValPort);

                                                // STRICT ZERO FILTER: Ocultar puerto completamente si todos sus rubros son <= 0
                                                if (baseAgencyCost <= 0 && lmCost <= 0 && mValPort <= 0) return null;

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

code = code.replace(old_card4_map, new_card4_map)

# 4. Hide MDO in Card 4 if mdoUsd <= 0
old_mdo_row = """                                             {/* 4. Bunker MDO */}
                                             <tr className="border-b border-emerald-100/60">
                                                 <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                     (-) Bunker MDO ({fmtNum(mdoTons)} T × {fmtCur(bunkerPriceMdo)}/T)
                                                 </td>
                                                 <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                     -{fmtCur(mdoUsd)}
                                                 </td>
                                             </tr>"""

new_mdo_row = """                                             {/* 4. Bunker MDO */}
                                             {mdoUsd > 0 && (
                                                 <tr className="border-b border-emerald-100/60">
                                                     <td className="py-0.5 pl-1 text-slate-600 font-sans text-[10.5px]">
                                                         (-) Bunker MDO ({fmtNum(mdoTons)} T × {fmtCur(bunkerPriceMdo)}/T)
                                                     </td>
                                                     <td className="text-right py-0.5 pr-1 text-slate-700 font-medium">
                                                         -{fmtCur(mdoUsd)}
                                                     </td>
                                                 </tr>
                                             )}"""

code = code.replace(old_mdo_row, new_mdo_row)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("STRICT UNIVERSAL ZERO COST FILTER APPLIED SUCCESSFULLY!")
