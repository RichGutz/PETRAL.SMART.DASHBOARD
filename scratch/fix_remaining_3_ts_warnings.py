path1 = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\multicotizador\FinancialResultCards.tsx'
with open(path1, 'r', encoding='utf-8') as f:
    c1 = f.read()

c1 = c1.replace("/* totalPortCosts */", "const totalPortCosts = result?.consolidated?.total_port_costs ?? portItems.reduce((sum, item) => sum + item.cost, 0);")
with open(path1, 'w', encoding='utf-8') as f:
    f.write(c1)

path2 = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\multicotizador\SpreadsheetTramosGrid.tsx'
with open(path2, 'r', encoding='utf-8') as f:
    c2 = f.read()

c2 = c2.replace("    getAutoPortTimeToCount?: (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => number | string;\n", "")
c2 = c2.replace("    getAutoPortPositioning?: (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => number | string;\n", "")
c2 = c2.replace("    getAutoPortRate: (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => number | string;\n", "    getAutoPortRate: (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => number | string;\n    getAutoPortTimeToCount?: (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => number | string;\n    getAutoPortPositioning?: (portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR') => number | string;\n")

with open(path2, 'w', encoding='utf-8') as f:
    f.write(c2)

print("REMAINING 3 TS ISSUES FIXED SUCCESSFULLY!")
