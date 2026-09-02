import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def test_qc():
    # 1. Proyección SIN custom_tariff (debe tomar contrato SPCC -> $23.10)
    req_base = ForecastRequest(
        start_date="2026-07-01",
        end_date="2026-07-31",
        port_cost_mode="static",
        projection_lines=[
            ProjectionLine(
                month_index="2026-07",
                client_id="SPCC",
                origin_port_id="ILO",
                destination_port_id="CALLAO",
                vessel_id="TABLONES",
                monthly_frequency=1.0,
                quantity=13500.0
            )
        ]
    )
    
    # 2. Proyección CON custom_tariff = 28.50 (debe SOBRESCRIBIR contrato -> $28.50)
    req_override = ForecastRequest(
        start_date="2026-07-01",
        end_date="2026-07-31",
        port_cost_mode="static",
        projection_lines=[
            ProjectionLine(
                month_index="2026-07",
                client_id="SPCC",
                origin_port_id="ILO",
                destination_port_id="CALLAO",
                vessel_id="TABLONES",
                monthly_frequency=1.0,
                quantity=13500.0,
                custom_tariff=28.50
            )
        ]
    )
    
    res_base = run_forecast_simulation(req_base)
    res_override = run_forecast_simulation(req_override)
    
    # Extraer métricas de SPCC
    spcc_base = res_base["aggregated_data"]["SPCC"]["ILO-CALLAO"]["TABLONES"]["2026-07"]
    spcc_over = res_override["aggregated_data"]["SPCC"]["ILO-CALLAO"]["TABLONES"]["2026-07"]
    
    flete_base = spcc_base.get("flete_unit")
    gross_base = spcc_base.get("gross_income")
    
    flete_over = spcc_over.get("flete_unit")
    gross_over = spcc_over.get("gross_income")
    
    print("=== CONTROL DE CALIDAD QC: SOBRESCRITURA DE TARIFA EN CALIENTE ===")
    print(f"1. Base Contrato:  Flete $/MT = {flete_base} | Gross Revenue = ${gross_base:,.2f}")
    print(f"2. Edición Custom: Flete $/MT = {flete_over} | Gross Revenue = ${gross_over:,.2f}")
    
    assert flete_over == 28.50, f"Error: flete_over esperado 28.50 pero dio {flete_over}"
    assert gross_over == 28.50 * 13500, f"Error: gross_over esperado {28.50 * 13500} pero dio {gross_over}"
    print("🎯 AUDITORÍA APROBADA: custom_tariff sobrescribe exitosamente el contrato y recalcula los ingresos en caliente!")

if __name__ == "__main__":
    test_qc()
