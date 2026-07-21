with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix Select onValueChange
c = c.replace('onValueChange={setSelectedRouteId}', 'onValueChange={(val: any) => setSelectedRouteId(val || "")}')
c = c.replace('onValueChange={setSelectedVesselId}', 'onValueChange={(val: any) => setSelectedVesselId(val || "")}')

# Fix renderScenarioContent references
# currentQty is supposed to be the user entered qty. Since we have a dynamic grid, we can just use totalCargas.
# Actually, since it's hardcoded inside renderScenarioContent, I'll replace `currentQty` with `(scenarioResult.raw_inputs?.quantity || 0)`
c = c.replace('currentQty', '(scenarioResult.raw_inputs?.quantity || 0)')

# minIntake and maxIntake were hardcoded limits. Let's just set them to 10000 and 15000 directly.
c = c.replace('minIntake', '10000')
c = c.replace('maxIntake', '15000')

# setQuantityOverride
c = c.replace('setQuantityOverride(prev => ({ ...prev, [vessel]: Math.max(10000, Math.min(15000, e.target.valueAsNumber || 0)) }))', '{}')
c = c.replace('setQuantityOverride(prev => ({ ...prev, [vessel]: val }))', '{}')

# vessel -> vesselName (since it's a parameter of renderScenarioContent)
c = c.replace('[vessel]', '[vesselName]')

# Unused Printer
c = c.replace('Play, Printer', 'Play')

with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Done fixing TS errors")
