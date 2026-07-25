import sys
import os

# Añadir el directorio raíz de Geeksoft_Engine al PATH
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.port_engines import calculator_marcona, core

print("=" * 70)
print(" *** PRUEBA EMPIRICA EN TERMINAL: MOTOR DEDICADO DE MARCONA (SPCC) ***")
print("=" * 70)

# 1. Test Data (BT MOQUEGUA)
moquegua_data = {
    "loa": 134.16,
    "grt": 8259,
    "dwt": 14298,
    "vessel_name": "BT MOQUEGUA"
}

# Scenario 1: Estancia Normal en Puerto (45h <= 48h)
res1 = calculator_marcona.run(moquegua_data, port_hours=45.0, inputs={"last_port_country": "PE"})
print("\n[ESCENARIO 1] Permanencia Normal (45h <= 48h)")
print(f" -> Puerto: {res1['port_name']}")
print(f" -> Operador: {res1['terminal_operator']}")
print(f" -> Tarifario Publico Bruto: ${res1['public_catalog_usd']:,.2f} USD")
print(f" -> Tarifa Acuerdo SPCC/Petral: ${res1['total_scale_cost_usd']:,.2f} USD")
print(f" -> Desglose por Categorias:")
for cat, amt in res1['breakdown'].items():
    print(f"     * {cat}: ${amt:,.2f} USD")

assert res1['total_scale_cost_usd'] == 36000.00, f"ERROR: Esperado $36,000.00 USD, obtenido ${res1['total_scale_cost_usd']}"
print(" [OK] TEST 1 PASADO EXCELENTE ($36,000.00 USD Flat Exacto)")

# Scenario 2: Exceso de Estadía (> 48h -> Recargo Stand-By +$3,000)
res2 = calculator_marcona.run(moquegua_data, port_hours=52.0, inputs={"last_port_country": "PE"})
print("\n[ESCENARIO 2] Exceso de Permanencia (52h > 48h -> Recargo Stand-By)")
print(f" -> Tarifa Total con Recargo: ${res2['total_scale_cost_usd']:,.2f} USD")
assert res2['total_scale_cost_usd'] == 39000.00, f"ERROR: Esperado $39,000.00 USD, obtenido ${res2['total_scale_cost_usd']}"
print(" [OK] TEST 2 PASADO EXCELENTE ($39,000.00 USD con Recargo Stand-By)")

# Scenario 3: Test via Dispatcher Core
core_res = core.calculate_dynamic_port_costs("SAN_JUAN_MARCONA", "PE", moquegua_data, port_hours=45.0)
print("\n[ESCENARIO 3] Invocacion via Orquestador Central (core.py)")
print(f" -> Orquestador devolvio: ${core_res['total_scale_cost_usd']:,.2f} USD")
assert core_res['total_scale_cost_usd'] == 36000.00, "ERROR en Dispatcher core.py"
print(" [OK] TEST 3 PASADO EXCELENTE (Despachador Core verificado)")

print("\n" + "=" * 70)
print(" [EXITO] PRUEBA FINALIZADA: 100% COINCIDENCIA MATEMATICA CON EXCEL DE MARCONA")
print("=" * 70)

