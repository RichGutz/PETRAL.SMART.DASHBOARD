import sys
sys.path.append(r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase

sb = get_supabase()
res = sb.table("ports").select("port_id", "port_name", "lat", "lon").execute()
print("Ports Coordinates:")
for p in res.data:
    print(f"ID: {p['port_id']} | Name: {p['port_name']} | Lat: {p['lat']} | Lon: {p['lon']}")
