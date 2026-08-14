path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador\FLUJOGRAMA_Arquitectura_Multicotizador_V1.py'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Increase font size by +1pt and set inner node padding/margin
old_node_def = 'node [shape=box, style="filled,rounded", fontname="Arial", fontsize=9];'
new_node_def = 'node [shape=box, style="filled,rounded", fontname="Arial", fontsize=10, margin="0.18,0.14"];'

code = code.replace(old_node_def, new_node_def)
code = code.replace('fontsize=8];', 'fontsize=9];')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("NODE FONT SIZE INCREASED BY +1PT AND INNER MARGIN EXPANDED SUCCESSFULLY!")
