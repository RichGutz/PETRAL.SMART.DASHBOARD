import markdown2
from weasyprint import HTML, CSS
import os

# Paths
md_file = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Suply.Chain.Iron.Ore\estimacion_capex_10mtpa.md'
pdf_file = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Suply.Chain.Iron.Ore\estimacion_capex_10mtpa.pdf'
assets_dir = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Suply.Chain.Iron.Ore\assets'

# Read Markdown
with open(md_file, 'r', encoding='utf-8') as f:
    text = f.read()

# Convert Markdown to HTML
html_content = markdown2.markdown(text, extras=['tables', 'fenced-code-blocks', 'admonitions'])

# Full HTML template with styles
full_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {{
            margin: 2cm;
            @bottom-right {{
                content: counter(page);
            }}
        }}
        body {{
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
        }}
        h1 {{ color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; border-bottom: 1px solid #eee; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        th {{ background-color: #f8f9fa; font-weight: bold; color: #2c3e50; }}
        tr:nth-child(even) {{ background-color: #f2f2f2; }}
        .center {{ text-align: center; }}
        img {{ max-width: 100%; height: auto; display: block; margin: 10px auto; }}
        blockquote {{
            background: #fdf2f2;
            border-left: 5px solid #d9534f;
            margin: 1.5em 10px;
            padding: 1em 10px;
            font-style: italic;
        }}
        .important {{
            background-color: #f8f9fa;
            border: 1px solid #3498db;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }}
        .subtitle {{
            font-size: 0.9em;
            color: #7f8c8d;
            font-style: italic;
            margin-top: -10px;
            margin-bottom: 20px;
            text-align: center;
        }}
    </style>
</head>
<body>
    {html_content}
</body>
</html>
"""

# Write temporary HTML to fix relative image paths
temp_html_path = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Suply.Chain.Iron.Ore\temp_render.html'

# Markdown2 might not handle the <img> tags inside <div> exactly as we want if mixed with MD.
# Let's ensure paths are absolute for WeasyPrint or use base_url.
base_url = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Suply.Chain.Iron.Ore\\'

# Generate PDF
HTML(string=full_html, base_url=base_url).write_pdf(pdf_file)

print(f"PDF generado exitosamente en: {pdf_file}")
