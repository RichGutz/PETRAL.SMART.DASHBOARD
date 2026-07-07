import re

with open(r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx", "r", encoding="utf-8") as f:
    content = f.read()

sizes = re.findall(r"text-\[(\d+(?:\.\d+)?)px\]", content)
from collections import Counter
c = Counter(sizes)
print("Found explicit pixel sizes:")
for size, count in c.most_common():
    print(f"text-[{size}px]: {count} times")
