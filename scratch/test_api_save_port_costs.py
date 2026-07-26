import sys
sys.path.append(r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine')

from backend.models.forecast_models import PortCostStaticUpdateItem
from backend.api.routers.forecast import save_port_costs_static, get_port_costs_static

test_items = [
    PortCostStaticUpdateItem(
        client_id='PETRAL',
        port_id='CALLAO',
        operation_type='CARGA',
        vessel_id='MOQUEGUA',
        cost=15500.0,
        sub_operation_type='MAIN',
        updated_by='USUARIO_TEST'
    ),
    PortCostStaticUpdateItem(
        client_id='PETRAL',
        port_id='CALLAO',
        operation_type='CARGA',
        vessel_id='TABLONES',
        cost=16500.0,
        sub_operation_type='MAIN',
        updated_by='USUARIO_TEST'
    ),
    PortCostStaticUpdateItem(
        client_id='PETRAL',
        port_id='CALLAO',
        operation_type='CARGA',
        vessel_id='HUEMUL',
        cost=17500.0,
        sub_operation_type='MAIN',
        updated_by='USUARIO_TEST'
    ),
    PortCostStaticUpdateItem(
        client_id='PETRAL',
        port_id='CALLAO',
        operation_type='CARGA',
        vessel_id='CONCON_TRADER',
        cost=18500.0,
        sub_operation_type='MAIN',
        updated_by='USUARIO_TEST'
    )
]

print("Calling save_port_costs_static()...")
res = save_port_costs_static(test_items)
print("SAVE RESPONSE:", res)

print("\nQuerying get_port_costs_static() for CALLAO...")
all_data = get_port_costs_static()
callao_rows = [r for r in all_data if r.get('port_id') == 'CALLAO']
print(f"Total Callao rows in DB: {len(callao_rows)}")
for row in callao_rows:
    print("  ", row)
