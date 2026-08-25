import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

file_path = r"C:\Users\rguti\Inandes.ERP.React\src\config\apiConfig.ts"
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    print(f.read())
