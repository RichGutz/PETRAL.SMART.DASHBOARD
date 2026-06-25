import re

md_path = r'C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Informe.RG\Informe_Terreno_San_Miguel_345_V1.md'
with open(md_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Ortografía
content = content.replace('Harrinson', 'Harrison')
content = content.replace('HARRINSON', 'HARRISON')

# 2. Huella Techada
content = content.replace('420 m² por planta', '525 m² por planta')

# 3. Foto Fachada
content = content.replace(r'C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.395\Foto.Fachada.395.jpeg', 
                          r'C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Foto.Fachada.345.jpg')

# 4. Squeeze CSS for Slide 5 Layout
# Reducir padding de tabla general
content = content.replace('padding: 10px;', 'padding: 4px;')
# Reducir padding de la Nota Comercial y headers
content = content.replace('padding: 6px;', 'padding: 4px;')

# Reducir margins del Perfil de Elevación
content = content.replace('margin-top: 30px; margin-bottom: 20px;', 'margin-top: 5px; margin-bottom: 5px;')
content = content.replace('margin-bottom: 15px; font-size: 24pt;', 'margin-bottom: 5px; font-size: 16pt;')
content = content.replace('margin: 30px auto 0 auto;', 'margin: 5px auto 0 auto;')

with open(md_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Markdown V3 Fixed.")
