import openpyxl

wb = openpyxl.load_workbook(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\Voyage_Calculations_Tablones.xlsx", data_only=True)
ws = wb['ILO-MATARANI']

print("Row content with bunker/IFO/MDO in ILO-MATARANI:")
for r in range(1, 100):
    row_vals = [ws.cell(r, c).value for c in range(1, 15)]
    row_str = " | ".join([str(v) if v is not None else "" for v in row_vals])
    if any(k in row_str.lower() for k in ["bunker", "ifo", "mdo", "precio", "price", "combustible", "valor", "tarifa"]):
        print(f"Row {r}: {row_str}")
