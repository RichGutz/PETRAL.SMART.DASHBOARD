import re

path_in = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.2\kickoff_petral_V1.html'
path_out = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.2\kickoff_petral_V2.html'

with open(path_in, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Shift section IDs in HTML: <section class="slide" id="sX"
for i in range(14, 0, -1):
    content = content.replace(f'id="s{i}"', f'id="s{i+4}"')

# 2. Shift JavaScript references (triggerAnim and resetAnim)
for i in range(14, 0, -1):
    content = content.replace(f'if (n === {i})', f'if (n === {i+4})')

# 3. Change TOTAL
content = content.replace('const TOTAL = 14;', 'const TOTAL = 18;')
content = content.replace('1 / 14', '1 / 18')
content = content.replace('1 / 7', '1 / 18')

# 4. Old S1 had 'slide active'. We need to make it just 'slide'.
content = content.replace('<section class="slide active" id="s5"', '<section class="slide" id="s5"')

# 5. Insert new slides after <div id="deck">
new_slides = """
<!-- ══════════════════════════════════
     S1 · ACTA DE CONSTITUCION - LOGO
══════════════════════════════════ -->
<section class="slide active" id="s1" style="text-align:center;background:radial-gradient(ellipse 60% 50% at 50% 40%,rgba(29,111,232,0.06) 0%,transparent 80%);">
    <img src="file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Imagenes/Logo.Geeksoft.png" style="max-height: 120px; margin-bottom: 30px;" alt="Geeksoft Logo">
    <p class="tag">Naviera Petral · 2026</p>
    <h1>Acta de Constitución <br><span class="hi">del Proyecto</span></h1>
    <p class="sub" style="max-width:600px;text-align:center; margin-top:20px; margin-left:auto; margin-right:auto;">
        Transformación y modernización del proceso de inteligencia comercial, migrando de herramientas tradicionales a un ecosistema web centralizado y seguro.
    </p>
    <div class="badge">← → para navegar &nbsp;·&nbsp; F11 para pantalla completa</div>
</section>

<!-- ══════════════════════════════════
     S2 · PROPOSITO Y OBJETIVOS
══════════════════════════════════ -->
<section class="slide" id="s2" style="transform:translateX(70px);">
    <p class="tag">Propósito y Objetivos de Negocio</p>
    <h2>¿Por qué estamos <span class="hi">aquí?</span></h2>
    <p class="sub">Migrando de hojas de cálculo a un ecosistema seguro y escalable</p>

    <div class="card" style="width:100%; max-width:860px; padding:30px; border-top:4px solid var(--amber);">
        <div style="display:flex; flex-direction:column; gap:20px;">
            <div style="display:flex; align-items:flex-start; gap:16px;">
                <div style="font-size:24px;">⚡</div>
                <div>
                    <h3 style="color:var(--navy); font-size:16px; margin-bottom:6px;">Automatización del Pricing SPOT</h3>
                    <p style="font-size:13px; color:var(--text-dim); line-height:1.5;">Desplegar una herramienta de cotización que capture las tarifas contractuales y calcule el Gross Margin de forma inmediata.</p>
                </div>
            </div>
            <div style="display:flex; align-items:flex-start; gap:16px;">
                <div style="font-size:24px;">📈</div>
                <div>
                    <h3 style="color:var(--navy); font-size:16px; margin-bottom:6px;">Planificación Comercial</h3>
                    <p style="font-size:13px; color:var(--text-dim); line-height:1.5;">Implementar una herramienta de Forecast multipaso indexada temporalmente para proyectar ventas y Gross Margin.</p>
                </div>
            </div>
            <div style="display:flex; align-items:flex-start; gap:16px;">
                <div style="font-size:24px;">🎯</div>
                <div>
                    <h3 style="color:var(--navy); font-size:16px; margin-bottom:6px;">Confianza Absoluta</h3>
                    <p style="font-size:13px; color:var(--text-dim); line-height:1.5;">Garantizar convergencia matemática al centavo frente a las plantillas de cálculo tradicionales para eliminar la resistencia operativa.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ══════════════════════════════════
     S3 · ALCANCE DEL PROYECTO
══════════════════════════════════ -->
<section class="slide" id="s3" style="transform:translateX(70px);">
    <p class="tag">Alcance Definitivo</p>
    <h2>Fases del <span class="hi">Proyecto</span></h2>
    <p class="sub">Lo que está dentro de los entregables financiados</p>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; width:100%; max-width:960px;">
        <div class="card" style="padding:20px; border-top:4px solid var(--blue);">
            <h3 style="color:var(--navy); font-size:16px; margin-bottom:12px; display:flex; align-items:center; gap:8px;">✅ Dentro del Alcance</h3>
            <ul style="font-size:12px; color:var(--text); line-height:1.6; padding-left:16px; display:flex; flex-direction:column; gap:8px;">
                <li><strong>Etapa de Diseño:</strong> UI y lógica matemática.</li>
                <li><strong>Etapa de Desarrollo:</strong> Supabase + React/Vite + Tailwind + ECharts.</li>
                <li><strong>Etapa ETL:</strong> Carga de data del año 2026.</li>
                <li><strong>Etapa de Onboarding:</strong> Entrenamiento a 4 usuarios clave.</li>
                <li><strong>Etapa In Situ (Go-Live):</strong> Convivencia de Dos Mundos (cero bugs).</li>
                <li><strong>Propiedad Intelectual:</strong> 100% código en GitHub.</li>
            </ul>
        </div>
        <div class="card" style="padding:20px; border-top:4px solid var(--red);">
            <h3 style="color:var(--navy); font-size:16px; margin-bottom:12px; display:flex; align-items:center; gap:8px;">❌ Fuera del Alcance</h3>
            <ul style="font-size:12px; color:var(--text); line-height:1.6; padding-left:16px; display:flex; flex-direction:column; gap:8px;">
                <li>Carga histórica (2025 hacia atrás).</li>
                <li>Módulos terrestres (camiones, última milla).</li>
                <li>Facturación electrónica o contabilidad general.</li>
                <li>Nuevos desarrollos no contemplados inicialmente.</li>
            </ul>
        </div>
    </div>
</section>

<!-- ══════════════════════════════════
     S4 · GOBERNANZA E HITOS
══════════════════════════════════ -->
<section class="slide" id="s4" style="transform:translateX(70px);">
    <p class="tag">Gobernanza y Plan de Trabajo</p>
    <h2>Usuarios Clave e <span class="hi">Hitos</span></h2>
    <p class="sub">150 horas estimadas de implantación</p>

    <div style="display:flex; flex-direction:column; gap:16px; width:100%; max-width:960px;">
        <div class="card" style="padding:16px; display:flex; gap:20px; align-items:center;">
            <div style="font-size:32px;">👥</div>
            <div>
                <div style="font-size:11px; font-weight:700; color:var(--amber); letter-spacing:1px; text-transform:uppercase;">Usuarios Clave (Naviera Petral)</div>
                <div style="font-size:13px; color:var(--text); margin-top:4px;">Fernando Harten, Jorge Neyra, Maria Elena Castro, Iosef Zavala. (Sponsor: Dueño)</div>
            </div>
        </div>

        <div class="card" style="padding:0; overflow:hidden;">
            <div style="display:flex; background:var(--navy); color:white; padding:10px 16px; font-weight:600; font-size:13px;">
                <div style="flex:1;">Hito</div>
                <div style="flex:2;">Descripción</div>
                <div style="flex:1; text-align:center;">Esfuerzo</div>
                <div style="flex:1; text-align:right;">Estado</div>
            </div>
            <div style="display:flex; padding:10px 16px; font-size:13px; border-bottom:1px solid var(--border);">
                <div style="flex:1; font-weight:700;">H1: Diseño</div>
                <div style="flex:2; color:var(--text-dim);">UI y Lógica Comercial</div>
                <div style="flex:1; text-align:center; font-family:monospace;">10 hrs</div>
                <div style="flex:1; text-align:right; color:var(--green); font-weight:700;">🟢 Terminado</div>
            </div>
            <div style="display:flex; padding:10px 16px; font-size:13px; border-bottom:1px solid var(--border);">
                <div style="flex:1; font-weight:700;">H2: Desarrollo</div>
                <div style="flex:2; color:var(--text-dim);">APIs y Frontend (React/Supabase)</div>
                <div style="flex:1; text-align:center; font-family:monospace;">110 hrs</div>
                <div style="flex:1; text-align:right; color:var(--amber); font-weight:700;">🟡 En Ejecución</div>
            </div>
            <div style="display:flex; padding:10px 16px; font-size:13px; border-bottom:1px solid var(--border);">
                <div style="flex:1; font-weight:700;">H3-H5: ETL, Onboard, Go-Live</div>
                <div style="flex:2; color:var(--text-dim);">Carga 2026, Capacitación y Conciliación</div>
                <div style="flex:1; text-align:center; font-family:monospace;">30 hrs</div>
                <div style="flex:1; text-align:right; color:var(--text-dim); font-weight:700;">🔲 Pendiente</div>
            </div>
        </div>
    </div>
</section>
"""

content = content.replace('<div id="deck">', f'<div id="deck">\\n{new_slides}')

with open(path_out, 'w', encoding='utf-8') as f:
    f.write(content)

print("V2 created successfully.")
