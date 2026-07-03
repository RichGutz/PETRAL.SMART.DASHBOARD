import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def test():
    testLines = [
        ProjectionLine(client_id='SPCC', origin_port_id='ILO', destination_port_id='MATARANI', vessel_id='TABLONES', month_index='2026-07', quantity=13500, monthly_frequency=1)
    ]
    request = ForecastRequest(
        projection_lines=testLines,
        start_date="2026-07-01",
        end_date="2026-07-31"
    )
    res = run_forecast_simulation(request)
    scenario_res = res["aggregated_data"]["SPCC"]["ILO-MATARANI"]["TABLONES"]["2026-07"]
    print("KEYS in raw_inputs:")
    print(scenario_res["raw_inputs"].keys())
    print("\nVALUES in raw_inputs:")
    for k, v in scenario_res["raw_inputs"].items():
        if "agency" in k or "port" in k or "cost" in k:
            print(f"  {k}: {v}")
            
    print("\nKEYS in monthly_result:")
    print(scenario_res.keys())
    print(f"  total_port_costs_unit: {scenario_res.get('total_port_costs_unit')}")
    print(f"  port_costs_breakdown: {scenario_res.get('port_costs_breakdown')}")

if __name__ == "__main__":
    test()
