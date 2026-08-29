import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase
import json

sb = get_supabase()
res = sb.table("commercial_forecasts").select("*").eq("id", "57f506fd-6da4-44c0-92c8-2b9d5644fb6e").execute()
row = res.data[0]
lines = row.get("projection_lines") or []

print(f"Total projection lines in scenario: {len(lines)}")
ilo_marcona_lines = []

for l in lines:
    vessel = str(l.get("vessel_id", "")).upper()
    quote = str(l.get("quote_id", "") or l.get("route_id", "") or l.get("route_name", "")).upper()
    orig = str(l.get("origin_port_id", "")).upper()
    dest = str(l.get("destination_port_id", "")).upper()
    
    is_moquegua = "MOQUEGUA" in vessel
    is_marcona = "MARCONA" in quote or "MARCONA" in dest or "MARCONA" in orig
    
    if is_moquegua and is_marcona:
        ilo_marcona_lines.append(l)

print(f"Matching lines for MOQUEGUA + MARCONA: {len(ilo_marcona_lines)}")
total_viajes = 0
meses_con_viaje = []
meses_sin_viaje = []

for l in sorted(ilo_marcona_lines, key=lambda x: x.get("month_index", "")):
    m = l.get("month_index")
    freq = l.get("monthly_frequency", 0)
    q_id = l.get("quote_id")
    total_viajes += freq
    if freq > 0:
        meses_con_viaje.append((m, freq, q_id))
    else:
        meses_sin_viaje.append((m, freq, q_id))

print("\n--- MESES CON VIAJES (> 0) ---")
for m, freq, q_id in meses_con_viaje:
    print(f"  Mes {m}: {freq} viaje(s) -> Quote: {q_id}")

print("\n--- MESES EN CERO (0) ---")
for m, freq, q_id in meses_sin_viaje:
    print(f"  Mes {m}: {freq} viajes -> Quote: {q_id}")

print(f"\nResumen:")
print(f"  - Total meses CON VIAJE (>0): {len(meses_con_viaje)} meses")
print(f"  - Total meses SIN VIAJE (=0): {len(meses_sin_viaje)} meses")
print(f"  - Total viajes programados en el ano: {total_viajes} viajes")
