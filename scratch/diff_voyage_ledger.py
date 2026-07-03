import difflib

file1 = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\VoyageLedgerTest.tsx"
file2 = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\VoyageLedgerTest_V5.tsx"

with open(file1, "r", encoding="utf-8") as f1, open(file2, "r", encoding="utf-8") as f2:
    lines1 = f1.readlines()
    lines2 = f2.readlines()

diff = difflib.unified_diff(lines2, lines1, fromfile="VoyageLedgerTest_V5.tsx", tofile="VoyageLedgerTest.tsx")
for line in diff:
    # Imprimir solo las líneas modificadas
    if line.startswith("+") or line.startswith("-"):
        # Filtrar los headers de difflib
        if not (line.startswith("+++") or line.startswith("---")):
            print(line.rstrip())
