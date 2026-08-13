path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\pages\Masters\PortCostsMaster_V2.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Fix 1: -lm -> -loading_master in focusedInput check
code = code.replace("CARGA-lm`", "CARGA-loading_master`")
code = code.replace("DESCARGA-lm`", "DESCARGA-loading_master`")

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("PORTCOSTSMASTER_V2.TSX KEYS FIXED SUCCESSFULLY!")
