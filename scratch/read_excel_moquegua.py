import openpyxl
import pandas as pd
import os

def read_excel():
    excel_path = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.SANDRA\Costos Moquegua.01.07.2026.xlsx"
    if not os.path.exists(excel_path):
        print(f"Error: {excel_path} no existe.")
        return

    # Usar openpyxl para ver las pestañas primero
    wb = openpyxl.load_workbook(excel_path, read_only=True)
    sheets = wb.sheetnames
    print(f"Hojas encontradas en el Excel: {sheets}\n")
    
    # Leer e imprimir las primeras filas de cada hoja usando pandas
    for sheet in sheets:
        print("="*60)
        print(f"Pestaña: {sheet}")
        print("="*60)
        try:
            df = pd.read_excel(excel_path, sheet_name=sheet)
            print(f"Dimensiones de la tabla: {df.shape[0]} filas x {df.shape[1]} columnas")
            print("Primeras 20 filas:")
            print(df.head(20).to_string())
            print("\n")
        except Exception as e:
            print(f"Error leyendo la pestaña {sheet}: {e}\n")

if __name__ == "__main__":
    read_excel()
