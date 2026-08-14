import os

path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("const [vData, pData, rData, cData, contractsData] = await Promise.all([", "const [vData, pData, rData, cData] = await Promise.all([")
code = code.replace("ForecastService.getClients(),\n                    ForecastService.getContractsMaster()", "ForecastService.getClients()")

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("UNUSED CONTRACTS DATA FIXED!")
