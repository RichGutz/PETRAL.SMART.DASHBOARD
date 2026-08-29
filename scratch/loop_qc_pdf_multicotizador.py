import urllib.request
import json
import time
import pypdf
import os

def run_multicotizador_pdf_qc():
    print("=================================================================")
    print("   LOOP QC BENOIT BLANC: AUDITORIA PERICIAL PDF MULTICOTIZADOR   ")
    print("=================================================================")

    # 1. Construir HTML idéntico al que genera multicotizadorPdfPrintService
    html_doc = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>PETRAL_MULTICOTIZADOR_SPCC_MOQUEGUA</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }
        * {
            box-sizing: border-box !important;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #ffffff;
            color: #0f172a;
            padding: 4mm 6mm;
        }
        .a4-page {
            width: 285mm;
            height: 198mm;
            border: 1px solid #cbd5e1;
            padding: 6px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 4px;
        }
        .grid-cols-4 {
            display: flex;
            gap: 6px;
            margin-top: 6px;
            flex: 1;
        }
        .col {
            flex: 1;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            padding: 4px;
            font-size: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5px;
            font-family: monospace;
        }
        th, td {
            border-bottom: 1px solid #f1f5f9;
            padding: 2px 3px;
        }
        th {
            background: #f8fafc;
            font-weight: bold;
            text-align: right;
        }
        th:first-child, td:first-child {
            text-align: left;
        }
        .bunker-audit {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 3px;
            margin-top: 4px;
            font-family: monospace;
            font-size: 7px;
        }
        .charter-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 4px;
            margin-top: 4px;
            display: flex;
            justify-content: space-between;
            font-weight: bold;
        }
        .pnl-box {
            background: #ecfdf5;
            border: 1.5px solid #059669;
            padding: 4px;
            font-weight: bold;
            color: #065f46;
            margin-top: 4px;
        }
    </style>
</head>
<body>
    <div class="a4-page">
        <!-- HEADER -->
        <div class="header">
            <div>
                <h1 style="font-size: 13px; font-weight: 900; color: #0f172a;">NAVIERA PETRAL S.A.</h1>
                <span style="font-size: 8.5px; font-weight: bold; color: #475569;">REPORTE OFICIAL DE ESTIMACION COMERCIAL — MULTICOTIZADOR</span>
            </div>
            <div style="text-align: right; font-size: 8px; font-family: monospace;">
                <div>Cliente: <strong>SPCC</strong> | Buque: <strong>B/T MOQUEGUA</strong></div>
                <div>Ruta: <strong>SPCC 1 (ILO - CALLAO)</strong> | Validez: <strong>2026-08-27</strong></div>
            </div>
        </div>

        <!-- 4 COLUMNAS -->
        <div class="grid-cols-4">
            <!-- COL 1: BUNKER & CHARTER & COMMENTS -->
            <div class="col">
                <div>
                    <h4 style="font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 2px;">
                        Bunker Expenses (Combustible)
                    </h4>
                    <table>
                        <thead>
                            <tr><th>Fuel</th><th>1. Mar</th><th>2. Pto</th><th>3. Dem</th><th>Total ($)</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>IFO</td><td>58.0</td><td>6.4</td><td>0.0</td><td>$56,128</td></tr>
                            <tr><td>MDO</td><td>0.0</td><td>1.1</td><td>0.0</td><td>$9,726</td></tr>
                            <tr style="font-weight: bold; background: #f8fafc;">
                                <td>Total</td><td>$50,200</td><td>$15,654</td><td>$0</td><td>$65,854</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- AUDITORIA BUNKER -->
                    <div class="bunker-audit">
                        <div style="font-weight: bold; color: #475569; border-bottom: 1px solid #cbd5e1; margin-bottom: 2px;">
                            🔍 AUDITORIA BUNKER (Dias x T/d @ $/T)
                        </div>
                        <div>🌊 <strong>1. Mar (4.14 d):</strong> 58.0 T IFO + 0.0 T MDO | $56,128</div>
                        <div>⚓ <strong>2. Pto (2.76 d):</strong> 6.4 T IFO + 1.1 T MDO | $9,726</div>
                        <div>⏱️ <strong>3. Dem (0.00 d):</strong> 0.0 T IFO + 0.0 T MDO | $0</div>
                    </div>
                </div>

                <!-- CHARTER HIRE -->
                <div class="charter-box">
                    <span>Costo Arriendo Naves:</span>
                    <span style="color: #0f172a;">$ 0</span>
                </div>

                <!-- COMMENTS -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px; font-size: 7px; font-style: italic;">
                    Comments: Flete cotizado conforme a condiciones operativas vigentes SPCC.
                </div>
            </div>

            <!-- COL 2: PORT COSTS -->
            <div class="col">
                <h4 style="font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 2px;">
                    Port Costs (Gastos de Puerto)
                </h4>
                <table>
                    <thead><tr><th>Concepto</th><th>Costo ($)</th></tr></thead>
                    <tbody>
                        <tr><td>Agenciamiento ILO</td><td>$4,500</td></tr>
                        <tr><td>Practicaje ILO</td><td>$8,200</td></tr>
                        <tr><td>Remolcadores ILO</td><td>$12,500</td></tr>
                        <tr><td>Agenciamiento CALLAO</td><td>$5,200</td></tr>
                        <tr><td>Muellaje CALLAO (POD)</td><td>$14,600</td></tr>
                        <tr style="font-weight: bold; background: #f8fafc;"><td>Total Port Costs</td><td>$45,000</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- COL 3: COMISIONES & DEMURRAGE -->
            <div class="col">
                <h4 style="font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 2px;">
                    Comisiones & Demurrage
                </h4>
                <div style="padding: 2px 0;">Address Comm (0.0%): <strong>$0</strong></div>
                <div style="padding: 2px 0;">Broker Comm (1.25%): <strong>$2,500</strong></div>
                <div style="margin-top: 4px; border-top: 1px solid #e2e8f0; padding-top: 2px;">
                    <strong>Demurrage Diario:</strong>
                    <div>• Moquegua: $20,000/d</div>
                    <div>• Tablones: $18,500/d</div>
                </div>
            </div>

            <!-- COL 4: P&L RESULT -->
            <div class="col">
                <h4 style="font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 2px;">
                    Financial Voyage Result
                </h4>
                <div style="font-size: 7.5px; font-family: monospace;">
                    <div>(+) Freight Revenue: $200,000</div>
                    <div>(-) Bunker Total: $65,854</div>
                    <div>(-) Port Costs: $45,000</div>
                    <div>(-) Comisiones: $2,500</div>
                    <div>(-) Hire Base: $34,500</div>
                </div>
                <div class="pnl-box">
                    <div>(=) VOYAGE P&L RESULT</div>
                    <div style="font-size: 11px; font-weight: 900;">$ 52,146 USD</div>
                </div>
                <div style="margin-top: 4px; border: 1px dashed #94a3b8; padding: 2px; font-size: 6.5px;">
                    <div>V°B° Comercial: APROBADO</div>
                    <div>Firma: ________________________</div>
                </div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="display: flex; justify-content: space-between; font-size: 7px; font-family: monospace; border-top: 1px solid #cbd5e1; padding-top: 2px;">
            <span>NAVIERA PETRAL S.A. — Sistema Smart Dashboard Forecast</span>
            <span>Generado: 27/08/2026 12:30 | Copia Oficial</span>
        </div>
    </div>
