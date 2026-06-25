import os

md_path = r"C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Informe.RG\Informe_Terreno_San_Miguel_345_V1.md"

with open(md_path, "r", encoding="utf-8") as f:
    content = f.read()

# Reemplazos directos de datos fisicos
replacements = {
    "Jr. Jorge Castro Harrinson N° 395": "Jr. Jorge Castro Harrinson N° 345",
    "12 x 50 = 600 m²": "15 x 50 = 750 m²",
    "Sucesión Intestada - LUIS ENRIQUE TEVES CANGAS, NESTOR ALFONSO TEVES CANGAS y DENISE ANGELICA TEVES CANGAS": "LUIS MAURICIO PACHERRES",
    "Área Total:** 600.00 m²": "Área Total:** 750.00 m²",
    "LÍMITE DEL LOTE: 600 M²": "LÍMITE DEL LOTE: 750 M²",
    "Mapa_Ubicacion.395_RUBIO.png": "Mapa_Ubicacion.345.png",
    "Mapa_Comparables_V395.png": "Mapa_Comparables_V345.png"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(md_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Inyeccion de datos basicos completada en V1.")
