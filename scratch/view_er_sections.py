with open(r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.1\DashBoardPetral\Modelo.E-R.md", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if line.startswith("###") or "Tabla:" in line:
        print(f"Línea {idx+1}: {line.strip()}")
