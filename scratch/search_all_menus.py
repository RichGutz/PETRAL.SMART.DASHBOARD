import os

frontend_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src"

print("--- BUSCANDO 'Auditoría PDF' O 'Spaguetti' EN TODO EL FRONTEND LOCAL ---")
for root, dirs, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.jsx', '.js')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if 'Auditoría PDF' in content or 'Spaguetti' in content or 'Auditoría Final' in content:
                    print(f"ENCONTRADO EN: {file}")
                    # Buscar líneas específicas
                    for i, line in enumerate(content.splitlines(), 1):
                        if 'Auditoría PDF' in line or 'Spaguetti' in line or 'Auditoría Final' in line:
                            print(f"  Línea {i}: {line.strip()}")
