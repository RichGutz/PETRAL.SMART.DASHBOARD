import sys
sys.path.append(r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine')

from backend.models.forecast_models import PortCostStaticUpdateItem
from backend.api.routers.forecast import save_port_costs_static, get_port_costs_static, get_ports, get_vessels

# 1. Fetch ports and vessels and current static costs
ports = get_ports()
vessels = get_vessels()
static_costs = get_port_costs_static()

print(f"Total ports: {len(ports)}")
print(f"Total vessels: {len(vessels)}")
print(f"Total static cost rows: {len(static_costs)}")

# Build payload exactly like handleSaveGlobal in frontend
def normalize_vessel_key(vid):
    if not vid: return ''
    import re
    return re.sub(r'[\s_-]+', '', re.sub(r'^B/?T\s*', '', vid.upper()))

costs_state = {}
for row in static_costs:
    port_id = (row.get('port_id') or '').upper()
    raw_vessel_id = (row.get('vessel_id') or '').upper()
    v_key = normalize_vessel_key(raw_vessel_id)
    op = (row.get('operation_type') or 'CARGA').upper()
    sub_op = row.get('sub_operation_type') or 'MAIN'
    
    if port_id not in costs_state: costs_state[port_id] = {}
    if v_key not in costs_state[port_id]:
        costs_state[port_id][v_key] = {
            'CARGA': {'MAIN': 0, 'loading_master': 0, 'other': 0},
            'DESCARGA': {'MAIN': 0, 'loading_master': 0, 'other': 0},
            'raw_vessel_id': raw_vessel_id
        }
    if op in costs_state[port_id][v_key]:
        costs_state[port_id][v_key][op][sub_op] = float(row.get('cost') or 0)

# Simulate user modifying MARCONA DESCARGA MAIN to 12500.00
marcona_key = 'MARCONA'
if marcona_key not in costs_state: costs_state[marcona_key] = {}
for v in vessels:
    v_id = v.get('vessel_id')
    v_key = normalize_vessel_key(v_id)
    if v_key not in costs_state[marcona_key]:
        costs_state[marcona_key][v_key] = {
            'CARGA': {'MAIN': 0, 'loading_master': 0, 'other': 0},
            'DESCARGA': {'MAIN': 0, 'loading_master': 0, 'other': 0},
            'raw_vessel_id': v_id
        }
    costs_state[marcona_key][v_key]['DESCARGA']['MAIN'] = 12500.00

payload = []
for port_id, port_obj in costs_state.items():
    if not port_id: continue
    for v_key, cost_data in port_obj.items():
        if not v_key: continue
        target_vessel_id = cost_data.get('raw_vessel_id') or v_key
        sub_ops = ['MAIN', 'loading_master', 'other']
        for sub_op in sub_ops:
            carga_val = cost_data.get('CARGA', {}).get(sub_op, 0)
            descarga_val = cost_data.get('DESCARGA', {}).get(sub_op, 0)
            
            payload.append(PortCostStaticUpdateItem(
                client_id='PETRAL',
                port_id=port_id,
                operation_type='CARGA',
                vessel_id=target_vessel_id,
                sub_operation_type=sub_op,
                cost=carga_val,
                updated_by='USUARIO'
            ))
            payload.append(PortCostStaticUpdateItem(
                client_id='PETRAL',
                port_id=port_id,
                operation_type='DESCARGA',
                vessel_id=target_vessel_id,
                sub_operation_type=sub_op,
                cost=descarga_val,
                updated_by='USUARIO'
            ))

print(f"Total payload items to save: {len(payload)}")
try:
    res = save_port_costs_static(payload)
    print("GLOBAL SAVE SUCCESS:", res)
except Exception as e:
    print("GLOBAL SAVE ERROR:", type(e), e)
