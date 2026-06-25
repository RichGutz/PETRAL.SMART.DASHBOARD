import pandas as pd
import re

excel_path = r'C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Estructura Cabida CASTRO.HARRISON.ACI.345.GRPY.xlsx'
md_path = r"C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Informe.RG\Informe_Terreno_San_Miguel_345_V1.md"

xls = pd.ExcelFile(excel_path)
df = pd.read_excel(xls, sheet_name='Scenario Summary')

def get_data(col):
    return {
        "precio_venta": int(df.iloc[4, col]),
        "precio_terreno": int(df.iloc[5, col]),
        "precio_cochera": int(df.iloc[6, col]),
        "costo_sotano": int(df.iloc[7, col]),
        "costo_rasante": int(df.iloc[8, col]),
        "gastos_proy": float(df.iloc[10, col]),
        "ventas": float(df.iloc[20, col]),
        "cogs": float(df.iloc[24, col]),
        "bruta": float(df.iloc[25, col]),
        "operativos": float(df.iloc[26, col]),
        "ebt": float(df.iloc[28, col]),
        "eat": float(df.iloc[30, col])
    }

base = get_data(4)
pesimista = get_data(5)
optimista = get_data(6)

def format_pct(num):
    return f"{num * 100:.2f}%"

def format_curr(num):
    return f"{int(abs(num)):,}"

