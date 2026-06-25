import weasyprint
import re
import os

def run_check():
    proposal_dir = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Proposal"
    html_path = os.path.join(proposal_dir, "PROPOSAL_PETRAL_PPT_V63.html")
    
    if not os.path.exists(html_path):
        print(f"Error: {html_path} no existe")
        return
        
    html_content = open(html_path, encoding='utf-8').read()
    
    # Reemplazar h2 por h2 con ID secuencial para WeasyPrint anchor tracking
    count = 0
    def repl(match):
        nonlocal count
        count += 1
        h2_open = match.group(1)
        if 'style=' in h2_open:
            style_part = h2_open[3:]
            return f'<h2 id="slide-{count}"{style_part}{match.group(2)}</h2>'
        else:
            return f'<h2 id="slide-{count}">{match.group(2)}</h2>'
 
    modified_html = re.sub(r'(<h2[^>]*>)(.*?)</h2>', repl, html_content)
    
    base_url = os.path.dirname(html_path)
    doc = weasyprint.HTML(string=modified_html, base_url=base_url).render()
    
    slide_pages = {}
    for page_idx, page in enumerate(doc.pages):
        for anchor in page.anchors:
            if anchor.startswith('slide-'):
                slide_pages[anchor] = page_idx + 1
                
    h2_titles = re.findall(r'<h2[^>]*>(.*?)</h2>', modified_html)
    print("--- DISTRIBUCION DE SLIDES V63 EN PAGINAS ---")
    for idx, title in enumerate(h2_titles):
        slide_id = f'slide-{idx+1}'
        page_num = slide_pages.get(slide_id, 'No encontrado')
        clean_title = re.sub(r'<[^>]*>', '', title)
        print(f"Slide {idx+1:02d} (Pag {page_num}): {clean_title}")
        
    print(f"\nTotal Paginas Fisicas: {len(doc.pages)}")

if __name__ == "__main__":
    run_check()
