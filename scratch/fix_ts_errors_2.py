import re

with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace all occurrences of setQuantityOverride with a dummy function or just remove them
c = re.sub(r'onChange=\{\(e: any\) => setQuantityOverride.*?\}', 'readOnly', c)
c = re.sub(r'onChange=\{\(val: any\) => setQuantityOverride.*?\}', 'readOnly', c)

with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Fixed")
