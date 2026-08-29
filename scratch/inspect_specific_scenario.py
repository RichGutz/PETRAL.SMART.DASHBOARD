import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase
import json

sb = get_supabase()
res = sb.table("commercial_forecasts").select("*").eq("id", "57f506fd-6da4-44c0-92c8-2b9d5644fb6e").execute()
row = res.data[0]
print("ID:", row["id"])
print("NAME:", row["name"])
print("USER_ID:", row["user_id"])
print("START_DATE:", row["start_date"])
print("END_DATE:", row["end_date"])
print("CREATED_AT:", row["created_at"])
print("UPDATED_AT:", row["updated_at"])
lines = row.get("projection_lines") or []
print(f"Total lines: {len(lines)}")
for idx, l in enumerate(lines[:5]):
    print(f"Line {idx} keys:", list(l.keys()))
    print(f"Line {idx} data:", json.dumps(l, indent=2))
