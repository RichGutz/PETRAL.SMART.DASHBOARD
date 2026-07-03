import openpyxl
import pandas as pd
import os

def analyze():
    excel_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.SANDRA\Costos Tablones.01.07.2026.xlsx"
    wb = openpyxl.load_workbook(excel_path, read_only=True)
    sheets = wb.sheetnames
    
    with open("scratch/tablones_analysis.txt", "w", encoding="utf-8") as f:
        f.write(f"Hojas en el Excel: {sheets}\n\n")
        
        for sheet in sheets:
            f.write("="*80 + "\n")
            f.write(f"HOJA: {sheet}\n")
            f.write("="*80 + "\n")
            try:
                df = pd.read_excel(excel_path, sheet_name=sheet)
                f.write(f"Shape: {df.shape}\n")
                f.write("Columnas: " + str(df.columns.tolist()) + "\n\n")
                f.write(df.to_string())
                f.write("\n\n")
            except Exception as e:
                f.write(f"Error: {e}\n\n")

if __name__ == "__main__":
    analyze()
