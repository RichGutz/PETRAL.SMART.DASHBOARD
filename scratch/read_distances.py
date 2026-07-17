import pandas as pd
import json

file_path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\Tabla distancias.xlsx'

try:
    df = pd.read_excel(file_path)
    info = {
        "columns": list(df.columns),
        "head": df.head().to_dict(orient='records')
    }
    with open(r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\scratch\distances_head.json', 'w', encoding='utf-8') as f:
        json.dump(info, f, indent=2, ensure_ascii=False)
    print("Success reading Excel. Data saved to distances_head.json")
except Exception as e:
    print(f"Error reading Excel: {e}")
