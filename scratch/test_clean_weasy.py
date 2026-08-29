import urllib.request
import json
import time

clean_html = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>PETRAL_MULTICOTIZADOR</title>
    <style>
        @page { size: A4 landscape; margin: 0; }
        body { font-family: sans-serif; margin: 0; padding: 10px; background: #ffffff; }
    </style>
</head>
<body>
    <div style="width: 290mm; height: 200mm; border: 1px solid #cbd5e1; padding: 10px;">
        <h2>NAVIERA PETRAL S.A. - MULTICOTIZADOR FOXIT READY</h2>
        <p>Generado limpiamente sin scripts externos</p>
    </div>
</body>
</html>"""

url = 'https://forecast.geeksoft.tech/api/v1/utils/generate-pdf'
req = urllib.request.Request(url, data=json.dumps({'html': clean_html, 'filename': 'clean_test.pdf'}).encode('utf-8'), headers={'Content-Type': 'application/json'})

t0 = time.time()
with urllib.request.urlopen(req, timeout=10) as resp:
    data = resp.read()
    t1 = time.time()
    print(f'STATUS: {resp.status} - PDF Bytes: {len(data)} - Tiempo: {t1-t0:.2f} segundos')
