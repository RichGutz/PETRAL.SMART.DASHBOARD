import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def show_lines(file_path, line_nos):
    print("=" * 60)
    print(f"File: {file_path}")
    print("=" * 60)
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        for lno in line_nos:
            start = max(0, lno - 5)
            end = min(len(lines), lno + 5)
            print(f"--- Around line {lno} ---")
            for i in range(start, end):
                prefix = ">>>" if i + 1 == lno else "   "
                print(f"{prefix} {i+1}: {lines[i].rstrip()}")
            print()

show_lines(r"C:\Users\rguti\Inandes.ERP.React\src\features\fondos\FondosPage.tsx", [288])
show_lines(r"C:\Users\rguti\Inandes.ERP.React\src\features\inversionistas\InversionistasPage.tsx", [127, 2668, 2724])
