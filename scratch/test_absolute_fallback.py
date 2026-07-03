import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def test():
    testLines = [
        # CONCON_TRADER de ILO a CALLAO (descarga)
        ProjectionLine(client_id='SPCC', origin_port_id='ILO', destination_port_id='CALLAO', vessel_id='CONCON_TRADER', month_index='2026-07', quantity=19000, monthly_frequency=1)
    ]
    request = ForecastRequest(
        projection_lines=testLines,
        start_date="2026-07-01",
        end_date="2026-07-31"
    )
    res = run_forecast_simulation(request)
    scenario_res = res["aggregated_data"]["SPCC"]["ILO-CALLAO"]["CONCON_TRADER"]["2026-07"]
    
    print("=== TEST FALLBACK ABSOLUTO: CONCON_TRADER EN CALLAO ===")
    print(f"Costo Origen (ILO - CONCON_TRADER específico): ${scenario_res['raw_inputs'].get('agency_costs_origin'):,.2f} USD")
    print(f"Costo Destino (CALLAO - Fallback DEFAULT): ${scenario_res['raw_inputs'].get('agency_costs_destination'):,.2f} USD")
    print(f"Desglose de Origen (ILO): {scenario_res.get('port_costs_breakdown', {}).get('origin')}")
    print(f"Desglose de Destino (CALLAO): {scenario_res.get('port_costs_breakdown', {}).get('destination')}")
    print(f"Costo Portuario Unitario total: ${scenario_res.get('total_port_costs_unit'):,.2f} USD")

if __name__ == "__main__":
    test()
