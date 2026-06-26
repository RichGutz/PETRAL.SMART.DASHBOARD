from backend.models.forecast_models import ForecastRequest, ProjectionLine
from backend.services.forecast_service import run_forecast_simulation

req = ForecastRequest(
    start_date='2026-07-01',
    end_date='2026-07-31',
    projection_lines=[
        ProjectionLine(month_index='2026-07', client_id='SPCC', origin_port_id='ILO', destination_port_id='MATARANI',   vessel_id='TABLONES', quantity=13500, monthly_frequency=1),
        ProjectionLine(month_index='2026-07', client_id='SPCC', origin_port_id='ILO', destination_port_id='MARCONA',    vessel_id='TABLONES', quantity=13500, monthly_frequency=1),
        ProjectionLine(month_index='2026-07', client_id='SPCC', origin_port_id='ILO', destination_port_id='MEJILLONES', vessel_id='TABLONES', quantity=13500, monthly_frequency=1),
    ]
)
res = run_forecast_simulation(req)
print('=== RESULTADO DEL MOTOR ===')
for route, vessels in res['aggregated_data']['SPCC'].items():
    for v, months in vessels.items():
        d = months['2026-07']
        flete = d['flete_unit']
        ifo = d['raw_inputs']['bunker_price_ifo']
        voy = d['voyage_result']
        print(f'{route} | Flete: {flete} USD/MT | IFO: {ifo} | Resultado: {voy}')
