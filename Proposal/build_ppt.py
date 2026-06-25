import os
import sys
import weasyprint

def build_pdf():
    html_in = "PROPOSAL_PETRAL_PPT_V63.html"
    pdf_out = "PROPOSAL_PETRAL_PPT_V63.pdf"

    if not os.path.exists(html_in):
        print(f"Error: HTML no encontrado en {html_in}")
        sys.exit(1)

    print(f"Generando PDF a partir de {html_in}...")
    base_url = os.path.abspath(os.path.dirname(html_in))
    weasyprint.HTML(filename=html_in, base_url=base_url).write_pdf(pdf_out)
    print(f"PDF generado exitosamente: {pdf_out}")

if __name__ == "__main__":
    build_pdf()
