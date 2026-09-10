import requests
import json

res = requests.get('https://forecast.geeksoft.tech/api/v1/forecast/spot/list')
spots = res.json()
spcc_spots = [s for s in spots if 'SPCC' in str(s).upper()]
print(f'Total spots: {len(spots)}')
print(f'Total SPCC spots: {len(spcc_spots)}')
for s in spcc_spots:
    name = s.get("name")
    cid = s.get("client_id")
    desc = s.get("description")
    sid = s.get("id")
    print(f"\nID: {sid} | Name: {name} | Client: {cid} | Desc: {desc}")
    legs = s.get('legs_data') or {}
    print('  legs_data keys:', list(legs.keys()))
    tramos = legs.get('tramos', [])
    print(f'  tramos ({len(tramos)}):')
    for t in tramos:
        print('    tramo:', t.get('origin_port_id'), '->', t.get('destination_port_id'), 'type:', t.get('type'), 'qty:', t.get('quantity'), 'freight:', t.get('freight_rate'), 'action:', t.get('destination_action'))
    fin = legs.get('financial_summary', {})
    print('  fin_summary:', fin)
