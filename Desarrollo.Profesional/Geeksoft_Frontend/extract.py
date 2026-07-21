import re
with open('src/components/CommercialForecast/VoyageLedgerTest.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

start_marker = "onClick={() => {"
end_marker = "Imprimir Acta PDF</span>"

start = c.find(start_marker, c.find("if (!runResult || !runResult.audit_trail)")) - 45
end = c.find(end_marker, start) + len(end_marker) + 30

button_code = c[start:end]

with open('button.txt', 'w', encoding='utf-8') as f:
    f.write(button_code)
