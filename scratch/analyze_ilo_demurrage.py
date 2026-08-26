import json

json_path = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\data\historicalDemurrageData.json"

with open(json_path, "r", encoding="utf-8") as f:
    records = json.load(f)

print(f"Total registros históricos: {len(records)}")

ilo_records = [r for r in records if "ports" in r and "ILO" in r["ports"] and r["ports"]["ILO"].get("days") is not None]
print(f"Total registros con puerto ILO: {len(ilo_records)}")

# Agrupar por año y mes
by_year = {}
for r in ilo_records:
    y = r.get("year", 2026)
    m = r.get("month", 1)
    by_year.setdefault(y, []).append((m, r.get("vessel"), r.get("voyage"), r["ports"]["ILO"]["days"]))

for y in sorted(by_year.keys(), reverse=True):
    print(f"\nAño {y}: {len(by_year[y])} recaladas")
    months = {}
    for m, v, voy, days in by_year[y]:
        months.setdefault(m, []).append((v, voy, days))
    for m in sorted(months.keys()):
        print(f"  Mes {m:02d}: {len(months[m])} viajes -> {months[m]}")
