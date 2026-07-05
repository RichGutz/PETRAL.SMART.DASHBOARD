import sys
import os
from dotenv import load_dotenv

engine_dir = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine"
sys.path.append(engine_dir)
load_dotenv(os.path.join(engine_dir, ".env"))

from backend.database import get_supabase
sb = get_supabase()

# Using raw postgres via PostgREST might be hard to get primary keys directly, but we can try.
# Let's just fetch all rows to see if there's an id column.
res = sb.table("sources_sinks").select("*").execute()
if len(res.data) > 0:
    print("Columns:", res.data[0].keys())
else:
    print("Empty table")
