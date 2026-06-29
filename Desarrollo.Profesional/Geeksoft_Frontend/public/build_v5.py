import re

def process_file():
    with open("presentation_V4.html", "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Modificar Slide 2 (Filosofía)
    old_s2_text = "El espíritu detrás de la construcción de este motor matemático"
    new_s2_text = "El espíritu detrás de la construcción de este proyecto tecnológico"
    content = content.replace(old_s2_text, new_s2_text)

    # 2. Reconstruir por completo Slide 4 (AGILE)
    start_s4 = content.find('<section class="slide" id="s4"')
    end_s4 = content.find('</section>', start_s4) + 10
    
    agile_v5_html = """<section class="slide" id="s4" style="transform:translateX(70px);">
    <p class="tag">Metodología de Trabajo</p>
    <h2>Roadmap: <span class="hi">Enfoque AGILE</span></h2>
    <p class="sub">Ciclo continuo de construcción y refinamiento técnico</p>

    <div style="display:flex; width:100%; max-width:1050px; height:500px; margin:0 auto; margin-top:20px; position:relative;">
        
        <!-- SVG Canvas (Abarca todo el contenedor) -->
        <svg style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0;">
            <defs>
                <marker id="arrow-v5" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--blue)" />
                </marker>
                <marker id="arrow-support" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(15,35,64,0.3)" />
                </marker>
            </defs>
            
            <!-- Pentágono: Líneas rectas entre bordes -->
            <line x1="390" y1="80" x2="520" y2="160" stroke="var(--blue)" stroke-width="2" marker-end="url(#arrow-v5)"/> <!-- 1 to 2 -->
            <line x1="560" y1="230" x2="500" y2="380" stroke="var(--blue)" stroke-width="2" marker-end="url(#arrow-v5)"/> <!-- 2 to 3 -->
            <line x1="410" y1="410" x2="270" y2="410" stroke="var(--blue)" stroke-width="2" marker-end="url(#arrow-v5)"/> <!-- 3 to 4 -->
            <line x1="180" y1="380" x2="140" y2="230" stroke="var(--blue)" stroke-width="2" marker-end="url(#arrow-v5)"/> <!-- 4 to 5 -->
            <line x1="160" y1="160" x2="290" y2="80" stroke="var(--blue)" stroke-width="2" marker-end="url(#arrow-v5)"/> <!-- 5 to 1 -->
            
            <!-- Radiación desde Soporte (Centro 340, 260) -->
            <line x1="340" y1="190" x2="340" y2="100" stroke="rgba(15,35,64,0.3)" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow-support)"/>
            <line x1="410" y1="240" x2="480" y2="210" stroke="rgba(15,35,64,0.3)" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow-support)"/>
            <line x1="390" y1="310" x2="440" y2="370" stroke="rgba(15,35,64,0.3)" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow-support)"/>
            <line x1="290" y1="310" x2="240" y2="370" stroke="rgba(15,35,64,0.3)" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow-support)"/>
            <line x1="270" y1="240" x2="200" y2="210" stroke="rgba(15,35,64,0.3)" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow-support)"/>
            
            <!-- Interacción hacia Prototipo (Derecha) -->
            <line x1="420" y1="260" x2="690" y2="260" stroke="var(--amber)" stroke-width="3" stroke-dasharray="8,4" marker-end="url(#arrow-v5)"/>
        </svg>

        <!-- Zona Izquierda (Pentágono) -->
        <div style="flex:0 0 65%; position:relative;">
            
            <!-- 1. Alcance -->
            <div class="card" style="position:absolute; top:20px; left:340px; transform:translate(-50%, 0); width:140px; padding:12px; z-index:1; border-top:3px solid var(--amber); text-align:center;">
                <div style="font-weight:800; font-size:12px; color:var(--navy);">1. Alcance</div>
                <div style="font-size:10px; color:var(--text-dim); margin-top:4px;">Diseño de lógica</div>
            </div>

            <!-- 2. Desarrollo -->
            <div class="card" style="position:absolute; top:160px; left:560px; transform:translate(-50%, 0); width:140px; padding:12px; z-index:1; border-top:3px solid var(--blue); text-align:center;">
                <div style="font-weight:800; font-size:12px; color:var(--navy);">2. Desarrollo</div>
                <div style="font-size:10px; color:var(--text-dim); margin-top:4px;">Stack Nube</div>
            </div>

            <!-- 3. ETL -->
            <div class="card" style="position:absolute; top:380px; left:480px; transform:translate(-50%, 0); width:140px; padding:12px; z-index:1; border-top:3px solid var(--blue); text-align:center;">
                <div style="font-weight:800; font-size:12px; color:var(--navy);">3. ETL (Carga)</div>
                <div style="font-size:10px; color:var(--text-dim); margin-top:4px;">Viajes Históricos</div>
            </div>

            <!-- 4. Onboarding -->
            <div class="card" style="position:absolute; top:380px; left:200px; transform:translate(-50%, 0); width:140px; padding:12px; z-index:1; border-top:3px solid var(--blue); text-align:center;">
                <div style="font-weight:800; font-size:12px; color:var(--navy);">4. Onboarding</div>
                <div style="font-size:10px; color:var(--text-dim); margin-top:4px;">Capacitación</div>
            </div>

            <!-- 5. In Situ -->
            <div class="card" style="position:absolute; top:160px; left:120px; transform:translate(-50%, 0); width:140px; padding:12px; z-index:1; border-top:3px solid var(--amber); text-align:center;">
                <div style="font-weight:800; font-size:12px; color:var(--navy);">5. In Situ</div>
                <div style="font-size:10px; color:var(--text-dim); margin-top:4px;">Acompañamiento</div>
            </div>

            <!-- Núcleo Central -->
            <div class="card" style="position:absolute; top:260px; left:340px; transform:translate(-50%, -50%); padding:16px; background:var(--blue-dim); border:2px dashed var(--blue); border-radius:50%; width:130px; height:130px; display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:1;">
                <div style="font-size:24px;">🔄</div>
                <div style="font-weight:900; font-size:12px; color:var(--navy); margin-top:4px;">Fase 6: Soporte</div>
                <div style="font-size:9px; color:var(--navy-mid); line-height:1.2; text-align:center;">Mejora continua</div>
            </div>
        </div>

        <!-- Zona Derecha (Prototipo AGILE) -->
        <div style="flex:0 0 35%; display:flex; padding-left:20px; align-items:center; z-index:1;">
            <div class="card" style="width:100%; padding:30px; background:#fff; border-left:6px solid var(--amber); box-shadow:var(--shadow-lg); display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:40px; margin-bottom:20px;">💡</div>
                <h4 style="font-size:20px; font-weight:900; color:var(--navy); margin-bottom:16px; text-transform:uppercase;">Prototipo AGILE en Evolución</h4>
                <p style="font-size:13px; color:var(--text-dim); line-height:1.6; margin-bottom:12px;">El desarrollo nunca está "terminado", está en <strong>constante evolución.</strong></p>
                <p style="font-size:13px; color:var(--text); line-height:1.6; background:var(--amber-dim); padding:16px; border-radius:8px;">Los "errores" detectados en etapas tempranas no son fallas críticas, son <strong>puntos de foco</strong> necesarios para calibrar el modelo hacia la realidad del negocio.</p>
            </div>
        </div>
    </div>
</section>"""
    
    content = content[:start_s4] + agile_v5_html + content[end_s4:]

    with open("presentation_V5.html", "w", encoding="utf-8") as f:
        f.write(content)

process_file()
