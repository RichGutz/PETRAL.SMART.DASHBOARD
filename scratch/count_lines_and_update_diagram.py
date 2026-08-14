import os
import re

files_to_count = {
    "MultiCotizadorExcel.tsx": r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx",
    "vesselProviderService.ts": r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\services\providers\vesselProviderService.ts",
    "bunkerProviderService.ts": r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\services\providers\bunkerProviderService.ts",
    "routeDistancesService.ts": r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\services\providers\routeDistancesService.ts",
    "portCostsRatesService.ts": r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\services\providers\portCostsRatesService.ts",
    "multicotizadorStorageService.ts": r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\services\providers\multicotizadorStorageService.ts",
    "multicotizadorRetrieverService.ts": r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\services\providers\multicotizadorRetrieverService.ts",
    "run_qc_loop.py": r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\run_qc_loop.py"
}

loc_counts = {}

for name, path in files_to_count.items():
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            loc_counts[name] = len(lines)
            print(f"{name}: {len(lines)} lines")
    else:
        print(f"NOT FOUND: {path}")

# Update FLUJOGRAMA_Arquitectura_Multicotizador_V1.py with LOC counts
flow_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador\FLUJOGRAMA_Arquitectura_Multicotizador_V1.py"

with open(flow_path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("vesselProviderService\\n", f"vesselProviderService ({loc_counts.get('vesselProviderService.ts', 0)} LOC)\\n")
code = code.replace("bunkerProviderService\\n", f"bunkerProviderService ({loc_counts.get('bunkerProviderService.ts', 0)} LOC)\\n")
code = code.replace("routeDistancesService\\n", f"routeDistancesService ({loc_counts.get('routeDistancesService.ts', 0)} LOC)\\n")
code = code.replace("portCostsRatesService\\n", f"portCostsRatesService ({loc_counts.get('portCostsRatesService.ts', 0)} LOC)\\n")
code = code.replace("multicotizadorStorageService\\n", f"multicotizadorStorageService ({loc_counts.get('multicotizadorStorageService.ts', 0)} LOC)\\n")
code = code.replace("multicotizadorRetrieverService\\n", f"multicotizadorRetrieverService ({loc_counts.get('multicotizadorRetrieverService.ts', 0)} LOC)\\n")
code = code.replace("MultiCotizadorExcel.tsx)", f"MultiCotizadorExcel.tsx - {loc_counts.get('MultiCotizadorExcel.tsx', 0)} LOC)")
code = code.replace("run_triangular_qc_loop.py\\n", f"run_qc_loop.py ({loc_counts.get('run_qc_loop.py', 0)} LOC)\\n")

with open(flow_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("LOC COUNTS INSERTED INTO GRAPHVIZ SCRIPT SUCCESSFULLY!")
