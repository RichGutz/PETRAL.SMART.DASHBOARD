import os

path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("const [contractsMaster, setContractsMaster] = useState<any[]>([]);", "// const [contractsMaster, setContractsMaster] = useState<any[]>([]);")
code = code.replace("setContractsMaster(contractsData || []);", "// setContractsMaster(contractsData || []);")

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("UNUSED VARIABLE WARN FIXED SUCCESSFULLY!")
