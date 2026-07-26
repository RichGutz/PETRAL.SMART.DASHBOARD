import sys
sys.path.append(r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine')

from backend.models.forecast_models import PortCostStaticUpdateItem
from backend.api.routers.forecast import save_port_costs_static, get_port_costs_static

# Simulate payload sent by frontend for MARCONA
test_items = [
    PortCostStaticUpdateItem(
        client_id='PETRAL',
        port_id='MARCONA',
        operation_type='DESCARGA',
        vessel_id='MOQUEGUA',
        cost=12000.0,
        sub_operation_type='MAIN',
        updated_by='USUARIO'
    ),
    PortCostStaticUpdateItem(
        client_id='PETRAL',
        port_id='MARCONA',
        operation_type='DESCARGA',
        vessel_id='TABLONES',
        cost=13000.0,
        sub_operation_type='MAIN',
        updated_by='USUARIO'
    )
]

print("Attempting save_port_costs_static for MARCONA...")
try:
    res = save_port_costs_static(test_items)
    print("SUCCESS:", res)
except Exception as e:
    print("ERROR:", type(e), e)
