import pandas as pd
import os
import glob
import json

base_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral"
files = glob.glob(os.path.join(base_dir, "Voyage_Calculations_*.xlsx"))

results = {}

for file in files:
    vessel_name = os.path.basename(file).replace("Voyage_Calculations_", "").replace(".xlsx", "")
    try:
        # Load the excel file to find the tab starting with 'resumen'
        xl = pd.ExcelFile(file)
        resumen_sheet = None
        for sheet in xl.sheet_names:
            if sheet.lower().startswith('resumen'):
                resumen_sheet = sheet
                break
        
        if resumen_sheet:
            df = pd.read_excel(file, sheet_name=resumen_sheet)
            # Convert to dictionary or list of lists for easy printing
            # We'll just extract a sample or the whole dataframe as a dict to see its structure
            # Since the structure might be messy, let's just dump the first 30 rows and 15 columns
            df_sample = df.iloc[:30, :15].fillna("")
            
            results[vessel_name] = {
                "sheet_name": resumen_sheet,
                "data": df_sample.to_dict(orient='records')
            }
        else:
            results[vessel_name] = {"error": "No sheet starting with 'resumen' found."}
    except Exception as e:
        results[vessel_name] = {"error": str(e)}

with open(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\scratch\extracted_resumen.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=4)
print("Done extracting.")
