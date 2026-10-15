import os
import sys
from bs4 import BeautifulSoup
from docx import Document

def parse_docx(docx_path):
    doc = Document(docx_path)
    slides = []
    
    # We know the structure:
    # Table 0 is Instructions
    # Then each slide has:
    # - Meta table (2 rows x 2 cols): Tagline, Subtitle
    # - Main table (headers + data rows)
    # - Callout table (1x1)
    
    t_idx = 1 # Skip instructions table (index 0)
    for s_num in range(1, 7):
        meta_table = doc.tables[t_idx]
        main_table = doc.tables[t_idx + 1]
        call_table = doc.tables[t_idx + 2]
        t_idx += 3
        
        # Meta:
        tagline = meta_table.cell(0, 1).text.strip()
        subtitle = meta_table.cell(1, 1).text.strip()
        
        # Title from preceding paragraph or slide
        # Let's find the title from doc paragraphs matching [DIAPOSITIVA s_num]
        title = ""
        prefix = f"[DIAPOSITIVA {s_num}]"
        for p in doc.paragraphs:
            if prefix in p.text:
                parts = p.text.split("—", 1)
                if len(parts) > 1:
                    title = parts[1].strip()
                else:
                    title = p.text.replace(prefix, "").strip()
                break
                
        # Main Table:
        headers = [c.text.strip() for c in main_table.rows[0].cells]
        data_rows = []
        for row in main_table.rows[1:]:
            cells_content = []
            for cell in row.cells:
                # Get text with line breaks preserved
                lines = [p.text.strip() for p in cell.paragraphs if p.text.strip()]
                cells_content.append("\n".join(lines))
            data_rows.append(cells_content)
            
        # Callout:
        callout_text = call_table.cell(0, 0).text.strip()
        # Remove lightbulb if present
        if callout_text.startswith("💡"):
            callout_text = callout_text[1:].strip()
            
        slides.append({
            "slide_num": s_num,
            "tagline": tagline,
            "title": title,
            "subtitle": subtitle,
            "headers": headers,
            "rows": data_rows,
            "callout": callout_text
        })
        
    return slides

def update_html_with_slides(html_path, slides):
    with open(html_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")
        
    html_slides = soup.find_all(class_="slide-page")
    if len(html_slides) != len(slides):
        print(f"Warning: HTML has {len(html_slides)} slides but DOCX has {len(slides)} slides.")
        
    changes_count = 0
    for idx, slide_data in enumerate(slides):
        if idx >= len(html_slides):
            break
        s_el = html_slides[idx]
        
        # Tagline
        t_el = s_el.find(class_="tagline")
        if t_el and slide_data["tagline"] and t_el.get_text(strip=True) != slide_data["tagline"]:
            t_el.string = slide_data["tagline"]
            changes_count += 1
            
        # Title
        h2_el = s_el.find("h2")
        if h2_el and slide_data["title"] and h2_el.get_text(strip=True) != slide_data["title"]:
            h2_el.string = slide_data["title"]
            changes_count += 1
            
        # Subtitle
        sub_el = s_el.find(class_="subtitle")
        if sub_el and slide_data["subtitle"] and sub_el.get_text(strip=True) != slide_data["subtitle"]:
            sub_el.string = slide_data["subtitle"]
            changes_count += 1
            
        # Callout
        callout_el = s_el.find(class_="card-callout")
        if callout_el and slide_data["callout"]:
            # Check strong prefix
            strong_el = callout_el.find("strong")
            strong_text = strong_el.get_text(strip=True) if strong_el else ""
            clean_call = slide_data["callout"]
            if strong_text and clean_call.startswith(strong_text):
                rem_text = clean_call[len(strong_text):].strip()
                callout_el.clear()
                new_s = soup.new_tag("strong")
                new_s.string = strong_text + " "
                callout_el.append(new_s)
                callout_el.append(rem_text)
            else:
                callout_el.string = clean_call
            changes_count += 1
            
        # Table Cells
        table_el = s_el.find("table")
        if table_el:
            tbody = table_el.find("tbody") or table_el
            html_rows = tbody.find_all("tr")
            for r_idx, docx_row in enumerate(slide_data["rows"]):
                if r_idx < len(html_rows):
                    html_cells = html_rows[r_idx].find_all("td")
                    for c_idx, docx_cell_text in enumerate(docx_row):
                        if c_idx < len(html_cells):
                            h_cell = html_cells[c_idx]
                            # Check if changed
                            curr_text = h_cell.get_text().strip()
                            docx_clean = docx_cell_text.strip()
                            # If text has multiple lines, replace with br
                            lines = [l.strip() for l in docx_cell_text.split("\n") if l.strip()]
                            h_cell.clear()
                            for l_i, line in enumerate(lines):
                                if l_i > 0:
                                    h_cell.append(soup.new_tag("br"))
                                    
                                # If line starts with bullet or was badge
                                if line.startswith("[") and line.endswith("]"):
                                    badge_span = soup.new_tag("span", attrs={"class": "badge-active"})
                                    badge_span.string = line.strip("[]")
                                    h_cell.append(badge_span)
                                elif l_i == 0 and not line.startswith("•") and not line.startswith("-") and len(lines) > 1:
                                    st = soup.new_tag("strong")
                                    st.string = line
                                    h_cell.append(st)
                                else:
                                    h_cell.append(line)
                            changes_count += 1

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(str(soup))
        
    return changes_count

def sync_all(docx_path):
    if not os.path.exists(docx_path):
        print(f"Error: File not found at {docx_path}")
        return
        
    slides = parse_docx(docx_path)
    print(f"Successfully read {len(slides)} slides from {docx_path}")
    
    target_files = [
        "Proposal/PRESENTACION_TRILOGIA_PETRAL_ONE_TWO_THREE.html",
        "Desarrollo.Profesional/Geeksoft_Frontend/public/sota_petral_one.html",
        "Desarrollo.Profesional/Geeksoft_Frontend/public/presentacion_trilogia.html"
    ]
    
    for tf in target_files:
        if os.path.exists(tf):
            cnt = update_html_with_slides(tf, slides)
            print(f"Synced {tf} -> {cnt} elements processed.")
        else:
            print(f"Skipping (not found): {tf}")

if __name__ == "__main__":
    docx_file = sys.argv[1] if len(sys.argv) > 1 else "Proposal/GUION_TEXTOS_PRESENTACION_SOTA_PETRAL.docx"
    print(f"Starting sync from Word document: {docx_file}")
    sync_all(docx_file)
