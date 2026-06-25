import re
with open(r'C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Informe.RG\Informe_Terreno_San_Miguel_345_V1.md', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'<img[^>]+src=["\']([^"\']+)["\']', text):
    print('IMG src:', m.group(1))
