import os

path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("export const MultiCotizadorExcel: React.FC<MultiCotizadorExcelProps> = ({ portCostMode: initialPortCostMode = 'static' }) => {", "export const MultiCotizadorExcel: React.FC<MultiCotizadorExcelProps> = () => {")

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("PROPS WARN FIXED!")
