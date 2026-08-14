path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add contractsMaster state and fetch in initial useEffect
code = code.replace(
    "    const [contractsMaster, setContractsMaster] = useState<any[]>([]);",
    "    const [contractsMaster, setContractsMaster] = useState<any[]>([]);"
)

# Replace overhead text in grid header
code = code.replace("placeholder=\"Overhead\"", "placeholder=\"Time to Count\"")
code = code.replace("title=\"Overhead en horas\"", "title=\"Time to Count (H)\"")
code = code.replace("Overhead", "Time to Count")

# Replace overhead property accesses
code = code.replace(".overhead", ".time_to_count")
code = code.replace("overhead:", "time_to_count:")
code = code.replace("port_overhead_hours_origin", "time_to_count_carga_hrs")
code = code.replace("port_overhead_hours_dest", "time_to_count_descarga_hrs")

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("INITIAL REPLACEMENTS COMPLETED!")
