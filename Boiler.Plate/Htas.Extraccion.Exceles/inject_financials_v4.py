import pandas as pd
import locale
import re

# Asegurar formato peruano para moneda
try:
    locale.setlocale(locale.LC_ALL, 'es_PE.UTF-8')
except:
    locale.setlocale(locale.LC_ALL, '')

excel_path = r'C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Estructura Cabida CASTRO.HARRISON.ACI.345.GRPY.xlsx'
md_path = r"C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Informe.RG\Informe_Terreno_San_Miguel_345_V1.md"

xls = pd.ExcelFile(excel_path)
dfS = pd.read_excel(xls, sheet_name='Scenario Summary')

# Diccionario para almacenar los datos
scenarios = {
    'BASE': {'col': 4},
    'PESIMISTA': {'col': 5},
    'OPTIMISTA': {'col': 6}
}

# Extraer parámetros (Filas 4-11)
for i in range(4, 12):
    val = str(dfS.iloc[i, 2]).strip()
    if 'USD.M2.C.IGV' in val:
        for s in scenarios: scenarios[s]['precio_m2'] = dfS.iloc[i, scenarios[s]['col']]
    elif 'Precio.Terreno.USD.m2' in val:
        for s in scenarios: scenarios[s]['costo_terr_m2'] = dfS.iloc[i, scenarios[s]['col']]

# Extraer resultados (Filas 12-31)
for i in range(12, 32):
    val = str(dfS.iloc[i, 2]).strip()
    if 'VENTA.S.IGV' in val:
        for s in scenarios: scenarios[s]['ingresos'] = dfS.iloc[i, scenarios[s]['col']]
    elif 'COGS.S.IGV' in val:
        for s in scenarios: scenarios[s]['costo_directo'] = dfS.iloc[i, scenarios[s]['col']]
    elif 'UTILIDAD.BRUTA' in val:
        for s in scenarios: scenarios[s]['utilidad_bruta'] = dfS.iloc[i, scenarios[s]['col']]
    elif 'EBT' in val and 'MARGIN' not in val:
        for s in scenarios: scenarios[s]['ebt'] = dfS.iloc[i, scenarios[s]['col']]
    elif 'EAT' in val and 'MARGIN' not in val:
        for s in scenarios: scenarios[s]['eat'] = dfS.iloc[i, scenarios[s]['col']]
    elif 'EAT.MARGIN' in val:
        for s in scenarios: scenarios[s]['eat_margin'] = dfS.iloc[i, scenarios[s]['col']]

def format_currency(val):
    if pd.isna(val): return "S/ 0"
    return f"S/ {int(abs(val)):,}".replace(',', 'X').replace('.', ',').replace('X', '.')

def format_usd(val):
    if pd.isna(val): return "$0"
    return f"${int(val):,}".replace(',', 'X').replace('.', ',').replace('X', '.')

def format_pct(val):
    if pd.isna(val): return "0.0%"
    return f"{val*100:.1f}%"

with open(md_path, "r", encoding="utf-8") as f:
    content = f.read()

# Reemplazar tablas en Markdown (Escenarios: BASE, OPTIMISTA, PESIMISTA)
def replace_table_values(content, title, data):
    # Regex para encontrar el bloque de la tabla bajo el título específico
    pattern = rf"(### {title}.*?<tbody>\s*<tr>\s*<td>Ingresos Totales).*?(</tbody>)"
    
    table_content = f"""<tr>
      <td>Ingresos Totales</td>
      <td>{format_currency(data['ingresos'])}</td>
      <td>100.0%</td>
    </tr>
    <tr>
      <td>Costo Terreno</td>
      <td>{format_currency(data.get('costo_terr_m2', 1200) * 750)}</td> <!-- Aprox -->
      <td>{format_pct(abs((data.get('costo_terr_m2', 1200) * 750) / data['ingresos']))}</td>
    </tr>
    <tr>
      <td>Costo Directo (Construcción)</td>
      <td>{format_currency(data['costo_directo'])}</td>
      <td>{format_pct(abs(data['costo_directo'] / data['ingresos']))}</td>
    </tr>
    <tr>
      <td>Utilidad Bruta</td>
      <td><strong>{format_currency(data['utilidad_bruta'])}</strong></td>
      <td><strong>{format_pct(data['utilidad_bruta'] / data['ingresos'])}</strong></td>
    </tr>
    <tr>
      <td>Utilidad Neta (EAT)</td>
      <td style="color: #27ae60; font-weight: bold;">{format_currency(data['eat'])}</td>
      <td style="color: #27ae60; font-weight: bold;">{format_pct(data['eat_margin'])}</td>
    </tr>"""
    
    return re.sub(pattern, rf"\1\n    {table_content}\n    \2", content, flags=re.DOTALL)

def replace_params(content, title, data):
    pattern = rf"(### {title}.*?<ul>\s*<li><strong>Precio Venta \(m²\):</strong>).*?(</ul>)"
    param_content = f" {format_usd(data['precio_m2'])}</li>\n      <li><strong>Costo Terreno \(m²\):</strong> {format_usd(data['costo_terr_m2'])}</li>\n      <li><strong>Construcción \(m²\):</strong> $550</li>\n    "
    return re.sub(pattern, rf"\1{param_content}\2", content, flags=re.DOTALL)

content = replace_params(content, "Escenario Base \(Conservador\)", scenarios['BASE'])
content = replace_table_values(content, "Escenario Base \(Conservador\)", scenarios['BASE'])

content = replace_params(content, "Escenario Pesimista \(Stress Test\)", scenarios['PESIMISTA'])
content = replace_table_values(content, "Escenario Pesimista \(Stress Test\)", scenarios['PESIMISTA'])

content = replace_params(content, "Escenario Optimista \(Upside\)", scenarios['OPTIMISTA'])
content = replace_table_values(content, "Escenario Optimista \(Upside\)", scenarios['OPTIMISTA'])

with open(md_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Financials V4 Injected! Base EAT: {format_currency(scenarios['BASE']['eat'])}")
