import os

path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\layouts\ToolsLayout_V2.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_cond = "activeTab !== 'liquidations-pdf-audit' && activeTab !== 'system-documentation' && activeTab !== 'system-flowchart' && ("
new_cond = "activeTab !== 'liquidations-pdf-audit' && activeTab !== 'system-documentation' && activeTab !== 'system-flowchart' && activeTab !== 'multicotizador' && ("

code = code.replace(old_cond, new_cond)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("TOOLS LAYOUT V2 UPDATED: FORECAST BUILDER EXCLUDED FROM MULTICOTIZADOR PAGE SUCCESSFULLY!")
