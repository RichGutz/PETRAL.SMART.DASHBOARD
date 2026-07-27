import os
import sys

# Asegurar salida utf-8 en Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ajustar sys.path para importar backend.spot_engine
engine_dir = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine'
if engine_dir not in sys.path:
    sys.path.insert(0, engine_dir)

from backend.spot_engine import calculate_multicotizador_simulation

print("=" * 80)
print("🧪 SCRIPT DE PRUEBA AUTÓNOMA: STATIC VS MATRIX EN EL MULTICOTIZADOR SPOT")
print("=" * 80)

payload_base = {
    "vessel_id": "B/T MOQUEGUA",
    "vessel_params": {
        "length": 134.16,
        "gross_tonnage": 8259,
        "speed": 11.0,
        "consumption_sea_ifo": 12.0,
        "consumption_idle_ifo": 1.5,
        "consumption_sea_mdo": 1.0,
        "consumption_idle_mdo": 0.2
    },
    "tramos": [
        {
            "type": "LADEN",
            "origin_port_id": "CALLAO",
            "destination_port_id": "ILO",
            "quantity": 13500,
            "freight_rate": 25.5,
            "route_distance": 450
        }
    ]
}

print("\n--- 1. SIMULACIÓN EN MODO STATIC ---")
payload_static = {**payload_base, "port_cost_mode": "static"}
res_static = calculate_multicotizador_simulation(payload_static)
cost_static = res_static["consolidated"]["total_port_costs"]
print(f"✅ Multicotizador (STATIC): Costo Total de Puertos = ${cost_static:,.2f}")

print("\n--- 2. SIMULACIÓN EN MODO MATRIX ---")
payload_matrix = {**payload_base, "port_cost_mode": "matrix"}
res_matrix = calculate_multicotizador_simulation(payload_matrix)
cost_matrix = res_matrix["consolidated"]["total_port_costs"]
print(f"✅ Multicotizador (MATRIX): Costo Total de Puertos = ${cost_matrix:,.2f}")

assert cost_matrix > 0, "El costo de puertos en modo MATRIX debe ser mayor que 0"
print(f"👉 Modo MATRIX calculó dinámicamente: Callao + Ilo = ${cost_matrix:,.2f} USD")

print("\n🎉 PRUEBA AUTÓNOMA COMPLETADA CON ÉXITO: 100% SUCCESS")
