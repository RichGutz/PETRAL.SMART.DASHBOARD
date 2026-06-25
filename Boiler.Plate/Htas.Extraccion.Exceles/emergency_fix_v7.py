import pandas as pd
import re

excel_path = r'C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Estructura Cabida CASTRO.HARRISON.ACI.345.GRPY.xlsx'
md_path = r"C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Informe.RG\Informe_Terreno_San_Miguel_345_V1.md"

with open(md_path, "r", encoding="utf-8") as f:
    content = f.read()

# ----------------- 1. ELEVATION PROFILE -----------------
xls = pd.ExcelFile(excel_path)
df = pd.read_excel(xls, sheet_name='0.Harrison 8 pisos VIS', header=None)
lote_total = 750.0

def make_div(width_pct, bg_color, text, is_dashed=False):
    border = "2px dashed #ccc" if is_dashed else "1px solid #fff"
    color = "#666" if is_dashed else "#fff"
    return f'<div style="width: {width_pct:.1f}%; background: {bg_color}; color: {color}; padding: 4px; border-right: {border}; font-size: 7.5pt; white-space: nowrap; overflow: hidden; display: flex; align-items: center; justify-content: center;">{text}</div>'

def get_typology_and_color(size):
    size = round(size)
    if size >= 65: return f"3D {size}m²", "#1f618d"
    elif size >= 50: return f"2D {size}m²", "#1e8449"
    else: return f"1D {size}m²", "#b9770e"

piso_tipico = df.iloc[8]
units = []
a_comun = 81.6
for i in range(1, 15):
    val = piso_tipico.iloc[i]
    if pd.notna(val) and isinstance(val, (int, float)) and val < 100: units.append(val)
if len(units) > 0: a_comun = units.pop()
techado_total = sum(units) + a_comun
a_libre = lote_total - techado_total

piso_tipico_html = '<div style="display: flex; border-bottom: 1px solid #333; width: 100%;">'
for u in units:
    label, color = get_typology_and_color(u)
    piso_tipico_html += make_div(u / lote_total * 100, color, label)
piso_tipico_html += make_div(a_comun / lote_total * 100, "#0f2c59", f"A.C. {int(a_comun)}m²")
piso_tipico_html += make_div(a_libre / lote_total * 100, "#f0f0f0", f"Área Libre {int(a_libre)}m²", True)
piso_tipico_html += '</div>\n'

piso_1 = df.iloc[14]
units_p1 = []
for i in range(1, 15):
    val = piso_1.iloc[i]
    if pd.notna(val) and isinstance(val, (int, float)) and val < 100: units_p1.append(val)
if len(units_p1) > 0: a_comun_p1 = units_p1.pop()
ingreso_area = techado_total - sum(units_p1)

piso_1_html = '<div style="display: flex; border-bottom: 2px solid #333; width: 100%;">'
piso_1_html += make_div(ingreso_area / lote_total * 100, "#212f3c", f"Ingreso/Bicis {int(ingreso_area)}m²")
for u in units_p1:
    label, color = get_typology_and_color(u)
    piso_1_html += make_div(u / lote_total * 100, color, label)
piso_1_html += make_div(a_libre / lote_total * 100, "#f0f0f0", f"Área Libre {int(a_libre)}m²", True)
piso_1_html += '</div>\n'

azotea_html = '<div style="display: flex; border-bottom: 1px solid #333; width: 100%;">'
azotea_html += make_div(120 / lote_total * 100, "#0f2c59", "Amenidades 120m²")
azotea_html += make_div((techado_total-120) / lote_total * 100, "#d0e8f2", f"Terrazas Libres {int(techado_total-120)}m²")
azotea_html += make_div(a_libre / lote_total * 100, "#f0f0f0", f"Área Libre {int(a_libre)}m²", True)
azotea_html += '</div>\n'

