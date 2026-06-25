import openpyxl

f = "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/Voyage_Calculations_Tablones.xlsx"
wb = openpyxl.load_workbook(f, data_only=True) # Data only to get the evaluated numbers
ws = wb["ILO-MATARANI"]

cells_to_check = ["M50", "N50", "O50", "B60", "C60", "B61", "C61", "P9", "S9", "P10", "S10"]

print("Tabla de Itinerario (Filas 40 a 50):")
for row in ws.iter_rows(min_row=40, max_row=50, values_only=True):
    # Imprimir columnas A a P (índices 0 a 15)
    print([str(x)[:15] if x is not None else "" for x in row[:16]])

