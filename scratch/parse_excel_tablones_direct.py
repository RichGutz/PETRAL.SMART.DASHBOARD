import pandas as pd
import openpyxl

excel_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.SANDRA\Costos Tablones.01.07.2026.xlsx"
wb = openpyxl.load_workbook(excel_path, read_only=True)
sheets = ['ILO', 'MATARANI', 'MARCONA', 'CALLAO', 'MEJILLONES.A', 'MEJILLONES INTERACID', 'MEJILLONES.TERQUIM', 'BARQUITO']

for s in sheets:
    print("\n" + "="*50)
    print(f"SHEET: {s}")
    print("="*50)
    df = pd.read_excel(excel_path, sheet_name=s)
    # Eliminar filas completamente nulas
    df = df.dropna(how='all')
    # Mostrar todas las filas que tengan algún contenido
    for idx, row in df.iterrows():
        # Filtrar filas vacías
        row_vals = [str(x).strip() for x in row.values if pd.notna(x)]
        if len(row_vals) > 0:
            print(f"Row {idx}: {row_vals}")