nuevo_perfil = f"""<h3 style="color: #0f2c59; text-align: center; margin-bottom: 5px; font-size: 16pt;">Perfil de Elevación</h3>
  
  <div style="width: 100%; border: 2px solid #333; background: #fff; text-align: center; font-size: 8pt; font-weight: bold; margin: 5px auto 0 auto;">
    <div style="background: #333; color: #fff; padding: 4px;">LÍMITE DEL LOTE: 750 M²</div>
    <!-- Azotea -->{azotea_html}
"""
for i in range(8, 1, -1): nuevo_perfil += f"    <!-- Piso {i} -->{piso_tipico_html}"
nuevo_perfil += f"""    <!-- Piso 1 -->{piso_1_html}
    <div style="display: flex; border-bottom: 1px solid #333; width: 100%;">
      <div style="width: 100%; background: #5c7496; color: #fff; padding: 4px; display: flex; align-items: center; justify-content: center;">SÓTANO 1: 18 Estacionamientos (750m² FULL)</div>
    </div>
    <div style="display: flex; width: 100%;">
      <div style="width: 5.3%; background: #4a5d78; color: #fff; padding: 4px; border-right: 1px solid #fff;">Cist.</div>
      <div style="width: 94.7%; background: #e0e0e0; color: #555; padding: 4px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center;">SÓTANO 2: Tierra Sólida / Cimentación (710m²)</div>
    </div>
  </div>"""

# Replace elevation profile using loose regex (from h3 Perfil de Elevacion down to the end of the last sotano div)
pattern_elev = r'<h3[^>]*>Perfil de Elevación</h3>.*?SÓTANO 2:.*?</div>\s*</div>'
content = re.sub(pattern_elev, nuevo_perfil, content, flags=re.DOTALL)


# ----------------- 2. FINANCIALS -----------------
dfS = pd.read_excel(xls, sheet_name='Scenario Summary', header=None)
scenarios = {'BASE': 4, 'PESIMISTA': 5, 'OPTIMISTA': 6}
fin_data = {'BASE': {}, 'PESIMISTA': {}, 'OPTIMISTA': {}}

for i in range(4, 32):
    val = str(dfS.iloc[i, 2]).strip()
    for s_name, col in scenarios.items():
        if 'VENTA.S.IGV' in val: fin_data[s_name]['ingresos'] = dfS.iloc[i, col]
        elif 'COGS.S.IGV' in val: fin_data[s_name]['cogs'] = dfS.iloc[i, col]
        elif 'UTILIDAD.BRUTA' in val: fin_data[s_name]['ub'] = dfS.iloc[i, col]
        elif 'G.Admin.S.IGV' in val: fin_data[s_name]['gadmin'] = dfS.iloc[i, col]
        elif 'G.Ventas.S.IGV' in val: fin_data[s_name]['gventas'] = dfS.iloc[i, col]
        elif 'EBT' in val and 'MARGIN' not in val: fin_data[s_name]['ebt'] = dfS.iloc[i, col]
        elif 'EAT' in val and 'MARGIN' not in val: fin_data[s_name]['eat'] = dfS.iloc[i, col]

def fc(val): return f"{int(abs(val)):,}"
def fp(val): return f"{abs(val)*100:.2f}%"

