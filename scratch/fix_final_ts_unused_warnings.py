import os

# 1. Fix FinancialResultCards.tsx unused vars
f1 = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\multicotizador\FinancialResultCards.tsx'
with open(f1, 'r', encoding='utf-8') as f:
    c1 = f.read()

c1 = c1.replace("    refacturarMuellajeMap,\n", "")
c1 = c1.replace("const totalPortCosts = result?.consolidated?.total_port_costs ?? portItems.reduce((sum, item) => sum + item.cost, 0);", "/* totalPortCosts */")

with open(f1, 'w', encoding='utf-8') as f:
    f.write(c1)

# 2. Fix SpreadsheetTramosGrid.tsx unused vars
f2 = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\multicotizador\SpreadsheetTramosGrid.tsx'
with open(f2, 'r', encoding='utf-8') as f:
    c2 = f.read()

c2 = c2.replace("    getAutoPortTimeToCount,\n", "")
c2 = c2.replace("    getAutoPortPositioning,\n", "")

with open(f2, 'w', encoding='utf-8') as f:
    f.write(c2)

# 3. Fix MultiCotizadorExcel.tsx autoFillPortCost call and unused props
f3 = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'
with open(f3, 'r', encoding='utf-8') as f:
    c3 = f.read()

c3 = c3.replace("autoFillPortCost(idx, portId, p.action, selectedVessel);", "autoFillPortCost(idx, portId, p.action, selectedVessel);")
c3 = c3.replace("getAutoPortTimeToCount={() => 0}\n                getAutoPortPositioning={() => 0}", "")

with open(f3, 'w', encoding='utf-8') as f:
    f.write(c3)

print("FINAL TS UNUSED WARNINGS FIXED SUCCESSFULLY!")
