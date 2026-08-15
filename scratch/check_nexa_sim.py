import os
import sys

# Add project root and backend to python path
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.models.forecast_models import ForecastRequest, ProjectionLine
from backend.services.forecast_service import run_forecast_simulation

req = ForecastRequest(
    start_date="2026-07-01",
    end_date="2026-07-31",
    projection_lines=[
        ProjectionLine(
            client_id="NEXA",
            origin_port_id="CALLAO",
            destination_port_id="MATARANI",
            vessel_id="TABLONES",
            month_index="2026-07",
            quantity=13500,
            monthly_frequency=1
        )
    ],
    port_cost_mode="static"
)

try:
    res = run_forecast_simulation(req)
    print("KEYS in aggregated_data:")
    print(res.get("aggregated_data", {}).keys())
    nexa = res.get("aggregated_data", {}).get("NEXA", {})
    print("NEXA routes:", nexa.keys())
    for r_key, vessels in nexa.items():
        print(f"  Route: {r_key}")
        for v_name, months in vessels.items():
            print(f"    Vessel: {v_name}")
            for m_key, m_data in months.items():
                print(f"      Month {m_key}:")
                print("        voyage_result (P&L):", m_data.get("voyage_result"))
                print("        gross_revenue_total:", m_data.get("gross_revenue_total"))
                print("        total_port_costs_unit:", m_data.get("total_port_costs_unit"))
                print("        total_bunker_costs_unit:", m_data.get("total_bunker_costs_unit"))
                print("        hire_cost:", m_data.get("hire_cost"))
                print("        sea_days:", m_data.get("sea_days"), "port_days:", m_data.get("port_days"), "total_days:", m_data.get("total_days"))
                print("        refacturacion_muellaje:", m_data.get("refacturacion_muellaje"))
except Exception as e:
    import traceback
    traceback.print_exc()
