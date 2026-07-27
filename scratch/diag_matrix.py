import os
import sys

# Asegurar salida utf-8 en Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ajustar sys.path para importar backend.spot_engine
engine_dir = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine'
if engine_dir not in sys.path:
    sys.path.insert(0, engine_dir)

from backend.services.forecast_service import calculate_detailed_port_costs

vparams = {"length": 134.16, "gross_tonnage": 8259}

print("=" * 80)
print("🧪 DIAGNÓSTICO AUTÓNOMO DIRECTO: CALLAO MATRIX")
print("=" * 80)

res_orig = calculate_detailed_port_costs(
    "PETRAL", "CALLAO", "CARGA", "B/T MOQUEGUA",
    [], [], "matrix", vparams, 13500, {}, {}
)

print("Res Orig Matrix:", res_orig)
