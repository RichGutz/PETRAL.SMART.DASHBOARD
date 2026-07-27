import os
import re
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional'
EXTENSIONS = ('.py', '.ts', '.tsx')
EXCLUDE_DIRS = {'node_modules', 'dist', 'build', '.git', '__pycache__', '.venv', 'venv', '.gemini'}

HARDCODED_PATTERNS = [
    (r'MATRIX_PORT_MAP\s*=\s*\{[^}]+\}', 'Mapa de tarifas de puerto hardcoded (debería ser consulta SQL)'),
    (r'\b16373\.15\b', 'Costo base hardcoded de Ilo (,373.15)'),
    (r'\b48676\.32\b', 'Costo base hardcoded de Mejillones (,676.32)'),
    (r'\b34238\.30\b', 'Costo base hardcoded de Terquim (,238.30)'),
    (r'\b655\.28\b', 'Precio hardcoded de búnker IFO (.28/MT)'),
    (r'\b1083\.84\b', 'Precio hardcoded de búnker MDO (,083.84/MT)'),
    (r'\b25\.5\b', 'Tarifa flete proyectada fallback hardcoded (.50/MT)'),
    (r'\b13000(?:\.00)?\b', 'TCE Requerido por defecto hardcoded (,000/día)'),
    (r'\b15000(?:\.00)?\b', 'TCE Requerido de Tablones hardcoded (,000/día)'),
    (r'450\.0\b', 'Ritmo de carga hardcoded (450.0 MT/h)'),
    (r'350\.0\b', 'Ritmo de descarga hardcoded (350.0 MT/h)'),
]

def scan_software():
    print("=" * 115)
    print("🔍 AUDITORÍA QC: BÚSQUEDA DE VALORES Y NÚMEROS HARDCODED EN EL SOFTWARE PETRAL")
    print("   Ubicación: " + ROOT_DIR)
    print("=" * 115)

    findings = []
    total_files_scanned = 0

    for root, dirs, files in os.walk(ROOT_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            if file.endswith(EXTENSIONS) and not file.startswith('looking.for'):
                total_files_scanned += 1
                filepath = os.path.join(root, file)
                rel_path = os.path.relpath(filepath, ROOT_DIR)
                
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = f.readlines()
                        
                    for line_num, line in enumerate(lines, 1):
                        clean_line = line.strip()
                        if clean_line.startswith('//') or clean_line.startswith('#') or clean_line.startswith('*'):
                            continue

                        for pattern, category in HARDCODED_PATTERNS:
                            if re.search(pattern, line):
                                findings.append({
                                    "file": rel_path,
                                    "line": line_num,
                                    "code": clean_line[:90],
                                    "category": category
                                })
                except Exception as e:
                    pass

    print(f"\n📂 Archivos analizados: {total_files_scanned}")
    print(f"⚠️ Hallazgos de números hardcoded detectados: {len(findings)}\n")

    if findings:
        print(f"{'#':<4} | {'ARCHIVO / RUTA':<55} | {'LÍNEA':<6} | {'CATEGORÍA Y REGLA RECOMENDADA'}")
        print("-" * 115)
        for idx, item in enumerate(findings, 1):
            print(f"{idx:<4} | {item['file']:<55} | {item['line']:<6} | {item['category']}")
            print(f"     └─ Código: {item['code']}\n")
    else:
        print("🎉 ¡EXCELENTE! No se detectaron números hardcoded en el código analizado.")

    print("=" * 115)
    print("💡 RECOMENDACIÓN DE AUDITORÍA: Reemplazar los hallazgos por consultas dinámicas SQL (Supabase DB).")
    print("=" * 115)

if __name__ == "__main__":
    scan_software()
