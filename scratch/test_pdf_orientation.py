import urllib.request
import json
import pypdf

url = 'https://forecast.geeksoft.tech/api/v1/utils/generate-pdf'

html_sample = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>PETRAL_MULTICOTIZADOR_SPCC_MOQUEGUA</title>
    <style>
        @page { size: A4 landscape; margin: 0; }
        body { font-family: sans-serif; margin: 0; padding: 10px; background: #ffffff; }
    </style>
</head>
<body>
    <div style="width: 290mm; height: 200mm; border: 1px solid #cbd5e1; padding: 10px;">
        <h2>NAVIERA PETRAL S.A. - COTIZACION MULTICOTIZADOR</h2>
        <p>Auditoría Búnker: 1. Mar (4.14 d): 58.0 T IFO + 0.0 T MDO | Costo Arriendo Naves: $0 USD</p>
    </div>
</body>
</html>"""

payload = json.dumps({'html': html_sample, 'filename': 'test_multicotizador.pdf'}).encode('utf-8')
req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})

with urllib.request.urlopen(req) as resp:
    pdf_bytes = resp.read()
    with open(r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\scratch\test_multicotizador.pdf', 'wb') as f:
        f.write(pdf_bytes)

reader = pypdf.PdfReader(r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\scratch\test_multicotizador.pdf')
page = reader.pages[0]
print('=== VALIDACION FISICA DEL PDF GENERADO ===')
print('Paginas totales:', len(reader.pages))
print('Ancho (pt):', float(page.mediabox.width), '--> mm:', float(page.mediabox.width) * 25.4 / 72)
print('Alto  (pt):', float(page.mediabox.height), '--> mm:', float(page.mediabox.height) * 25.4 / 72)
print('Orientacion Foxit:', 'HORIZONTAL / ECHADO (LANDSCAPE) ✅' if page.mediabox.width > page.mediabox.height else 'VERTICAL ❌')
