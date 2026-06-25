import os
import sys
import markdown
import weasyprint
import re

def build_pdf():
    template_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\PPTS.HERMOSAS\Informe_Terreno_San_Miguel_345_V4.html"
    source_md = "PROPOSAL_PETRAL_PPT_V1.md"
    html_out = "PROPOSAL_PETRAL_PPT_V56.html"
    pdf_out = "PROPOSAL_PETRAL_PPT_V56.pdf"

    if not os.path.exists(template_path):
        print(f"Error: Template no encontrado en {template_path}")
        sys.exit(1)

    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()

    start_marker = "<tbody><tr><td>"
    end_marker = "</td></tr></tbody>"

    start_idx = template.find(start_marker)
    if start_idx != -1:
        start_idx += len(start_marker)
    else:
        print("Error: No se encontró el inicio del contenido en el template.")
        sys.exit(1)

    end_idx = template.find(end_marker)
    if end_idx == -1:
        print("Error: No se encontró el fin del contenido en el template.")
        sys.exit(1)

    pre_html = template[:start_idx]
    post_html = template[end_idx:]

    # Cambiar el texto del footer para que corresponda a Naviera Petral
    pre_html = pre_html.replace(
        "ANÁLISIS INMOBILIARIO | CONFIDENCIAL | MAYO 2026",
        "PROPUESTA COMERCIAL | NAVIERA PETRAL | GEEKSOFT | JUNIO 2026"
    )

    # Hacer el logo del header el doble de grande
    pre_html = pre_html.replace("height: 50px !important;", "height: 100px !important;")

    # Restaurar la inyección vieja que daba el formato correcto (landscape, fuentes, etc.)
    injection = """
    <style>
    @page {
        size: A4 landscape;
        margin: 5mm 15mm 15mm 15mm;
    }
    .header-print img {
        height: 100px !important;
    }
    body, p, li, td, th {
        font-size: 16pt !important;
        line-height: 1.4 !important;
    }
    h1 {
        font-size: 32pt !important;
        page-break-before: always;
    }
    h2 {
        font-size: 26pt !important;
        page-break-before: always;
    }
    .cover-page {
        padding-top: 20mm !important;
    }
    .cover-title { 
        font-size: 40pt !important; 
        margin-bottom: 10pt !important;
    }
    .cover-subtitle { 
        font-size: 18pt !important; 
        line-height: 1.4 !important;
    }
    </style>
    """
    pre_html = pre_html.replace('</head>', injection + '</head>')
    # Reemplazar el logo en base64 de Kaizen Properties por el de Geeksoft
    geeksoft_logo_path = r"C:/Users/rguti/PETRAL.SMART.DASHBOARD/Boiler.Plate/PPTS.HERMOSAS/logo_final_v3.png"
    # Reemplazar el bloque entero de header-print
    pre_html = re.sub(
        r'<div class="header-print">.*?</div>',
        f'<div class="header-print"><img src="file:///{geeksoft_logo_path}"></div>',
        pre_html,
        flags=re.DOTALL
    )

    # LIMPIEZA DE REZAGOS: Si el template original tiene portada o TOC fijos, aquí los eliminamos
    start_cover = pre_html.find('<div class="cover-page">')
    end_toc = pre_html.find('<table class="page-wrapper">')
    if start_cover != -1 and end_toc != -1:
        pre_html = pre_html[:start_cover] + pre_html[end_toc:]

    # INYECTAR MÁSCARA BLANCA ABSOLUTA PARA OCULTAR EL LOGO SOLO EN EL PRIMER SLIDE
    # Se inyecta justo después de <body>
    mask_html = '<div style="position: absolute; top: -15mm; right: -25mm; width: 120mm; height: 60mm; background-color: white; z-index: 9999;"></div>'
    style_html = '<style>h1, h2, h3 { margin-top: -10pt !important; padding-top: 0pt !important; margin-bottom: 5pt !important; }</style>'
    pre_html = pre_html.replace('<body>', '<body>\n' + mask_html + '\n' + style_html)

    with open(source_md, 'r', encoding='utf-8') as f:
        md_text = f.read()
        
    # Limpiamos el <!-- PAGE_BREAK --> residual del V4 que ya no necesitamos
    md_text = md_text.replace("<!-- PAGE_BREAK -->", "")

    # Convertir MD a HTML
    body_html = markdown.markdown(md_text, extensions=['tables', 'fenced_code'])

    # Ensamblar HTML final
    full_html = pre_html + "\n" + body_html + "\n" + post_html

    with open(html_out, 'w', encoding='utf-8') as f:
        f.write(full_html)

    print(f"HTML generado exitosamente: {html_out}")

    # Generar PDF a partir del HTML
    base_url = os.path.abspath(os.path.dirname(source_md))
    weasyprint.HTML(string=full_html, base_url=base_url).write_pdf(pdf_out)
    
    print(f"PDF generado exitosamente usando el template ORIGINAL: {pdf_out}")

if __name__ == "__main__":
    build_pdf()
