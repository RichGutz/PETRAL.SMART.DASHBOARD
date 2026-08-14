path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador\FLUJOGRAMA_Arquitectura_Multicotizador_V1.py'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace Nivel 3 cluster and node purple/fuchsia colors with executive navy/slate/sky blue
code = code.replace('color="#7B1FA2"; fillcolor="#F3E5F5";', 'color="#0284C7"; fontcolor="#0F172A"; fillcolor="#F0F9FF";')
code = code.replace('fillcolor="#E1BEE7"', 'fillcolor="#E0F2FE"')
code = code.replace('fillcolor="#D1C4E9"', 'fillcolor="#E0E7FF"')
code = code.replace('color="#7B1FA2"', 'color="#0284C7"')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("EXECUTIVE CORPORATE COLOR PALETTE APPLIED SUCCESSFULLY!")
