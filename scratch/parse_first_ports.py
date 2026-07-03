import pandas as pd

excel_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.SANDRA\Costos Tablones.01.07.2026.xlsx"
sheets = ['ILO', 'MATARANI', 'MARCONA', 'CALLAO', 'MEJILLONES.A']

for s in sheets:
    print("\n" + "="*50)
    print(f"SHEET: {s}")
    print("="*50)
    df = pd.read_excel(excel_path, sheet_name=s)
    df = df.dropna(how='all')
    for idx, row in df.iterrows():
        row_vals = [str(x).strip() for x in row.values if pd.notna(x)]
        if len(row_vals) > 0:
            print(f"Row {idx}: {row_vals}")
