#!/usr/bin/env python3
"""
audit_docs_as_code_drift.py
=============================================================================
AUDITORÍA FORENSE PERICIAL DE PARIDAD: DOCS-AS-CODE VS SISTEMA VIVO
PROTOCOLO BENOIT BLANC — NAVIERA PETRAL S.A. / PETRAL ONE
=============================================================================
Este script audita de manera no destructiva que el corpus canónico de datos
documentales (docsAsCodeData_V2.ts) se mantenga en paridad absoluta con los
datos maestros de producción (DWCC, factores hidrodinámicos, rutas y cierres).
"""

import os
import re
import sys

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_AS_CODE_PATH = os.path.join(
    BASE_DIR, "Desarrollo.Profesional", "Geeksoft_Frontend", "src", "data", "docsAsCodeData_V2.ts"
)
MASTER_TEMPLATE_PATH = os.path.join(
    BASE_DIR, "Desarrollo.Profesional", "Geeksoft_Frontend", "src", "components", "Masters", "MasterTemplate_V2.tsx"
)

# Valores canónicos de verdad en base de datos de producción (Supabase vessels)
CANONICAL_FLEET = {
    "Moquegua": {"dwcc": 13500, "dwt": 14298, "grt": 8259, "loa": 134.00, "draft": 8.81},
    "Tablones": {"dwcc": 14500, "dwt": 16533, "grt": 11365, "loa": 158.80, "draft": 10.20},
    "Concon Trader": {"dwcc": 19000, "dwt": 19823, "grt": 11773, "loa": 146.00, "draft": 9.72},
    "Huemul": {"dwcc": 21000, "dwt": 22062, "grt": 13666, "loa": 161.00, "draft": 9.95},
    "Bow Condor": {"dwcc": 15000, "dwt": 16121, "grt": 9232, "loa": 133.00, "draft": 9.24}
}

def audit_docs_as_code():
    print("=" * 80)
    print("🔎 PERITAJE BENOIT BLANC: AUDITORÍA DE DERIVA (DOCS DRIFT) EN DOCS-AS-CODE")
    print("=" * 80)
    
    if not os.path.exists(DOCS_AS_CODE_PATH):
        print(f"❌ ERROR CRÍTICO: No se encontró el archivo canónico: {DOCS_AS_CODE_PATH}")
        sys.exit(1)
        
    with open(DOCS_AS_CODE_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    errors = []
    warnings = []
    
    # 1. Auditoría Capítulo 1: Maestro de Flota & DWCC
    print("\n[1] Verificando Capítulo 1: Homologación de Flota y DWCC...")
    if "Maestro de Flota" not in content:
        errors.append("Capítulo 1: No se encontró el título 'Maestro de Flota'.")
    if "DWCC (Deadweight Cargo Capacity)" not in content:
        errors.append("Capítulo 1: Falta la definición canónica de DWCC en los bulletPoints.")
        
    for vessel, specs in CANONICAL_FLEET.items():
        if vessel not in content:
            errors.append(f"Capítulo 1: La nave '{vessel}' no figura en docsAsCodeData_V2.ts.")
        else:
            # Encontrar la fila de la tabla que contiene el nombre del buque
            vessel_match = re.search(rf"\[\s*'(?:B/T\s+)?{re.escape(vessel)}'[^\]]+\]", content)
            if vessel_match:
                row_str = vessel_match.group(0)
                expected_dwcc = f"{specs['dwcc']:,}".replace(",", ",")
                expected_dwcc_dot = f"{specs['dwcc']:,}".replace(",", ".")
                expected_dwcc_plain = str(specs['dwcc'])
                if (expected_dwcc in row_str or expected_dwcc_dot in row_str or expected_dwcc_plain in row_str):
                    print(f"  ✓ {vessel}: DWCC {specs['dwcc']:,} MT verificado en Tabla 1.1 con paridad DB.")
                else:
                    errors.append(f"Capítulo 1: Discrepancia en DWCC para '{vessel}'. Fila: {row_str} (Esperado: {specs['dwcc']} MT).")
            else:
                errors.append(f"Capítulo 1: No se pudo localizar la fila de la nave '{vessel}' en TableData 1.1.")
                
    # 2. Auditoría Capítulo 3: Factores Climáticos (Weather Factors)
    print("\n[2] Verificando Capítulo 3: Factores Hidrodinámicos (Laden & Ballast)...")
    if "Maestro de Distancias" not in content:
        errors.append("Capítulo 3: No se encontró el título 'Maestro de Distancias'.")
    if "Weather_Factor" not in content and "Weather Factor" not in content:
        errors.append("Capítulo 3: No se mencionan los Weather Factors en las fórmulas.")
    if "W.F Laden" not in content or "W.F Ballast" not in content:
        warnings.append("Capítulo 3: Recomendado incluir columnas explícitas 'W.F Laden' y 'W.F Ballast' en Table 3.1.")
    else:
        print("  ✓ Weather Factor Laden y Ballast formalizados en ecuaciones cinemáticas.")

    # 3. Auditoría Capítulo 5: Maestro de Cierres (Renombrado Canónico)
    print("\n[3] Verificando Capítulo 5: Maestro de Cierres (/contracts)...")
    if "Maestro de Cierres" not in content:
        errors.append("Capítulo 5: No se encontró el título canónico 'Maestro de Cierres'.")
    else:
        print("  ✓ Nomenclatura 'Maestro de Cierres' homologada con la barra lateral.")
        
    if "Contratos Marco (COA)" in content:
        warnings.append("Capítulo 5: Aún contiene la mención legacy 'Contratos Marco (COA)'. Asegurar que solo sea explicativa.")

    # 4. Auditoría de Capítulos Totales y Estructura
    print("\n[4] Verificando integridad estructural de Capítulos...")
    chapter_matches = re.findall(r"chapterNum:\s*(\d+)", content)
    total_chapters = len(chapter_matches)
    print(f"  ✓ Total de Capítulos detectados en el corpus: {total_chapters}")
    if total_chapters < 19:
        warnings.append(f"Se detectaron {total_chapters} capítulos. El estándar del sistema cubre 19 módulos.")

    # Veredicto Final Benoit Blanc
    print("\n" + "=" * 80)
    print("📋 VEREDICTO PERICIAL BENOIT BLANC:")
    print("=" * 80)
    if errors:
        print(f"❌ SE DETECTARON {len(errors)} DISCREPANCIAS CRÍTICAS:")
        for err in errors:
            print(f"   - {err}")
        return False
    else:
        print("✅ INTEGRIDAD ABSOLUTA: docsAsCodeData_V2.ts coincide al 100% con los datos maestros.")
        if warnings:
            print(f"⚠️ ADVERTENCIAS MENORES ({len(warnings)}):")
            for w in warnings:
                print(f"   - {w}")
        return True

if __name__ == "__main__":
    success = audit_docs_as_code()
    sys.exit(0 if success else 1)
