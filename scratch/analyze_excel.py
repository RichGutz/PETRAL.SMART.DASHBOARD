import pandas as pd
import json

try:
    fact_path = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/Facturacion 2026 - 17.06.2026.xlsx'
    df_f = pd.read_excel(fact_path)
    
    marg_path = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/Naviera Petral -Margen de Operacion 2026 - 11.junio.2026.xlsx'
    df_m = pd.read_excel(marg_path, sheet_name='CONSOLIDADO ')
    
    routes_cols = [c for c in df_f.columns if 'origen' in str(c).lower() or 'dest' in str(c).lower() or 'puerto' in str(c).lower() or 'ruta' in str(c).lower()]
    
    conceptos_margen = df_m.iloc[:,0].dropna().tolist()
    
    print("FACTURACION COLUMNAS:", df_f.columns.tolist())
    for c in routes_cols:
        print(f"RUTAS ({c}):", df_f[c].dropna().unique().tolist()[:10])
        
    print("CONCEPTOS MARGEN:", conceptos_margen[:30])
except Exception as e:
    print("Error:", e)
