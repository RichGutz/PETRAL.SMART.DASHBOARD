import sys
sys.path.append(r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine')

from backend.database import get_supabase

sb = get_supabase()

test_payload = [
    {
        'port_id': 'CALLAO',
        'terminal_id': 'GENERAL',
        'operation_type': 'CARGA',
        'vessel_id': 'MOQUEGUA',
        'sub_operation_type': 'MAIN',
        'cost': 15000.00,
        'updated_by': 'TEST_FIX'
    }
]

print("Attempting Supabase upsert payload with fixed schema...")
try:
    res = sb.table('port_cost_static').upsert(test_payload).execute()
    print("SUCCESS:", res.data)
except Exception as e:
    print("ERROR CAUGHT:", type(e), e)
