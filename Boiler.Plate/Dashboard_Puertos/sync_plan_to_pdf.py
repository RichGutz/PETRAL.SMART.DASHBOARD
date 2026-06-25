import markdown
import os
import subprocess

# Paths
MD_FILE = r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Plan_Trabajo_Marcona_FINAL.md"
HTML_TEMPLATE = r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Plan_Trabajo_Marcona.html"
PDF_FILE = r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Plan_Trabajo_Marcona.pdf"
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

def update_pdf_from_md():
    if not os.path.exists(MD_FILE):
        print(f"❌ Error: No se encuentra {MD_FILE}")
        return

    print(f"🔄 Leyendo cambios en {MD_FILE}...")
    with open(MD_FILE, "r", encoding="utf-8") as f:
        md_content = f.read()

    # Convert Markdown to HTML body
    html_body = markdown.markdown(md_content, extensions=['extra', 'nl2br'])
    
    with open(HTML_TEMPLATE, "r", encoding="utf-8") as f:
        full_html = f.read()

    # Define the area to replace
    start_marker = '<!-- SYNC_START -->'
    end_marker = '<!-- SYNC_END -->'
    
    if start_marker in full_html and end_marker in full_html:
        head_part = full_html.split(start_marker)[0] + start_marker
        footer_part = end_marker + full_html.split(end_marker)[1]
        
        new_html = head_part + "\n" + html_body + "\n" + footer_part
        
        with open(HTML_TEMPLATE, "w", encoding="utf-8") as f:
            f.write(new_html)
        print("✅ HTML actualizado.")

        # Generate PDF
        print("📄 Generando PDF...")
        try:
            # Explicitly use --no-sandbox if needed for some environments, 
            # and --disable-extensions for speed.
            cmd = [
                EDGE_PATH, 
                "--headless", 
                "--disable-gpu",
                "--no-pdf-header-footer",
                f"--print-to-pdf={PDF_FILE}", 
                f"file:///{HTML_TEMPLATE}"
            ]
            
            # Using run with a timeout or just ensuring it executes. 
            # Headless print-to-pdf should exit automatically.
            process = subprocess.run(cmd, timeout=30, capture_output=True, text=True)
            
            if os.path.exists(PDF_FILE):
                print(f"🚀 PDF generado exitosamente: {PDF_FILE}")
            else:
                print(f"❌ Error: El PDF no se generó. Output: {process.stdout} {process.stderr}")
                
        except subprocess.TimeoutExpired:
            print("⚠️ El comando de generación de PDF expiró, pero verificando si el archivo existe...")
            if os.path.exists(PDF_FILE):
                 print(f"✅ Archivo encontrado: {PDF_FILE}")
            else:
                 print("❌ No se encontró el archivo tras el timeout.")
        except Exception as e:
            print(f"❌ Error inesperado: {e}")
    else:
        print("❌ Error: No se encontraron los marcadores <!-- SYNC_START --> o <!-- SYNC_END --> en el HTML.")

if __name__ == "__main__":
    update_pdf_from_md()
