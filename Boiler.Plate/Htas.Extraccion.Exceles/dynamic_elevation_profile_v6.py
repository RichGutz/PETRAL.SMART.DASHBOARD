import pandas as pd
import re

excel_path = r'C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Estructura Cabida CASTRO.HARRISON.ACI.345.GRPY.xlsx'
md_path = r"C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Informe.RG\Informe_Terreno_San_Miguel_345_V1.md"

xls = pd.ExcelFile(excel_path)
df = pd.read_excel(xls, sheet_name='0.Harrison 8 pisos VIS', header=None)

lote_total = 750.0

def make_div(width_pct, bg_color, text, is_dashed=False):
    border = "2px dashed #ccc" if is_dashed else "1px solid #fff"
    color = "#666" if is_dashed else "#fff"
    return f'<div style="width: {width_pct:.1f}%; background: {bg_color}; color: {color}; padding: 4px; border-right: {border}; font-size: 7.5pt; white-space: nowrap; overflow: hidden; display: flex; align-items: center; justify-content: center;">{text}</div>'

def get_typology_and_color(size):
    size = round(size)
    if size >= 65:
        return f"3D {size}m²", "#1f618d"
    elif size >= 50:
        return f"2D {size}m²", "#1e8449"
    else:
        return f"1D {size}m²", "#b9770e"

# 1. Extraer Piso Típico (Fila 8 que está en índice 8 en header=None)
piso_tipico = df.iloc[8]
units = []
a_comun = 81.6
for i in range(1, 15):
    val = piso_tipico.iloc[i]
    if pd.notna(val) and isinstance(val, (int, float)):
        if val < 100:
            units.append(val)
# La última unidad extraída en unidades será el área común. Lo separamos.
if len(units) > 0:
    a_comun = units.pop()

techado_total = sum(units) + a_comun
a_libre = lote_total - techado_total

piso_tipico_html = '<div style="display: flex; border-bottom: 1px solid #333; width: 100%;">'
for u in units:
    label, color = get_typology_and_color(u)
    piso_tipico_html += make_div(u / lote_total * 100, color, label)
piso_tipico_html += make_div(a_comun / lote_total * 100, "#0f2c59", f"A.C. {int(a_comun)}m²")
piso_tipico_html += make_div(a_libre / lote_total * 100, "#f0f0f0", f"Área Libre {int(a_libre)}m²", True)
piso_tipico_html += '</div>\n'

# 2. Piso 1 (Fila 15 en header=None)
piso_1 = df.iloc[14]
units_p1 = []
for i in range(1, 15):
    val = piso_1.iloc[i]
    if pd.notna(val) and isinstance(val, (int, float)):
        if val < 100:
            units_p1.append(val)
# Aquí también quitamos el área común si está
if len(units_p1) > 0:
    a_comun_p1 = units_p1.pop()

ingreso_area = techado_total - sum(units_p1)

piso_1_html = '<div style="display: flex; border-bottom: 2px solid #333; width: 100%;">'
piso_1_html += make_div(ingreso_area / lote_total * 100, "#212f3c", f"Ingreso / Bicis {int(ingreso_area)}m²")
for u in units_p1:
    label, color = get_typology_and_color(u)
    piso_1_html += make_div(u / lote_total * 100, color, label)
piso_1_html += make_div(a_libre / lote_total * 100, "#f0f0f0", f"Área Libre {int(a_libre)}m²", True)
piso_1_html += '</div>\n'

# 3. Azotea
azotea_html = '<div style="display: flex; border-bottom: 1px solid #333; width: 100%;">'
azotea_html += make_div(120 / lote_total * 100, "#0f2c59", "Amenidades 120m²")
azotea_html += make_div(401 / lote_total * 100, "#d0e8f2", "Terrazas Libres 401m²")
azotea_html += make_div(a_libre / lote_total * 100, "#f0f0f0", f"Área Libre {int(a_libre)}m²", True)
azotea_html += '</div>\n'

nuevo_perfil = f"""<div style="margin-top: 10px; margin-bottom: 5px; page-break-inside: avoid; font-family: Arial, sans-serif;">
  <h3 style="color: #0f2c59; text-align: center; margin-bottom: 5px; font-size: 16pt;">Perfil de Elevación</h3>
  
  <div style="width: 100%; border: 2px solid #333; background: #fff; text-align: center; font-size: 8pt; font-weight: bold; margin: 5px auto 0 auto;">
    <div style="background: #333; color: #fff; padding: 4px;">LÍMITE DEL LOTE: 750 M²</div>
    <!-- Azotea -->{azotea_html}
"""
for i in range(8, 1, -1):
    nuevo_perfil += f"    <!-- Piso {i} -->{piso_tipico_html}"
    
nuevo_perfil += f"""    <!-- Piso 1 -->{piso_1_html}
    <!-- Sotano 1 -->
    <div style="display: flex; border-bottom: 1px solid #333; width: 100%;">
      <div style="width: 100%; background: #5c7496; color: #fff; padding: 4px; display: flex; align-items: center; justify-content: center;">SÓTANO 1: 18 Estacionamientos (750m² FULL)</div>
    </div>
    <!-- Sotano 2 -->
    <div style="display: flex; width: 100%;">
      <div style="width: 5.3%; background: #4a5d78; color: #fff; padding: 4px; border-right: 1px solid #fff;">Cist.</div>
      <div style="width: 94.7%; background: #e0e0e0; color: #555; padding: 4px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center;">SÓTANO 2: Tierra Sólida / Cimentación (710m²)</div>
    </div>
  </div>
</div>"""

with open(md_path, "r", encoding="utf-8") as f:
    content = f.read()

pattern = r'<div style="margin-top: 10px; margin-bottom: 5px; page-break-inside: avoid; font-family: Arial, sans-serif;">\s*<h3 style="color: #0f2c59; text-align: center; margin-bottom: 5px; font-size: 16pt;">Perfil de Elevación</h3>.*?</div>\s*</div>\s*</div>'

content = re.sub(pattern, nuevo_perfil, content, flags=re.DOTALL)

with open(md_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Dynamic Elevation Profile V6 Injected PERFECTLY.")
