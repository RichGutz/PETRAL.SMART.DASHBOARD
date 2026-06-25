import pandas as pd
import json

paths = [
    "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/Voyage_Calculations_Tablones.xlsx",
    "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/Voyage_Calculations_Moquegua.xlsx",
    "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/Voyage_Calculations_Concon_Trader.xlsx"
]

def find_key_metrics(df):
    metrics = {}
    for row in range(len(df)):
        for col in range(len(df.columns)):
            val = str(df.iloc[row, col]).lower()
            if "voyage result" in val or "resultado" in val or "net income" in val or "margen" in val or "total" in val:
                try:
                    num = float(df.iloc[row, col+1])
                    metrics[val] = num
                except:
                    pass
    return metrics

for p in paths:
    print(f"\n--- {p.split('/')[-1]} ---")
    try:
        df_dict = pd.read_excel(p, sheet_name=None)
        for sheet, df in df_dict.items():
            print(f"Sheet: {sheet}")
            res = find_key_metrics(df)
            if res:
                print(res)
    except Exception as e:
        print(f"Error: {e}")
