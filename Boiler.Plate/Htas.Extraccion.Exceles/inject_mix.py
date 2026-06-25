import os
import pandas as pd
import warnings
warnings.simplefilter(action='ignore', category=UserWarning)

excel_path = r'C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Estructura Cabida CASTRO.HARRISON.ACI.GRPY.xlsx'
md_path = r"C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Informe.RG\Informe_Terreno_San_Miguel_345_V1.md"

print("Cargando Excel...")
xls = pd.ExcelFile(excel_path)
df = pd.read_excel(xls, sheet_name=xls.sheet_names[0]).dropna(how='all')

mix_3d = 0
mix_2d = 0
mix_1d = 0
total_deptos = 0
estac = 0
bicis = 0

for i, row in df.iterrows():
    val1 = str(row.iloc[1]).strip()
    val2 = str(row.iloc[2]).strip()
    val3 = str(row.iloc[3]).strip()
    
    if '3 Dormitorios' in val1:
        mix_3d = int(row.iloc[2]) if pd.notna(row.iloc[2]) else 0
    elif '2 Dormitorios' in val1:
        mix_2d = int(row.iloc[2]) if pd.notna(row.iloc[2]) else 0
    elif '1 Dormitorio' in val1:
        mix_1d = int(row.iloc[2]) if pd.notna(row.iloc[2]) else 0
    elif 'Total' in val1 and (mix_3d > 0 or mix_2d > 0):
        total_deptos = int(row.iloc[2]) if pd.notna(row.iloc[2]) else 0
        
    if 'Total' in val3:
        estac = int(row.iloc[4]) if pd.notna(row.iloc[4]) else 0
    if 'Bicicletas 1 @ 1' in val2:
        bicis = int(row.iloc[4]) if pd.notna(row.iloc[4]) else 0

if total_deptos == 0:
    total_deptos = mix_3d + mix_2d + mix_1d

print(f"Extraccion: {total_deptos} deptos (3D:{mix_3d}, 2D:{mix_2d}, 1D:{mix_1d}), {estac} estac, {bicis} bicis")

with open(md_path, "r", encoding="utf-8") as f:
    content = f.read()

# Tipología
old_tipologia_text = "(31 Dptos. de 2 Dorm. y 14 Dptos. de 1 Dorm.)"
new_tipologia_text = f"({mix_3d} Dptos. de 3 Dorm., {mix_2d} Dptos. de 2 Dorm. y {mix_1d} Dptos. de 1 Dorm.)"
content = content.replace(old_tipologia_text, new_tipologia_text)

# Tabla mix
old_table_mix = "- 31 Dptos. 2 Dorm.<br>- 14 Dptos. 1 Dorm."
new_table_mix = f"- {mix_3d} Dptos. 3 Dorm.<br>- {mix_2d} Dptos. 2 Dorm.<br>- {mix_1d} Dptos. 1 Dorm."
content = content.replace(old_table_mix, new_table_mix)

# Totales
content = content.replace("45 departamentos", f"{total_deptos} departamentos")
content = content.replace("18 espacios vehiculares", f"{estac} espacios vehiculares")
content = content.replace("18 vehiculares", f"{estac} vehiculares")
content = content.replace("45 para bicicletas", f"{bicis} para bicicletas")
content = content.replace("45 espacios para bicicletas", f"{bicis} espacios para bicicletas")

with open(md_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Inyeccion de Mix Comercial completada en V1.")
