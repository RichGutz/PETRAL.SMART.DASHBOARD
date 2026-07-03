import re

with open("scratch/check_sheets_output.txt", "r", encoding="utf-8") as f:
    content = f.read()

# Dividir por puerto
ports_data = content.split("================================================================================")

for p_data in ports_data:
    if not p_data.strip():
        continue
    lines = p_data.strip().split("\n")
    port_header = lines[0]
    print(f"\n=== {port_header} ===")
    
    # Buscar líneas relevantes (con números o conceptos de costos)
    for line in lines[1:]:
        # Omitir líneas vacías o de decoración
        if not line.strip() or "---" in line or "===" in line:
            continue
        # Si tiene conceptos o números, imprimirla
        if any(keyword in line.lower() for keyword in ["total", "remolcador", "towage", "pilot", "lines", "dockage", "launch", "lighthouse", "agency", "fee", "clearance", "inspecci", "board", "loading", "practicaje", "amarre", "muellaje", "vigilancia", "lanchas", "despacho", "coordinador"]):
            print(line.strip())
        elif re.search(r'\d+', line): # Si tiene números
            # Mostrar también líneas que tengan números importantes
            print(line.strip())
