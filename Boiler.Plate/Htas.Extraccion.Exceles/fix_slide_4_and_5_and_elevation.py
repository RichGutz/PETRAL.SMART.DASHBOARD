import re

md_path = r"C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Castro.Harrison.345\Informe.RG\Informe_Terreno_San_Miguel_345_V1.md"

with open(md_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Correccion Slide 4
content = content.replace("2,641.16 m²", "3,304.64 m²")
content = content.replace("4,093 m²", "5,145.27 m²")

# 2. Correccion Layout Slide 5
content = content.replace("font-size: 14pt; margin-top: 15px;", "font-size: 11pt; margin-top: 10px;")
content = content.replace("font-size: 10.5pt; font-style: italic; background-color: #f9f9f9; text-align: justify; line-height: 1.3;", "font-size: 9pt; font-style: italic; background-color: #f9f9f9; text-align: justify; line-height: 1.2; padding: 6px;")

# 3. Recrear Perfil Elevacion HTML
# Piso Tipico (7 deptos: 1 de 3D, 4 de 2D, 2 de 1D)
piso_tipico_html = """
    <div style="display: flex; border-bottom: 1px solid #333; width: 100%;">
      <div style="width: 13.4%; background: #1f618d; color: #fff; padding: 6px; border-right: 1px solid #fff; font-size: 8pt; white-space: nowrap; overflow: hidden;">3D 70m²</div>
      <div style="width: 9.6%; background: #1e8449; color: #fff; padding: 6px; border-right: 1px solid #fff; font-size: 8pt; white-space: nowrap; overflow: hidden;">2D 50m²</div>
      <div style="width: 9.6%; background: #1e8449; color: #fff; padding: 6px; border-right: 1px solid #fff; font-size: 8pt; white-space: nowrap; overflow: hidden;">2D 50m²</div>
      <div style="width: 7.6%; background: #b9770e; color: #fff; padding: 6px; border-right: 1px solid #fff; font-size: 8pt; white-space: nowrap; overflow: hidden;">1D 40m²</div>
      <div style="width: 7.6%; background: #b9770e; color: #fff; padding: 6px; border-right: 1px solid #fff; font-size: 8pt; white-space: nowrap; overflow: hidden;">1D 40m²</div>
      <div style="width: 9.6%; background: #1e8449; color: #fff; padding: 6px; border-right: 1px solid #fff; font-size: 8pt; white-space: nowrap; overflow: hidden;">2D 50m²</div>
      <div style="width: 9.6%; background: #1e8449; color: #fff; padding: 6px; border-right: 1px solid #fff; font-size: 8pt; white-space: nowrap; overflow: hidden;">2D 50m²</div>
      <div style="width: 13.0%; background: #0f2c59; color: #fff; padding: 6px; border-right: 1px solid #fff; font-size: 8pt; white-space: nowrap; overflow: hidden;">A.Común 65m²</div>
      <div style="width: 30%; background: #f0f0f0; color: #666; padding: 6px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 8pt; white-space: nowrap;">Área Libre 225m²</div>
    </div>"""

# Primer Piso (4 deptos: 2 de 2D, 2 de 1D) + Ingreso amplio
piso_1_html = """
    <div style="display: flex; border-bottom: 2px solid #333; width: 100%;">
      <div style="width: 35.8%; background: #212f3c; color: #fff; padding: 6px; border-right: 1px solid #fff; display: flex; align-items: center; justify-content: center; font-size: 8pt; white-space: nowrap;">Ingreso y Bicis 180m²</div>
      <div style="width: 9.6%; background: #1e8449; color: #fff; padding: 6px; border-right: 1px solid #fff; font-size: 8pt; white-space: nowrap; overflow: hidden;">2D 50m²</div>
      <div style="width: 9.6%; background: #1e8449; color: #fff; padding: 6px; border-right: 1px solid #fff; font-size: 8pt; white-space: nowrap; overflow: hidden;">2D 50m²</div>
      <div style="width: 7.5%; background: #b9770e; color: #fff; padding: 6px; border-right: 1px solid #fff; font-size: 8pt; white-space: nowrap; overflow: hidden;">1D 40m²</div>
      <div style="width: 7.5%; background: #b9770e; color: #fff; padding: 6px; border-right: 1px solid #fff; font-size: 8pt; white-space: nowrap; overflow: hidden;">1D 40m²</div>
      <div style="width: 30%; background: #f0f0f0; color: #666; padding: 6px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 8pt; white-space: nowrap;">Área Libre 225m²</div>
    </div>"""

nuevo_perfil = f"""<div style="margin-top: 30px; margin-bottom: 20px; page-break-inside: avoid; font-family: Arial, sans-serif;">
  <h3 style="color: #0f2c59; text-align: center; margin-bottom: 15px; font-size: 24pt;">Perfil de Elevación</h3>
  
  <div style="width: 100%; border: 2px solid #333; background: #fff; text-align: center; font-size: 9pt; font-weight: bold; margin: 30px auto 0 auto;">
    
    <div style="background: #333; color: #fff; padding: 5px;">LÍMITE DEL LOTE: 750 M²</div>
    
    <!-- Azotea -->
    <div style="display: flex; border-bottom: 1px solid #333; width: 100%;">
      <div style="width: 20.2%; background: #0f2c59; color: #fff; padding: 6px; border-right: 1px solid #fff; display: flex; align-items: center; justify-content: center; font-size: 8pt; white-space: nowrap;">Amenidades 120m²</div>
      <div style="width: 49.8%; background: #d0e8f2; color: #333; padding: 6px; border-right: 1px solid #fff; display: flex; align-items: center; justify-content: center; font-size: 8pt; white-space: nowrap;">Terrazas 405m²</div>
      <div style="width: 30%; background: #f0f0f0; color: #666; padding: 6px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 8pt; white-space: nowrap;">Área Libre 225m²</div>
    </div>

    <!-- Piso 8 -->{piso_tipico_html}
    <!-- Piso 7 -->{piso_tipico_html}
    <!-- Piso 6 -->{piso_tipico_html}
    <!-- Piso 5 -->{piso_tipico_html}
    <!-- Piso 4 -->{piso_tipico_html}
    <!-- Piso 3 -->{piso_tipico_html}
    <!-- Piso 2 -->{piso_tipico_html}
    
    <!-- Piso 1 -->{piso_1_html}

    <!-- Sotano 1 -->
    <div style="display: flex; border-bottom: 1px solid #333; width: 100%;">
      <div style="width: 100%; background: #5c7496; color: #fff; padding: 6px; display: flex; align-items: center; justify-content: center; font-size: 8pt; white-space: nowrap;">SÓTANO 1: 18 Estacionamientos Vehiculares (750m² FULL)</div>
    </div>

    <!-- Sotano 2 -->
    <div style="display: flex; width: 100%;">
      <div style="width: 5.3%; background: #4a5d78; color: #fff; padding: 6px; border-right: 1px solid #fff; font-size: 8pt; white-space: nowrap; overflow: hidden;">Cist.</div>
      <div style="width: 94.7%; background: #e0e0e0; color: #555; padding: 6px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 8pt; white-space: nowrap;">SÓTANO 2: Tierra Sólida / Cimentación (710m²)</div>
    </div>

  </div>
</div>"""

pattern = r'<div style="margin-top: 30px; margin-bottom: 20px; page-break-inside: avoid; font-family: Arial, sans-serif;">\s*<h3 style="color: #0f2c59; text-align: center; margin-bottom: 15px; font-size: 24pt;">Perfil de Elevación</h3>.*?</div>\s*</div>\s*</div>'

content = re.sub(pattern, nuevo_perfil, content, flags=re.DOTALL)

with open(md_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Slide 4, 5 y Perfil Elevacion Corregidos.")
