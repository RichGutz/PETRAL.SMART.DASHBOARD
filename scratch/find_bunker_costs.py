import pandas as pd
import math

paths = [
    "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/Voyage_Calculations_Tablones.xlsx",
    "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/Voyage_Calculations_Moquegua.xlsx",
    "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/Voyage_Calculations_Concon_Trader.xlsx"
]

for p in paths:
    print(f"\n--- {p.split('/')[-1]} ---")
    try:
        df_dict = pd.read_excel(p, sheet_name=None, header=None)
        for sheet, df in df_dict.items():
            if "MATARANI" in sheet or "MARCONA" in sheet or "MEJILLONES" in sheet:
                print(f"Sheet: {sheet}")
                ifo_cost = 0
                mdo_cost = 0
                for row in range(len(df)):
                    for col in range(len(df.columns)):
                        val = str(df.iloc[row, col]).strip()
                        if val == "IFO $":
                            try: 
                                v = float(df.iloc[row+1, col])
                                if not math.isnan(v): ifo_cost = v
                            except: pass
                        if val == "MDO $":
                            try: 
                                v = float(df.iloc[row+1, col])
                                if not math.isnan(v): mdo_cost = v
                            except: pass
                print(f"  IFO: {ifo_cost}, MDO: {mdo_cost}")
    except Exception as e:
        print(f"Error: {e}")
