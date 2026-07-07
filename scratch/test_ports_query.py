from supabase import create_client

url = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkwODIzNjYsImV4cCI6MjAzNDY1ODM2Nn0.7ZlS4zW1iP8zKz9zLzWp_B7_P1v_V2_v_V4_v_V6_v_V"
# Let's get the actual credentials from backend/database.py to be 100% correct
import sys
sys.path.append(r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase

sb = get_supabase()
res = sb.table("ports").select("*, sources_sinks(capacity_mt, type, empresa, color_hex, producto)").eq("sources_sinks.year", 2026).order("display_order").execute()
print("GET /ports query output for 2026:")
for p in res.data:
    print(p["port_id"], "-> sources_sinks:", p.get("sources_sinks"))
