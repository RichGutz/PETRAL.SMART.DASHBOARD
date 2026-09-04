import weasyprint, pypdf

html_code = """
<!DOCTYPE html>
<html>
<head>
<style>
@page { size: A4 landscape !important; margin: 4mm 5mm !important; }
* { box-sizing: border-box; font-family: Consolas, monospace !important; }
.report-page { width: 100%; page-break-after: always; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
th { background: #1e293b; color: #fff; font-size: 8.5px; border: 1px solid #334; height: 16px; }
td { border: 1px solid #cbd5e1; padding: 1px 2px; font-size: 8px; vertical-align: middle; white-space: nowrap; }
td.td-dimension { width: 24px !important; text-align: center !important; vertical-align: middle !important; padding: 0 !important; overflow: visible !important; }
td.td-metric { width: 135px; text-align: left; }
td.td-num { width: 58px; text-align: right; }
tr.tr-margen td { background-color: #eef2ff !important; font-weight: bold; }
</style>
</head>
<body>
<div class="report-page">
<table>
<thead>
<tr>
  <th style="width:24px;">CLI</th>
  <th style="width:24px;">RUT</th>
  <th style="width:24px;">BUQ</th>
  <th style="width:135px;">METRICA</th>
  <th style="width:58px;">ENE</th><th style="width:58px;">FEB</th><th style="width:58px;">MAR</th><th style="width:58px;">ABR</th>
  <th style="width:58px;">MAY</th><th style="width:58px;">JUN</th><th style="width:58px;">JUL</th><th style="width:58px;">AGO</th>
  <th style="width:58px;">SET</th><th style="width:58px;">OCT</th><th style="width:58px;">NOV</th><th style="width:58px;">DIC</th>
  <th style="width:66px;">TOTAL</th>
</tr>
</thead>
<tbody>
"""

def create_svg(text, rowspan, bg, fg='#fff'):
    h = max(25, rowspan * 13)
    mid = -h / 2
    return f'<td rowspan="{rowspan}" class="td-dimension" style="background:{bg} !important;"><svg width="24" height="{h}" viewBox="0 0 24 {h}" style="display:block;margin:0 auto;overflow:visible;"><text x="{mid}" y="15" transform="rotate(-90)" text-anchor="middle" fill="{fg}" font-family="Consolas" font-size="8.5" font-weight="bold">{text}</text></svg></td>'

# 1 Subtotal Block (14 rows) + 1 Vessel Block (16 rows) = 30 rows
for r in range(14):
    cls = 'class="tr-margen"' if r == 13 else ''
    html_code += f'<tr {cls}>'
    if r == 0:
        html_code += create_svg('NEXA', 14, '#0f4c81')
        html_code += create_svg('Σ SUBTOTAL', 14, '#1e293b', '#fbbf24')
        html_code += create_svg('TOTAL NEXA', 14, '#1e293b', '#fbbf24')
    html_code += f'<td class="td-metric">Subtotal Metrica {r+1}</td>' + ''.join(['<td class="td-num">$100,000</td>']*13) + '</tr>'

for r in range(16):
    cls = 'class="tr-margen"' if r == 15 else ''
    html_code += f'<tr {cls}>'
    if r == 0:
        html_code += create_svg('SPCC', 16, '#0369a1')
        html_code += create_svg('ILO-MARCONA', 16, '#a855f7')
        html_code += create_svg('MOQUEGUA', 16, '#16a34a')
    html_code += f'<td class="td-metric">Buque Metrica {r+1}</td>' + ''.join(['<td class="td-num">$200,000</td>']*13) + '</tr>'

html_code += '</tbody></table></div></body></html>'

doc = weasyprint.HTML(string=html_code).render()
doc.write_pdf('test_perfect_compact_margins.pdf')

reader = pypdf.PdfReader('test_perfect_compact_margins.pdf')
print(f'Total Paginas: {len(reader.pages)}')
