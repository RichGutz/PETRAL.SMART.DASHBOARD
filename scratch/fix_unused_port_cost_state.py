import os

path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("const [localPortCostMode, setLocalPortCostMode] = useState<'static' | 'matrix'>(initialPortCostMode);", "// const [localPortCostMode, setLocalPortCostMode] = useState<'static' | 'matrix'>(initialPortCostMode);")

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("UNUSED PORT COST STATE WARN FIXED!")
