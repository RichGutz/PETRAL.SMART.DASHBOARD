import os

path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Change initial state of selectedClient from 'SPCC' to ''
code = code.replace("const [selectedClient, setSelectedClient] = useState<string>('SPCC');", "const [selectedClient, setSelectedClient] = useState<string>('');")

# 2. Add <option value="">[SELECCIONAR CLIENTE]</option> as the first option in Paso 1 select
old_select_p1 = """                            {clients.length > 0 ? (
                                clients.map(c => <option key={c} value={c}>{c}</option>)
                            ) : (
                                <>
                                    <option value="SPCC">SPCC (Southern Peru Copper)</option>
                                    <option value="TRAFIGURA">TRAFIGURA PERU S.A.C.</option>
                                    <option value="GLENCORE">GLENCORE PERU S.A.</option>
                                    <option value="SOUTHERN">SOUTHERN COPPER CORPORATION</option>
                                </>
                            )}"""

new_select_p1 = """                            <option value="">[SELECCIONAR CLIENTE]</option>
                            {clients.map(c => <option key={c} value={c}>{c}</option>)}"""

code = code.replace(old_select_p1, new_select_p1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("[SELECCIONAR CLIENTE] INITIAL OPTION ADDED SUCCESSFULLY!")
