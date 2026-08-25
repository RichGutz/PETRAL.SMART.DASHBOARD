import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

note_path = r"C:\Users\rguti\Inandes.ERP.React\Obsidian\Mudanza.Contabo\Mudanza.Contabo\10. Correccion.Direccionamiento.Hostinger.md"
with open(note_path, 'r', encoding='utf-8') as f:
    print(f.read())