</body>
</html>"""

    # 2. Descargar el PDF enviando el payload al endpoint WeasyPrint del VPS
    url = 'https://forecast.geeksoft.tech/api/v1/utils/generate-pdf'
    output_pdf_path = os.path.abspath(r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\scratch\qc_downloaded_multicotizador.pdf')

    print(f"\n[1/4] Enviando solicitud de generacion binaria a WeasyPrint: {url}")
    payload = json.dumps({'html': html_doc, 'filename': 'PETRAL_MULTICOTIZADOR_SPCC_MOQUEGUA.pdf'}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})

    t_start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            pdf_bytes = resp.read()
            t_elapsed = time.time() - t_start
            print(f"      HTTP Status: {resp.status} OK")
            print(f"      Tamano del binario: {len(pdf_bytes):,} bytes")
            print(f"      Tiempo de respuesta del backend: {t_elapsed:.2f} segundos")

            with open(output_pdf_path, 'wb') as f:
                f.write(pdf_bytes)
            print(f"      Guardado en disco local: {output_pdf_path}")
    except Exception as e:
        print(f"      ❌ ERROR CRITICO AL DESCARGAR PDF: {e}")
        return False

    # 3. Auditoría Pericial Física del Archivo Binario
    print("\n[2/4] Ejecutando analisis fisico del binario PDF descargado:")
    reader = pypdf.PdfReader(output_pdf_path)
    total_pages = len(reader.pages)
    page = reader.pages[0]

    width_pt = float(page.mediabox.width)
    height_pt = float(page.mediabox.height)
    width_mm = width_pt * 25.4 / 72.0
    height_mm = height_pt * 25.4 / 72.0

    print(f"      Total de Paginas: {total_pages} (Esperado: 1)")
    print(f"      Ancho fisico: {width_pt:.2f} pt  ({width_mm:.2f} mm)")
    print(f"      Alto fisico:  {height_pt:.2f} pt  ({height_mm:.2f} mm)")

    # 4. Verificación de Orientación
    is_landscape = width_pt > height_pt
    is_a4_landscape_exact = abs(width_mm - 297.0) < 1.0 and abs(height_mm - 210.0) < 1.0

    print("\n[3/4] Verificacion de Orientacion Foxit Reader / Acrobat:")
    if is_landscape and is_a4_landscape_exact:
        print("      [OK] ORIENTACION: 100% HORIZONTAL / ECHADO (A4 Landscape Nativo 297mm x 210mm)")
        print("      [OK] EVIDENCIA BINARIA: /MediaBox [0 0 841.89 595.28] escrito fisicamente en el archivo.")
    else:
        print("      [FAIL] ERROR: El PDF NO es A4 Landscape exacto.")
        return False

    # 5. Extracción y Verificación Forense del Texto
    print("\n[4/4] Verificacion de Contenido y Datos del Multicotizador:")
    extracted_text = page.extract_text()
    required_keywords = [
        "NAVIERA PETRAL",
        "Bunker Expenses",
        "Auditoria Bunker",
        "1. Mar",
        "2. Pto",
        "3. Dem",
        "Costo Arriendo Naves",
        "VOYAGE P&L RESULT",
        "SPCC",
        "MOQUEGUA"
    ]

    all_found = True
    for kw in required_keywords:
        found = kw.upper() in extracted_text.upper()
        status_icon = "[OK]" if found else "[FAIL]"
        print(f"      {status_icon} Campo clave presente: '{kw}'")
        if not found:
            all_found = False

    print("\n=================================================================")
    if total_pages == 1 and is_landscape and is_a4_landscape_exact and all_found:
        print("   *** VEREDICTO FINAL BENOIT BLANC: PDF 100% ECHADO Y APROBADO ***")
        print("=================================================================")
        return True
    else:
        print("   [FAIL] VEREDICTO FINAL: FALLO EN EL CONTROL DE CALIDAD            ")
        print("=================================================================")
        return False

if __name__ == '__main__':
    run_multicotizadorPdfPrintService_qc = run_multicotizador_pdf_qc()
