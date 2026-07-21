with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

replacement = """        for (let i = 0; i < tramos.length; i++) {
            const conf = legsConfig.find(c => c.idx === i);
            if (conf && conf.action === 'CARGAR') {
                tramos[i].quantity = conf.quantity;
                tramos[i].freight_rate = conf.freight_rate;
            }
            if (!tramos[i].type) {
                tramos[i].type = (conf && conf.action === 'NONE') ? 'BALLAST' : 'LADEN';
            }
        }"""

c = c.replace("""        for (let i = 0; i < tramos.length; i++) {
            const conf = legsConfig.find(c => c.idx === i);
            if (conf && conf.action === 'CARGAR') {
                tramos[i].quantity = conf.quantity;
                tramos[i].freight_rate = conf.freight_rate;
            }
        }""", replacement)

# Add alert in catch block so the user actually sees backend errors next time!
c = c.replace("alert('Error en el cálculo.');", "alert('Error en el cálculo: ' + (err.response?.data?.detail || err.message));")

with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print("Done")
