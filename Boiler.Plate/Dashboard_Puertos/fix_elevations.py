import os
from supabase import create_client
from dotenv import load_dotenv
import requests
import time

load_dotenv(os.path.join('.', '.env'))
supabase = create_client(os.environ.get('SUPABASE_URL'), os.environ.get('SUPABASE_KEY'))

# 1. Obtener los primeros 50 puntos ordenados cronológicamente
res = supabase.table('field_tracking_elevation').select('*').order('created_at', desc=False).limit(50).execute()
records = res.data

print(f"Obtenidos {len(records)} primeros puntos.")

# 2. Consultar Open-Meteo
lats = [f"{p['latitude']:.6f}" for p in records]
lons = [f"{p['longitude']:.6f}" for p in records]

url = f"https://api.open-meteo.com/v1/elevation?latitude={','.join(lats)}&longitude={','.join(lons)}"
try:
    print("Consultando API...")
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    elevations = response.json().get('elevation', [])
    
    # 3. Actualizar forzosamente
    success_count = 0
    for i, r in enumerate(records):
        elev = elevations[i]
        if elev is not None:
            supabase.table("field_tracking_elevation").update({"elevation": elev}).eq("id", r['id']).execute()
            success_count += 1
            print(f"Punto {i+1} actualizado: {elev} MSNM")
        time.sleep(0.1) # Pausa ligera entre updates
            
    print(f"\n¡Éxito! {success_count} puntos actualizados.")
except Exception as e:
    print(f"Error: {e}")
