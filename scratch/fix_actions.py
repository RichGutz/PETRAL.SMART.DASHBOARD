with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

replacement = """        for (let i = 0; i < tramos.length; i++) {
            const origConf = legsConfig.find(c => c.idx === i);
            const destConf = legsConfig.find(c => c.idx === i + 1);
            
            if (origConf && origConf.action === 'CARGAR') {
                tramos[i].quantity = origConf.quantity;
                tramos[i].freight_rate = origConf.freight_rate;
            }
            if (origConf) tramos[i].origin_action = origConf.action;
            if (destConf) tramos[i].destination_action = destConf.action;
            
            if (!tramos[i].type) {
                tramos[i].type = (origConf && origConf.action === 'NONE') ? 'BALLAST' : 'LADEN';
            }
        }"""

c = c.replace("""        for (let i = 0; i < tramos.length; i++) {
            const conf = legsConfig.find(c => c.idx === i);
            if (conf && conf.action === 'CARGAR') {
                tramos[i].quantity = conf.quantity;
                tramos[i].freight_rate = conf.freight_rate;
            }
            if (!tramos[i].type) {
                tramos[i].type = (conf && conf.action === 'NONE') ? 'BALLAST' : 'LADEN';
            }
        }""", replacement)

with open('Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/VoyageLedgerFinal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print("Done")
