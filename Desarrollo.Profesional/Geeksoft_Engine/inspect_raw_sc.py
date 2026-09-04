import os, sys, json
from dotenv import load_dotenv

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(CURRENT_DIR)
load_dotenv(os.path.join(CURRENT_DIR, '.env'))

from backend.services.forecast_service import run_forecast_simulation, get_supabase
from backend.models.forecast_models import ForecastRequest, ProjectionLine

supabase = get_supabase()
res = supabase.table('commercial_forecasts').select('*').execute()
for sc in res.data:
    name = sc.get('name', '')
    if any(k in name.upper() for k in ['2027 PB', 'PROPUESTA INCREMENTO']):
        print("NAME:", name)
        print("PARAMS:", sc.get('parameters'))
        print("LINES COUNT:", len(sc.get('projection_lines', [])))
        if sc.get('projection_lines'):
            print("SAMPLE LINE:", sc.get('projection_lines')[0])
