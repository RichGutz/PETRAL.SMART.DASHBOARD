import os

# Recount LOC of MultiCotizadorExcel.tsx
p_container = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx"
with open(p_container, 'r', encoding='utf-8') as f:
    container_loc = len(f.readlines())

print(f"NEW CONTAINER LOC: {container_loc}")

# Update Graphviz python script
p_script = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador\FLUJOGRAMA_Arquitectura_Multicotizador_V1.py"
with open(p_script, 'r', encoding='utf-8') as f:
    code = f.read()

import re
code = re.sub(r'MultiCotizadorExcel\.tsx - \d+ LOC\)', f'MultiCotizadorExcel.tsx - {container_loc} LOC)', code)
code = re.sub(r'MultiCotizadorExcel\.tsx ~\d+ L\)', f'MultiCotizadorExcel.tsx ~{container_loc} LOC)', code)

with open(p_script, 'w', encoding='utf-8') as f:
    f.write(code)

print("GRAPHVIZ SCRIPT UPDATED WITH NEW MODULAR CONTAINER LOC!")
