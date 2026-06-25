import pandas as pd

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
            print(f"Sheet: {sheet}")
            ifo = None
            mdo = None
            for row in range(len(df)):
                for col in range(len(df.columns)):
                    val = str(df.iloc[row, col]).lower()
                    if "ifo" in val and "cost" in val:
                        try: ifo = float(df.iloc[row, col+1])
                        except: pass
                    if "mdo" in val and "cost" in val:
                        try: mdo = float(df.iloc[row, col+1])
                        except: pass
                    if "bunker" in val and "ifo" in val:
                        try: ifo = float(df.iloc[row, col+1])
                        except: pass
                    if "bunker" in val and "mdo" in val:
                        try: mdo = float(df.iloc[row, col+1])
                        except: pass
                    
                    if "ifo" in val:
                        try: 
                            v = float(df.iloc[row, col+1])
                            if v > 1000:
                                ifo = v
                        except: pass
                    if "mdo" in val:
                        try: 
                            v = float(df.iloc[row, col+1])
                            if v > 100:
                                mdo = v
                        except: pass
            print(f"  IFO: {ifo}, MDO: {mdo}")
    except Exception as e:
        print(f"Error: {e}")
