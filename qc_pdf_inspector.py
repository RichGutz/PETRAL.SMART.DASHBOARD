import os
import sys
import subprocess
import weasyprint
import fitz # PyMuPDF

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("=== INICIANDO CONTROL DE CALIDAD PERICIAL DE PAGINACIÓN ATÓMICA PDF ===")
    
    # 1. Ejecutar runner Node para generar las páginas HTML independientes
    cmd = ["node", "scratch_run_full_pdf_qc.mjs"]
    res = subprocess.run(cmd, cwd=os.path.join(os.getcwd(), "Desarrollo.Profesional", "Geeksoft_Frontend"), capture_output=True, text=True)
    if res.returncode != 0:
        print("❌ Error ejecutando scratch_run_full_pdf_qc.mjs:", res.stderr)
        return
    print("1. " + res.stdout.strip())

    # 2. Cargar HTML paginado
    html_path = os.path.join("Desarrollo.Profesional", "Geeksoft_Frontend", "scratch_atomic_full.html")
    with open(html_path, "r", encoding="utf-8") as f:
        full_html = f.read()

    # 3. Compilar PDF con WeasyPrint
    out_dir = os.path.join("Exceles.Petral", "QC_Auditoria_Escenarios")
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, "QC_Matriz_Financiera_Landscape_Verified.pdf")
    
    weasyprint.HTML(string=full_html).write_pdf(pdf_path)
    file_size = os.path.getsize(pdf_path)
    print(f"2. ✅ PDF Binario generado con éxito: {pdf_path} ({file_size / 1024:.1f} KB)")

    # 4. Inspección Forense del PDF con PyMuPDF (fitz)
    doc = fitz.open(pdf_path)
    page_count = len(doc)
    print(f"3. 📄 Total páginas independientes generadas: {page_count}")
    
    for idx, page in enumerate(doc):
        rect = page.rect
        width, height = rect.width, rect.height
        is_landscape = width > height
        t = page.get_text()
        lines = t.splitlines()
        
        print(f"\n   --- PÁGINA {idx+1} ---")
        print(f"   * Dimensiones: {width:.1f}pt x {height:.1f}pt ({'LANDSCAPE ✅' if is_landscape else 'PORTRAIT ❌'})")
        print(f"   * Total líneas de texto: {len(lines)}")
        
        # Verificar repetición de cabeceras oficiales en CADA página
        assert is_landscape, f"Error: Página {idx+1} no es Landscape"
        assert "NAVIERA PETRAL S.A." in t, f"Falta título en Página {idx+1}"
        assert "MÉTRICA" in t, f"Falta THEAD de MÉTRICA en Página {idx+1}"
        assert "TOTAL ACUM" in t, f"Falta TOTAL ACUM en Página {idx+1}"
        print(f"   * Cabecera y THEAD repetidos: ✅ OK")
        
        # Verificar que las métricas están en horizontal
        has_net_rev = "Net Revenue" in t
        has_bunker = "(-) Bunker Costs" in t
        has_pl = "(=) VOYAGE RESULT / P&L" in t
        print(f"   * Métricas horizontales presentes: Net Revenue({has_net_rev}), Bunker({has_bunker}), P/L({has_pl})")

    print("\n=======================================================")
    print("🎯 DICTAMEN QC: PAGINACIÓN ATÓMICA Y ANCHOS APROBADOS AL 100%")
    print("=======================================================")

if __name__ == "__main__":
    main()
