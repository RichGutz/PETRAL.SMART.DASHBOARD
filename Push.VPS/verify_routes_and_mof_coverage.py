#!/usr/bin/env python3
"""
verify_routes_and_mof_coverage.py
=============================================================================
AUDITORÍA FORENSE DE COBERTURA: RUTAS DE ERP VS DOCS-AS-CODE VS MOF
PROTOCOLO BENOIT BLANC — NAVIERA PETRAL S.A. / PETRAL ONE
=============================================================================
Este script audita que cada ruta activa en la interfaz y barra lateral de
PETRAL ONE posea cobertura total (100%) tanto en el corpus de Docs-as-Code
(docsAsCodeData_V2.ts) como en el Manual de Organización y Funciones (mofManualData_V2.ts).
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
FRONTEND_SRC = os.path.join(BASE_DIR, "Desarrollo.Profesional", "Geeksoft_Frontend", "src")
DOCS_DATA_PATH = os.path.join(FRONTEND_SRC, "data", "docsAsCodeData_V2.ts")
MOF_DATA_PATH = os.path.join(FRONTEND_SRC, "data", "mofManualData_V2.ts")
MASTER_TEMPLATE_PATH = os.path.join(FRONTEND_SRC, "components", "Masters", "MasterTemplate_V2.tsx")

# Mapeo canónico de rutas a palabras clave esperadas en Docs as Code
ROUTE_TO_MODULE = {
    # Físicos
    "vessels": {"label": "Maestro de Flota", "expected_kw": "flota"},
    "ports": {"label": "Maestro de Puertos", "expected_kw": "puertos"},
    "routes": {"label": "Maestro de Distancias y Rutas", "expected_kw": "distancias"},
    # Comerciales
    "clients": {"label": "Maestro de Clientes", "expected_kw": "clientes"},
    "contracts": {"label": "Maestro de Cierres", "expected_kw": "cierres"},
    "quotes": {"label": "Cotizador Spot", "expected_kw": "cotizador"},
    "budgets": {"label": "Presupuestos", "expected_kw": "presupuesto"},
    "financial-projections": {"label": "Proyecciones Financieras", "expected_kw": "proyecciones"},
    # Costos
    "port-tariffs": {"label": "Tarifario Portuario", "expected_kw": "tarifario"},
    "port-costs": {"label": "Costos Portuarios", "expected_kw": "costos portuarios"},
    "demurrage": {"label": "Demoras y Despachos", "expected_kw": "demoras"},
    # Mercado
    "bunker": {"label": "Maestro de Búnker", "expected_kw": "búnker"},
    "sources-sinks": {"label": "Fuentes y Destinos (S&D)", "expected_kw": "fuentes"},
    # Herramientas
    "multicotizador": {"label": "Multicotizador", "expected_kw": "multicotizador"},
    "financial-matrix": {"label": "Matriz Financiera", "expected_kw": "matriz"},
    "spaghetti-map": {"label": "Spaghetti Map & Tráfico", "expected_kw": "map"},
    "audit-ledger": {"label": "Libro Mayor de Auditoría", "expected_kw": "auditoría"}
}

def verify_coverage():
    print("=" * 80)
    print("🧭 PERITAJE BENOIT BLANC: COBERTURA DE RUTAS DE NAVEGACIÓN EN DOCS & MOF")
    print("=" * 80)

    for path, name in [(DOCS_DATA_PATH, "Docs as Code"), (MOF_DATA_PATH, "MOF"), (MASTER_TEMPLATE_PATH, "Master Template")]:
        if not os.path.exists(path):
            print(f"❌ Archivo no encontrado: {path}")
            return False

    with open(DOCS_DATA_PATH, "r", encoding="utf-8") as f:
        docs_text = f.read()

    with open(MOF_DATA_PATH, "r", encoding="utf-8") as f:
        mof_text = f.read()

    print(f"\n[1] Evaluando cobertura de {len(ROUTE_TO_MODULE)} módulos clave...")
    missing_docs = []
    missing_mof = []

    print("-" * 80)
    print(f"{'Ruta del Sistema':<24} | {'Módulo / Título':<28} | {'Docs as Code':<12} | {'MOF':<8}")
    print("-" * 80)

    for route, info in ROUTE_TO_MODULE.items():
        # Check Docs as Code
        has_docs = (
            info["label"].lower() in docs_text.lower() or 
            info["expected_kw"].lower() in docs_text.lower() or
            f"/{route}" in docs_text or
            f"'{route}'" in docs_text
        )
        # Check MOF
        has_mof = (
            f"/{route}" in mof_text or
            info["label"].lower() in mof_text.lower() or
            info["expected_kw"].lower() in mof_text.lower()
        )

        status_docs = "✓ Cubierto" if has_docs else "✗ AUSENTE"
        status_mof = "✓ Cubierto" if has_mof else "✗ AUSENTE"

        if not has_docs:
            missing_docs.append(route)
        if not has_mof:
            missing_mof.append(route)

        print(f"{route:<24} | {info['label']:<28} | {status_docs:<12} | {status_mof:<8}")

    print("-" * 80)
    docs_pct = ((len(ROUTE_TO_MODULE) - len(missing_docs)) / len(ROUTE_TO_MODULE)) * 100
    mof_pct = ((len(ROUTE_TO_MODULE) - len(missing_mof)) / len(ROUTE_TO_MODULE)) * 100

    print(f"\n📊 RESUMEN DE COBERTURA INTEGRAL:")
    print(f"   • Cobertura en Docs-as-Code: {docs_pct:.1f}% ({len(ROUTE_TO_MODULE) - len(missing_docs)}/{len(ROUTE_TO_MODULE)})")
    print(f"   • Cobertura en MOF:          {mof_pct:.1f}% ({len(ROUTE_TO_MODULE) - len(missing_mof)}/{len(ROUTE_TO_MODULE)})")

    if missing_docs or missing_mof:
        print("\n⚠️ ALERTAS PERICIALES:")
        if missing_docs:
            print(f"   - Rutas sin cobertura explícita en Docs-as-Code: {missing_docs}")
        if missing_mof:
            print(f"   - Rutas sin asignación funcional en MOF: {missing_mof}")
        return False
    else:
        print("\n✅ VEREDICTO: Todas las rutas operativas cuentan con respaldo normativo y funcional.")
        return True

if __name__ == "__main__":
    success = verify_coverage()
    sys.exit(0 if success else 1)
