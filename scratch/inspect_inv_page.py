import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

file_path = r"C:\Users\rguti\Inandes.ERP.React\src\features\inversionistas\InversionistasPage.tsx"
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

print("Top 25 lines of InversionistasPage.tsx:")
for i in range(min(25, len(lines))):
    print(f"{i+1}: {lines[i].rstrip()}")

print("\nLines 120-140 of InversionistasPage.tsx:")
for i in range(119, min(140, len(lines))):
    print(f"{i+1}: {lines[i].rstrip()}")
