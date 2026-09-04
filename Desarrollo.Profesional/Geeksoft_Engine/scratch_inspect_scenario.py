from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine

supabase = get_supabase()
sc = supabase.table('commercial_forecasts').select('*').eq('id', 'cd9d3da8-5950-4722-8d9d-5fcf66059992').single().execute().data

print('Escenario:', sc['name'])
raw_lines = sc.get('projection_lines') or []
print('Numero de lineas:', len(raw_lines))

for i, l in enumerate(raw_lines[:6]):
    print(f"Linea {i+1}: client={l.get('client_id')} | route={l.get('route_id')} | vessel={l.get('vessel_id')} | quote_id={l.get('quote_id')} | custom_tariff={l.get('custom_tariff')}")

sim_req = ForecastRequest(
    start_date=sc.get('start_date') or '2027-01-01',
    end_date=sc.get('end_date') or '2027-12-31',
    projection_lines=[ProjectionLine(**line) for line in raw_lines]
)
sim_res = run_forecast_simulation(sim_req)
agg = sim_res.get('aggregated_data', {})

print('\n--- REPORTE DETALLADO DE AGGREGATED_DATA ---')
for client, routes in agg.items():
    for r_name, vessels in routes.items():
        for v_name, months in vessels.items():
            for m_k, m_val in months.items():
                if m_val.get('freq', 0) > 0:
                    print(f"{client} | {r_name} | {v_name} | {m_k}: freq={m_val.get('freq')} | vr={m_val.get('voyage_result')} | net_rev={m_val.get('net_revenue')} | hire={m_val.get('charter_hire')} | bunker={m_val.get('bunker_cost')} | ports={m_val.get('port_costs')}")
                    break
