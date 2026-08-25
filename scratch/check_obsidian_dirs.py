import sys
import os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 1. Check/Create Obsidian directories
obsidian_dir = r"C:\Users\rguti\Inandes.ERP.React\Obsidian\Mudanza.Contabo\Mudanza.Contabo"
os.makedirs(obsidian_dir, exist_ok=True)
print(f"Directorio Obsidian verificado: {obsidian_dir}")

# List existing notes if any
parent_dir = r"C:\Users\rguti\Inandes.ERP.React\Obsidian"
print("\nEstructura en Obsidian:")
for root, dirs, files in os.walk(parent_dir):
    rel = os.path.relpath(root, parent_dir)
    print(f"[{rel}]")
    for f in files:
        print(f"  - {f}")