def build_scenario_html(name, data, color_main, color_highlight):
    impuestos = data['ebt'] - data['eat']
    return f"""<table style="width: 100%; border-collapse: collapse; font-size: 11pt; margin-top: 15px; margin-bottom: 15px;">
    <thead>
        <tr style="background-color: #0f2c59; color: white;">
            <th style="padding: 6px; border: 1px solid #ccc; text-align: left;">Parámetro (Input)</th>
            <th style="padding: 6px; border: 1px solid #ccc; text-align: center;">{name}</th>
            <th style="padding: 6px; border: 1px solid #ccc; text-align: left;">Unidad</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="padding: 6px; border: 1px solid #ccc;"><strong>Precio de Venta (Áreas Techadas)</strong></td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: center;">$ {format_curr(data['precio_venta'])}</td>
            <td style="padding: 6px; border: 1px solid #ccc;">USD / m² (Con IGV)</td>
        </tr>
        <tr>
            <td style="padding: 6px; border: 1px solid #ccc;"><strong>Precio del Terreno</strong></td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: center;">$ {format_curr(data['precio_terreno'])}</td>
            <td style="padding: 6px; border: 1px solid #ccc;">USD / m² (Sin IGV)</td>
        </tr>
        <tr>
            <td style="padding: 6px; border: 1px solid #ccc;"><strong>Precio de Cocheras</strong></td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: center;">S/ {format_curr(data['precio_cochera'])}</td>
            <td style="padding: 6px; border: 1px solid #ccc;">PEN / Und (Con IGV)</td>
        </tr>
        <tr>
            <td style="padding: 6px; border: 1px solid #ccc;"><strong>Costo Const. Bajo Rasante (Sótanos)</strong></td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: center;">$ {format_curr(data['costo_sotano'])}</td>
            <td style="padding: 6px; border: 1px solid #ccc;">USD / m² (Sin IGV)</td>
        </tr>
        <tr>
            <td style="padding: 6px; border: 1px solid #ccc;"><strong>Costo Const. Sobre Rasante</strong></td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: center;">$ {format_curr(data['costo_rasante'])}</td>
            <td style="padding: 6px; border: 1px solid #ccc;">USD / m² (Sin IGV)</td>
        </tr>
        <tr>
            <td style="padding: 6px; border: 1px solid #ccc;"><strong>Gastos del Proyecto</strong></td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: center;">{format_pct(data['gastos_proy'])}</td>
            <td style="padding: 6px; border: 1px solid #ccc;">% sobre Costo Directo</td>
        </tr>
    </tbody>
</table>

<h3 style="color: #0f2c59; text-align: center; margin-bottom: 25px; font-size: 18pt; margin-top: 30px;">P&L - Resumen Gerencial</h3>

<table style="width: 100%; border-collapse: collapse; font-size: 11pt; margin-top: 15px;">
    <thead>
        <tr style="background-color: #0f2c59; color: white;">
            <th style="padding: 6px; border: 1px solid #ccc; text-align: left;">Concepto</th>
            <th style="padding: 6px; border: 1px solid #ccc; text-align: right;">Valor (S/ Sin IGV)</th>
            <th style="padding: 6px; border: 1px solid #ccc; text-align: center;">% sobre Ventas</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="padding: 6px; border: 1px solid #ccc;"><strong>Ventas Totales Netas</strong></td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: right;"><strong>{format_curr(data['ventas'])}</strong></td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: center;"><strong>100.00%</strong></td>
        </tr>
        <tr>
            <td style="padding: 6px; border: 1px solid #ccc;">Costo de Ventas (COGS - Tierras y Construcción)</td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: right; color: #922b21;">({format_curr(data['cogs'])})</td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: center; color: #922b21;">-{format_pct(abs(data['cogs'])/data['ventas'])}</td>
        </tr>
        <tr style="background-color: #f0f4f8;">
            <td style="padding: 6px; border: 1px solid #ccc;"><strong>Utilidad Bruta</strong></td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: right; color: {color_highlight};"><strong>{format_curr(data['bruta'])}</strong></td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: center; color: {color_highlight};"><strong>{format_pct(data['bruta']/data['ventas'])}</strong></td>
        </tr>
        <tr>
            <td style="padding: 6px; border: 1px solid #ccc;">Gastos Operativos (G.Admin + G.Ventas)</td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: right; color: #922b21;">({format_curr(data['operativos'])})</td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: center; color: #922b21;">-{format_pct(abs(data['operativos'])/data['ventas'])}</td>
        </tr>
        <tr style="background-color: #e8f4f8;">
            <td style="padding: 6px; border: 1px solid #ccc;"><strong>Utilidad Antes de Impuestos (EBT)</strong></td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: right; color: #1f618d;"><strong>{format_curr(data['ebt'])}</strong></td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: center; color: #1f618d;"><strong>{format_pct(data['ebt']/data['ventas'])}</strong></td>
        </tr>
        <tr>
            <td style="padding: 6px; border: 1px solid #ccc;">Impuestos (Calculado por dif. EBT - EAT)</td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: right; color: #922b21;">({format_curr(impuestos)})</td>
            <td style="padding: 6px; border: 1px solid #ccc; text-align: center; color: #922b21;">-{format_pct(abs(impuestos)/data['ventas'])}</td>
        </tr>
        <tr style="background-color: #0f2c59; color: white;">
            <td style="padding: 6px; border: 1px solid #333;"><strong>UTILIDAD NETA (EAT)</strong></td>
            <td style="padding: 6px; border: 1px solid #333; text-align: right; font-size: 13pt;"><strong>{format_curr(data['eat'])}</strong></td>
            <td style="padding: 6px; border: 1px solid #333; text-align: center; font-size: 13pt;"><strong>{format_pct(data['eat']/data['ventas'])}</strong></td>
        </tr>
    </tbody>
</table>"""

# Let's replace the whole section 8 to 11
replacement = f"""## 8. Análisis Financiero - Escenario PESIMISTA

Para determinar la viabilidad de adquisición, evaluamos los principales drivers del mercado bajo 3 escenarios probabilísticos y su respectivo Estado de Resultados proyectado.

{build_scenario_html('PESIMISTA', pesimista, '#1e8449', '#1e8449')}

<div style="page-break-before: always; page-break-inside: avoid;"></div>

## 9. Análisis Financiero - Escenario BASE

{build_scenario_html('BASE', base, '#1e8449', '#1e8449')}

<div style="page-break-before: always; page-break-inside: avoid;"></div>

## 10. Análisis Financiero - Escenario OPTIMISTA

{build_scenario_html('OPTIMISTA', optimista, '#1e8449', '#1e8449')}

---

## 11. Conclusión"""

with open(md_path, "r", encoding="utf-8") as f:
    text = f.read()

# We replace everything from "## 8. " up to "## 11. Conclusión"
pattern = r"## 8\. Análisis Financiero.*## 11\. Conclusión"
new_text = re.sub(pattern, replacement, text, flags=re.DOTALL)

with open(md_path, "w", encoding="utf-8") as f:
    f.write(new_text)

print("P&L Injected successfully!")
