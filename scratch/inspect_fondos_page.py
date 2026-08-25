import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

file_path = r"C:\Users\rguti\Inandes.ERP.React\src\features\fondos\FondosPage.tsx"
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

print("Top 25 lines of FondosPage.tsx:")
for i in range(min(25, len(lines))):
    print(f"{i+1}: {lines[i].rstrip()}")

print("\nLines 280-300 of FondosPage.tsx:")
for i in range(279, min(300, len(lines))):
    print(f"{i+1}: {lines[i].rstrip()}")
