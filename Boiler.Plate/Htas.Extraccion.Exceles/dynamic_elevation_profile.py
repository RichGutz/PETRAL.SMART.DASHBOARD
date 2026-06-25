import pandas as pd
import re

excel_path = r'C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Estructura Cabida CASTRO.HARRISON.ACI.345.GRPY.xlsx'
md_path = r"C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Informe.RG\Informe_Terreno_San_Miguel_345_V1.md"

xls = pd.ExcelFile(excel_path)
df = pd.read_excel(xls, sheet_name='0.Harrison 8 pisos VIS')

lote_total = 750.0

def make_div(width_pct, bg_color, text, is_dashed=False):
    border = "2px dashed #ccc" if is_dashed else "1px solid #fff"
    color = "#666" if is_dashed else "#fff"
    return f'<div style="width: {width_pct:.1f}%; background: {bg_color}; color: {color}; padding: 4px; border-right: {border}; font-size: 7.5pt; white-space: nowrap; overflow: hidden; display: flex; align-items: center; justify-content: center;">{text}</div>'

# 1. Extraer Piso Tipico (Piso 8 está en la fila 7)
piso_8_row = df.iloc[7]
# Las unidades están desde col 2 hasta 8
units = []
for i in range(2, 9):
    if pd.notna(piso_8_row.iloc[i]) and type(piso_8_row.iloc[i]) in [float, int]:
        units.append(piso_8_row.iloc[i])

a_comun = piso_8_row.iloc[9] if pd.notna(piso_8_row.iloc[9]) else 81.6
techado_total = sum(units) + a_comun
a_libre = lote_total - techado_total

colors = ["#1f618d", "#1e8449", "#b9770e", "#1e8449", "#b9770e", "#1e8449", "#1f618d"]
tipos = ["3D", "3D", "1D", "2D", "2D", "2D", "2D"] # aproximado basado en sizes

piso_tipico_html = '<div style="display: flex; border-bottom: 1px solid #333; width: 100%;">'
for i, u in enumerate(units):
    piso_tipico_html += make_div(u / lote_total * 100, colors[i%len(colors)], f"{int(u)}m²")
piso_tipico_html += make_div(a_comun / lote_total * 100, "#0f2c59", f"A.Común {int(a_comun)}m²")
piso_tipico_html += make_div(a_libre / lote_total * 100, "#f0f0f0", f"Área Libre {int(a_libre)}m²", True)
piso_tipico_html += '</div>\n'

# 2. Piso 1 (Fila 14)
piso_1_row = df.iloc[14]
units_p1 = []
for i in range(7, 10):
    if pd.notna(piso_1_row.iloc[i]) and type(piso_1_row.iloc[i]) in [float, int]:
        units_p1.append(piso_1_row.iloc[i])

ingreso_area = techado_total - sum(units_p1)

piso_1_html = '<div style="display: flex; border-bottom: 2px solid #333; width: 100%;">'
piso_1_html += make_div(ingreso_area / lote_total * 100, "#212f3c", f"Ingreso / Bicis {int(ingreso_area)}m²")
for i, u in enumerate(units_p1):
    piso_1_html += make_div(u / lote_total * 100, colors[i%len(colors)], f"{int(u)}m²")
piso_1_html += make_div(a_libre / lote_total * 100, "#f0f0f0", f"Área Libre {int(a_libre)}m²", True)
piso_1_html += '</div>\n'

# 3. Azotea
# 120m2 techado (amenidades) + 405m2 terrazas
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

print("Dynamic Elevation Profile HTML Injected.")
