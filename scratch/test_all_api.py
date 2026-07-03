import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def test():
    testLines = [
        ProjectionLine(client_id='SPCC', origin_port_id='ILO', destination_port_id='MATARANI', vessel_id='TABLONES', month_index='2026-07', quantity=13500, monthly_frequency=1),
        ProjectionLine(client_id='SPCC', origin_port_id='ILO', destination_port_id='MATARANI', vessel_id='MOQUEGUA', month_index='2026-07', quantity=13500, monthly_frequency=1),
        ProjectionLine(client_id='SPCC', origin_port_id='ILO', destination_port_id='MATARANI', vessel_id='CONCON_TRADER', month_index='2026-07', quantity=19000, monthly_frequency=1)
    ]
    request = ForecastRequest(
        projection_lines=testLines,
        start_date="2026-07-01",
        end_date="2026-07-31"
    )
    res = run_forecast_simulation(request)
    
    for vessel in ["TABLONES", "MOQUEGUA", "CONCON_TRADER"]:
        scenario_res = res["aggregated_data"]["SPCC"]["ILO-MATARANI"][vessel]["2026-07"]
        print(f"\nBuque: {vessel}")
        raw = scenario_res["raw_inputs"]
        print(f"  agency_costs_origin in raw_inputs: {raw.get('agency_costs_origin')}")
        print(f"  agency_costs_destination in raw_inputs: {raw.get('agency_costs_destination')}")
        print(f"  total_port_costs_unit: {scenario_res.get('total_port_costs_unit')}")

if __name__ == "__main__":
    test()
