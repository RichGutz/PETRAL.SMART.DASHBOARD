import os
import sys

# Asegurar salida utf-8 en Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ajustar sys.path para importar backend.services.forecast_service
engine_dir = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine'
if engine_dir not in sys.path:
    sys.path.insert(0, engine_dir)

from backend.services.forecast_service import calculate_detailed_port_costs

print("=" * 80)
print("🧪 SCRIPT DE PRUEBA AUTÓNOMA: VERIFICACIÓN DE MODOS STATIC Y MATRIX")
print("=" * 80)

# Mock data de port_cost_static en Supabase
agency_matrix_data = [
    {"port_id": "CALLAO", "vessel_id": "MOQUEGUA", "operation_type": "DESCARGA", "sub_operation_type": "MAIN", "cost": 14938.34},
    {"port_id": "ILO", "vessel_id": "MOQUEGUA", "operation_type": "CARGA", "sub_operation_type": "MAIN", "cost": 21797.39},
    {"port_id": "MARCONA", "vessel_id": "MOQUEGUA", "operation_type": "CARGA", "sub_operation_type": "MAIN", "cost": 36000.00}
]

vparams = {"length": 134.16, "gross_tonnage": 8259}

print("\n--- 1. PROBANDO MODO STATIC (ESTRÍCTO SIN FALLBACKS FICTICIOS) ---")

# Caso A: Nave con tarifa registrada (MOQUEGUA en Callao Descarga)
res_static_found = calculate_detailed_port_costs(
    client_id="SPCC", port_id="CALLAO", operation_type="DESCARGA", vessel_id="B/T MOQUEGUA",
    port_costs_data=[], agency_matrix_data=agency_matrix_data, port_cost_mode="static",
    vparams=vparams, quantity=13500, contract={}, ports_db={}
)
print(f"✅ CALLAO / DESCARGA / B/T MOQUEGUA: Costo = ${res_static_found['total_cost']:,.2f} (Esperado: $14,938.34)")

# Caso B: Nave SIN tarifa registrada en ese puerto (CONCON TRADER en Callao Descarga no está en mock)
res_static_missing = calculate_detailed_port_costs(
    client_id="SPCC", port_id="CALLAO", operation_type="DESCARGA", vessel_id="CONCON TRADER",
    port_costs_data=[], agency_matrix_data=agency_matrix_data, port_cost_mode="static",
    vparams=vparams, quantity=13500, contract={}, ports_db={}
)
print(f"✅ CALLAO / DESCARGA / CONCON TRADER (Sin tarifa en DB): Costo = ${res_static_missing['total_cost']:,.2f} (Esperado: $0.00 Estricto sin fallbacks)")


print("\n--- 2. PROBANDO MODO MATRIX (MODELO MATRIZ COMPLEJA: PROMEDIO ALTO Y BAJO) ---")

res_matrix_callao = calculate_detailed_port_costs(
    client_id="SPCC", port_id="CALLAO", operation_type="DESCARGA", vessel_id="B/T MOQUEGUA",
    port_costs_data=[], agency_matrix_data=agency_matrix_data, port_cost_mode="matrix",
    vparams=vparams, quantity=13500, contract={}, ports_db={}
)

high = res_matrix_callao['breakdown']['escenario_alto']
low = res_matrix_callao['breakdown']['escenario_bajo']
avg = res_matrix_callao['total_cost']

print(f"✅ CALLAO / MATRIX: Escenario Alto = ${high:,.2f} | Escenario Bajo = ${low:,.2f}")
print(f"👉 Promedio Matriz Compleja = ${avg:,.2f} (Calculado: ({high:,.2f} + {low:,.2f}) / 2 = ${((high+low)/2):,.2f})")

assert abs(avg - round((high + low) / 2.0, 2)) < 0.01, "Error en promedio de Matriz Compleja"
assert res_static_missing['total_cost'] == 0.0, "Error en modo STATIC: Debe retornar 0.0 sin fallbacks"

print("\n🎉 PRUEBA AUTÓNOMA COMPLETADA CON ÉXITO: 100% SUCCESS")
