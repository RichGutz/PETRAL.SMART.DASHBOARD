import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine

req = ForecastRequest(
    start_date="2026-07-01",
    end_date="2026-12-31",
    port_cost_mode="static",
    projection_lines=[
        ProjectionLine(
            month_index="2026-07",
            client_id="NEXA",
            origin_port_id="CALLAO",
            destination_port_id="MARCONA",
            vessel_id="TABLONES",
            quantity=13500.0,
            monthly_frequency=1.0,
            custom_tariff=34.74,
            quote_id="NEXA.ILO.CALLAO.MARCONA.ILO.2026 (IZ)"
        )
    ]
)

res = run_forecast_simulation(req)
agg = res.get("aggregated_data", {})
metrics = agg["NEXA"]["CALLAO-MARCONA"]["TABLONES"]["2026-07"]

print("=== METRICS DUMP ===")
for k, v in metrics.items():
    print(f"{k}: {v}")
