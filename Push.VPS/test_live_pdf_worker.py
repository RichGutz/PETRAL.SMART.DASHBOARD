import requests

def test_weasyprint():
    url = 'https://forecast.geeksoft.tech/api/v1/forecast/generate-pdf'
    html_test = """<!DOCTYPE html>
<html>
<head>
    <style>
        @page { size: A4 landscape; margin: 5mm; }
        body { font-family: sans-serif; }
    </style>
</head>
<body>
    <h1 style="color: #0284c7;">PETRAL SMART DASHBOARD - TEST A4 LANDSCAPE</h1>
    <p>Prueba de orientacion horizontal generada por WeasyPrint en el VPS de Produccion.</p>
</body>
</html>"""
    
    print(f"Probando endpoint en vivo: {url}")
    res = requests.post(url, json={'html': html_test, 'filename': 'TEST_PETRAL_LANDSCAPE.pdf'})
    print(f"STATUS CODE: {res.status_code}")
    print(f"CONTENT-TYPE: {res.headers.get('content-type')}")
    print(f"CONTENT-DISPOSITION: {res.headers.get('content-disposition')}")
    print(f"PDF BYTES: {len(res.content)} bytes")
    
    if res.status_code == 200 and len(res.content) > 1000:
        with open('test_weasyprint_landscape.pdf', 'wb') as f:
            f.write(res.content)
        print("✅ ARCHIVO PDF BINARIO RECIBIDO Y GUARDADO EXITOSAMENTE: test_weasyprint_landscape.pdf")
    else:
        print("❌ Error en la respuesta:", res.text)

if __name__ == "__main__":
    test_weasyprint()
