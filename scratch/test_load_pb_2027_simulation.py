import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast import ForecastSimulationRequest, ProjectionLine
import json

sb = get_supabase()
res = sb.table("commercial_forecasts").select("*").eq("id", "57f506fd-6da4-44c0-92c8-2b9d5644fb6e").execute()
row = res.data[0]
raw_lines = row.get("projection_lines") or []

# 1. Simulación tal como está en la BD (respetando 0)
clean_lines_exact = []
for l in raw_lines:
    freq = float(l.get("monthly_frequency", 0)) if l.get("monthly_frequency") is not None else 0.0
    clean_lines_exact.append(ProjectionLine(
        client_id=l["client_id"],
        origin_port_id=l["origin_port_id"],
        destination_port_id=l["destination_port_id"],
        vessel_id=l["vessel_id"],
        month_index=l["month_index"],
        quantity=float(l.get("quantity", 13500)),
        monthly_frequency=freq,
        custom_tariff=float(l["custom_tariff"]) if l.get("custom_tariff") is not None else None,
        quote_id=l.get("quote_id")
    ))

req_exact = ForecastSimulationRequest(
    start_date="2027-01-01",
    end_date="2027-12-31",
    projection_lines=clean_lines_exact
)

sim_exact = run_forecast_simulation(req_exact)
agg_exact = sim_exact.aggregated_data

print("=== RESULTADO SIMULACION CON FRECUENCIA REAL DE BD ===")
spcc_ilo_marcona = agg_exact.get("SPCC", {}).get("ILO-MARCONA", {}).get("MOQUEGUA", {})
total_trips = 0
for m in sorted(spcc_ilo_marcona.keys()):
    mData = spcc_ilo_marcona[m]
    f = mData.get("freq", 0)
    rev = mData.get("gross_income", 0)
    total_trips += f
    print(f"  Mes {m}: freq={f} | Gross Revenue=${rev:,.2f}")

print(f"\nTotal Viajes SPCC ILO-MARCONA MOQUEGUA: {total_trips}")
print(f"Total Viajes Global Escenario: {sim_exact.total_trips}")
