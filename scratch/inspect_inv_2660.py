import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

file_path = r"C:\Users\rguti\Inandes.ERP.React\src\features\inversionistas\InversionistasPage.tsx"
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

print("\nLines 2660-2740 of InversionistasPage.tsx:")
for i in range(2659, min(2740, len(lines))):
    print(f"{i+1}: {lines[i].rstrip()}")
