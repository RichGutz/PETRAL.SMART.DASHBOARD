path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update autoFillPortCost to set muellaje_cost in puertosConfig
old_autofill = """                setPuertosConfig(prev => {
                    const list = [...prev];
                    if (list[idx]) {
                        list[idx].manual_port_cost = res.total_cost > 0 ? res.total_cost : '';
                    }
                    return list;
                });"""

new_autofill = """                setPuertosConfig(prev => {
                    const list = [...prev];
                    if (list[idx]) {
                        list[idx].manual_port_cost = res.total_cost > 0 ? res.total_cost : '';
                        list[idx].muellaje_cost = res.breakdown?.muellaje || 0;
                    }
                    return list;
                });"""

code = code.replace(old_autofill, new_autofill)

# 2. Update Leg 0 mVal calculation
old_mval_0 = "const mVal = result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || 0;"
new_mval_0 = "const mVal = result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0;"

code = code.replace(old_mval_0, new_mval_0)

# 3. Update Leg 0 Checkbox condition
old_chk_0 = "(result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || 0) > 0"
new_chk_0 = "(result?.tramos?.[0]?.muellaje_cost_origin || result?.tramos?.[0]?.agency_costs_origin_details?.breakdown?.muellaje || puertosConfig[0]?.muellaje_cost || 0) > 0"

code = code.replace(old_chk_0, new_chk_0)

# 4. Update Leg 1..N mVal calculation
old_mval_N = "const mVal = trResult?.muellaje_cost_dest || trResult?.agency_costs_destination_details?.breakdown?.muellaje || 0;"
new_mval_N = "const mVal = trResult?.muellaje_cost_dest || trResult?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx + 1]?.muellaje_cost || 0;"

code = code.replace(old_mval_N, new_mval_N)

# 5. Update Leg 1..N Checkbox condition
old_chk_N = "(trResult?.muellaje_cost_dest || trResult?.agency_costs_destination_details?.breakdown?.muellaje || 0) > 0"
new_chk_N = "(trResult?.muellaje_cost_dest || trResult?.agency_costs_destination_details?.breakdown?.muellaje || puertosConfig[idx + 1]?.muellaje_cost || 0) > 0"

code = code.replace(old_chk_N, new_chk_N)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("AUTOFILL MUELLAJE COST ENHANCEMENT APPLIED SUCCESSFULLY!")
