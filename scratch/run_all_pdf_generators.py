import subprocess

scripts = [
    "Desarrollo.Profesional/Geeksoft_Engine/generate_pdf_callao_qc.py",
    "Desarrollo.Profesional/Geeksoft_Engine/generate_pdf_matarani_qc.py",
    "Desarrollo.Profesional/Geeksoft_Engine/generate_pdf_ilo_qc.py",
    "Desarrollo.Profesional/Geeksoft_Engine/generate_pdf_marcona_qc.py",
    "Desarrollo.Profesional/Geeksoft_Engine/generate_pdf_mejillones_tpm_qc.py",
    "Desarrollo.Profesional/Geeksoft_Engine/generate_pdf_mejillones_interacid_qc.py",
    "Desarrollo.Profesional/Geeksoft_Engine/generate_pdf_mejillones_terquim_qc.py",
    "Desarrollo.Profesional/Geeksoft_Engine/generate_pdf_barquito_qc.py",
]

print("=== EJECUTANDO SUITE COMPLETA DE 8 GENERADORES DE PDF OFICIALES ===")
for s in scripts:
    res = subprocess.run(["python", s], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"[OK] {s}")
    else:
        print(f"[ERROR] {s} -> {res.stderr}")
