import sys
import os
import json

# Inyectar el path del motor para evitar problemas de importación
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.models.forecast_models import ForecastRequest, ProjectionLine
from backend.services.forecast_service import run_forecast_simulation, run_forecast_simulation_universal

print("=== INICIANDO TEST LOCAL DE SIMULACIÓN DE MEJILLONES ===")

# Crear payload de prueba para el estimador
test_lines = [
    ProjectionLine(
        month_index="2026-07",
        client_id="SPCC",
        origin_port_id="ILO",
        destination_port_id="MEJILLONES",
        vessel_id="TABLONES",
        quantity=13200.0,
        monthly_frequency=1.0
    ),
    ProjectionLine(
        month_index="2026-07",
        client_id="SPCC",
        origin_port_id="ILO",
        destination_port_id="MEJILLONES",
        vessel_id="MOQUEGUA",
        quantity=13200.0,
        monthly_frequency=1.0
    )
]

# Probar primero en modo static (Plano)
print("\n--- PROBANDO MODO 'static' (Plano/Consolidado) ---")
req_static = ForecastRequest(
    start_date="2026-07-01",
    end_date="2026-07-31",
    projection_lines=test_lines,
    port_cost_mode="static"
)

try:
    res_static = run_forecast_simulation(req_static)
    data = res_static.get("aggregated_data", {}).get("SPCC", {}).get("ILO-MEJILLONES", {})
    for vessel, months in data.items():
        for month, m_res in months.items():
            print(f"Buque: {vessel} | Modo: static")
            print(f"  Total Port Costs: {m_res.get('total_port_costs_unit')}")
            print(f"  Breakdowns: {json.dumps(m_res.get('port_costs_breakdown'), indent=2)}")
except Exception as e:
    print(f"Error en simulación static: {e}")

# Probar en modo matrix (Detallado)
print("\n--- PROBANDO MODO 'matrix' (Detallado/Matriz) ---")
req_matrix = ForecastRequest(
    start_date="2026-07-01",
    end_date="2026-07-31",
    projection_lines=test_lines,
    port_cost_mode="matrix"
)

try:
    res_matrix = run_forecast_simulation(req_matrix)
    data = res_matrix.get("aggregated_data", {}).get("SPCC", {}).get("ILO-MEJILLONES", {})
    for vessel, months in data.items():
        for month, m_res in months.items():
            print(f"Buque: {vessel} | Modo: matrix")
            print(f"  Total Port Costs: {m_res.get('total_port_costs_unit')}")
            print(f"  Breakdowns: {json.dumps(m_res.get('port_costs_breakdown'), indent=2)}")
except Exception as e:
    print(f"Error en simulación matrix: {e}")
