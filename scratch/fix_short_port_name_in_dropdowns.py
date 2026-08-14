path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_opt = "{p.port_id} — {p.port_name}"
new_opt = "{p.port_id}"

code = code.replace(old_opt, new_opt)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SHORT PORT ID DROPDOWN OPTIONS UPDATED SUCCESSFULLY!")
