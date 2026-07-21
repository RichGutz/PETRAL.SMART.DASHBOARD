with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("catch (err) {", "catch (err: any) {")

with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print("Done")
