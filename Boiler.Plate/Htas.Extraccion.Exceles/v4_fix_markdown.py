import re

md_path = r'C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Informe.RG\Informe_Terreno_San_Miguel_345_V1.md'
with open(md_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Purgar el dato falso de 50 m2
content = content.replace(
    'Permite diseño de departamentos desde 40 m² (1 dorm.) y 50 m² (2 dorm.), perfectos para',
    'Permite diseño de departamentos desde 40 m² (1 dorm.), perfectos para'
)

# Añadir el mapa de la huaca sin borrar el actual
# Buscamos el final de la sección Ubicación y Contexto Urbano
mapa_huaca = """
<div style="page-break-before: always; margin-top: 20px;">
  <h2 style="color: #0f2c59; border-bottom: 2px solid #0f2c59; padding-bottom: 5px;">2.1 Proximidad a Obra Cercana (Desarrollador)</h2>
  <p style="font-size: 11pt; color: #333;">A continuación, se detalla la cercanía estratégica del lote con el terreno de la Huaca, confirmando la sinergia con la obra preexistente del desarrollador en la misma micro-zona.</p>
  <div style="text-align: center; margin-top: 15px;">
    <img src="C:\\Users\\rguti\\Cabidas.Arquitectonicas.AC.RG\\Castro.Harrison.395\\Foto.Fachada.395.jpeg" style="max-width: 90%; border: 1px solid #ccc; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  </div>
</div>

## 3. Parámetros Urbanísticos y Normativa (VIS)"""

content = content.replace("## 3. Parámetros Urbanísticos y Normativa (VIS)", mapa_huaca)

with open(md_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Markdown V4 Corrections Applied: 50m2 purged, Huaca Map appended.")
