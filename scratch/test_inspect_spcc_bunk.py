import requests

res = requests.get('https://forecast.geeksoft.tech/api/v1/forecast/spot/list')
spots = res.json()
spcc_bunk = [s for s in spots if 'SPCC' in str(s).upper() and ('BUNKER' in str(s).upper() or 'CALLAO' in str(s).upper())]
print(f'Total SPCC bunk/callao: {len(spcc_bunk)}')
for s in spcc_bunk:
    print(f"\nID: {s.get('id')} | Name: {s.get('name')} | Client: {s.get('client_id')} | Desc: {s.get('description')}")
    legs = s.get('legs_data') or {}
    print('  legs_data keys:', list(legs.keys()))
    tramos = legs.get('tramos', [])
    print(f'  tramos ({len(tramos)}):')
    for t in tramos:
        print('    tramo:', t.get('origin_port_id'), '->', t.get('destination_port_id'), 'type:', t.get('type'), 'qty:', t.get('quantity'), 'freight:', t.get('freight_rate'), 'action:', t.get('destination_action'))
    puertos = legs.get('puertosConfig', [])
    print(f'  puertosConfig ({len(puertos)}):')
    for p in puertos:
        print('    puerto:', p.get('port_id'), 'action:', p.get('action'), 'operation:', p.get('operation'))
