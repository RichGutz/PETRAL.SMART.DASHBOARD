path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\multicotizador\FinancialResultCards.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("const totalPortCosts = result?.consolidated?.total_port_costs ?? portItems.reduce((sum, item) => sum + item.cost, 0);", "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("UNUSED totalPortCosts DECLARATIONS REMOVED SUCCESSFULLY!")
