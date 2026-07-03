with open(r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend\engine.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "audit_trail" in line or "voyage_result" in line or "port_costs" in line:
        # Imprimir la línea y las siguientes 5
        print(f"Línea {i+1}: {line.strip()}")
        for j in range(1, 10):
            if i + j < len(lines):
                print(f"  +{j}: {lines[i+j].strip()}")
        print("="*80)
