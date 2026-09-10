import sys
import os
import json

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ENGINE_DIR = os.path.join(CURRENT_DIR, "..", "Desarrollo.Profesional", "Geeksoft_Engine")
sys.path.append(ENGINE_DIR)

from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation, get_cached_masters, clear_forecast_cache
from backend.models.forecast_models import ForecastRequest, ProjectionLine

clear_forecast_cache()

line = ProjectionLine(
    month_index="2026-07",
    client_id="NEXA",
    origin_port_id="CALLAO",
    destination_port_id="MARCONA-MATARANI",
    vessel_id="TABLONES",
    quantity=16500,
    monthly_frequency=1,
    custom_tariff=32.11,
    quote_id="NEXA.ILO.CALLAO.MARCONA.MATARANI.ILO.2026 MARCOBRE Y QUILLA"
)

req = ForecastRequest(
    projection_lines=[line],
    start_date="2026-07-01",
    end_date="2026-12-31",
    port_cost_mode="DETAILED"
)

res = run_forecast_simulation(req)
m = res["aggregated_data"]["NEXA"]["CALLAO-MARCONA-MATARANI"]["TABLONES"]["2026-07"]

print("=== DIAGNOSIS RESULT ===")
for k in ["gross_income", "freight_revenue", "dockage_revenue", "total_port_costs", "total_bunker_costs", "tce_cost_total_unit", "voyage_result", "pl_vs_required", "carga_unit", "flete_unit"]:
    print(f"{k}: {m.get(k)}")
