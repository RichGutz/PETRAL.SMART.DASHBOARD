import os
import sys
import markdown
import weasyprint

def main():
    template_path = r"C:\Users\rguti\Cabidas.Arquitectonicas.AC.RG\Casa.Meñe\Informe_Milagros_Rodriguez.html"
    source_md = "Informe_Terreno_San_Miguel_345_V1.md"
    html_out = "Informe_Terreno_San_Miguel_345_V10.html"
    pdf_out = "Informe_Terreno_San_Miguel_345_V10.pdf"

    if not os.path.exists(template_path):
        print(f"Error: Template no encontrado en {template_path}")
        sys.exit(1)

    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()

    # Extraer la estructura del template (Head, CSS, Header con Base64, Footer)
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

    # LIMPIEZA DE REZAGOS: Eliminar portada y TOC fijos del template original
    start_cover = pre_html.find('<div class="cover-page">')
    end_toc = pre_html.find('<table class="page-wrapper">')
    if start_cover != -1 and end_toc != -1:
        pre_html = pre_html[:start_cover] + pre_html[end_toc:]

    # Forzar el formato HORIZONTAL y agrandar las fuentes tipo presentación (slide)
    css_overrides = """
    <style>
    @page {
        size: A4 landscape;
        margin: 5mm 15mm 15mm 15mm;
    }
    .header-print img {
        height: 50px !important;
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
    
    # Inyectar las anulaciones de CSS justo antes de cerrar el head
    head_end_idx = pre_html.find('</head>')
    if head_end_idx != -1:
        pre_html = pre_html[:head_end_idx] + css_overrides + pre_html[head_end_idx:]

    with open(source_md, 'r', encoding='utf-8') as f:
        md_text = f.read()

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
    
    print(f"PDF generado exitosamente usando el template (Formato Horizontal): {pdf_out}")

if __name__ == "__main__":
    main()
