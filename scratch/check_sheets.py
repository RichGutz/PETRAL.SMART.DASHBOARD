import pandas as pd

excel_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.SANDRA\Costos Tablones.01.07.2026.xlsx"
sheets = ['ILO', 'MATARANI', 'MARCONA', 'CALLAO', 'MEJILLONES.A', 'MEJILLONES INTERACID', 'MEJILLONES.TERQUIM', 'BARQUITO']

for sheet in sheets:
    print("\n" + "="*80)
    print(f"PUERTO: {sheet}")
    print("="*80)
    df = pd.read_excel(excel_path, sheet_name=sheet)
    # Limpiamos filas y columnas totalmente vacías
    df = df.dropna(how='all').dropna(axis=1, how='all')
    print(df.to_string(index=False))
