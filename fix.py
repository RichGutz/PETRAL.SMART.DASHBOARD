import re
import os

# 1. Modify HTML
html_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.2\kickoff_petral.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Change image source
html = re.sub(r'src="file:///.*?tanker_tablones.*?\.png"', 'src="tanker_tablones.png"', html)

# Delete slide 8
html = re.sub(r'<!-- ══════════════════════════════════\s*S8 · LEDGER EN VIVO\s*══════════════════════════════════ -->.*?</section>', '', html, flags=re.DOTALL)

# Update totals
html = html.replace('1 / 8', '1 / 7')
html = html.replace('const TOTAL = 8;', 'const TOTAL = 7;')

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

# 2. Modify deploy script
py_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS\deploy_forecast_kickoff.py"
with open(py_path, "r", encoding="utf-8") as f:
    py = f.read()

img_var = 'IMG_FILE = r"C:\\Users\\rguti\\.gemini\\antigravity-ide\\brain\\f7f693a3-899b-4645-93cc-ffbc88e91e54\\tanker_tablones_1782498428298.png"\n'
if "IMG_FILE" not in py:
    py = py.replace('HTML_FILE =', img_var + 'HTML_FILE =')

upload_code = 'sftp.put(IMG_FILE, f"{APP_DIR}/tanker_tablones.png")'
if "tanker_tablones" not in py:
    py = py.replace('sftp.put(HTML_FILE, remote_path)', 'sftp.put(HTML_FILE, remote_path)\n        ' + upload_code)

with open(py_path, "w", encoding="utf-8") as f:
    f.write(py)

print("Done")
