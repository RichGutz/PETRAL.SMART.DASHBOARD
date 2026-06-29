import re

with open("presentation_V1.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Renombrar id="sX" a id="s{X+1}" desde 20 hasta 6
for i in range(20, 5, -1):
    content = re.sub(rf'id="s{i}"', f'id="s{i+1}"', content)

# 2. Renombrar s5_new a s6
content = content.replace('id="s5_new"', 'id="s6"')

# 3. Cambiar contadores
content = content.replace('const TOTAL = 20;', 'const TOTAL = 21;')
content = content.replace('<span id="counter">1 / 20</span>', '<span id="counter">1 / 21</span>')

# 4. Modificar animaciones (6 a 11 -> 7 a 12)
anim_blocks = [
    ('n === 11', 'n === 12'),
    ('n === 10', 'n === 11'),
    ('n === 9', 'n === 10'),
    ('n === 8', 'n === 9'),
    ('n === 7', 'n === 8'),
    ('n === 6', 'n === 7')
]
for old, new in anim_blocks:
    content = content.replace(f'if ({old})', f'if ({new})')

# 5. Modificar Slide 2
old_s2 = """    <div style="width:100%; max-width:860px; display:flex; flex-direction:column; gap:16px;">
        <div class="card" style="padding:24px; border-top:4px solid var(--amber);">
            <div style="display:flex; align-items:flex-start; gap:16px;">
                <div style="font-size:24px;">📈</div>
                <div>
                    <h3 style="color:var(--navy); font-size:16px; margin-bottom:6px;">Planificación Comercial</h3>
                    <p style="font-size:13px; color:var(--text-dim); line-height:1.5;">Implementar una herramienta de Forecast multipaso indexada temporalmente para proyectar ventas y Gross Margin a lo largo de un horizonte dinámico. Incluye la proyección de demurrage y el cálculo del flete promedio (incluyendo demurrage).</p>
                </div>
            </div>
        </div>
        <div class="card" style="padding:24px; border-top:4px solid var(--blue);">
            <div style="display:flex; align-items:flex-start; gap:16px;">
                <div style="font-size:24px;">⚡</div>
                <div>
                    <h3 style="color:var(--navy); font-size:16px; margin-bottom:6px;">Automatización del Pricing SPOT</h3>
                    <p style="font-size:13px; color:var(--text-dim); line-height:1.5;">Desplegar una herramienta de cotización (Proformador SPOT) que capture las tarifas contractuales y calcule el Gross Margin de forma inmediata para maximizar la rentabilidad.</p>
                </div>
            </div>
        </div>
    </div>"""

new_s2 = """    <div style="width:100%; max-width:900px; display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
        <div class="card" style="padding:30px; border-top:4px solid var(--amber); display:flex; flex-direction:column; align-items:center; text-align:center;">
            <div style="font-size:32px; margin-bottom:12px;">📈</div>
            <h3 style="color:var(--navy); font-size:16px; margin-bottom:10px;">Planificación Comercial</h3>
            <p style="font-size:13px; color:var(--text-dim); line-height:1.6;">Implementar una herramienta de Forecast multipaso indexada temporalmente para proyectar ventas y Gross Margin a lo largo de un horizonte dinámico. Incluye la proyección de demurrage y el cálculo del flete promedio (incluyendo demurrage).</p>
        </div>
        <div class="card" style="padding:30px; border-top:4px solid var(--blue); display:flex; flex-direction:column; align-items:center; text-align:center;">
            <div style="font-size:32px; margin-bottom:12px;">⚡</div>
            <h3 style="color:var(--navy); font-size:16px; margin-bottom:10px;">Automatización del Pricing SPOT</h3>
            <p style="font-size:13px; color:var(--text-dim); line-height:1.6;">Desplegar una herramienta de cotización (Proformador SPOT) que capture las tarifas contractuales y calcule el Gross Margin de forma inmediata para maximizar la rentabilidad.</p>
        </div>
    </div>"""

content = content.replace(old_s2, new_s2)

with open("presentation_V2.html", "w", encoding="utf-8") as f:
    f.write(content)
