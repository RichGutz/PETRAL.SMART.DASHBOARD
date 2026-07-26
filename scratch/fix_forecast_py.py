import os

filepath = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend\api\routers\forecast.py'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

bad_block = """from backend.models.forecast_models import PortCostStaticUpdateItem

@router.get('/port_costs_static')
def get_port_costs_static():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table('sources_sinks').select('*').execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))"""

good_block = """from backend.models.forecast_models import PortCostStaticUpdateItem

@router.get('/port_costs_static')
def get_port_costs_static():
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        res = sb.table('port_cost_static').select('*').execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/port_costs_static')
def save_port_costs_static(items: List[PortCostStaticUpdateItem]):
    try:
        from backend.database import get_supabase
        sb = get_supabase()
        from datetime import datetime
        now_str = datetime.utcnow().isoformat()
        payload = []
        for item in items:
            payload.append({
                'port_id': item.port_id,
                'terminal_id': getattr(item, 'terminal_id', None) or 'GENERAL',
                'operation_type': item.operation_type,
                'vessel_id': item.vessel_id,
                'cost': item.cost,
                'sub_operation_type': item.sub_operation_type or 'MAIN',
                'updated_at': now_str,
                'updated_by': item.updated_by or 'USUARIO'
            })
        sb.table('port_cost_static').upsert(payload).execute()
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))"""

if bad_block in content:
    content = content.replace(bad_block, good_block)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("FIX SUCCESS: Replaced bad_block with good_block in forecast.py")
else:
    print("bad_block not found exact match.")
