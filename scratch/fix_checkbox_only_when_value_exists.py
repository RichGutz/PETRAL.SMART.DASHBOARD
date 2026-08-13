path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Leg 0: Update condition on Checkbox cell
for i in range(2860, 2900):
    if "puertosConfig[0].action !== 'NONE'" in lines[i]:
        lines[i] = lines[i].replace(
            "puertosConfig[0].action !== 'NONE'",
            "puertosConfig[0].action !== 'NONE' && (result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || 0) > 0"
        )
        print("Updated Leg 0 Checkbox condition!")
        break

# Leg 1..N: Update condition on Checkbox cell
for i in range(3120, 3150):
    if "puertosConfig[idx + 1].action !== 'NONE'" in lines[i]:
        lines[i] = lines[i].replace(
            "puertosConfig[idx + 1].action !== 'NONE'",
            "puertosConfig[idx + 1].action !== 'NONE' && (trResult?.muellaje_cost_dest || trResult?.agency_costs_destination_details?.breakdown?.muellaje || 0) > 0"
        )
        print("Updated Leg 1..N Checkbox condition!")
        break

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("CHECKBOX RENDERING CONDITIONAL ON MUELLAJE > 0 SUCESSFULLY UPDATED!")
