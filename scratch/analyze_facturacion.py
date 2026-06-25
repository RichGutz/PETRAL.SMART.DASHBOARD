import pandas as pd

file_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\Facturacion 2026 - 17.06.2026.xlsx"

try:
    print(f"--- ANALIZANDO: {file_path} ---")
    
    # 1. Leer los nombres de las pestañas
    xl = pd.ExcelFile(file_path)
    print("\n[Pestañas encontradas]:")
    print(xl.sheet_names)
    
    # 2. Leer la primera pestaña (asumiendo que es Moquegua)
    # Leemos las primeras 20 filas para ver la estructura (sin headers para ver la matriz cruda)
    if xl.sheet_names:
        first_sheet = xl.sheet_names[0]
        print(f"\n[Estructura cruda de la pestaña '{first_sheet}' - Primeras 20 filas]:")
        df = pd.read_excel(file_path, sheet_name=first_sheet, header=None, nrows=20)
        # Mostrar filas no nulas o al menos las primeras para entender dónde empieza la tabla
        print(df.to_string(na_rep='NaN', index=True, max_cols=15))
        
except Exception as e:
    print(f"Error: {e}")
