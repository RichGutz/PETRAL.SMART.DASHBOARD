import os

f1 = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\multicotizador\VesselFactSheetHeader.tsx'
with open(f1, 'r', encoding='utf-8') as f:
    c1 = f.read()
c1 = c1.replace('mb-3', 'mb-1')
with open(f1, 'w', encoding='utf-8') as f:
    f.write(c1)

f2 = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\multicotizador\SpreadsheetTramosGrid.tsx'
with open(f2, 'r', encoding='utf-8') as f:
    c2 = f.read()
c2 = c2.replace('mb-3', 'mb-1')
with open(f2, 'w', encoding='utf-8') as f:
    f.write(c2)

print("SUBCOMPONENT MARGINS COMPACTED SUCCESSFULLY!")
