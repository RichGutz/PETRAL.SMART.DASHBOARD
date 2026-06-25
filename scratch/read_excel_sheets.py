import pandas as pd

file1 = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\Voyage_Calculation_Tablones.xlsx"

print("--- Explorando Hoja: ILO-MATARANI (Muestra de las primeras 35 filas) ---")
try:
    df = pd.read_excel(file1, sheet_name="ILO-MATARANI", header=None, nrows=35)
    
    # Imprimir fila por fila omitiendo nulos completos para ver la estructura de la "calculadora"
    for index, row in df.iterrows():
        # Filtramos valores nulos para no ensuciar la salida
        row_clean = [str(x) for x in row if pd.notna(x)]
        if row_clean:
            print(f"Fila {index}: {' | '.join(row_clean)}")
except Exception as e:
    print(f"Error: {e}")
