import sys
import os
from dotenv import load_dotenv

load_dotenv("Desarrollo.Profesional/Geeksoft_Engine/.env")
sys.path.insert(0, os.path.abspath("Desarrollo.Profesional/Geeksoft_Engine"))

from backend.database import get_supabase
sb = get_supabase()
sb.table('port_cost_static').delete().match({'port_id': 'CALLAO', 'operation_type': 'BUNKERING', 'updated_by': 'QC_TEST'}).execute()
print("QC_TEST row cleaned up successfully.")
