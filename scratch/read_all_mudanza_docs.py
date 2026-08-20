import os
import sys
import glob

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

folder = r"C:\Users\rguti\Inandes.ERP.React\Obsidian\Mudanza.Contabo\Mudanza.Contabo"
md_files = glob.glob(os.path.join(folder, "*.md"))

for path in sorted(md_files):
    name = os.path.basename(path)
    print(f"\n{'='*20} FILE: {name} {'='*20}")
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()
        print(content)
