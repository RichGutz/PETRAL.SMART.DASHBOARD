import os, sys
engine_dir = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine"
if engine_dir not in sys.path:
    sys.path.insert(0, engine_dir)

import json
from backend.models.forecast_models import ForecastRequest, ProjectionLine
from backend.services.forecast_service import run_forecast_simulation

req = ForecastRequest(
    start_date="2027-01-01",
    end_date="2027-12-31",
    projection_lines=[
        ProjectionLine(
            month_index="2027-01",
            client_id="NEXA",
            origin_port_id="CALLAO",
            destination_port_id="MATARANI",
            vessel_id="TABLONES",
            quantity=13500,
            monthly_frequency=1,
            quote_id="NEXA.ILO.CALLAO.MARCONA.MATARANI.ILO.2026 MARCOBRE Y QUILLA"
        )
    ]
)

res = run_forecast_simulation(req)
print("=" * 80)
print("KEYS IN AGGREGATED DATA:")
agg = res.get("aggregated_data", {})
print("Clients:", list(agg.keys()))
for c, routes in agg.items():
    for r, vessels in routes.items():
        for v, months_data in vessels.items():
            print(f"Client={c} | Route={r} | Vessel={v}")
            for mk, mv in months_data.items():
                print(f"  Month [{mk}]:")
                print(json.dumps(mv, indent=4))


