with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix Route Select
c = c.replace('<SelectValue placeholder="Seleccione una ruta">{routes.find(r => r.route_id === selectedRouteId)?.name || ""}</SelectValue>', '<SelectValue placeholder="Seleccione una ruta" />')

# Fix Vessel Select
c = c.replace('<SelectValue placeholder="Seleccione un buque">{vessels.find(v => v.vessel_id === selectedVesselId)?.vessel_name || ""}</SelectValue>', '<SelectValue placeholder="Seleccione un buque" />')

# Also fix the corrupted arrow character
c = c.replace('z?', '->')

with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print("Done")
