path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("backendTime to Count", "backendTimeToCount")

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("VARIABLE NAME FIXED SUCCESSFULLY!")
