import pandas as pd

file_path = r'C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Estructura Cabida CASTRO.HARRISON.ACI.345.GRPY.xlsx'

try:
    df = pd.read_excel(file_path, sheet_name=0, header=None)
    
    print("================ MOCK TAB 0 ================")
    print("Buscando las cabeceras (Área de departamentos)...")
    
    # Imprimir las primeras 15 filas no nulas para ver exactamente cómo se estructuran las áreas
    for index, row in df.head(15).iterrows():
        # Filtramos los nulos para leer solo la info útil
        row_dict = row.dropna().to_dict()
        if row_dict:
            print(f"Fila {index}: {row_dict}")
            
    print("============================================")
except Exception as e:
    print('Error leyendo Excel:', e)
