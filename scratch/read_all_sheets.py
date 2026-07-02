import openpyxl
import pandas as pd
import os

def read_all_sheets_to_md():
    excel_path = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.SANDRA\Costos Moquegua.01.07.2026.xlsx"
    output_md = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\scratch\excel_dump.md"
    
    if not os.path.exists(excel_path):
        print(f"Error: {excel_path} no existe.")
        return

    xl = pd.ExcelFile(excel_path)
    sheets = xl.sheet_names
    
    md_lines = []
    md_lines.append("# 📊 Volcado Completo de Costos Moquegua.01.07.2026.xlsx\n")
    md_lines.append(f"Hojas encontradas: {', '.join(sheets)}\n\n")
    
    for sheet in sheets:
        md_lines.append(f"## 📋 Pestaña: {sheet}\n")
        df = xl.parse(sheet)
        md_lines.append(f"**Dimensiones:** {df.shape[0]} filas x {df.shape[1]} columns\n\n")
        
        # Convertir a formato tabla Markdown
        md_table = df.to_markdown(index=False)
        md_lines.append(md_table)
        md_lines.append("\n\n---\n\n")
        
    with open(output_md, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))
        
    print(f"Volcado exitoso a Markdown en: {output_md}")

if __name__ == "__main__":
    read_all_sheets_to_md()
