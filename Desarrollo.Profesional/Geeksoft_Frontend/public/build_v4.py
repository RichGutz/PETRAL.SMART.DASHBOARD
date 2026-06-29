import re

def process_file():
    with open("presentation_V3.html", "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Extraer Slide 2 (Propósito) y Slide 3 (Kodawari)
    start_s2 = content.find('<!-- ══════════════════════════════════\n     S2 · PROPOSITO')
    if start_s2 == -1:
        start_s2 = content.find('<section class="slide" id="s2"')
    
    end_s2 = content.find('</section>', start_s2) + 10

    start_s3 = content.find('<!-- ══════════════════════════════════\n     S3 · FILOSOFIA')
    if start_s3 == -1:
        start_s3 = content.find('<section class="slide" id="s3"')
    
    end_s3 = content.find('</section>', start_s3) + 10

    s2_html = content[start_s2:end_s2]
    s3_html = content[start_s3:end_s3]

    # Intercambiar IDs en los bloques
    # El antiguo s2 pasará a ser s3
    s2_html_new = s2_html.replace('id="s2"', 'id="s3"').replace('S2 · PROPOSITO', 'S3 · PROPOSITO')
    # El antiguo s3 pasará a ser s2
    s3_html_new = s3_html.replace('id="s3"', 'id="s2"').replace('S3 · FILOSOFIA', 'S2 · FILOSOFIA')

    # 2. Arreglar alineación vertical en Kodawari (ahora s3_html_new)
    # Reemplazaremos los divs interiores de los cards para fijar alturas
    # Para el Kanji: <div style="font-size:48px; ... margin-bottom:8px;">
    # Lo cambiaremos a <div style="height:70px; display:flex; align-items:center; justify-content:center; font-size:48px; ...">
    # Para el título: <h3 style="...">
    # Lo cambiaremos a <h3 style="height:30px; display:flex; align-items:center; justify-content:center; ...">
    
    # KODAWARI
    s3_html_new = s3_html_new.replace(
        '<div style="font-size:48px; font-weight:900; color:#8C1C13; font-family:serif; margin-bottom:8px;">こだわり</div>',
        '<div style="height:70px; display:flex; align-items:center; justify-content:center; font-size:48px; font-weight:900; color:#8C1C13; font-family:serif; margin-bottom:8px;">こだわり</div>'
    ).replace(
        '<h3 style="color:var(--navy); font-size:18px; margin-bottom:12px;">Kodawari</h3>',
        '<h3 style="height:30px; display:flex; align-items:center; justify-content:center; color:var(--navy); font-size:18px; margin-bottom:12px;">Kodawari</h3>'
    )
    
    # MONOZUKURI
    s3_html_new = s3_html_new.replace(
        '<div style="font-size:48px; font-weight:900; color:var(--navy); font-family:serif; margin-bottom:8px;">ものづくり</div>',
        '<div style="height:70px; display:flex; align-items:center; justify-content:center; font-size:48px; font-weight:900; color:var(--navy); font-family:serif; margin-bottom:8px;">ものづくり</div>'
    ).replace(
        '<h3 style="color:var(--navy); font-size:18px; margin-bottom:12px;">Monozukuri</h3>',
        '<h3 style="height:30px; display:flex; align-items:center; justify-content:center; color:var(--navy); font-size:18px; margin-bottom:12px;">Monozukuri</h3>'
    )
    
    # SHOKUNIN KISHI
    s3_html_new = s3_html_new.replace(
        '<div style="font-size:48px; font-weight:900; color:var(--amber); font-family:serif; margin-bottom:8px;">職人気質</div>',
        '<div style="height:70px; display:flex; align-items:center; justify-content:center; font-size:48px; font-weight:900; color:var(--amber); font-family:serif; margin-bottom:8px;">職人気質</div>'
    ).replace(
        '<h3 style="color:var(--navy); font-size:18px; margin-bottom:12px;">Shokunin kishi</h3>',
        '<h3 style="height:30px; display:flex; align-items:center; justify-content:center; color:var(--navy); font-size:18px; margin-bottom:12px;">Shokunin kishi</h3>'
    )

    # Reconstruir el documento
    # Estructura: antes_s2 + s3_html_new + \n + s2_html_new + despues_s3
    content = content[:start_s2] + s3_html_new + "\n\n" + s2_html_new + content[end_s3:]

    with open("presentation_V4.html", "w", encoding="utf-8") as f:
        f.write(content)

process_file()
