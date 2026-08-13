path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Card 3 update
old_card3 = """                                                                     const mValPort = (item.role === 'POL' || idx === 0)
                                                                        ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || 0)
                                                                        : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || 0);"""

new_card3 = """                                                                     const mValPort = (item.role === 'POL' || idx === 0)
                                                                        ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0)
                                                                        : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx]?.muellaje_cost || 0);"""

code = code.replace(old_card3, new_card3)

# Card 4 update
old_card4 = """                                                const mValPort = (item.role === 'POL' || idx === 0)
                                                    ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || 0)
                                                    : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || 0);"""

new_card4 = """                                                const mValPort = (item.role === 'POL' || idx === 0)
                                                    ? (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0)
                                                    : (trForPort?.muellaje_cost_dest || trForPort?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx]?.muellaje_cost || 0);"""

code = code.replace(old_card4, new_card4)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("CARD 3 AND CARD 4 MUELLAJE FALLBACK UPDATED SUCCESSFULLY!")
