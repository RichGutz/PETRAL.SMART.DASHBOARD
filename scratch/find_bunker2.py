import pandas as pd
p = "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/Voyage_Calculations_Tablones.xlsx"
df_dict = pd.read_excel(p, sheet_name=None, header=None)
for sheet, df in df_dict.items():
    if "MATARANI" in sheet:
        for row in range(len(df)):
            for col in range(len(df.columns)):
                val = str(df.iloc[row, col]).lower()
                if "ifo" in val or "mdo" in val or "bunker" in val or "combustible" in val:
                    print(f"[{row},{col}] {df.iloc[row, col]}: ", end="")
                    for c2 in range(col+1, min(col+5, len(df.columns))):
                        print(f"{df.iloc[row, c2]} | ", end="")
                    print()
