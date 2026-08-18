from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine

req = ForecastRequest(
    start_date='2026-08',
    end_date='2026-08',
    port_cost_mode='estimated',
    projection_lines=[ProjectionLine(
        client_id='NEXA',
        route_id='NEXA.ILO.CALLAO.MATARANI.ILO.2026 (IZ)',
        vessel_id='TABLONES',
        month_index='2026-08',
        monthly_frequency=1.0,
        quantity=13500.0,
        freight_rate=30.0,
        origin_port_id='CALLAO',
        destination_port_id='MATARANI'
    )]
)

res = run_forecast_simulation(req)
client_data = res['aggregated_data']['NEXA']
route_k = list(client_data.keys())[0]
vessel_k = list(client_data[route_k].keys())[0]
d = client_data[route_k][vessel_k]['2026-08']

keys_of_interest = [
    'gross_income','freight_revenue','freight_revenue_unit',
    'dockage_revenue','dockage_revenue_unit',
    'refacturacion_muellaje','refacturacion_muellaje_unit',
    'gross_revenue_total','net_income','voyage_result','pl_vs_required'
]
print("=== SMOKING GUN FIELDS ===")
for k in keys_of_interest:
    v = d.get(k, "--- KEY MISSING ---")
    print("  " + k + ": " + str(v))
