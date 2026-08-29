import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine
import json

line = ProjectionLine(
    client_id="SPCC",
    origin_port_id="ILO",
    destination_port_id="MARCONA",
    vessel_id="MOQUEGUA",
    month_index="2027-01",
    quantity=13500,
    monthly_frequency=1,
    custom_tariff=23.1,
    quote_id="SPCC.ILO.MARCONA.CALLAO.ILO.2026 DM MOQUEGUA"
)

req = ForecastRequest(
    start_date="2027-01-01",
    end_date="2027-01-31",
    projection_lines=[line]
)

res = run_forecast_simulation(req)
m_data = res.get("aggregated_data", {}).get("SPCC", {}).get("ILO-MARCONA", {}).get("MOQUEGUA", {}).get("2027-01", {})

print("=== RESULTADOS DE SIMULACION EN MATRIZ FINANCIERA ===")
print("Gross Income:", m_data.get("gross_income"))
print("Freight Revenue:", m_data.get("freight_revenue"))
print("Dockage Revenue:", m_data.get("dockage_revenue"))
print("Demurrage Revenue:", m_data.get("demurrage_revenue"))
print("Demurrage Days:", m_data.get("demurrage_days"))
print("Demurrage Days Unit:", m_data.get("demurrage_days_unit"))
print("Sea Days:", m_data.get("sea_days_unit"))
print("Port Days:", m_data.get("port_days_unit"))
print("Total Duration:", m_data.get("total_duration_unit"))
print("Voyage Result / PnL:", m_data.get("voyage_result"))
print("TCE Real:", m_data.get("tce_real"))
