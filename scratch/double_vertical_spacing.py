path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador\FLUJOGRAMA_Arquitectura_Multicotizador_V1.py'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Double the vertical separation ranksep and nodesep
code = code.replace('nodesep=0.6;', 'nodesep=0.9;')
code = code.replace('ranksep=0.8;', 'ranksep=1.8;')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("VERTICAL SPACING DOUBLED FOR MAXIMUM READABILITY!")
