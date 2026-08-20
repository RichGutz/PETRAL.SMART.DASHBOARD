import sys
import os

# Add Geeksoft_Engine to python path
sys.path.insert(0, os.path.abspath("Desarrollo.Profesional/Geeksoft_Engine"))

try:
    from backend.database import get_supabase
    sb = get_supabase()
    
    # 1. Fetch current records
    res = sb.table('port_cost_static').select('*').limit(5).execute()
    print(f"Supabase port_cost_static test query success! Count: {len(res.data)}")
    if res.data:
        print("Sample row:", res.data[0])

    # 2. Test upsert with operation_type = 'BUNKERING'
    test_item = {
        'port_id': 'CALLAO',
        'terminal_id': 'GENERAL',
        'operation_type': 'BUNKERING',
        'vessel_id': 'MOQUEGUA',
        'sub_operation_type': 'bunkering_survey',
        'cost': 1250.00,
        'updated_by': 'QC_TEST'
    }
    
    upsert_res = sb.table('port_cost_static').upsert([test_item]).execute()
    print("Upsert BUNKERING result:", upsert_res.data)
    
    # 3. Read it back
    read_res = sb.table('port_cost_static').select('*').eq('port_id', 'CALLAO').eq('operation_type', 'BUNKERING').execute()
    print(f"Read back BUNKERING rows in CALLAO: {len(read_res.data)}")
    for r in read_res.data:
        print(f" -> {r.get('vessel_id')} | {r.get('operation_type')} | {r.get('sub_operation_type')}: ${r.get('cost')}")

except Exception as e:
    print(f"Error during Supabase test: {e}")
