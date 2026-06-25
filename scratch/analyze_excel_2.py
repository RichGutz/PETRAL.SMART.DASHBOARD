import pandas as pd
try:
    fact_path = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/Facturacion 2026 - 17.06.2026.xlsx'
    df_f = pd.read_excel(fact_path, header=1)
    print("FACTURACION COLUMNS (Header 1):", df_f.columns.tolist())
    
    routes_cols = [c for c in df_f.columns if 'origen' in str(c).lower() or 'dest' in str(c).lower() or 'puerto' in str(c).lower() or 'ruta' in str(c).lower() or 'load' in str(c).lower() or 'disch' in str(c).lower()]
    for c in routes_cols:
        print(f"RUTAS ({c}):", df_f[c].dropna().unique().tolist()[:10])
        
    # If not found, try header=2
    if not routes_cols:
        df_f = pd.read_excel(fact_path, header=2)
        print("FACTURACION COLUMNS (Header 2):", df_f.columns.tolist())
        routes_cols = [c for c in df_f.columns if 'origen' in str(c).lower() or 'dest' in str(c).lower() or 'puerto' in str(c).lower() or 'ruta' in str(c).lower() or 'load' in str(c).lower() or 'disch' in str(c).lower()]
        for c in routes_cols:
            print(f"RUTAS ({c}):", df_f[c].dropna().unique().tolist()[:10])
except Exception as e:
    print("Error:", e)
