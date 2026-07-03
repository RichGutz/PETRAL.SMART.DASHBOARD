with open(r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend\services\forecast_service.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Imprimir desde la línea 270 hasta la 375
for idx in range(270, 375):
    print(f"Línea {idx+1}: {lines[idx].rstrip()}")
