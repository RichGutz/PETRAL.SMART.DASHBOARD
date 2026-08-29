import urllib.request
import json
import time
import pypdf

sample_html = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>PETRAL_MULTICOTIZADOR</title>
    <style>
        @page { size: A4 landscape; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; color: #0f172a; padding: 5mm; }
        .grid { display: flex; gap: 6px; }
        .col { flex: 1; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px; }
        table { width: 100%; border-collapse: collapse; font-size: 8px; font-family: monospace; }
        th, td { border-bottom: 1px solid #e2e8f0; padding: 2px 4px; }
        th { background: #f8fafc; font-weight: bold; }
    </style>
</head>
<body>
    <div style="width: 287mm; height: 195mm; border: 1px solid #94a3b8; padding: 6px;">
        <h2 style="font-size: 14px; margin-bottom: 4px;">NAVIERA PETRAL S.A. - MULTICOTIZADOR COMERCIAL</h2>
        <div class="grid">
            <div class="col">
                <h4>Bunker Expenses</h4>
                <p>1. Mar: 58.0T IFO + 0.0T MDO | $56,128</p>
                <p>2. Pto: 6.4T IFO + 1.1T MDO | $9,726</p>
                <p>3. Dem: 0.0T IFO + 0.0T MDO | $0</p>
                <h4 style="margin-top: 8px;">Costo Arriendo Naves: $0 USD</h4>
            </div>
            <div class="col"><h4>Port Costs</h4><p>Total: $35,000</p></div>
            <div class="col"><h4>Comisiones & Demurrage</h4><p>Broker: 1.25%</p></div>
            <div class="col"><h4>P&L Result</h4><p>Net PnL: $120,500</p></div>
        </div>
    </div>
</body>
</html>"""

url = 'https://forecast.geeksoft.tech/api/v1/utils/generate-pdf'
payload = json.dumps({'html': sample_html, 'filename': 'test_weasy_instant.pdf'}).encode('utf-8')
req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})

t0 = time.time()
with urllib.request.urlopen(req, timeout=10) as resp:
    data = resp.read()
    t1 = time.time()

with open('scratch/test_weasy_instant.pdf', 'wb') as f:
    f.write(data)

reader = pypdf.PdfReader('scratch/test_weasy_instant.pdf')
page = reader.pages[0]
w_mm = float(page.mediabox.width) * 25.4 / 72
h_mm = float(page.mediabox.height) * 25.4 / 72
print(f'STATUS: 200 OK - Bytes: {len(data)} - Tiempo de generacion: {t1-t0:.2f}s')
print(f'Paginas: {len(reader.pages)} - Dimensiones: {w_mm:.1f}mm x {h_mm:.1f}mm')
