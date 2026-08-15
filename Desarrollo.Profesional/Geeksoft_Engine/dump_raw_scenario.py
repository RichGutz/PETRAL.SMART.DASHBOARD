import os
import sys
import json

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest

sb = get_supabase()
res = sb.table("commercial_forecasts").select("*").eq("name", "PRIMER.MODELO.MODULAR").execute()

if not res.data:
    print("❌ No se encontró PRIMER.MODELO.MODULAR por nombre exacto. Obteniendo último registro...")
    res = sb.table("commercial_forecasts").select("*").order("created_at", desc=True).limit(1).execute()

scenario = res.data[0]
print(f"📦 Escenario cargado: {scenario.get('name')} (ID: {scenario.get('id')})")

lines = scenario.get("projection_lines") or []
req = ForecastRequest(
    start_date=scenario.get("start_date") or "2026-07-01",
    end_date=scenario.get("end_date") or "2026-12-31",
    projection_lines=lines,
    port_cost_mode="static"
)

sim_result = run_forecast_simulation(req)

dump_data = {
    "scenario_metadata": {
        "id": scenario.get("id"),
        "name": scenario.get("name"),
        "start_date": scenario.get("start_date"),
        "end_date": scenario.get("end_date"),
        "user_id": scenario.get("user_id"),
        "projection_lines_count": len(lines)
    },
    "first_3_projection_lines": lines[:3],
    "simulation_output": sim_result
}

out_path = os.path.join(os.path.dirname(__file__), "raw_scenario_dump.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(dump_data, f, indent=2, ensure_ascii=False)

print(f"✅ Raw dump guardado en: {out_path} ({os.path.getsize(out_path):,} bytes)")
