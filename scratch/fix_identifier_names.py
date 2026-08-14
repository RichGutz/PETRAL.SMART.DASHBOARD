path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Fix function names with spaces
code = code.replace("getAutoPortTime to Count", "getAutoPortTimeToCount")
code = code.replace("time to count:", "time_to_count:")
code = code.replace(".time to count", ".time_to_count")
code = code.replace("time to count", "time_to_count")

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("IDENTIFIER NAMES FIXED SUCCESSFULLY!")
