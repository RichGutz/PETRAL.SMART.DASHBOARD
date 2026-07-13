import pandas as pd
import sys

excel_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.PATRICIA\Costos.SUA  %  2026 01.07.2026 REV AL 10.07 TPM MEJILLONES.xlsx"

try:
    xl = pd.ExcelFile(excel_path)
    with open("mejillones_tpm_dump.txt", "w", encoding="utf-8") as f:
        f.write(f"Sheets: {xl.sheet_names}\n\n")
        for sheet in xl.sheet_names:
            df = xl.parse(sheet)
            f.write(f"\n--- Sheet: {sheet} ---\n")
            f.write(df.to_string())
except Exception as e:
    print("Error:", e)
