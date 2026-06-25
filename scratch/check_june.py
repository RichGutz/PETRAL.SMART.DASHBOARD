import pandas as pd

file_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\Facturacion 2026 - 17.06.2026.xlsx"
df_raw = pd.read_excel(file_path, sheet_name='FACTURACION  MOQUEGUA', skiprows=6, header=None)

# Extraer el primer semestre
df_sem1 = df_raw.iloc[:, 0:7].copy()
col_names = ['fecha_bl', 'buque', 'voy_no', 'concepto_puerto', 'cantidad_tm', 'flete', 'facturacion']
df_sem1.columns = col_names

# Mostrar los últimos 40 registros del primer semestre
print(df_sem1.tail(40).to_string(na_rep='NaN'))
