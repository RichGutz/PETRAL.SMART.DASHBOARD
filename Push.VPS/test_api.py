import requests, json
payload = {'start_date': '2026-07-20', 'end_date': '2026-12-31', 'bunker_price_ifo': 600, 'bunker_price_mdo': 800, 'contracts': {}, 'active_vessels': ['TABLONES'], 'lines': [{'id': 'test-1', 'vessel_id': 'TABLONES', 'client_id': 'CLI1', 'origin_port_id': 'ILO', 'destination_port_id': 'MATARANI', 'monthly_frequency': 1, 'quantity': 10000, 'forecast_freight_rate': 20, 'forecast_bunker_price_ifo': 600, 'forecast_bunker_price_mdo': 800}]}
r = requests.post('https://forecast.geeksoft.tech/api/v1/forecast/run', json=payload)
print(json.dumps(r.json(), indent=2)[:500])
