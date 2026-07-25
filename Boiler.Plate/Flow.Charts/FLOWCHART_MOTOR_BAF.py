import os

def generate_baf_svg():
    svg_content = """<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="1200" height="900" viewBox="0 0 1200 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.1"/>
    </filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/>
    </marker>
  </defs>

  <!-- Fondo General -->
  <rect width="100%" height="100%" fill="#f8fafc"/>

  <!-- Encabezado Principal -->
  <rect x="40" y="30" width="1120" height="80" rx="12" fill="url(#headerGrad)" filter="url(#shadow)"/>
  <text x="600" y="68" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">
    ⚡ FLUJOGRAMA DE ARQUITECTURA: MOTOR BAF (BUNKER ADJUSTMENT FACTOR)
  </text>
  <text x="600" y="93" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#94a3b8" text-anchor="middle">
    Indexación Paramétrica &amp; Polinómica de Fletes Marítimos • B/T Moquegua • PETRAL SMART DASHBOARD
  </text>

  <!-- Nivel 1: Inputs -->
  <rect x="40" y="140" width="1120" height="150" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,4" filter="url(#shadow)"/>
  <text x="60" y="165" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#64748b" letter-spacing="0.5">PASO 1 — INPUTS CONTRACTUALES &amp; MERCADO VIGENTE</text>

  <!-- Box 1.1 -->
  <rect x="60" y="180" width="510" height="95" rx="8" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
  <text x="80" y="205" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#0f172a">📄 Línea Base del Contrato (N-1)</text>
  <text x="80" y="230" font-family="monospace" font-size="12" fill="#334155">• Baseline IFO: $655.28/MT  |  Baseline MDO: $1,083.84/MT</text>
  <text x="80" y="250" font-family="monospace" font-size="12" fill="#2563eb" font-weight="700">• Componente BAF Inicial: $2.86 USD/PMT</text>

  <!-- Box 1.2 -->
  <rect x="630" y="180" width="510" height="95" rx="8" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
  <text x="650" y="205" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#0f172a">⛽ Último Bunker Registrado (N)</text>
  <text x="650" y="230" font-family="monospace" font-size="12" fill="#334155">• Precio Actual IFO ($/MT)  |  Precio Actual MDO ($/MT)</text>
  <text x="650" y="250" font-family="monospace" font-size="12" fill="#d97706" font-weight="700">• Registro Factura PDF / Cotización Histórica</text>

  <!-- Flechas Nivel 1 a 2 -->
  <line x1="315" y1="275" x2="315" y2="330" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="885" y1="275" x2="885" y2="330" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Nivel 2: Costos Ponderados -->
  <rect x="40" y="330" width="1120" height="150" rx="12" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5" stroke-dasharray="4,4" filter="url(#shadow)"/>
  <text x="60" y="355" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#2563eb" letter-spacing="0.5">PASO 2 — ESTRUCTURA POLINÓMICA DE CONSUMOS (B/T MOQUEGUA)</text>

  <!-- Box 2.1 -->
  <rect x="60" y="370" width="510" height="95" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5"/>
  <text x="80" y="395" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#1e3a8a">⚙️ Costo Ponderado Base (N-1)</text>
  <text x="80" y="420" font-family="monospace" font-size="12" fill="#1e40af">• (IFO_Base × 38.40) + (MDO_Base × 9.50)</text>
  <text x="80" y="445" font-family="monospace" font-size="13" font-weight="800" fill="#1d4ed8">= $35,459.23 USD / ciclo</text>

  <!-- Box 2.2 -->
  <rect x="630" y="370" width="510" height="95" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5"/>
  <text x="650" y="395" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#1e3a8a">⚙️ Costo Ponderado Actual (N)</text>
  <text x="650" y="420" font-family="monospace" font-size="12" fill="#1e40af">• (IFO_Actual × 38.40) + (MDO_Actual × 9.50)</text>
  <text x="650" y="445" font-family="monospace" font-size="13" font-weight="800" fill="#1d4ed8">= $48,246.24 USD / ciclo</text>

  <!-- Flechas Nivel 2 a 3 -->
  <line x1="315" y1="465" x2="600" y2="520" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="885" y1="465" x2="600" y2="520" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Nivel 3: Motor Polinómico Factor & Delta -->
  <rect x="40" y="520" width="1120" height="150" rx="12" fill="#ffffff" stroke="#6ee7b7" stroke-width="1.5" stroke-dasharray="4,4" filter="url(#shadow)"/>
  <text x="60" y="545" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#059669" letter-spacing="0.5">PASO 3 — MOTOR POLINÓMICO FACTOR fa &amp; DELTA BAF (USD/PMT)</text>

  <rect x="180" y="560" width="840" height="95" rx="8" fill="#ecfdf5" stroke="#059669" stroke-width="2"/>
  <text x="600" y="585" font-family="system-ui, sans-serif" font-size="15" font-weight="900" fill="#065f46" text-anchor="middle">⚡ Factor Multiplicador fa = Costo_N ÷ Costo_N-1 (ej. 1.3606x)</text>
  <text x="600" y="610" font-family="monospace" font-size="13" font-weight="700" fill="#047857" text-anchor="middle">• Nuevo BAF = BAF_Inicial × fa  (ej. $2.86 × 1.3606 = $3.8916)</text>
  <text x="600" y="635" font-family="monospace" font-size="14" font-weight="900" fill="#064e3b" text-anchor="middle">Δ BAF Net = Nuevo BAF - BAF_Inicial  ➔  + $1.0316 USD / PMT</text>

  <!-- Flecha Nivel 3 a 4 -->
  <line x1="600" y1="655" x2="600" y2="710" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Nivel 4: Salidas & Tarifas por Tramo -->
  <rect x="40" y="710" width="1120" height="150" rx="12" fill="#ffffff" stroke="#d8b4fe" stroke-width="1.5" stroke-dasharray="4,4" filter="url(#shadow)"/>
  <text x="60" y="735" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#7e22ce" letter-spacing="0.5">PASO 4 — MATRIZ DE FLETES FINALES AJUSTADOS POR TRAMO &amp; SALIDAS</text>

  <rect x="60" y="750" width="510" height="95" rx="8" fill="#faf5ff" stroke="#9333ea" stroke-width="1.5"/>
  <text x="80" y="775" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#581c87">💵 Flete Final Ajustado por Tramo</text>
  <text x="80" y="800" font-family="monospace" font-size="12" fill="#6b21a8">• Tarifa Final Tramo_i = Tarifa Base Tramo_i + Δ BAF Net</text>
  <text x="80" y="820" font-family="monospace" font-size="12" font-weight="800" fill="#7e22ce">Ejemplo: $13.06 + (+$1.03) = $14.09/MT  |  $13.06 + (-$0.25) = $12.81/MT</text>

  <rect x="630" y="750" width="510" height="95" rx="8" fill="#faf5ff" stroke="#9333ea" stroke-width="1.5"/>
  <text x="650" y="775" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#581c87">💼 Integración al Sistema Comercial</text>
  <text x="650" y="800" font-family="monospace" font-size="12" fill="#6b21a8">• Inyección a Multicotizador Spot &amp; Voyage Ledger P&amp;L</text>
  <text x="650" y="820" font-family="monospace" font-size="12" font-weight="800" fill="#7e22ce">• Auditoría Sección 7 en Vivo en Maestro de Contratos</text>
</svg>
"""
    
    out_dir1 = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts'
    out_dir2 = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\public'

    p1 = os.path.join(out_dir1, 'FLOWCHART_MOTOR_BAF.svg')
    p2 = os.path.join(out_dir2, 'FLOWCHART_MOTOR_BAF.svg')

    with open(p1, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    with open(p2, 'w', encoding='utf-8') as f:
        f.write(svg_content)

    print(f"SVG generado exitosamente en:\n- {p1}\n- {p2}")

if __name__ == '__main__':
    generate_baf_svg()
