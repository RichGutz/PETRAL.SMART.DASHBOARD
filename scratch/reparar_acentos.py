import os

def reparar_archivo(filepath):
    if not os.path.exists(filepath):
        print(f"No existe: {filepath}")
        return

    print(f"Reparando caracteres en: {filepath}")
    
    # Leer el archivo como UTF-8
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # Reemplazos específicos de las secuencias de bytes corruptas (CP1252 interpretando UTF-8)
    # las transformamos directamente a secuencias de escape de JS \uXXXX
    reemplazos = [
        # Cabeceras
        ("M├®trica", "M\\u00e9trica"),
        ("F├│rmula Algor├¡tmica", "F\\u00f3rmula Algor\\u00edtmica"),
        ("Reemplazo Num├®rico", "Reemplazo Num\\u00e9rico"),
        ("Delta (╬ö)", "Delta (\\u0394)"),
        ("Delta (\u0394)", "Delta (\\u0394)"),
        ("Delta (Δ)", "Delta (\\u0394)"),
        
        # Días
        ("D├¡as", "D\\u00edas"),
        ("Días", "D\\u00edas"),
        
        # Límites
        ("L├¡mites", "L\\u00edmites"),
        ("Límites", "L\\u00edmites"),
        
        # Títulos y auditoría
        ("Auditor├¡a", "Auditor\\u00eda"),
        ("Auditoría", "Auditor\\u00eda"),
        ("Auditora", "Auditor\\u00eda"),
        ("Matem├tica", "Matem\\u00e1tica"),
        ("Matemática", "Matem\\u00e1tica"),
        ("Matem\u01dmatica", "Matem\\u00e1tica"),
        ("Matemǭtica", "Matem\\u00e1tica"),
        
        # Alertas y diálogos
        ("bloqueÃ³", "bloque\\u00f3"),
        ("bloqueó", "bloque\\u00f3"),
        ("HabilÃ­tala", "Habil\\u00edtala"),
        ("Habilítala", "Habil\\u00edtala"),
        ("cargados a\u011fn", "cargados a\\u00fan"),
        ("cargados aún", "cargados a\\u00fan"),
        ("cargados aǧn", "cargados a\\u00fan"),
        ("Justificaci├│n", "Justificaci\\u00f3n"),
        ("Justificación", "Justificaci\\u00f3n"),
        ("Justificacin", "Justificaci\\u00f3n"),
        ("Cotizaci├│n", "Cotizaci\\u00f3n"),
        ("Cotización", "Cotizaci\\u00f3n"),
        ("Cotizacin", "Cotizaci\\u00f3n"),
        ("Per├¡odo", "Per\\u00edodo"),
        ("Período", "Per\\u00edodo"),
        ("Perodo", "Per\\u00edodo"),
        ("impresi├│n", "impresi\\u00f3n"),
        ("impresión", "impresi\\u00f3n"),
        
        # Puntos medios y otros
        ("┬À", "\\u00b7"),
        ("ports  Calculado", "ports \\u00b7 Calculado"),
        ("routes  vessels", "routes \\u00b7 vessels"),
        
        # Icono de impresora
        ("ðŸ–¨ï¸", "🖨️"),
        ("??", "🧪"),
    ]

    for corrupto, correcto in reemplazos:
        content = content.replace(corrupto, correcto)

    # Escribir de vuelta
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Reparado con éxito OK")

if __name__ == "__main__":
    base_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast"
    reparar_archivo(os.path.join(base_dir, "VoyageLedgerTest.tsx"))
    reparar_archivo(os.path.join(base_dir, "VoyageLedgerUniversal.tsx"))
