import os
import markdown
import weasyprint
import sys

def convert_obsidian_md_to_pdf():
    obsidian_dir = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.1\DashBoardPetral"
    file_name = "port_costs"
    
    md_path = os.path.join(obsidian_dir, f"{file_name}.md")
    pdf_path = os.path.join(obsidian_dir, f"{file_name}.pdf")
    
    if not os.path.exists(md_path):
        print(f"Error: {md_path} no existe.")
        return
        
    md_content = open(md_path, encoding='utf-8').read()
    
    # Configurar extensiones para que formatee correctamente bloques de código, tablas y diagramas
    html_body = markdown.markdown(md_content, extensions=['extra', 'codehilite'])
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
    @page {{
        size: A4 portrait;
        margin: 20mm;
    }}
    body {{
        font-family: 'Arial', sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #1e293b;
    }}
    h1 {{
        font-size: 20pt;
        color: #0f2c59;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 8px;
        margin-top: 0;
    }}
    h2 {{
        font-size: 14pt;
        color: #0f2c59;
        margin-top: 24px;
        margin-bottom: 12px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 4px;
    }}
    h3 {{
        font-size: 12pt;
        color: #334155;
        margin-top: 18px;
        margin-bottom: 8px;
    }}
    p, li {{
        margin-bottom: 8px;
    }}
    ul, ol {{
        margin-top: 4px;
        padding-left: 20px;
    }}
    code {{
        font-family: 'Courier New', Courier, monospace;
        background-color: #f1f5f9;
        padding: 2px 4px;
        border-radius: 4px;
        font-size: 9.5pt;
    }}
    pre {{
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
    }}
    pre code {{
        background-color: transparent;
        padding: 0;
        border-radius: 0;
        font-size: 9pt;
    }}
    blockquote {{
        margin: 16px 0;
        padding: 8px 16px;
        background-color: #f8fafc;
        border-left: 4px solid #3b82f6;
        color: #475569;
        font-style: italic;
    }}
    strong {{
        color: #0f2c59;
    }}
    table {{
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
    }}
    th, td {{
        border: 1px solid #e2e8f0;
        padding: 8px 12px;
        text-align: left;
    }}
    th {{
        background-color: #f1f5f9;
        color: #0f2c59;
        font-weight: bold;
    }}
    tr:nth-child(even) {{
        background-color: #f8fafc;
    }}
    </style>
</head>
<body>
    {html_body}
</body>
</html>
"""
    
    temp_html_path = os.path.join(obsidian_dir, "temp_port_costs.html")
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    weasyprint.HTML(temp_html_path).write_pdf(pdf_path)
    
    if os.path.exists(temp_html_path):
        os.remove(temp_html_path)
        
    print(f"Conversión exitosa de MD a PDF en: {pdf_path}")

if __name__ == "__main__":
    convert_obsidian_md_to_pdf()
