import pandas as pd

def main():
    path1 = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\Maestro_de_Distancias_y_Rutas_2026-07-16.xlsx"
    path2 = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\Maestro_de_Distancias_y_Rutas_2026-07-20.xlsx"
    
    try:
        df1 = pd.read_excel(path1)
        df2 = pd.read_excel(path2)
        
        print(f"Filas/Columnas archivo 16-Jul: {df1.shape}")
        print(f"Filas/Columnas archivo 20-Jul: {df2.shape}")
        
        cols1 = list(df1.columns)
        cols2 = list(df2.columns)
        if cols1 != cols2:
            print("Las columnas son diferentes.")
        else:
            print("Las columnas son idénticas.")
            
        # Sort values to ensure row order doesn't cause a false difference
        df1_sorted = df1.sort_values(by=[cols1[0], cols1[1]]).reset_index(drop=True)
        df2_sorted = df2.sort_values(by=[cols2[0], cols2[1]]).reset_index(drop=True)
        
        try:
            pd.testing.assert_frame_equal(df1_sorted, df2_sorted)
            print("RESULTADO: Los archivos son 100% IDENTICOS en contenido.")
        except AssertionError as e:
            print("RESULTADO: Los archivos son DIFERENTES.")
            
            # Find differences
            diff = df1_sorted.compare(df2_sorted)
            print("Diferencias encontradas:")
            print(diff)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