def build_table(s_name, data, color):
    ingresos = data['ingresos']
    cogs = data['cogs']
    ub = data['ub']
    gop = data['gadmin'] + data['gventas']
    ebt = data['ebt']
    tax = ebt - data['eat']
    eat = data['eat']
    
    return f"""<h2 style="color: #0f2c59; margin-bottom: 5px;">P&L - Escenario {s_name}</h2>
<table style="width: 100%; border-collapse: collapse; font-size: 11pt; margin-top: 15px;">
    <thead>
        <tr style="background-color: #0f2c59; color: white;">
            <th style="padding: 4px; border: 1px solid #ccc; text-align: left;">Concepto</th>
            <th style="padding: 4px; border: 1px solid #ccc; text-align: right;">Soles sin IGV</th>
            <th style="padding: 4px; border: 1px solid #ccc; text-align: center;">% sobre Ventas</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="padding: 4px; border: 1px solid #ccc;"><strong>Ventas Totales Netas</strong></td>
            <td style="padding: 4px; border: 1px solid #ccc; text-align: right;"><strong>{fc(ingresos)}</strong></td>
            <td style="padding: 4px; border: 1px solid #ccc; text-align: center;"><strong>100.00%</strong></td>
        </tr>
        <tr>
            <td style="padding: 4px; border: 1px solid #ccc;">Costo de Ventas (COGS - Tierras y Construcción)</td>
            <td style="padding: 4px; border: 1px solid #ccc; text-align: right; color: #922b21;">({fc(cogs)})</td>
            <td style="padding: 4px; border: 1px solid #ccc; text-align: center; color: #922b21;">-{fp(cogs/ingresos)}</td>
        </tr>
        <tr style="background-color: #f0f4f8;">
            <td style="padding: 4px; border: 1px solid #ccc;"><strong>Utilidad Bruta</strong></td>
            <td style="padding: 4px; border: 1px solid #ccc; text-align: right; color: #1e8449;"><strong>{fc(ub)}</strong></td>
            <td style="padding: 4px; border: 1px solid #ccc; text-align: center; color: #1e8449;"><strong>{fp(ub/ingresos)}</strong></td>
        </tr>
        <tr>
            <td style="padding: 4px; border: 1px solid #ccc;">Gastos Operativos (G.Admin + G.Ventas)</td>
            <td style="padding: 4px; border: 1px solid #ccc; text-align: right; color: #922b21;">({fc(gop)})</td>
            <td style="padding: 4px; border: 1px solid #ccc; text-align: center; color: #922b21;">-{fp(gop/ingresos)}</td>
        </tr>
        <tr style="background-color: #e8f4f8;">
            <td style="padding: 4px; border: 1px solid #ccc;"><strong>Utilidad Antes de Impuestos (EBT)</strong></td>
            <td style="padding: 4px; border: 1px solid #ccc; text-align: right; color: #1f618d;"><strong>{fc(ebt)}</strong></td>
            <td style="padding: 4px; border: 1px solid #ccc; text-align: center; color: #1f618d;"><strong>{fp(ebt/ingresos)}</strong></td>
        </tr>
        <tr>
            <td style="padding: 4px; border: 1px solid #ccc;">Impuestos (Calculado por dif. EBT - EAT)</td>
            <td style="padding: 4px; border: 1px solid #ccc; text-align: right; color: #922b21;">({fc(tax)})</td>
            <td style="padding: 4px; border: 1px solid #ccc; text-align: center; color: #922b21;">-{fp(tax/ingresos)}</td>
        </tr>
        <tr style="background-color: {color}; color: white;">
            <td style="padding: 4px; border: 1px solid #333;"><strong>UTILIDAD NETA (EAT)</strong></td>
            <td style="padding: 4px; border: 1px solid #333; text-align: right; font-size: 13pt;"><strong>{fc(eat)}</strong></td>
            <td style="padding: 4px; border: 1px solid #333; text-align: center; font-size: 13pt;"><strong>{fp(eat/ingresos)}</strong></td>
        </tr>
    </tbody>
</table>"""

t_base = build_table('BASE', fin_data['BASE'], '#0f2c59')
t_opt = build_table('OPTIMISTA', fin_data['OPTIMISTA'], '#1f618d')
t_pes = build_table('PESIMISTA', fin_data['PESIMISTA'], '#922b21')

# Replace tables
# The markdown has:
# <h2 style="...">9. P&L - Escenario BASE</h2>
# ... table 1 ...
# <h2 style="...">10. P&L - Escenario OPTIMISTA</h2>
# ... table 2 ...
# <h2 style="...">11. P&L - Escenario PESIMISTA</h2>
# ... table 3 ...
all_tables = f"{t_base}\n\n<div style=\"page-break-before: always; margin-top: 20px;\"></div>\n\n{t_opt}\n\n<br>\n\n{t_pes}"

pattern_fin = r'<h2[^>]*>9\. P&L - Escenario BASE</h2>.*?<h2[^>]*>11\. P&L - Escenario PESIMISTA</h2>.*?</table>'
content = re.sub(pattern_fin, all_tables, content, flags=re.DOTALL)

with open(md_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Emergency Fix V7 applied. Base EAT: S/ {fc(fin_data['BASE']['eat'])}")
