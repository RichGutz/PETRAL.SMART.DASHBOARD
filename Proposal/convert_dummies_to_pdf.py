import os
import markdown
import weasyprint

def convert():
    proposal_dir = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Proposal"
    md_path = os.path.join(proposal_dir, "SLIDE_DUMMIES.md")
    pdf_path = os.path.join(proposal_dir, "SLIDE_DUMMIES.pdf")
    
    if not os.path.exists(md_path):
        print(f"Error: {md_path} no existe.")
        return
        
    md_content = open(md_path, encoding='utf-8').read()
    
    html_body = markdown.markdown(md_content, extensions=['extra', 'codehilite'])
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
    @page {{
        size: A4 landscape;
        margin: 15mm;
    }}
    body {{
        font-family: 'Arial', sans-serif;
        font-size: 14pt;
        line-height: 1.6;
        color: #1e293b;
    }}
    h1, h2 {{
        color: #0f2c59;
    }}
    </style>
</head>
<body>
    {html_body}
</body>
</html>
"""
    
    temp_html_path = os.path.join(proposal_dir, "temp_dummies.html")
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    weasyprint.HTML(temp_html_path, base_url=proposal_dir).write_pdf(pdf_path)
    
    if os.path.exists(temp_html_path):
        os.remove(temp_html_path)
        
    print(f"PDF generado exitosamente en: {pdf_path}")

if __name__ == "__main__":
    convert()
