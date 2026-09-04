from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine

supabase = get_supabase()
sc = supabase.table('commercial_forecasts').select('*').eq('id', 'cd9d3da8-5950-4722-8d9d-5fcf66059992').single().execute().data

raw_lines = sc.get('projection_lines') or []
sim_req = ForecastRequest(
    start_date=sc.get('start_date') or '2027-01-01',
    end_date=sc.get('end_date') or '2027-12-31',
    projection_lines=[ProjectionLine(**line) for line in raw_lines]
)
sim_res = run_forecast_simulation(sim_req)
agg = sim_res.get('aggregated_data', {})

print("DEMURRAGE POR MES EN AGGREGATED_DATA:")
months_keys = sorted(list(next(iter(next(iter(next(iter(agg.values())).values())).values())).keys()))
print("Meses:", months_keys)

tot_dem_by_month = {m: 0 for m in months_keys}
for c, routes in agg.items():
    for r, vessels in routes.items():
        for v, months in vessels.items():
            for m_k, m_val in months.items():
                d_val = float(m_val.get('demurrage_revenue', 0) or m_val.get('demurrage_income', 0) or (float(m_val.get('demurrage_revenue_unit', 0) or 0) * float(m_val.get('freq', 0) or 0)))
                tot_dem_by_month[m_k] += d_val

print("\nTotales Demurrage por mes:")
for m, v in tot_dem_by_month.items():
    print(f"  {m}: ${v:,.2f}")
print("TOTAL ANUAL DEMURRAGE:", f"${sum(tot_dem_by_month.values()):,.2f}")
