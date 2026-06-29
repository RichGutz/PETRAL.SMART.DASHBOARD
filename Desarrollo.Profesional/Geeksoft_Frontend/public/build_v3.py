import re

def process_file():
    with open("presentation_V2.html", "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Eliminar s20 y s21
    # Buscar el inicio de s20
    idx_s20 = content.find('<section class="slide" id="s20"')
    if idx_s20 != -1:
        idx_nav = content.find('</div><!-- #deck -->', idx_s20)
        content = content[:idx_s20] + content[idx_nav:]

    # 2. Renumerar IDs: s3 a s19 -> s4 a s20
    for i in range(19, 2, -1):
        content = re.sub(rf'id="s{i}"', f'id="s{i+1}"', content)

    # 3. Insertar S3 Kodawari después de S2
    idx_s3_pos = content.find('<section class="slide" id="s4"')
    
    kodawari_html = """
<!-- ══════════════════════════════════
     S3 · FILOSOFIA PERSONAL (KODAWARI)
══════════════════════════════════ -->
<section class="slide" id="s3" style="transform:translateX(70px);">
    <p class="tag" style="background:#8C1C13; color:white;">El Alma del Desarrollo</p>
    <h2>La Búsqueda de <span class="hi" style="color:#8C1C13;">la Excelencia</span></h2>
    <p class="sub">El espíritu detrás de la construcción de este motor matemático</p>

    <div style="width:100%; max-width:960px; display:grid; grid-template-columns: 1fr 1fr 1fr; gap:20px; margin-top:10px;">
        <div class="card" style="padding:24px; border-top:4px solid #8C1C13; text-align:center; background:linear-gradient(to bottom, #ffffff, #fdfbfb);">
            <div style="font-size:48px; font-weight:900; color:#8C1C13; font-family:serif; margin-bottom:8px;">こだわり</div>
            <h3 style="color:var(--navy); font-size:18px; margin-bottom:12px;">Kodawari</h3>
            <p style="font-size:12.5px; color:var(--text-dim); line-height:1.6;">La búsqueda implacable de la perfección. Es la actitud de hacer algo excepcionalmente bien, cuidando hasta el más mínimo detalle por puro orgullo personal y profesional.</p>
        </div>
        <div class="card" style="padding:24px; border-top:4px solid var(--navy); text-align:center; background:linear-gradient(to bottom, #ffffff, #fdfbfb);">
            <div style="font-size:48px; font-weight:900; color:var(--navy); font-family:serif; margin-bottom:8px;">ものづくり</div>
            <h3 style="color:var(--navy); font-size:18px; margin-bottom:12px;">Monozukuri</h3>
            <p style="font-size:12.5px; color:var(--text-dim); line-height:1.6;">El acto de hacer cosas, con un espíritu y pasión casi sagrados por el oficio. Es la ética inquebrantable de buscar la máxima perfección técnica en el proceso.</p>
        </div>
        <div class="card" style="padding:24px; border-top:4px solid var(--amber); text-align:center; background:linear-gradient(to bottom, #ffffff, #fdfbfb);">
            <div style="font-size:48px; font-weight:900; color:var(--amber); font-family:serif; margin-bottom:8px;">職人気質</div>
            <h3 style="color:var(--navy); font-size:18px; margin-bottom:12px;">Shokunin kishi</h3>
            <p style="font-size:12.5px; color:var(--text-dim); line-height:1.6;">El espíritu del artesano. La obligación social y espiritual de hacer tu trabajo de la mejor manera posible, donde el trabajo en sí mismo es la recompensa final.</p>
        </div>
    </div>
    <div class="card" style="margin-top:20px; padding:20px 30px; background:var(--navy); color:white; text-align:center; border-radius:12px; box-shadow:0 10px 25px rgba(15,35,64,0.3);">
        <p style="font-size:16px; font-weight:600; line-height:1.5; font-style:italic;">
            "Este consultor hace las cosas bien no por dinero, no por reconocimiento externo, <br>sino por el simple y puro orgullo de hacer las cosas bien."
        </p>
    </div>
</section>
"""
    content = content[:idx_s3_pos] + kodawari_html + "\n" + content[idx_s3_pos:]

    # 4. Modificar Pentágono AGILE (s4)
    # Extraer todo s4 y reemplazarlo
    start_s4 = content.find('<section class="slide" id="s4"')
    end_s4 = content.find('</section>', start_s4) + 10
    
    agile_html = """<section class="slide" id="s4" style="transform:translateX(70px);">
    <p class="tag">Metodología de Trabajo</p>
    <h2>Roadmap: <span class="hi">Enfoque AGILE</span></h2>
    <p class="sub">Ciclo continuo de construcción y refinamiento técnico</p>

    <div style="position:relative; width:100%; max-width:850px; height:460px; margin:0 auto; margin-top:20px;">
        
        <!-- Líneas SVG para las conexiones -->
        <svg style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0;">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--blue-brd)" />
                </marker>
            </defs>
            <path d="M 425 60 Q 650 60 700 130" fill="none" stroke="var(--blue-brd)" stroke-width="3" stroke-dasharray="6,6" marker-end="url(#arrow)"/>
            <path d="M 700 230 Q 700 380 570 380" fill="none" stroke="var(--blue-brd)" stroke-width="3" stroke-dasharray="6,6" marker-end="url(#arrow)"/>
            <path d="M 370 380 Q 250 380 150 380" fill="none" stroke="var(--blue-brd)" stroke-width="3" stroke-dasharray="6,6" marker-end="url(#arrow)"/>
            <path d="M 150 340 Q 150 180 150 150" fill="none" stroke="var(--blue-brd)" stroke-width="3" stroke-dasharray="6,6" marker-end="url(#arrow)"/>
            <path d="M 230 130 Q 300 60 330 60" fill="none" stroke="var(--blue-brd)" stroke-width="3" stroke-dasharray="6,6" marker-end="url(#arrow)"/>
        </svg>

        <!-- Nodos -->
        <!-- 1. Alcance (Top Center) -->
        <div class="card" style="position:absolute; top:0; left:50%; transform:translateX(-50%); width:200px; padding:12px; z-index:1; border-top:3px solid var(--amber); text-align:center;">
            <div style="font-weight:800; font-size:12px; color:var(--navy);">1. Alcance</div>
            <div style="font-size:10px; color:var(--text-dim);">Entendimiento de la necesidad y diseño de lógica.</div>
        </div>

        <!-- 2. Desarrollo (Right) -->
        <div class="card" style="position:absolute; top:130px; right:30px; width:200px; padding:12px; z-index:1; border-top:3px solid var(--blue); text-align:center;">
            <div style="font-weight:800; font-size:12px; color:var(--navy);">2. Desarrollo</div>
            <div style="font-size:10px; color:var(--text-dim);">Creación del software con stack en la nube.</div>
        </div>

        <!-- 3. ETL (Bottom Right) -->
        <div class="card" style="position:absolute; bottom:30px; right:150px; width:200px; padding:12px; z-index:1; border-top:3px solid var(--blue); text-align:center;">
            <div style="font-weight:800; font-size:12px; color:var(--navy);">3. ETL (Carga)</div>
            <div style="font-size:10px; color:var(--text-dim);">Extracción y carga de los viajes históricos.</div>
        </div>

        <!-- 4. Onboarding (Bottom Left) -->
        <div class="card" style="position:absolute; bottom:30px; left:150px; width:200px; padding:12px; z-index:1; border-top:3px solid var(--blue); text-align:center;">
            <div style="font-weight:800; font-size:12px; color:var(--navy);">4. Onboarding</div>
            <div style="font-size:10px; color:var(--text-dim);">Capacitación al equipo operativo con datos reales.</div>
        </div>

        <!-- 5. In Situ (Left) -->
        <div class="card" style="position:absolute; top:130px; left:30px; width:200px; padding:12px; z-index:1; border-top:3px solid var(--amber); text-align:center;">
            <div style="font-weight:800; font-size:12px; color:var(--navy);">5. In Situ</div>
            <div style="font-size:10px; color:var(--text-dim);">Acompañamiento, calibración de motor y UI/UX.</div>
        </div>

        <!-- Núcleo Central -->
        <div style="position:absolute; top:130px; left:50%; transform:translateX(-50%); width:320px; text-align:center; display:flex; flex-direction:column; gap:16px;">
            <div class="card" style="padding:16px; background:var(--blue-dim); border:2px dashed var(--blue); border-radius:50%; width:180px; height:180px; display:flex; flex-direction:column; justify-content:center; align-items:center; margin:0 auto;">
                <div style="font-size:24px;">🔄</div>
                <div style="font-weight:900; font-size:12px; color:var(--navy); margin-top:8px;">Fase 6: Soporte</div>
                <div style="font-size:10px; color:var(--navy-mid); line-height:1.4;">El sistema es un organismo vivo que necesita mejora continua.</div>
            </div>

            <div class="card" style="padding:12px; background:#fff; border-left:4px solid var(--amber); box-shadow:var(--shadow);">
                <h4 style="font-size:12px; font-weight:800; color:var(--navy); margin-bottom:4px;">💡 Prototipo AGILE</h4>
                <p style="font-size:10.5px; color:var(--text-dim); line-height:1.4;">Los "errores" detectados hoy son <strong>puntos de foco</strong> para calibrar el modelo.</p>
            </div>
        </div>
    </div>
</section>"""
    content = content[:start_s4] + agile_html + content[end_s4:]

    # 5. Slide 7 (Colaboración)
    old_colab = '<div style="font-size:11px; color:var(--text-dim);"><strong style="color:var(--red);">Limitada y con bloqueos.</strong> Uso secuencial, archivos bloqueados y confusión de versiones.</div>'
    new_colab = '<div style="font-size:11px; color:var(--text-dim);"><strong style="color:var(--red);">Dolor de cabeza logístico.</strong> Enviar un forecast por email crea versiones duplicadas y bloqueos de archivo.</div>'
    old_colab2 = '<div style="font-size:11px; color:var(--text-dim);"><strong style="color:var(--green);">Concurrente e instantánea.</strong> Múltiples usuarios simulando simultáneamente sin interferencias.</div>'
    new_colab2 = '<div style="font-size:11px; color:var(--text-dim);"><strong style="color:var(--green);">Fluidez total.</strong> Creas un escenario complejo, lo guardas, y le dices a tu colega: <em>"Entra y modifícalo"</em>. Sin mover un archivo.</div>'
    
    content = content.replace(old_colab, new_colab).replace(old_colab2, new_colab2)

    # 6. Slide 10 (BAF)
    old_baf = """    <!-- BAF (Bunker Adjustment Factor) -->
    <div class="card" style="margin-top:20px; padding:20px; border-left:4px solid var(--amber);">
        <h3 style="color:var(--navy); font-size:16px; margin-bottom:10px;">Aplicación del BAF (Bunker Adjustment Factor)</h3>
        <p style="font-size:13px; color:var(--text-dim); line-height:1.5;">El simulador leerá la fecha proyectada del viaje y cruzará los precios del bunker vigentes. Si el precio del IFO o MDO cruza el umbral del contrato BAF, <strong>el motor ajustará automáticamente la tarifa del flete (F)</strong> cobrada al cliente.</p>
    </div>"""
    
    new_baf = """    <!-- BAF (Bunker Adjustment Factor) -->
    <div class="card" style="margin-top:20px; padding:20px; border-left:4px solid var(--amber);">
        <h3 style="color:var(--navy); font-size:16px; margin-bottom:10px;">Aplicación del BAF (Bunker Adjustment Factor)</h3>
        <p style="font-size:13px; color:var(--text-dim); line-height:1.5;">El simulador leerá la fecha proyectada del viaje y cruzará los precios del bunker vigentes. Si el precio del IFO o MDO cruza el umbral del contrato BAF, <strong>el motor ajustará automáticamente la tarifa del flete (F)</strong> cobrada al cliente.</p>
        
        <div style="margin-top:16px; padding:12px; background:rgba(185, 28, 28, 0.05); border:1px solid var(--red); border-radius:8px; display:flex; gap:12px; align-items:center;">
            <div style="font-size:24px;">⚠️</div>
            <div>
                <strong style="color:var(--red); font-size:13px;">REQUERIMIENTO TÉCNICO</strong>
                <p style="color:var(--red); font-size:12px; line-height:1.5;">Necesitamos que nos indiquen cuál es la metodología de ajuste BAF que utiliza usualmente Naviera Petral (ej. escalonado, promedios móviles, indexación directa) para programarla en el motor.</p>
            </div>
        </div>
    </div>"""
    
    content = content.replace(old_baf, new_baf)

    # 7. JavaScript: Ajuste de TOTAL y Animaciones
    content = content.replace('const TOTAL = 21;', 'const TOTAL = 20;')
    content = content.replace('<span id="counter">1 / 21</span>', '<span id="counter">1 / 20</span>')
    
    anim_blocks = [
        ('n === 12', 'n === 13'),
        ('n === 11', 'n === 12'),
        ('n === 10', 'n === 11'),
        ('n === 9', 'n === 10'),
        ('n === 8', 'n === 9'),
        ('n === 7', 'n === 8')
    ]
    for old, new in anim_blocks:
        content = content.replace(f'if ({old})', f'if ({new})')

    with open("presentation_V3.html", "w", encoding="utf-8") as f:
        f.write(content)

process_file()
